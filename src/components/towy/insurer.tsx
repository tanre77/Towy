import { useMemo } from "react";
import { Btn, Split } from "@/components/towy/bits";
import { applySample, blankJob, buildCalls, DISPATCH_FEE, pilotMonth, usd } from "@/lib/towy/model";
import { ReferLink } from "@/components/towy/refer";
import { useTowy } from "@/lib/towy/store";

export function InsurerScreen() {
  const startJob = useTowy((s) => s.startJob);
  const book = pilotMonth();
  const example = useMemo(() => {
    const job = applySample(blankJob("insurer"), "civic");
    job.coverage = "full";
    return buildCalls(job).find((call) => call.quote)?.quote ?? null;
  }, []);

  return (
    <div className="rise flex flex-1 flex-col">
      <p className="text-sm text-muted">What an insurance company pays</p>
      <h1 className="screen-title mt-2 text-5xl font-medium leading-none tabular-nums" data-screen-title tabIndex={-1}>
        {usd(book.total)}
      </h1>
      <p className="mt-3 text-sm text-muted">One city, one month, if they send {book.stops} stops. This is the number for Grange. The driver never sees it.</p>

      <div className="stagger mt-8">
        <Row k="Desk" v={usd(book.desk)} note="The desk stays on for the month. Shops pay nothing to be on it." />
        <Row k="Each stop" v={usd(DISPATCH_FEE)} note="Billed to the insurance company. Not on the member's bill. Not taken from the shop." />
        <Row k="Stops" v={String(book.stops)} note="Eight a night, thirty nights. A slice of one city, not the whole state." />
        <Row k="Stop fees" v={usd(book.dispatch)} note="A covered tow still pays. That is the point." />
      </div>

      <div className="mt-8 border-t border-line py-4">
        <p className="text-sm text-muted">Fully covered Civic. Shoulder still gets {usd(DISPATCH_FEE)}.</p>
        {example ? (
          <div className="mt-3">
            <Split quote={example} />
          </div>
        ) : null}
        <Btn className="mt-4 w-full" onClick={() => startJob("insurer", "full")}>
          Open a covered stop
        </Btn>
        <ReferLink />
      </div>
    </div>
  );
}

function Row({ k, v, note }: { k: string; v: string; note: string }) {
  return (
    <div className="border-t border-line py-4">
      <div className="flex items-baseline justify-between gap-3">
        <p>{k}</p>
        <p className="tabular-nums">{v}</p>
      </div>
      <p className="mt-1 text-sm text-muted">{note}</p>
    </div>
  );
}
