# CLASS — wraps FastEmbed client with local cache_dir
from fastembed import TextEmbedding
from core.config import settings


class EmbeddingService:
    def __init__(self) -> None:
        self._model = None

    @property
    def model(self) -> TextEmbedding:
        if self._model is None:
            self._model = TextEmbedding(
                model_name="BAAI/bge-small-en-v1.5",
                cache_dir=settings.FASTEMBED_CACHE_PATH
            )
        return self._model

    def embed_chunks(self, chunks: list[str]) -> list[list[float]]:
        """Generates list of embeddings for the input chunks."""
        if not chunks:
            return []
        embeddings_iter = self.model.embed(chunks)
        return [list(map(float, emb)) for emb in embeddings_iter]

    def embed_query(self, query: str) -> list[float]:
        """Generates a single embedding vector for a query string."""
        query_embeddings = list(self.model.query_embed(query))
        if not query_embeddings:
            raise ValueError("Failed to generate embedding for the input query.")
        return list(map(float, query_embeddings[0]))


embedding_service = EmbeddingService()

