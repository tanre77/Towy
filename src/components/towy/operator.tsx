import { Btn, EmptyState } from "@/components/towy/bits";
import { companies, companyById, equipmentLabel, locationById, positionLabel, usd, type Job } from "@/lib/towy/model";
import { useTowy } from "@/lib/towy/store";

const statusLabel: Record<Job["status"], string> = {
  draft: "Intake",
  calling: "Calling",
  quoted: "Waiting on a shop",
  enroute: "Rolling",
  checked: "Checked in",
  arrived: "On scene",
  done: "Closed",
};

export function OperatorScreen() {
  const jobs = useTowy((s) => s.jobs);
  const yardId = useTowy((s) => s.yardId);
  const setYard = useTowy((s) => s.setYard);
  const acceptForYard = useTowy((s) => s.acceptForYard);
  const runHalfway = useTowy((s) => s.runHalfway);
  const markArrived = useTowy((s) => s.markArrived);
  const markDone = useTowy((s) => s.markDone);
  const setView = useTowy((s) => s.setView);
  const yard = companyById(yardId);

  const visible = jobs.filter((job) => job.status !== "draft" && job.status !== "calling" && job.calls.some((call) => call.companyId === yardId));

  return (
    <div className="rise flex flex-1 flex-col">
      <h1 className="screen-title text-2xl font-medium tracking-tight" data-screen-title tabIndex={-1}>
        {yard?.name}
      </h1>
      <p className="mt-1 text-sm text-muted">{yard?.yard}</p>
      <div className="chip-row mt-4 flex gap-1">
        {companies.map((company) => (
          <button
            key={company.id}
            type="button"
            onClick={() => setYard(company.id)}
            aria-pressed={company.id === yardId}
            className={`press relative min-h-11 shrink-0 px-2 text-sm transition-colors ${company.id === yardId ? "text-fg" : "text-muted"}`}
          >
            {company.name}
            <span className={`absolute inset-x-2 bottom-2 h-px transition-colors ${company.id === yardId ? "bg-fg" : "bg-transparent"}`} aria-hidden="true" />
          </button>
        ))}
      </div>
      <div className="stagger mt-6">
        {visible.length === 0 ? (
          <EmptyState title="Nothing on this board" body={`${yard?.name ?? "This shop"} has no stops yet. Run one from the map, or switch shops.`}>
            <Btn variant="line" onClick={() => setView("home")}>
              Back to the map
            </Btn>
          </EmptyState>
        ) : null}
        {visible.map((job) => {
          const location = locationById(job.locationId);
          const quote = job.calls.find((call) => call.companyId === yardId)?.quote;
          const takenBy = job.selectedCompanyId && job.selectedCompanyId !== yardId ? companyById(job.selectedCompanyId) : undefined;
          const mine = job.selectedCompanyId === yardId;
          const open = !job.selectedCompanyId && job.status === "quoted";
          return (
            <article key={job.id} className="border-t border-line py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{job.contactName || "Member"}</p>
                  <p className="mt-1 text-sm text-muted">
                    {job.vehicle.year} {job.vehicle.make} {job.vehicle.model}
                  </p>
                </div>
                <p className="text-right text-sm text-muted">{statusLabel[job.status]}</p>
              </div>
              <p className="mt-3 font-display text-3xl leading-none tabular-nums">
                {location.road} {location.mile}
              </p>
              <p className="mt-2 text-sm text-muted">
                {location.direction} · {positionLabel(job.situation.position)} · {equipmentLabel(job.situation.equipment)}
                {job.situation.winch ? " · winch" : ""}
                {job.situation.police ? " · officer" : ""}
              </p>
              {job.payment?.method === "apple-pay" ? (
                <p className="mt-2 text-sm text-muted">Member paid {usd(job.payment.amount)} with Apple Pay.</p>
              ) : null}
              {takenBy ? (
                <p className="mt-3 text-sm text-muted">Taken by {takenBy.name}.</p>
              ) : quote ? (
                <p className="mt-3 text-sm tabular-nums">
                  {quote.etaMin} min · {usd(quote.total)} quote · shop keeps {usd(quote.operatorReceives)}
                </p>
              ) : (
                <p className="mt-3 text-sm text-muted">This shop declined the stop.</p>
              )}
              <div className="mt-4 flex flex-col gap-2">
                {open && quote ? (
                  <Btn
                    onClick={() => {
                      useTowy.setState({ activeId: job.id });
                      acceptForYard(job.id);
                    }}
                  >
                    Accept and roll
                  </Btn>
                ) : null}
                {mine && (job.status === "enroute" || job.status === "checked") ? (
                  <Btn
                    variant="line"
                    onClick={() => {
                      useTowy.setState({ activeId: job.id });
                      runHalfway();
                    }}
                  >
                    Push halfway update
                  </Btn>
                ) : null}
                {mine && job.status === "checked" ? (
                  <Btn variant="line" onClick={() => markArrived(job.id)}>
                    Mark on scene
                  </Btn>
                ) : null}
                {mine && job.status === "arrived" ? (
                  <Btn variant="line" onClick={() => markDone(job.id)}>
                    Close stop
                  </Btn>
                ) : null}
                {mine ? (
                  <button
                    type="button"
                    className="press inline-flex min-h-11 items-center self-start text-sm text-muted"
                    onClick={() => useTowy.setState({ activeId: job.id, view: "job" })}
                  >
                    Open the member view
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
      <button type="button" onClick={() => setView("insurer")} className="press mt-6 inline-flex min-h-11 items-center self-start text-sm text-muted">
        See insurer pricing
      </button>
    </div>
  );
}
