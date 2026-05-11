/**
 * src/features/admin-mcp/mcpCatalog.ts
 *
 * Hardcoded allowlist of MCP servers used by this project. Intentionally
 * NOT parsed from .mcp.json so secrets in that file (now or future) never
 * leak into rendered HTML. Adding a server is a deliberate code edit.
 *
 * Each entry exposes ONLY safe-to-display public metadata:
 *   - id                — short slug
 *   - label             — mode-aware display name
 *   - category          — grouping ("Database · Auth · Storage")
 *   - purpose           — single-sentence description
 *   - docsUrl           — public documentation link
 *   - publicProjectRef  — already visible in supabase URLs
 *   - checkStatus       — optional async health probe (no secrets emitted)
 *
 * No service_role keys. No anon-key strings (the supabase client already
 * carries one in memory; we never render or log it). No JWTs.
 */

import { supabase } from '../../lib/supabase';

export type McpStatus = 'ok' | 'degraded' | 'down' | 'pending';

export type McpServer = {
  id: string;
  label: { thor: string; gear5: string };
  category: string;
  purpose: string;
  docsUrl: string;
  /** Public project ref (already visible in the supabase URL). */
  publicProjectRef?: string;
  /** Returns 'ok' | 'degraded' | 'down'. Reuses existing browser client. */
  checkStatus?: () => Promise<Exclude<McpStatus, 'pending'>>;
};

async function checkSupabase(): Promise<Exclude<McpStatus, 'pending'>> {
  try {
    const start = Date.now();
    const { error } = await supabase.from('projects').select('id').limit(1);
    const elapsed = Date.now() - start;
    if (error) return 'down';
    if (elapsed > 1500) return 'degraded';
    return 'ok';
  } catch {
    return 'down';
  }
}

export const MCP_CATALOG: ReadonlyArray<McpServer> = [
  {
    id: 'supabase',
    label: { thor: 'Supabase', gear5: 'Den Den Database' },
    category: 'Database · Auth · Storage',
    purpose:
      'Project DB, RLS-gated content CMS, admin allowlist, file storage.',
    docsUrl: 'https://supabase.com/docs',
    publicProjectRef: 'cntfovazycoilrxqkquy',
    checkStatus: checkSupabase,
  },
];
