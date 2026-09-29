import { useEffect, useRef, useState, type ReactNode } from "react";
import { Btn, Choice, Field, TextInput } from "@/components/towy/bits";
import {
  carColors,
  carMark,
  coverageOptions,
  dropFor,
  equipmentLabel,
  equipmentReason,
  helpOptions,
  atCurb,
  locations,
  needsShop,
  phoneOk,
  policeReason,
  positionLabel,
  sideLabel,
  trafficLabel,
  vehicleOk,
  vehiclePresets,
  winchReason,
  workLabel,
  type Drivetrain,
  type Position,
  type Side,
} from "@/lib/towy/model";
import { findDrop } from "@/lib/towy/shops.functions";
import { useActiveJob, useTowy } from "@/lib/towy/store";

const drives: Drivetrain[] = ["FWD", "RWD", "AWD", "4WD"];
const positions: Position[] = ["shoulder", "lane", "ditch", "offroad"];
const sides: Side[] = ["right", "left", "median", "ramp"];

export function IntakeScreen() {
  const job = useActiveJob();
  const step = useTowy((s) => s.step);
  const setStep = useTowy((s) => s.setStep);
  const patchContact = useTowy((s) => s.patchContact);
  const patchVehicle = useTowy((s) => s.patchVehicle);
  const setPreset = useTowy((s) => s.setPreset);
  const setHelp = useTowy((s) => s.setHelp);
  const setSpare = useTowy((s) => s.setSpare);
  const setWrongFuel = useTowy((s) => s.setWrongFuel);
  const setShattered = useTowy((s) => s.setShattered);
  const setBroken = useTowy((s) => s.setBroken);
  const setStarts = useTowy((s) => s.setStarts);
  const setRolls = useTowy((s) => s.setRolls);
  const setPosition = useTowy((s) => s.setPosition);
  const setSide = useTowy((s) => s.setSide);
  const setEquipment = useTowy((s) => s.setEquipment);
  const setWinch = useTowy((s) => s.setWinch);
  const setPolice = useTowy((s) => s.setPolice);
  const useRecommendations = useTowy((s) => s.useRecommendations);
  const setLocation = useTowy((s) => s.setLocation);
  const setOrigin = useTowy((s) => s.setOrigin);
  const setDrop = useTowy((s) => s.setDrop);
  const setCoverage = useTowy((s) => s.setCoverage);
  const placeCalls = useTowy((s) => s.placeCalls);
  const garage = useTowy((s) => s.garage);
  const rememberCar = useTowy((s) => s.rememberCar);
  const useSavedCar = useTowy((s) => s.useSavedCar);
  const [locating, setLocating] = useState<"idle" | "searching" | "device" | "denied" | "failed" | "empty">("idle");
  const searchGen = useRef(0);

  function askPhone() {
    if (!navigator.geolocation) {
      setLocating("denied");
      return;
    }
    const gen = ++searchGen.current;
    setLocating("searching");
    setDrop(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setOrigin({ lat, lng, source: "device" });
        findDrop({ data: { lat, lng } })
          .then((drop) => {
            if (gen !== searchGen.current) return;
            setDrop(drop);
            setLocating(drop ? "device" : "empty");
          })
          .catch(() => {
            if (gen === searchGen.current) setLocating("failed");
          });
      },
      () => {
        if (gen === searchGen.current) setLocating("denied");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  }

  useEffect(() => {
    if (!job || step !== 3 || !needsShop(job) || job.drop) return;
    askPhone();
    // Fresh GPS only. A saved city or mile marker is not the search point.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, job?.id, job?.help, job?.situation.spare, job?.situation.wrongFuel, job?.vehicle.ev, job?.drop]);

  if (!job) return null;
  const location = locations.find((item) => item.id === job.locationId) ?? locations[0];
  const oilOnEv = job.help === "oil" && job.vehicle.ev;
  const ready = Boolean(job.contactName.trim() && phoneOk(job.contactPhone) && vehicleOk(job.vehicle));
  const shopDrop = dropFor(job);

  return (
    <div className="rise flex flex-1 flex-col">
      {step === 0 ? (
        <section>
          <h1 className="text-2xl font-medium tracking-tight">What do you need?</h1>
          <p className="mt-2 text-sm text-muted">On the road, or the small jobs that never need a bay.</p>
          {garage[0] ? <p className="mt-2 text-sm text-muted">{carMark(garage[0].vehicle)} is saved. Continue skips the vehicle screen.</p> : null}
          <div className="mt-6">
            <p className="mb-1 text-sm text-muted">On the road</p>
            {helpOptions.filter((option) => !atCurb(option.id) && option.id !== "tow").map((option) => (
              <Choice key={option.id} selected={job.help === option.id} onClick={() => setHelp(option.id)}>
                <span className="block text-fg">{option.title}</span>
                <span className="mt-1 block text-sm text-muted">{option.detail}</span>
              </Choice>
            ))}
            <p className="mb-1 mt-6 text-sm text-muted">No shop</p>
            {helpOptions.filter((option) => atCurb(option.id)).map((option) => (
              <Choice key={option.id} selected={job.help === option.id} onClick={() => setHelp(option.id)}>
                <span className="block text-fg">{option.title}</span>
                <span className="mt-1 block text-sm text-muted">{option.detail}</span>
              </Choice>
            ))}
            {helpOptions.filter((option) => option.id === "tow").map((option) => (
              <Choice key={option.id} selected={job.help === option.id} onClick={() => setHelp(option.id)}>
                <span className="block text-fg">{option.title}</span>
                <span className="mt-1 block text-sm text-muted">{option.detail}</span>
              </Choice>
            ))}
          </div>
        </section>
      ) : null}

      {step === 1 ? (
        <section>
          <h1 className="text-2xl font-medium tracking-tight">Vehicle</h1>
          <div className="mt-6 space-y-4">
            {garage.length ? (
              <div>
                <p className="mb-2 text-sm font-medium text-muted">Saved</p>
                {garage.map((car) => (
                  <Choice
                    key={car.id}
                    selected={carMark(job.vehicle) === carMark(car.vehicle) && job.contactPhone === car.contactPhone}
                    onClick={() => useSavedCar(car.id)}
                  >
                    <span className="block text-fg">{carMark(car.vehicle)}</span>
                    <span className="mt-1 block text-sm text-muted">
                      {car.contactName} · {car.vehicle.drivetrain}
                      {car.vehicle.ev ? " · electric" : ""}
                    </span>
                  </Choice>
                ))}
              </div>
            ) : null}
            <Field label="Name">
              <TextInput value={job.contactName} onChange={(e) => patchContact({ contactName: e.target.value })} placeholder="Alex Chen" autoComplete="name" />
            </Field>
            <Field label="Phone for the shop">
              <TextInput
                value={job.contactPhone}
                onChange={(e) => patchContact({ contactPhone: e.target.value })}
                placeholder="(614) 555-0198"
                inputMode="tel"
                autoComplete="tel"
              />
            </Field>
            <div>
              <p className="mb-2 text-sm font-medium text-muted">Common vehicles</p>
              <div className="flex flex-wrap gap-2">
                {vehiclePresets.map((preset) => (
                  <Choice
                    key={preset.label}
                    selected={job.vehicle.model === preset.vehicle.model && job.vehicle.year === preset.vehicle.year}
                    onClick={() => setPreset(preset.vehicle)}
                  >
                    {preset.label}
                  </Choice>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Field label="Year">
                <TextInput value={job.vehicle.year} onChange={(e) => patchVehicle({ year: e.target.value })} inputMode="numeric" />
              </Field>
              <Field label="Make">
                <TextInput value={job.vehicle.make} onChange={(e) => patchVehicle({ make: e.target.value })} />
              </Field>
              <Field label="Model">
                <TextInput value={job.vehicle.model} onChange={(e) => patchVehicle({ model: e.target.value })} />
              </Field>
            </div>
            <Field label="License plate">
              <TextInput
                value={job.vehicle.plate ?? ""}
                onChange={(e) => patchVehicle({ plate: e.target.value.toUpperCase() })}
                placeholder="ABC 1234"
                autoCapitalize="characters"
                maxLength={8}
              />
            </Field>
            <div>
              <p className="mb-2 text-sm font-medium text-muted">Color</p>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Color">
                {carColors.map((swatch) => {
                  const on = job.vehicle.color === swatch.id;
                  return (
                    <button
                      key={swatch.id}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => patchVehicle({ color: swatch.id })}
                      className={`press inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm ${on ? "text-fg" : "text-muted"}`}
                    >
                      <span className="size-4 rounded-full border border-line" style={{ background: swatch.hex }} />
                      {swatch.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <Field label="Tire size">
              <TextInput value={job.vehicle.tires} onChange={(e) => patchVehicle({ tires: e.target.value })} placeholder="215/55R16" />
            </Field>
            <div>
              <p className="mb-2 text-sm font-medium text-muted">Drivetrain</p>
              <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Drivetrain">
                {drives.map((drive) => {
                  const on = job.vehicle.drivetrain === drive;
                  return (
                    <button
                      key={drive}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => patchVehicle({ drivetrain: drive })}
                      className={`press min-h-11 min-w-0 rounded-md px-1 text-sm font-medium ${on ? "bg-fg text-bg" : "bg-surface text-muted"}`}
                    >
                      {drive}
                    </button>
                  );
                })}
              </div>
            </div>
            <Choice selected={job.vehicle.ev} onClick={() => patchVehicle({ ev: !job.vehicle.ev })}>
              Electric vehicle
            </Choice>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section>
          <h1 className="text-2xl font-medium tracking-tight">{atCurb(job.help) ? "Where it sits" : "Situation"}</h1>
          {garage.length && vehicleOk(job.vehicle) ? (
            <button type="button" className="press mt-2 text-sm text-muted" onClick={() => setStep(1)}>
              {carMark(job.vehicle)} · different car
            </button>
          ) : null}
          <div className="mt-6 space-y-5">
            {atCurb(job.help) ? null : (
              <>
            <ToggleRow label="Can it start?" value={job.situation.starts} onChange={setStarts} />
            <ToggleRow label="Can it roll?" value={job.situation.rolls} onChange={setRolls} />
            <div>
              <p className="mb-2 text-sm font-medium text-muted">Where is it sitting?</p>
              <div className="grid grid-cols-2 gap-2">
                {positions.map((position) => (
                  <Choice key={position} selected={job.situation.position === position} onClick={() => setPosition(position)}>
                    {positionLabel(position)}
                  </Choice>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-muted">Which side?</p>
              <div className="grid grid-cols-2 gap-2">
                {sides.map((side) => (
                  <Choice key={side} selected={job.situation.side === side} onClick={() => setSide(side)}>
                    {sideLabel(side)}
                  </Choice>
                ))}
              </div>
            </div>
              </>
            )}
            <Advice
              title={needsShop(job) ? equipmentLabel(job.situation.equipment) : workLabel(job)}
              body={
                job.help === "tire" && job.situation.spare
                  ? "Spare or a plug, on the shoulder. You leave if it holds air."
                  : job.help === "tire"
                    ? "No spare in the car. This becomes a tow."
                    : job.help === "jump" && job.vehicle.ev
                      ? "A jump will not start an electric car. It needs a flatbed."
                      : job.help === "jump"
                        ? "They clamp on. If it holds a charge, you drive away."
                        : job.help === "lockout"
                          ? "Opened here. The car does not go to a shop."
                          : job.help === "fuel" && !job.situation.wrongFuel
                            ? "Two gallons, enough to reach a station."
                            : job.help === "fuel"
                          ? "Wrong fuel has to be drained. This becomes a tow."
                          : job.help === "bulb"
                            ? "One lamp, where the car is parked. If the housing is sealed, that part is a shop."
                            : job.help === "oil" && job.vehicle.ev
                              ? "This car has no engine oil to change."
                              : job.help === "oil"
                                ? "Filter and five quarts. Driveway or a lot. Not a bay."
                                : job.help === "wipers"
                                  ? "Both blades. A few minutes, where it sits."
                                  : job.help === "crack" && job.situation.broken
                                    ? "Someone broke it. They replace the glass here, and an officer can take the report."
                                    : job.help === "crack" && job.situation.shattered
                                      ? "The pane is gone. They bring a new one and fit it here."
                                      : job.help === "crack"
                                        ? "Resin in the chip or crack. It cures where the car sits."
                                      : equipmentReason(job.vehicle, job.situation)
              }
              onUse={useRecommendations}
              actions={
                needsShop(job) ? (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Choice selected={job.situation.equipment === "wheel-lift"} onClick={() => setEquipment("wheel-lift")}>
                      Wheel-lift
                    </Choice>
                    <Choice selected={job.situation.equipment === "flatbed"} onClick={() => setEquipment("flatbed")}>
                      Flatbed
                    </Choice>
                  </div>
                ) : null
              }
            />
            {job.help === "tire" ? (
              <Choice selected={job.situation.spare} onClick={() => setSpare(!job.situation.spare)}>
                <span className="block text-fg">Spare is in the car</span>
                <span className="mt-1 block text-sm text-muted">{job.situation.spare ? "They can finish it here." : "No spare. A tow is the fix."}</span>
              </Choice>
            ) : null}
            {job.help === "fuel" ? (
              <Choice selected={job.situation.wrongFuel} onClick={() => setWrongFuel(!job.situation.wrongFuel)}>
                <span className="block text-fg">Wrong fuel in the tank</span>
                <span className="mt-1 block text-sm text-muted">{job.situation.wrongFuel ? "That is a shop job. Tow it." : "Just empty. A can is enough."}</span>
              </Choice>
            ) : null}
            {job.help === "crack" ? (
              <>
                <Choice selected={job.situation.shattered && !job.situation.broken} onClick={() => { setBroken(false); setShattered(!job.situation.shattered || job.situation.broken); }}>
                  <span className="block text-fg">Pane is shattered</span>
                  <span className="mt-1 block text-sm text-muted">
                    {job.situation.shattered && !job.situation.broken ? "They replace the glass here." : "It's a crack. A fill is enough."}
                  </span>
                </Choice>
                <Choice selected={job.situation.broken} onClick={() => setBroken(!job.situation.broken)}>
                  <span className="block text-fg">Someone broke it</span>
                  <span className="mt-1 block text-sm text-muted">
                    {job.situation.broken ? "Smashed glass. Replaced here, with an officer if you want the report." : "Not a rock chip. Someone put it through."}
                  </span>
                </Choice>
              </>
            ) : null}
            {needsShop(job) ? (
              <Choice selected={job.situation.winch} onClick={() => setWinch(!job.situation.winch)}>
                <span className="block text-fg">Fish it out</span>
                <span className="mt-1 block text-sm text-muted">{winchReason(job.situation.position)}</span>
              </Choice>
            ) : null}
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section>
          <h1 className="text-2xl font-medium tracking-tight">{atCurb(job.help) ? "Where is it parked" : "Location"}</h1>
          {atCurb(job.help) ? <p className="mt-2 text-sm text-muted">Driveway, lot, or street. The nearest mile is enough.</p> : null}
          {needsShop(job) ? (
            <div className="mt-4 border-t border-line pt-4">
              <p className="text-sm text-muted">Tow to</p>
              {shopDrop ? (
                <>
                  <p className="mt-1 text-lg font-medium">{shopDrop.shop.name}</p>
                  <p className="mt-1 text-sm text-muted">
                    {shopDrop.shop.rating > 0 ? `${shopDrop.shop.rating.toFixed(1)} on Google` : "Nearest tire or repair shop"}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {shopDrop.shop.address}
                    {shopDrop.miles != null ? ` · ${shopDrop.miles.toFixed(1)} mi from this phone` : " · near this phone"}
                  </p>
                </>
              ) : (
                <p className="mt-1 text-sm text-muted">
                  {locating === "searching"
                    ? "Looking for a tire or repair shop from this phone."
                    : locating === "denied"
                      ? "Allow location. A saved city is not used."
                      : locating === "failed"
                        ? "No shop came back for this spot."
                        : locating === "empty"
                          ? "No tire or repair shop came back for this spot."
                          : "This uses the phone, not a saved place."}
                </p>
              )}
              <button type="button" className="press mt-3 text-sm text-fg" onClick={askPhone}>
                Use this phone's location
              </button>
            </div>
          ) : null}
          <div className="mt-4">
            {locations.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setLocation(item.id)}
                className={`press flex w-full items-baseline gap-4 border-t border-line py-4 text-left ${
                  item.id === job.locationId ? "text-fg" : "text-muted"
                }`}
              >
                <span className="w-20 shrink-0 font-display text-3xl leading-none tabular-nums text-fg">{item.mile}</span>
                <span className="min-w-0">
                  <span className="block">
                    {item.road} {item.direction}
                  </span>
                  <span className="mt-1 block text-sm">
                    {item.place} · {trafficLabel(item.traffic)}
                  </span>
                </span>
              </button>
            ))}
          </div>
          {atCurb(job.help) && !(job.help === "crack" && job.situation.broken) ? null : (
          <div className="mt-4">
            <Choice selected={job.situation.police} onClick={() => setPolice(!job.situation.police)}>
              <span className="block text-fg">Request an officer</span>
              <span className="mt-1 block text-sm text-muted">
                {job.help === "crack" && job.situation.broken
                  ? "For the report. The glass is still replaced here."
                  : policeReason(job.situation.position, job.situation.side, location.traffic)}
              </span>
            </Choice>
          </div>
          )}
        </section>
      ) : null}

      {step === 4 ? (
        <section>
          <h1 className="text-2xl font-medium tracking-tight">Coverage</h1>
          <p className="mt-2 text-sm text-muted">
            {job.source === "insurer"
              ? "The insurance company pays Shoulder $18. It is not on this bill."
              : "Shoulder takes 6% only of what you still owe."}
          </p>
          <div className="mt-6 space-y-2">
            {coverageOptions.map((option) => (
              <Choice
                key={option.id}
                selected={job.coverage === option.id}
                disabled={job.coverageLocked && job.coverage !== option.id}
                onClick={() => setCoverage(option.id)}
              >
                <span className="block text-fg">{option.title}</span>
                <span className="mt-1 block text-sm text-muted">{option.detail}</span>
              </Choice>
            ))}
          </div>
          {job.coverageLocked ? <p className="mt-3 text-sm text-muted">Harbor Mutual locked this member to roadside assist.</p> : null}
          <dl className="mt-6 text-sm">
            <Row k="Member" v={job.contactName || "—"} />
            <Row k="Vehicle" v={carMark(job.vehicle)} />
            <Row k="Stop" v={`${location.road} mile ${location.mile}, ${sideLabel(job.situation.side).toLowerCase()}`} />
            <Row k="Work" v={workLabel(job)} />
            {shopDrop ? (
              <Row k="Drop" v={`${shopDrop.shop.name}${shopDrop.miles != null ? ` · ${shopDrop.miles.toFixed(1)} mi` : ""}`} />
            ) : null}
            <Row
              k="Equipment"
              v={
                needsShop(job)
                  ? `${equipmentLabel(job.situation.equipment)}${job.situation.winch ? " · winch" : ""}${job.situation.police ? " · officer" : ""}`
                  : atCurb(job.help)
                    ? "Where it sits"
                    : "Service truck"
              }
            />
          </dl>
        </section>
      ) : null}

      <div className="mt-8">
        {step < 4 ? (
          <Btn
            className="w-full"
            disabled={(step === 1 && !ready) || (step === 2 && oilOnEv)}
            onClick={() => {
              if (step === 1) rememberCar();
              if (step === 0 && garage.length && vehicleOk(job.vehicle) && phoneOk(job.contactPhone) && job.contactName.trim()) {
                setStep(2);
                return;
              }
              setStep(step + 1);
            }}
          >
            Continue
          </Btn>
        ) : (
          <Btn className="w-full" disabled={!ready || oilOnEv} onClick={placeCalls}>
            Call the shops
          </Btn>
        )}
        {step === 1 && !ready ? <p className="mt-3 text-sm text-subtle">Add a name and a 10-digit phone so the shop can call back.</p> : null}
      </div>
    </div>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (next: boolean) => void }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-muted">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        <Choice selected={value} onClick={() => onChange(true)}>
          Yes
        </Choice>
        <Choice selected={!value} onClick={() => onChange(false)}>
          No
        </Choice>
      </div>
    </div>
  );
}

function Advice({ title, body, actions, onUse }: { title: string; body: string; actions: ReactNode; onUse: () => void }) {
  return (
    <div className="border-t border-line pt-4">
      <p className="text-sm text-muted">Send</p>
      <p className="mt-1 text-lg font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted">{body}</p>
      {actions}
      <button type="button" onClick={onUse} className="mt-3 text-sm text-subtle">
        Use the recommendation
      </button>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 border-t border-line py-2">
      <dt className="text-muted">{k}</dt>
      <dd className="text-right">{v}</dd>
    </div>
  );
}
