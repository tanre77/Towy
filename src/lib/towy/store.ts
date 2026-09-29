import { create } from "zustand";
import {
  applySample,
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
} from "./model";

const STORAGE_KEY = "towy-desk-v1";

type Persisted = {
  view: View;
  step: number;
  activeId: string | null;
  jobs: Job[];
  reviews: Review[];
  yardId: string;
};

type State = Persisted & {
  hydrated: boolean;
  hydrate: () => void;
  setView: (view: View) => void;
  back: () => void;
  startJob: (source?: Job["source"], lockedCoverage?: Coverage) => void;
  useSample: (which: "civic" | "ev") => void;
  patchContact: (patch: { contactName?: string; contactPhone?: string }) => void;
  patchVehicle: (patch: Partial<Vehicle>) => void;
  setPreset: (vehicle: Vehicle) => void;
  setHelp: (help: HelpKind) => void;
  setSpare: (spare: boolean) => void;
  setWrongFuel: (wrongFuel: boolean) => void;
  setStarts: (starts: boolean) => void;
  setRolls: (rolls: boolean) => void;
  setPosition: (position: Position) => void;
  setSide: (side: Side) => void;
  setEquipment: (equipment: Equipment) => void;
  setWinch: (winch: boolean) => void;
  setPolice: (police: boolean) => void;
  useRecommendations: () => void;
  setLocation: (locationId: string) => void;
  setCoverage: (coverage: Coverage) => void;
  setStep: (step: number) => void;
  placeCalls: () => void;
  confirmQuote: (companyId: string, payment?: { method: "apple-pay"; amount: number } | null) => void;
  runHalfway: () => void;
  markArrived: (jobId?: string) => void;
  markDone: (jobId?: string) => void;
  saveReview: (stars: number, text: string) => void;
  setYard: (yardId: string) => void;
  acceptForYard: (jobId: string) => void;
  resetDemo: () => void;
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
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(slice));
}

function normalizeJob(job: Job): Job {
  return {
    ...job,
    help: job.help ?? "tow",
    situation: {
      ...job.situation,
      spare: job.situation?.spare ?? true,
      wrongFuel: job.situation?.wrongFuel ?? false,
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
};

export const useTowy = create<State>((set, get) => ({
  ...initial,
  hydrated: false,
  hydrate: () => {
    if (get().hydrated) return;
    const stored = load();
    if (!stored) {
      set({ hydrated: true });
      return;
    }
    const storedJobs = (stored.jobs ?? []).filter((job) => job && typeof job.id === "string").map(normalizeJob);
    const seen = new Set(storedJobs.map((job) => job.id));
    const jobs = [...storedJobs];
    for (const seed of seedJobs) {
      if (!seen.has(seed.id)) jobs.unshift(seed);
    }
    set({
      view: stored.view ?? "home",
      step: stored.step ?? 0,
      activeId: stored.activeId ?? null,
      jobs,
      reviews: stored.reviews ?? [],
      yardId: stored.yardId ?? "scioto",
      hydrated: true,
    });
  },
  setView: (view) => set({ view }),
  back: () => {
    const { view, step } = get();
    if (view === "intake" && step > 0) {
      set({ step: step - 1 });
      return;
    }
    if (view === "intake" || view === "quotes" || view === "insurer" || view === "operator" || view === "job" || view === "calling") {
      set({ view: view === "quotes" ? "intake" : "home", step: view === "quotes" ? 4 : 0 });
    }
  },
  startJob: (source = "member", lockedCoverage) => {
    const job = blankJob(source);
    if (lockedCoverage) {
      job.coverage = lockedCoverage;
      job.coverageLocked = true;
      job.contactName = "Harbor member";
    }
    set({
      jobs: [...get().jobs.filter((item) => item.id !== job.id), job],
      activeId: job.id,
      view: "intake",
      step: 0,
    });
  },
  useSample: (which) => {
    const { activeId, jobs } = get();
    if (!activeId) return;
    set({
      jobs: jobs.map((job) => (job.id === activeId ? applySample(job, which) : job)),
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
          vehicle,
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
    const calls = buildCalls(ready);
    set({
      jobs: get().jobs.map((job) => (job.id === ready.id ? { ...ready, calls, status: "calling", selectedCompanyId: null, live: null, review: null } : job)),
      view: "calling",
    });
  },
  confirmQuote: (companyId, payment) => {
    set(
      withActive(get(), (job) => {
        const quote = job.calls.find((call) => call.companyId === companyId)?.quote;
        if (!quote) return job;
        return {
          ...job,
          selectedCompanyId: companyId,
          status: "enroute",
          payment: payment ?? null,
          live: { etaMin: quote.etaMin, total: quote.total, note: "Yard accepted. Truck is rolling." },
        };
      }),
    );
    set({ view: "job" });
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
    set({
      jobs: get().jobs.map((job) => (job.id === id ? { ...job, status: "done" } : job)),
      view: id === get().activeId ? "job" : get().view,
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
          live: { etaMin: quote.etaMin, total: quote.total, note: "Accepted from the yard board." },
        };
      }),
    });
  },
  resetDemo: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ ...initial, hydrated: true });
  },
}));

if (typeof window !== "undefined") {
  useTowy.subscribe((state) => save(state));
}

export function useActiveJob(): Job | null {
  return useTowy((state) => state.jobs.find((job) => job.id === state.activeId) ?? null);
}
