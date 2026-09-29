import { useEffect, useState } from "react";
import { Btn } from "@/components/towy/bits";
import { CarMap } from "@/components/towy/map";
import { companies, companyById, carColorHex, carMark, locations, pilotMonth, usd, vehiclePresets, type Vehicle } from "@/lib/towy/model";
import { useActiveJob, useTowy } from "@/lib/towy/store";

export function HomeScreen() {
  const setView = useTowy((s) => s.setView);
  const startJob = useTowy((s) => s.startJob);
  const resetDemo = useTowy((s) => s.resetDemo);
  const promotions = useTowy((s) => s.promotions);
  const garage = useTowy((s) => s.garage);
  const useSavedCar = useTowy((s) => s.useSavedCar);
  const [picked, setPicked] = useState<Vehicle | null>(null);
  const job = useActiveJob();
  const resume = job && job.status !== "draft" ? job : null;
  const yard = resume?.selectedCompanyId ? companyById(resume.selectedCompanyId) : undefined;
  const quote = resume?.calls.find((call) => call.companyId === resume.selectedCompanyId)?.quote;
  const here = locations[0];
  const [car, setCar] = useState({ lat: here.lat, lng: here.lng, device: false });

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCar({ lat: pos.coords.latitude, lng: pos.coords.longitude, device: true }),
      () => undefined,
      { enableHighAccuracy: true, maximumAge: 0, timeout: 8000 },
    );
  }, []);

  const pins = promotions
    .filter((item) => item.plan === "pin" || item.plan === "both")
    .map((item) => companies.find((company) => company.id === item.companyId))
    .filter((company) => company != null)
    .map((company) => ({ id: company.id, name: company.name, lat: company.lat, lng: company.lng }));

  const choices: { key: string; vehicle: Vehicle; label: string }[] = garage.map((car) => ({
    key: car.id,
    vehicle: car.vehicle,
    label: car.vehicle.plate?.trim() ? `${car.vehicle.model} · ${car.vehicle.plate.trim().toUpperCase()}` : car.vehicle.model,
  }));
  for (const preset of vehiclePresets) {
    if (!choices.some((item) => item.vehicle.make === preset.vehicle.make && item.vehicle.model === preset.vehicle.model)) {
      choices.push({ key: preset.label, vehicle: preset.vehicle, label: preset.vehicle.model });
    }
  }
  const shown = picked ?? garage[0]?.vehicle ?? vehiclePresets[0].vehicle;

  return (
    <div className="rise flex flex-1 flex-col">
      <CarMap car={{ ...car, color: shown.color, plate: shown.plate }} pins={pins} />
      <div className="mt-3 flex gap-2 overflow-x-auto" role="radiogroup" aria-label="Car on the map">
        {choices.map((item) => {
          const selected = item.vehicle.make === shown.make && item.vehicle.model === shown.model && (item.vehicle.plate ?? "") === (shown.plate ?? "");
          return (
            <button
              key={item.key}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => {
                setPicked(item.vehicle);
                const saved = garage.find((car) => car.id === item.key);
                if (saved) useSavedCar(saved.id);
              }}
              className={`press inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md px-3 text-sm ${selected ? "bg-fg text-bg" : "bg-surface text-muted"}`}
            >
              <span className="size-3 rounded-full border border-line" style={{ background: carColorHex(item.vehicle.color) }} />
              {item.label}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-3">
        <p className="text-sm text-muted">
          {shown.make ? carMark(shown) : car.device ? "Your car" : `${here.road} ${here.mile}, until this phone shares where the car is`}
        </p>
        {!car.device ? (
          <button
            type="button"
            className="press text-sm text-fg"
            onClick={() => {
              navigator.geolocation?.getCurrentPosition(
                (pos) => setCar({ lat: pos.coords.latitude, lng: pos.coords.longitude, device: true }),
                () => undefined,
                { enableHighAccuracy: true, maximumAge: 0, timeout: 8000 },
              );
            }}
          >
            Use this phone
          </button>
        ) : null}
      </div>
      <Btn className="mt-4 w-full" onClick={() => startJob("member", undefined, shown)}>
        I need help
      </Btn>

      {resume ? (
        <button
          type="button"
          onClick={() => setView(resume.status === "quoted" || resume.status === "calling" ? "quotes" : "job")}
          className="press mt-6 flex w-full items-baseline justify-between border-b border-line py-4 text-left"
        >
          <span>
            <span className="block text-sm text-muted">Open stop</span>
            <span className="mt-1 block">
              {resume.vehicle.year} {resume.vehicle.make} {resume.vehicle.model}
              {yard ? ` · ${yard.name}` : ""}
            </span>
          </span>
          {quote ? <span className="tabular-nums text-muted">{quote.etaMin} min</span> : null}
        </button>
      ) : null}

      <div className={resume ? "" : "mt-6"}>
        <button type="button" onClick={() => setView("promote")} className="press flex w-full items-baseline justify-between border-b border-line py-4 text-left">
          <span>Promote a shop</span>
          <span className="text-sm text-muted">{promotions.length ? `${promotions.length} on` : "From $49"}</span>
        </button>
        <button type="button" onClick={() => setView("insurer")} className="press flex w-full items-baseline justify-between border-b border-line py-4 text-left">
          <span>Insurer invoice</span>
          <span className="text-sm tabular-nums text-muted">{usd(pilotMonth().total)}</span>
        </button>
        <button type="button" onClick={() => setView("operator")} className="press flex w-full items-baseline justify-between border-b border-line py-4 text-left">
          <span>Shop board</span>
          <span className="text-sm text-muted">5 shops</span>
        </button>
      </div>
      <button type="button" onClick={resetDemo} className="mt-8 self-start text-sm text-subtle">
        Reset
      </button>
    </div>
  );
}
