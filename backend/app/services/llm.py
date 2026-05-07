from typing import AsyncIterator
from openai import AsyncOpenAI

from .persona import SYSTEM_PROMPT
from ..config import settings

_client: AsyncOpenAI | None = None


def get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(
            api_key=settings.venice_api_key,
            base_url=settings.venice_base_url,
        )
    return _client


async def stream_completion(messages: list[dict]) -> AsyncIterator[str]:
    full_messages = [{"role": "system", "content": SYSTEM_PROMPT}, *messages[-20:]]

    stream = await get_client().chat.completions.create(
        model=settings.venice_model,
        messages=full_messages,
        stream=True,
        max_tokens=1024,
        temperature=0.8,
    )

    async for chunk in stream:
        if not chunk.choices:
            continue
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta
