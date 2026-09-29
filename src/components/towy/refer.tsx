import { useState } from "react";
import { SALE_CUT, SIGNUP_POINTS, referralSummary } from "@/lib/towy/accounts";
import { usd } from "@/lib/towy/model";
import { useTowy } from "@/lib/towy/store";

export function ReferLink() {
  const session = useTowy((s) => s.session);
  const setView = useTowy((s) => s.setView);
  const tick = useTowy((s) => s.referralTick);
  if (!session) return null;
  const summary = referralSummary(session.id);
  void tick;
  return (
    <button type="button" onClick={() => setView("refer")} className="press mt-6 flex w-full items-baseline justify-between border-b border-line py-4 text-left">
      <span>
        <span className="block text-sm text-muted">Your code</span>
        <span className="mt-1 block">{session.referralCode}</span>
      </span>
      <span className="text-right text-sm tabular-nums text-muted">
        {summary.points} pts
        <span className="mt-1 block">{usd(summary.held)} held</span>
      </span>
    </button>
  );
}

export function ReferScreen() {
  const session = useTowy((s) => s.session);
  const tick = useTowy((s) => s.referralTick);
  const [copied, setCopied] = useState(false);
  if (!session) return null;
  const summary = referralSummary(session.id);
  const code = session.referralCode;
  void tick;

  function copy() {
    void navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    });
  }

  return (
    <div className="rise flex flex-1 flex-col">
      <h1 className="screen-title text-2xl font-medium tracking-tight" data-screen-title tabIndex={-1}>
        Referrals
      </h1>
      <p className="mt-2 text-sm text-muted">
        {SIGNUP_POINTS} points when someone creates an account with your code. {Math.round(SALE_CUT * 100)}% of the price is held when their stop closes, and comes off your next service.
      </p>
      <p className="mt-6 font-display text-5xl leading-none tracking-tight">{code}</p>
      <button type="button" onClick={copy} className="press mt-3 inline-flex min-h-11 items-center self-start text-sm text-muted">
        {copied ? "Copied" : "Copy code"}
      </button>
      <div className="mt-8 flex items-baseline justify-between border-t border-line py-4">
        <span>Points</span>
        <span className="tabular-nums">{summary.points}</span>
      </div>
      <div className="flex items-baseline justify-between border-t border-line py-4">
        <span>Held for the next service</span>
        <span className="tabular-nums">{usd(summary.held)}</span>
      </div>
      {summary.events.length ? (
        <ul className="border-t border-line">
          {summary.events.map((event) => (
            <li key={event.id} className="flex items-baseline justify-between gap-3 border-b border-line py-4">
              <span className="text-sm">{event.note}</span>
              <span className="shrink-0 tabular-nums text-sm text-muted">
                {event.kind === "signup" ? `${event.points} pts` : event.kind === "spend" ? `−${usd(Math.abs(event.amount))}` : usd(event.amount)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="border-t border-line py-4 text-sm text-muted">No one has used this code yet.</p>
      )}
    </div>
  );
}
