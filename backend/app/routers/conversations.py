from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from ..db import get_session
from ..models import Conversation, Message
from ..schemas import ConversationRead, MessageRead, ConversationRename

router = APIRouter()


@router.get("/", response_model=list[ConversationRead])
def list_conversations(session: Session = Depends(get_session)):
    return session.exec(
        select(Conversation).order_by(Conversation.updated_at.desc())
    ).all()


@router.get("/{conv_id}/messages", response_model=list[MessageRead])
def get_messages(conv_id: int, session: Session = Depends(get_session)):
    if not session.get(Conversation, conv_id):
        raise HTTPException(status_code=404, detail="Conversation not found")
    return session.exec(
        select(Message)
        .where(Message.conversation_id == conv_id)
        .order_by(Message.created_at)
    ).all()


@router.patch("/{conv_id}", response_model=ConversationRead)
def rename_conversation(
    conv_id: int,
    body: ConversationRename,
    session: Session = Depends(get_session),
):
    conv = session.get(Conversation, conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    conv.title = body.title
    conv.updated_at = datetime.utcnow()
    session.add(conv)
    session.commit()
    session.refresh(conv)
    return conv


@router.delete("/{conv_id}", status_code=204)
def delete_conversation(conv_id: int, session: Session = Depends(get_session)):
    conv = session.get(Conversation, conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    for msg in session.exec(
        select(Message).where(Message.conversation_id == conv_id)
    ).all():
        session.delete(msg)
    session.delete(conv)
    session.commit()
