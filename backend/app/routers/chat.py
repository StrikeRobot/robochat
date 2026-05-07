import json
from datetime import datetime
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select

from ..db import get_session, engine
from ..models import Conversation, Message
from ..schemas import ChatRequest
from ..services.llm import stream_completion
from ..services.commands import process_buffer
from ..events import bus

router = APIRouter()


def _sse(type_: str, data: dict) -> str:
    return f"data: {json.dumps({'type': type_, **data})}\n\n"


@router.post("/stream")
async def chat_stream(request: ChatRequest, session: Session = Depends(get_session)):
    # Create or fetch conversation (runs synchronously before stream starts)
    if request.conversation_id:
        conv = session.get(Conversation, request.conversation_id)
        if not conv:
            conv = Conversation()
            session.add(conv)
            session.commit()
            session.refresh(conv)
    else:
        title = request.content[:50] + ("…" if len(request.content) > 50 else "")
        conv = Conversation(title=title)
        session.add(conv)
        session.commit()
        session.refresh(conv)

    user_msg = Message(conversation_id=conv.id, role="user", content=request.content)
    session.add(user_msg)
    conv.updated_at = datetime.utcnow()
    session.commit()

    history = session.exec(
        select(Message)
        .where(Message.conversation_id == conv.id)
        .order_by(Message.created_at)
    ).all()

    messages = [{"role": m.role, "content": m.content} for m in history]
    conv_id, conv_title = conv.id, conv.title

    async def generate():
        full_clean = ""
        buf = ""
        try:
            yield _sse("meta", {"conversation_id": conv_id, "title": conv_title})

            async for chunk in stream_completion(messages):
                buf += chunk
                buf, emitted, cmds = process_buffer(buf, partial=True)
                if emitted:
                    full_clean += emitted
                    if emitted.strip():
                        yield _sse("token", {"content": emitted})
                for cmd in cmds:
                    await bus.publish("robot", {"command": cmd.name, "label": cmd.label})
                    yield _sse("command", {"command": cmd.name, "label": cmd.label})

            # Final flush
            _, emitted, cmds = process_buffer(buf, partial=False)
            if emitted:
                full_clean += emitted
                if emitted.strip():
                    yield _sse("token", {"content": emitted})
            for cmd in cmds:
                await bus.publish("robot", {"command": cmd.name, "label": cmd.label})
                yield _sse("command", {"command": cmd.name, "label": cmd.label})

            # Persist assistant message with a fresh session
            with Session(engine) as s:
                asst = Message(
                    conversation_id=conv_id, role="assistant", content=full_clean
                )
                s.add(asst)
                conv_record = s.get(Conversation, conv_id)
                if conv_record:
                    conv_record.updated_at = datetime.utcnow()
                s.commit()
                s.refresh(asst)
                yield _sse("done", {"message_id": asst.id})

        except Exception as exc:
            yield _sse("error", {"message": str(exc)})

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
