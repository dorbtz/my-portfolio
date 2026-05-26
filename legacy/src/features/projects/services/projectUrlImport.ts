/**
 * Client-side helper that calls the `parse-url` Supabase edge function.
 *
 * Pure helpers (`mergeIntoForm`, `mapToFormState`, `detectUrlSource`,
 * `isPrivateUrl`) live in `./projectUrlImport.parser` and are re-exported
 * here so callers can import everything from one path. Keeping them in a
 * leaf module also lets the Vitest tests skip the Supabase client transform.
 */
import { supabase } from "../../../shared/lib/supabase";
import type { FormState } from "../admin/ProjectsAdmin";
import {
  detectUrlSource,
  isPrivateUrl,
  mapToFormState,
  mergeIntoForm,
} from "./projectUrlImport.parser";
import type { ImportSource } from "./projectUrlImport.parser";

export type { ImportSource };

export type ParseUrlResponse = {
  source: ImportSource;
  fields: Partial<FormState>;
  warnings?: string[];
  raw?: Record<string, unknown>;
};

export type ImportResult = ParseUrlResponse;

// Re-export pure helpers for convenience — keeps the call site uncluttered.
export { detectUrlSource, isPrivateUrl, mapToFormState, mergeIntoForm };

const DEFAULT_TIMEOUT_MS = 15_000;

export async function importFromUrl(
  url: string,
  options: { timeoutMs?: number } = {},
): Promise<ImportResult> {
  if (!url || !url.trim()) {
    throw new Error("Paste a URL first.");
  }
  if (isPrivateUrl(url)) {
    throw new Error("That URL points to a private/internal address — refusing to fetch.");
  }
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const { data, error } = await supabase.functions.invoke<ParseUrlResponse>("parse-url", {
      body: { url },
      // The Supabase JS client passes options.signal through to fetch when
      // available; if the version in use ignores it, the AbortController
      // still aborts the in-flight Promise via the catch below.
      ...({ signal: controller.signal } as Record<string, unknown>),
    });
    if (error) {
      throw new Error(error.message || "URL import failed");
    }
    if (!data) {
      throw new Error("URL import returned no data");
    }
    return data as ImportResult;
  } catch (err) {
    if (controller.signal.aborted) {
      throw new Error("URL import timed out — try again.");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
