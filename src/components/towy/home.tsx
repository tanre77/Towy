import { useEffect, useState } from "react";
import { Btn } from "@/components/towy/bits";
import { CarMap } from "@/components/towy/map";
import { companies, companyById, locations, pilotMonth, usd } from "@/lib/towy/model";
import { useActiveJob, useTowy } from "@/lib/towy/store";

export function HomeScreen() {
  const setView = useTowy((s) => s.setView);
  const startJob = useTowy((s) => s.startJob);
  const resetDemo = useTowy((s) => s.resetDemo);
  const promotions = useTowy((s) => s.promotions);
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

  return (
    <div className="rise flex flex-1 flex-col">
      <CarMap car={car} pins={pins} />
      <div className="mt-3 flex items-baseline justify-between gap-3">
        <p className="text-sm text-muted">{car.device ? "Your car" : `${here.road} ${here.mile}, until this phone shares where the car is`}</p>
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
      <Btn className="mt-4 w-full" onClick={() => startJob("member")}>
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
          <span>Carrier book</span>
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
