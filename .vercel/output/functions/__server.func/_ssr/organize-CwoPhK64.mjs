import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
import { t as keepVerbatim } from "./organize-plan-Co18MFu8.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/organize-CwoPhK64.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var SCHEMA = {
	type: "object",
	additionalProperties: false,
	required: ["units"],
	properties: { units: {
		type: "array",
		items: {
			type: "object",
			additionalProperties: false,
			required: [
				"label",
				"vocab",
				"questions"
			],
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
							sentence: { type: "string" }
						}
					}
				},
				questions: {
					type: "array",
					items: {
						type: "object",
						additionalProperties: false,
						required: ["prompt", "answer"],
						properties: {
							prompt: { type: "string" },
							answer: { type: "string" }
						}
					}
				}
			}
		}
	} }
};
var SYSTEM = `You sort messy student notes into English exercise units. A textbook excerpt may be included.
Rules:
- Never paraphrase, translate, fix grammar, or invent text.
- Every label, word, sentence, prompt, and answer must be copied character-for-character from the notes or the textbook. You may only trim whitespace around a copied span.
- Prefer the student's notes. Use the textbook only to recover the original sentence or question when the notes refer to it but do not contain the full wording.
- Vocab: an English word or short phrase, plus an English sentence that contains that word. Do not put a question in the word field.
- Short answer: the question (usually ending with ?) and the expected answer, both copied verbatim.
- Skip anything you cannot copy exactly.
- Keep the unit label as written in the source.`;
function clipInput(value, max) {
	return value.length > max ? value.slice(0, max) : value;
}
async function runOrganize(notes, book, apiKey) {
	const cleanNotes = clipInput(notes.trim(), 16e3);
	const cleanBook = clipInput(book.trim(), 16e3);
	if (!cleanNotes && !cleanBook) return {
		ok: false,
		error: "Chưa có bài để lọc."
	};
	const user = `STUDENT NOTES:\n${cleanNotes || "(none)"}\n\nTEXTBOOK:\n${cleanBook || "(none)"}`;
	let response;
	try {
		response = await fetch("https://api.x.ai/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`
			},
			signal: AbortSignal.timeout(5e4),
			body: JSON.stringify({
				model: "grok-4.5",
				reasoning_effort: "low",
				max_tokens: 8e3,
				messages: [{
					role: "system",
					content: SYSTEM
				}, {
					role: "user",
					content: user
				}],
				response_format: {
					type: "json_schema",
					json_schema: {
						name: "units",
						strict: true,
						schema: SCHEMA
					}
				}
			})
		});
	} catch {
		return {
			ok: false,
			error: "Lọc quá lâu hoặc mất kết nối. Thử lại, hoặc chia nhỏ theo unit."
		};
	}
	if (!response.ok) return {
		ok: false,
		error: "Chưa lọc được lúc này. Thử lại sau, hoặc dùng lọc nhanh."
	};
	const content = (await response.json()).choices?.[0]?.message?.content ?? "";
	let parsed;
	try {
		parsed = JSON.parse(content);
	} catch {
		return {
			ok: false,
			error: "Kết quả lọc không đọc được. Thử lại."
		};
	}
	const raw = Array.isArray(parsed.units) ? parsed.units : [];
	const { units, dropped } = keepVerbatim(raw, cleanNotes, cleanBook);
	const warnings = [];
	if (dropped) warnings.push(`Bỏ ${dropped} mục vì không trùng nguyên văn trong bài hoặc sách.`);
	if (!units.length) warnings.push("Không giữ được mục nào đúng chữ gốc.");
	return {
		ok: true,
		units,
		warnings
	};
}
var organizeContent_createServerFn_handler = createServerRpc({
	id: "31fe0773904cdadb0fc5ef623c2bcabc02560b6da99ebaf957c7e0264ffcb6e8",
	name: "organizeContent",
	filename: "src/lib/organize.ts"
}, (opts) => organizeContent.__executeServer(opts));
var organizeContent = createServerFn({ method: "POST" }).validator((input) => ({
	notes: typeof input?.notes === "string" ? input.notes : "",
	book: typeof input?.book === "string" ? input.book : ""
})).handler(organizeContent_createServerFn_handler, async ({ data }) => {
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return {
		ok: false,
		error: "Lọc tự động chưa bật. Dùng lọc nhanh."
	};
	return runOrganize(data.notes, data.book, apiKey);
});
//#endregion
export { organizeContent_createServerFn_handler };
