import { useEffect, useState } from "react";
import { Btn } from "@/components/towy/bits";
import { CarMap, useTruckSpot } from "@/components/towy/map";
import { companies, companyById, helpLabel, locationById, locations, type HelpKind } from "@/lib/towy/model";
import { ReferLink } from "@/components/towy/refer";
import { useActiveJob, useTowy } from "@/lib/towy/store";

export function HomeScreen() {
  const setView = useTowy((s) => s.setView);
  const startJob = useTowy((s) => s.startJob);
  const resetDemo = useTowy((s) => s.resetDemo);
  const promotions = useTowy((s) => s.promotions);
  const profile = useTowy((s) => s.profiles.find((item) => item.userId === s.activeUserId) ?? null);
  const ensureProfile = useTowy((s) => s.ensureProfile);
  const session = useTowy((s) => s.session);
  const job = useActiveJob();
  const resume = job && job.status !== "draft" ? job : null;
  const yard = resume?.selectedCompanyId ? companyById(resume.selectedCompanyId) : undefined;
  const quote = resume?.calls.find((call) => call.companyId === resume.selectedCompanyId)?.quote;
  const here = locations[0];
  const rolling = resume && (resume.status === "enroute" || resume.status === "checked" || resume.status === "arrived") ? resume : null;
  const truck = useTruckSpot(rolling);
  const incident = rolling ? (rolling.origin ?? locationById(rolling.locationId)) : null;
  const [car, setCar] = useState({ lat: here.lat, lng: here.lng });
  const [geo, setGeo] = useState<"searching" | "device" | "off" | "unsupported">("searching");
  const [armReset, setArmReset] = useState(false);
  const [service, setService] = useState<HelpKind>("tow");
  const services: HelpKind[] = ["tire", "jump", "lockout", "fuel", "tow"];

  useEffect(() => {
    if (!session || session.role !== "driver") return;
    ensureProfile({ id: session.id, name: session.name });
  }, [session, ensureProfile]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeo("unsupported");
      return;
    }
    let live = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!live) return;
        setCar({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeo("device");
      },
      () => {
        if (live) setGeo("off");
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 8000 },
    );
    return () => {
      live = false;
    };
  }, []);

  function askPhone() {
    if (!navigator.geolocation) {
      setGeo("unsupported");
      return;
    }
    setGeo("searching");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCar({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeo("device");
      },
      () => setGeo("off"),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 8000 },
    );
  }

  const pins = promotions
    .filter((item) => item.plan === "pin" || item.plan === "both")
    .map((item) => companies.find((company) => company.id === item.companyId))
    .filter((company) => company != null)
    .map((company) => ({ id: company.id, name: company.name, lat: company.lat, lng: company.lng }));

  const mine = profile?.vehicle;

  return (
    <div className="rise flex flex-1 flex-col">
      <CarMap
        car={
          incident && rolling
            ? { lat: incident.lat, lng: incident.lng, color: rolling.vehicle.color, plate: rolling.vehicle.plate, model: rolling.vehicle.model }
            : mine
              ? { ...car, color: mine.color, plate: mine.plate, model: mine.model }
              : { ...car }
        }
        pins={pins}
        truck={truck}
      />
      {profile && mine ? (
        <button type="button" onClick={() => setView("profile")} className="press mt-3 text-left">
          <p className="text-sm text-muted">{profile.name}{profile.place ? ` · ${profile.place}` : ""}</p>
          <p className="mt-1">
            {mine.year} {mine.make} {mine.model}
            {mine.plate?.trim() ? ` · ${mine.plate.trim().toUpperCase()}` : ""}
          </p>
        </button>
      ) : (
        <p className="mt-3 text-sm text-muted">{session ? "Opening your profile." : "Sign in to put your car on the map."}</p>
      )}
      <div className="mt-4">
        {truck && yard ? (
          <>
            <p className="text-sm text-muted">Your truck</p>
            <p className="mt-1 font-display text-5xl leading-none tabular-nums">{truck.leftMin === 0 ? "Here" : truck.leftMin}</p>
            <p className="mt-1 text-sm text-muted">{truck.leftMin === 0 ? `${yard.name} is at the car.` : `minutes away · ${yard.name}`}</p>
            <Btn className="mt-4 w-full" onClick={() => setView("job")}>
              Follow the truck
            </Btn>
          </>
        ) : (
          <>
            <p className="text-sm text-muted">Roadside, the way a ride works.</p>
            <h1 className="screen-title mt-1 text-2xl font-medium tracking-tight" data-screen-title tabIndex={-1}>
              A truck comes to the car.
            </h1>
            <p className="mt-2 text-sm text-muted">Pick the job. You see the minutes and the price before anyone rolls.</p>
            {geo !== "device" ? (
              <div className="mt-2 flex flex-wrap items-center gap-x-3" aria-live="polite">
                <p className="text-sm text-subtle">
                  {geo === "searching"
                    ? "Finding this phone, so the truck knows where the car is."
                    : geo === "unsupported"
                      ? "This browser cannot share a location."
                      : `Holding ${here.road} ${here.mile} until this phone shares where the car is.`}
                </p>
                {geo === "off" ? (
                  <button type="button" className="press inline-flex min-h-11 items-center text-sm text-fg" onClick={askPhone}>
                    Use this phone
                  </button>
                ) : null}
              </div>
            ) : null}
            <div className="chip-row mt-4 flex gap-2" role="radiogroup" aria-label="What the truck should do">
              {services.map((kind) => (
                <button
                  key={kind}
                  type="button"
                  role="radio"
                  aria-checked={service === kind}
                  onClick={() => setService(kind)}
                  className={`press inline-flex min-h-11 shrink-0 items-center rounded-md px-3 text-sm transition-colors ${service === kind ? "bg-fg text-bg" : "bg-surface text-muted"}`}
                >
                  {helpLabel(kind)}
                </button>
              ))}
            </div>
            <Btn className="mt-4 w-full" onClick={() => startJob("member", undefined, undefined, service)} disabled={!profile}>
              Request a truck
            </Btn>
          </>
        )}
      </div>

      {resume && !truck ? (
        <button
          type="button"
          onClick={() => setView(resume.status === "calling" ? "calling" : resume.status === "quoted" ? "quotes" : "job")}
          className="press mt-6 flex w-full items-baseline justify-between border-b border-line py-4 text-left"
        >
          <span>
            <span className="block text-sm text-muted">{resume.status === "quoted" ? "Trucks answered" : resume.status === "calling" ? "Finding a truck" : "Your truck"}</span>
            <span className="mt-1 block">
              {resume.vehicle.year} {resume.vehicle.make} {resume.vehicle.model}
              {yard ? ` · ${yard.name}` : ""}
            </span>
          </span>
          {quote ? <span className="tabular-nums text-muted">{quote.etaMin} min</span> : null}
        </button>
      ) : null}

      <ReferLink />
      <button
        type="button"
        onClick={() => {
          if (!armReset) {
            setArmReset(true);
            window.setTimeout(() => setArmReset(false), 2800);
            return;
          }
          resetDemo();
        }}
        className="press mt-8 inline-flex min-h-11 items-center self-start text-sm text-subtle"
      >
        {armReset ? "Reset the desk?" : "Reset"}
      </button>
    </div>
  );
}
