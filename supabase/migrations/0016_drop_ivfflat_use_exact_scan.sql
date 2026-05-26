-- =============================================================================
-- 0016_drop_ivfflat_use_exact_scan.sql
-- =============================================================================
-- Purpose:
--   M5 fix — the ivfflat index added in 0012 was pathological for our tiny
--   corpus (15 chunks + lists=100 + default probes=1). It was returning
--   incomplete results; a query that literally said "Lumen" was missing
--   the Lumen chunk because its centroid landed in an unprobed cluster.
--
--   For corpora under ~10k vectors, sequential scan with the cosine
--   distance operator (<=>) is fast (<1ms) and exact. We drop the
--   index now and re-add a more appropriate index (hnsw, or ivfflat
--   with lists ~ sqrt(rows)) when the corpus grows past ~10k.

drop index if exists public.embeddings_embedding_cosine_idx;

comment on table public.embeddings is
  '768-d Gemini embeddings (gemini-embedding-001 @ outputDimensionality=768). No vector index — sequential scan is exact and <1ms for the M5 corpus (~15 chunks). Re-add an hnsw index when the corpus exceeds ~10k rows.';
