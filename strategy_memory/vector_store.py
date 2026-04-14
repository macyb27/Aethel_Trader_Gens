"""
Vector Store für generierte Strategien (Metriken, Fitness, Explainability).

Priorität: **Chroma** (persistiert) → **FAISS** (In-Memory + optional persist via numpy) →
**JSONL**-Fallback ohne externe Abhängigkeit.
"""

from __future__ import annotations

import json
import logging
import uuid
from dataclasses import dataclass, field, replace
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal

logger = logging.getLogger(__name__)

BackendName = Literal["chroma", "faiss", "jsonl"]


@dataclass(slots=True)
class StrategyRecord:
    """Eine gespeicherte Strategie mit Quantum-Metriken und Erklärbarkeit."""

    id: str
    chromosome_genes: list[float]
    fitness_total: float
    explainability: dict[str, Any]
    quantum_metrics: dict[str, Any]
    paper_metrics: dict[str, Any]
    safety_approved: bool
    safety_reasons: list[str]
    live_candidate: bool
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    embedding: list[float] | None = None

    def to_dict(self) -> dict[str, Any]:
        d = {
            "id": self.id,
            "chromosome_genes": self.chromosome_genes,
            "fitness_total": self.fitness_total,
            "explainability": self.explainability,
            "quantum_metrics": self.quantum_metrics,
            "paper_metrics": self.paper_metrics,
            "safety_approved": self.safety_approved,
            "safety_reasons": self.safety_reasons,
            "live_candidate": self.live_candidate,
            "created_at": self.created_at,
        }
        if self.embedding is not None:
            d["embedding"] = self.embedding
        return d

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> StrategyRecord:
        return cls(
            id=str(data["id"]),
            chromosome_genes=list(data["chromosome_genes"]),
            fitness_total=float(data["fitness_total"]),
            explainability=dict(data.get("explainability", {})),
            quantum_metrics=dict(data.get("quantum_metrics", {})),
            paper_metrics=dict(data.get("paper_metrics", {})),
            safety_approved=bool(data.get("safety_approved", False)),
            safety_reasons=list(data.get("safety_reasons", [])),
            live_candidate=bool(data.get("live_candidate", False)),
            created_at=str(data.get("created_at", "")),
            embedding=list(data["embedding"]) if data.get("embedding") is not None else None,
        )


def _embedding_from_record(rec: StrategyRecord, dim: int = 32) -> list[float]:
    """Deterministischer einfacher Embedding-Vektor aus Genen + Skalaren (ohne externes Modell)."""
    import hashlib

    genes = rec.chromosome_genes[:dim]
    pad = [0.0] * (dim - len(genes))
    vec = genes + pad
    h = hashlib.sha256(rec.id.encode()).digest()
    for i in range(min(len(h), dim)):
        vec[i % dim] += (h[i] / 255.0) * 0.01
    # Metriken mischen
    vec[0] += rec.fitness_total * 0.01
    vec[1] += float(rec.quantum_metrics.get("entanglement_score", 0.0)) * 0.05
    return [float(x) for x in vec[:dim]]


class StrategyVectorStore:
    """
    Speichert und durchsucht Strategie-Records.

    Umgebungsvariablen (optional):
        ``AETHER_STRATEGY_STORE_BACKEND``: chroma | faiss | jsonl
        ``AETHER_STRATEGY_STORE_PATH``: Verzeichnis für Persistenz
    """

    def __init__(
        self,
        *,
        backend: BackendName | None = None,
        persist_path: Path | str | None = None,
        embedding_dim: int = 32,
    ) -> None:
        import os

        self.embedding_dim = embedding_dim
        b = backend or os.environ.get("AETHER_STRATEGY_STORE_BACKEND", "jsonl")  # type: ignore[assignment]
        if b not in ("chroma", "faiss", "jsonl"):
            b = "jsonl"
        self.backend: BackendName = b  # type: ignore[assignment]
        root = Path(persist_path or os.environ.get("AETHER_STRATEGY_STORE_PATH", "strategy_memory/data"))
        root.mkdir(parents=True, exist_ok=True)
        self._path = root
        self._collection = None
        self._faiss_index = None
        self._faiss_vectors: list[list[float]] = []
        self._faiss_ids: list[str] = []
        self._faiss_payloads: list[dict[str, Any]] = []
        self._jsonl = root / "strategies.jsonl"

        if self.backend == "chroma":
            try:
                import chromadb  # type: ignore

                client = chromadb.PersistentClient(path=str(root / "chroma"))
                self._collection = client.get_or_create_collection(
                    name="aether_strategies",
                    metadata={"description": "QIGA-generated strategies"},
                )
                logger.info("StrategyVectorStore using Chroma at %s", root / "chroma")
            except Exception as exc:
                logger.warning("Chroma unavailable (%s), falling back to jsonl", exc)
                self.backend = "jsonl"
        elif self.backend == "faiss":
            try:
                import faiss  # type: ignore
                import numpy as np

                self._faiss_index = faiss.IndexFlatL2(embedding_dim)
                self._np = np
                logger.info("StrategyVectorStore using FAISS in-memory at dim=%s", embedding_dim)
            except Exception as exc:
                logger.warning("FAISS unavailable (%s), falling back to jsonl", exc)
                self.backend = "jsonl"

    def add(self, record: StrategyRecord) -> str:
        """Speichert einen Record; gibt die ID zurück."""
        rid = record.id or str(uuid.uuid4())
        record = replace(record, id=rid)
        emb = record.embedding or _embedding_from_record(record, self.embedding_dim)

        if self.backend == "chroma" and self._collection is not None:
            self._collection.add(
                ids=[rid],
                embeddings=[emb],
                documents=[json.dumps(record.to_dict())],
                metadatas=[{"fitness": record.fitness_total, "live_candidate": record.live_candidate}],
            )
            return rid

        if self.backend == "faiss" and self._faiss_index is not None:
            vec = self._np.array([emb[: self.embedding_dim]], dtype="float32")
            self._faiss_index.add(vec)
            self._faiss_vectors.append(emb)
            self._faiss_ids.append(rid)
            self._faiss_payloads.append(record.to_dict())
            line = json.dumps({"id": rid, "payload": record.to_dict(), "embedding": emb})
            with self._jsonl.open("a", encoding="utf-8") as f:
                f.write(line + "\n")
            return rid

        line = json.dumps({"id": rid, "payload": record.to_dict(), "embedding": emb})
        with self._jsonl.open("a", encoding="utf-8") as f:
            f.write(line + "\n")
        return rid

    def search(self, query_embedding: list[float], *, top_k: int = 5) -> list[StrategyRecord]:
        """Ähnlichkeitssuche (L2 / Chroma); Fallback: neueste aus JSONL."""
        q = query_embedding[: self.embedding_dim]
        if len(q) < self.embedding_dim:
            q = q + [0.0] * (self.embedding_dim - len(q))

        if self.backend == "chroma" and self._collection is not None:
            res = self._collection.query(query_embeddings=[q], n_results=top_k)
            out: list[StrategyRecord] = []
            for doc in res.get("documents", [[]])[0] or []:
                try:
                    payload = json.loads(doc)
                    out.append(StrategyRecord.from_dict(payload))
                except (json.JSONDecodeError, KeyError, TypeError) as exc:
                    logger.debug("skip malformed chroma doc: %s", exc)
            return out

        if self.backend == "faiss" and self._faiss_index is not None and self._faiss_index.ntotal > 0:
            import numpy as np

            qv = np.array([q], dtype="float32")
            _, idxs = self._faiss_index.search(qv, min(top_k, self._faiss_index.ntotal))
            out: list[StrategyRecord] = []
            for j in idxs[0]:
                ji = int(j)
                if 0 <= ji < len(self._faiss_payloads):
                    try:
                        out.append(StrategyRecord.from_dict(self._faiss_payloads[ji]))
                    except (KeyError, TypeError, ValueError) as exc:
                        logger.debug("skip faiss payload: %s", exc)
            if out:
                return out

        return self._search_jsonl_fallback(q, top_k)

    def _search_jsonl_fallback(self, query: list[float], top_k: int) -> list[StrategyRecord]:
        if not self._jsonl.exists():
            return []
        scored: list[tuple[float, StrategyRecord]] = []
        with self._jsonl.open("r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    obj = json.loads(line)
                    emb = obj.get("embedding") or []
                    if len(emb) < len(query):
                        emb = emb + [0.0] * (len(query) - len(emb))
                    dist = sum((float(emb[i]) - float(query[i])) ** 2 for i in range(len(query)))
                    scored.append((dist, StrategyRecord.from_dict(obj["payload"])))
                except (json.JSONDecodeError, KeyError, TypeError, ValueError) as exc:
                    logger.debug("skip line: %s", exc)
        scored.sort(key=lambda x: x[0])
        return [r for _, r in scored[:top_k]]
