import { create } from "zustand";
import {
  blankJob,
  buildCalls,
  halfwayUpdate,
  recomputeSituation,
  seedJobs,
  type Coverage,
  type Equipment,
  type Job,
  type Position,
  type Review,
  type Side,
  type Vehicle,
  type View,
  type HelpKind,
  type PromoPlan,
  type Promotion,
  type SavedCar,
  type MemberProfile,
  memberCar,
  phoneOk,
  vehicleOk,
} from "./model";
import { listenDesk, pushDesk } from "./firebase";
import { deskFor, matchAccount, readSession, registerAccount, viewForSession, writeSession, awardSale, spendHeld, type AccountRole, type SessionAccount } from "./accounts";

const STORAGE_KEY = "towy-desk-v1";

type Persisted = {
  view: View;
  step: number;
  activeId: string | null;
  jobs: Job[];
  reviews: Review[];
  yardId: string;
  promotions: Promotion[];
  garage: SavedCar[];
  profiles: MemberProfile[];
  activeUserId: string | null;
};

type State = Persisted & {
  hydrated: boolean;
  session: SessionAccount | null;
  referralTick: number;
  hydrate: () => void;
  setView: (view: View) => void;
  back: () => void;
  startJob: (source?: Job["source"], lockedCoverage?: Coverage, vehicle?: Vehicle, help?: HelpKind) => void;
  patchContact: (patch: { contactName?: string; contactPhone?: string }) => void;
  patchVehicle: (patch: Partial<Vehicle>) => void;
  setPreset: (vehicle: Vehicle) => void;
  setHelp: (help: HelpKind) => void;
  setSpare: (spare: boolean) => void;
  setWrongFuel: (wrongFuel: boolean) => void;
  setShattered: (shattered: boolean) => void;
  setBroken: (broken: boolean) => void;
  setStarts: (starts: boolean) => void;
  setRolls: (rolls: boolean) => void;
  setPosition: (position: Position) => void;
  setSide: (side: Side) => void;
  setEquipment: (equipment: Equipment) => void;
  setWinch: (winch: boolean) => void;
  setPolice: (police: boolean) => void;
  useRecommendations: () => void;
  setLocation: (locationId: string) => void;
  setOrigin: (origin: { lat: number; lng: number; source: "device" | "mile" }) => void;
  setDrop: (drop: Job["drop"]) => void;
  setCoverage: (coverage: Coverage) => void;
  setStep: (step: number) => void;
  placeCalls: () => void;
  confirmQuote: (companyId: string, payment?: { method: "apple-pay" | "held"; amount: number; credit?: number } | null) => void;
  runHalfway: () => void;
  markArrived: (jobId?: string) => void;
  markDone: (jobId?: string) => void;
  saveReview: (stars: number, text: string) => void;
  setYard: (yardId: string) => void;
  acceptForYard: (jobId: string) => void;
  setPromotion: (companyId: string, plan: PromoPlan) => void;
  clearPromotion: (companyId: string) => void;
  rememberCar: () => void;
  useSavedCar: (id: string) => void;
  ensureProfile: (user: { id: string; name: string | null }) => void;
  updateProfile: (patch: { name?: string; phone?: string; place?: string; vehicle?: Partial<Vehicle> }) => void;
  resetDemo: () => void;
  signUp: (input: { name: string; email: string; password: string; role: AccountRole; referralCode?: string }) => Promise<{ ok: true; account: SessionAccount } | { ok: false; error: string }>;
  signInAccount: (email: string, password: string) => Promise<{ ok: true; account: SessionAccount } | { ok: false; error: string }>;
  signOutAccount: () => void;
};

function load(): Partial<Persisted> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    if (!Array.isArray(parsed.jobs)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function save(state: State) {
  if (!state.hydrated || typeof window === "undefined") return;
  const slice: Persisted = {
    view: state.view,
    step: state.step,
    activeId: state.activeId,
    jobs: state.jobs,
    reviews: state.reviews,
    yardId: state.yardId,
    promotions: state.promotions,
    garage: state.garage,
    profiles: state.profiles,
    activeUserId: state.activeUserId,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(slice));
  if (!remoteMute) pushDesk(slice);
}

let remoteMute = false;

function deskFrom(stored: {
  view?: string;
  step?: number;
  activeId?: string | null;
  jobs?: unknown[];
  reviews?: unknown[];
  yardId?: string;
  promotions?: unknown[];
  garage?: unknown[];
  profiles?: unknown[];
  activeUserId?: string | null;
}): Persisted {
  const storedJobs = (stored.jobs ?? []).filter((job): job is Job => Boolean(job && typeof job === "object" && typeof (job as Job).id === "string")).map(normalizeJob);
  const seen = new Set(storedJobs.map((job) => job.id));
  const jobs = [...storedJobs];
  for (const seed of seedJobs) {
    if (!seen.has(seed.id)) jobs.unshift(seed);
  }
  const reviews = (stored.reviews ?? []).filter((review): review is Review => Boolean(review && typeof review === "object" && typeof (review as Review).id === "string"));
  const views: View[] = ["home", "intake", "calling", "quotes", "job", "insurer", "operator", "promote", "profile", "refer"];
  const view = views.includes(stored.view as View) ? (stored.view as View) : "home";
  const plans = new Set(["pin", "first", "both"]);
  const promotions = (stored.promotions ?? []).filter((item): item is Promotion => {
    if (!item || typeof item !== "object") return false;
    const row = item as Promotion;
    return typeof row.companyId === "string" && plans.has(row.plan);
  });
  const drives = new Set(["FWD", "RWD", "AWD", "4WD"]);
  const garage = (stored.garage ?? []).filter((item): item is SavedCar => {
    if (!item || typeof item !== "object") return false;
    const row = item as SavedCar;
    return typeof row.id === "string" && typeof row.contactName === "string" && typeof row.contactPhone === "string" && Boolean(row.vehicle) && drives.has(row.vehicle.drivetrain);
  });
  const profiles = (stored.profiles ?? []).filter((item): item is MemberProfile => {
    if (!item || typeof item !== "object") return false;
    const row = item as MemberProfile;
    return typeof row.userId === "string" && typeof row.name === "string" && Boolean(row.vehicle) && drives.has(row.vehicle.drivetrain);
  }).map((row) => ({
    userId: row.userId,
    name: row.name,
    phone: row.phone ?? "",
    place: row.place ?? "",
    vehicle: { ...memberCar(), ...row.vehicle },
  }));
  return {
    view,
    step: stored.step ?? 0,
    activeId: stored.activeId ?? null,
    jobs,
    reviews,
    yardId: stored.yardId ?? "scioto",
    promotions,
    garage,
    profiles,
    activeUserId: typeof stored.activeUserId === "string" ? stored.activeUserId : null,
  };
}

function normalizeJob(job: Job): Job {
  return {
    ...job,
    help: job.help ?? "tow",
    vehicle: {
      ...job.vehicle,
      color: job.vehicle?.color ?? "",
      plate: job.vehicle?.plate ?? "",
    },
    origin: job.origin ?? null,
    drop: job.drop ?? null,
    acceptedAt: job.acceptedAt ?? null,
    accountId: job.accountId ?? null,
    situation: {
      ...job.situation,
      spare: job.situation?.spare ?? true,
      wrongFuel: job.situation?.wrongFuel ?? false,
      shattered: job.situation?.shattered ?? false,
      broken: job.situation?.broken ?? false,
    },
  };
}

function withActive(state: Persisted, recipe: (job: Job) => Job): Partial<Persisted> {
  if (!state.activeId) return {};
  return {
    jobs: state.jobs.map((job) => (job.id === state.activeId ? recipe(job) : job)),
  };
}

const initial: Persisted = {
  view: "home",
  step: 0,
  activeId: null,
  jobs: seedJobs,
  reviews: [],
  yardId: "scioto",
  promotions: [],
  garage: [],
  profiles: [],
  activeUserId: null,
};

export const useTowy = create<State>((set, get) => ({
  ...initial,
  hydrated: false,
  session: null,
  referralTick: 0,
  hydrate: () => {
    if (get().hydrated) return;
    const stored = load();
    const session = readSession();
    const next: Partial<Persisted> = stored ? deskFrom(stored) : {};
    const view = session ? viewForSession(next.view ?? "home", session.role) : (next.view ?? "home");
    set({ ...next, view, session, hydrated: true });
    listenDesk((desk) => {
      const next = deskFrom(desk);
      const current = get();
      if (
        current.view === next.view &&
        current.step === next.step &&
        current.activeId === next.activeId &&
        current.yardId === next.yardId &&
        JSON.stringify(current.jobs) === JSON.stringify(next.jobs) &&
        JSON.stringify(current.reviews) === JSON.stringify(next.reviews) &&
        JSON.stringify(current.promotions) === JSON.stringify(next.promotions) &&
        JSON.stringify(current.garage) === JSON.stringify(next.garage) &&
        JSON.stringify(current.profiles) === JSON.stringify(next.profiles)
      ) {
        return;
      }
      remoteMute = true;
      try {
        set({
          ...next,
          profiles: next.profiles.length ? next.profiles : current.profiles,
          activeUserId: next.activeUserId ?? current.activeUserId,
          hydrated: true,
        });
      } finally {
        remoteMute = false;
      }
    });
  },
  setView: (view) => set({ view }),
  back: () => {
    const { view, step, session } = get();
    const home = session ? deskFor(session.role) : "home";
    if (view === "intake" && step > 0) {
      set({ step: step - 1 });
      return;
    }
    if (view === "quotes") {
      set({ view: "intake", step: 4 });
      return;
    }
    if (view !== home) set({ view: home, step: 0 });
  },
  startJob: (source = "member", lockedCoverage, vehicle, help) => {
    let job = blankJob(source);
    if (lockedCoverage) {
      job.coverage = lockedCoverage;
      job.coverageLocked = true;
      job.contactName = "Harbor member";
    }
    const profile = source === "member" && !lockedCoverage ? get().profiles.find((item) => item.userId === get().activeUserId) : undefined;
    if (profile) {
      job.contactName = profile.name;
      job.contactPhone = profile.phone;
      job.vehicle = { ...profile.vehicle };
    } else {
      const garage = source === "member" && !lockedCoverage ? get().garage : [];
      const saved = vehicle
        ? garage.find(
            (car) =>
              car.vehicle.make === vehicle.make &&
              car.vehicle.model === vehicle.model &&
              (car.vehicle.plate ?? "") === (vehicle.plate ?? ""),
          ) ?? garage[0]
        : garage[0];
      if (saved) {
        job.contactName = saved.contactName;
        job.contactPhone = saved.contactPhone;
        job.vehicle = { ...saved.vehicle };
      }
    }
    if (vehicle && !profile) {
      job.vehicle = { ...job.vehicle, ...vehicle, color: vehicle.color ?? "", plate: vehicle.plate ?? "" };
    }
    if (help) job = recomputeSituation({ ...job, help, situation: { ...job.situation, equipmentTouched: false, winchTouched: false } });
    job.accountId = get().session?.id ?? null;
    set({
      jobs: [...get().jobs.filter((item) => item.id !== job.id), job],
      activeId: job.id,
      view: "intake",
      step: help ? 1 : 0,
    });
  },
  patchContact: (patch) => set(withActive(get(), (job) => ({ ...job, ...patch }))),
  patchVehicle: (patch) =>
    set(
      withActive(get(), (job) =>
        recomputeSituation({
          ...job,
          vehicle: { ...job.vehicle, ...patch },
        }),
      ),
    ),
  setPreset: (vehicle) =>
    set(
      withActive(get(), (job) =>
        recomputeSituation({
          ...job,
          vehicle: { ...vehicle, color: job.vehicle.color ?? "", plate: job.vehicle.plate ?? "" },
          situation: { ...job.situation, equipmentTouched: false },
        }),
      ),
    ),
  setHelp: (help: HelpKind) =>
    set(
      withActive(get(), (job) =>
        recomputeSituation({
          ...job,
          help,
          situation: { ...job.situation, equipmentTouched: false, winchTouched: false },
        }),
      ),
    ),
  setSpare: (spare: boolean) =>
    set(withActive(get(), (job) => recomputeSituation({ ...job, situation: { ...job.situation, spare, equipmentTouched: false, winchTouched: false } }))),
  setWrongFuel: (wrongFuel: boolean) =>
    set(withActive(get(), (job) => recomputeSituation({ ...job, situation: { ...job.situation, wrongFuel, equipmentTouched: false, winchTouched: false } }))),
  setShattered: (shattered: boolean) => set(withActive(get(), (job) => ({ ...job, situation: { ...job.situation, shattered } }))),
  setBroken: (broken: boolean) =>
    set(
      withActive(get(), (job) =>
        recomputeSituation({
          ...job,
          situation: {
            ...job.situation,
            broken,
            shattered: broken ? true : job.situation.shattered,
            policeTouched: broken ? false : job.situation.policeTouched,
          },
        }),
      ),
    ),
  setStarts: (starts) =>
    set(withActive(get(), (job) => recomputeSituation({ ...job, situation: { ...job.situation, starts } }))),
  setRolls: (rolls) =>
    set(withActive(get(), (job) => recomputeSituation({ ...job, situation: { ...job.situation, rolls } }))),
  setPosition: (position) =>
    set(withActive(get(), (job) => recomputeSituation({ ...job, situation: { ...job.situation, position } }))),
  setSide: (side) => set(withActive(get(), (job) => ({ ...job, situation: { ...job.situation, side } }))),
  setEquipment: (equipment) =>
    set(
      withActive(get(), (job) => ({
        ...job,
        situation: { ...job.situation, equipment, equipmentTouched: true },
      })),
    ),
  setWinch: (winch) =>
    set(
      withActive(get(), (job) => ({
        ...job,
        situation: { ...job.situation, winch, winchTouched: true },
      })),
    ),
  setPolice: (police) =>
    set(
      withActive(get(), (job) => ({
        ...job,
        situation: { ...job.situation, police, policeTouched: true },
      })),
    ),
  useRecommendations: () =>
    set(
      withActive(get(), (job) =>
        recomputeSituation({
          ...job,
          situation: {
            ...job.situation,
            equipmentTouched: false,
            winchTouched: false,
            policeTouched: false,
          },
        }),
      ),
    ),
  setLocation: (locationId) => set(withActive(get(), (job) => recomputeSituation({ ...job, locationId }))),
  setOrigin: (origin) => set(withActive(get(), (job) => ({ ...job, origin }))),
  setDrop: (drop) => set(withActive(get(), (job) => ({ ...job, drop }))),
  setCoverage: (coverage) =>
    set(
      withActive(get(), (job) => {
        if (job.coverageLocked) return job;
        return { ...job, coverage };
      }),
    ),
  setStep: (step) => set({ step }),
  placeCalls: () => {
    const active = get().jobs.find((job) => job.id === get().activeId);
    if (!active) return;
    const ready = recomputeSituation(active);
    const first = get().promotions.find((item) => item.plan === "first" || item.plan === "both");
    const calls = buildCalls(ready, first?.companyId);
    set({
      jobs: get().jobs.map((job) => (job.id === ready.id ? { ...ready, calls, status: "calling", selectedCompanyId: null, live: null, review: null } : job)),
      view: "calling",
    });
  },
  confirmQuote: (companyId, payment) => {
    const state = get();
    const active = state.jobs.find((job) => job.id === state.activeId);
    const quote = active?.calls.find((call) => call.companyId === companyId)?.quote;
    if (!active || !quote) return;
    const credit = payment?.credit ?? 0;
    const spent = credit > 0 && state.session ? spendHeld({ accountId: state.session.id, jobId: active.id, amount: credit }) : false;
    set({
      jobs: state.jobs.map((job) =>
        job.id === active.id
          ? {
              ...job,
              selectedCompanyId: companyId,
              status: "enroute",
              payment: payment ?? null,
              acceptedAt: Date.now(),
              live: { etaMin: quote.etaMin, total: quote.total, note: "Shop accepted. Truck is rolling." },
            }
          : job,
      ),
      view: "job",
      referralTick: spent ? state.referralTick + 1 : state.referralTick,
    });
  },
  runHalfway: () =>
    set(
      withActive(get(), (job) => ({
        ...job,
        status: job.status === "done" || job.status === "arrived" ? job.status : "checked",
        live: halfwayUpdate(job),
      })),
    ),
  markArrived: (jobId) => {
    const id = jobId ?? get().activeId;
    set({
      jobs: get().jobs.map((job) =>
        job.id === id
          ? {
              ...job,
              status: "arrived",
              live: {
                etaMin: 0,
                total: job.live?.total ?? job.calls.find((c) => c.companyId === job.selectedCompanyId)?.quote?.total ?? 0,
                note: "Truck is on scene.",
              },
            }
          : job,
      ),
    });
  },
  markDone: (jobId) => {
    const id = jobId ?? get().activeId;
    const job = get().jobs.find((item) => item.id === id);
    const total = job?.live?.total ?? job?.calls.find((call) => call.companyId === job.selectedCompanyId)?.quote?.total ?? 0;
    const paid = Boolean(job && job.status !== "done" && awardSale({ jobId: job.id, accountId: job.accountId, name: job.contactName, total }));
    set({
      jobs: get().jobs.map((item) => (item.id === id ? { ...item, status: "done" } : item)),
      view: id === get().activeId ? "job" : get().view,
      referralTick: paid ? get().referralTick + 1 : get().referralTick,
    });
  },
  saveReview: (stars, text) => {
    const active = get().jobs.find((job) => job.id === get().activeId);
    if (!active?.selectedCompanyId) return;
    const review: Review = {
      id: `rev-${active.id}`,
      companyId: active.selectedCompanyId,
      author: active.contactName || "Member",
      stars,
      text: text.trim(),
    };
    set({
      reviews: [...get().reviews.filter((item) => item.id !== review.id), review],
      jobs: get().jobs.map((job) => (job.id === active.id ? { ...job, review: { stars, text: text.trim() } } : job)),
    });
  },
  setYard: (yardId) => set({ yardId }),
  setPromotion: (companyId, plan) =>
    set({
      promotions: [...get().promotions.filter((item) => item.companyId !== companyId), { companyId, plan }],
    }),
  clearPromotion: (companyId) => set({ promotions: get().promotions.filter((item) => item.companyId !== companyId) }),
  rememberCar: () => {
    const job = get().jobs.find((item) => item.id === get().activeId);
    if (!job || !vehicleOk(job.vehicle) || !job.contactName.trim() || !phoneOk(job.contactPhone)) return;
    const id = [job.vehicle.year, job.vehicle.make, job.vehicle.model, job.vehicle.drivetrain, job.vehicle.color ?? "", job.vehicle.plate ?? ""]
      .join("-")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");
    const next: SavedCar = {
      id,
      contactName: job.contactName.trim(),
      contactPhone: job.contactPhone.trim(),
      vehicle: { ...job.vehicle },
    };
    const userId = get().activeUserId;
    set({
      garage: [next],
      profiles: userId
        ? get().profiles.map((item) =>
            item.userId === userId
              ? { ...item, name: next.contactName, phone: next.contactPhone, vehicle: { ...next.vehicle } }
              : item,
          )
        : get().profiles,
    });
  },
  useSavedCar: (id) => {
    const saved = get().garage.find((item) => item.id === id);
    if (!saved) return;
    set({ garage: [saved, ...get().garage.filter((item) => item.id !== id)] });
    set(
      withActive(get(), (job) => ({
        ...job,
        contactName: saved.contactName,
        contactPhone: saved.contactPhone,
        vehicle: { ...saved.vehicle },
      })),
    );
  },
  ensureProfile: (user) => {
    const name = user.name?.trim() || "Member";
    const existing = get().profiles.find((item) => item.userId === user.id);
    if (existing) {
      const named = name !== "Member" && (existing.name === "Dev User" || existing.name === "Member");
      if (named) {
        set({
          activeUserId: user.id,
          profiles: get().profiles.map((item) =>
            item.userId === user.id
              ? { ...item, name, place: item.place || (/tanner hughes/i.test(name) ? "Powell" : item.place) }
              : item,
          ),
          garage: [{ id: user.id, contactName: name, contactPhone: existing.phone, vehicle: existing.vehicle }],
        });
        return;
      }
      if (get().activeUserId !== user.id) set({ activeUserId: user.id });
      return;
    }
    const prior = get().garage[0];
    const profile: MemberProfile = {
      userId: user.id,
      name: name === "Member" && prior?.contactName ? prior.contactName : name,
      phone: prior?.contactPhone ?? "",
      place: /tanner hughes/i.test(name) ? "Powell" : "",
      vehicle: prior ? { ...memberCar(), ...prior.vehicle } : memberCar(),
    };
    set({ profiles: [...get().profiles, profile], activeUserId: user.id, garage: [{ id: user.id, contactName: profile.name, contactPhone: profile.phone, vehicle: profile.vehicle }] });
  },
  updateProfile: (patch) => {
    const userId = get().activeUserId;
    if (!userId) return;
    const profiles = get().profiles.map((item) =>
      item.userId === userId
        ? {
            ...item,
            name: patch.name ?? item.name,
            phone: patch.phone ?? item.phone,
            place: patch.place ?? item.place,
            vehicle: { ...item.vehicle, ...patch.vehicle },
          }
        : item,
    );
    const mine = profiles.find((item) => item.userId === userId);
    set({
      profiles,
      garage: mine ? [{ id: userId, contactName: mine.name, contactPhone: mine.phone, vehicle: mine.vehicle }] : get().garage,
    });
  },
  acceptForYard: (jobId) => {
    const yardId = get().yardId;
    set({
      jobs: get().jobs.map((job) => {
        if (job.id !== jobId) return job;
        const quote = job.calls.find((call) => call.companyId === yardId)?.quote;
        if (!quote) return job;
        return {
          ...job,
          selectedCompanyId: yardId,
          status: "enroute",
          acceptedAt: Date.now(),
          live: { etaMin: quote.etaMin, total: quote.total, note: "Accepted from the shop board." },
        };
      }),
    });
  },
  resetDemo: () => {
    const profiles = get().profiles;
    const activeUserId = get().activeUserId;
    const garage = get().garage;
    const session = get().session;
    localStorage.removeItem(STORAGE_KEY);
    const view = session ? deskFor(session.role) : "home";
    set({ ...initial, profiles, activeUserId, garage, session, view, hydrated: true });
  },
  signUp: async (input) => {
    const result = await registerAccount(input);
    if (!result.ok) return result;
    set({ session: result.account, view: deskFor(result.account.role), step: 0 });
    if (result.account.role === "driver") get().ensureProfile({ id: result.account.id, name: result.account.name });
    return result;
  },
  signInAccount: async (email, password) => {
    const result = await matchAccount(email, password);
    if (!result.ok) return result;
    set({ session: result.account, view: deskFor(result.account.role), step: 0 });
    if (result.account.role === "driver") get().ensureProfile({ id: result.account.id, name: result.account.name });
    return result;
  },
  signOutAccount: () => {
    writeSession(null);
    set({ session: null, view: "home", step: 0 });
  },
}));

if (typeof window !== "undefined") {
  let timer: ReturnType<typeof setTimeout> | undefined;
  useTowy.subscribe((state) => {
    clearTimeout(timer);
    timer = setTimeout(() => save(state), 250);
  });
}

export function useActiveJob(): Job | null {
  return useTowy((state) => state.jobs.find((job) => job.id === state.activeId) ?? null);
}
