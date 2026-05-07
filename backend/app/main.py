from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .db import create_tables
from .routers import chat, conversations, robot


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()
    yield


app = FastAPI(title="RoboChat API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/chat", tags=["chat"])
app.include_router(conversations.router, prefix="/conversations", tags=["conversations"])
app.include_router(robot.router, prefix="/robot", tags=["robot"])


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
