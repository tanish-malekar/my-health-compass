"""
create_agent.py
--------------
One-time setup script: creates an ElevenLabs Conversational AI agent
using the questions and prompts defined in agent_config.py.

Run this ONCE, copy the printed agent_id into your .env file, then use
make_call.py to trigger calls.

Usage:
    python create_agent.py
"""

import os
import json
import requests
from dotenv import load_dotenv
from agent_config import AGENT_NAME, FIRST_MESSAGE, build_system_prompt

load_dotenv()

ELEVENLABS_API_KEY = os.environ["ELEVENLABS_API_KEY"]
BASE_URL = "https://api.elevenlabs.io/v1"

HEADERS = {
    "xi-api-key": ELEVENLABS_API_KEY,
    "Content-Type": "application/json",
}


def create_agent() -> str:
    """Creates a new ElevenLabs conversational agent and returns its agent_id."""

    payload = {
        "name": AGENT_NAME,
        "conversation_config": {
            "agent": {
                "prompt": {
                    "prompt": build_system_prompt(),
                    "llm": "gemini-2.0-flash",          # or "gpt-4o-mini" / "claude-3-5-haiku"
                    "temperature": 0.5,
                },
                "first_message": FIRST_MESSAGE,
                "language": "en",
            },
            "tts": {
                "voice_id": "EXAVITQu4vr4xnSDxMaL",    # "Sarah" — warm, friendly voice
                # Browse voices at: https://elevenlabs.io/voice-library
            },
        },
    }

    print(f"Creating agent '{AGENT_NAME}'...")
    response = requests.post(
        f"{BASE_URL}/convai/agents/create",
        headers=HEADERS,
        json=payload,
    )

    if response.status_code not in (200, 201):
        print(f"❌ Error {response.status_code}: {response.text}")
        response.raise_for_status()

    data = response.json()
    agent_id = data["agent_id"]

    print(f"\n✅ Agent created successfully!")
    print(f"   Name     : {AGENT_NAME}")
    print(f"   Agent ID : {agent_id}")
    print(f"\n👉 Add this to your .env file:")
    print(f"   ELEVENLABS_AGENT_ID={agent_id}\n")

    return agent_id


def update_agent(agent_id: str) -> None:
    """Updates an existing agent with the latest config from agent_config.py."""

    payload = {
        "name": AGENT_NAME,
        "conversation_config": {
            "agent": {
                "prompt": {
                    "prompt": build_system_prompt(),
                    "llm": "gemini-2.0-flash",
                    "temperature": 0.5,
                },
                "first_message": FIRST_MESSAGE,
                "language": "en",
            },
            "tts": {
                "voice_id": "EXAVITQu4vr4xnSDxMaL",
            },
        },
    }

    print(f"Updating agent '{agent_id}'...")
    response = requests.patch(
        f"{BASE_URL}/convai/agents/{agent_id}",
        headers=HEADERS,
        json=payload,
    )

    if response.status_code not in (200, 201):
        print(f"❌ Error {response.status_code}: {response.text}")
        response.raise_for_status()

    print(f"✅ Agent '{agent_id}' updated with latest config.\n")


if __name__ == "__main__":
    existing_agent_id = os.environ.get("ELEVENLABS_AGENT_ID")

    if existing_agent_id:
        print(f"Found existing ELEVENLABS_AGENT_ID in .env: {existing_agent_id}")
        choice = input("Do you want to (u)pdate the existing agent or (c)reate a new one? [u/c]: ").strip().lower()
        if choice == "c":
            create_agent()
        else:
            update_agent(existing_agent_id)
    else:
        create_agent()
