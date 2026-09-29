import { useState } from "react";
import { Btn, Choice } from "@/components/towy/bits";
import { companies, promoPlans, type PromoPlan } from "@/lib/towy/model";
import { useTowy } from "@/lib/towy/store";

export function PromoteScreen() {
  const promotions = useTowy((s) => s.promotions);
  const setPromotion = useTowy((s) => s.setPromotion);
  const clearPromotion = useTowy((s) => s.clearPromotion);
  const [companyId, setCompanyId] = useState(promotions[0]?.companyId ?? companies[0].id);
  const current = promotions.find((item) => item.companyId === companyId);
  const [plan, setPlan] = useState<PromoPlan>(current?.plan ?? "pin");

  return (
    <div className="rise flex flex-1 flex-col">
      <h1 className="text-2xl font-medium tracking-tight">Put the shop on the map</h1>
      <p className="mt-2 text-sm text-muted">Drivers see the pin next to their car. A first call is billed only when the shop gets the stop.</p>

      <div className="mt-6">
        {companies.map((company) => {
          const live = promotions.find((item) => item.companyId === company.id);
          return (
            <Choice key={company.id} selected={company.id === companyId} onClick={() => { setCompanyId(company.id); if (live) setPlan(live.plan); }}>
              <span className="block text-fg">{company.name}</span>
              <span className="mt-1 block text-sm text-muted">{live ? "On now" : company.yard}</span>
            </Choice>
          );
        })}
      </div>

      <div className="mt-6">
        {promoPlans.map((item) => (
          <Choice key={item.id} selected={plan === item.id} onClick={() => setPlan(item.id)}>
            <span className="flex items-baseline justify-between gap-3">
              <span className="text-fg">{item.title}</span>
              <span className="shrink-0 tabular-nums text-sm text-muted">{item.price}</span>
            </span>
            <span className="mt-1 block text-sm text-muted">{item.detail}</span>
          </Choice>
        ))}
      </div>

      <Btn className="mt-6 w-full" onClick={() => setPromotion(companyId, plan)}>
        {current ? "Update this shop" : "Start this"}
      </Btn>
      {current ? (
        <button type="button" className="press mt-4 self-start text-sm text-muted" onClick={() => clearPromotion(companyId)}>
          Take it down
        </button>
      ) : null}
    </div>
  );
}
