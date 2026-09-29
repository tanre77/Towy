import { carColorHex, truckPoint, type Job } from "@/lib/towy/model";
import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

type Pin = { id: string; name: string; lat: number; lng: number };
type Car = { lat: number; lng: number; color?: string; plate?: string; model?: string };
type Truck = { lat: number; lng: number } | null;

function bodyOf(model: string | undefined): "compact" | "sedan" | "truck" | "crossover" | "jeep" {
  const name = (model ?? "").toLowerCase();
  if (name.includes("f-150") || name.includes("f150")) return "truck";
  if (name.includes("wrangler")) return "jeep";
  if (name.includes("model y") || name.includes("model 3")) return "crossover";
  if (name.includes("camry")) return "sedan";
  return "compact";
}

function glyph(model: string | undefined, color: string | undefined): string {
  const fill = carColorHex(color);
  const ink = `fill="${fill}" stroke="#F2F4F6" stroke-width="1.4" stroke-linejoin="round"`;
  const glass = `fill="#0E1014" fill-opacity="0.45"`;
  if (bodyOf(model) === "truck") {
    return `<svg width="30" height="50" viewBox="0 0 30 50" aria-hidden="true"><path d="M6 8c0-4 3.5-6 9-6s9 2 9 6v14H6V8z" ${ink}/><path d="M8 9h14l1 7H7z" ${glass}/><path d="M4 24h22v16c0 4-2.2 6-5 6H9c-2.8 0-5-2-5-6V24z" ${ink}/><path d="M7 28h16v12H7z" ${glass}/></svg>`;
  }
  if (bodyOf(model) === "jeep") {
    return `<svg width="30" height="50" viewBox="0 0 30 50" aria-hidden="true"><path d="M5 6h20v30c0 2-1.5 3-3 3H8c-1.5 0-3-1-3-3V6z" ${ink}/><path d="M8 9h14v8H8z" ${glass}/><path d="M8 22h14v6H8z" ${glass}/><circle cx="15" cy="43" r="5" ${ink}/></svg>`;
  }
  if (bodyOf(model) === "crossover") {
    return `<svg width="28" height="46" viewBox="0 0 28 46" aria-hidden="true"><path d="M7 9C7 3 10 1 14 1s7 2 7 8v24c0 6-3 10-7 10s-7-4-7-10V9z" ${ink}/><path d="M9 10h10l1 14H8z" ${glass}/></svg>`;
  }
  if (bodyOf(model) === "sedan") {
    return `<svg width="24" height="46" viewBox="0 0 24 46" aria-hidden="true"><path d="M6 8C6 3 8.5 1 12 1s6 2 6 7l1 24c0 6-2.5 10-7 10S5 38 5 32L6 8z" ${ink}/><path d="M8 9h8l.6 7H7.4z" ${glass}/><path d="M7.2 28h9.6l.4 6H6.8z" ${glass}/></svg>`;
  }
  return `<svg width="22" height="36" viewBox="0 0 22 36" aria-hidden="true"><path d="M5.5 7C5.5 3 8 1.5 11 1.5S16.5 3 16.5 7L17 24c0 5-2.4 8-6 8s-6-3-6-8L5.5 7z" ${ink}/><path d="M7.5 8h7l.5 6H7z" ${glass}/><path d="M7 22h8l.4 4H6.6z" ${glass}/></svg>`;
}

function pinHtml(car: Car): string {
  const plate = (car.plate ?? "").replace(/[<>&"]/g, "").trim();
  const plateHtml = plate ? `<div class="car-plate">${plate}</div>` : "";
  return `<div class="car-mark"><div class="car-glyph">${glyph(car.model, car.color)}</div>${plateHtml}</div>`;
}

export function CarMap({ car, pins, truck = null }: { car: Car; pins: Pin[]; truck?: Truck }) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const carRef = useRef<import("leaflet").Marker | null>(null);
  const truckRef = useRef<import("leaflet").Marker | null>(null);
  const truckLive = useRef(truck);
  const pinsRef = useRef<import("leaflet").Marker[]>([]);
  const pinsLive = useRef(pins);
  const carLive = useRef(car);
  pinsLive.current = pins;
  carLive.current = car;
  truckLive.current = truck;

  useEffect(() => {
    const node = el.current;
    if (!node) return;
    let dead = false;
    void import("leaflet").then((L) => {
      if (dead || mapRef.current) return;
      const here = carLive.current;
      const map = L.map(node, { zoomControl: false, attributionControl: true }).setView([here.lat, here.lng], 12);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);
      carRef.current = L.marker([here.lat, here.lng], {
        icon: L.divIcon({ className: "", html: pinHtml(here), iconSize: [72, 44], iconAnchor: [36, 14] }),
        zIndexOffset: 1000,
        title: here.plate?.trim() || "Your car",
      }).addTo(map);
      mapRef.current = map;
      const latest = carLive.current;
      carRef.current.setLatLng([latest.lat, latest.lng]);
      map.setView([latest.lat, latest.lng], 12);
      drawPins(L, map);
      const rolling = truckLive.current;
      if (rolling) {
        truckRef.current = L.marker([rolling.lat, rolling.lng], {
          icon: L.divIcon({ className: "", html: `<div class="truck-pin"></div>`, iconSize: [22, 14], iconAnchor: [11, 7] }),
          zIndexOffset: 900,
          title: "Tow truck",
        }).addTo(map);
        map.fitBounds(
          [
            [latest.lat, latest.lng],
            [rolling.lat, rolling.lng],
          ],
          { padding: [36, 36], maxZoom: 13, animate: false },
        );
      }
      requestAnimationFrame(() => map.invalidateSize());
    });
    return () => {
      dead = true;
      pinsRef.current = [];
      carRef.current = null;
      truckRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // The map is created once. Later effects move the car and the pins.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const marker = carRef.current;
    if (!map || !marker) return;
    marker.setLatLng([car.lat, car.lng]);
    map.panTo([car.lat, car.lng], { animate: true });
    void import("leaflet").then((L) => {
      carRef.current?.setIcon(
        L.divIcon({ className: "", html: pinHtml(car), iconSize: [72, 44], iconAnchor: [36, 14] }),
      );
    });
  }, [car.lat, car.lng, car.color, car.plate, car.model]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    void import("leaflet").then((L) => {
      const here = truckLive.current;
      if (!here) {
        truckRef.current?.remove();
        truckRef.current = null;
        return;
      }
      if (!truckRef.current) {
        truckRef.current = L.marker([here.lat, here.lng], {
          icon: L.divIcon({ className: "", html: `<div class="truck-pin"></div>`, iconSize: [22, 14], iconAnchor: [11, 7] }),
          zIndexOffset: 900,
          title: "Tow truck",
        }).addTo(map);
        const carHere = carLive.current;
        map.fitBounds(
          [
            [carHere.lat, carHere.lng],
            [here.lat, here.lng],
          ],
          { padding: [36, 36], maxZoom: 13, animate: false },
        );
      } else {
        truckRef.current.setLatLng([here.lat, here.lng]);
      }
    });
  }, [truck?.lat, truck?.lng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    void import("leaflet").then((L) => {
      if (mapRef.current) drawPins(L, mapRef.current);
    });
  }, [pins]);

  function drawPins(L: typeof import("leaflet"), map: import("leaflet").Map) {
    pinsRef.current.forEach((marker) => marker.remove());
    pinsRef.current = pinsLive.current.map((pin) =>
      L.marker([pin.lat, pin.lng], {
        icon: L.divIcon({ className: "", html: `<div class="shop-pin"></div>`, iconSize: [12, 12], iconAnchor: [6, 6] }),
        title: pin.name,
      })
        .bindTooltip(pin.name, { direction: "top", offset: [0, -8] })
        .addTo(map),
    );
  }

  return <div ref={el} className="car-map" role="img" aria-label="Map with your car" />;
}

export function useTruckSpot(job: Job | null) {
  const [now, setNow] = useState(() => Date.now());
  const moving = job?.status === "enroute" || job?.status === "checked";
  useEffect(() => {
    if (!moving) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [moving, job?.id, job?.acceptedAt]);
  if (!job) return null;
  return truckPoint(job, now);
}
