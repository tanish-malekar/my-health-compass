"""
get_transcript.py
-----------------
Fetches the transcript of the most recent completed call (or a specific
conversation) and saves it as a JSON file in the transcripts/ folder.

Usage:
    python get_transcript.py                         # latest call
    python get_transcript.py --id conv_xxxxx         # specific conversation
    python get_transcript.py --list                  # list recent calls
"""

import os
import sys
import json
import argparse
import requests
from datetime import datetime, timezone
from dotenv import load_dotenv
from database import save_call_to_db

load_dotenv()

BASE_URL   = "https://api.elevenlabs.io/v1"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "transcripts")

def headers():
    return {"xi-api-key": os.environ["ELEVENLABS_API_KEY"]}


def list_conversations(agent_id: str, page_size: int = 10) -> list:
    r = requests.get(
        f"{BASE_URL}/convai/conversations",
        headers=headers(),
        params={"agent_id": agent_id, "page_size": page_size},
    )
    r.raise_for_status()
    return r.json().get("conversations", [])


def get_conversation_detail(conversation_id: str) -> dict:
    r = requests.get(
        f"{BASE_URL}/convai/conversations/{conversation_id}",
        headers=headers(),
    )
    r.raise_for_status()
    return r.json()


def save_transcript(data: dict, conversation_id: str) -> str:
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    filename = f"transcript_{conversation_id}_{ts}.json"
    filepath = os.path.join(OUTPUT_DIR, filename)
    with open(filepath, "w") as f:
        json.dump(data, f, indent=2)
    return filepath


def print_conversations(conversations: list) -> None:
    print(f"\n{'#':<3} {'Conversation ID':<40} {'Date':<22} {'Duration':<10} {'Messages':<10} {'Status'}")
    print("-" * 105)
    for i, c in enumerate(conversations):
        dt = datetime.fromtimestamp(c["start_time_unix_secs"], tz=timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
        dur = f"{c['call_duration_secs']}s"
        print(f"{i+1:<3} {c['conversation_id']:<40} {dt:<22} {dur:<10} {c['message_count']:<10} {c['status']}")
    print()


def fetch_and_print_transcript(conv_id: str):
    # Fetch full detail + transcript
    print(f"📥 Fetching transcript for {conv_id}...")
    detail = get_conversation_detail(conv_id)

    filepath = save_transcript(detail, conv_id)

    # Pretty-print summary to terminal
    transcript = detail.get("transcript", [])
    print(f"\n{'─'*60}")
    print(f"  Agent    : {detail.get('agent_name', 'N/A')}")
    print(f"  Call ID  : {conv_id}")
    duration = detail.get("metadata", {}).get("call_duration_secs") or detail.get("call_duration_secs", "?")
    print(f"  Duration : {duration}s")
    print(f"  Messages : {len(transcript)}")
    print(f"{'─'*60}")
    for msg in transcript:
        role  = msg.get("role", "?").upper()
        text  = msg.get("message", "")
        label = "🤖 Agent" if role == "AGENT" else "🎙  User "
        print(f"\n{label}: {text}")
    print(f"\n{'─'*60}")
    print(f"\n✅ Full transcript saved to:\n   {filepath}\n")
    
    # Save to MongoDB
    save_call_to_db(detail)
    
    return filepath


def main():
    parser = argparse.ArgumentParser(description="Fetch ElevenLabs call transcript.")
    parser.add_argument("--id",   default=None, help="Specific conversation ID to fetch")
    parser.add_argument("--list", action="store_true", help="List recent conversations and exit")
    args = parser.parse_args()

    agent_id = os.environ.get("ELEVENLABS_AGENT_ID")
    if not agent_id:
        print("❌ ELEVENLABS_AGENT_ID not set in .env"); sys.exit(1)

    conversations = list_conversations(agent_id, page_size=10)

    if args.list:
        print_conversations(conversations)
        return

    # Pick conversation to fetch
    if args.id:
        conv_id = args.id
    else:
        # Auto-select the most recent *completed* call
        completed = [c for c in conversations if c["status"] == "done" and c["message_count"] > 0]
        if not completed:
            print("❌ No completed conversations found yet. The call may still be in progress.")
            sys.exit(1)
        conv_id = completed[0]["conversation_id"]
        print(f"ℹ️  Using most recent completed conversation: {conv_id}")

    fetch_and_print_transcript(conv_id)


if __name__ == "__main__":
    main()
