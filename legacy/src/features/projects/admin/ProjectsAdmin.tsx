import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, DragEvent } from "react";
import {
  clearProjectsCache,
  createProject,
  deleteProject,
  listProjects,
  reorderProjects,
  updateProject,
} from "../services/projects";
import type { Project, ProjectLink, ProjectMetric, ProjectMode, ProjectStatus } from "../../../types/project";
import { useAuth } from "../../auth/useAuth.helpers";
import { uploadProjectCover, deleteProjectCover } from "../services/storage";
import { getProfile } from "../../auth/services/profiles";
import ProjectCard from "../ProjectCard";
import { useMode, type Mode } from "../../../shared/stores/mode";
import {
  AdminCheckbox,
  AdminField,
  AdminInput,
  AdminSelect,
  AdminTextarea,
} from "../../admin-dashboard/admin/AdminField";
import { importFromUrl, mergeIntoForm } from "../services/projectUrlImport";
import AdminTopBar from "../../admin-dashboard/admin/AdminTopBar";
import AdminPageIcon from "../../admin-dashboard/admin/AdminPageIcon";
import "../../admin-dashboard/styles/admin-dashboard.css";
import { DossierCard } from "../../admin-dashboard/admin/DossierCard";
import { useContentEditor } from "../../content/admin/useContentEditor";
import InlineEdit from "../../content/admin/InlineEdit";
import RotatingListEditor from "../../content/admin/RotatingListEditor";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type FormState = {
  id?: string;
  slug: string;
  title: string;
  subtitle: string;
  summary: string;
  description: string;
  stackCsv: string;
  tagsCsv: string;
  role: string;
  status: ProjectStatus;
  mode: ProjectMode | "";
  priority: number;
  sortOrder: number;
  featured: boolean;
  liveUrl: string;
  repoUrl: string;
  coverUrl: string;
  createdAt: string;
  heroImageAlt: string;
  heroVideoUrl: string;
  gallery: string[];      // URLs (replaces galleryCsv)
  linksText: string;
  metricsText: string;
  responsibilitiesText: string;
  outcomesText: string;
};

// ---------------------------------------------------------------------------
// Default form
// ---------------------------------------------------------------------------
const emptyForm: FormState = {
  slug: "",
  title: "",
  subtitle: "",
  summary: "",
  description: "",
  stackCsv: "",
  tagsCsv: "",
  role: "",
  status: "draft",
  mode: "",
  priority: 1,
  sortOrder: 1,
  featured: false,
  liveUrl: "",
  repoUrl: "",
  coverUrl: "",
  createdAt: new Date().toISOString(),
  heroImageAlt: "",
  heroVideoUrl: "",
  gallery: [],
  linksText: "",
  metricsText: "",
  responsibilitiesText: "",
  outcomesText: "",
};

// ---------------------------------------------------------------------------
// Option lists
// ---------------------------------------------------------------------------
const STACK_OPTIONS = ["React","TypeScript","Supabase","Tailwind CSS","Next.js","Vite","Node.js","PostgreSQL","Prisma","Framer Motion","Shopify","Liquid","OpenAI","AWS","Vercel"];
const TAG_OPTIONS   = ["saas","ai","product","ux","devtools","ecommerce","brand","mobile","realtime","design-system","performance","strategy"];
const ROLE_OPTIONS  = ["Founding engineer","Lead engineer & product designer","Product designer","Frontend lead","Tech lead","Full-stack developer","Design technologist"];

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------
type SuggestionPreset = { label: string; description: string; fields: Partial<FormState> };

const SUGGESTION_PRESETS: SuggestionPreset[] = [
  {
    label: "AI workflow suite",
    description: "Polishes copy & structure for an AI-assisted productivity launch.",
    fields: {
      title: "FluxCraft - AI Workflow Studio", slug: "fluxcraft",
      subtitle: "Blueprint, automate, and deploy complex team workflows in minutes.",
      summary: "An AI-assisted automation studio that lets teams orchestrate multi-step workflows with versioned prompts, live data sync, and transparent audit trails.",
      description: "FluxCraft empowers growth teams to model high-leverage workflows without code. I led the end-to-end build: prompt graph editor, Supabase-backed execution engine, GPT-4 actions, and observability dashboards with percentile latency budgets.",
      stackCsv: "React, TypeScript, Supabase, Tailwind CSS, OpenAI, Vite", tagsCsv: "saas, ai, automation, devtools",
      role: "Founding engineer",
      metricsText: "Execution success rate | 98.7%\nMedian run time | 4.1s\nPrompt version latency | <120ms",
      responsibilitiesText: "Prompt graph architecture\nRealtime Supabase orchestration\nAI guardrails & evaluation harness\nDesign system + theming",
      outcomesText: "Automations shipped 3x faster\nCritical workflows executed 12k/month\nSupport tickets for automation errors down 68%",
    },
  },
  {
    label: "Ecommerce experience",
    description: "Ideal for a polished storefront or Shopify project.",
    fields: {
      title: "Velvet Arcadia Boutique", slug: "velvet-arcadia",
      subtitle: "Immersive storytelling storefront with adaptive merchandising and bespoke VIP tiers.",
      summary: "A couture retail platform with cinematic product reveals, tiered loyalty flows, and tailored content powered by Shopify Hydrogen and Supabase merchandising rules.",
      description: "Built end-to-end experience for a luxury label: adaptive landing layouts, shoppable lookbooks, membership dashboard, and headless checkout instrumentation. Delivered 60fps interactions across devices with aggressive image optimisation.",
      stackCsv: "Shopify, Hydrogen, TypeScript, Tailwind CSS, Supabase, Cloudinary", tagsCsv: "ecommerce, brand, performance",
      role: "Frontend lead",
      metricsText: "Conversion rate | +32%\nAverage order value | +18%\nLargest contentful paint | 1.3s",
      responsibilitiesText: "Hydrogen storefront architecture\nTiered membership flows\nAnalytics & experimentation setup\nMotion direction + accessibility",
      outcomesText: "VIP tier activation doubled in 4 weeks\nContent publishing time dropped to 15 minutes\nWon \"Best Retail Experience\" at ShopAwards",
    },
  },
  {
    label: "Developer platform",
    description: "Quickly scaffold a polished DX/infra case study.",
    fields: {
      title: "SignalForge Platform", slug: "signalforge",
      subtitle: "Realtime observability and incident automation for critical infrastructure teams.",
      summary: "End-to-end developer platform combining streaming telemetry, automated runbooks, and generative summaries to keep SRE teams ahead of incidents.",
      description: "Designed and delivered a multi-tenant observability platform using Supabase Row Level Security, streaming edge workers, and incident copilots. Crafted component-driven UI exposing actionable signal without overload.",
      stackCsv: "React, TypeScript, Supabase, Edge Functions, Tailwind CSS, Framer Motion", tagsCsv: "devtools, platform, realtime, observability",
      role: "Tech lead",
      metricsText: "MTTR reduction | 41%\nDashboard load time | 640ms\nADR adoption | 87%",
      responsibilitiesText: "Multi-tenant data modelling\nIncident automation workflows\nCommand palette & dashboard UX\nTeam enablement & documentation",
      outcomesText: "Incident resolution improved by 41%\nAdopted by 6 enterprise teams in pilot\nRated 4.9/5 satisfaction in DX survey",
    },
  },
];

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------
function slugify(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}
function parseCsvList(value: string): string[] {
  return value.split(/[,\n]+/).map((s) => s.trim()).filter(Boolean);
}
function parseMultilineList(value: string): string[] {
  return value.split(/\n+/).map((s) => s.trim()).filter(Boolean);
}
function parseLinksText(value: string): ProjectLink[] {
  return value.split(/\n+/).map((line) => line.trim()).filter(Boolean).map((line) => {
    const parts = line.includes("|") ? line.split("|") : line.split(",");
    const [label, url, icon] = parts.map((s) => s.trim());
    if (!label || !url) return null;
    return { label, url, icon: icon || null } as ProjectLink;
  }).filter((x): x is ProjectLink => x !== null);
}
function parseMetricsText(value: string): ProjectMetric[] {
  return value.split(/\n+/).map((line) => line.trim()).filter(Boolean).map((line) => {
    const parts = line.includes("|") ? line.split("|") : line.split(":");
    const [label, metricValue] = parts.map((s) => s.trim());
    if (!label || !metricValue) return null;
    return { label, value: metricValue } as ProjectMetric;
  }).filter((x): x is ProjectMetric => Boolean(x));
}
function formatLinksText(links?: ProjectLink[] | null): string {
  if (!links?.length) return "";
  return links.map((l) => [l.label, l.url, l.icon].filter(Boolean).join(" | ")).join("\n");
}
function formatMetricsText(metrics?: ProjectMetric[] | null): string {
  if (!metrics?.length) return "";
  return metrics.map((m) => `${m.label} | ${m.value}`).join("\n");
}

// ---------------------------------------------------------------------------
// Round 36 — Chip-style multi-select for the Stack / Tags fields.
//
// Renders a chip per selected value (× to remove), an "Add ▾" dropdown of
// the configured suggestions, and a free-text input for anything not on the
// list. Values are serialised back to a comma-separated string (`csv`) so
// the rest of the form / DB schema is untouched.
// ---------------------------------------------------------------------------
type ChipSelectProps = {
  value: string;                  // current CSV value
  options: readonly string[];     // suggestion list
  placeholder?: string;
  onChange: (csv: string) => void;
  ariaLabel?: string;
};

function parseCsv(value: string): string[] {
  return value
    .split(/[,\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function ChipSelect({ value, options, placeholder, onChange, ariaLabel }: ChipSelectProps) {
  const items = useMemo(() => {
    // De-dupe case-insensitively but preserve the original casing the user
    // typed (or the first occurrence in CSV).
    const seen = new Set<string>();
    const out: string[] = [];
    for (const v of parseCsv(value)) {
      const key = v.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(v);
    }
    return out;
  }, [value]);

  const lower = useMemo(() => new Set(items.map((s) => s.toLowerCase())), [items]);
  // Suggestions = configured options that aren't already selected.
  const remaining = useMemo(
    () => options.filter((opt) => !lower.has(opt.toLowerCase())),
    [options, lower],
  );

  const [draft, setDraft] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function commit(next: string[]) {
    onChange(next.join(', '));
  }

  function add(rawValue: string) {
    const v = rawValue.trim();
    if (!v) return;
    if (lower.has(v.toLowerCase())) {
      // Already in the list — just clear the draft and close.
      setDraft('');
      setOpen(false);
      return;
    }
    commit([...items, v]);
    setDraft('');
    setOpen(false);
    // Re-focus so the user can keep typing
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function remove(target: string) {
    commit(items.filter((s) => s.toLowerCase() !== target.toLowerCase()));
  }

  // Close the dropdown when clicking outside.
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div ref={wrapRef} className="chip-select" style={{ position: 'relative' }}>
      <div
        className="chip-select__field"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '.4rem',
          padding: '.45rem .55rem',
          minHeight: '2.4rem',
          borderRadius: 6,
          border: '1px solid currentColor',
          background: 'transparent',
        }}
        onClick={() => inputRef.current?.focus()}
      >
        {items.map((item) => (
          <span
            key={item.toLowerCase()}
            className="chip-select__chip"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '.3rem',
              padding: '.18rem .55rem',
              borderRadius: 999,
              fontSize: '.78rem',
              fontWeight: 600,
              border: '1px solid currentColor',
              background: 'rgb(var(--color-accent) / .15)',
            }}
          >
            {item}
            <button
              type="button"
              aria-label={`Remove ${item}`}
              onClick={(e) => {
                e.stopPropagation();
                remove(item);
              }}
              style={{
                appearance: 'none',
                background: 'transparent',
                border: 0,
                cursor: 'pointer',
                fontSize: '.95rem',
                lineHeight: 1,
                padding: 0,
                color: 'inherit',
                opacity: 0.75,
              }}
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={draft}
          aria-label={ariaLabel}
          placeholder={items.length ? '' : (placeholder ?? '')}
          onChange={(e) => {
            setDraft(e.currentTarget.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              add(draft);
            } else if (e.key === 'Backspace' && !draft && items.length) {
              // Quick-remove the last chip on Backspace in an empty input
              remove(items[items.length - 1]);
            } else if (e.key === 'Escape') {
              setOpen(false);
            }
          }}
          style={{
            flex: '1 1 8rem',
            minWidth: '6rem',
            background: 'transparent',
            border: 0,
            outline: 'none',
            font: 'inherit',
            color: 'inherit',
            padding: '.1rem .15rem',
          }}
        />
        <button
          type="button"
          aria-label="Open suggestions"
          aria-expanded={open}
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
            if (!open) requestAnimationFrame(() => inputRef.current?.focus());
          }}
          style={{
            appearance: 'none',
            background: 'transparent',
            border: 0,
            cursor: 'pointer',
            opacity: 0.7,
            padding: '.1rem .35rem',
            fontSize: '.9rem',
          }}
        >
          ▾
        </button>
      </div>

      {open && (
        <div
          role="listbox"
          aria-label="Suggestions"
          className="chip-select__menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 30,
            maxHeight: 240,
            overflowY: 'auto',
            border: '1px solid currentColor',
            borderRadius: 8,
            background: 'rgb(var(--color-surface, 7 16 30))',
            color: 'inherit',
            boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
            padding: '.3rem 0',
          }}
        >
          {(() => {
            const q = draft.trim().toLowerCase();
            const filtered = q
              ? remaining.filter((opt) => opt.toLowerCase().includes(q))
              : remaining;
            const showAddCustom = !!q && !lower.has(q) && !filtered.some((o) => o.toLowerCase() === q);
            if (!filtered.length && !showAddCustom) {
              return (
                <p style={{ padding: '.5rem .75rem', fontSize: '.8rem', opacity: 0.65 }}>
                  No matches.
                </p>
              );
            }
            return (
              <>
                {filtered.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    role="option"
                    onClick={() => add(opt)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '.45rem .75rem',
                      background: 'transparent',
                      border: 0,
                      cursor: 'pointer',
                      font: 'inherit',
                      color: 'inherit',
                      fontSize: '.85rem',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        'rgb(var(--color-accent) / .12)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                    }}
                  >
                    + {opt}
                  </button>
                ))}
                {showAddCustom && (
                  <button
                    type="button"
                    role="option"
                    onClick={() => add(draft)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '.45rem .75rem',
                      background: 'rgb(var(--color-highlight) / .15)',
                      border: 0,
                      cursor: 'pointer',
                      font: 'inherit',
                      color: 'inherit',
                      fontSize: '.85rem',
                      fontWeight: 600,
                    }}
                  >
                    + Add "{draft.trim()}" (custom)
                  </button>
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Drag-drop image upload zone
// ---------------------------------------------------------------------------
type ImageUploadZoneProps = {
  label: string;
  previewUrl?: string;
  onFile: (file: File) => void;
  uploading?: boolean;
  uploadProgress?: number; // 0-100
  uploadError?: string | null;
  hint?: string;
  accept?: string;
};

function ImageUploadZone({
  label, previewUrl, onFile, uploading, uploadProgress, uploadError, hint, accept = "image/*",
}: ImageUploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  }
  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(true);
  }
  function handleDragLeave() { setDragOver(false); }
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) { onFile(file); e.target.value = ""; }
  }

  return (
    <div className="image-upload-zone space-y-2">
      <span className="image-upload-zone__label text-sm">{label}</span>
      <div
        role="button"
        tabIndex={0}
        aria-label={`${label} — drag and drop or click to pick file`}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        // Theming lives in admin-dashboard.css under .image-upload-zone__drop
        // so the cream Luffy/manga shell flips the colors automatically rather
        // than forcing white-on-cream invisibility (Round 14 hot-fix).
        className="image-upload-zone__drop relative flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-sm transition-all duration-150"
        data-drag-over={dragOver || undefined}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Cover preview"
            className="max-h-[112px] max-w-[200px] rounded-lg object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <>
            <svg
              className="image-upload-zone__icon"
              width="32" height="32" viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M4 16l4-4 4 4 4-4 4 4M12 12V4" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="3" y="3" width="18" height="18" rx="2" strokeOpacity="0.5" />
            </svg>
            <span className="image-upload-zone__hint">Drop image here or click to pick</span>
          </>
        )}
        {uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl bg-black/60">
            <span className="text-xs text-white/70">Uploading…</span>
            {uploadProgress !== undefined && (
              <div className="h-1 w-32 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-cyan-400 transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
            )}
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept={accept} onChange={handleInputChange} className="hidden" aria-hidden="true" />
      {hint && <p className="image-upload-zone__sub text-[11px]">{hint}</p>}
      {uploadError && <p className="text-xs text-rose-400" role="alert">{uploadError}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Multi-image gallery uploader
// ---------------------------------------------------------------------------
type GalleryUploaderProps = {
  gallery: string[];
  onAdd: (url: string) => void;
  onRemove: (url: string) => void;
  userId: string | undefined;
};

function GalleryUploader({ gallery, onAdd, onRemove, userId }: GalleryUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (!userId) { setError("Not authenticated"); return; }
    setUploading(true);
    setError(null);
    try {
      const { url } = await uploadProjectCover(file, userId);
      onAdd(url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <ImageUploadZone
        label="Gallery images (multiple)"
        onFile={handleFile}
        uploading={uploading}
        uploadError={error}
        hint="Each uploaded file is appended to the gallery."
      />
      {gallery.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {gallery.map((url) => (
            <div key={url} className="group relative">
              <img
                src={url}
                alt="Gallery item"
                className="image-upload-zone__thumb h-16 w-24 rounded-lg object-cover"
                loading="lazy"
                decoding="async"
              />
              <button
                type="button"
                onClick={() => onRemove(url)}
                aria-label="Remove gallery image"
                className="absolute -right-2 -top-2 hidden h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] text-white group-hover:flex"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Confirm-on-delete dialog
// ---------------------------------------------------------------------------
type ConfirmDeleteDialogProps = {
  projectTitle: string;
  onCancel: () => void;
  onConfirm: () => void;
};

function ConfirmDeleteDialog({ projectTitle, onCancel, onConfirm }: ConfirmDeleteDialogProps) {
  const [phase, setPhase] = useState<'warn' | 'confirm'>('warn');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleConfirmClick() {
    if (phase === 'warn') {
      setPhase('confirm');
      timerRef.current = setTimeout(() => setPhase('warn'), 3000);
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
      onConfirm();
    }
  }

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  // Trap focus in dialog
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = dialogRef.current?.querySelector<HTMLButtonElement>('button');
    el?.focus();
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Delete project confirmation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div ref={dialogRef} className="mx-4 max-w-sm rounded-2xl border border-white/10 bg-[#0f1320] p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-white">Delete Project?</h2>
        <p className="mt-2 text-sm text-white/70">
          You are about to permanently delete{" "}
          <strong className="text-white">{projectTitle}</strong>. This cannot be undone.
        </p>
        {phase === 'confirm' && (
          <p className="mt-2 text-xs text-rose-400" role="alert">
            Click Delete again to confirm. This expires in 3 seconds.
          </p>
        )}
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmClick}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all"
            style={{
              background: phase === 'confirm'
                ? '#ef4444'
                : '#b91c1c',
              boxShadow: phase === 'confirm' ? '0 0 12px rgba(239,68,68,0.5)' : 'none',
            }}
          >
            {phase === 'confirm' ? 'Yes, delete it' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Drag-to-reorder project list item
// ---------------------------------------------------------------------------
type DraggableProjectItemProps = {
  project: Project;
  index: number;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDrop: () => void;
  onEdit: (p: Project) => void;
  onDeleteRequest: (p: Project) => void;
  isDraggingOver: boolean;
};

function DraggableProjectItem({
  project, index, onDragStart, onDragOver, onDrop, onEdit, onDeleteRequest, isDraggingOver,
}: DraggableProjectItemProps) {
  // Mode badge — color-codes the project's universe so the wall reads at a
  // glance: Thor / Asgard (cyan), Luffy / Gear 5 (red), or both (neutral).
  const modeBadge = project.mode === 'thor'
    ? { text: 'THOR', bg: 'rgba(76,207,255,0.18)', color: '#4ccfff', border: '#4ccfff' }
    : project.mode === 'gear5'
      ? { text: 'LUFFY', bg: 'rgba(209,27,27,0.18)', color: '#ff6b6b', border: '#d11b1b' }
      : { text: 'BOTH', bg: 'rgba(160,160,160,0.18)', color: '#bbb', border: '#888' };

  const isPlaceholder = project.placeholder === true;

  return (
    <li
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => { e.preventDefault(); onDragOver(index); }}
      onDrop={onDrop}
      className="admin-list__row admin-list__row--card flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between"
      style={{ "--admin-list-dragover": isDraggingOver ? "1" : "0" } as CSSProperties}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Drag handle */}
        <span
          className="admin-list__handle select-none text-lg leading-none"
          aria-hidden
          style={{ cursor: 'grab' }}
        >⠿</span>

        {/* Cover thumbnail — falls back to a neutral placeholder if no cover */}
        <div
          className="admin-list__thumb"
          style={{
            width: 56,
            height: 56,
            borderRadius: 8,
            overflow: 'hidden',
            flex: '0 0 56px',
            background: 'rgba(255,255,255,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {project.coverUrl ? (
            <img
              src={project.coverUrl}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              loading="lazy"
            />
          ) : (
            <span style={{ fontSize: 22, opacity: 0.4 }} aria-hidden>📄</span>
          )}
        </div>

        {/* Title block */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium truncate">{project.title}</span>
            {/* Mode tag — always visible */}
            <span
              style={{
                fontSize: '.6rem',
                fontWeight: 800,
                letterSpacing: '.12em',
                padding: '.15rem .45rem',
                borderRadius: 3,
                background: modeBadge.bg,
                color: modeBadge.color,
                border: `1px solid ${modeBadge.border}`,
              }}
            >
              {modeBadge.text}
            </span>
            {/* Placeholder badge — gold stamp on bundled fixture rows */}
            {isPlaceholder && (
              <span
                style={{
                  fontSize: '.6rem',
                  fontWeight: 800,
                  letterSpacing: '.18em',
                  padding: '.15rem .45rem',
                  borderRadius: 3,
                  background: 'linear-gradient(135deg,#ffe566 0%,#ffb347 100%)',
                  color: '#1a0d05',
                  border: '1.5px solid #1a0d05',
                  boxShadow: '1.5px 1.5px 0 #1a0d05',
                }}
              >
                PLACEHOLDER
              </span>
            )}
            {/* Status pill */}
            <span
              style={{
                fontSize: '.62rem',
                fontWeight: 600,
                letterSpacing: '.08em',
                padding: '.15rem .45rem',
                borderRadius: 3,
                opacity: .75,
                border: '1px solid currentColor',
              }}
            >
              {project.status}
            </span>
          </div>
          <div className="text-xs opacity-60 mt-1 truncate">
            {project.slug} · sort #{project.sortOrder ?? project.priority}
            {project.subtitle ? ` · ${project.subtitle}` : ''}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => onEdit(project)}
          className="admin-btn"
          type="button"
        >
          Edit
        </button>
        <button
          onClick={() => onDeleteRequest(project)}
          className="admin-btn admin-btn--danger"
          type="button"
        >
          Delete
        </button>
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Round 30 — Projects-copy block.
// Merged from /admin/content/projects-copy so editing the section copy
// (search placeholder, focus chips, empty-state) lives next to the wanted
// wall it describes. Reads ONLY the active mode's draft; flipping the
// global mode toggle reloads this block focused on the other mode.
// ---------------------------------------------------------------------------
function ProjectsCopyBlock({ mode }: { mode: Mode }) {
  const editor = useContentEditor("projects");
  const isThor = mode === "thor";
  const draft = isThor ? editor.thor : editor.gear5;
  const focusAreas = Array.isArray(draft.focusAreas) ? (draft.focusAreas as string[]) : [];
  const bind = (field: string) => ({
    value: String(draft[field] ?? ""),
    onSave: (next: string) => editor.saveField(mode, field, next),
  });
  return (
    <section className="admin-card admin-card--inline mb-6 p-4 md:p-5">
      <h2 className="admin-card__heading">
        {isThor ? "Section copy" : "Wanted board copy"}
      </h2>
      <p className="mt-0.5 text-xs opacity-70">
        {isThor
          ? "Edit the search placeholder, focus chips, and empty state shown above the dossier list."
          : "Edit the wanted-wall pitch — search placeholder, focus chips, and empty-board notice."}
      </p>

      <div className="grid gap-3 mt-4">
        <label className="text-xs uppercase tracking-wider opacity-70">Search placeholder</label>
        <p className="text-sm">
          <InlineEdit {...bind("searchPlaceholder")} ariaLabel="Search placeholder">
            {(v) => <span>{v || "(empty — click to set)"}</span>}
          </InlineEdit>
        </p>
      </div>

      <div className="grid gap-3 mt-5">
        <label className="text-xs uppercase tracking-wider opacity-70">Focus chips (~3 works best)</label>
        <RotatingListEditor
          items={focusAreas}
          onChange={(next) => void editor.saveField(mode, "focusAreas", next)}
          placeholder={isThor ? "New realm chip…" : "New crew chip…"}
          addLabel="chip"
          max={6}
        />
      </div>

      <div className="grid gap-3 mt-5">
        <label className="text-xs uppercase tracking-wider opacity-70">Empty-state message</label>
        <p className="text-sm">
          <InlineEdit multiline {...bind("emptyState")} ariaLabel="Empty state">
            {(v) => <span>{v || "(empty — click to set)"}</span>}
          </InlineEdit>
        </p>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function ProjectsAdmin() {
  const { user } = useAuth();
  const mode = useMode();
  const isThor = mode === "thor";
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>({ ...emptyForm, createdAt: new Date().toISOString() });
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const editing = Boolean(form.id);

  // Cover upload
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverProgress, setCoverProgress] = useState(0);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [lastUploadedPath, setLastUploadedPath] = useState<string | null>(null);

  // Profile (read-only here — the editable form lives on /admin/account
  // since Round 33). We still hydrate the values so they ride along on each
  // saved project as `ownerUsername` / `ownerDisplayName`.
  const [profileUsername, setProfileUsername] = useState("");
  const [profileDisplayName, setProfileDisplayName] = useState("");

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  // Drag reorder
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [reordering, setReordering] = useState(false);

  // URL auto-fill (deliverable C)
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importToast, setImportToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  async function handleImport() {
    if (!importUrl.trim()) {
      setImportToast({ kind: "err", msg: "Paste a URL first." });
      return;
    }
    setImporting(true);
    setImportToast(null);
    try {
      const result = await importFromUrl(importUrl.trim());
      let filledCount = 0;
      setForm((prev) => {
        const merged = mergeIntoForm(prev, result.fields);
        filledCount = Object.keys(result.fields).filter((k) => {
          const key = k as keyof FormState;
          return (merged[key] as unknown) !== (prev[key] as unknown);
        }).length;
        return merged;
      });
      const warningMsg = result.warnings && result.warnings.length ? ` (${result.warnings.join("; ")})` : "";
      setImportToast({
        kind: "ok",
        msg: `Filled ${filledCount} empty field${filledCount === 1 ? "" : "s"} from ${result.source}${warningMsg}`,
      });
    } catch (e) {
      setImportToast({ kind: "err", msg: e instanceof Error ? e.message : "Import failed" });
    } finally {
      setImporting(false);
    }
  }

  // ---------------------------------------------------------------------------
  async function load() {
    setLoading(true);
    setError(null);
    try { setItems(await listProjects()); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed to load"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    let active = true;
    async function hydrateProfile(userId: string) {
      try {
        const data = await getProfile(userId);
        if (!active) return;
        setProfileUsername(data?.username ?? "");
        setProfileDisplayName(data?.display_name ?? "");
      } catch (err) {
        if (!active) return;
        console.warn("[admin] failed to load profile", err);
      }
    }
    if (user?.id) hydrateProfile(user.id);
    else { setProfileUsername(""); setProfileDisplayName(""); }
    return () => { active = false; };
  }, [user?.id]);

  // (onProfileSubmit removed in Round 33 — profile editing moved to
  // /admin/account. The hydration effect above keeps profile values in
  // local state so each saved project still embeds the right author.)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((p) =>
      [p.title, p.subtitle, p.summary, p.description, ...(p.stack ?? []), ...(p.tags ?? [])].join(" ").toLowerCase().includes(q)
    );
  }, [items, query]);

  // ---------------------------------------------------------------------------
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const stack = parseCsvList(form.stackCsv);
    const tags = parseCsvList(form.tagsCsv);
    const responsibilities = parseMultilineList(form.responsibilitiesText);
    const outcomes = parseMultilineList(form.outcomesText);
    const links = parseLinksText(form.linksText);
    const metrics = parseMetricsText(form.metricsText);

    const payload: Omit<Project, "id"> = {
      slug: form.slug.trim(), title: form.title.trim(), subtitle: form.subtitle.trim(),
      summary: form.summary.trim(), description: form.description.trim(),
      stack, tech: stack, tags, role: form.role.trim(), status: form.status,
      // Mode is always written as NULL (both modes) since the admin UI no
      // longer surfaces a mode picker. See Round 36+1.
      mode: null,
      priority: form.priority, sortOrder: form.sortOrder, featured: form.featured,
      liveUrl: form.liveUrl.trim() || undefined, repoUrl: form.repoUrl.trim() || undefined,
      coverUrl: form.coverUrl.trim(), createdAt: form.createdAt,
      heroImageAlt: form.heroImageAlt.trim() || undefined, heroVideoUrl: form.heroVideoUrl.trim() || undefined,
      gallery: form.gallery.length ? form.gallery : undefined,
      links: links.length ? links : undefined, metrics: metrics.length ? metrics : undefined,
      responsibilities: responsibilities.length ? responsibilities : undefined,
      outcomes: outcomes.length ? outcomes : undefined,
      owner: user?.id ?? null,
      ownerUsername: profileUsername || undefined, ownerDisplayName: profileDisplayName || undefined,
    };
    try {
      if (editing && form.id) {
        await updateProject(form.id, payload);
      } else {
        const id = await createProject(payload);
        setForm((f) => ({ ...f, id }));
      }
      clearProjectsCache();
      await load();
      setForm({ ...emptyForm, createdAt: new Date().toISOString() });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed (check RLS/auth)");
    }
  }

  function onEdit(p: Project) {
    setForm({
      id: p.id, slug: p.slug, title: p.title, subtitle: p.subtitle ?? "",
      summary: p.summary, description: p.description,
      stackCsv: ((p.stack && p.stack.length ? p.stack : p.tech ?? [])).join(", "),
      tagsCsv: (p.tags ?? []).join(", "), role: p.role ?? "", status: p.status,
      mode: p.mode ?? "",
      priority: p.priority, sortOrder: p.sortOrder ?? p.priority ?? 0, featured: p.featured,
      liveUrl: p.liveUrl ?? "", repoUrl: p.repoUrl ?? "", coverUrl: p.coverUrl ?? "",
      createdAt: p.createdAt, heroImageAlt: p.heroImageAlt ?? "", heroVideoUrl: p.heroVideoUrl ?? "",
      gallery: p.gallery ?? [],
      linksText: formatLinksText(p.links), metricsText: formatMetricsText(p.metrics),
      responsibilitiesText: (p.responsibilities ?? []).join("\n"), outcomesText: (p.outcomes ?? []).join("\n"),
    });
    // Round 37+1 — scroll the form (Bounty card / Identity) into view
    // instead of jumping to the very top of the page. Picks the import
    // card if present, otherwise falls back to the identity card.
    requestAnimationFrame(() => {
      const target =
        document.getElementById('card-import') ??
        document.getElementById('card-identity');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  async function confirmDelete(id: string) {
    setDeleteTarget(null);
    try {
      await deleteProject(id);
      clearProjectsCache();
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Delete failed (check RLS/auth)");
    }
  }

  // ---------------------------------------------------------------------------
  // Cover upload handler
  const handleCoverFile = useCallback(async (file: File) => {
    if (!user?.id) { setCoverError("Not authenticated"); return; }
    setCoverUploading(true);
    setCoverProgress(10);
    setCoverError(null);
    try {
      if (lastUploadedPath) {
        try { await deleteProjectCover(lastUploadedPath); } catch { /* ignore stale cover cleanup errors */ }
        setLastUploadedPath(null);
      }
      setCoverProgress(40);
      const { path, url } = await uploadProjectCover(file, user.id);
      setCoverProgress(100);
      setLastUploadedPath(path);
      setForm((f) => ({ ...f, coverUrl: url }));
    } catch (err: unknown) {
      setCoverError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setCoverUploading(false);
      setTimeout(() => setCoverProgress(0), 800);
    }
  }, [user?.id, lastUploadedPath]);

  // ---------------------------------------------------------------------------
  // Drag reorder handlers
  function handleDragStart(index: number) { dragIndexRef.current = index; }
  function handleDragOver(index: number) { setDragOverIndex(index); }
  async function handleDrop() {
    const from = dragIndexRef.current;
    const to = dragOverIndex;
    if (from == null || to == null || from === to) {
      dragIndexRef.current = null;
      setDragOverIndex(null);
      return;
    }
    const reordered = [...items];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    setItems(reordered);
    dragIndexRef.current = null;
    setDragOverIndex(null);

    // Persist
    setReordering(true);
    try {
      await reorderProjects(reordered.map((p) => p.id ?? "").filter(Boolean));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Reorder failed");
      await load(); // revert
    } finally {
      setReordering(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Build live-preview project from form state
  const previewProject: Project = useMemo(() => ({
    id: form.id ?? "preview",
    slug: form.slug || "preview",
    title: form.title || "Untitled project",
    subtitle: form.subtitle || undefined,
    summary: form.summary || "No summary yet.",
    description: form.description,
    stack: parseCsvList(form.stackCsv),
    tech: parseCsvList(form.stackCsv),
    tags: parseCsvList(form.tagsCsv),
    role: form.role || undefined,
    status: form.status,
    mode: form.mode === "" ? null : form.mode,
    priority: form.priority,
    sortOrder: form.sortOrder,
    featured: form.featured,
    liveUrl: form.liveUrl || undefined,
    repoUrl: form.repoUrl || undefined,
    coverUrl: form.coverUrl || "/seed/mjolnir-ui-kit.svg",
    createdAt: form.createdAt,
    heroImageAlt: form.heroImageAlt || undefined,
    heroVideoUrl: form.heroVideoUrl || undefined,
    gallery: form.gallery.length ? form.gallery : undefined,
    links: parseLinksText(form.linksText),
    metrics: parseMetricsText(form.metricsText),
    responsibilities: parseMultilineList(form.responsibilitiesText),
    outcomes: parseMultilineList(form.outcomesText),
    owner: user?.id ?? null,
    ownerUsername: profileUsername || undefined,
    ownerDisplayName: profileDisplayName || undefined,
  }), [form, user?.id, profileUsername, profileDisplayName]);

  // ---------------------------------------------------------------------------
  // Mode-aware shell. We keep all internal styling identical and only theme
  // the outer chrome (container background, header bar, profile card, list
  // wrapper) via a small set of admin-* classes defined at the bottom of
  // index.css. Each .admin-* class has both a --thor and --manga variant.
  return (
    <div
      className={[
        "admin-shell admin-shell--projects",
        isThor ? "admin-shell--thor" : "admin-shell--manga",
      ].join(" ")}
      data-mode-target={mode}
    >
      {/* Inner content wrapper — outer .admin-shell already centers the page
          at --page-max; we only add vertical padding here. */}
      <div className="admin-page w-full py-6">
        <AdminTopBar />
        <header className="admin-page-header mb-6">
          <p className="admin-card__eyebrow" style={{ marginBottom: "0.15rem" }}>
            {isThor ? "// COMMAND DECK" : "CAPTAIN'S LOG"}
          </p>
          <div className="admin-page-header__title-row">
            <AdminPageIcon section="projects" />
            <h1
              className="admin-card__title admin-page-header__title"
              style={{ fontSize: "clamp(1.5rem,3vw,2.1rem)", marginBottom: 0 }}
            >
              {isThor ? "Projects Dossier" : "Wanted Wall"}
            </h1>
          </div>
        </header>

      {/* Round 30 — Section copy block (search placeholder, focus chips,
          empty state). Merged from /admin/content/projects-copy so the
          surrounding copy lives next to the rows it describes. */}
      <ProjectsCopyBlock mode={mode} />

      {/* Captain's nameplate moved to /admin/account (Round 33).
          Profile fields are still consumed when saving a project (via the
          loaded `profileDisplayName` / `profileUsername` state), so the
          author byline on each project still binds to the signed-in user. */}

      {/* URL auto-fill moved INSIDE the New / Edit poster form (Round 33+1)
          as the first DossierCard, since it's a kick-off step for a new
          poster. Find the "Import from URL" / "Yank from URL" card below. */}

      {/* === Project dossier — Round 14 redesign: 7 themed cards === */}
      {/* Round 33+1 — explicit inline gap separates the form from the
          preceding "Wanted board copy" container above (Tailwind `mt-*`
          utilities weren't applying reliably in this build). */}
      <form onSubmit={onSubmit} style={{ marginTop: '2.5rem' }}>
        <header
          className="flex flex-wrap items-end justify-between gap-3"
          style={{ marginBottom: '2rem' }}
        >
          <div>
            <h2 className="admin-card__heading">
              {editing
                ? (isThor ? "Edit dossier" : "Edit poster")
                : (isThor ? "New dossier" : "Print new poster")}
            </h2>
            <p className="mt-1 text-xs opacity-70">
              Fill in manually or start from a smart preset.
            </p>
          </div>
          {/* Presets */}
          <div className="flex flex-wrap gap-2 max-w-full">
            {SUGGESTION_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                title={preset.description}
                className="admin-chip"
                onClick={() => {
                  setForm((prev) => {
                    const next = { ...prev };
                    (Object.entries(preset.fields) as Array<[keyof FormState, FormState[keyof FormState]]>).forEach(([k, v]) => {
                      if (v !== undefined) (next as Record<string, unknown>)[k] = v;
                    });
                    if (!next.slug && preset.fields.title) next.slug = preset.fields.slug ?? slugify(preset.fields.title as string);
                    return next;
                  });
                }}
              >
                {preset.label}
              </button>
            ))}
            <button
              type="button"
              className="admin-chip"
              onClick={() => setForm((p) => p.title.trim() ? { ...p, slug: slugify(p.title) } : p)}
            >
              Auto slug
            </button>
          </div>
        </header>

        <div className="dossier-cards">
          {/* === 0. Import from URL (kick-off step) ===
              Paste a repo / live URL and let the import service pre-fill
              every empty field on the rest of the form. */}
          <DossierCard
            id="card-import"
            title={isThor ? "Import from URL" : "Yank from URL"}
            badge="🌐"
          >
            <p className="text-xs opacity-70 -mt-1">
              Paste a GitHub repo, Vercel app, or any URL with OG tags —
              only empty fields below will be filled.
            </p>
            <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-end">
              <AdminInput
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                placeholder="https://github.com/owner/repo"
                aria-label="URL to import from"
                disabled={importing}
              />
              <button
                type="button"
                className="admin-cta admin-cta--primary"
                disabled={importing}
                aria-busy={importing}
                onClick={handleImport}
                style={{ whiteSpace: 'nowrap' }}
              >
                {importing ? "Fetching…" : "Fetch ↩"}
              </button>
            </div>
            {importToast && (
              <p
                className={["mt-2 text-xs", importToast.kind === "ok" ? "text-emerald-300" : "text-rose-300"].join(" ")}
                role={importToast.kind === "err" ? "alert" : "status"}
              >
                {importToast.msg}
              </p>
            )}
          </DossierCard>

          {/* === 1. Identity card === */}
          <DossierCard
            id="card-identity"
            title={isThor ? "Identity" : "Bounty card"}
            badge="🪪"
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <AdminField label="Title">
                <AdminInput
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  onBlur={() => { if (!form.slug.trim() && form.title.trim()) setForm((p) => ({ ...p, slug: slugify(p.title) })); }}
                />
              </AdminField>
              <AdminField label="Slug">
                <AdminInput required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
              </AdminField>
              <AdminField label="Subtitle" className="md:col-span-2">
                <AdminInput value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
              </AdminField>
              <AdminField label="Status">
                <AdminSelect value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ProjectStatus })}>
                  <option value="draft">Draft</option>
                  <option value="in-progress">In progress</option>
                  <option value="shipped">Shipped</option>
                  <option value="archived">Archived</option>
                </AdminSelect>
              </AdminField>
              {/* Mode field removed in Round 36+1 — every project published
                  via this admin lives in BOTH modes by default. The form
                  still tracks `form.mode = ""` so the save payload writes
                  NULL (mode-neutral) into the DB. */}
              <AdminField label="Featured" asDiv>
                <div className="mt-2 flex items-center gap-2">
                  <AdminCheckbox checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
                  <span className="text-xs opacity-70">Surface in featured carousels</span>
                </div>
              </AdminField>
              <AdminField label="Sort order" hint="Lower = first on projects page. Also drag-to-reorder below.">
                <AdminInput type="number" min={0} value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
              </AdminField>
              <AdminField label="Priority">
                <AdminInput type="number" min={0} value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} />
              </AdminField>
            </div>
          </DossierCard>

          {/* === 2. Story card === */}
          <DossierCard
            id="card-story"
            title={isThor ? "Story" : "Tale of the bounty"}
            badge="📖"
          >
            <div className="grid grid-cols-1 gap-3">
              <AdminField label="Summary">
                <AdminTextarea rows={2} required value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
              </AdminField>
              <AdminField label="Description">
                <AdminTextarea rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </AdminField>
            </div>
          </DossierCard>

          {/* === 3. Stack & Tags card === */}
          <DossierCard
            id="card-stack"
            title={isThor ? "Stack & Tags" : "Crew & flag"}
            badge="🧰"
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <AdminField
                label="Stack"
                hint="Pick from the list, type a custom name, or click Fetch above to auto-fill from a GitHub repo (uses the full /languages breakdown)."
                className="md:col-span-2"
              >
                <ChipSelect
                  value={form.stackCsv}
                  options={STACK_OPTIONS}
                  placeholder="Pick or type to add — React, TypeScript, …"
                  onChange={(csv) => setForm((prev) => ({ ...prev, stackCsv: csv }))}
                  ariaLabel="Stack"
                />
              </AdminField>
              <AdminField label="Tags" className="md:col-span-2">
                <ChipSelect
                  value={form.tagsCsv}
                  options={TAG_OPTIONS}
                  placeholder="Pick or type to add — saas, product, …"
                  onChange={(csv) => setForm((prev) => ({ ...prev, tagsCsv: csv }))}
                  ariaLabel="Tags"
                />
              </AdminField>
              <AdminField label="Role">
                <AdminInput value={form.role} list="role-options" onChange={(e) => setForm({ ...form, role: e.target.value })} />
              </AdminField>
              <AdminField label="Created at">
                <AdminInput
                  type="datetime-local"
                  value={form.createdAt ? form.createdAt.slice(0, 16) : ""}
                  onChange={(e) => setForm({ ...form, createdAt: e.target.value ? new Date(e.target.value).toISOString() : form.createdAt })}
                />
              </AdminField>
            </div>
          </DossierCard>

          {/* === 4. Cover & Live Preview card === */}
          <DossierCard
            id="card-cover"
            title={isThor ? "Cover & Live Preview" : "Poster art"}
            badge="🖼️"
          >
            <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
              <div className="grid grid-cols-1 gap-3">
                <ImageUploadZone
                  label="Cover image"
                  previewUrl={form.coverUrl}
                  onFile={handleCoverFile}
                  uploading={coverUploading}
                  uploadProgress={coverProgress}
                  uploadError={coverError}
                  hint="Drag & drop or click. Max 4MB. Paste a URL below instead."
                />
                <AdminInput
                  placeholder="Or paste an image URL"
                  value={form.coverUrl}
                  onChange={(e) => setForm({ ...form, coverUrl: e.target.value })}
                />
                <AdminField label="Hero image alt text">
                  <AdminInput
                    value={form.heroImageAlt}
                    onChange={(e) => setForm({ ...form, heroImageAlt: e.target.value })}
                    placeholder="Describe the cover image"
                  />
                </AdminField>
                <AdminField label="Hero video URL (optional)">
                  <AdminInput
                    value={form.heroVideoUrl}
                    onChange={(e) => setForm({ ...form, heroVideoUrl: e.target.value })}
                    placeholder="https://cdn.example.com/hero.mp4"
                  />
                </AdminField>
                <GalleryUploader
                  gallery={form.gallery}
                  onAdd={(url) => setForm((f) => ({ ...f, gallery: [...f.gallery, url] }))}
                  onRemove={(url) => setForm((f) => ({ ...f, gallery: f.gallery.filter((u) => u !== url) }))}
                  userId={user?.id}
                />
              </div>
              <aside aria-label="Wanted poster preview" className="lg:sticky lg:top-6 lg:self-start">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest opacity-60">
                  Live preview
                </p>
                <div className="scale-90 origin-top-left">
                  <ProjectCard project={previewProject} index={0} />
                </div>
              </aside>
            </div>
          </DossierCard>

          {/* === 5. Links card === */}
          <DossierCard
            id="card-links"
            title={isThor ? "Links" : "Trail markers"}
            badge="🔗"
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <AdminField label="Live URL (optional)">
                <AdminInput value={form.liveUrl} onChange={(e) => setForm({ ...form, liveUrl: e.target.value })} />
              </AdminField>
              <AdminField label="Repo URL">
                <AdminInput value={form.repoUrl} onChange={(e) => setForm({ ...form, repoUrl: e.target.value })} />
              </AdminField>
              <div className="md:col-span-2">
                <p className="admin-field__label" style={{ marginBottom: '.35rem' }}>
                  Additional links
                </p>
                <p className="text-[11px] opacity-65 mb-2">
                  Format: <code>Label | URL | optional-icon</code> — one per line
                </p>
                <AdminTextarea
                  rows={3}
                  value={form.linksText}
                  onChange={(e) => setForm({ ...form, linksText: e.target.value })}
                  placeholder={"Case study | https://...\nDribbble | https://... | dribbble"}
                  className="font-mono"
                />
              </div>
            </div>
          </DossierCard>

          {/* === 6. Outcomes card (collapsed by default) === */}
          <DossierCard
            id="card-outcomes"
            title={isThor ? "Outcomes" : "Treasure tally"}
            badge="🎯"
            defaultOpen={false}
          >
            <div className="grid grid-cols-1 gap-3">
              <div>
                <p className="admin-field__label" style={{ marginBottom: '.35rem' }}>
                  Metrics
                </p>
                <p className="text-[11px] opacity-65 mb-2">
                  Format: <code>Label | Value</code> — one per line
                </p>
                <AdminTextarea
                  rows={3}
                  value={form.metricsText}
                  onChange={(e) => setForm({ ...form, metricsText: e.target.value })}
                  placeholder={"MRR | $18k\nLatency | <60ms"}
                  className="font-mono"
                />
              </div>
              <AdminField label="Responsibilities (one per line)">
                <AdminTextarea
                  rows={3}
                  value={form.responsibilitiesText}
                  onChange={(e) => setForm({ ...form, responsibilitiesText: e.target.value })}
                />
              </AdminField>
              <AdminField label="Outcomes (one per line)">
                <AdminTextarea
                  rows={3}
                  value={form.outcomesText}
                  onChange={(e) => setForm({ ...form, outcomesText: e.target.value })}
                />
              </AdminField>
            </div>
          </DossierCard>

          {/* === 7. Ownership card (collapsed by default) === */}
          <DossierCard
            id="card-ownership"
            title={isThor ? "Ownership" : "Captain on file"}
            badge="🛡️"
            defaultOpen={false}
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <AdminField label="Owner UUID" hint="Defaults to your auth user id.">
                <AdminInput value={user?.id ?? ''} readOnly disabled />
              </AdminField>
              <AdminField label="Owner email">
                <AdminInput value={user?.email ?? ''} readOnly disabled />
              </AdminField>
              <AdminField label="Owner display name">
                <AdminInput value={profileDisplayName || '—'} readOnly disabled />
              </AdminField>
              <AdminField label="Owner username">
                <AdminInput value={profileUsername || '—'} readOnly disabled />
              </AdminField>
              <p className="text-xs opacity-65 md:col-span-2">
                These come from your captain profile. Edit them on{' '}
                <a href="/admin/account" style={{ textDecoration: 'underline' }}>
                  /admin/account
                </a>{' '}
                — they automatically ride along with every project you save.
              </p>
            </div>
          </DossierCard>
        </div>

        {/* Datalists for autocomplete */}
        <datalist id="stack-options">{STACK_OPTIONS.map((o) => <option value={o} key={o} />)}</datalist>
        <datalist id="tag-options">{TAG_OPTIONS.map((o) => <option value={o} key={o} />)}</datalist>
        <datalist id="role-options">{ROLE_OPTIONS.map((o) => <option value={o} key={o} />)}</datalist>

        {/* Sticky save bar */}
        <div className="dossier-save-bar">
          {error && (
            <p className="text-sm text-rose-400 mr-auto" role="alert">
              {error}
            </p>
          )}
          {editing && (
            <button
              type="button"
              onClick={() => { setForm({ ...emptyForm, createdAt: new Date().toISOString() }); setLastUploadedPath(null); }}
              className="admin-btn"
            >
              Cancel
            </button>
          )}
          <button type="submit" className="admin-cta admin-cta--primary">
            {editing ? "Save changes" : "Create project"}
          </button>
        </div>
      </form>

      {/* ---- Project list with drag-to-reorder ---- */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="admin-card__heading">
          {isThor ? "All dossiers" : "All wanted posters"}
          {reordering && (
            <span className="ml-2 text-xs opacity-70">Saving order…</span>
          )}
        </h2>
        <input
          type="search"
          placeholder={isThor ? "Filter dossiers…" : "Filter posters…"}
          className="admin-field__input w-64"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Filter projects"
        />
      </div>
      <p className="mt-1 text-xs opacity-50">
        Drag rows to reorder. Sort order is saved automatically.
      </p>

      <ul className="admin-list mt-3 divide-y rounded-2xl" role="list">
        {loading ? (
          <li className="p-4 text-sm opacity-70">Loading…</li>
        ) : filtered.length ? (
          filtered.map((p, index) => (
            <DraggableProjectItem
              key={p.id}
              project={p}
              index={index}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onEdit={onEdit}
              onDeleteRequest={(proj) => setDeleteTarget(proj)}
              isDraggingOver={dragOverIndex === index}
            />
          ))
        ) : (
          <li className="p-4 text-sm opacity-70" role="listitem">No projects found.</li>
        )}
      </ul>

      {/* Confirm delete dialog */}
      {deleteTarget && (
        <ConfirmDeleteDialog
          projectTitle={deleteTarget.title}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteTarget.id && confirmDelete(deleteTarget.id)}
        />
      )}
      </div>
    </div>
  );
}
