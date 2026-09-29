import { createServerFn } from "@tanstack/react-start";
import { keepVerbatim, type RawUnit } from "@/lib/organize-plan";

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["units"],
  properties: {
    units: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label", "vocab", "questions"],
        properties: {
          label: { type: "string" },
          vocab: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["word", "sentence"],
              properties: {
                word: { type: "string" },
                sentence: { type: "string" },
              },
            },
          },
          questions: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["prompt", "answer"],
              properties: {
                prompt: { type: "string" },
                answer: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
} as const;

const SYSTEM = `You sort messy student notes into English exercise units. A textbook excerpt may be included.
Rules:
- Never paraphrase, translate, fix grammar, or invent text.
- Every label, word, sentence, prompt, and answer must be copied character-for-character from the notes or the textbook. You may only trim whitespace around a copied span.
- Prefer the student's notes. Use the textbook only to recover the original sentence or question when the notes refer to it but do not contain the full wording.
- Vocab: an English word or short phrase, plus an English sentence that contains that word. Do not put a question in the word field.
- Short answer: the question (usually ending with ?) and the expected answer, both copied verbatim.
- Skip anything you cannot copy exactly.
- Keep the unit label as written in the source.`;

export type OrganizeResult =
  | { ok: true; units: RawUnit[]; warnings: string[] }
  | { ok: false; error: string };

function clipInput(value: string, max: number) {
  return value.length > max ? value.slice(0, max) : value;
}

export async function runOrganize(notes: string, book: string, apiKey: string): Promise<OrganizeResult> {
  const cleanNotes = clipInput(notes.trim(), 16000);
  const cleanBook = clipInput(book.trim(), 16000);
  if (!cleanNotes && !cleanBook) return { ok: false, error: "Chưa có bài để lọc." };

  const user = `STUDENT NOTES:\n${cleanNotes || "(none)"}\n\nTEXTBOOK:\n${cleanBook || "(none)"}`;
  let response: Response;
  try {
    response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(50000),
      body: JSON.stringify({
        model: "grok-4.5",
        reasoning_effort: "low",
        max_tokens: 8000,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: user },
        ],
        response_format: { type: "json_schema", json_schema: { name: "units", strict: true, schema: SCHEMA } },
      }),
    });
  } catch {
    return { ok: false, error: "Lọc quá lâu hoặc mất kết nối. Thử lại, hoặc chia nhỏ theo unit." };
  }

  if (!response.ok) {
    return { ok: false, error: "Chưa lọc được lúc này. Thử lại sau, hoặc dùng lọc nhanh." };
  }

  const body = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const content = body.choices?.[0]?.message?.content ?? "";
  let parsed: { units?: RawUnit[] };
  try {
    parsed = JSON.parse(content) as { units?: RawUnit[] };
  } catch {
    return { ok: false, error: "Kết quả lọc không đọc được. Thử lại." };
  }

  const raw = Array.isArray(parsed.units) ? parsed.units : [];
  const { units, dropped } = keepVerbatim(raw, cleanNotes, cleanBook);
  const warnings: string[] = [];
  if (dropped) warnings.push(`Bỏ ${dropped} mục vì không trùng nguyên văn trong bài hoặc sách.`);
  if (!units.length) warnings.push("Không giữ được mục nào đúng chữ gốc.");
  return { ok: true, units, warnings };
}

export const organizeContent = createServerFn({ method: "POST" })
  .validator((input: { notes?: string; book?: string }) => ({
    notes: typeof input?.notes === "string" ? input.notes : "",
    book: typeof input?.book === "string" ? input.book : "",
  }))
  .handler(async ({ data }): Promise<OrganizeResult> => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false, error: "Lọc tự động chưa bật. Dùng lọc nhanh." };
    return runOrganize(data.notes, data.book, apiKey);
  });
