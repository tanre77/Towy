import type { ReactNode } from "react";
import { Btn, Choice, Field, TextInput } from "@/components/towy/bits";
import {
  coverageOptions,
  equipmentLabel,
  equipmentReason,
  locations,
  phoneOk,
  policeReason,
  positionLabel,
  sideLabel,
  trafficLabel,
  vehicleOk,
  vehiclePresets,
  winchReason,
  type Drivetrain,
  type Position,
  type Side,
} from "@/lib/towy/model";
import { useActiveJob, useTowy } from "@/lib/towy/store";

const drives: Drivetrain[] = ["FWD", "RWD", "AWD", "4WD"];
const positions: Position[] = ["shoulder", "lane", "ditch", "offroad"];
const sides: Side[] = ["right", "left", "median", "ramp"];

export function IntakeScreen() {
  const job = useActiveJob();
  const step = useTowy((s) => s.step);
  const setStep = useTowy((s) => s.setStep);
  const useSample = useTowy((s) => s.useSample);
  const patchContact = useTowy((s) => s.patchContact);
  const patchVehicle = useTowy((s) => s.patchVehicle);
  const setPreset = useTowy((s) => s.setPreset);
  const setStarts = useTowy((s) => s.setStarts);
  const setRolls = useTowy((s) => s.setRolls);
  const setPosition = useTowy((s) => s.setPosition);
  const setSide = useTowy((s) => s.setSide);
  const setEquipment = useTowy((s) => s.setEquipment);
  const setWinch = useTowy((s) => s.setWinch);
  const setPolice = useTowy((s) => s.setPolice);
  const useRecommendations = useTowy((s) => s.useRecommendations);
  const setLocation = useTowy((s) => s.setLocation);
  const setCoverage = useTowy((s) => s.setCoverage);
  const placeCalls = useTowy((s) => s.placeCalls);

  if (!job) return null;
  const location = locations.find((item) => item.id === job.locationId) ?? locations[0];
  const ready = Boolean(job.contactName.trim() && phoneOk(job.contactPhone) && vehicleOk(job.vehicle));

  return (
    <div className="rise flex flex-1 flex-col">
      {step === 0 ? (
        <section>
          <h1 className="text-2xl font-medium tracking-tight">Vehicle</h1>
          <div className="mt-6 space-y-4">
            <Field label="Name">
              <TextInput value={job.contactName} onChange={(e) => patchContact({ contactName: e.target.value })} placeholder="Alex Chen" autoComplete="name" />
            </Field>
            <Field label="Phone for the yard">
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
            <Field label="Tire size">
              <TextInput value={job.vehicle.tires} onChange={(e) => patchVehicle({ tires: e.target.value })} placeholder="215/55R16" />
            </Field>
            <div>
              <p className="mb-2 text-sm font-medium text-muted">Drivetrain</p>
              <div className="grid grid-cols-4 gap-2">
                {drives.map((drive) => (
                  <Choice key={drive} selected={job.vehicle.drivetrain === drive} onClick={() => patchVehicle({ drivetrain: drive })} className="justify-center px-1">
                    {drive}
                  </Choice>
                ))}
              </div>
            </div>
            <Choice selected={job.vehicle.ev} onClick={() => patchVehicle({ ev: !job.vehicle.ev })}>
              Electric vehicle
            </Choice>
            <p className="pt-2 text-sm text-muted">
              <button type="button" className="text-fg" onClick={() => useSample("civic")}>
                Dead Civic, shoulder
              </button>
              <span> · </span>
              <button type="button" className="text-fg" onClick={() => useSample("ev")}>
                Model Y in the ditch
              </button>
            </p>
          </div>
        </section>
      ) : null}

      {step === 1 ? (
        <section>
          <h1 className="text-2xl font-medium tracking-tight">Situation</h1>
          <div className="mt-6 space-y-5">
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
            <Advice
              title={equipmentLabel(job.situation.equipment)}
              body={equipmentReason(job.vehicle, job.situation)}
              onUse={useRecommendations}
              actions={
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Choice selected={job.situation.equipment === "wheel-lift"} onClick={() => setEquipment("wheel-lift")}>
                    Wheel-lift
                  </Choice>
                  <Choice selected={job.situation.equipment === "flatbed"} onClick={() => setEquipment("flatbed")}>
                    Flatbed
                  </Choice>
                </div>
              }
            />
            <Choice selected={job.situation.winch} onClick={() => setWinch(!job.situation.winch)}>
              <span className="block text-fg">Fish it out</span>
              <span className="mt-1 block text-sm text-muted">{winchReason(job.situation.position)}</span>
            </Choice>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section>
          <h1 className="text-2xl font-medium tracking-tight">Location</h1>
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
          <div className="mt-4">
            <Choice selected={job.situation.police} onClick={() => setPolice(!job.situation.police)}>
              <span className="block text-fg">Request an officer</span>
              <span className="mt-1 block text-sm text-muted">{policeReason(job.situation.position, job.situation.side, location.traffic)}</span>
            </Choice>
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section>
          <h1 className="text-2xl font-medium tracking-tight">Coverage</h1>
          <p className="mt-2 text-sm text-muted">6% applies only after the policy pays.</p>
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
            <Row k="Vehicle" v={`${job.vehicle.year} ${job.vehicle.make} ${job.vehicle.model}`} />
            <Row k="Stop" v={`${location.road} mile ${location.mile}, ${sideLabel(job.situation.side).toLowerCase()}`} />
            <Row
              k="Equipment"
              v={`${equipmentLabel(job.situation.equipment)}${job.situation.winch ? " · winch" : ""}${job.situation.police ? " · officer" : ""}`}
            />
          </dl>
        </section>
      ) : null}

      <div className="mt-8">
        {step < 3 ? (
          <Btn className="w-full" disabled={step === 0 && !ready} onClick={() => setStep(step + 1)}>
            Continue
          </Btn>
        ) : (
          <Btn className="w-full" disabled={!ready} onClick={placeCalls}>
            Call the yards
          </Btn>
        )}
        {step === 0 && !ready ? <p className="mt-3 text-sm text-subtle">Add a name and a 10-digit phone so the yard can call back.</p> : null}
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
