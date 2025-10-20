type Pool = { el: HTMLAudioElement; busy: boolean }[];
const pools = new Map<string, Pool>();

function getPool(src: string, size = 3): Pool {
  if (pools.has(src)) return pools.get(src)!;
  const p: Pool = Array.from({ length: size }, () => {
    const el = new Audio(src);
    el.preload = "auto";
    el.addEventListener("ended", () => (item.busy = false));
    const item = { el, busy: false };
    return item;
  });
  pools.set(src, p);
  return p;
}

export function playSfx(src: string, volume = 0.25) {
  if (typeof window === "undefined") return;
  const pool = getPool(src);
  const item = pool.find((x) => !x.busy) ?? pool[0];
  item.busy = true;
  item.el.currentTime = 0;
  item.el.volume = volume;
  item.el.play().catch(() => { item.busy = false; });
}
