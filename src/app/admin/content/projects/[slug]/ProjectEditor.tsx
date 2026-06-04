"use client";

import { useRef, useState, useTransition, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { GlassButton } from "@/shared/ui/GlassButton";
import type { ProjectInput, SaveResult, UploadResult } from "./actions";

type InitialRow = {
  slug: string;
  title: string;
  subtitle: string | null;
  problem: string | null;
  description: string | null;
  role: string | null;
  stack: string[] | null;
  tags: string[] | null;
  cover_url: string | null;
  live_url: string | null;
  repo_url: string | null;
  status: string;
  featured: boolean;
  priority: number;
  sort_order: number;
};

type Props = {
  initial: InitialRow;
  isNew: boolean;
  saveAction: (input: ProjectInput, isNew: boolean) => Promise<SaveResult>;
  deleteAction: (slug: string) => Promise<{ ok: boolean; error?: string }>;
  uploadAction: (formData: FormData) => Promise<UploadResult>;
};

const STATUS_VALUES: ProjectInput["status"][] = ["draft", "in-progress", "shipped", "archived"];

export function ProjectEditor({ initial, isNew, saveAction, deleteAction, uploadAction }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [slug, setSlug] = useState(initial.slug);
  const [title, setTitle] = useState(initial.title);
  const [subtitle, setSubtitle] = useState(initial.subtitle ?? "");
  const [problem, setProblem] = useState(initial.problem ?? "");
  const [description, setDescription] = useState(initial.description ?? "");
  const [role, setRole] = useState(initial.role ?? "");
  const [stackText, setStackText] = useState((initial.stack ?? []).join(", "));
  const [tagsText, setTagsText] = useState((initial.tags ?? []).join(", "));
  const [coverUrl, setCoverUrl] = useState(initial.cover_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [liveUrl, setLiveUrl] = useState(initial.live_url ?? "");
  const [repoUrl, setRepoUrl] = useState(initial.repo_url ?? "");
  const [status, setStatus] = useState<ProjectInput["status"]>(
    (STATUS_VALUES.includes(initial.status as ProjectInput["status"])
      ? (initial.status as ProjectInput["status"])
      : "draft")
  );
  const [featured, setFeatured] = useState(initial.featured);
  const [priority, setPriority] = useState(initial.priority);
  const [sortOrder, setSortOrder] = useState(initial.sort_order);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const input: ProjectInput = {
      slug,
      title,
      subtitle,
      problem,
      description,
      role,
      stack: stackText.split(",").map((s) => s.trim()).filter(Boolean),
      tags: tagsText.split(",").map((s) => s.trim()).filter(Boolean),
      cover_url: coverUrl,
      live_url: liveUrl,
      repo_url: repoUrl,
      status,
      featured,
      priority,
      sort_order: sortOrder,
    };
    start(async () => {
      const result = await saveAction(input, isNew);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
      if (isNew) {
        router.replace(`/admin/content/projects/${result.slug}`);
        router.refresh();
      } else {
        router.refresh();
      }
    });
  }

  function onDelete() {
    if (!confirm(`Delete project '${slug}'? This cannot be undone.`)) return;
    setError(null);
    start(async () => {
      const r = await deleteAction(slug);
      if (!r.ok) setError(r.error ?? "Failed to delete.");
    });
  }

  async function onCoverChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("slug", slug);
      const r = await uploadAction(fd);
      if (!r.ok) {
        setCoverError(r.error);
        return;
      }
      setCoverUrl(r.url);
    } catch {
      setCoverError("Upload failed. Try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function onRemoveCover() {
    setCoverUrl("");
    setCoverError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  const field =
    "w-full px-3 py-2 rounded-md bg-[color-mix(in_oklab,var(--color-text)_4%,transparent)] border border-line text-fg placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent";

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Slug" required>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            disabled={!isNew || pending}
            placeholder="lumen"
            className={field}
            required
          />
        </Field>
        <Field label="Title" required>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={pending}
            placeholder="Lumen"
            className={field}
            required
          />
        </Field>
      </div>

      <Field label="Tagline (subtitle)">
        <input
          type="text"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          disabled={pending}
          placeholder="One-sentence hook"
          className={field}
        />
      </Field>

      <Field label="Cover image">
        <div className="flex flex-wrap items-start gap-4">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin preview only
            <img
              src={coverUrl}
              alt="Cover preview"
              className="w-44 h-[6.1875rem] object-cover rounded-md border border-line bg-[color-mix(in_oklab,var(--color-text)_6%,transparent)]"
            />
          ) : (
            <div className="w-44 h-[6.1875rem] rounded-md border border-dashed border-line grid place-items-center text-caption text-muted">
              No image
            </div>
          )}
          <div className="flex flex-col gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
              onChange={onCoverChange}
              disabled={pending || uploading}
              className="text-body-sm file:mr-3 file:rounded-md file:border-0 file:bg-[var(--color-accent)] file:text-[var(--color-accent-contrast)] file:px-3 file:py-1.5 file:text-body-sm file:font-medium file:cursor-pointer disabled:opacity-50"
            />
            {uploading && <span className="text-caption text-muted">Uploading…</span>}
            {coverError && (
              <span role="alert" className="text-caption text-[var(--color-accent)]">
                {coverError}
              </span>
            )}
            {coverUrl && !uploading && (
              <button
                type="button"
                onClick={onRemoveCover}
                disabled={pending}
                className="self-start text-caption text-muted hover:text-accent underline underline-offset-2 transition-colors"
              >
                Remove image
              </button>
            )}
            <span className="text-caption text-muted">
              Shown on the project card. JPG/PNG/WebP, ≤5 MB. ~16:9 looks best.
            </span>
          </div>
        </div>
      </Field>

      <Field label="Problem">
        <textarea
          rows={3}
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          disabled={pending}
          placeholder="What problem does this solve?"
          className={field + " resize-y"}
        />
      </Field>

      <Field label="My role">
        <input
          type="text"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          disabled={pending}
          placeholder="Solo design + engineering"
          className={field}
        />
      </Field>

      <Field label="Writeup (description)">
        <textarea
          rows={6}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={pending}
          placeholder="Long-form description shown on the detail page."
          className={field + " resize-y"}
        />
      </Field>

      <Field label="Stack (comma-separated)">
        <input
          type="text"
          value={stackText}
          onChange={(e) => setStackText(e.target.value)}
          disabled={pending}
          placeholder="Next.js, TypeScript, Supabase"
          className={field}
        />
      </Field>

      <Field label="Tags (comma-separated)">
        <input
          type="text"
          value={tagsText}
          onChange={(e) => setTagsText(e.target.value)}
          disabled={pending}
          placeholder="AI, RAG, Next.js"
          className={field}
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Live URL">
          <input
            type="url"
            value={liveUrl}
            onChange={(e) => setLiveUrl(e.target.value)}
            disabled={pending}
            placeholder="https://lumen.dorbtz.com"
            className={field}
          />
        </Field>
        <Field label="Repo URL">
          <input
            type="url"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            disabled={pending}
            placeholder="https://github.com/dorbtz/Lumen-Project"
            className={field}
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Field label="Status">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ProjectInput["status"])}
            disabled={pending}
            className={field}
          >
            {STATUS_VALUES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Featured">
          <label className="inline-flex items-center gap-2 mt-2.5">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              disabled={pending}
              className="w-5 h-5 accent-[var(--color-accent)]"
            />
            <span className="text-body-sm">Star this project</span>
          </label>
        </Field>
        <Field label="Priority (0-100)">
          <input
            type="number"
            value={priority}
            onChange={(e) => setPriority(parseInt(e.target.value || "0", 10))}
            min={0}
            max={100}
            disabled={pending}
            className={field}
          />
        </Field>
        <Field label="Sort order">
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(parseInt(e.target.value || "9999", 10))}
            disabled={pending}
            className={field}
          />
        </Field>
      </div>

      {error && (
        <p role="alert" className="text-body-sm text-[var(--color-accent)]">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="text-body-sm text-[#10b981]">
          Saved ✓ — public pages revalidated. Re-sync embeddings on the Health page so the chatbot picks up the change.
        </p>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap mt-2">
        {!isNew ? (
          <GlassButton type="button" variant="ghost" size="sm" disabled={pending} onClick={onDelete}>
            Delete
          </GlassButton>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <GlassButton
            type="button"
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => router.push("/admin/content")}
          >
            Cancel
          </GlassButton>
          <GlassButton type="submit" variant="primary" disabled={pending}>
            {pending ? "Saving…" : isNew ? "Create project" : "Save changes"}
          </GlassButton>
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-caption uppercase tracking-wider text-muted">
        {label}
        {required && <span className="text-accent ml-1">*</span>}
      </span>
      {children}
    </label>
  );
}
