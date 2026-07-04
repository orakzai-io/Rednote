# CLASS — wraps Groq client, prompt builder, streaming
from typing import AsyncGenerator, Any
from groq import AsyncGroq
from core.config import settings

from services.prompts import SYSTEM_PROMPT

class GroqService:
    def __init__(self) -> None:
        # Initialize the asynchronous Groq client
        self.client = AsyncGroq(api_key=settings.GROQ_API_KEY)

    async def stream_chat(
        self, 
        messages: list[dict[str, str]], 
        context_chunks: list[dict[str, Any]]
    ) -> AsyncGenerator[str, None]:
        """
        Streams responses from Groq llama3-70b-8192 with strict system prompts.
        Raises GroqError on quota/rate limit errors for upstream handling.
        """
        # Join retrieved contexts with document names and chunk indices
        context_text = "\n\n".join(
            [f"[Document: {chunk['filename']}] (Chunk {chunk['chunk_index']}): {chunk['content']}" for chunk in context_chunks]
        )
        
        # Inject context into system prompt
        system_message: dict[str, str] = {
            "role": "system",
            "content": SYSTEM_PROMPT.format(context=context_text or "No document context available.")
        }
        
        # Assemble message payload (System instruction + Client conversation history)
        # History is pre-cleansed/truncated by frontend as per specs, but we ensure structure is safe
        payload: list[dict[str, str]] = [system_message]
        
        for msg in messages:
            # Map roles cleanly (system, user, assistant)
            payload.append({
                "role": msg.get("role", "user"),
                "content": msg.get("content", "")
            })

        # Request chunked completion stream
        response_stream: Any = await self.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=payload,  # type: ignore
            temperature=0.0,   # Set to 0 for strict factual compliance
            stream=True
        )

        async for chunk in response_stream:  # type: ignore
            delta = chunk.choices[0].delta.content  # type: ignore
            if delta:
                yield delta