# Themed Seed Projects

Six placeholder projects for the Thor / Gear 5 dual-mode portfolio. They are
ready to render immediately after the seed SQL is applied — no Supabase Storage
uploads needed (cover images are served from `public/seed/`). Replace each row
via the admin UI as real projects ship.

---

## How to run

### Option A — Supabase SQL Editor (easiest)

1. Open your Supabase project dashboard.
2. Go to **SQL Editor** in the left sidebar.
3. Paste the entire contents of `supabase/seed/001_themed_projects.sql`.
4. Click **Run**.

The seed uses `INSERT … ON CONFLICT (slug) DO UPDATE SET`, so it is safe to
run multiple times — subsequent runs update existing rows rather than creating
duplicates.

### Option B — psql CLI

```bash
psql -h <db-host> \
     -U postgres \
     -d postgres \
     -f supabase/seed/001_themed_projects.sql
```

Replace `<db-host>` with the host from **Project Settings → Database** in the
Supabase dashboard. The password prompt will appear; use the database password
shown in the same settings panel.

### Option C — Supabase CLI (if configured locally)

If you have `supabase` CLI initialised and linked to your project, you can
point `psql` at the environment variable the CLI exposes:

```bash
psql "$SUPABASE_DB_URL" -f supabase/seed/001_themed_projects.sql
```

Or run a full local reset (which applies all files in `supabase/seed/` in
alphabetical order):

```bash
supabase db reset
```

---

## How to claim ownership

All seeded rows use a sentinel owner UUID:

```
00000000-0000-0000-0000-000000000000
```

After running the seed, replace the sentinel with your real Supabase Auth UID:

```sql
UPDATE projects
   SET owner = '<your-auth-uid>'
 WHERE owner = '00000000-0000-0000-0000-000000000000';
```

Find your Auth UID in **Supabase Dashboard → Authentication → Users**. Click
your user row and copy the UUID from the **User UID** column.

Run this UPDATE in the SQL Editor or via psql — it is safe to run even if you
have already replaced the owner on some rows (it will only touch remaining
sentinel rows).

---

## How to replace covers

Placeholder covers live at `public/seed/<slug>.webp` and are served as static
assets by the dev server and production build. There are two ways to replace
them:

### Drop-in replacement (static asset)

Overwrite the file at the same path with your final image:

```
public/seed/mjolnir-ui-kit.webp
public/seed/bifrost-analytics.webp
public/seed/gear-5-design-system.webp
public/seed/den-den-mushi-realtime.webp
public/seed/asgard-ecommerce.webp
public/seed/wano-cms.webp
```

Recommended dimensions: **1280 x 720 px** WebP at 80–90 % quality.
The path `/seed/<slug>.webp` is already stored in the `cover_url` column, so
no SQL update is needed.

### Supabase Storage upload (admin UI)

1. Go to `/admin/projects` in the portfolio app.
2. Open the project you want to update.
3. Use the cover image upload field to select and upload a new image.
4. The admin UI will upload to Supabase Storage and update the `cover_url`
   column to the Supabase Storage public URL automatically.

Once `cover_url` points to a Supabase Storage URL the static file in
`public/seed/` is no longer used for that project, so you can delete it or
leave it in place — it has no effect.

---

## Regenerating placeholder covers

If you need to regenerate the WebP placeholder files (e.g., after customising
the colour themes in `scripts/seed-covers.mjs`):

```bash
node scripts/seed-covers.mjs
```

`sharp` is already installed as a dev dependency. The script is idempotent and
will overwrite existing files.
