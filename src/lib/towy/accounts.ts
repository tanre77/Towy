import { round2, type View } from "./model";

export type AccountRole = "driver" | "insurance" | "shop";

export const SIGNUP_POINTS = 100;
export const SALE_CUT = 0.05;

export type SessionAccount = {
  id: string;
  name: string;
  email: string;
  role: AccountRole;
  referralCode: string;
};

type StoredAccount = SessionAccount & {
  salt: string;
  hash: string;
  referredBy: string | null;
};

export type ReferralEvent = {
  id: string;
  referrerId: string;
  kind: "signup" | "sale" | "spend";
  points: number;
  amount: number;
  note: string;
  jobId?: string;
};

const ACCOUNTS_KEY = "shoulder-accounts-v1";
const SESSION_KEY = "shoulder-session-v1";
const LEDGER_KEY = "shoulder-referrals-v1";

export function deskFor(role: AccountRole): View {
  if (role === "insurance") return "insurer";
  if (role === "shop") return "operator";
  return "home";
}

export function viewForSession(view: View, role: AccountRole): View {
  if (view === "refer") return "refer";
  if (role === "driver") {
    if (view === "insurer" || view === "operator" || view === "promote") return "home";
    return view;
  }
  if (role === "insurance") {
    if (view === "insurer" || view === "intake" || view === "calling" || view === "quotes" || view === "job") return view;
    return "insurer";
  }
  return "operator";
}

function makeCode(name: string, taken: string[]): string {
  const base = name.replace(/[^a-z]/gi, "").slice(0, 6).toUpperCase() || "ROAD";
  if (!taken.includes(base)) return base;
  let n = 2;
  while (taken.includes(`${base}${n}`)) n += 1;
  return `${base}${n}`;
}

function toPublic(account: StoredAccount): SessionAccount {
  return { id: account.id, name: account.name, email: account.email, role: account.role, referralCode: account.referralCode };
}

function readAccounts(): StoredAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredAccount[];
    if (!Array.isArray(parsed)) return [];
    const rows = parsed.filter((item) => item && typeof item.email === "string" && typeof item.hash === "string" && typeof item.role === "string");
    const codes: string[] = [];
    let dirty = false;
    const next = rows.map((item) => {
      let referralCode = typeof item.referralCode === "string" && item.referralCode ? item.referralCode : "";
      if (!referralCode) {
        referralCode = makeCode(item.name, codes);
        dirty = true;
      }
      codes.push(referralCode);
      const referredBy = typeof item.referredBy === "string" ? item.referredBy : null;
      if (item.referralCode !== referralCode || item.referredBy !== referredBy) dirty = true;
      return { ...item, referralCode, referredBy };
    });
    if (dirty) writeAccounts(next);
    return next;
  } catch {
    return [];
  }
}

function writeAccounts(accounts: StoredAccount[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function readSession(): SessionAccount | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionAccount;
    if (!parsed || typeof parsed.id !== "string" || typeof parsed.email !== "string") return null;
    if (parsed.role !== "driver" && parsed.role !== "insurance" && parsed.role !== "shop") return null;
    const stored = readAccounts().find((item) => item.id === parsed.id);
    if (!stored) return null;
    const account = toPublic(stored);
    writeSession(account);
    return account;
  } catch {
    return null;
  }
}

export function writeSession(account: SessionAccount | null) {
  if (account) localStorage.setItem(SESSION_KEY, JSON.stringify(account));
  else localStorage.removeItem(SESSION_KEY);
}

function bytesToB64(bytes: Uint8Array): string {
  let text = "";
  for (const byte of bytes) text += String.fromCharCode(byte);
  return btoa(text);
}

function b64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  const bin = atob(value);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function derive(password: string, salt: Uint8Array<ArrayBuffer>): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, key, 256);
  return bytesToB64(new Uint8Array(bits));
}

function emailOk(email: string): boolean {
  return /^\S+@\S+\.\S+$/.test(email);
}

function readLedger(): ReferralEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LEDGER_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ReferralEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLedger(events: ReferralEvent[]) {
  localStorage.setItem(LEDGER_KEY, JSON.stringify(events));
}

export function referralSummary(accountId: string): { points: number; earned: number; held: number; events: ReferralEvent[] } {
  const events = readLedger().filter((item) => item.referrerId === accountId);
  const earned = round2(events.reduce((sum, item) => sum + (item.kind === "sale" ? item.amount || 0 : 0), 0));
  const held = round2(Math.max(0, events.reduce((sum, item) => sum + (item.amount || 0), 0)));
  return { points: events.reduce((sum, item) => sum + (item.points || 0), 0), earned, held, events };
}

export function spendHeld(input: { accountId: string; jobId: string; amount: number }): boolean {
  const events = readLedger();
  if (events.some((item) => item.kind === "spend" && item.jobId === input.jobId)) return false;
  const held = round2(Math.max(0, events.filter((item) => item.referrerId === input.accountId).reduce((sum, item) => sum + (item.amount || 0), 0)));
  const amount = round2(Math.min(input.amount, held));
  if (amount <= 0) return false;
  events.unshift({
    id: crypto.randomUUID(),
    referrerId: input.accountId,
    kind: "spend",
    points: 0,
    amount: -amount,
    jobId: input.jobId,
    note: "Taken off a service",
  });
  writeLedger(events);
  return true;
}

export async function registerAccount(input: {
  name: string;
  email: string;
  password: string;
  role: AccountRole;
  referralCode?: string;
}): Promise<{ ok: true; account: SessionAccount } | { ok: false; error: string }> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (!name) return { ok: false, error: "Add your name." };
  if (!emailOk(email)) return { ok: false, error: "Use a real email." };
  if (input.password.length < 8) return { ok: false, error: "Password needs 8 characters." };
  const accounts = readAccounts();
  if (accounts.some((item) => item.email === email)) return { ok: false, error: "That email already has an account. Sign in." };
  const typed = input.referralCode?.trim().toUpperCase() ?? "";
  const referrer = typed ? accounts.find((item) => item.referralCode.toUpperCase() === typed) : undefined;
  if (typed && !referrer) return { ok: false, error: "That referral code is not on an account." };
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(input.password, salt);
  const account: StoredAccount = {
    id: crypto.randomUUID(),
    name,
    email,
    role: input.role,
    referralCode: makeCode(name, accounts.map((item) => item.referralCode)),
    referredBy: referrer?.id ?? null,
    salt: bytesToB64(salt),
    hash,
  };
  writeAccounts([...accounts, account]);
  if (referrer) {
    const events = readLedger();
    events.unshift({
      id: crypto.randomUUID(),
      referrerId: referrer.id,
      kind: "signup",
      points: SIGNUP_POINTS,
      amount: 0,
      note: `${name} created an account`,
    });
    writeLedger(events);
  }
  const pub = toPublic(account);
  writeSession(pub);
  return { ok: true, account: pub };
}

export async function matchAccount(email: string, password: string): Promise<{ ok: true; account: SessionAccount } | { ok: false; error: string }> {
  const normalized = email.trim().toLowerCase();
  const found = readAccounts().find((item) => item.email === normalized);
  if (!found) return { ok: false, error: "No account for that email." };
  const hash = await derive(password, b64ToBytes(found.salt));
  if (hash !== found.hash) return { ok: false, error: "Wrong password." };
  const account = toPublic(found);
  writeSession(account);
  return { ok: true, account };
}

export function awardSale(input: { jobId: string; accountId: string | null; name: string; total: number }): boolean {
  if (!input.accountId || input.total <= 0) return false;
  const member = readAccounts().find((item) => item.id === input.accountId);
  if (!member?.referredBy) return false;
  const events = readLedger();
  if (events.some((item) => item.kind === "sale" && item.jobId === input.jobId)) return false;
  const amount = round2(input.total * SALE_CUT);
  if (amount <= 0) return false;
  events.unshift({
    id: crypto.randomUUID(),
    referrerId: member.referredBy,
    kind: "sale",
    points: 0,
    amount,
    jobId: input.jobId,
    note: `${input.name || "Someone"} closed a stop. Held for your next service`,
  });
  writeLedger(events);
  return true;
}
