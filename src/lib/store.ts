import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { BOOK_BANK, bookUnits } from "@/lib/book-units";
import {
  gradeAnswer,
  gradeKeywords,
  sampleUnits,
  shuffle,
  type QuizItem,
  type Source,
  type Unit,
} from "@/lib/workbook";

export type View = "home" | "unit" | "mix" | "quiz" | "edit";

export type WrongAnswer = { item: QuizItem; input: string };

export type Run = {
  mode: "unit" | "mix";
  label: string;
  items: QuizItem[];
  sourceItems: QuizItem[];
  index: number;
  draft: string;
  revealed: boolean;
  lastCorrect: boolean | null;
  correctCount: number;
  wrong: WrongAnswer[];
  done: boolean;
};

export type HistoryEntry = {
  at: number;
  mode: "unit" | "mix";
  label: string;
  correct: number;
  total: number;
};

type WorkbookState = {
  units: Unit[];
  source: Source;
  history: HistoryEntry[];
  book: string;
  bank: string;
  reference: string;
  view: View;
  focusUnitId: string | null;
  run: Run | null;
  hydrated: boolean;
  setHydrated: () => void;
  setBook: (book: string) => void;
  setReference: (reference: string) => void;
  setView: (view: View) => void;
  openUnits: (id?: string) => void;
  leave: (view: View) => void;
  addUnit: () => void;
  updateUnit: (unitId: string, label: string) => void;
  removeUnit: (unitId: string) => void;
  moveUnit: (unitId: string, direction: -1 | 1) => void;
  addVocab: (unitId: string) => void;
  updateVocab: (unitId: string, vocabId: string, patch: { word?: string; sentence?: string }) => void;
  removeVocab: (unitId: string, vocabId: string) => void;
  addQuestion: (unitId: string) => void;
  updateQuestion: (unitId: string, questionId: string, patch: { prompt?: string; answer?: string }) => void;
  removeQuestion: (unitId: string, questionId: string) => void;
  replaceAll: (units: Unit[]) => void;
  appendUnits: (units: Unit[]) => void;
  loadSample: () => void;
  clearUnits: () => void;
  startRun: (args: { mode: "unit" | "mix"; label: string; items: QuizItem[] }) => void;
  setDraft: (draft: string) => void;
  commit: (force: boolean) => boolean;
  next: () => void;
  retryWrong: () => void;
  retryAll: () => void;
};

function patchUnit(units: Unit[], unitId: string, map: (unit: Unit) => Unit) {
  return units.map((unit) => (unit.id === unitId ? map(unit) : unit));
}

function blankRun(mode: Run["mode"], label: string, items: QuizItem[], sourceItems: QuizItem[]): Run {
  return {
    mode,
    label,
    items,
    sourceItems,
    index: 0,
    draft: "",
    revealed: false,
    lastCorrect: null,
    correctCount: 0,
    wrong: [],
    done: false,
  };
}

const memory: { timer?: ReturnType<typeof setTimeout>; pending?: { name: string; value: string } } = {};

function flushStorage() {
  if (!memory.pending || typeof localStorage === "undefined") return;
  localStorage.setItem(memory.pending.name, memory.pending.value);
  memory.pending = undefined;
}

const storage: StateStorage = {
  getItem: (name) => {
    if (typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem(name);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as { state?: { bank?: string; book?: string; units?: Unit[]; source?: Source } };
      if (!parsed.state) return raw;
      let changed = false;
      if (typeof parsed.state.book === "string" && parsed.state.book.length > 20_000) {
        parsed.state.book = "";
        changed = true;
      }
      if (parsed.state.bank !== BOOK_BANK) {
        parsed.state.units = bookUnits();
        parsed.state.source = "user";
        parsed.state.bank = BOOK_BANK;
        changed = true;
      }
      if (!changed) return raw;
      const next = JSON.stringify(parsed);
      localStorage.setItem(name, next);
      return next;
    } catch {
      return raw;
    }
  },
  setItem: (name, value) => {
    memory.pending = { name, value };
    clearTimeout(memory.timer);
    memory.timer = setTimeout(flushStorage, 250);
  },
  removeItem: (name) => {
    memory.pending = undefined;
    if (typeof localStorage !== "undefined") localStorage.removeItem(name);
  },
};

if (typeof window !== "undefined") window.addEventListener("pagehide", flushStorage);

export const useWorkbook = create<WorkbookState>()(
  persist(
    (set, get) => ({
      units: bookUnits(),
      source: "user",
      history: [],
      book: "",
      bank: BOOK_BANK,
      reference: "",
      view: "home",
      focusUnitId: null,
      run: null,
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),
      setBook: (book) => set({ book }),
      setReference: (reference) => set({ reference }),
      setView: (view) => set({ view }),
      openUnits: (id) => set({ view: "unit", focusUnitId: id ?? null }),
      leave: (view) => set({ run: null, view }),
      addUnit: () => {
        const unit: Unit = {
          id: crypto.randomUUID(),
          label: `Unit ${get().units.length + 1}`,
          vocab: [{ id: crypto.randomUUID(), word: "", sentence: "" }],
          questions: [{ id: crypto.randomUUID(), prompt: "", answer: "" }],
        };
        set({ units: [...get().units, unit], source: "user" });
      },
      updateUnit: (unitId, label) =>
        set({ units: patchUnit(get().units, unitId, (unit) => ({ ...unit, label })), source: "user" }),
      removeUnit: (unitId) => {
        const units = get().units.filter((unit) => unit.id !== unitId);
        set({ units, source: units.length ? "user" : "empty" });
      },
      moveUnit: (unitId, direction) => {
        const units = get().units.slice();
        const index = units.findIndex((unit) => unit.id === unitId);
        const next = index + direction;
        if (index < 0 || next < 0 || next >= units.length) return;
        const [row] = units.splice(index, 1);
        if (!row) return;
        units.splice(next, 0, row);
        set({ units, source: "user" });
      },
      addVocab: (unitId) =>
        set({
          source: "user",
          units: patchUnit(get().units, unitId, (unit) => ({
            ...unit,
            vocab: [...unit.vocab, { id: crypto.randomUUID(), word: "", sentence: "" }],
          })),
        }),
      updateVocab: (unitId, vocabId, patch) =>
        set({
          source: "user",
          units: patchUnit(get().units, unitId, (unit) => ({
            ...unit,
            vocab: unit.vocab.map((vocab) => (vocab.id === vocabId ? { ...vocab, ...patch } : vocab)),
          })),
        }),
      removeVocab: (unitId, vocabId) =>
        set({
          source: "user",
          units: patchUnit(get().units, unitId, (unit) => ({
            ...unit,
            vocab: unit.vocab.filter((vocab) => vocab.id !== vocabId),
          })),
        }),
      addQuestion: (unitId) =>
        set({
          source: "user",
          units: patchUnit(get().units, unitId, (unit) => ({
            ...unit,
            questions: [...unit.questions, { id: crypto.randomUUID(), prompt: "", answer: "" }],
          })),
        }),
      updateQuestion: (unitId, questionId, patch) =>
        set({
          source: "user",
          units: patchUnit(get().units, unitId, (unit) => ({
            ...unit,
            questions: unit.questions.map((question) =>
              question.id === questionId ? { ...question, ...patch } : question,
            ),
          })),
        }),
      removeQuestion: (unitId, questionId) =>
        set({
          source: "user",
          units: patchUnit(get().units, unitId, (unit) => ({
            ...unit,
            questions: unit.questions.filter((question) => question.id !== questionId),
          })),
        }),
      replaceAll: (units) => set({ units, source: units.length ? "user" : "empty" }),
      appendUnits: (units) => set({ units: [...get().units, ...units], source: "user" }),
      loadSample: () => set({ units: sampleUnits(), source: "sample" }),
      clearUnits: () => set({ units: [], source: "empty" }),
      startRun: ({ mode, label, items }) =>
        set({ view: "quiz", run: blankRun(mode, label, items, items.slice()) }),
      setDraft: (draft) => {
        const run = get().run;
        if (!run || run.revealed || run.done) return;
        set({ run: { ...run, draft } });
      },
      commit: (force) => {
        const run = get().run;
        if (!run || run.revealed || run.done) return false;
        const item = run.items[run.index];
        if (!item) return false;
        if (!force && !run.draft.trim()) return false;
        const ok = run.draft.trim()
          ? item.accept
            ? gradeKeywords(run.draft, item.accept) || gradeAnswer(run.draft, item.answer)
            : gradeAnswer(run.draft, item.answer)
          : false;
        set({
          run: {
            ...run,
            revealed: true,
            lastCorrect: ok,
            correctCount: run.correctCount + (ok ? 1 : 0),
            wrong: ok ? run.wrong : [...run.wrong, { item, input: run.draft }],
          },
        });
        return true;
      },
      next: () => {
        const run = get().run;
        if (!run || !run.revealed || run.done) return;
        const index = run.index + 1;
        if (index >= run.items.length) {
          const entry: HistoryEntry = {
            at: Date.now(),
            mode: run.mode,
            label: run.label,
            correct: run.correctCount,
            total: run.items.length,
          };
          set({
            run: { ...run, done: true, draft: "" },
            history: [entry, ...get().history].slice(0, 12),
          });
          return;
        }
        set({ run: { ...run, index, draft: "", revealed: false, lastCorrect: null } });
      },
      retryWrong: () => {
        const run = get().run;
        if (!run || !run.wrong.length) return;
        set({
          run: blankRun(
            run.mode,
            `Ôn câu sai · ${run.label}`,
            run.wrong.map((row) => row.item),
            run.wrong.map((row) => row.item),
          ),
        });
      },
      retryAll: () => {
        const run = get().run;
        if (!run) return;
        set({ run: blankRun(run.mode, run.label, shuffle(run.sourceItems), run.sourceItems) });
      },
    }),
    {
      name: "vo-unit-v1",
      skipHydration: true,
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({
        units: state.units,
        source: state.source,
        history: state.history,
        book: state.book,
        bank: state.bank,
      }),
    },
  ),
);
