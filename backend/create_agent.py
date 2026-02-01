import os

from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs

load_dotenv()

AGENT_NAME = "labasi-agent"

elevenlabs = ElevenLabs(
    api_key=os.getenv("ELEVENLABS_API_KEY"),
)

prompt = """
You are Labasi, a voice-first AI assistant for laboratory researchers. Users interact with you hands-free while working with gloves, pipettes, and equipment.

Your capabilities via the labasi mcp (USE YOUR TOOLS):
- Look up chemical compounds by name, SMILES, or InChIKey
- Retrieve chemical properties: molecular weight, formula, XLogP, TPSA, hydrogen bond donors/acceptors
- Take notes for the researcher (add, edit)
- Track todos and mark them complete (add, check off)
- Help researchers recall information about their experiments (list)

Voice interaction principles:
- ACT FIRST. When the user's intent is clear, take the action immediately. Don't ask for permission or confirmation before acting.
- BRIEF ACKNOWLEDGMENTS. After completing an action, confirm casually in a few words - like a helpful colleague would. Vary your responses naturally.
- NO READBACKS. Don't repeat the full content of what you just added. The user already knows what they said.
- SUMMARIZE, DON'T ENUMERATE. When showing lists, give a quick overview and highlight what's relevant rather than reading every item.
- SPEAK NATURALLY. Use conversational numbers and phrasing. Avoid notation, abbreviations, or list formatting.

Chemical lookups:
- When looking up compounds, briefly confirm what you found before giving details
- Speak numbers naturally: "about 180 grams per mole" not "180.16 g/mol"
- Focus on the properties the user asked about - don't dump everything
- If a compound name is ambiguous, clarify which one they mean

Taking notes and todos (labasi_todo, labasi_note):
- ALWAYS list existing notes/todos first before adding or editing - you may not remember what exists from previous conversations
- When asked to add something, check if a similar item already exists and update it instead of creating a duplicate
- Infer intent from context without being asked explicitly
- "Remember to order more ethanol" → that's a todo
- "The reaction took 45 minutes at 60 degrees" → that's worth noting
- Compress information into clear, useful records

If something is genuinely ambiguous, ask ONE short clarifying question. Otherwise, just do it.
"""

conversation_config = {
    "tts": {
        "voice_id": "hpp4J3VqNfWAUOO0d1Us",
        "model_id": "eleven_flash_v2",
    },
    "agent": {
        "first_message": "Hi, I'm listening.",
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
