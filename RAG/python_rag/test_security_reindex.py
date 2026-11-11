import os
import unittest
from fastapi.testclient import TestClient
from RAG.python_rag.main import app
from RAG.python_rag.config import settings

class TestRAGSecurityAndReindex(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls._client_cm = TestClient(app)
        cls.client = cls._client_cm.__enter__()

    @classmethod
    def tearDownClass(cls):
        cls._client_cm.__exit__(None, None, None)

    def test_reindex_rejected_without_auth(self):
        """Must return HTTP 401 Unauthorized when no admin credentials are provided."""
        res = self.client.post("/api/rag/reindex")
        self.assertEqual(res.status_code, 401)
        self.assertIn("Unauthorized", res.json()["detail"])

    def test_reindex_rejected_with_invalid_secret(self):
        """Must return HTTP 401 Unauthorized when an incorrect admin key is provided."""
        res = self.client.post(
            "/api/rag/reindex",
            headers={"X-Admin-Key": "completely-invalid-attacker-secret-xyz"}
        )
        self.assertEqual(res.status_code, 401)
        self.assertIn("Unauthorized", res.json()["detail"])

    def test_reindex_rejected_with_invalid_bearer(self):
        """Must return HTTP 401 Unauthorized when an invalid Bearer token is provided."""
        res = self.client.post(
            "/api/rag/reindex",
            headers={"Authorization": "Bearer fake-token-12345"}
        )
        self.assertEqual(res.status_code, 401)
        self.assertIn("Unauthorized", res.json()["detail"])

    def test_query_validation_rejects_empty_query(self):
        """Must return HTTP 400 Bad Request when query is empty or whitespace."""
        res = self.client.post(
            "/api/rag/query",
            json={"query": "   ", "top_k": 5}
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("empty", res.json()["detail"].lower())

    def test_health_probe_reports_healthy(self):
        """GET /health must return HTTP 200 with model and vector store status."""
        res = self.client.get("/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "healthy")
        self.assertEqual(data["vectorBackend"], "qdrant")
        self.assertGreaterEqual(data["vectorStoreCount"], 0)

    def test_ready_probe_verifies_model_and_storage(self):
        """GET /ready must return HTTP 200 and report true dependency readiness."""
        res = self.client.get("/ready")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["ready"])
        self.assertEqual(data["vectorDatabase"]["backend"], "qdrant")
        self.assertEqual(data["embeddingModel"]["dimension"], 384)
        self.assertGreater(data["indexedDocuments"], 0)

    def test_authorized_reindex_succeeds(self):
        """Must return HTTP 200 and return indexing metadata when valid admin secret is provided."""
        res = self.client.post(
            "/api/rag/reindex",
            headers={"X-Admin-Key": settings.RAG_ADMIN_SECRET}
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["vectorBackend"], "qdrant")
        self.assertGreater(data["indexedDocuments"], 0)

if __name__ == "__main__":
    unittest.main()
