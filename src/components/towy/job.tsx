import { useEffect, useState } from "react";
import { Btn, LineItems, Split, Stars } from "@/components/towy/bits";
import { CarMap, useTruckSpot } from "@/components/towy/map";
import { companyById, locationById, usd } from "@/lib/towy/model";
import { useActiveJob, useTowy } from "@/lib/towy/store";

const steps = [
  { id: "enroute", label: "On the way" },
  { id: "checked", label: "Checked in" },
  { id: "arrived", label: "At the car" },
  { id: "done", label: "Done" },
] as const;

function stepIndex(status: string) {
  if (status === "done") return 3;
  if (status === "arrived") return 2;
  if (status === "checked") return 1;
  return 0;
}

export function JobScreen() {
  const job = useActiveJob();
  const runHalfway = useTowy((s) => s.runHalfway);
  const markArrived = useTowy((s) => s.markArrived);
  const markDone = useTowy((s) => s.markDone);
  const saveReview = useTowy((s) => s.saveReview);
  const [calling, setCalling] = useState(false);
  const [stars, setStars] = useState(() => job?.review?.stars ?? 0);
  const [text, setText] = useState(() => job?.review?.text ?? "");

  useEffect(() => {
    setStars(job?.review?.stars ?? 0);
    setText(job?.review?.text ?? "");
  }, [job?.id, job?.review?.stars, job?.review?.text]);

  if (!job) return null;
  const company = job.selectedCompanyId ? companyById(job.selectedCompanyId) : undefined;
  const quote = job.calls.find((call) => call.companyId === job.selectedCompanyId)?.quote;
  const location = locationById(job.locationId);
  const truck = useTruckSpot(job);
  const spot = job.origin ?? location;
  const liveEta = truck ? truck.leftMin : (job.live?.etaMin ?? quote?.etaMin ?? 0);
  const at = stepIndex(job.status);

  function checkIn() {
    setCalling(true);
    window.setTimeout(() => {
      runHalfway();
      setCalling(false);
    }, 1200);
  }

  return (
    <div className="rise flex flex-1 flex-col">
      <CarMap
        car={{ lat: spot.lat, lng: spot.lng, color: job.vehicle.color, plate: job.vehicle.plate, model: job.vehicle.model }}
        pins={[]}
        truck={truck ? { lat: truck.lat, lng: truck.lng } : null}
      />
      <p className="mt-3 text-sm text-muted">Your truck · {location.road} mile {location.mile}</p>
      <h1 className="screen-title mt-2 text-2xl font-medium tracking-tight" data-screen-title tabIndex={-1}>
        {company?.name ?? "Truck confirmed"}
      </h1>
      <p className="mt-4 font-display text-6xl leading-none tabular-nums">{liveEta === 0 ? "Here" : liveEta}</p>
      <p className="mt-1 text-sm text-muted">{liveEta === 0 ? "At the car" : "minutes away"}</p>
      <p key={calling ? "calling" : (job.live?.note ?? "rolling")} className="line-in mt-2 text-sm text-muted" aria-live="polite">
        {calling ? `Calling ${company?.name ?? "the truck"} for a live update.` : (job.live?.note ?? "On the way to the car.")}
      </p>
      {quote ? <p className="mt-2 text-sm tabular-nums text-muted">Quote held at {usd(job.live?.total ?? quote.total)}</p> : null}
      {job.payment?.method === "apple-pay" && job.payment.credit ? (
        <p className="mt-2 text-sm text-muted">Held referrals covered {usd(job.payment.credit)}.</p>
      ) : null}
      {job.payment?.method === "apple-pay" ? (
        <p className="mt-2 text-sm text-muted">Paid {usd(job.payment.amount)} with Apple Pay. Insurance was not charged.</p>
      ) : null}
      {job.payment?.method === "held" ? <p className="mt-2 text-sm text-muted">Paid from funds held for referrals. Insurance was not charged.</p> : null}

      <ol className="mt-6 border-t border-line">
        {steps.map((step, index) => {
          const state = index < at ? "done" : index === at ? "now" : "later";
          return (
            <li key={step.id} className={`flex items-center gap-3 border-b border-line py-2 text-sm ${state === "later" ? "text-subtle" : "text-fg"}`}>
              <span
                className={`size-1.5 shrink-0 rounded-full transition-colors duration-300 ${state === "later" ? "bg-line" : "bg-fg"} ${state === "now" ? "step-live" : ""}`}
                aria-hidden="true"
              />
              <span>
                {step.label}
                {state === "now" ? <span className="sr-only">, current</span> : null}
              </span>
            </li>
          );
        })}
      </ol>

      {quote ? (
        <div className="mt-6">
          <Split quote={quote} />
          <LineItems quote={quote} />
        </div>
      ) : null}

      <div className="mt-6 space-y-2">
        {job.status !== "done" && job.status !== "arrived" ? (
          <Btn className="w-full" disabled={calling} aria-busy={calling} onClick={checkIn}>
            {calling ? "Calling the shop" : job.status === "checked" ? "Call the shop again" : "Halfway check-in call"}
          </Btn>
        ) : null}
        {job.status === "checked" ? (
          <Btn className="w-full" variant="line" onClick={() => markArrived()}>
            Truck is on scene
          </Btn>
        ) : null}
        {job.status === "arrived" ? (
          <Btn className="w-full" onClick={() => markDone()}>
            Close this stop
          </Btn>
        ) : null}
      </div>

      {job.status === "done" ? (
        <form
          className="mt-8"
          onSubmit={(event) => {
            event.preventDefault();
            if (stars < 1) return;
            saveReview(stars, text);
          }}
        >
          <p className="font-medium">How was {company?.name ?? "the shop"}?</p>
          <p className="mt-1 text-sm text-muted">Stays on the shop that showed up.</p>
          <div className="mt-3 flex gap-1" role="radiogroup" aria-label="Rating">
            {Array.from({ length: 5 }, (_, i) => (
              <button
                key={i}
                type="button"
                role="radio"
                aria-checked={stars === i + 1}
                aria-label={`${i + 1} stars`}
                onClick={() => setStars(i + 1)}
                className="press grid size-11 place-items-center"
              >
                <Stars value={stars > i ? 1 : 0} count={1} labeled={false} />
              </button>
            ))}
          </div>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Note"
            className="mt-3 min-h-24 w-full border-b border-line bg-transparent py-3 text-base text-fg outline-none placeholder:text-subtle"
          />
          <Btn className="mt-3 w-full" type="submit" disabled={stars < 1}>
            {job.review ? "Update review" : "Save review"}
          </Btn>
          {job.review ? (
            <p className="rise mt-3 text-sm text-ok" role="status">
              Saved on {company?.name}.
            </p>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
