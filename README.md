# SecondSense — ElevenLabs Calling Agent

A Python project that calls your cell phone and asks you a personalized set of questions using an ElevenLabs AI voice agent and Twilio.

---

## Prerequisites

| Service | What you need | Where to get it |
|---|---|---|
| **ElevenLabs** | API Key + Agent ID | [elevenlabs.io](https://elevenlabs.io) |
| **Twilio** | Account SID, Auth Token, Phone Number | [twilio.com](https://twilio.com) |

> **Twilio trial note:** Free trial accounts can only call *verified* numbers.  
> Verify your cell at: [Twilio Console → Verified Caller IDs](https://console.twilio.com/us1/develop/phone-numbers/manage/verified)

---

## Setup

### 1. Install dependencies

```bash
cd /Users/brave/Desktop/SecondSense
pip install -r requirements.txt
```

### 2. Configure credentials

```bash
cp .env.example .env
```

Open `.env` and fill in all six values:

```
ELEVENLABS_API_KEY=...
ELEVENLABS_AGENT_ID=...       # leave blank for now
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...     # your Twilio number
MY_PHONE_NUMBER=+1...         # your cell (must be Twilio-verified)
```

### 3. Customize your questions

Edit `agent_config.py` — update the `QUESTIONS` list to ask whatever you want:

```python
QUESTIONS = [
    "How are you feeling today, on a scale from one to ten?",
    "What is your top priority for today?",
    ...
]
```

You can also change `FIRST_MESSAGE` (the agent's opening line) and `AGENT_NAME`.

### 4. Create the ElevenLabs agent (first time only)

```bash
python create_agent.py
```

This will print your `agent_id`. Copy it into `.env`:

```
ELEVENLABS_AGENT_ID=xxxxxxxxxxxxxxxxxxxxxxxx
```

> **Already have an agent?** Just set `ELEVENLABS_AGENT_ID` in `.env` and
> run `python create_agent.py` again — it will offer to update it with your
> latest `agent_config.py` settings.

---

## Making a Call

```bash
python make_call.py
```

Your cell phone will ring within a few seconds. Answer and speak naturally — the agent will work through your questions one by one.

To call a different number without changing `.env`:

```bash
python make_call.py --to +12025551234
```

---

## Viewing Transcripts

After each call, view the full conversation transcript at:  
👉 [ElevenLabs → Conversational AI → History](https://elevenlabs.io/app/conversational-ai/history)

---

## Project Structure

```
SecondSense/
├── .env                # Your credentials (never commit this!)
├── .env.example        # Credential template
├── requirements.txt    # Python dependencies
├── agent_config.py     # ✏️  Edit your questions here
├── create_agent.py     # One-time agent setup / update
├── make_call.py        # Trigger a call
└── README.md
```

---

## Changing Voices

In `create_agent.py`, the `voice_id` field selects the ElevenLabs voice.  
Browse all available voices at: [elevenlabs.io/voice-library](https://elevenlabs.io/voice-library)  
Copy the voice ID from the voice detail page and paste it into `create_agent.py`.

## Changing the AI Model

In `create_agent.py`, the `llm` field controls which LLM powers the agent.  
Options include: `gemini-2.0-flash`, `gpt-4o-mini`, `claude-3-5-haiku`.
