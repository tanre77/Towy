import type { DropShop } from "./model";
import { milesBetween } from "./model";

export type DropPick = { shop: DropShop; miles: number | null };

type Hit = { name: string; rating: number; address: string; kind: DropShop["kind"] };

const cache = new Map<string, DropPick | null>();

function cacheKey(lat: number, lng: number) {
  return `${lat.toFixed(2)},${lng.toFixed(2)}`;
}

function parseCard(text: string): Hit | null {
  const parts = text
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);
  const name = parts[0];
  const ratingPart = parts.find((part) => /^\d\.\d$/.test(part));
  const place = parts.find((part) => /tire shop|auto repair|car repair/i.test(part));
  if (!name || !ratingPart || !place) return null;
  const address = place
    .split("·")
    .map((part) => part.trim())
    .filter((part) => part.length > 3 && !/tire shop|auto repair|car repair/i.test(part))
    .pop();
  if (!address) return null;
  return {
    name,
    rating: Number(ratingPart),
    address,
    kind: /tire/i.test(place) ? "tire" : "repair",
  };
}

async function geocode(address: string, lat: number, lng: number): Promise<{ lat: number; lng: number } | null> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", address);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  const span = 0.35;
  url.searchParams.set("viewbox", `${lng - span},${lat + span},${lng + span},${lat - span}`);
  const response = await fetch(url, {
    headers: { "User-Agent": "shoulder-dispatch/1.0 (roadside drop)" },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) return null;
  const rows = (await response.json()) as { lat?: string; lon?: string }[];
  const row = rows[0];
  if (!row?.lat || !row.lon) return null;
  return { lat: Number(row.lat), lng: Number(row.lon) };
}

export async function lookupDrop(lat: number, lng: number): Promise<DropPick | null> {
  const key = cacheKey(lat, lng);
  if (cache.has(key)) return cache.get(key) ?? null;

  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const url = `https://www.google.com/maps/search/tire+shop+or+auto+repair/@${lat},${lng},13z`;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 });
    await page.locator('div[role="article"]').first().waitFor({ timeout: 12000 });
    const cards = await page.locator('div[role="article"]').evaluateAll((nodes) =>
      nodes.slice(0, 8).map((node) => (node as HTMLElement).innerText.replace(/\n+/g, " | ")),
    );
    const hits = cards.map(parseCard).filter((hit): hit is Hit => Boolean(hit));
    const high = hits.filter((hit) => hit.rating >= 4.5);
    const pool = (high.length ? high : hits).slice(0, 4);
    if (!pool.length) return null;
    let best: DropPick | null = null;
    for (const hit of pool) {
      const point = await geocode(hit.address, lat, lng);
      const miles = point ? Math.round(milesBetween(lat, lng, point.lat, point.lng) * 10) / 10 : null;
      const shop: DropShop = {
        id: `${hit.name}-${hit.address}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 48),
        name: hit.name,
        address: hit.address,
        lat: point?.lat ?? lat,
        lng: point?.lng ?? lng,
        rating: hit.rating,
        reviews: 0,
        kind: hit.kind,
      };
      const pick = { shop, miles };
      if (!best || (miles != null && (best.miles == null || miles < best.miles))) best = pick;
      if (best && miles != null && miles <= 1) break;
    }
    cache.set(key, best);
    return best;
  } finally {
    await browser.close();
  }
}
