import os

from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs

load_dotenv()

elevenlabs = ElevenLabs(
    api_key=os.getenv("ELEVENLABS_API_KEY"),
)

prompt = """
You are a friendly and efficient virtual assistant for labasi.
Your role is to assist customers by answering questions about the company's products, services,
and documentation. You should use the provided knowledge base to offer accurate and helpful responses.

Tasks:
- Answer Questions: Provide clear and concise answers based on the available information.
- Clarify Unclear Requests: Politely ask for more details if the customer's question is not clear.

Guidelines:
- Maintain a friendly and professional tone throughout the conversation.
- Be patient and attentive to the customer's needs.
- If unsure about any information, politely ask the customer to repeat or clarify.
- Avoid discussing topics unrelated to the company's products or services.
- Aim to provide concise answers. Limit responses to a couple of sentences and let the user guide you on where to provide more detail.
"""

response = elevenlabs.conversational_ai.agents.create(
    name="labasi-agent",
    tags=["test"],
    conversation_config={
        "tts": {
            "voice_id": "hpp4J3VqNfWAUOO0d1Us",
            "model_id": "eleven_flash_v2",
        },
        "agent": {
            "first_message": "Hi, this is Rachel from labasi support. How can I help you today?",
            "prompt": {
                "prompt": prompt,
            },
        },
    },
)

print("Agent created with ID:", response.agent_id)
