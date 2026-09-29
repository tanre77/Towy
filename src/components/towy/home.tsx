import { Btn } from "@/components/towy/bits";
import { companyById, locations, pilotMonth, trafficLabel, usd } from "@/lib/towy/model";
import { useActiveJob, useTowy } from "@/lib/towy/store";

export function HomeScreen() {
  const setView = useTowy((s) => s.setView);
  const startJob = useTowy((s) => s.startJob);
  const resetDemo = useTowy((s) => s.resetDemo);
  const job = useActiveJob();
  const resume = job && job.status !== "draft" ? job : null;
  const yard = resume?.selectedCompanyId ? companyById(resume.selectedCompanyId) : undefined;
  const quote = resume?.calls.find((call) => call.companyId === resume.selectedCompanyId)?.quote;

  const here = locations[0];

  return (
    <div className="rise flex flex-1 flex-col">
      <section className="rounded-xl bg-surface p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted">
              {here.road} {here.direction.toLowerCase()}
            </p>
            <h1 className="mt-2 text-5xl font-medium leading-none tabular-nums">{here.mile}</h1>
            <p className="mt-2 text-sm text-muted">{here.place}</p>
            <p className="mt-3 text-sm text-muted">A headlight, an oil change, a cracked or smashed window, or a tow if it has to move.</p>
          </div>
          <p className="rounded-md bg-bg px-2.5 py-1 text-sm text-muted">{trafficLabel(here.traffic)}</p>
        </div>
        <Btn className="mt-5 w-full" onClick={() => startJob("member")}>
          I need help
        </Btn>
      </section>

      {resume ? (
        <button
          type="button"
          onClick={() => setView(resume.status === "quoted" || resume.status === "calling" ? "quotes" : "job")}
          className="press mt-6 flex w-full items-baseline justify-between border-b border-line py-4 text-left"
        >
          <span>
            <span className="block text-sm text-muted">Open stop</span>
            <span className="mt-1 block">
              {resume.vehicle.year} {resume.vehicle.make} {resume.vehicle.model}
              {yard ? ` · ${yard.name}` : ""}
            </span>
          </span>
          {quote ? <span className="tabular-nums text-muted">{quote.etaMin} min</span> : null}
        </button>
      ) : null}

      <div className={resume ? "" : "mt-6"}>
        <button type="button" onClick={() => setView("insurer")} className="press flex w-full items-baseline justify-between border-b border-line py-4 text-left">
          <span>Carrier book</span>
          <span className="text-sm tabular-nums text-muted">{usd(pilotMonth().total)}</span>
        </button>
        <button type="button" onClick={() => setView("operator")} className="press flex w-full items-baseline justify-between border-b border-line py-4 text-left">
          <span>Shop board</span>
          <span className="text-sm text-muted">5 shops</span>
        </button>
      </div>

      <ul className="mt-8 lg:hidden">
        {locations.map((item) => (
          <li key={item.id} className="flex items-baseline justify-between gap-3 border-t border-line py-3">
            <span className="text-sm">{item.road}</span>
            <span className="text-lg font-medium tabular-nums">{item.mile}</span>
            <span className="text-right text-sm text-muted">{trafficLabel(item.traffic)}</span>
          </li>
        ))}
      </ul>
      <button type="button" onClick={resetDemo} className="mt-8 self-start text-sm text-subtle">
        Reset
      </button>
    </div>
  );
}
