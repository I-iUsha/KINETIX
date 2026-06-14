"""Focused tests for Gemini configuration, parsing, and HTTP validation."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from studio import semantics
from studio.server import app


client = TestClient(app)


def test_default_model_uses_flash_latest_alias():
    assert semantics.MODEL == "gemini-flash-latest"


def test_key_prefers_google_and_strips_whitespace(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "gemini-key")
    monkeypatch.setenv("GOOGLE_API_KEY", "  google-key  ")
    assert semantics._key() == "google-key"


def test_parse_json_rejects_non_json():
    with pytest.raises(RuntimeError, match="invalid JSON"):
        semantics._parse_json("I cannot analyze this image")


def test_validate_semantics_normalizes_bad_optional_fields():
    result = semantics._validate_semantics({
        "class": "chair",
        "up": ["bad"],
        "front": [1, 0, 0],
        "materials": [None, {"region": "seat", "material": "wood"}],
        "affordances": ["sit", None],
        "confidence": 4,
    })
    assert result["up"] == [0.0, 0.0, 1.0]
    assert result["materials"] == [{"region": "seat", "material": "wood"}]
    assert result["affordances"] == ["sit"]
    assert result["confidence"] == 1.0


def test_validate_semantics_handles_null_lists():
    result = semantics._validate_semantics({"materials": None, "affordances": None})
    assert result["materials"] == []
    assert result["affordances"] == []


def test_semantics_endpoint_rejects_missing_images(monkeypatch):
    monkeypatch.setattr(semantics, "gemini_status", lambda: {
        "available": True, "sdk": True, "key": True,
    })
    response = client.post("/semantics", data={"asset_id": "asset"})
    assert response.status_code == 422
    assert response.json()["detail"] == "no render images provided"


def test_semantics_endpoint_rejects_non_png(monkeypatch):
    monkeypatch.setattr(semantics, "gemini_status", lambda: {
        "available": True, "sdk": True, "key": True,
    })
    response = client.post(
        "/semantics",
        files={"images": ("render.jpg", b"not-a-png", "image/jpeg")},
    )
    assert response.status_code == 415
    assert "PNG" in response.json()["detail"]
