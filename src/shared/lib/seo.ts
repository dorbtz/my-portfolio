function upsertMeta(selector: string, attrs: Record<string, string>) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    document.head.appendChild(el);
  }
  Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v));
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function setPageMeta(opts: {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}) {
  const title = opts.title ?? document.title;
  const description =
    opts.description ?? document.head.querySelector<HTMLMetaElement>('meta[name="description"]')?.content ?? "";
  const image = opts.image ?? "";
  const url = opts.url ?? (typeof window !== "undefined" ? window.location.href : "");

  document.title = title;

  upsertMeta('meta[name="description"]', { name: "description", content: description });

  // Open Graph
  upsertMeta('meta[property="og:title"]', { property: "og:title", content: title });
  upsertMeta('meta[property="og:description"]', { property: "og:description", content: description });
  if (image) upsertMeta('meta[property="og:image"]', { property: "og:image", content: image });
  if (url) upsertMeta('meta[property="og:url"]', { property: "og:url", content: url });
  upsertMeta('meta[property="og:type"]', { property: "og:type", content: "website" });

  // Twitter
  upsertMeta('meta[name="twitter:card"]', { name: "twitter:card", content: image ? "summary_large_image" : "summary" });
  upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: title });
  upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: description });
  if (image) upsertMeta('meta[name="twitter:image"]', { name: "twitter:image", content: image });

  // Canonical
  if (url) upsertLink("canonical", url);
}
