import os

from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs

load_dotenv()

AGENT_NAME = "labasi-agent"

elevenlabs = ElevenLabs(
    api_key=os.getenv("ELEVENLABS_API_KEY"),
)

prompt = """
You are Labasi, a voice-first AI assistant for laboratory researchers. Users interact with you hands-free while working with gloves, pipettes, and equipment - voice is their primary way to communicate.

Your capabilities:
- Look up chemical compounds by name, SMILES, or InChIKey
- Retrieve chemical properties: molecular weight, formula, XLogP, TPSA, hydrogen bond donors/acceptors, and more
- Help researchers recall information about their experiments and suggest next steps

Guidelines:
- Keep responses SHORT and spoken-word friendly - users are listening, not reading
- Use simple numbers and avoid complex notation when speaking (say "molecular weight is 180 grams per mole" not "MW: 180.16 g/mol")
- When looking up chemicals, confirm what you found before diving into details
- If a request is unclear, ask a brief clarifying question
- Stay focused on lab-related queries - chemistry, experiments, protocols, and safety
- Be direct and efficient - researchers are busy

Example interactions:
- "What's the molecular weight of caffeine?" → Look it up and give a clear spoken answer
- "Tell me about aspirin's properties" → Search for aspirin, then fetch and summarize key properties
- "Is ethanol polar?" → Provide a concise, helpful answer
"""

conversation_config = {
    "tts": {
        "voice_id": "hpp4J3VqNfWAUOO0d1Us",
        "model_id": "eleven_flash_v2",
    },
    "agent": {
        "first_message": "Hey, Labasi here. What can I look up for you?",
        "prompt": {
            "prompt": prompt,
        },
    },
}


def find_existing_agent(name: str) -> str | None:
    """Search for an existing agent by name and return its ID if found."""
    response = elevenlabs.conversational_ai.agents.list(search=name)
    for agent in response.agents:
        if agent.name == name:
            return agent.agent_id
    return None


def create_or_update_agent() -> str:
    """Create a new agent or update an existing one with the same name."""
    existing_agent_id = find_existing_agent(AGENT_NAME)

    if existing_agent_id:
        elevenlabs.conversational_ai.agents.update(
            agent_id=existing_agent_id,
            name=AGENT_NAME,
            tags=["test"],
            conversation_config=conversation_config,
        )
        print(f"Agent updated with ID: {existing_agent_id}")
        return existing_agent_id
    else:
        response = elevenlabs.conversational_ai.agents.create(
            name=AGENT_NAME,
            tags=["test"],
            conversation_config=conversation_config,
        )
        print(f"Agent created with ID: {response.agent_id}")
        return response.agent_id


if __name__ == "__main__":
    create_or_update_agent()
