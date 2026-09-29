import { useEffect, useState } from "react";
import { Btn, EmptyState, Skeleton } from "@/components/towy/bits";
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
    if (!done || !job) return;
    const timer = window.setTimeout(() => finish(job.id), 520);
    return () => window.clearTimeout(timer);
  }, [done, job]);

  if (!job) return null;

  if (calls.length === 0) {
    return (
      <div className="rise flex flex-1 flex-col justify-center">
        <EmptyState title="No trucks in range" body="Nothing covers this mile with the equipment on the request. Change where the car is and try again.">
          <Btn variant="line" onClick={() => useTowy.setState({ view: "intake", step: 3 })}>
            Back to the car
          </Btn>
        </EmptyState>
      </div>
    );
  }

  if (done || !current || !company) {
    return (
      <div className="rise flex flex-1 flex-col pt-8" aria-busy="true" aria-live="polite">
        <p className="text-sm text-muted">Writing what each truck can do</p>
        <Skeleton className="mt-4 h-8 w-40" />
        <Skeleton className="mt-6 h-16 w-full" />
        <Skeleton className="mt-3 h-16 w-full" />
        <Btn className="mt-auto w-full" variant="line" onClick={() => finish(job.id)}>
          See the trucks
        </Btn>
      </div>
    );
  }

  const lines = phase === "talk" ? callLines(company, job, current) : [`Calling ${company.name}`, company.phone];
  const visible = lines.slice(-3);

  return (
    <div className="rise flex flex-1 flex-col pt-6">
      <p key={phase} className="line-in text-sm text-muted">
        Finding a truck · {phase === "dial" ? "ringing" : current.available ? "they can take it" : "they declined"} · {Math.min(index + 1, calls.length)} / {calls.length}
      </p>
      <h1 className="screen-title mt-2 text-2xl font-medium tracking-tight" data-screen-title tabIndex={-1}>
        {company.name}
      </h1>
      <p className="mt-1 text-sm text-muted">
        {company.yard} · {company.phone}
      </p>
      {phase === "dial" ? (
        <div className="relative mt-8 size-16" aria-hidden="true">
          <span className="call-ring absolute inset-0 rounded-full border border-accent" />
          <span className="absolute inset-3 rounded-full border border-line" />
        </div>
      ) : null}
      <div key={`${company.id}-${phase}`} className="stagger mt-8 space-y-3 border-t border-line pt-4" aria-live="polite">
        {visible.map((line) => (
          <p key={line} className="text-sm">
            {line}
          </p>
        ))}
      </div>
      {phase === "talk" && current.quote ? (
        <p className="line-in mt-6 font-display text-5xl leading-none tabular-nums">
          {current.quote.etaMin}
          <span className="ml-2 text-2xl text-muted">min</span>
        </p>
      ) : null}
      <Btn className="mt-auto w-full" variant="line" onClick={() => finish(job.id)}>
        See the trucks
      </Btn>
    </div>
  );
}
