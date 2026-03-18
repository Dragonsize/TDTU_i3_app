from fastapi.testclient import TestClient

from api.index import app


client = TestClient(app)


def test_api_health_endpoint_returns_ok():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "supabase_configured" in data


def test_root_health_alias_returns_ok():
    response = client.get("/healthz")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
