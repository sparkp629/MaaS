# Pipeline Knowledge RAG (FR)

Objectif: exploiter les fichiers TXT/PDF/DOCX/images comme base de connaissance pour la generation copywriting.

## 1) Construire la base locale (SQLite)

Depuis `backend/`:

```bash
npm run ingest:knowledge
npm run vectors:knowledge
```

Resultat:
- `knowledge_sources`: index des fichiers scopes
- `knowledge_chunks`: texte decoupe en chunks
- `knowledge_vectors`: embeddings OpenAI normalises

Variables utiles:
- `OPENAI_API_KEY`
- `EMBEDDING_MODEL` (default `text-embedding-3-small`)
- `VECTOR_BATCH_SIZE` (default `16`)
- `VECTOR_MAX_CHUNKS` (default `1200`)

## 2) Preparer Supabase

Executer `docs/supabase_metadata_schema.sql` dans l'editeur SQL Supabase.

Le schema ajoute:
- `knowledge_sources`
- `knowledge_chunks`
- `knowledge_vectors`

## 3) Synchroniser vers Supabase

Depuis `backend/`:

```bash
npm run sync:knowledge:supabase
```

Ou pipeline complet:

```bash
npm run pipeline:knowledge
```

## 4) Generer avec RAG

Endpoint backend:

- `POST /api/copywriting/generate-rag`

Payload minimal:

```json
{
  "productName": "Signal Sprint",
  "productDescription": "Plateforme de veille KOL et contenus performants",
  "niche": "intelligence artificielle fr",
  "tone": "informatif"
}
```

Le endpoint:
- recupere les vecteurs (Supabase prioritaire, fallback SQLite),
- extrait un lexique exact depuis les fichiers prompts,
- injecte ce contexte dans la generation OpenAI.
