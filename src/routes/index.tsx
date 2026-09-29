import { createFileRoute } from "@tanstack/react-router";
import { AccountScreen } from "@/components/towy/account";
import { CallingScreen } from "@/components/towy/calling";
import { Frame } from "@/components/towy/frame";
import { HomeScreen } from "@/components/towy/home";
import { InsurerScreen } from "@/components/towy/insurer";
import { IntakeScreen } from "@/components/towy/intake";
import { JobScreen } from "@/components/towy/job";
import { OperatorScreen } from "@/components/towy/operator";
import { PromoteScreen } from "@/components/towy/promote";
import { QuotesScreen } from "@/components/towy/quotes";
import { ProfileScreen } from "@/components/towy/profile";
import { ReferScreen } from "@/components/towy/refer";
import { useTowy } from "@/lib/towy/store";

export const Route = createFileRoute("/")({ component: Page });

function Page() {
  const view = useTowy((s) => s.view);
  const session = useTowy((s) => s.session);
  const hydrated = useTowy((s) => s.hydrated);
  if (!hydrated || !session) {
    return (
      <Frame>
        {hydrated ? <AccountScreen /> : <p className="pt-8 text-sm text-muted">Opening the desk.</p>}
      </Frame>
    );
  }
  return (
    <Frame>
      {view === "home" ? <HomeScreen /> : null}
      {view === "intake" ? <IntakeScreen /> : null}
      {view === "calling" ? <CallingScreen /> : null}
      {view === "quotes" ? <QuotesScreen /> : null}
      {view === "job" ? <JobScreen /> : null}
      {view === "insurer" ? <InsurerScreen /> : null}
      {view === "operator" ? <OperatorScreen /> : null}
      {view === "promote" ? <PromoteScreen /> : null}
      {view === "profile" ? <ProfileScreen /> : null}
      {view === "refer" ? <ReferScreen /> : null}
    </Frame>
  );
}
