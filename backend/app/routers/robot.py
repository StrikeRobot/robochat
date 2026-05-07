import asyncio
import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from ..events import bus

router = APIRouter()


@router.get("/status")
async def robot_status():
    """SSE stream that broadcasts robot commands from any active conversation."""
    queue = bus.subscribe("robot")

    async def generate():
        try:
            while True:
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=30)
                    yield f"data: {json.dumps(event)}\n\n"
                except asyncio.TimeoutError:
                    yield 'data: {"type":"ping"}\n\n'
        except asyncio.CancelledError:
            pass
        finally:
            bus.unsubscribe("robot", queue)

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
