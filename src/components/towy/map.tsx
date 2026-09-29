import { carColorHex } from "@/lib/towy/model";
import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

type Pin = { id: string; name: string; lat: number; lng: number };
type Car = { lat: number; lng: number; color?: string; plate?: string };

function pinHtml(car: Car): string {
  const plate = (car.plate ?? "").replace(/[<>&"]/g, "").trim();
  const plateHtml = plate ? `<div class="car-plate">${plate}</div>` : "";
  return `<div class="car-mark"><div class="car-pin" style="background:${carColorHex(car.color)}"></div>${plateHtml}</div>`;
}

export function CarMap({ car, pins }: { car: Car; pins: Pin[] }) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const carRef = useRef<import("leaflet").Marker | null>(null);
  const pinsRef = useRef<import("leaflet").Marker[]>([]);
  const pinsLive = useRef(pins);
  const carLive = useRef(car);
  pinsLive.current = pins;
  carLive.current = car;

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
      requestAnimationFrame(() => map.invalidateSize());
    });
    return () => {
      dead = true;
      pinsRef.current = [];
      carRef.current = null;
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
  }, [car.lat, car.lng, car.color, car.plate]);

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
