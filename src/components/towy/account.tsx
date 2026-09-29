import { useState } from "react";
import { Btn, Choice, Field, TextInput } from "@/components/towy/bits";
import type { AccountRole } from "@/lib/towy/accounts";
import { useTowy } from "@/lib/towy/store";

const roles: { id: AccountRole; title: string; detail: string }[] = [
  { id: "driver", title: "Driver", detail: "A truck comes to your car." },
  { id: "insurance", title: "Insurance", detail: "You send covered stops and see the invoice." },
  { id: "shop", title: "Shop", detail: "You take the calls that reach your yard." },
];

export function AccountScreen() {
  const signUp = useTowy((s) => s.signUp);
  const signInAccount = useTowy((s) => s.signInAccount);
  const [mode, setMode] = useState<"create" | "enter">("create");
  const [role, setRole] = useState<AccountRole>("driver");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (busy) return;
    setBusy(true);
    setError("");
    const result = mode === "create" ? await signUp({ name, email, password, role, referralCode: code }) : await signInAccount(email, password);
    setBusy(false);
    if (!result.ok) setError(result.error);
  }

  return (
    <div className="rise flex flex-1 flex-col">
      <h1 className="screen-title text-2xl font-medium tracking-tight" data-screen-title tabIndex={-1}>
        {mode === "create" ? "Create an account" : "Sign in"}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {mode === "create" ? "Shoulder needs to know who is asking. Pick one side." : "Use the email and password from your account."}
      </p>
      {mode === "create" ? (
        <div className="mt-6" role="radiogroup" aria-label="Account type">
          {roles.map((item) => (
            <Choice key={item.id} selected={role === item.id} onClick={() => setRole(item.id)}>
              <span className="block text-fg">{item.title}</span>
              <span className="mt-1 block text-sm text-muted">{item.detail}</span>
            </Choice>
          ))}
        </div>
      ) : null}
      <div className="mt-6 space-y-4">
        {mode === "create" ? (
          <Field label="Name">
            <TextInput value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </Field>
        ) : null}
        <Field label="Email">
          <TextInput value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" inputMode="email" />
        </Field>
        <Field label="Password">
          <TextInput value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete={mode === "create" ? "new-password" : "current-password"} />
        </Field>
        {mode === "create" ? (
          <Field label="Referral code">
            <TextInput value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} autoCapitalize="characters" placeholder="Optional" />
          </Field>
        ) : null}
      </div>
      {error ? <p className="mt-4 text-sm text-muted">{error}</p> : null}
      <Btn className="mt-6 w-full" onClick={submit} disabled={busy}>
        {busy ? "Checking" : mode === "create" ? "Create account" : "Sign in"}
      </Btn>
      <button
        type="button"
        className="press mt-4 inline-flex min-h-11 items-center self-start text-sm text-muted"
        onClick={() => {
          setMode(mode === "create" ? "enter" : "create");
          setError("");
        }}
      >
        {mode === "create" ? "Already have an account? Sign in" : "Need an account? Create one"}
      </button>
    </div>
  );
}
