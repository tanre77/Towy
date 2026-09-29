import { ArrowLeft } from "lucide-react";
import { Mark } from "@/components/towy/mark";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { companyById, equipmentLabel, locationById, locations, trafficLabel, usd } from "@/lib/towy/model";
import { useActiveJob, useTowy } from "@/lib/towy/store";

export function Frame({ children }: { children: ReactNode }) {
  const hydrate = useTowy((s) => s.hydrate);
  const view = useTowy((s) => s.view);
  const step = useTowy((s) => s.step);
  const back = useTowy((s) => s.back);
  const setView = useTowy((s) => s.setView);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const showBack = view !== "home";
  const kicker =
    view === "home"
      ? "Columbus"
      : view === "intake"
        ? `${step + 1} / 5`
        : view === "calling"
          ? "Calling"
          : view === "quotes"
            ? "Estimates"
            : view === "job"
              ? "Stop"
              : view === "insurer"
                ? "Insurers"
                : "Yards";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl lg:gap-16 lg:px-8">
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col">
        <header className="safe-t sticky top-0 z-10 flex items-center justify-between gap-3 bg-bg px-5 pb-4">
          <div className="flex items-center gap-1">
            {showBack ? (
              <button type="button" aria-label="Back" onClick={back} className="press grid size-11 place-items-center">
                <ArrowLeft className="size-5" />
              </button>
            ) : null}
            <button type="button" onClick={() => setView("home")} className="flex items-center gap-2">
              <Mark className="size-8" />
              <span className="text-base font-semibold tracking-tight">shoulder</span>
            </button>
          </div>
          <p className="text-sm text-muted">{kicker}</p>
        </header>
        <div className="safe-b flex flex-1 flex-col px-5">{children}</div>
      </div>
      <aside className="sticky top-0 hidden h-dvh w-72 shrink-0 py-8 lg:block">
        <p className="text-sm text-muted">Corridor</p>
        <ul className="mt-3">
          {locations.map((item) => (
            <li key={item.id} className="flex items-baseline justify-between border-t border-line py-3">
              <span className="text-sm">
                {item.road}
                <span className="block text-muted">
                  {item.place} · {trafficLabel(item.traffic)}
                </span>
              </span>
              <span className="text-lg font-medium tabular-nums">{item.mile}</span>
            </li>
          ))}
        </ul>
        <JobRail />
      </aside>
    </div>
  );
}

function JobRail() {
  const job = useActiveJob();
  const view = useTowy((s) => s.view);
  if (!job || view === "home" || view === "insurer" || view === "operator") return null;
  const location = locationById(job.locationId);
  const quote = job.calls.find((call) => call.companyId === job.selectedCompanyId)?.quote;
  const company = job.selectedCompanyId ? companyById(job.selectedCompanyId) : undefined;
  return (
    <div className="mt-8 border-t border-line pt-4 text-sm">
      <p className="text-muted">
        {location.road} {location.mile}
      </p>
      <p className="mt-2 text-base text-fg">{equipmentLabel(job.situation.equipment)}</p>
      <p className="mt-1 text-muted">
        {job.situation.winch ? "Winch" : "No winch"} · {job.situation.police ? "Officer" : "No officer"}
      </p>
      {quote && company ? (
        <p className="mt-4 tabular-nums">
          {company.name}
          <span className="mt-1 block text-muted">
            {quote.etaMin} min · {usd(quote.total)}
          </span>
        </p>
      ) : null}
    </div>
  );
}
