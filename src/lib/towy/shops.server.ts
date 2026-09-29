import type { DropShop } from "./model";
import { milesBetween } from "./model";

export type DropPick = { shop: DropShop; miles: number | null };

type Element = {
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

const cache = new Map<string, DropPick>();

function cacheKey(lat: number, lng: number) {
  return `${lat.toFixed(2)},${lng.toFixed(2)}`;
}

function pointOf(el: Element): { lat: number; lng: number } | null {
  if (typeof el.lat === "number" && typeof el.lon === "number") return { lat: el.lat, lng: el.lon };
  if (el.center) return { lat: el.center.lat, lng: el.center.lon };
  return null;
}

function addressOf(tags: Record<string, string>): string {
  if (tags["addr:full"]) return tags["addr:full"];
  const street = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ");
  const city = tags["addr:city"];
  return [street, city].filter(Boolean).join(", ");
}

export async function lookupDrop(lat: number, lng: number): Promise<DropPick | null> {
  const key = cacheKey(lat, lng);
  const cached = cache.get(key);
  if (cached) return cached;

  const query = `[out:json][timeout:12];(nwr(around:12000,${lat},${lng})["shop"="tyres"];nwr(around:12000,${lat},${lng})["shop"="car_repair"];);out center 20;`;
  let elements: Element[] = [];
  try {
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "shoulder-dispatch/1.0 (roadside drop)",
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) return null;
    const json = (await response.json()) as { elements?: Element[] };
    elements = json.elements ?? [];
  } catch {
    return null;
  }

  let best: DropPick | null = null;
  for (const el of elements) {
    const tags = el.tags ?? {};
    const name = tags.name?.trim();
    const point = pointOf(el);
    if (!name || !point) continue;
    const miles = Math.round(milesBetween(lat, lng, point.lat, point.lng) * 10) / 10;
    const kind = tags.shop === "tyres" ? "tire" : "repair";
    const shop: DropShop = {
      id: `${kind}-${el.id}`,
      name,
      address: addressOf(tags) || "Near this phone",
      lat: point.lat,
      lng: point.lng,
      rating: 0,
      reviews: 0,
      kind,
    };
    const pick = { shop, miles };
    const tireBias = kind === "tire" ? -0.4 : 0;
    const score = miles + tireBias;
    const bestScore = best?.miles == null ? Infinity : best.miles + (best.shop.kind === "tire" ? -0.4 : 0);
    if (!best || score < bestScore) best = pick;
  }
  if (!best) return null;
  cache.set(key, best);
  return best;
}
