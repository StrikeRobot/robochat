from unittest.mock import AsyncMock, MagicMock, patch
import pytest


class _FakeStream:
    def __init__(self, chunks):
        self._it = iter(chunks)

    def __aiter__(self):
        return self

    async def __anext__(self):
        try:
            return next(self._it)
        except StopIteration:
            raise StopAsyncIteration


def _make_chunk(content):
    chunk = MagicMock()
    chunk.choices = [MagicMock()]
    chunk.choices[0].delta.content = content
    return chunk


async def test_stream_yields_content():
    stream = _FakeStream([_make_chunk("Hello"), _make_chunk(", world")])

    with patch("app.services.llm.get_client") as mock_get:
        import app.services.llm as llm_mod
        llm_mod._client = None

        mock_client = MagicMock()
        mock_client.chat.completions.create = AsyncMock(return_value=stream)
        mock_get.return_value = mock_client

        from app.services.llm import stream_completion

        chunks = [c async for c in stream_completion([{"role": "user", "content": "hi"}])]

    assert chunks == ["Hello", ", world"]


async def test_stream_skips_none_delta():
    stream = _FakeStream([_make_chunk(None), _make_chunk("Hi")])

    with patch("app.services.llm.get_client") as mock_get:
        import app.services.llm as llm_mod
        llm_mod._client = None

        mock_client = MagicMock()
        mock_client.chat.completions.create = AsyncMock(return_value=stream)
        mock_get.return_value = mock_client

        from app.services.llm import stream_completion

        chunks = [c async for c in stream_completion([{"role": "user", "content": "hi"}])]

    assert chunks == ["Hi"]
