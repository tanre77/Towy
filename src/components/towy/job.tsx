import { useState } from "react";
import { Btn, LineItems, Split, Stars } from "@/components/towy/bits";
import { companyById, dropFor, locationById, usd } from "@/lib/towy/model";
import { useActiveJob, useTowy } from "@/lib/towy/store";

const steps = [
  { id: "enroute", label: "Truck rolling" },
  { id: "checked", label: "Halfway check-in" },
  { id: "arrived", label: "On scene" },
  { id: "done", label: "Closed" },
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
  const [stars, setStars] = useState(0);
  const [text, setText] = useState("");

  if (!job) return null;
  const company = job.selectedCompanyId ? companyById(job.selectedCompanyId) : undefined;
  const quote = job.calls.find((call) => call.companyId === job.selectedCompanyId)?.quote;
  const location = locationById(job.locationId);
  const drop = dropFor(job);
  const liveEta = job.live?.etaMin ?? quote?.etaMin ?? 0;
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
      <p className="text-sm text-muted">
        {location.road} mile {location.mile} · {location.place}
        {drop ? ` · ${drop.shop.name}` : ""}
      </p>
      <h1 className="mt-2 text-2xl font-medium tracking-tight">{company?.name ?? "Yard confirmed"}</h1>
      <p className="mt-4 font-display text-6xl leading-none tabular-nums">{calling ? "…" : liveEta === 0 ? "Here" : liveEta}</p>
      <p className="mt-1 text-sm text-muted">{calling || liveEta === 0 ? "" : "minutes"}</p>
      <p className="mt-2 text-sm text-muted" aria-live="polite">
        {calling ? `Calling ${company?.name ?? "the yard"} for a live update.` : (job.live?.note ?? "Truck is rolling.")}
      </p>
      {quote ? <p className="mt-2 text-sm tabular-nums text-muted">Quote held at {usd(job.live?.total ?? quote.total)}</p> : null}
      {job.payment?.method === "apple-pay" ? (
        <p className="mt-2 text-sm text-muted">Paid {usd(job.payment.amount)} with Apple Pay. Insurance was not charged.</p>
      ) : null}

      <ol className="mt-6 border-t border-line">
        {steps.map((step, index) => (
          <li key={step.id} className={`border-b border-line py-2 text-sm ${index <= at ? "text-fg" : "text-subtle"}`}>
            {step.label}
          </li>
        ))}
      </ol>

      {quote ? (
        <div className="mt-6">
          <Split quote={quote} />
          <LineItems quote={quote} />
        </div>
      ) : null}

      <div className="mt-6 space-y-2">
        {job.status !== "done" && job.status !== "arrived" ? (
          <Btn className="w-full" disabled={calling} onClick={checkIn}>
            {job.status === "checked" ? "Call the yard again" : "Halfway check-in call"}
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
          <p className="font-medium">How was {company?.name ?? "the yard"}?</p>
          <p className="mt-1 text-sm text-muted">Stays on the yard that showed up.</p>
          <div className="mt-3 flex gap-1">
            {Array.from({ length: 5 }, (_, i) => (
              <button key={i} type="button" aria-label={`${i + 1} stars`} onClick={() => setStars(i + 1)} className="press grid size-11 place-items-center">
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
          {job.review ? <p className="mt-3 text-sm text-ok">Saved on {company?.name}.</p> : null}
        </form>
      ) : null}
    </div>
  );
}
