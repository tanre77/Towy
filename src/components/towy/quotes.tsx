import { useState } from "react";
import { ApplePayButton, Btn, LineItems, Split, Stars } from "@/components/towy/bits";
import { atCurb, companyById, companyScore, dropFor, needsShop, equipmentLabel, usd, workLabel } from "@/lib/towy/model";
import { useActiveJob, useTowy } from "@/lib/towy/store";

export function QuotesScreen() {
  const job = useActiveJob();
  const reviews = useTowy((s) => s.reviews);
  const promotions = useTowy((s) => s.promotions);
  const confirmQuote = useTowy((s) => s.confirmQuote);
  const [picked, setPicked] = useTowyPick();
  const [paying, setPaying] = useState(false);

  if (!job) return null;
  const drop = dropFor(job);
  const quotes = job.calls.filter((call) => call.quote);
  const declines = job.calls.filter((call) => !call.available);
  const selected = quotes.find((call) => call.companyId === picked) ?? quotes[0];
  const share = selected?.quote?.driverPays ?? 0;
  const covered = selected?.quote?.covered ?? 0;

  function confirmFree() {
    if (!selected?.quote) return;
    confirmQuote(selected.companyId, null);
  }

  function pay() {
    if (!selected?.quote || paying) return;
    setPaying(true);
    window.setTimeout(() => {
      confirmQuote(selected.companyId, { method: "apple-pay", amount: share });
    }, 700);
  }

  return (
    <div className="rise flex flex-1 flex-col">
      <h1 className="text-2xl font-medium tracking-tight">Estimates</h1>
      <p className="mt-2 text-sm text-muted">
        {needsShop(job) ? (
          <>
            {equipmentLabel(job.situation.equipment)}
            {job.situation.winch ? ", winch" : ""}. Nearest shop that can take it.
          </>
        ) : atCurb(job.help) ? (
          <>{workLabel(job)}. Where the car is parked. No shop.</>
        ) : (
          <>{workLabel(job)}. Done on the shoulder. Nearest truck that can take it.</>
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
      <div className="mt-6">
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
              className={`press w-full border-t border-line py-4 text-left ${on ? "text-fg" : "text-muted"}`}
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
        <div className="mt-2">
          <Split quote={selected.quote} />
          <LineItems quote={selected.quote} />
        </div>
      ) : (
        <p className="mt-6 text-sm text-muted">No shop could take this stop. Change the equipment or the mile marker.</p>
      )}
      {selected?.quote && share === 0 ? (
        <div className="mt-6">
          <p className="text-sm text-muted">Insurance covers the service. Nothing to charge.</p>
          <Btn className="mt-3 w-full" onClick={confirmFree}>
            Confirm this shop
          </Btn>
        </div>
      ) : null}
      {selected?.quote && share > 0 ? (
        <div className="sticky bottom-4 z-10 mt-4 rounded-xl bg-surface p-4">
          <p className="text-sm text-muted">Your share of the service</p>
          <p className="mt-1 text-2xl font-medium tabular-nums">{usd(share)}</p>
          <p className="mt-2 text-sm text-muted">
            {covered > 0 ? `Insurance covers ${usd(covered)} and is not charged here.` : "No insurance on this stop, so the whole tow is yours."}
          </p>
          <div className="mt-4">
            <ApplePayButton label={`Pay ${usd(share)} with Apple Pay`} disabled={paying} onClick={pay} />
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
