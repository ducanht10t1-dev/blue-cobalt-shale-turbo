export type Vocab = { id: string; word: string; sentence: string };
export type Question = { id: string; prompt: string; answer: string; accept?: string };
export type Unit = { id: string; label: string; vocab: Vocab[]; clozes?: Vocab[]; questions: Question[] };
export type Source = "empty" | "sample" | "user";
export type Kind = "cloze" | "vocab" | "short";

export type QuizItem = {
  id: string;
  kind: Kind;
  unitId: string;
  unitLabel: string;
  word: string;
  sentence: string;
  prompt: string;
  answer: string;
  accept?: string;
};

export type ParseResult = { units: Unit[]; warnings: string[] };

export type SentencePart = { text: string; blank: boolean };

export const PASTE_TEMPLATE = `# Unit 1: Tên bài

## Từ vựng
hello | Hello, my name is Lan.
morning | Good morning, how are you?

## Trả lời ngắn
Q: How do you greet someone in the morning?
A: Good morning.

What do you say when you meet a friend?
Hello.
`;

export function uid(): string {
  return crypto.randomUUID();
}

export function sampleUnits(): Unit[] {
  return [
    {
      id: uid(),
      label: "Unit 1: Management (mẫu)",
      vocab: [
        {
          id: uid(),
          word: "planning",
          sentence:
            "involves setting aims or targets for the future of the organization to give it a sense of direction or purpose. Managers must also plan for the resources (physical, human, and financial) that will be needed to achieve these strategies.",
        },
        {
          id: uid(),
          word: "manager",
          sentence:
            "An individual who is in charge of a certain group of tasks, or a certain area or department of a business.",
        },
        {
          id: uid(),
          word: "controlling",
          sentence:
            "A management function that involves establishing clear standards to determine whether an organization is progressing toward its goals, rewarding people for doing a good job, and taking corrective action if they are not.",
        },
      ],
      questions: [
        {
          id: uid(),
          prompt: "How do you greet someone in the morning?",
          answer: "Good morning.",
        },
        {
          id: uid(),
          prompt: "What do you say when you meet someone for the first time?",
          answer: "Nice to meet you.",
        },
      ],
    },
    {
      id: uid(),
      label: "Unit 2: Classroom (mẫu)",
      vocab: [
        { id: uid(), word: "teacher", sentence: "The person who teaches the class." },
        { id: uid(), word: "student", sentence: "A person who studies in a class." },
        { id: uid(), word: "homework", sentence: "School work that a student does after class." },
      ],
      questions: [
        {
          id: uid(),
          prompt: "What do you call the person who teaches the class?",
          answer: "A teacher. | Teacher",
        },
        {
          id: uid(),
          prompt: "When do you do your homework?",
          answer: "After dinner.",
        },
      ],
    },
  ];
}

export function unitStats(unit: Unit) {
  return {
    cloze: (unit.clozes ?? []).filter((item) => item.word.trim() && item.sentence.trim()).length,
    vocab: unit.vocab.filter((item) => item.word.trim() && item.sentence.trim()).length,
    questions: unit.questions.filter((item) => item.prompt.trim() && item.answer.trim()).length,
  };
}

export function tally(units: Unit[]) {
  return units.reduce(
    (acc, unit) => {
      const stats = unitStats(unit);
      acc.cloze += stats.cloze;
      acc.vocab += stats.vocab;
      acc.questions += stats.questions;
      return acc;
    },
    { units: units.length, cloze: 0, vocab: 0, questions: 0 },
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function maskSentence(sentence: string, word: string): { parts: SentencePart[]; hits: number } {
  const trimmed = word.trim();
  if (!trimmed) return { parts: [{ text: sentence, blank: false }], hits: 0 };

  const pattern = new RegExp(
    `(?<![\\p{L}\\p{N}])(${escapeRegExp(trimmed)})(?![\\p{L}\\p{N}])`,
    "giu",
  );
  const parts: SentencePart[] = [];
  let last = 0;
  let hits = 0;
  for (const match of sentence.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > last) parts.push({ text: sentence.slice(last, index), blank: false });
    parts.push({ text: match[1] ?? trimmed, blank: true });
    last = index + match[0].length;
    hits += 1;
  }
  if (last < sentence.length) parts.push({ text: sentence.slice(last), blank: false });
  if (hits > 0) return { parts: parts.filter((part) => part.blank || part.text.length > 0), hits };

  const lower = sentence.toLowerCase();
  const needle = trimmed.toLowerCase();
  const index = lower.indexOf(needle);
  if (index < 0) return { parts: [{ text: sentence, blank: false }], hits: 0 };
  return {
    hits: 1,
    parts: [
      { text: sentence.slice(0, index), blank: false },
      { text: sentence.slice(index, index + trimmed.length), blank: true },
      { text: sentence.slice(index + trimmed.length), blank: false },
    ].filter((part) => part.blank || part.text.length > 0),
  };
}

export function cueSentence(sentence: string, word: string) {
  const masked = maskSentence(sentence, word);
  if (!masked.hits) return sentence.trim();
  const text = masked.parts
    .filter((part) => !part.blank)
    .map((part) => part.text)
    .join("")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
  return text || sentence.trim();
}

export function normAnswer(value: string) {
  return value
    .trim()
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .replace(/[.,!?;:…]+$/u, "")
    .toLowerCase();
}

export function answerOptions(expected: string) {
  const parts = expected
    .split(/\s*\|\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length ? parts : [expected];
}

export function gradeAnswer(input: string, expected: string) {
  const got = normAnswer(input);
  if (!got) return false;
  return answerOptions(expected).some((option) => normAnswer(option) === got);
}

export function gradeKeywords(input: string, accept: string) {
  const got = normAnswer(input);
  if (!got) return false;
  const groups = accept
    .split(/\s*&\s*/)
    .map((group) => group.trim())
    .filter(Boolean);
  if (!groups.length) return false;
  return groups.every((group) => answerOptions(group).some((option) => hasTerm(got, option)));
}

function hasTerm(haystack: string, needle: string) {
  const term = normAnswer(needle);
  if (!term) return false;
  if (term.length >= 6 || term.includes(" ")) return haystack.includes(term);
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(term)}(?![\\p{L}\\p{N}])`, "u");
  return pattern.test(haystack);
}

export function clozeTarget(word: string, sentence: string) {
  const options = answerOptions(word);
  const lower = sentence.toLowerCase();
  return options.find((option) => lower.includes(option.toLowerCase())) ?? options[0] ?? word;
}

export function collectItems(units: Unit[], unitIds: string[], kinds: Kind[]): QuizItem[] {
  const allowed = new Set(unitIds);
  const items: QuizItem[] = [];
  for (const unit of units) {
    if (!allowed.has(unit.id)) continue;
    if (kinds.includes("cloze")) {
      for (const item of unit.clozes ?? []) {
        const word = item.word.trim();
        const sentence = item.sentence.trim();
        if (!word || !sentence) continue;
        items.push({
          id: item.id,
          kind: "cloze",
          unitId: unit.id,
          unitLabel: unit.label,
          word,
          sentence,
          prompt: sentence,
          answer: word,
        });
      }
    }
    if (kinds.includes("vocab")) {
      for (const vocab of unit.vocab) {
        const word = vocab.word.trim();
        const sentence = vocab.sentence.trim();
        if (!word || !sentence) continue;
        items.push({
          id: vocab.id,
          kind: "vocab",
          unitId: unit.id,
          unitLabel: unit.label,
          word,
          sentence,
          prompt: sentence,
          answer: word,
        });
      }
    }
    if (kinds.includes("short")) {
      for (const question of unit.questions) {
        const prompt = question.prompt.trim();
        const answer = question.answer.trim();
        if (!prompt || !answer) continue;
        items.push({
          id: question.id,
          kind: "short",
          unitId: unit.id,
          unitLabel: unit.label,
          word: "",
          sentence: "",
          prompt,
          answer,
          accept: question.accept,
        });
      }
    }
  }
  return items;
}

export function shuffle<T>(list: T[]): T[] {
  const next = list.slice();
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    const current = next[index]!;
    next[index] = next[swap]!;
    next[swap] = current;
  }
  return next;
}

export function buildQuiz(items: QuizItem[], limit: number | "all", doShuffle: boolean) {
  const ordered = doShuffle ? shuffle(items) : items.slice();
  return limit === "all" ? ordered : ordered.slice(0, limit);
}

function clip(value: string) {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length > 72 ? `${clean.slice(0, 72)}…` : clean;
}

function isVocabHeader(line: string) {
  return /^(?:#{1,6}\s*)?(?:từ vựng|vocabulary|vocab|words|điền từ)\b[:\s-]*$/i.test(line);
}

function isShortHeader(line: string) {
  return /^(?:#{1,6}\s*)?(?:trả lời ngắn|câu hỏi ngắn|câu hỏi|hỏi đáp|short answers?|q\s*&\s*a|qa)\b[:\s-]*$/i.test(
    line,
  );
}

function unitLabelFrom(line: string) {
  const match = line.match(/^(?:#{1,6}\s*)((?:unit|bài)\s+\d+\b.*)$/i);
  if (!match?.[1]) return null;
  return match[1].replace(/\s+/g, " ").trim();
}

function stripBullet(line: string) {
  return line.replace(/^(?:[-*•]|\d+[.)])\s+/, "");
}

function splitOnce(line: string, pattern: RegExp) {
  const match = pattern.exec(line);
  if (!match || match.index <= 0) return null;
  const left = line.slice(0, match.index).trim();
  const right = line.slice(match.index + match[0].length).trim();
  if (!left || !right) return null;
  return [left, right] as const;
}

function splitVocab(line: string) {
  const separators: { pattern: RegExp; loose?: boolean }[] = [
    { pattern: /\s+\|\s+/ },
    { pattern: /\s+::\s+/ },
    { pattern: /\s+[—–]\s+/ },
    { pattern: /\t+/ },
    { pattern: /\s+-\s+/, loose: true },
    { pattern: /\s*:\s+/, loose: true },
  ];
  let best: { index: number; length: number; loose: boolean } | null = null;
  for (const separator of separators) {
    const match = separator.pattern.exec(line);
    if (!match || match.index <= 0) continue;
    if (!best || match.index < best.index) {
      best = { index: match.index, length: match[0].length, loose: Boolean(separator.loose) };
    }
  }
  if (!best) return null;
  const word = line.slice(0, best.index).trim();
  const sentence = line.slice(best.index + best.length).trim();
  if (!word || !sentence) return null;
  if (best.loose && (word.split(/\s+/).length > 6 || word.length > 42 || word.includes("?"))) return null;
  return { word, sentence };
}

export function parseWorkbook(raw: string): ParseResult {
  if (!raw.trim()) return { units: [], warnings: [] };
  const warnings: string[] = [];
  const units: Unit[] = [];
  let current: Unit | null = null;
  let section: "vocab" | "short" | null = null;
  let pending: string | null = null;
  let warnedImplicit = false;

  const ensure = () => {
    if (current) return current;
    current = { id: uid(), label: "Unit 1", vocab: [], questions: [] };
    units.push(current);
    if (!warnedImplicit) {
      warnings.push("Không thấy tiêu đề unit ở đầu — đã tạo Unit 1.");
      warnedImplicit = true;
    }
    return current;
  };

  const dropPending = (lineNo: number) => {
    if (!pending) return;
    warnings.push(`Dòng ${lineNo}: câu hỏi chưa có đáp án — "${clip(pending)}".`);
    pending = null;
  };

  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  lines.forEach((original, index) => {
    const lineNo = index + 1;
    const line = original.trim();
    if (!line || /^[-—–=]{3,}$/.test(line)) return;

    const structural =
      Boolean(unitLabelFrom(line)) || isVocabHeader(line) || isShortHeader(line) || /^(?:q|hỏi|câu hỏi|câu)\s*[:.)]/i.test(line);

    if (pending && !structural) {
      const unit = ensure();
      const answer = line.match(/^(?:a|đáp án|đáp|trả lời)\s*[:.)]\s*(.+)$/i);
      unit.questions.push({ id: uid(), prompt: pending, answer: (answer?.[1] ?? line).trim() });
      pending = null;
      section = "short";
      return;
    }

    const label = unitLabelFrom(line);
    if (label) {
      dropPending(lineNo);
      current = { id: uid(), label, vocab: [], questions: [] };
      units.push(current);
      section = null;
      return;
    }

    if (isVocabHeader(line)) {
      dropPending(lineNo);
      ensure();
      section = "vocab";
      return;
    }
    if (isShortHeader(line)) {
      dropPending(lineNo);
      ensure();
      section = "short";
      return;
    }

    const content = stripBullet(line);
    const unit = ensure();

    if (section !== "short") {
      const vocab = splitVocab(content);
      if (vocab && !/[?？]\s*$/.test(vocab.word)) {
        unit.vocab.push({ id: uid(), ...vocab });
        if (!section) section = "vocab";
        return;
      }
    }

    if (section === "vocab") {
      warnings.push(`Dòng ${lineNo}: không đọc được từ vựng — "${clip(content)}". Dùng dấu | giữa từ và câu.`);
      return;
    }

    section = "short";
    const paired = splitOnce(content, /\s+\|\|\s+/) ?? splitOnce(content, /\s+\|\s+/);
    if (paired) {
      const prompt = paired[0].replace(/^(?:q|hỏi|câu hỏi|câu)\s*[:.)]\s*/i, "").trim();
      const answer = paired[1].replace(/^(?:a|đáp án|đáp|trả lời)\s*[:.)]\s*/i, "").trim();
      if (prompt && answer) {
        unit.questions.push({ id: uid(), prompt, answer });
        return;
      }
    }

    const question = content.match(/^(?:q|hỏi|câu hỏi|câu)\s*[:.)]\s*(.+)$/i);
    if (question?.[1]) {
      dropPending(lineNo);
      pending = question[1].trim();
      return;
    }

    if (content.endsWith("?")) {
      dropPending(lineNo);
      pending = content;
      return;
    }

    warnings.push(`Dòng ${lineNo}: chưa rõ câu hỏi hay đáp án — "${clip(content)}". Viết Q: và A:.`);
  });

  if (pending) warnings.push(`Câu hỏi cuối chưa có đáp án — "${clip(pending)}".`);
  for (const unit of units) {
    if (!unit.vocab.length && !unit.questions.length) warnings.push(`${unit.label}: chưa có từ hoặc câu hỏi.`);
  }
  return { units, warnings };
}

export function importBank(text: string): { ok: true; units: Unit[] } | { ok: false; error: string } {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: "File không phải JSON." };
  }
  const rawUnits =
    Array.isArray(data) ? data : data && typeof data === "object" && "units" in data ? (data as { units: unknown }).units : null;
  if (!Array.isArray(rawUnits)) return { ok: false, error: "JSON cần có mảng units." };

  const units: Unit[] = [];
  for (const row of rawUnits) {
    if (!row || typeof row !== "object") continue;
    const record = row as Record<string, unknown>;
    if (typeof record.label !== "string" || !record.label.trim()) continue;
    const vocabIn = Array.isArray(record.vocab) ? record.vocab : [];
    const questionsIn = Array.isArray(record.questions) ? record.questions : [];
    units.push({
      id: uid(),
      label: record.label.trim(),
      vocab: vocabIn.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const vocab = item as Record<string, unknown>;
        if (typeof vocab.word !== "string" || typeof vocab.sentence !== "string") return [];
        return [{ id: uid(), word: vocab.word, sentence: vocab.sentence }];
      }),
      questions: questionsIn.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const question = item as Record<string, unknown>;
        if (typeof question.prompt !== "string" || typeof question.answer !== "string") return [];
        return [{ id: uid(), prompt: question.prompt, answer: question.answer }];
      }),
    });
  }
  if (!units.length) return { ok: false, error: "Không thấy unit nào trong file." };
  return { ok: true, units };
}

export function exportBank(units: Unit[]) {
  return JSON.stringify({ units }, null, 2);
}
