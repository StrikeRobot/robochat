import pytest
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import SQLModel, create_engine, Session

from app.main import app
from app.db import get_session


@pytest.fixture(name="client")
def client_fixture():
    # StaticPool makes all connections share the same in-memory DB — required for SQLite :memory:.
    test_engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(test_engine)

    def override():
        with Session(test_engine) as session:
            yield session

    app.dependency_overrides[get_session] = override
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_list_conversations_empty(client):
    resp = client.get("/conversations/")
    assert resp.status_code == 200
    assert resp.json() == []


def test_delete_nonexistent_404(client):
    resp = client.delete("/conversations/999")
    assert resp.status_code == 404


def test_get_messages_nonexistent_404(client):
    resp = client.get("/conversations/999/messages")
    assert resp.status_code == 404


def test_rename_nonexistent_404(client):
    resp = client.patch("/conversations/999", json={"title": "New Title"})
    assert resp.status_code == 404


def test_health_endpoint(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}
