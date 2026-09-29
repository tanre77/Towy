import { useMemo } from "react";
import { Btn, Split } from "@/components/towy/bits";
import { applySample, blankJob, buildCalls, usd } from "@/lib/towy/model";
import { useTowy } from "@/lib/towy/store";

const plans = [
  { name: "Insurer plugin", price: "$420/mo", detail: "Per brand app." },
  { name: "Yard console", price: "$69/mo", detail: "Per company." },
  { name: "Coordination", price: "6%", detail: "Only on what the member still owes." },
];

export function InsurerScreen() {
  const startJob = useTowy((s) => s.startJob);
  const example = useMemo(() => {
    const job = applySample(blankJob("insurer"), "civic");
    job.coverage = "roadside";
    return buildCalls(job).find((call) => call.quote)?.quote ?? null;
  }, []);

  return (
    <div className="rise flex flex-1 flex-col">
      <h1 className="text-2xl font-medium tracking-tight">Harbor Mutual</h1>
      <p className="mt-2 text-sm text-muted">Alex Chen · roadside · first {usd(125)}</p>
      <div className="mt-6 border-t border-line py-4">
        <p className="text-sm text-muted">Plugin</p>
        <Btn className="mt-4 w-full" onClick={() => startJob("insurer", "roadside")}>
          Open dispatch
        </Btn>
      </div>
      <div className="mt-2">
        {plans.map((plan) => (
          <div key={plan.name} className="border-t border-line py-4">
            <div className="flex items-baseline justify-between gap-3">
              <p>{plan.name}</p>
              <p className="tabular-nums">{plan.price}</p>
            </div>
            <p className="mt-1 text-sm text-muted">{plan.detail}</p>
          </div>
        ))}
      </div>

      {example ? (
        <div className="mt-2 border-t border-line pt-4">
          <p className="text-sm text-muted">Worked stop · Civic, I-70, roadside cap</p>
          <div className="mt-3">
            <Split quote={example} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
