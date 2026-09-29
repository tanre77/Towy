import { useState } from "react";
import { ApplePayButton, Btn, EmptyState, LineItems, Split, Stars } from "@/components/towy/bits";
import { atCurb, companyById, companyScore, dropFor, needsShop, equipmentLabel, round2, usd, workLabel } from "@/lib/towy/model";
import { referralSummary } from "@/lib/towy/accounts";
import { useActiveJob, useTowy } from "@/lib/towy/store";

export function QuotesScreen() {
  const job = useActiveJob();
  const reviews = useTowy((s) => s.reviews);
  const promotions = useTowy((s) => s.promotions);
  const confirmQuote = useTowy((s) => s.confirmQuote);
  const session = useTowy((s) => s.session);
  const tick = useTowy((s) => s.referralTick);
  const [picked, setPicked] = useTowyPick();
  const [paying, setPaying] = useState(false);

  if (!job) return null;
  const drop = dropFor(job);
  const quotes = job.calls.filter((call) => call.quote);
  const declines = job.calls.filter((call) => !call.available);
  const selected = quotes.find((call) => call.companyId === picked) ?? quotes[0];
  const share = selected?.quote?.driverPays ?? 0;
  const covered = selected?.quote?.covered ?? 0;
  const held = session ? referralSummary(session.id).held : 0;
  void tick;
  const credit = share > 0 ? round2(Math.min(held, share)) : 0;
  const due = round2(Math.max(0, share - credit));

  function confirmFree() {
    if (!selected?.quote) return;
    confirmQuote(selected.companyId, null);
  }

  function pay() {
    if (!selected?.quote || paying) return;
    setPaying(true);
    window.setTimeout(() => {
      confirmQuote(selected.companyId, { method: "apple-pay", amount: due, credit });
    }, 700);
  }

  function useHeld() {
    if (!selected?.quote || paying) return;
    confirmQuote(selected.companyId, { method: "held", amount: credit, credit });
  }

  return (
    <div className="rise flex flex-1 flex-col">
      <h1 className="screen-title text-2xl font-medium tracking-tight" data-screen-title tabIndex={-1}>
        Choose a truck
      </h1>
      <p className="mt-2 text-sm text-muted">
        {needsShop(job) ? (
          <>
            {equipmentLabel(job.situation.equipment)}
            {job.situation.winch ? ", winch" : ""}. Nearest truck that can take the car.
          </>
        ) : atCurb(job.help) ? (
          <>{workLabel(job)}. They come to where the car is parked.</>
        ) : (
          <>{workLabel(job)}. Done where the car sits. Nearest truck first.</>
        )}
      </p>
      {drop ? (
        <p className="mt-2 text-sm text-muted">
          Drop at {drop.shop.name}, {drop.shop.address}.
          {drop.shop.rating > 0 ? ` ${drop.shop.rating.toFixed(1)} on Google` : " Nearest tire or repair shop"}
          {drop.miles != null ? `. ${drop.miles.toFixed(1)} mi from this phone.` : "."}
        </p>
      ) : null}
      {declines.length ? (
        <ul className="mt-4 space-y-1">
          {declines.map((call) => {
            const company = companyById(call.companyId);
            return (
              <li key={call.companyId} className="text-sm text-muted">
                {company?.name} declined. {call.decline}
              </li>
            );
          })}
        </ul>
      ) : null}
      <div className="stagger mt-6">
        {quotes.length === 0 ? (
          <EmptyState title="No truck could take this" body="Nothing answered for this mile and equipment. Change where the car is and try again.">
            <Btn variant="line" onClick={() => useTowy.setState({ view: "intake", step: 3 })}>
              Change where the car is
            </Btn>
          </EmptyState>
        ) : null}
        {quotes.map((call) => {
          const quote = call.quote;
          const company = companyById(call.companyId);
          if (!quote || !company) return null;
          const score = companyScore(company, reviews);
          const on = selected?.companyId === company.id;
          const promoted = promotions.some((item) => item.companyId === company.id && (item.plan === "first" || item.plan === "both"));
          return (
            <button
              key={company.id}
              type="button"
              onClick={() => setPicked(company.id)}
              className={`press w-full border-t border-line py-4 text-left transition-colors ${on ? "text-fg" : "text-muted"}`}
            >
              <span className="flex items-baseline justify-between gap-3">
                <span>
                  <span className="block text-fg">{company.name}</span>
                  {promoted ? <span className="mt-1 block text-sm text-muted">Called first</span> : null}
                  <span className="mt-1 flex items-center gap-2 text-sm">
                    <Stars value={score.rating} />
                    <span className="tabular-nums">
                      {score.rating.toFixed(1)} · {quote.miles.toFixed(1)} mi
                    </span>
                  </span>
                </span>
                <span className="text-right">
                  <span className="block tabular-nums text-fg">{usd(quote.total)}</span>
                  <span className="mt-1 block text-sm tabular-nums">{quote.etaMin} min</span>
                </span>
              </span>
              {on ? <span className="mt-2 block text-sm">{quote.note}</span> : null}
            </button>
          );
        })}
      </div>
      {selected?.quote ? (
        <div key={selected.companyId} className="view-enter mt-2">
          <Split quote={selected.quote} />
          <LineItems quote={selected.quote} />
        </div>
      ) : null}
      {selected?.quote && share === 0 ? (
        <div className="mt-6">
          <p className="text-sm text-muted">Insurance covers it. Nothing to pay. The truck rolls when you send it.</p>
          <Btn className="mt-3 w-full" onClick={confirmFree}>
            Send this truck
          </Btn>
        </div>
      ) : null}
      {selected?.quote && share > 0 && due === 0 ? (
        <div className="mt-6">
          <p className="text-sm text-muted">Held from referrals covers this service. Nothing else to pay.</p>
          <p className="mt-1 text-2xl font-medium tabular-nums">{usd(credit)}</p>
          <Btn className="mt-3 w-full" onClick={useHeld}>
            Use held funds
          </Btn>
        </div>
      ) : null}
      {selected?.quote && due > 0 ? (
        <div className="rise sticky bottom-4 z-10 mt-4 rounded-xl bg-surface p-4">
          <p className="text-sm text-muted">You pay this. Then the truck rolls.</p>
          <p className="mt-1 text-2xl font-medium tabular-nums">{usd(due)}</p>
          <p className="mt-2 text-sm text-muted">
            {credit > 0 ? `Held referrals cover ${usd(credit)}. ` : ""}
            {covered > 0 ? `Insurance covers ${usd(covered)} and is not charged here.` : credit > 0 ? "The rest is yours." : "No insurance on this stop, so the whole tow is yours."}
          </p>
          <div className="mt-4">
            <ApplePayButton label={`Pay ${usd(due)} with Apple Pay`} busy={paying} onClick={pay} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function useTowyPick() {
  const job = useActiveJob();
  const first = job?.calls.find((call) => call.quote)?.companyId ?? null;
  const [picked, setPicked] = useStateCompany(first);
  return [picked, setPicked] as const;
}

function useStateCompany(fallback: string | null) {
  const selected = useTowy((s) => s.jobs.find((job) => job.id === s.activeId)?.selectedCompanyId ?? null);
  const setSelected = (companyId: string) => {
    const { activeId, jobs } = useTowy.getState();
    useTowy.setState({
      jobs: jobs.map((job) => (job.id === activeId ? { ...job, selectedCompanyId: companyId } : job)),
    });
  };
  return [selected ?? fallback, setSelected] as const;
}
