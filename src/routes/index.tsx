import { createFileRoute } from "@tanstack/react-router";
import { CallingScreen } from "@/components/towy/calling";
import { Frame } from "@/components/towy/frame";
import { HomeScreen } from "@/components/towy/home";
import { InsurerScreen } from "@/components/towy/insurer";
import { IntakeScreen } from "@/components/towy/intake";
import { JobScreen } from "@/components/towy/job";
import { OperatorScreen } from "@/components/towy/operator";
import { QuotesScreen } from "@/components/towy/quotes";
import { useTowy } from "@/lib/towy/store";

export const Route = createFileRoute("/")({ component: Page });

function Page() {
  const view = useTowy((s) => s.view);
  return (
    <Frame>
      {view === "home" ? <HomeScreen /> : null}
      {view === "intake" ? <IntakeScreen /> : null}
      {view === "calling" ? <CallingScreen /> : null}
      {view === "quotes" ? <QuotesScreen /> : null}
      {view === "job" ? <JobScreen /> : null}
      {view === "insurer" ? <InsurerScreen /> : null}
      {view === "operator" ? <OperatorScreen /> : null}
    </Frame>
  );
}
