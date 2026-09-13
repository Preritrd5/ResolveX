"""
ResolveX ChromaDB Vector Store Integration
Provides organization-scoped persistent vector indexing for corporate knowledge chunks.
Cleanly handles fallback if ChromaDB is unavailable or encounters errors.
"""

import os
from typing import List, Dict, Any, Optional
from apps.api.app.core.config import settings
from apps.api.app.core.logging import logger

class ChromaService:
    def __init__(self):
        self._client = None
        self._initialized = False
        self._init_chroma()

    def _init_chroma(self):
        try:
            import chromadb
            persist_dir = settings.CHROMA_PERSIST_DIR
            os.makedirs(persist_dir, exist_ok=True)
            self._client = chromadb.PersistentClient(path=persist_dir)
            self._initialized = True
            logger.info(f"Initialized ChromaDB persistent client at: {persist_dir}")
        except Exception as e:
            logger.warning(f"ChromaDB persistent client initialization failed ({str(e)}). Safe SQL fallback active.")
            self._client = None
            self._initialized = False

    @property
    def is_ready(self) -> bool:
        return self._initialized and self._client is not None

    def get_collection_name(self, org_id: str) -> str:
        safe_org = org_id.replace("-", "_")
        return f"org_{safe_org}_knowledge"

    def index_chunks(self, org_id: str, chunks: List[Dict[str, Any]]) -> bool:
        if not self.is_ready:
            return False

        try:
            col_name = self.get_collection_name(org_id)
            collection = self._client.get_or_create_collection(name=col_name)

            ids = [str(c["id"]) for c in chunks]
            documents = [c["content"] for c in chunks]
            metadatas = [
                {
                    "title": str(c.get("title", "")),
                    "section": str(c.get("section", "")),
                    "source_id": str(c.get("source_id", "")),
                    "category": str(c.get("metadata", {}).get("category", "")),
                    "org_id": org_id
                }
                for c in chunks
            ]

            # Upsert into ChromaDB
            collection.upsert(ids=ids, documents=documents, metadatas=metadatas)
            return True
        except Exception as e:
            logger.warning(f"ChromaDB chunk indexing error: {str(e)}")
            return False

    def query(self, org_id: str, query_text: str, n_results: int = 3) -> List[Dict[str, Any]]:
        if not self.is_ready:
            return []

        try:
            col_name = self.get_collection_name(org_id)
            collection = self._client.get_collection(name=col_name)
            results = collection.query(query_texts=[query_text], n_results=n_results)

            items = []
            if results and results.get("ids") and len(results["ids"]) > 0:
                ids = results["ids"][0]
                docs = results.get("documents", [[]])[0]
                metas = results.get("metadatas", [[]])[0]
                distances = results.get("distances", [[]])[0] if results.get("distances") else [0.2] * len(ids)

                for idx, chunk_id in enumerate(ids):
                    meta = metas[idx] if idx < len(metas) else {}
                    doc = docs[idx] if idx < len(docs) else ""
                    dist = distances[idx] if idx < len(distances) else 0.5
                    relevance = max(0.1, min(1.0, 1.0 / (1.0 + max(0.0, float(dist)))))

                    items.append({
                        "id": chunk_id,
                        "content": doc,
                        "title": meta.get("title", "Acme Policy"),
                        "section": meta.get("section", "General"),
                        "source_id": meta.get("source_id", ""),
                        "category": meta.get("category", "policy"),
                        "relevance_score": round(relevance, 2)
                    })
            return items
        except Exception as e:
            logger.warning(f"ChromaDB query failed: {str(e)}. Triggering DB text fallback.")
            return []

chroma_service = ChromaService()
