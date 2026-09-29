import { useEffect, useState } from "react";
import { Btn } from "@/components/towy/bits";
import { callLines, companyById } from "@/lib/towy/model";
import { useActiveJob, useTowy } from "@/lib/towy/store";

function finish(jobId: string) {
  const jobs = useTowy.getState().jobs.map((item) => (item.id === jobId && item.status === "calling" ? { ...item, status: "quoted" as const } : item));
  useTowy.setState({ jobs, view: "quotes" });
}

export function CallingScreen() {
  const job = useActiveJob();
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"dial" | "talk">("dial");

  const calls = job?.calls ?? [];
  const current = calls[index];
  const company = current ? companyById(current.companyId) : undefined;
  const done = calls.length > 0 && index >= calls.length;

  useEffect(() => {
    if (!current) return;
    const delay = phase === "dial" ? 900 : 1700;
    const timer = window.setTimeout(() => {
      if (phase === "dial") {
        setPhase("talk");
        return;
      }
      setIndex((n) => n + 1);
      setPhase("dial");
    }, delay);
    return () => window.clearTimeout(timer);
  }, [phase, index, current]);

  useEffect(() => {
    if (done && job) finish(job.id);
  }, [done, job]);

  if (!job) return null;

  if (calls.length === 0 || done || !current || !company) {
    return (
      <div className="flex flex-1 flex-col justify-center">
        <p className="text-muted">{calls.length === 0 ? "No shops in range for this stop." : "Writing the estimates."}</p>
        <Btn className="mt-4" variant="line" onClick={() => (calls.length === 0 ? useTowy.setState({ view: "intake", step: 3 }) : finish(job.id))}>
          {calls.length === 0 ? "Back to the stop" : "See estimates"}
        </Btn>
      </div>
    );
  }

  const lines = phase === "talk" ? callLines(company, job, current) : [`Calling ${company.name}`, company.phone];
  const visible = lines.slice(-3);

  return (
    <div className="rise flex flex-1 flex-col pt-6">
      <p className="text-sm text-muted">
        {phase === "dial" ? "Ringing" : current.available ? "Connected" : "Declined"} · {Math.min(index + 1, calls.length)} / {calls.length}
      </p>
      <h1 className="mt-2 text-2xl font-medium tracking-tight">{company.name}</h1>
      <p className="mt-1 text-sm text-muted">
        {company.yard} · {company.phone}
      </p>
      <div className="mt-8 space-y-3 border-t border-line pt-4" aria-live="polite">
        {visible.map((line) => (
          <p key={line} className="text-sm">
            {line}
          </p>
        ))}
      </div>
      {phase === "talk" && current.quote ? (
        <p className="mt-6 font-display text-5xl leading-none tabular-nums">
          {current.quote.etaMin}
          <span className="ml-2 text-2xl text-muted">min</span>
        </p>
      ) : null}
      <Btn className="mt-auto w-full" variant="line" onClick={() => finish(job.id)}>
        Skip to estimates
      </Btn>
    </div>
  );
}
