import { Star } from "lucide-react";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { companyById, usd, type Quote } from "@/lib/towy/model";

export function Btn({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "line" | "ghost" }) {
  const look =
    variant === "primary"
      ? "bg-accent text-accent-fg"
      : variant === "line"
        ? "border border-line text-fg"
        : "bg-transparent text-fg";
  return (
    <button
      className={`press inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-base font-medium disabled:opacity-40 ${look} ${className}`}
      {...props}
    />
  );
}

export function Choice({
  selected,
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { selected: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`press flex min-h-11 items-center gap-3 border-b border-line py-3 text-left ${selected ? "text-fg" : "text-muted"} ${className}`}
      {...props}
    >
      <span className={`h-4 w-px shrink-0 ${selected ? "bg-fg" : "bg-line"}`} aria-hidden="true" />
      <span className="min-w-0">{children}</span>
    </button>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-muted">{label}</span>
      {children}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-11 w-full border-b border-line bg-transparent px-0 text-base text-fg outline-none placeholder:text-subtle ${props.className ?? ""}`}
    />
  );
}

export function Stars({ value, count = 5, labeled = true }: { value: number; count?: number; labeled?: boolean }) {
  const full = Math.round(value);
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden={labeled ? undefined : true} aria-label={labeled ? `${value.toFixed(1)} out of ${count}` : undefined}>
      {Array.from({ length: count }, (_, i) => (
        <Star key={i} className={`size-3.5 ${i < full ? "fill-fg text-fg" : "text-subtle"}`} aria-hidden="true" />
      ))}
    </span>
  );
}

export function Split({ quote }: { quote: Quote }) {
  const rows: [string, string, boolean][] = [
    [quote.work === "Tow" ? "Tow" : quote.work, usd(quote.total), false],
    ["Insurance", usd(quote.covered), false],
    ["Member", usd(quote.driverPays), true],
    ["Shoulder 6%", usd(quote.towyFee), true],
    ["Yard", usd(quote.operatorReceives), false],
  ];
  return (
    <dl>
      {rows.map(([label, value, strong]) => (
        <div key={label} className="flex items-baseline justify-between gap-4 border-t border-line py-2 text-sm">
          <dt className={strong ? "text-fg" : "text-muted"}>{label}</dt>
          <dd className={`tabular-nums ${strong ? "font-medium text-fg" : "text-muted"}`}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function LineItems({ quote }: { quote: Quote }) {
  const company = companyById(quote.companyId);
  const rows = [
    [quote.work === "Tow" ? "Hook" : "Service", quote.hook],
    [`Mileage · ${quote.miles.toFixed(1)} mi`, quote.mileage],
    ["Flatbed", quote.equipmentFee],
    ["Winch", quote.winchFee],
    ["Monday night", quote.afterHours],
    ["Officer wait", quote.policeWait],
  ].filter(([, amount]) => Number(amount) > 0);
  return (
    <details className="border-t border-line">
      <summary className="py-2 text-sm text-muted">Line items{company ? ` · ${company.name}` : ""}</summary>
      <ul className="pb-2">
        {rows.map(([label, amount]) => (
          <li key={String(label)} className="flex justify-between py-1 text-sm text-muted">
            <span>{label}</span>
            <span className="tabular-nums">{usd(Number(amount))}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}

export function AppleMark({ className = "h-5 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 14 17" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M11.4 9c0-1.8 1.5-2.7 1.5-2.8-.8-1.2-2.1-1.4-2.6-1.4-1.1-.1-2.1.6-2.7.6-.6 0-1.4-.6-2.3-.6-1.2 0-2.3.7-2.9 1.8-1.3 2.2-.3 5.4.9 7.2.6.9 1.3 1.9 2.2 1.8.9 0 1.2-.6 2.3-.6s1.4.6 2.3.6 1.5-.9 2.1-1.8c.7-1 .9-1.9.9-2 0 0-1.8-.7-1.8-2.8zM9.8 3.5c.5-.6.8-1.4.7-2.2-.7 0-1.6.5-2.1 1.1-.5.6-.9 1.4-.8 2.2.8.1 1.7-.4 2.2-1.1z"
      />
    </svg>
  );
}

export function ApplePayButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      className="press inline-flex min-h-12 w-full items-center justify-center gap-1.5 rounded-md bg-fg px-4 text-base font-medium text-bg disabled:opacity-40"
    >
      <AppleMark />
      <span>Pay</span>
    </button>
  );
}
