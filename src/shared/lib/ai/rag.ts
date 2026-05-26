/**
 * RAG pipeline — chunk + embed + retrieve.
 *
 *  - chunkSource: turns a project row / site_content row into a small set
 *                 of text chunks ready for embedding.
 *  - embedTexts:  batch-embeds via Gemini text-embedding-004 (768d).
 *  - retrieve:    cosine-similarity top-K with a minimum threshold.
 *  - syncCorpus:  rebuilds the embeddings table from current projects.
 *                 Called from a cron in M5 / on-demand from /admin/content.
 */
import "server-only";
import { embed, embedMany } from "ai";
import { embedModel, EMBED_PROVIDER_OPTIONS } from "./provider";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { PROFILE, SKILL_GROUPS, EDUCATION, EMPLOYMENT } from "@/shared/data/profile";
import { HERO, ABOUT } from "@/shared/data/sections";

export type EmbeddingChunk = {
  source_table: "projects" | "site_content" | "profile";
  source_id: string | null;
  source_key: string | null;
  chunk: string;
};

export type RetrievedChunk = EmbeddingChunk & { score: number };

/** Per-row chunker for projects. Keeps writeup whole — small enough at ~600 chars. */
export function chunkProjectRow(row: {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  problem: string | null;
  description: string | null;
  role: string | null;
  stack: string[] | null;
  tags: string[] | null;
  status: string | null;
  featured: boolean | null;
}): EmbeddingChunk {
  const statusLabel =
    row.status === "shipped"
      ? row.featured
        ? "shipped (featured)"
        : "shipped"
      : row.status === "in-progress"
      ? row.featured
        ? "in-progress (featured)"
        : "in-progress"
      : row.status ?? "draft";
  const lines = [
    `Project: ${row.title} (slug: ${row.slug})`,
    `Status: ${statusLabel}`,
    row.subtitle ? `Tagline: ${row.subtitle}` : "",
    row.problem ? `Problem: ${row.problem}` : "",
    row.role ? `Role: ${row.role}` : "",
    row.description ? `Description: ${row.description}` : "",
    row.stack?.length ? `Stack: ${row.stack.join(", ")}` : "",
    row.tags?.length ? `Tags: ${row.tags.join(", ")}` : "",
  ].filter(Boolean);
  return {
    source_table: "projects",
    source_id: row.id,
    source_key: row.slug,
    chunk: lines.join("\n"),
  };
}

/** Profile / about / hero / skills / employment chunks. Static — derived from code. */
export function buildProfileChunks(): EmbeddingChunk[] {
  const chunks: EmbeddingChunk[] = [];

  chunks.push({
    source_table: "profile",
    source_id: null,
    source_key: "profile.bio",
    chunk: [
      `Name: ${PROFILE.name}`,
      `Headline: ${PROFILE.headline}`,
      `Location: ${PROFILE.location}`,
      `Email: ${PROFILE.email}`,
      `LinkedIn: ${PROFILE.linkedin}`,
      `GitHub: ${PROFILE.github}`,
      `Short bio: ${PROFILE.bioShort}`,
      `Long bio: ${PROFILE.bioLong}`,
    ].join("\n"),
  });

  chunks.push({
    source_table: "site_content",
    source_id: null,
    source_key: "hero",
    chunk: [`Hero headline: ${HERO.headline}`, `Hero subhead: ${HERO.subhead}`].join("\n"),
  });

  chunks.push({
    source_table: "site_content",
    source_id: null,
    source_key: "about",
    chunk: [
      `About title: ${ABOUT.title}`,
      `About body: ${ABOUT.body}`,
      ...ABOUT.highlights.map((h) => `Highlight: ${h.title} — ${h.body}`),
    ].join("\n"),
  });

  chunks.push({
    source_table: "site_content",
    source_id: null,
    source_key: "skills",
    chunk: SKILL_GROUPS.map(
      (g) => `Skills (${g.label}): ${g.skills.map((s) => s.name).join(", ")}`
    ).join("\n"),
  });

  for (const job of EMPLOYMENT) {
    chunks.push({
      source_table: "site_content",
      source_id: null,
      source_key: `employment:${job.org}`,
      chunk: [`Role: ${job.title} at ${job.org} (${job.period})`, ...job.bullets].join("\n"),
    });
  }

  for (const ed of EDUCATION) {
    chunks.push({
      source_table: "site_content",
      source_id: null,
      source_key: `education:${ed.org}`,
      chunk: [`Education: ${ed.title} — ${ed.org} (${ed.period})`, ...ed.bullets].join("\n"),
    });
  }

  return chunks;
}

/** Batch-embed via Gemini. Returns [{...chunk, embedding}] in input order. */
export async function embedTexts(chunks: EmbeddingChunk[]): Promise<
  Array<EmbeddingChunk & { embedding: number[] }>
> {
  if (chunks.length === 0) return [];
  const { embeddings } = await embedMany({
    model: embedModel(),
    values: chunks.map((c) => c.chunk),
    providerOptions: EMBED_PROVIDER_OPTIONS,
  });
  return chunks.map((c, i) => ({ ...c, embedding: embeddings[i] }));
}

/** Single query embedding — used at retrieval time on the user message. */
export async function embedQuery(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: embedModel(),
    value: text,
    providerOptions: EMBED_PROVIDER_OPTIONS,
  });
  return embedding;
}

/** Service-role Supabase client. Bypasses RLS — used for embed sync writes. */
function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY (server-only) is required for embedding sync."
    );
  }
  return createServerClient(url, serviceRole, {
    cookies: { getAll: () => [], setAll: () => {} },
  });
}

/** Wipe + repopulate the entire embeddings table. Idempotent. */
export async function syncCorpus(): Promise<{ chunks: number }> {
  const supabase = createSupabaseAdminClient();

  // Exclude both archived AND draft (placeholder) projects from the corpus.
  // Drafts have no real content; including them lets a query like "recent work"
  // surface "Project Four — Coming soon" instead of Lumen.
  const { data: projects, error: projErr } = await supabase
    .from("projects")
    .select(
      "id,slug,title,subtitle,problem,description,role,stack,tags,status,featured"
    )
    .not("status", "in", "(archived,draft)");
  if (projErr) throw projErr;

  const projectChunks = (projects ?? []).map(chunkProjectRow);
  const profileChunks = buildProfileChunks();
  const allChunks = [...projectChunks, ...profileChunks];

  const embedded = await embedTexts(allChunks);

  // Wipe + insert. Done in a transaction-equivalent: delete all, then bulk insert.
  // (Tiny corpus — no need for incremental upserts.)
  await supabase.from("embeddings").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  const rows = embedded.map((e) => ({
    source_table: e.source_table,
    source_id: e.source_id,
    source_key: e.source_key,
    chunk: e.chunk,
    embedding: e.embedding,
  }));
  const { error: insErr } = await supabase.from("embeddings").insert(rows);
  if (insErr) throw insErr;

  return { chunks: embedded.length };
}

/** Per-request public client for retrieval (RLS-protected; embeddings have a public read policy). */
async function createSupabasePublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error("Missing Supabase env vars.");
  const store = await cookies();
  return createServerClient(url, anon, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: () => {
        /* read-only path */
      },
    },
  });
}

/**
 * Retrieve top-K chunks by cosine similarity to `query`.
 * Score is 1 - cosine_distance ; threshold defaults to 0.55 per SPEC §9.
 */
export async function retrieve(
  query: string,
  { topK = 5, minScore = 0.55 }: { topK?: number; minScore?: number } = {}
): Promise<RetrievedChunk[]> {
  const queryEmbedding = await embedQuery(query);
  const supabase = await createSupabasePublicClient();
  // pgvector accepts JSON-array literal input on the wire; supabase-js
  // stringifies arrays for us. Cast to unknown to satisfy the generated
  // RPC type (which would otherwise expect a `string` for the vector param).
  const { data, error } = await supabase.rpc("match_embeddings", {
    query_embedding: queryEmbedding as unknown as string,
    match_count: topK,
    min_score: minScore,
  });
  if (error) throw error;
  return (data ?? []) as RetrievedChunk[];
}
