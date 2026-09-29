import { i as __toESM } from "../_runtime.mjs";
import { b as require_jsx_runtime, q as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { n as planChunks } from "./organize-plan-Co18MFu8.mjs";
import { a as ChevronUp, i as Plus, n as Trash2, o as ChevronDown, r as Shuffle, s as BookOpen } from "../_libs/lucide-react.mjs";
import { n as persist, r as create, t as createJSONStorage } from "../_libs/zustand.mjs";
import { t as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-zQBQHdfG.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var organizeContent = createServerFn({ method: "POST" }).validator((input) => ({
	notes: typeof input?.notes === "string" ? input.notes : "",
	book: typeof input?.book === "string" ? input.book : ""
})).handler(createSsrRpc("31fe0773904cdadb0fc5ef623c2bcabc02560b6da99ebaf957c7e0264ffcb6e8"));
var MAX_BYTES = 125829120;
var MAX_CHARS = 15e5;
async function readBookFile(file) {
	if (file.size > MAX_BYTES) return {
		ok: false,
		error: "File quá nặng. Hãy tách PDF theo từng unit rồi mở lại."
	};
	if (!(file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"))) {
		const text = (await file.text()).trim();
		if (!text) return {
			ok: false,
			error: "File không có chữ."
		};
		return {
			ok: true,
			text: clip$1(text),
			note: "Đã mở file chữ."
		};
	}
	const { extractText } = await import("../_libs/unpdf.mjs").then((n) => n.t);
	const result = await extractText(new Uint8Array(await file.arrayBuffer()), { mergePages: true });
	const text = (Array.isArray(result.text) ? result.text.join("\n") : result.text).replace(/\u0000/g, "").trim();
	const pages = result.totalPages;
	if (!text || pages > 1 && text.length < 40) return {
		ok: false,
		error: "PDF này là ảnh scan, không có chữ để copy. Bấm Nạp sách này — English for Business Studies đã được đọc sẵn."
	};
	const clipped = text.length > MAX_CHARS;
	return {
		ok: true,
		text: clip$1(text),
		note: clipped ? `Đã đọc ${pages} trang, chỉ giữ phần đầu vì file quá dài.` : `Đã đọc ${pages} trang từ PDF.`
	};
}
function clip$1(text) {
	return text.length > MAX_CHARS ? text.slice(0, MAX_CHARS) : text;
}
var PASTE_TEMPLATE = `# Unit 1: Tên bài

## Từ vựng
hello | Hello, my name is Lan.
morning | Good morning, how are you?

## Trả lời ngắn
Q: How do you greet someone in the morning?
A: Good morning.

What do you say when you meet a friend?
Hello.
`;
function uid() {
	return crypto.randomUUID();
}
function sampleUnits() {
	return [{
		id: uid(),
		label: "Unit 1: Management (mẫu)",
		vocab: [
			{
				id: uid(),
				word: "planning",
				sentence: "involves setting aims or targets for the future of the organization to give it a sense of direction or purpose. Managers must also plan for the resources (physical, human, and financial) that will be needed to achieve these strategies."
			},
			{
				id: uid(),
				word: "manager",
				sentence: "An individual who is in charge of a certain group of tasks, or a certain area or department of a business."
			},
			{
				id: uid(),
				word: "controlling",
				sentence: "A management function that involves establishing clear standards to determine whether an organization is progressing toward its goals, rewarding people for doing a good job, and taking corrective action if they are not."
			}
		],
		questions: [{
			id: uid(),
			prompt: "How do you greet someone in the morning?",
			answer: "Good morning."
		}, {
			id: uid(),
			prompt: "What do you say when you meet someone for the first time?",
			answer: "Nice to meet you."
		}]
	}, {
		id: uid(),
		label: "Unit 2: Classroom (mẫu)",
		vocab: [
			{
				id: uid(),
				word: "teacher",
				sentence: "The person who teaches the class."
			},
			{
				id: uid(),
				word: "student",
				sentence: "A person who studies in a class."
			},
			{
				id: uid(),
				word: "homework",
				sentence: "School work that a student does after class."
			}
		],
		questions: [{
			id: uid(),
			prompt: "What do you call the person who teaches the class?",
			answer: "A teacher. | Teacher"
		}, {
			id: uid(),
			prompt: "When do you do your homework?",
			answer: "After dinner."
		}]
	}];
}
function unitStats(unit) {
	return {
		cloze: (unit.clozes ?? []).filter((item) => item.word.trim() && item.sentence.trim()).length,
		vocab: unit.vocab.filter((item) => item.word.trim() && item.sentence.trim()).length,
		questions: unit.questions.filter((item) => item.prompt.trim() && item.answer.trim()).length
	};
}
function tally(units) {
	return units.reduce((acc, unit) => {
		const stats = unitStats(unit);
		acc.cloze += stats.cloze;
		acc.vocab += stats.vocab;
		acc.questions += stats.questions;
		return acc;
	}, {
		units: units.length,
		cloze: 0,
		vocab: 0,
		questions: 0
	});
}
function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function maskSentence(sentence, word) {
	const trimmed = word.trim();
	if (!trimmed) return {
		parts: [{
			text: sentence,
			blank: false
		}],
		hits: 0
	};
	const pattern = new RegExp(`(?<![\\p{L}\\p{N}])(${escapeRegExp(trimmed)})(?![\\p{L}\\p{N}])`, "giu");
	const parts = [];
	let last = 0;
	let hits = 0;
	for (const match of sentence.matchAll(pattern)) {
		const index = match.index ?? 0;
		if (index > last) parts.push({
			text: sentence.slice(last, index),
			blank: false
		});
		parts.push({
			text: match[1] ?? trimmed,
			blank: true
		});
		last = index + match[0].length;
		hits += 1;
	}
	if (last < sentence.length) parts.push({
		text: sentence.slice(last),
		blank: false
	});
	if (hits > 0) return {
		parts: parts.filter((part) => part.blank || part.text.length > 0),
		hits
	};
	const lower = sentence.toLowerCase();
	const needle = trimmed.toLowerCase();
	const index = lower.indexOf(needle);
	if (index < 0) return {
		parts: [{
			text: sentence,
			blank: false
		}],
		hits: 0
	};
	return {
		hits: 1,
		parts: [
			{
				text: sentence.slice(0, index),
				blank: false
			},
			{
				text: sentence.slice(index, index + trimmed.length),
				blank: true
			},
			{
				text: sentence.slice(index + trimmed.length),
				blank: false
			}
		].filter((part) => part.blank || part.text.length > 0)
	};
}
function cueSentence(sentence, word) {
	const masked = maskSentence(sentence, word);
	if (!masked.hits) return sentence.trim();
	return masked.parts.filter((part) => !part.blank).map((part) => part.text).join("").replace(/[ \t]{2,}/g, " ").replace(/\s+([,.;:!?])/g, "$1").trim() || sentence.trim();
}
function normAnswer(value) {
	return value.trim().replace(/[“”]/g, "\"").replace(/[‘’]/g, "'").replace(/\s+/g, " ").replace(/[.,!?;:…]+$/u, "").toLowerCase();
}
function answerOptions(expected) {
	const parts = expected.split(/\s*\|\s*/).map((part) => part.trim()).filter(Boolean);
	return parts.length ? parts : [expected];
}
function gradeAnswer(input, expected) {
	const got = normAnswer(input);
	if (!got) return false;
	return answerOptions(expected).some((option) => normAnswer(option) === got);
}
function gradeKeywords(input, accept) {
	const got = normAnswer(input);
	if (!got) return false;
	const groups = accept.split(/\s*&\s*/).map((group) => group.trim()).filter(Boolean);
	if (!groups.length) return false;
	return groups.every((group) => answerOptions(group).some((option) => hasTerm(got, option)));
}
function hasTerm(haystack, needle) {
	const term = normAnswer(needle);
	if (!term) return false;
	if (term.length >= 6 || term.includes(" ")) return haystack.includes(term);
	return new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(term)}(?![\\p{L}\\p{N}])`, "u").test(haystack);
}
function clozeTarget(word, sentence) {
	const options = answerOptions(word);
	const lower = sentence.toLowerCase();
	return options.find((option) => lower.includes(option.toLowerCase())) ?? options[0] ?? word;
}
function collectItems(units, unitIds, kinds) {
	const allowed = new Set(unitIds);
	const items = [];
	for (const unit of units) {
		if (!allowed.has(unit.id)) continue;
		if (kinds.includes("cloze")) for (const item of unit.clozes ?? []) {
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
				answer: word
			});
		}
		if (kinds.includes("vocab")) for (const vocab of unit.vocab) {
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
				answer: word
			});
		}
		if (kinds.includes("short")) for (const question of unit.questions) {
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
				accept: question.accept
			});
		}
	}
	return items;
}
function shuffle(list) {
	const next = list.slice();
	for (let index = next.length - 1; index > 0; index -= 1) {
		const swap = Math.floor(Math.random() * (index + 1));
		const current = next[index];
		next[index] = next[swap];
		next[swap] = current;
	}
	return next;
}
function buildQuiz(items, limit, doShuffle) {
	const ordered = doShuffle ? shuffle(items) : items.slice();
	return limit === "all" ? ordered : ordered.slice(0, limit);
}
function clip(value) {
	const clean = value.replace(/\s+/g, " ").trim();
	return clean.length > 72 ? `${clean.slice(0, 72)}…` : clean;
}
function isVocabHeader(line) {
	return /^(?:#{1,6}\s*)?(?:từ vựng|vocabulary|vocab|words|điền từ)\b[:\s-]*$/i.test(line);
}
function isShortHeader(line) {
	return /^(?:#{1,6}\s*)?(?:trả lời ngắn|câu hỏi ngắn|câu hỏi|hỏi đáp|short answers?|q\s*&\s*a|qa)\b[:\s-]*$/i.test(line);
}
function unitLabelFrom(line) {
	const match = line.match(/^(?:#{1,6}\s*)((?:unit|bài)\s+\d+\b.*)$/i);
	if (!match?.[1]) return null;
	return match[1].replace(/\s+/g, " ").trim();
}
function stripBullet(line) {
	return line.replace(/^(?:[-*•]|\d+[.)])\s+/, "");
}
function splitOnce(line, pattern) {
	const match = pattern.exec(line);
	if (!match || match.index <= 0) return null;
	const left = line.slice(0, match.index).trim();
	const right = line.slice(match.index + match[0].length).trim();
	if (!left || !right) return null;
	return [left, right];
}
function splitVocab(line) {
	const separators = [
		{ pattern: /\s+\|\s+/ },
		{ pattern: /\s+::\s+/ },
		{ pattern: /\s+[—–]\s+/ },
		{ pattern: /\t+/ },
		{
			pattern: /\s+-\s+/,
			loose: true
		},
		{
			pattern: /\s*:\s+/,
			loose: true
		}
	];
	let best = null;
	for (const separator of separators) {
		const match = separator.pattern.exec(line);
		if (!match || match.index <= 0) continue;
		if (!best || match.index < best.index) best = {
			index: match.index,
			length: match[0].length,
			loose: Boolean(separator.loose)
		};
	}
	if (!best) return null;
	const word = line.slice(0, best.index).trim();
	const sentence = line.slice(best.index + best.length).trim();
	if (!word || !sentence) return null;
	if (best.loose && (word.split(/\s+/).length > 6 || word.length > 42 || word.includes("?"))) return null;
	return {
		word,
		sentence
	};
}
function parseWorkbook(raw) {
	if (!raw.trim()) return {
		units: [],
		warnings: []
	};
	const warnings = [];
	const units = [];
	let current = null;
	let section = null;
	let pending = null;
	let warnedImplicit = false;
	const ensure = () => {
		if (current) return current;
		current = {
			id: uid(),
			label: "Unit 1",
			vocab: [],
			questions: []
		};
		units.push(current);
		if (!warnedImplicit) {
			warnings.push("Không thấy tiêu đề unit ở đầu — đã tạo Unit 1.");
			warnedImplicit = true;
		}
		return current;
	};
	const dropPending = (lineNo) => {
		if (!pending) return;
		warnings.push(`Dòng ${lineNo}: câu hỏi chưa có đáp án — "${clip(pending)}".`);
		pending = null;
	};
	raw.replace(/\r\n/g, "\n").split("\n").forEach((original, index) => {
		const lineNo = index + 1;
		const line = original.trim();
		if (!line || /^[-—–=]{3,}$/.test(line)) return;
		const structural = Boolean(unitLabelFrom(line)) || isVocabHeader(line) || isShortHeader(line) || /^(?:q|hỏi|câu hỏi|câu)\s*[:.)]/i.test(line);
		if (pending && !structural) {
			const unit = ensure();
			const answer = line.match(/^(?:a|đáp án|đáp|trả lời)\s*[:.)]\s*(.+)$/i);
			unit.questions.push({
				id: uid(),
				prompt: pending,
				answer: (answer?.[1] ?? line).trim()
			});
			pending = null;
			section = "short";
			return;
		}
		const label = unitLabelFrom(line);
		if (label) {
			dropPending(lineNo);
			current = {
				id: uid(),
				label,
				vocab: [],
				questions: []
			};
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
				unit.vocab.push({
					id: uid(),
					...vocab
				});
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
				unit.questions.push({
					id: uid(),
					prompt,
					answer
				});
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
	for (const unit of units) if (!unit.vocab.length && !unit.questions.length) warnings.push(`${unit.label}: chưa có từ hoặc câu hỏi.`);
	return {
		units,
		warnings
	};
}
function importBank(text) {
	let data;
	try {
		data = JSON.parse(text);
	} catch {
		return {
			ok: false,
			error: "File không phải JSON."
		};
	}
	const rawUnits = Array.isArray(data) ? data : data && typeof data === "object" && "units" in data ? data.units : null;
	if (!Array.isArray(rawUnits)) return {
		ok: false,
		error: "JSON cần có mảng units."
	};
	const units = [];
	for (const row of rawUnits) {
		if (!row || typeof row !== "object") continue;
		const record = row;
		if (typeof record.label !== "string" || !record.label.trim()) continue;
		const vocabIn = Array.isArray(record.vocab) ? record.vocab : [];
		const questionsIn = Array.isArray(record.questions) ? record.questions : [];
		units.push({
			id: uid(),
			label: record.label.trim(),
			vocab: vocabIn.flatMap((item) => {
				if (!item || typeof item !== "object") return [];
				const vocab = item;
				if (typeof vocab.word !== "string" || typeof vocab.sentence !== "string") return [];
				return [{
					id: uid(),
					word: vocab.word,
					sentence: vocab.sentence
				}];
			}),
			questions: questionsIn.flatMap((item) => {
				if (!item || typeof item !== "object") return [];
				const question = item;
				if (typeof question.prompt !== "string" || typeof question.answer !== "string") return [];
				return [{
					id: uid(),
					prompt: question.prompt,
					answer: question.answer
				}];
			})
		});
	}
	if (!units.length) return {
		ok: false,
		error: "Không thấy unit nào trong file."
	};
	return {
		ok: true,
		units
	};
}
function exportBank(units) {
	return JSON.stringify({ units }, null, 2);
}
function c(id, word, sentence) {
	return {
		id,
		word,
		sentence
	};
}
function s(id, prompt, answer, accept) {
	return {
		id,
		prompt,
		answer,
		accept
	};
}
var PRACTICE = {
	u01: {
		clozes: [
			c("u01c1", "set objectives", "After an organization has set objectives, it has to make sure that it achieves them."),
			c("u01c2", "allocate", "Managers have to find the best way to allocate all the human, physical and capital resources available to them."),
			c("u01c3", "resources", "Managers have to find the best way to allocate all the human, physical and capital resources available to them."),
			c("u01c4", "perform tasks", "Some people perform tasks better on their own while others work better in teams."),
			c("u01c5", "supervise", "Managers supervise the work of their subordinates and try to develop their abilities."),
			c("u01c6", "subordinates", "Managers supervise the work of their subordinates and try to develop their abilities."),
			c("u01c7", "measure", "Managers measure the performance of their staff to see whether they are reaching their targets."),
			c("u01c8", "performance", "Managers measure the performance of their staff to see whether they are reaching their targets."),
			c("u01c9", "deal with", "Top managers have to be prepared to deal with crises if they occur and then have to make decisions."),
			c("u01c10", "understand", "Actually, management as we understand it today is a fairly recent idea."),
			c("u01c11", "commercialize", "They perceive opportunities to commercialize new technologies and products that will serve the market better."),
			c("u01c12", "risk", "They are happy to risk their own or other people's capital."),
			c("u01c13", "work out", "Managers have to set objectives for their organization, and then work out how to achieve them."),
			c("u01c14", "communicate", "They need to communicate the organization's objectives to the people responsible for attaining them."),
			c("u01c15", "contribute", "They have to motivate their staff to work well, to be productive, and to contribute something to the organization.")
		],
		questions: [
			s("u01q1", "What are the main differences between a manager and a leader? (Max. 30 words)", "Managers have formal power from their position and uphold the status quo. Leaders rely on personal qualities, their influence is temporary, and they challenge the status quo.", "position & status quo & personal & challenge"),
			s("u01q2", "What are the five functions of management?", "The five functions are planning, organizing, coordinating, commanding and controlling.", "planning & organizing & coordinating & commanding & controlling"),
			s("u01q3", "What does planning involve, and what must managers also plan for?", "Planning involves setting aims or targets. Managers must also plan for physical, human and financial resources.", "aims | targets & resources"),
			s("u01q4", "What is the difference between an entrepreneur and a manager?", "Entrepreneurs are alert to undiscovered profit opportunities and start a business. A manager is needed to run it in the long term.", "profit & manager"),
			s("u01q5", "What is used to show authority and ensure specialization?", "An organizational chart is used to show authority and ensure specialization.", "organizational chart"),
			s("u01q6", "What does coordinating mean?", "Coordinating means bringing together different individuals and departments, such as Marketing and Production.", "bringing together")
		]
	},
	u02: {
		clozes: [
			c("u02c1", "pursue", "If these needs are not satisfied, people will not pursue other needs."),
			c("u02c2", "actualize", "The desire to develop as a person, to actualize one's potential, and to achieve the goals one has set for oneself."),
			c("u02c3", "achieve", "The desire to develop as a person, to actualize one's potential, and to achieve the goals one has set for oneself."),
			c("u02c4", "set", "Employees will only be motivated if they are able to realize the goals one has set for oneself."),
			c("u02c5", "earn", "The more money one has, the less motivating it is to earn more."),
			c("u02c6", "enrichment", "They tried job enrichment to make the work better and more enjoyable."),
			c("u02c7", "outcome", "Task identity is the degree to which a job has a visible outcome."),
			c("u02c8", "autonomy", "Workers want more autonomy when they schedule work and choose their own procedures."),
			c("u02c9", "significance", "The job matters because it has real significance for the work of other people."),
			c("u02c10", "enlargement", "The manager used job enlargement and combined several tasks into one assignment."),
			c("u02c11", "rotation", "The factory uses job rotation and moves employees from one job to another.")
		],
		questions: [
			s("u02q1", "Summarise Frederick Herzberg's Two-Factor Theory in a maximum of 40 words.", "Herzberg says people have hygiene factors and motivators. Hygiene factors such as pay prevent dissatisfaction but do not motivate. Motivators such as responsibility allow psychological growth.", "hygiene & motivat"),
			s("u02q2", "Please tell me the fundamental difference between Theory X and Theory Y in a maximum of 20 words.", "Theory X says people dislike work and need external control. Theory Y says people are motivated by internal factors.", "external & internal"),
			s("u02q3", "What are the three ways to motivate workers to be more committed to their jobs?", "The three ways are job rotation, job enlargement and job enrichment.", "job rotation & job enlargement & job enrichment"),
			s("u02q4", "What is job satisfaction?", "Job satisfaction is the enjoyment a worker gets from feeling that they have done a good job.", "enjoyment | good job"),
			s("u02q5", "Name Maslow's five categories of needs.", "They are physiological needs, safety needs, love and belonging needs, esteem needs, and self-actualization needs.", "physiological & safety & esteem & self-actualization"),
			s("u02q6", "What are hygiene factors?", "Hygiene factors are the factors that must be present in the workplace to prevent job dissatisfaction.", "dissatisfaction")
		]
	},
	u03: {
		clozes: [
			c("u03c1", "into more concrete objectives", "Operational planning translates general goals into more concrete objectives."),
			c("u03c2", "into functional departments", "It is usual to divide an organization into functional departments."),
			c("u03c3", "geographical regions", "Some companies are organized according to geographical regions."),
			c("u03c4", "major strategy issues", "The Board gets involved in major strategy issues."),
			c("u03c5", "a direction for the company", "Senior managers set a direction for the company."),
			c("u03c6", "first-line manager", "Subordinates work under the supervision of a first-line manager."),
			c("u03c7", "chain of command", "A clear line or chain of command runs down the hierarchy, so that all employees know who their superior is."),
			c("u03c8", "matrix management", "One solution to this problem is matrix management, in which people report to more than one superior."),
			c("u03c9", "staff position", "This is an example of a staff position: its holder has no line authority, and is not integrated into the chain of command."),
			c("u03c10", "delegated", "People at lower levels are unable to make important decisions, unless responsibilities have been explicitly delegated.")
		],
		questions: [
			s("u03q1", "What does Wikinomics mean? (Max. 20 words)", "Wikinomics is mass collaboration with outsiders, who are paid for ideas that improve an operation.", "collaboration | cooperate & outside | outsiders & ideas"),
			s("u03q2", "What are the pros and cons of matrix management?", "People can report to more than one superior and deal directly across departments. The disadvantage is that the matrix can become quite complex.", "more than one & complex"),
			s("u03q3", "What is span of control?", "Span of control is the number of subordinates working directly under a manager.", "subordinates"),
			s("u03q4", "What is delegation?", "Delegation means giving a subordinate the authority to perform a particular task.", "authority"),
			s("u03q5", "What is decentralization?", "Decentralization means taking decisions away from the centre of an organization, away from the Head Office.", "head office | centre"),
			s("u03q6", "What is outsourcing?", "Outsourcing means transferring internal functions or jobs to outside suppliers instead of doing them in-house.", "outside | suppliers")
		]
	},
	u04: {
		clozes: [
			c("u04c1", "dimensions", "Power distance is one of the important cultural dimensions that Hofstede identified."),
			c("u04c2", "low-power distance", "Sweden is a low-power distance culture."),
			c("u04c3", "accessible", "Managers are accessible and approachable and employees are involved in decision-making."),
			c("u04c4", "high-power distance", "France is a high-power distance culture. Managers are usually more distant and remote."),
			c("u04c5", "distant", "Employees may feel quite distant from their managers and show a lot of deference to them."),
			c("u04c6", "hierarchical", "This Swedish company is not very hierarchical, with only three management layers."),
			c("u04c7", "forms of address", "Some languages have many forms of address that you use to indicate how familiar you are with someone."),
			c("u04c8", "corporate", "In this company the corporate culture used to be very formal: managers could only wear white shirts."),
			c("u04c9", "long-hours", "They say that if you go home at 5.30 you are not doing the job properly. That is a long-hours culture."),
			c("u04c10", "sales", "When selling is seen as the most important thing in an organization, it has a sales culture.")
		],
		questions: [
			s("u04q1", "How does the Lewis Model, developed by Richard D. Lewis in the 1990s, divide human behavior and communication? (Max. 30 words)", "The Lewis Model divides people by behaviour, not nationality, into three categories: Linear-active, Multi-active and Reactive.", "linear-active & multi-active & reactive"),
			s("u04q2", "What is power distance? (Max. 15 words)", "Power distance measures how people cope with inequality and relate to more powerful individuals.", "inequality"),
			s("u04q3", "What is a high-context culture? (Max. 15 words)", "Rules are shown through context, such as body language and tone, and are usually not written.", "context & not written | body language"),
			s("u04q4", "What is a low-context culture?", "In a low-context culture, most communication is verbal and the rules are written or stated directly.", "verbal | written"),
			s("u04q5", "What is glocalization?", "Glocalization is a product or service developed globally but adjusted for the user in a local market.", "global & local"),
			s("u04q6", "What is culture?", "Culture is the complex system of values, traits, morals and customs shared by a society.", "values | customs")
		]
	},
	u05: {
		clozes: [
			c("u05c1", "vacancy", "When a company has a vacancy for a new member of staff, it usually advertises the post."),
			c("u05c2", "internally", "It advertises the post internally, for example in the company magazine, or externally in a newspaper."),
			c("u05c3", "externally", "It advertises the post internally, for example in the company magazine, or externally in a newspaper."),
			c("u05c4", "job description", "A job advertisement has to give an accurate job description of the job and what it requires from the applicants."),
			c("u05c5", "qualifications", "These requirements might include qualifications, work experience, and certain personal qualities."),
			c("u05c6", "experience", "These requirements might include qualifications, work experience, and certain personal qualities."),
			c("u05c7", "CV", "The advertisement will usually ask people to send their CV with a covering letter."),
			c("u05c8", "covering letter", "People interested in the post send their CV with a covering letter, or a letter of introduction."),
			c("u05c9", "short-list", "The managers prepare a short-list of possible candidates who will be invited for an interview."),
			c("u05c10", "psychometric", "Applicants may also take psychometric tests, which look at psychological traits."),
			c("u05c11", "job description", "Sometimes the company examines the job description for the post, and decides that it no longer needs to be filled."),
			c("u05c12", "promoted", "The company will replace the person who resigns with an internal candidate who can be promoted to the job."),
			c("u05c13", "agency", "Or it will advertise the position in newspapers, or engage an employment agency to do so."),
			c("u05c14", "headhunters", "For senior positions, companies sometimes use the services of a firm of headhunters."),
			c("u05c15", "apply", "To reply to an advertisement is to apply for a job; you become an applicant or a candidate."),
			c("u05c16", "applicant", "To reply to an advertisement is to apply for a job; you become an applicant or a candidate.")
		],
		questions: [
			s("u05q1", "What are the typical requirements in a job description?", "A job description states responsibilities and duties. Typical requirements also include educational qualifications, experience, special skills or aptitude, and personal characteristics.", "duties | responsibilities & qualifications & experience & skills | aptitude"),
			s("u05q2", "What is the difference between a job description and a job specification?", "A job description outlines duties. A job specification outlines the requirements, qualifications and expertise for the job.", "duties & qualifications"),
			s("u05q3", "What is internal recruitment?", "Internal recruitment is when a vacancy is filled by someone who is already an existing employee.", "existing employee"),
			s("u05q4", "What is external recruitment?", "External recruitment is when a vacancy is filled by someone who is not an existing employee.", "not an existing | new to the business | not already"),
			s("u05q5", "What is induction training?", "Induction training explains the business's activities, customs and procedures and introduces new employees to their fellow workers.", "new employee | fellow"),
			s("u05q6", "What is the difference between on-the-job and off-the-job training?", "On-the-job training is watching a more experienced worker. Off-the-job training is away from the workplace, usually by specialist trainers.", "experienced & away")
		]
	},
	u06: {
		clozes: [
			c("u06c1", "sole trader", "The simplest form of business is the individual proprietorship or sole trader, for example a shop owned by a single person."),
			c("u06c2", "partnership", "If several individuals wish to go into business together they can form a partnership."),
			c("u06c3", "losses", "Partners generally contribute equal capital, have equal authority, and share profits or losses."),
			c("u06c4", "liability", "In many countries, lawyers and doctors can only form partnerships with unlimited liability for debts."),
			c("u06c5", "bankruptcy", "In the case of bankruptcy, a partner with a personal fortune can lose it all."),
			c("u06c6", "corporations", "The majority of businesses are limited companies, which in the US are called corporations."),
			c("u06c7", "creditors", "If the assets do not cover the debts, creditors do not get their money back."),
			c("u06c8", "shares", "Private limited companies cannot offer shares to the public."),
			c("u06c9", "prospectus", "A public limited company can publish a prospectus and offer its shares for sale on the stock market."),
			c("u06c10", "registered", "The American equivalent of a public limited company is one registered by the Securities and Exchange Commission.")
		],
		questions: [
			s("u06q1", "Name five sectors of the economy.", "Primary, secondary, tertiary, quaternary and quinary.", "primary & secondary & tertiary & quaternary & quinary"),
			s("u06q2", "Give a definition of each.", "Primary extracts natural resources. Secondary manufactures goods. Tertiary provides services. Quaternary covers information services such as computing and R&D. Quinary covers top-level decision making.", "natural resources | raw materials & manufactur & services & information & decision"),
			s("u06q3", "What are the types of business organizations?", "Sole traders, partnerships, private limited companies, public limited companies, franchises and joint ventures.", "sole trader & partnership & private limited & public limited & franchise & joint venture"),
			s("u06q4", "What is the difference between limited and unlimited liability?", "Limited liability stops at the amount invested. With unlimited liability, owners can be held responsible for the debts of the business.", "invested & debts"),
			s("u06q5", "What is a mixed economy?", "A mixed economy has both a private sector and a public sector.", "private & public"),
			s("u06q6", "What is privatisation?", "Privatisation is the sale of state-owned assets, such as public corporations, to the private sector.", "private sector | sale")
		]
	},
	u07: {
		clozes: [
			c("u07c1", "lead time", "Unless our supplier reduces its lead time, we will have to radically change the way we operate."),
			c("u07c2", "purchasing power", "The recession has led to a drop in overall purchasing power, which means that we will have to reduce output."),
			c("u07c3", "optimum capacity", "We are currently operating at optimum capacity, which means that we can afford to keep prices lower."),
			c("u07c4", "assembly line", "She works on an assembly line in a factory that makes electronic goods."),
			c("u07c5", "finished goods", "You can view our range of finished goods in the showroom."),
			c("u07c6", "product recall", "The company had to put out a product recall to its customers when several dangerous faults were discovered."),
			c("u07c7", "offshore manufacturing", "We will be unable to compete unless we reduce our costs by taking advantage of offshore manufacturing."),
			c("u07c8", "planned obsolescence", "Our company builds planned obsolescence into most of its electronic products."),
			c("u07c9", "supply chain", "We are an important part of the supply chain for the industry."),
			c("u07c10", "zero defects", "None of our products are allowed to leave the factory unless there are zero defects present."),
			c("u07c11", "raw materials", "The manufacture of most items relies on a reliable source of raw materials such as wood, iron ore or crude petroleum."),
			c("u07c12", "random sampling", "We usually find that random sampling gives us a good idea of quality.")
		],
		questions: [
			s("u07q1", "What is lean production?", "Lean production uses techniques to cut waste of resources, including time, and to remove activities that do not add value for the customer.", "waste"),
			s("u07q2", "What are the types of waste that occur in production?", "The seven wastes are overproduction, waiting, transportation, unnecessary inventory, motion, over-processing and defects.", "overproduction & waiting & transportation & inventory & motion & over-processing | overprocessing & defects"),
			s("u07q3", "How do you apply the concept of Kaizen to your daily life?", "Kaizen is continuous improvement from workers' own ideas, not new equipment. In daily life it means small regular changes that remove wasted time or movement.", "continuous improvement & waste"),
			s("u07q4", "What is JIT? (Max. 20 words)", "JIT reduces or eliminates inventories. Materials and finished goods are made or delivered just in time to be used.", "inventor"),
			s("u07q5", "What is the difference between job production and flow production?", "Job production makes items one at a time. Flow production makes large quantities of identical goods in a continuously moving process.", "one at a time & identical"),
			s("u07q6", "What does Kaizen mean?", "Kaizen means continuous improvement. The ideas come from the workers themselves, and the focus is on eliminating waste.", "continuous improvement & workers")
		]
	},
	u08: {
		clozes: [
			c("u08c1", "chain", "Logistics management is that part of supply chain management that plans, implements and controls the flow of goods."),
			c("u08c2", "origin", "It controls the flow of goods, services and information between the point of origin and the point of consumption."),
			c("u08c3", "outbound", "Logistics management activities usually include inbound and outbound transportation management."),
			c("u08c4", "service", "The logistics function also includes sourcing and procurement, packaging, and customer service."),
			c("u08c5", "operational", "It is involved in all levels of planning and execution: strategic, operational and tactical."),
			c("u08c6", "activities", "Logistics management coordinates all logistics activities, as well as integrating them with marketing, sales and finance."),
			c("u08c7", "technology", "It also integrates logistics activities with information technology."),
			c("u08c8", "ensuring", "Customer service means ensuring the right product is at the right place at the right time."),
			c("u08c9", "forecasting", "The planners use demand forecasting to decide how many goods to order in the future."),
			c("u08c10", "handling", "Inventory management and materials handling keep the supply chain flowing, with no bottlenecks."),
			c("u08c11", "balancing", "This is done by balancing the quantity of items at different locations and different stages in the process."),
			c("u08c12", "negotiating", "Purchasing means negotiating with suppliers about price, availability and quality."),
			c("u08c13", "warehousing", "The company spent more on warehousing so goods could be stored and then distributed.")
		],
		questions: [
			s("u08q1", "What are the pros and cons of push and pull strategies in logistics? (Max. 40 words)", "Push uses forecasts, so goods are ready, but inventory and waste can rise. Pull follows actual demand, so inventory falls, but production waits for orders.", "forecast & demand & inventory"),
			s("u08q2", "How do you apply the concept of push and pull strategies in logistics to your real life? (Max. 40 words)", "Push is buying from a forecast, such as food for the week before you need it. Pull is buying only when something has run out, which keeps less stock at home.", "push & pull"),
			s("u08q3", "What is reverse logistics?", "Reverse logistics brings goods back to the manufacturer because of defects or for recycling.", "defects | recycling"),
			s("u08q4", "What is the difference between inbound and outbound logistics?", "Inbound logistics brings raw materials from suppliers to producers. Outbound logistics moves finished products to buyers and consumers.", "suppliers & finished"),
			s("u08q5", "What is a push strategy?", "A push strategy produces and distributes goods based on forecasted demand, even if customers have not ordered them yet.", "forecast"),
			s("u08q6", "What is a pull strategy?", "A pull strategy lets actual customer demand drive production, which minimizes inventory and reduces waste.", "demand & inventory | waste")
		]
	},
	u09: {
		clozes: [
			c("u09c1", "costly", "A lack of quality can be more costly than achieving high quality. As Philip Crosby puts it, quality is free."),
			c("u09c2", "expenses", "There are many expenses that result from production that is not 100 percent perfect, such as inspecting, testing and reworking."),
			c("u09c3", "guarantee", "Those costs include replacing products in accordance with a guarantee and dealing with complaints."),
			c("u09c4", "defects", "Management should design a system which excludes defects, so that every worker gets it right the first time."),
			c("u09c5", "resented", "Quality at the source removes the over-the-shoulder inspection that is usually resented by workers."),
			c("u09c6", "permanent", "Many large Japanese companies, especially those guaranteeing permanent employment, have been able to attain high quality."),
			c("u09c7", "relationships", "High quality also depends on the long-term nature of the relationships among employees, suppliers and customers."),
			c("u09c8", "variations", "If there are problems with quality variations, the group will try to identify their sources."),
			c("u09c9", "individualistic", "Quality circles have been less successful in the more individualistic cultures of America and Europe."),
			c("u09c10", "benchmarking", "Even if the current quality level appears perfect, the company should still look for improvement and engage in benchmarking.")
		],
		questions: [
			s("u09q1", "What is quality?", "Quality means producing a good or a service which meets customer expectations.", "customer expectations | expectations"),
			s("u09q2", "What is the difference between quality control and quality assurance?", "Quality control checks quality at the end of the process. Quality assurance checks standards throughout the process.", "end & throughout"),
			s("u09q3", "What is Total Quality Management?", "Total Quality Management is the continuous improvement of products and processes by focusing on quality at each stage of production.", "continuous improvement & each stage"),
			s("u09q4", "When does quality control take place?", "Quality control takes place at the end of the production process.", "end"),
			s("u09q5", "When does quality assurance take place?", "Quality assurance takes place throughout the production process.", "throughout"),
			s("u09q6", "Whose expectations must a quality product meet?", "A quality product must meet customer expectations.", "customer")
		]
	},
	u10: {
		clozes: [
			c("u10c1", "making a loss", "In the Introduction stage the product has low sales and will still be making a loss."),
			c("u10c2", "early adopters", "If the product has few competitors, a skimming price strategy can be used: a high price for early adopters, which is then gradually lowered."),
			c("u10c3", "similar offerings", "In the Growth phase, competitors are attracted to the market with similar offerings."),
			c("u10c4", "advertising budgets", "In the growth phase the company increases its advertising budgets to build the brand."),
			c("u10c5", "differentiate", "In the Maturity phase, producers attempt to differentiate products and brands are key to this."),
			c("u10c6", "reaches saturation", "Price wars and competition occur as the market reaches saturation."),
			c("u10c7", "consumer tastes", "In the Decline phase the product is starting to look old-fashioned or consumer tastes have changed."),
			c("u10c8", "withdrawn from the market", "There is intense price-cutting and many products are withdrawn from the market."),
			c("u10c9", "consumer needs", "Market research is the process by which a company collects information about consumer needs and preferences."),
			c("u10c10", "gaps in the market", "The information helps to identify market trends and spot gaps in the market.")
		],
		questions: [
			s("u10q1", "What is a market leader?", "The market leader is the company with the largest market share.", "market share"),
			s("u10q2", "What is market segmentation?", "Market segmentation is dividing a market into distinct groups of buyers who have different requirements or buying habits.", "dividing | groups"),
			s("u10q3", "What is market share?", "Market share is a company's sales expressed as a percentage of total sales in the market.", "percentage"),
			s("u10q4", "What is the marketing mix?", "The marketing mix is the set of all the elements in a marketing programme, and the way a company integrates them.", "elements | programme"),
			s("u10q5", "What is a marketing strategy?", "A marketing strategy is a plan or principle designed to achieve marketing objectives.", "objectives"),
			s("u10q6", "What is the product life cycle?", "The product life cycle is the standard pattern of sales of a product over the period that it is marketed.", "sales")
		]
	},
	u11: {
		clozes: [
			c("u11c1", "endorses", "If a celebrity endorses a product, they say how good it is in advertisements."),
			c("u11c2", "hoardings", "Billboards, those large signs used for advertising, are often called hoardings in British English."),
			c("u11c3", "samples", "Manufacturers of toiletries and cosmetics frequently offer free samples for customers to try out their new products."),
			c("u11c4", "point-of-sale", "Advertising done at the place where a product is sold is called point-of-sale advertising."),
			c("u11c5", "sponsorship", "The company chose sponsorship of a sports event as a way to advertise."),
			c("u11c6", "word-of-mouth", "If you hear about a new product from a friend or relative, this is called word-of-mouth advertising."),
			c("u11c7", "commercials", "Outdoor advertising is growing rapidly because the cost of TV commercials has risen dramatically."),
			c("u11c8", "advertising agency", "Large companies tend to hire the services of an advertising agency."),
			c("u11c9", "budget", "The client company generally decides on its advertising budget, the amount of money it plans to spend."),
			c("u11c10", "brief", "It also provides a brief, or a statement of the objectives of the advertising."),
			c("u11c11", "media plan", "The choice of how and where to advertise, and in what proportions, is called a media plan."),
			c("u11c12", "target", "The set of customers whose needs a company plans to satisfy are known as the target market."),
			c("u11c13", "campaign", "The advertising of a particular product during a particular period of time is called an advertising campaign."),
			c("u11c14", "publicity", "Favourable mentions that are not paid for are called publicity.")
		],
		questions: [
			s("u11q1", "What is an advertorial?", "An advertorial is a paid-for advertisement which includes editorial content, and it is marked so readers can tell it from real editorial.", "paid & editorial"),
			s("u11q2", "What is product placement?", "Product placement is paying for a branded product to be used by a character in a movie.", "movie | branded"),
			s("u11q3", "What is a USP?", "A USP, or unique selling proposition, is a highlighted benefit that makes a product stand out from rival brands.", "benefit | stand out"),
			s("u11q4", "What are demographics?", "Demographics describe an audience by facts such as age, gender, ethnicity or location.", "age | gender"),
			s("u11q5", "What are focus groups?", "Focus groups are small groups that represent a target audience and are paid to answer questions.", "target audience | paid"),
			s("u11q6", "What is an advertising campaign?", "An advertising campaign is a time-limited set of ads, across one or more media, that execute a central idea.", "central idea | ads")
		]
	},
	u12: {
		clozes: [
			c("u12c1", "legal tender", "Spain now uses the euro. Pesetas are no longer legal tender."),
			c("u12c2", "refund", "I bought a TV which doesn't work. I'll take it back to the shop to get a refund."),
			c("u12c3", "receipt", "In a shop, to get a refund, you usually have to show the receipt."),
			c("u12c4", "instalments", "I'm paying for my new car in 36 monthly instalments."),
			c("u12c5", "expenses", "I earn a lot of money, but I have a lot of expenses."),
			c("u12c6", "auction", "Famous paintings are usually sold by auction."),
			c("u12c7", "bid", "In an auction, the item is sold to the person who makes the highest bid."),
			c("u12c8", "foreign currency", "In Japan, the US dollar is a foreign currency."),
			c("u12c9", "deposits", "Commercial banks receive and hold deposits, and pay money according to customers' instructions."),
			c("u12c10", "wages", "Traditionally, factory workers were paid wages in cash on Fridays."),
			c("u12c11", "salary", "Non-manual workers usually receive a monthly salary in the form of a cheque or a transfer."),
			c("u12c12", "current account", "She keeps her salary in a current account, which pays little interest but lets her withdraw cash."),
			c("u12c13", "overdraft", "The bank agreed an overdraft so she can spend more than the balance, up to a fixed limit."),
			c("u12c14", "standing orders", "He pays the rent by standing orders, the same sum every month."),
			c("u12c15", "spread", "Banks make a profit from the spread between the interest rates they pay on deposits and those they charge on loans.")
		],
		questions: [
			s("u12q1", "What is collateral?", "Collateral is anything that acts as a security or guarantee for a loan.", "security | guarantee"),
			s("u12q2", "What is a mortgage?", "A mortgage is a loan used to buy property. Payments are divided into principal and interest, and the property is the collateral.", "loan & collateral | property"),
			s("u12q3", "What is an overdraft?", "An overdraft occurs when you pay or write a check for more than the available balance of your account.", "balance"),
			s("u12q4", "What is liquidity?", "Liquidity is available cash, and how easily other assets can be turned into cash.", "cash"),
			s("u12q5", "What is the difference between a current account and a savings account?", "A current account is a checking account. A savings account generally earns higher interest and limits some withdrawals.", "checking | checks & interest"),
			s("u12q6", "What is a clearing system?", "A clearing system adds up debts between banks in a period and pays only the net amounts needed to balance inter-bank accounts.", "net")
		]
	},
	u13: {
		clozes: [
			c("u13c1", "bookkeeping", "She spent the morning on bookkeeping, writing down every debit and every credit."),
			c("u13c2", "auditing", "The firm is auditing the accounts to make sure the records are true and honest."),
			c("u13c3", "creative accounting", "They used creative accounting to disguise the true financial position of the company."),
			c("u13c4", "budget", "The manager prepared a budget showing the income and expenditure expected next year."),
			c("u13c5", "assets", "The balance sheet lists assets such as cash, buildings and machines on one side."),
			c("u13c6", "liabilities", "It also lists liabilities, the money the company will have to pay in the future."),
			c("u13c7", "debit", "The payment they made was entered as a debit in the account."),
			c("u13c8", "credit", "The payment they received was entered as a credit in the account."),
			c("u13c9", "intangible", "A brand name is an intangible asset because you cannot touch it."),
			c("u13c10", "forensic", "The court asked for forensic accounting because illegal activity was suspected.")
		],
		questions: [
			s("u13q1", "What is the difference between bookkeeping and accounting?", "Bookkeeping writes down debits and credits. Accounting prepares financial statements showing income, expenditure, assets and liabilities.", "debits | credits & statements | assets"),
			s("u13q2", "What is creative accounting?", "Creative accounting uses accounting procedures and tricks to disguise the true financial position of a company.", "disguise"),
			s("u13q3", "What does an income statement show?", "An income statement shows the difference between the revenues and the expenses of a period.", "revenues & expenses"),
			s("u13q4", "What does a balance sheet show?", "A balance sheet shows assets, liabilities, and capital or shareholders' equity.", "assets & liabilities"),
			s("u13q5", "What is auditing?", "Auditing means inspecting and reporting on accounts and financial records.", "accounts | records"),
			s("u13q6", "What is management accounting for?", "Management accounting provides information so a business can make decisions, plan future operations and develop strategies.", "decisions")
		]
	},
	u14: {
		clozes: [
			c("u14c1", "policy-makers", "What can central bankers and government policy-makers do? Can they prevent a contraction from turning into a recession?"),
			c("u14c2", "new borrowing", "For companies and individuals without existing loans, new borrowing becomes less expensive when interest rates are cut."),
			c("u14c3", "side-effects", "Lowering rates takes two or three quarters to benefit an economy, and it does also have unfortunate side-effects."),
			c("u14c4", "tax cuts", "The government used tax cuts so that people would have more money to spend."),
			c("u14c5", "government debt", "The problem arises when these measures lead to high levels of government debt. Eventually that debt will have to be repaid."),
			c("u14c6", "labour market", "Reforms include measures to enhance competition, to liberalize the labour market, and to make it easier to start a new business.")
		],
		questions: [
			s("u14q1", "What is the difference between a recession and a depression?", "A recession is the phase when output is falling. A depression is a deep and prolonged recession.", "falling & prolonged | deep"),
			s("u14q2", "What is a peak in the business cycle?", "A peak is the turning point between an expansion and a contraction, when output stops increasing and begins to decrease.", "expansion & contraction | decrease"),
			s("u14q3", "What is a trough?", "A trough is the turning point between a recession and an expansion, when output that had been falling begins to rise.", "recession & expansion"),
			s("u14q4", "What is GDP?", "GDP is the total market value of all the goods and services produced in a country during a given period.", "market value | goods and services"),
			s("u14q5", "What is the difference between demand and supply?", "Demand is the willingness and ability of consumers to purchase goods. Supply is the willingness and ability of businesses to offer goods for sale.", "consumers & businesses"),
			s("u14q6", "What is a boom?", "A boom is a long period of expansion.", "expansion")
		]
	},
	u15: {
		clozes: [
			c("u15c1", "above board", "His lawyers have argued that the transactions were completely above board and approved by the other directors."),
			c("u15c2", "integrity", "The code of professional conduct requires directors to act with integrity and probity."),
			c("u15c3", "probity", "The code of professional conduct requires directors to act with integrity and probity."),
			c("u15c4", "misconduct", "It faces the most serious charges of misconduct yet brought against a big accountancy firm."),
			c("u15c5", "transparent", "We are totally transparent about the methods that we use, so it would be hard to hide the fact if the numbers were wrong."),
			c("u15c6", "accountable", "The city's officials ought to be held far more accountable than they are today for what they spend and how.")
		],
		questions: [
			s("u15q1", "What is an ethical dilemma?", "An ethical dilemma is a choice between two actions that might both be morally wrong.", "morally wrong | two actions"),
			s("u15q2", "What is an ethical lapse?", "An ethical lapse is a temporary failure to act in the correct way.", "temporary"),
			s("u15q3", "What is corporate social responsibility?", "CSR is a company's commitment to improving community well-being through discretionary contributions of corporate resources.", "community | well-being"),
			s("u15q4", "Name the five dimensions of CSR.", "The five dimensions are Environment, Social, Economic, Stakeholder and Volunteerism.", "environment & social & economic & stakeholder & volunteerism"),
			s("u15q5", "What are business ethics?", "Business ethics are standards of business behaviour that promote human welfare and the good.", "welfare | the good"),
			s("u15q6", "What is an ethical stance?", "An ethical stance is a stated opinion about the right thing to do in a particular situation.", "opinion | right thing")
		]
	},
	u16: {
		clozes: [
			c("u16c1", "contract work", "As an IT specialist, I mainly do contract work for local companies, two or three months at a time."),
			c("u16c2", "job sharing", "Employers say job sharing is expensive, because two people instead of one means extra costs."),
			c("u16c3", "delayering", "Big companies abolished a lot of middle management positions by delayering in the 1980s."),
			c("u16c4", "outsourced", "Last year the firm outsourced its accounting and IT services to Indian companies."),
			c("u16c5", "delocalize", "We would never delocalize our manufacturing."),
			c("u16c6", "casual work", "Students often take casual work that is not regular or fixed."),
			c("u16c7", "downsizing", "The plant had fewer permanent employees after downsizing."),
			c("u16c8", "rightsizing", "They called the job cuts rightsizing, another way of saying downsizing."),
			c("u16c9", "redundant", "When they restructured the company, 1,000 people were made redundant."),
			c("u16c10", "flexible", "Hiring temporary staff is easy in a flexible labour market.")
		],
		questions: [
			s("u16q1", "What is downsizing?", "Downsizing means decreasing the number of permanent employees.", "permanent employees | fewer employees"),
			s("u16q2", "What is a redundancy package?", "A redundancy package is all the payments and advantages given to workers who have lost their jobs because they are no longer needed.", "no longer needed | payments"),
			s("u16q3", "What is the difference between rationalization and delocalization?", "Rationalization makes a company more effective, often by employing fewer people. Delocalization moves the location of an enterprise.", "fewer | location"),
			s("u16q4", "What is efficiency?", "Efficiency means using resources such as time, materials or labour well, without wasting any.", "waste"),
			s("u16q5", "What is job insecurity?", "Job insecurity is the fear that you might lose your job.", "lose your job | fear"),
			s("u16q6", "What is employability?", "Employability is the extent to which a person has skills that employers want.", "skills")
		]
	},
	u17: {
		clozes: [
			c("u17c1", "customs", "Incoterms cover shipping costs and other costs such as insurance, customs duties, and ground handling."),
			c("u17c2", "handling", "Incoterms cover shipping costs and other costs such as insurance, customs duties, and ground handling."),
			c("u17c3", "premises", "A price quoted EXW means the seller makes the goods available at their own premises, and the buyer collects them there."),
			c("u17c4", "truck", "If the price is FAS, the seller also covers the cost of inland transport by truck or rail to the port of shipment."),
			c("u17c5", "loading", "The buyer pays for loading onto the ship plus all the costs from that point. With FOB, the seller pays for loading."),
			c("u17c6", "freight", "If the seller also pays the freight costs, further Incoterms such as CFR and CIF are used."),
			c("u17c7", "documentation", "With CFR the seller pays the freight costs and handles the export documentation, but does not pay the insurance."),
			c("u17c8", "transit", "With CFR the seller does not pay the insurance while the goods are in transit at sea."),
			c("u17c9", "terminal", "The buyer has responsibility for unloading fees and local storage at a terminal."),
			c("u17c10", "clearance", "With DDP, the seller also has to handle any customs clearance problems. The buyer has no additional costs.")
		],
		questions: [
			s("u17q1", "What is the difference between free trade and protectionism?", "Free trade does not restrict imports or exports. Protectionism restrains trade through tariffs, quotas and other regulations.", "restrict & tariff"),
			s("u17q2", "What is the difference between a tariff and a quota?", "A tariff is a tax that raises the price of imported goods. A quota restricts the amount of a good that can enter or leave a country.", "tax | price & amount"),
			s("u17q3", "What is absolute advantage?", "Absolute advantage is the ability of a nation to produce a good more efficiently than any other nation.", "any other nation | more efficiently"),
			s("u17q4", "What is comparative advantage?", "Comparative advantage is the ability of a nation to produce a good more efficiently than it produces any other good.", "any other good"),
			s("u17q5", "What is an infant industry?", "An infant industry is a new industry that, in its early stages, cannot compete with established competitors abroad.", "new & abroad | competitors"),
			s("u17q6", "Why does Ha-Joon Chang compare protection to raising a child?", "He says a child sent to work too early never becomes a surgeon. A new industry also needs protection until it grows up.", "child | protection")
		]
	}
};
function v$1(id, word, sentence) {
	return {
		id,
		word,
		sentence
	};
}
var EXTRA_VOCAB = {
	u01: [
		v$1("u01x1", "strategy", "A plan for achieving success."),
		v$1("u01x2", "objective", "Something you plan to do or achieve."),
		v$1("u01x3", "innovation", "A new idea or method."),
		v$1("u01x4", "subordinate", "A person with a less important position in an organization."),
		v$1("u01x5", "consultant", "A person who provides expert advice to a company."),
		v$1("u01x6", "promotion", "When someone is raised to a higher or more important position."),
		v$1("u01x7", "crisis | crises", "A situation of danger or difficulty."),
		v$1("u01x8", "public sector", "The section of the economy under government control.")
	],
	u02: [
		v$1("u02x1", "physiological needs", "The most basic human needs, such as food, water, air and sleep."),
		v$1("u02x2", "safety needs", "The need to be free from danger, physical pain, and the threat of losing one's job."),
		v$1("u02x3", "esteem needs", "The need for self-respect and to be respected by others."),
		v$1("u02x4", "self-actualization", "The desire to develop as a person and to realize one's potential."),
		v$1("u02x5", "incentive", "Something that encourages a worker to work harder, such as extra pay."),
		v$1("u02x6", "fringe benefits", "Advantages given with a job besides wages, such as a company car or free medical insurance."),
		v$1("u02x7", "commission", "Money paid to a salesperson as a percentage of the sales they make."),
		v$1("u02x8", "bonus", "Extra money paid to a worker for good performance or at the end of the year."),
		v$1("u02x9", "piece rate", "Pay that depends on the number of items a worker produces."),
		v$1("u02x10", "feedback", "Direct information a person receives about their performance.")
	],
	u03: [
		v$1("u03x1", "line authority", "The right to command people directly below you in the hierarchy."),
		v$1("u03x2", "staff position", "A post whose holder helps someone else but has no line authority and is not in the chain of command."),
		v$1("u03x3", "centralization", "Keeping important decisions at the Head Office, the centre of the organization."),
		v$1("u03x4", "matrix management", "A structure in which people report to more than one superior."),
		v$1("u03x5", "functional organization", "Dividing a business into departments such as production, finance, marketing and personnel."),
		v$1("u03x6", "accountability", "Being required to explain your decisions to the person above you."),
		v$1("u03x7", "flat hierarchy", "An organization with only a few levels of management."),
		v$1("u03x8", "tall hierarchy", "An organization with many levels of management."),
		v$1("u03x9", "autonomous team", "A temporary group responsible for a whole project, which is split up when the project is finished.")
	],
	u04: [
		v$1("u04x1", "power distance", "How people in a society cope with inequality and relate to more powerful individuals."),
		v$1("u04x2", "high-power distance", "A culture in which subordinates expect formal hierarchies and accept authoritarian relationships."),
		v$1("u04x3", "low-power distance", "A culture in which subordinates see themselves as equals of their supervisors."),
		v$1("u04x4", "linear-active", "In the Lewis Model, people who plan, organize and do one thing at a time."),
		v$1("u04x5", "multi-active", "In the Lewis Model, people who are lively, do many things at once and are people-oriented."),
		v$1("u04x6", "reactive", "In the Lewis Model, people who listen and react carefully to the other person's position."),
		v$1("u04x7", "collectivist", "A culture that values the group more than the individual."),
		v$1("u04x8", "lose face", "To be publicly humiliated or to lose other people's respect."),
		v$1("u04x9", "intuition", "Understanding something immediately, without conscious reasoning."),
		v$1("u04x10", "compromise", "An agreement in which each side gives up part of what it wanted."),
		v$1("u04x11", "eye contact", "Looking directly at another person's eyes while speaking or listening."),
		v$1("u04x12", "status", "The amount of respect and importance a person has in a group."),
		v$1("u04x13", "connections", "People you know who can help you, especially in business."),
		v$1("u04x14", "improvise", "To do something without preparation, using whatever is available.")
	],
	u05: [
		v$1("u05x1", "vacancy", "A job that is available because nobody is doing it at the moment."),
		v$1("u05x2", "applicant", "A person who asks to be considered for a job."),
		v$1("u05x3", "curriculum vitae | CV", "A written record of your education and the jobs you have done, used when applying for a job."),
		v$1("u05x4", "covering letter", "A letter sent with a CV to say why you want the job."),
		v$1("u05x5", "short-list", "A small group of candidates chosen from all the applicants and invited to an interview."),
		v$1("u05x6", "psychometric test", "A test that looks at the psychological traits of an applicant."),
		v$1("u05x7", "headhunter", "A person or firm that finds senior managers for a company, often people who already have a job."),
		v$1("u05x8", "probationary period", "A time at the start of a job when the employer checks that the new person is suitable."),
		v$1("u05x9", "reference", "A statement about a person's character and ability, written by someone who knows them."),
		v$1("u05x10", "equal opportunities", "Employing people regardless of their sex, skin colour, religion or disability.")
	],
	u06: [
		v$1("u06x1", "quaternary sector", "The part of the economy that provides information services such as computing, ICT, consultancy and research."),
		v$1("u06x2", "franchise", "A business in which someone pays to use another company's name and way of working."),
		v$1("u06x3", "joint venture", "A business activity started by two or more companies working together."),
		v$1("u06x4", "prospectus", "A document a public company publishes when it offers shares for sale."),
		v$1("u06x5", "corporation", "The usual American word for a limited company."),
		v$1("u06x6", "bankruptcy", "The legal state of a person or company that cannot pay its debts.")
	],
	u07: [
		v$1("u07x1", "Kaizen", "A Japanese word for continuous improvement, focused on eliminating waste through the ideas of the workers."),
		v$1("u07x2", "overproduction", "Making goods before customers have ordered them, which raises storage costs."),
		v$1("u07x3", "lead time", "The time between placing an order and receiving the goods."),
		v$1("u07x4", "optimum capacity", "The most efficient level of production, so that costs are kept to a minimum."),
		v$1("u07x5", "assembly line", "A production system in which a product moves through a factory as new parts are added."),
		v$1("u07x6", "finished goods", "Complete products that are ready to sell."),
		v$1("u07x7", "product recall", "The removal from sale of an item that might be dangerous to the people who bought it."),
		v$1("u07x8", "offshore manufacturing", "Making goods in another country so that they can be imported to the domestic market."),
		v$1("u07x9", "planned obsolescence", "Designing products so that they have a limited life and must be replaced sooner."),
		v$1("u07x10", "supply chain", "The manufacturers, wholesalers and distributors who make, deliver and sell a product."),
		v$1("u07x11", "zero defects", "A standard that allows no faults in the goods leaving the factory."),
		v$1("u07x12", "raw materials", "Basic items, such as wood or iron ore, that must be treated before they can be used."),
		v$1("u07x13", "random sampling", "Testing a few items from a batch to judge the quality of the whole batch.")
	],
	u08: [
		v$1("u08x1", "supply chain", "The network that buys materials, turns them into finished products, and delivers those products to customers."),
		v$1("u08x2", "push strategy", "Producing and sending goods based on a forecast, even before customers order them."),
		v$1("u08x3", "pull strategy", "Producing goods only when there is actual customer demand, which keeps inventory low."),
		v$1("u08x4", "cargo", "Goods carried by a ship, aircraft or other vehicle."),
		v$1("u08x5", "freight", "Goods being transported, and the system of moving them."),
		v$1("u08x6", "warehousing", "Storing goods in a building until they are needed."),
		v$1("u08x7", "procurement", "Buying the materials and services a company needs."),
		v$1("u08x8", "customs clearance", "The act of passing goods through customs so they can enter or leave a country."),
		v$1("u08x9", "logistician", "A specialist in logistics."),
		v$1("u08x10", "provider", "A person or company whose business is to supply a particular service or commodity."),
		v$1("u08x11", "forecasting", "Estimating how many goods will be needed in the future."),
		v$1("u08x12", "inventory", "The stock of materials, unfinished work and finished goods a business holds."),
		v$1("u08x13", "distribution", "Moving finished goods from the producer to the customer."),
		v$1("u08x14", "freight forwarder", "A person who arranges the transport of goods by sea, air, road or rail."),
		v$1("u08x15", "bottleneck", "A point in a process where work slows down because too much is trying to pass through.")
	],
	u09: [
		v$1("u09x1", "benchmarking", "Measuring your performance against companies that are best in class, then using that information to improve."),
		v$1("u09x2", "tolerance", "The amount by which a measurement can vary before the piece becomes a defect."),
		v$1("u09x3", "ISO 9000", "A set of international standards of quality. A company can be audited and then say it is certified."),
		v$1("u09x4", "nonconformance", "A situation in which a requirement has not been met. It need not be a serious defect."),
		v$1("u09x5", "Six Sigma", "A quality method that uses a very disciplined approach to eliminate defects in manufacturing."),
		v$1("u09x6", "key performance indicator | KPI", "A statistical measure of how well an organization is doing in a particular area."),
		v$1("u09x7", "leading indicator", "A measure that predicts a future result, such as staff satisfaction predicting quality."),
		v$1("u09x8", "lagging indicator", "A measure that shows a result after the event, such as the number of warranty claims."),
		v$1("u09x9", "zero defects", "The aim that no faulty items are produced, so work is right the first time."),
		v$1("u09x10", "quality circle", "A small voluntary group of workers who meet to discuss quality problems and suggest solutions."),
		v$1("u09x11", "warranty", "A promise to repair or replace a product if it fails within a stated time."),
		v$1("u09x12", "defect", "A fault in a product."),
		v$1("u09x13", "customer expectations", "What the buyer believes a product or service should be like."),
		v$1("u09x14", "reliability", "The quality of working well for a long time without breaking."),
		v$1("u09x15", "durability", "The quality of lasting a long time."),
		v$1("u09x16", "prevention", "Stopping defects before they happen, which quality theorists say is cheaper than repairing them.")
	],
	u10: [
		v$1("u10x1", "early adopter", "A customer who buys a new product soon after it is launched, often at a high price."),
		v$1("u10x2", "skimming", "Setting a high price at first and then gradually lowering it."),
		v$1("u10x3", "saturation", "The point at which a market cannot grow any further because almost everyone who wants the product already has it."),
		v$1("u10x4", "brand", "A name, design or symbol that identifies a product and distinguishes it from rivals."),
		v$1("u10x5", "niche", "A small, specialized part of a market."),
		v$1("u10x6", "introduction", "The first stage of the product life cycle, when sales are low and the product may still be making a loss."),
		v$1("u10x7", "maturity", "The stage of the product life cycle when sales growth slows and then stabilizes."),
		v$1("u10x8", "decline", "The stage of the product life cycle when sales fall and many products are withdrawn.")
	],
	u11: [
		v$1("u11x1", "endorse", "When a celebrity says in an advertisement how good a product is."),
		v$1("u11x2", "hoarding", "The British word for a large outdoor advertising sign, also called a billboard."),
		v$1("u11x3", "sample", "A small amount of a new product given free so that customers can try it."),
		v$1("u11x4", "point-of-sale", "Advertising done at the place where the product is sold."),
		v$1("u11x5", "sponsorship", "Paying to be associated with a sports or arts event as a way of advertising."),
		v$1("u11x6", "word-of-mouth", "Advertising that happens when a satisfied customer recommends a product to friends."),
		v$1("u11x7", "commercial", "An advertisement on television or radio."),
		v$1("u11x8", "slogan", "A short phrase used in advertising so that people remember the product."),
		v$1("u11x9", "target market", "The group of customers whose needs a company plans to satisfy and therefore to advertise to."),
		v$1("u11x10", "media plan", "The choice of how and where to advertise, and in what proportions."),
		v$1("u11x11", "brief", "A statement of the objectives of an advertising campaign, given to the agency."),
		v$1("u11x12", "publicity", "Favourable mentions of a company or product that the company does not pay for.")
	],
	u12: [
		v$1("u12x1", "legal tender", "Money that must by law be accepted in payment."),
		v$1("u12x2", "refund", "Money returned to a customer who brings a faulty product back to the shop."),
		v$1("u12x3", "receipt", "A piece of paper showing that you have paid for something."),
		v$1("u12x4", "instalment", "One of a series of regular payments for something expensive, such as a car."),
		v$1("u12x5", "standing order", "An instruction to a bank to pay a fixed sum to someone at regular intervals."),
		v$1("u12x6", "direct debit", "Permission for a company to take varying amounts from your account to pay bills."),
		v$1("u12x7", "spread", "The difference between the interest a bank pays on deposits and the interest it charges on loans."),
		v$1("u12x8", "interest", "The price paid for borrowing money, or the money a bank pays you for keeping a deposit."),
		v$1("u12x9", "wage", "Money paid to a worker, traditionally in cash each week.")
	],
	u13: [
		v$1("u13x1", "income", "All the money received from business activities during a given period."),
		v$1("u13x2", "expenditure", "All the money a business spends on goods or services during a given period."),
		v$1("u13x3", "budget", "A financial plan showing expected income and expenditure."),
		v$1("u13x4", "asset", "Anything owned by a business, such as cash, buildings or machines."),
		v$1("u13x5", "liability", "Money a company will have to pay to someone else in the future, including debts, taxes and interest."),
		v$1("u13x6", "debit", "An entry in an account that records a payment made."),
		v$1("u13x7", "credit", "An entry in an account that records a payment received."),
		v$1("u13x8", "intangible", "Having no physical existence, so that you cannot touch it."),
		v$1("u13x9", "accrued", "Describing a cost that has been incurred but not yet invoiced."),
		v$1("u13x10", "forensic accounting", "Examining financial records because illegal activity is suspected.")
	],
	u14: [
		v$1("u14x1", "policy-maker", "A person in government or a central bank who decides economic policy."),
		v$1("u14x2", "interest rate", "The price of borrowing money. Cutting it is a fast way to support a weak economy."),
		v$1("u14x3", "tax cut", "A reduction in tax, which leaves people with more money to spend."),
		v$1("u14x4", "labour market", "The supply of people available for work, and the jobs available to them."),
		v$1("u14x5", "inflation", "A general rise in prices. Growth caused by very low interest rates may lead to it.")
	],
	u15: [
		v$1("u15x1", "above board", "Completely open and honest, with nothing hidden."),
		v$1("u15x2", "integrity", "The quality of being honest and having strong moral principles."),
		v$1("u15x3", "probity", "Complete honesty, especially in business or professional life."),
		v$1("u15x4", "misconduct", "Unacceptable or illegal behaviour in a job."),
		v$1("u15x5", "transparency", "Being open about what you do, so that outsiders can understand it."),
		v$1("u15x6", "accountability", "Being required to explain your actions and ready to accept responsibility for them."),
		v$1("u15x7", "stakeholder", "Any person or group affected by a company's actions, such as employees, customers or the local community."),
		v$1("u15x8", "code of ethics", "A written set of rules saying how a company's people should behave."),
		v$1("u15x9", "whistle-blower", "A person who reports illegal or unethical behaviour inside an organization."),
		v$1("u15x10", "bribery", "Giving money or gifts to persuade someone to do something dishonest."),
		v$1("u15x11", "volunteerism", "The CSR dimension in which employees give their time to help the community."),
		v$1("u15x12", "sustainability", "Meeting present needs without damaging the ability of future generations to meet theirs.")
	],
	u16: [
		v$1("u16x1", "delayering", "Removing levels of middle management to make an organization flatter and more flexible."),
		v$1("u16x2", "job sharing", "Two or more people working part-time to do a job that one person would normally do full-time."),
		v$1("u16x3", "flexible labour market", "A situation in which it is easy for companies to hire staff who are not permanent."),
		v$1("u16x4", "casual work", "Temporary employment that is not regular or fixed."),
		v$1("u16x5", "contract work", "Temporary employment to do a specific project or piece of work."),
		v$1("u16x6", "rightsizing", "Another word for downsizing, though it can also mean making an organization larger."),
		v$1("u16x7", "redundancy", "Losing a job because the company no longer needs that work to be done."),
		v$1("u16x8", "outsourcing", "Using another business to supply components or services instead of doing the work inside the company."),
		v$1("u16x9", "relocation", "Moving some of a company's activities to another place or country."),
		v$1("u16x10", "core workforce", "The central, permanent employees of a company, as opposed to temporary staff."),
		v$1("u16x11", "make redundant", "To dismiss a worker because their job is no longer needed.")
	],
	u17: [
		v$1("u17x1", "EXW | ex works", "An Incoterm: the seller makes the goods available at their own premises, and the buyer pays for everything after that."),
		v$1("u17x2", "FOB | free on board", "An Incoterm: the seller pays for transport to the ship and for loading onto it."),
		v$1("u17x3", "CIF | cost, insurance and freight", "An Incoterm: the seller pays the sea freight and the insurance, but responsibility ends at the destination port."),
		v$1("u17x4", "DDP | delivered duty paid", "An Incoterm: the seller pays for everything, including customs clearance, until the goods reach the buyer."),
		v$1("u17x5", "customs duty", "A tax charged on goods when they enter a country."),
		v$1("u17x6", "FAS | free alongside ship", "An Incoterm: the seller pays to bring the goods to the dock, and the buyer pays for loading onto the ship."),
		v$1("u17x7", "embargo", "An official ban on trade with a particular country or in particular goods."),
		v$1("u17x8", "dumping", "Selling exports at a price below the cost of production in order to win a foreign market."),
		v$1("u17x9", "subsidy", "Money a government pays to local producers so that they can compete with imports."),
		v$1("u17x10", "documentation", "The paperwork needed to export goods, such as invoices and certificates.")
	]
};
var BOOK_BANK = "efs-17-v4";
function v(id, word, sentence) {
	return {
		id,
		word,
		sentence
	};
}
function q(id, prompt, answer) {
	return {
		id,
		prompt,
		answer
	};
}
function bookUnits() {
	const units = [
		{
			id: "u01",
			label: "Unit 1: Management",
			vocab: [
				v("u01v1", "management", "The process used to accomplish organizational goals through planning, organizing, leading, and controlling people and other organizational resources."),
				v("u01v2", "manager", "An individual who is in charge of a certain group of tasks, or a certain area or department of a business."),
				v("u01v3", "Chief Executive Officer | CEO", "The most senior manager responsible for the overall performance and success of a company."),
				v("u01v4", "planning", "A management function that includes anticipating trends and determining the best strategies and tactics to achieve organizational goals and objectives."),
				v("u01v5", "planning", "involves setting aims or targets for the future of the organization to give it a sense of direction or purpose. Managers must also plan for the resources (physical, human, and financial) that will be needed to achieve these strategies."),
				v("u01v6", "organizing", "A management function that includes designing the structure of the organization and creating conditions and systems in which everyone and everything work together to achieve the organization's goals and objectives."),
				v("u01v7", "organizing", "A manager cannot do everything alone; tasks must be delegated to others. Managers must ensure that subordinates have the necessary resources to perform their tasks successfully. An organizational chart is used to show authority and ensure specialization, preventing two people from performing overlapping tasks."),
				v("u01v8", "leading", "Creating a vision for the organization and guiding, training, coaching, and motivating others to work effectively to achieve the organization's goals and objectives."),
				v("u01v9", "controlling", "A management function that involves establishing clear standards to determine whether or not an organization is progressing toward its goals and objectives, rewarding people for doing a good job, and taking corrective action if they are not."),
				v("u01v10", "controlling", "This is a never-ending task where managers must measure and evaluate the performance of all individuals and groups against the original plans. If targets are not met, the manager must find the causes and take corrective action (such as providing staff training)."),
				v("u01v11", "coordinating", "means \"bringing together\" different individuals and departments (such as Marketing and Production) to work towards the plans. Without coordination, departments might work in isolation, leading to a lack of communication and uncoordinated efforts."),
				v("u01v12", "commanding", "is more concerned with guiding, leading, and supervising people than just telling them what to do. Managers must ensure that supervisors and workers are keeping to targets and deadlines by providing instructions and guidance."),
				v("u01v13", "entrepreneurs", "are alert to undiscovered profit opportunities. They perceive opportunities to commercialize new technologies and products that serve the market better. They are highly unconventional, innovative people who risk their own or other people's capital.")
			],
			questions: [
				q("u01q1", "Managers are awarded formal, tangible power and authority by virtue of what?", "their position within the organization"),
				q("u01q2", "What is a leader's influence based on?", "their personal qualities"),
				q("u01q3", "A leader's influence is awarded on what kind of basis?", "a temporary basis | temporary"),
				q("u01q4", "What do managers spend much of their time doing?", "upholding the status quo of the organization | upholding the status quo"),
				q("u01q5", "Why do leaders often challenge the status quo?", "to bring innovation to organizations | to bring innovation"),
				q("u01q6", "What are managers concerned with?", "the bottom line"),
				q("u01q7", "What are leaders looking at?", "the horizon"),
				q("u01q8", "Which resources must managers plan for?", "physical, human, and financial | physical, human and financial"),
				q("u01q9", "What is used to show authority and ensure specialization?", "an organizational chart | organizational chart"),
				q("u01q10", "What does coordinating mean?", "bringing together"),
				q("u01q11", "Which two departments are named as an example that must be coordinated?", "Marketing and Production"),
				q("u01q12", "Commanding is more concerned with what, rather than just telling people what to do?", "guiding, leading, and supervising people | guiding, leading and supervising people"),
				q("u01q13", "If targets are not met, what must the manager do?", "find the causes and take corrective action"),
				q("u01q14", "What are entrepreneurs alert to?", "undiscovered profit opportunities"),
				q("u01q15", "Who is needed to run a business in the long term?", "a manager | manager")
			]
		},
		{
			id: "u02",
			label: "Unit 2: Work and Motivation",
			vocab: [
				v("u02v1", "motivation", "factors that influence the behavior of workers towards achieving business goals. It can be increased by monetary rewards, non-monetary rewards, and introducing ways to give job satisfaction."),
				v("u02v2", "job satisfaction", "The enjoyment a worker gets from feeling that they have done a good job."),
				v("u02v3", "job rotation", "swapping workers round and only doing a specific task for a limited time before swapping round again."),
				v("u02v4", "job enlargement", "extra tasks are added to the job to make it more interesting."),
				v("u02v5", "job enrichment", "adding tasks that require more skill and/or responsibility."),
				v("u02v6", "Theory X", "The average person does not like work. Workers must be constantly supervised so they will work. Motivation is from external factors, for example pay schemes where the workers are paid more for increased output."),
				v("u02v7", "Theory Y", "The average person is motivated by internal factors. To motivate workers, you need to find ways to help workers take an interest in their work, for example give rewards and incentives."),
				v("u02v8", "Maslow's hierarchy of needs", "A theory of motivation which states that five categories of human needs dictate an individual's behavior. Those needs are physiological needs, safety needs, love and belonging needs, esteem needs, and self-actualization needs."),
				v("u02v9", "hygiene factors", "The factors that must be present in the workplace to prevent job dissatisfaction."),
				v("u02v10", "motivators", "The needs that allow a human being to grow psychologically. Herzberg called these motivational needs.")
			],
			questions: [
				q("u02q1", "What three things can increase motivation?", "monetary rewards, non-monetary rewards, and job satisfaction | monetary rewards, non-monetary rewards, and introducing ways to give job satisfaction"),
				q("u02q2", "What are the three ways to motivate workers to be more committed to their jobs?", "job rotation, job enlargement, and job enrichment"),
				q("u02q3", "In Theory X, where does motivation come from?", "external factors"),
				q("u02q4", "In Theory Y, the average person is motivated by what?", "internal factors"),
				q("u02q5", "Name Maslow's five categories of needs.", "physiological needs, safety needs, love and belonging needs, esteem needs, and self-actualization needs"),
				q("u02q6", "What must be present in the workplace to prevent job dissatisfaction?", "hygiene factors"),
				q("u02q7", "What did Herzberg call the needs that let a person grow psychologically?", "motivational needs | motivators")
			]
		},
		{
			id: "u03",
			label: "Unit 3: Company Structure",
			vocab: [
				v("u03v1", "organizational structure", "The levels of management and division of responsibilities within an organization."),
				v("u03v2", "hierarchy", "The levels of management in any organization, from the highest to the lowest."),
				v("u03v3", "chain of command", "The structure in an organization which allows instructions to be passed down from senior management to lower levels of management."),
				v("u03v4", "span of control", "The number of subordinates working directly under a manager."),
				v("u03v5", "directors", "Senior managers who lead a particular department or division of a business."),
				v("u03v6", "line managers", "People who have responsibility for people below them in the hierarchy of an organization."),
				v("u03v7", "supervisors", "Junior managers who have direct control over the employees below them in the organizational structure."),
				v("u03v8", "staff managers", "Specialists who provide support, information and assistance to line managers."),
				v("u03v9", "delegation", "Giving a subordinate the authority to perform a particular task."),
				v("u03v10", "decentralization", "Taking decisions away from the centre of an organization, away from the Head Office."),
				v("u03v11", "outsourcing", "transferring some of the company's internal functions or operations or jobs to outside suppliers, rather than performing them in-house.")
			],
			questions: [
				q("u03q1", "What is passed down from senior management to lower levels of management?", "instructions"),
				q("u03q2", "What does span of control count?", "the number of subordinates working directly under a manager"),
				q("u03q3", "Who provides support, information and assistance to line managers?", "staff managers"),
				q("u03q4", "What is given to a subordinate so they can perform a particular task?", "authority | the authority"),
				q("u03q5", "Decentralization takes decisions away from where?", "the Head Office | the centre of an organization"),
				q("u03q6", "What is the opposite of performing work in-house, when jobs go to outside suppliers?", "outsourcing")
			]
		},
		{
			id: "u04",
			label: "Unit 4: Managing across Cultures",
			vocab: [
				v("u04v1", "glocalization", "a combination of the words globalization and localization. The term is used to describe a product or service that is developed and distributed globally but is also adjusted to accommodate the user or consumer in a local market."),
				v("u04v2", "culture", "the complex system of values, traits, morals, and customs shared by a society."),
				v("u04v3", "context", "the stimuli, environment, or ambience surrounding an event."),
				v("u04v4", "the Lewis Model", "divides humans into 3 clear categories, based not on nationality or religion but on behaviour: Linear-active, Multi-active and Reactive."),
				v("u04v5", "high-context culture", "a culture in which the rules of communication are primarily transmitted through contextual elements, including body language, the status of an individual, and the tone of voice. Rules are usually not explicitly written or stated."),
				v("u04v6", "low-context culture", "a culture whereby most communications take place through verbal language and rules are directly written out or stated for all to view.")
			],
			questions: [
				q("u04q1", "Glocalization combines which two words?", "globalization and localization"),
				q("u04q2", "A glocal product is developed globally but adjusted for whom?", "the user or consumer in a local market | a local market"),
				q("u04q3", "The Lewis Model is based on behaviour, not on what?", "nationality or religion"),
				q("u04q4", "Name the three Lewis categories.", "Linear-active, Multi-active and Reactive"),
				q("u04q5", "In a high-context culture, are the rules usually written down?", "no | No"),
				q("u04q6", "In a low-context culture, most communication takes place through what?", "verbal language")
			]
		},
		{
			id: "u05",
			label: "Unit 5: Recruitment",
			vocab: [
				v("u05v1", "recruitment", "the process from identifying that the business needs to employ someone up to the point at which applications have arrived at the business."),
				v("u05v2", "employee selection", "the process of evaluating candidates for a specific job and selecting an individual for employment based on the needs of the organisation."),
				v("u05v3", "job analysis", "identifies and records the responsibilities and tasks relating to a job."),
				v("u05v4", "job description", "outlines the responsibilities and duties to be carried out by someone employed to do a specific job."),
				v("u05v5", "job specification", "a document which outlines the requirements, qualifications, expertise, physical characteristics, and so on, for a specified job."),
				v("u05v6", "internal recruitment", "when a vacancy is filled by someone who is an existing employee of the business."),
				v("u05v7", "external recruitment", "when a vacancy is filled by someone who is not an existing employee and will be new to the business."),
				v("u05v8", "induction training", "an introduction given to a new employee, explaining the business's activities, customs and procedures and introducing them to their fellow workers."),
				v("u05v9", "on-the-job training", "occurs by watching a more experienced worker doing the job."),
				v("u05v10", "off-the-job training", "involves being trained away from the workplace, usually by specialist trainers.")
			],
			questions: [
				q("u05q1", "Recruitment ends at the point when what has arrived at the business?", "applications"),
				q("u05q2", "Which document outlines responsibilities and duties of a specific job?", "a job description | job description"),
				q("u05q3", "Which document outlines requirements, qualifications and expertise for a job?", "a job specification | job specification"),
				q("u05q4", "Who fills a vacancy in internal recruitment?", "an existing employee"),
				q("u05q5", "Who fills a vacancy in external recruitment?", "someone who is not an existing employee | someone new to the business"),
				q("u05q6", "On-the-job training happens by watching whom?", "a more experienced worker"),
				q("u05q7", "Where does off-the-job training take place?", "away from the workplace")
			]
		},
		{
			id: "u06",
			label: "Unit 6: Classification of Businesses",
			vocab: [
				v("u06v1", "primary sector", "extracts and uses the natural resources of Earth to produce raw materials used by other businesses."),
				v("u06v2", "secondary sector", "manufactures goods using the raw materials provided by the primary sector."),
				v("u06v3", "tertiary sector", "provides services to consumers and the other sectors of industry."),
				v("u06v4", "mixed economy", "has both a private sector and a public (state) sector."),
				v("u06v5", "public sector", "the sector of the economy in which organisations are owned and controlled by the state (government)."),
				v("u06v6", "private sector", "The sector of the economy in which organisations are owned and controlled by individuals."),
				v("u06v7", "privatisation", "The sale of state-owned assets such as public corporations to the private sector."),
				v("u06v8", "sole trader", "a business owned and operated by one person."),
				v("u06v9", "limited liability", "the liability of shareholders in a company is limited to only the amount they invested."),
				v("u06v10", "unlimited liability", "the owners of a business can be held responsible for the debts of the business they own. Their liability is not limited to the investment they made in the business."),
				v("u06v11", "partnership", "a form of business in which two or more people agree to jointly own a business."),
				v("u06v12", "shareholders", "the owners of a limited company. They buy shares which represent part-ownership of the company."),
				v("u06v13", "private limited company", "businesses owned by shareholders but they cannot sell shares to the public."),
				v("u06v14", "public limited company", "businesses owned by shareholders but they can sell shares to the public and their shares are tradeable on the Stock Exchange.")
			],
			questions: [
				q("u06q1", "Which sector extracts natural resources to produce raw materials?", "the primary sector | primary sector"),
				q("u06q2", "Which sector manufactures goods?", "the secondary sector | secondary sector"),
				q("u06q3", "Which sector provides services?", "the tertiary sector | tertiary sector"),
				q("u06q4", "Who owns and controls public-sector organisations?", "the state | the government"),
				q("u06q5", "Privatisation is the sale of state-owned assets to whom?", "the private sector"),
				q("u06q6", "How many people own a sole trader?", "one | one person"),
				q("u06q7", "Limited liability is limited to what?", "only the amount they invested | the amount they invested"),
				q("u06q8", "How many people jointly own a partnership?", "two or more"),
				q("u06q9", "Can a private limited company sell shares to the public?", "no | No"),
				q("u06q10", "Where are the shares of a public limited company tradeable?", "on the Stock Exchange | the Stock Exchange")
			]
		},
		{
			id: "u07",
			label: "Unit 7: Production",
			vocab: [
				v("u07v1", "production", "the process of converting inputs such as land, labour and capital into saleable goods, for example shoes and cell phones."),
				v("u07v2", "inventories", "the stock of raw materials, work-in-progress and finished goods held by a business."),
				v("u07v3", "lean production", "the production of goods and services with the minimum waste of resources."),
				v("u07v4", "job production", "the production of items one at a time."),
				v("u07v5", "batch production", "the production of goods in batches. Each batch passes through one stage of production before moving onto the next stage."),
				v("u07v6", "flow production", "the production of very large quantities of identical goods using a continuously moving process."),
				v("u07v7", "just-in-time | JIT", "a production method that involves reducing or virtually eliminating the need to hold inventories of raw materials or unsold inventories of the finished product.")
			],
			questions: [
				q("u07q1", "Production converts inputs such as land, labour and capital into what?", "saleable goods"),
				q("u07q2", "Inventories include raw materials, work-in-progress and what else?", "finished goods"),
				q("u07q3", "Lean production keeps waste of resources to what?", "a minimum | the minimum"),
				q("u07q4", "Job production makes items how?", "one at a time"),
				q("u07q5", "Flow production uses what kind of process?", "a continuously moving process"),
				q("u07q6", "Just-in-time tries to eliminate the need to hold what?", "inventories")
			]
		},
		{
			id: "u08",
			label: "Unit 8: Logistics",
			vocab: [
				v("u08v1", "logistics", "the business activity that involves planning, implementing, and controlling the physical flow of materials, final goods, and related information from points of origin to points of consumption to meet customer requirements at a profit."),
				v("u08v2", "inbound logistics", "the area of logistics that involves bringing raw materials, packaging, other goods and services, and information from suppliers to producers."),
				v("u08v3", "materials handling", "the movement of goods within a warehouse, from warehouses to the factory floor, and from the factory floor to various workstations."),
				v("u08v4", "outbound logistics", "the area of logistics that involves managing the flow of finished products and information to business buyers and ultimate consumers."),
				v("u08v5", "reverse logistics", "the area of logistics that involves bringing goods back to the manufacturer because of defects or for recycling.")
			],
			questions: [
				q("u08q1", "Logistics moves materials and goods from points of origin to where?", "points of consumption"),
				q("u08q2", "Inbound logistics brings raw materials from suppliers to whom?", "producers"),
				q("u08q3", "Materials handling is the movement of goods inside what?", "a warehouse | the warehouse"),
				q("u08q4", "Outbound logistics manages the flow of what?", "finished products | finished products and information"),
				q("u08q5", "Why does reverse logistics bring goods back to the manufacturer?", "because of defects or for recycling")
			]
		},
		{
			id: "u09",
			label: "Unit 9: Quality",
			vocab: [
				v("u09v1", "quality", "to produce a good or a service which meets customer expectations."),
				v("u09v2", "quality control", "the checking for quality at the end of the production process, whether it is the production of a product or service."),
				v("u09v3", "quality assurance", "the checking for quality standards throughout the production process, whether it is the production of a product or service."),
				v("u09v4", "Total Quality Management | TQM", "the continuous improvement of products and processes by focusing on quality at each stage of production.")
			],
			questions: [
				q("u09q1", "Quality means meeting whose expectations?", "customer expectations | the customer's expectations"),
				q("u09q2", "Quality control checks quality at which point?", "at the end of the production process | the end of the production process"),
				q("u09q3", "Quality assurance checks quality standards when?", "throughout the production process"),
				q("u09q4", "Total Quality Management focuses on quality at which stage?", "each stage of production | at each stage of production")
			]
		},
		{
			id: "u10",
			label: "Unit 10: Marketing",
			vocab: [
				v("u10v1", "market", "the set of all actual and potential buyers of a good or service."),
				v("u10v2", "market leader", "the company with the largest market share."),
				v("u10v3", "market nicher", "a small company that concentrates on one or more particular niches or small market segments."),
				v("u10v4", "market research | marketing research", "the collection, analysis and reporting of data relevant to a specific marketing situation."),
				v("u10v5", "market segment", "part of a market; a group of customers with specific needs, defined in terms of geography, age, sex, income, occupation, life-style, and so on."),
				v("u10v6", "market segmentation", "the act of dividing a market into distinct groups of buyers who have different requirements or buying habits."),
				v("u10v7", "market share", "the sales of a company, brand or product expressed as a percentage of total sales in a market."),
				v("u10v8", "marketing", "the process of identifying and satisfying consumers' needs and desires."),
				v("u10v9", "marketing channel", "the set of intermediaries a company uses to get its goods to their end users."),
				v("u10v10", "marketing mix", "the set of all the various elements in a marketing programme, and the way a company integrates them."),
				v("u10v11", "marketing strategy", "a plan or principle designed to achieve marketing objectives."),
				v("u10v12", "product life cycle", "the standard pattern of sales of a product over the period that it is marketed.")
			],
			questions: [
				q("u10q1", "The market leader is the company with the largest what?", "market share"),
				q("u10q2", "A market nicher concentrates on what?", "niches | small market segments | particular niches"),
				q("u10q3", "Market share is expressed as a percentage of what?", "total sales"),
				q("u10q4", "Marketing identifies and satisfies whose needs and desires?", "consumers' | consumers"),
				q("u10q5", "A marketing channel is the set of intermediaries used to reach whom?", "end users"),
				q("u10q6", "A marketing strategy is designed to achieve what?", "marketing objectives")
			]
		},
		{
			id: "u11",
			label: "Unit 11: Advertising",
			vocab: [
				v("u11v1", "advertorial", "A paid-for advertisement which includes editorial content, normally identified in a print magazine with the word Advertisement so it is distinct from genuine editorial content."),
				v("u11v2", "advertising agency", "The organization that takes care of advertising for clients."),
				v("u11v3", "advertising campaign", "A time-limited set of ads. Campaigns may run across different media, and for one month or ten years, but they are the execution of a central idea."),
				v("u11v4", "demographics", "Describing an audience by age, gender, ethnicity, or location — the facts about them."),
				v("u11v5", "focus groups", "Small, select groups representing a target audience who are paid to answer questions at the behest of a market research organization."),
				v("u11v6", "product placement", "The practice of paying for a branded product to be used by a character in a movie, for example James Bond driving a BMW Z3."),
				v("u11v7", "product positioning", "Establishing the market niche of a product — which may not be as the brand leader — and advertising to the appropriate segment of the audience."),
				v("u11v8", "unique selling proposition | USP | unique selling point", "a highlighted benefit of a product which makes it stand out from all rival brands.")
			],
			questions: [
				q("u11q1", "An advertorial is paid for and also includes what kind of content?", "editorial content"),
				q("u11q2", "Who takes care of advertising for clients?", "an advertising agency | advertising agency"),
				q("u11q3", "Demographics describe an audience by age, gender, ethnicity, or what?", "location"),
				q("u11q4", "Focus groups represent whom?", "a target audience"),
				q("u11q5", "Product placement pays for a branded product to be used where?", "in a movie | by a character in a movie"),
				q("u11q6", "A USP is a highlighted benefit that makes a product stand out from what?", "all rival brands | rival brands")
			]
		},
		{
			id: "u12",
			label: "Unit 12: Banking",
			vocab: [
				v("u12v1", "deposit", "to place money in a bank; or money placed in a bank."),
				v("u12v2", "liquidity", "available cash, and how easily other assets can be turned into cash."),
				v("u12v3", "collateral", "anything that acts as a security or guarantee for a loan."),
				v("u12v4", "mortgage", "a type of loan used to purchase or maintain a home, land, or other types of real estate. The borrower agrees to pay the lender over time, typically in regular payments divided into principal and interest. The property serves as collateral."),
				v("u12v5", "overdraft", "Something that occurs when you make a purchase or write a check for an amount that exceeds your checking account's available balance."),
				v("u12v6", "current account", "an account at a bank against which checks can be drawn by the account depositor; a checking account."),
				v("u12v7", "savings account", "a deposit account that generally earns higher interest than an interest-bearing checking account. It limits the number of certain transfers or withdrawals each statement cycle."),
				v("u12v8", "deposit account", "a bank account maintained by a financial institution in which a customer can deposit and withdraw money."),
				v("u12v9", "solvency", "When banks have enough money to cover potential losses."),
				v("u12v10", "commercial banks", "financial intermediaries with a government license to make loans and issue deposits, including deposits against which cheques can be written."),
				v("u12v11", "clearing system", "a set of arrangements in which debts between banks are settled by adding up all the transactions in a given period and paying only the net amounts needed to balance inter-bank accounts.")
			],
			questions: [
				q("u12q1", "Liquidity is available cash, and how easily other assets can be turned into what?", "cash"),
				q("u12q2", "Collateral acts as what for a loan?", "a security or guarantee | security | a guarantee"),
				q("u12q3", "A mortgage is typically repaid in payments divided into principal and what?", "interest"),
				q("u12q4", "An overdraft happens when a payment exceeds what?", "the available balance | your checking account's available balance"),
				q("u12q5", "A current account is also called what?", "a checking account | checking account"),
				q("u12q6", "Solvency means banks have enough money to cover what?", "potential losses"),
				q("u12q7", "A clearing system pays only the net amounts needed to balance what?", "inter-bank accounts")
			]
		},
		{
			id: "u13",
			label: "Unit 13: Accounting and Financial Statements",
			vocab: [
				v("u13v1", "cost accounting", "calculating all the expenses involved in producing something, including materials, labour, and all other expenses."),
				v("u13v2", "tax accounting", "calculating how much an individual or a company will have to pay to the local and national governments, and trying to reduce this to a minimum."),
				v("u13v3", "auditing", "inspecting and reporting on accounts and financial records."),
				v("u13v4", "accounting", "preparing financial statements showing income and expenditure, assets and liabilities."),
				v("u13v5", "management accounting | managerial accounting", "providing information that will allow a business to make decisions, plan future operations and develop business strategies."),
				v("u13v6", "creative accounting", "using all available accounting procedures and tricks to disguise the true financial position of a company."),
				v("u13v7", "bookkeeping", "writing down the details of transactions (debits and credits)."),
				v("u13v8", "cash flow statement", "a statement giving details of money coming into and leaving the business, divided into day-to-day operations, investing and financing."),
				v("u13v9", "income statement | profit and loss statement | profit and loss account", "a statement showing the difference between the revenues and expenses of a period."),
				v("u13v10", "balance sheet | statement of financial position", "a statement showing the value of a business's assets, its liabilities, and its capital or shareholders' equity.")
			],
			questions: [
				q("u13q1", "Cost accounting calculates all the expenses involved in what?", "producing something"),
				q("u13q2", "Auditing inspects and reports on what?", "accounts and financial records"),
				q("u13q3", "Creative accounting tries to disguise what?", "the true financial position of a company"),
				q("u13q4", "Bookkeeping writes down debits and what?", "credits"),
				q("u13q5", "A cash flow statement shows money coming into and doing what?", "leaving the business"),
				q("u13q6", "An income statement shows the difference between revenues and what?", "expenses"),
				q("u13q7", "A balance sheet shows assets, liabilities, and what else?", "capital | shareholders' equity | capital or shareholders' equity")
			]
		},
		{
			id: "u14",
			label: "Unit 14: The Business Cycle",
			vocab: [
				v("u14v1", "business cycle", "a model showing the increases and decreases in a nation's real GDP over time. It typically shows an increase in real GDP over the long run, combined with short-run fluctuations in output."),
				v("u14v2", "expansion", "the phase of the business cycle during which output is increasing."),
				v("u14v3", "recession", "the phase of the business cycle during which output is falling."),
				v("u14v4", "depression", "a deep and prolonged recession."),
				v("u14v5", "peak", "the turning point in the business cycle between an expansion and a contraction. Output has stopped increasing and begins to decrease."),
				v("u14v6", "trough", "the turning point in the business cycle between a recession and an expansion. Output that had been falling begins to rise."),
				v("u14v7", "downturn", "a decline in economic activity."),
				v("u14v8", "upturn", "an increase in economic activity."),
				v("u14v9", "expectations", "beliefs about what will happen in the future."),
				v("u14v10", "consumption", "purchasing and using goods and services."),
				v("u14v11", "balance of payments", "the difference between the funds a country receives and those it pays for all international transactions."),
				v("u14v12", "gross domestic product | GDP", "the total market value of all the goods and services produced in a country during a given period."),
				v("u14v13", "demand", "the willingness and ability of consumers to purchase goods and services."),
				v("u14v14", "supply", "the willingness and ability of businesses to offer goods or services for sale."),
				v("u14v15", "boom", "A long period of expansion.")
			],
			questions: [
				q("u14q1", "During an expansion, output is doing what?", "increasing"),
				q("u14q2", "During a recession, output is doing what?", "falling"),
				q("u14q3", "A depression is what kind of recession?", "a deep and prolonged recession | deep and prolonged"),
				q("u14q4", "A peak is the turning point between an expansion and what?", "a contraction"),
				q("u14q5", "A trough is the turning point between a recession and what?", "an expansion"),
				q("u14q6", "What is a decline in economic activity called?", "a downturn | downturn"),
				q("u14q7", "GDP is the total market value of all goods and services produced where?", "in a country"),
				q("u14q8", "What is a long period of expansion called?", "a boom | boom")
			]
		},
		{
			id: "u15",
			label: "Unit 15: Corporate Social Responsibility",
			vocab: [
				v("u15v1", "ethical standard", "a rule for moral behaviour in a particular area."),
				v("u15v2", "ethical behaviour", "doing things that are morally right."),
				v("u15v3", "ethical lapse", "temporary failure to act in the correct way."),
				v("u15v4", "ethical dilemma", "a choice between two actions that might both be morally wrong."),
				v("u15v5", "ethical stance", "a stated opinion about the right thing to do in a particular situation."),
				v("u15v6", "ethical issue", "an area where moral behaviour is important."),
				v("u15v7", "business ethics", "Standards of business behaviour that promote human welfare and the good."),
				v("u15v8", "corporate social responsibility | CSR", "A company's commitment to improving or enhancing community well-being through discretionary contributions of corporate resources.")
			],
			questions: [
				q("u15q1", "An ethical lapse is a temporary failure to do what?", "act in the correct way"),
				q("u15q2", "An ethical dilemma is a choice between two actions that might both be what?", "morally wrong"),
				q("u15q3", "Business ethics promote human welfare and what?", "the good"),
				q("u15q4", "Name the five dimensions of CSR.", "Environment, Social, Economic, Stakeholder, and Volunteerism"),
				q("u15q5", "CSR improves community well-being through what kind of contributions?", "discretionary contributions of corporate resources | discretionary contributions")
			]
		},
		{
			id: "u16",
			label: "Unit 16: Efficiency and Employment",
			vocab: [
				v("u16v1", "job insecurity", "The fear that you might lose your job."),
				v("u16v2", "employability", "The extent to which a person has skills that employers want."),
				v("u16v3", "downsizing", "Decreasing the number of permanent employees."),
				v("u16v4", "core", "The central part of something, for example a company's workforce."),
				v("u16v5", "efficiency", "a situation in which a person, company, factory, etc. uses resources such as time, materials, or labour well, without wasting any."),
				v("u16v6", "rationalization", "to make a company or way of working more effective, usually by combining or stopping particular activities, or by employing fewer people."),
				v("u16v7", "redundancy package", "all the payments and advantages that a company gives to workers who have lost their jobs because they are no longer needed."),
				v("u16v8", "restructuring", "to organize a company, business, or system in a new way to make it operate more effectively."),
				v("u16v9", "delocalization", "to move the location of an enterprise.")
			],
			questions: [
				q("u16q1", "Job insecurity is the fear that you might do what?", "lose your job"),
				q("u16q2", "Downsizing decreases the number of what?", "permanent employees"),
				q("u16q3", "Efficiency means using resources well without doing what?", "wasting any | wasting them"),
				q("u16q4", "A redundancy package is given to workers who have lost their jobs because they are what?", "no longer needed"),
				q("u16q5", "Delocalization means moving what?", "the location of an enterprise"),
				q("u16q6", "In the post-office case, the restructuring would save how much a year in salaries?", "€200 million | 200 million euros")
			]
		},
		{
			id: "u17",
			label: "Unit 17: International Trade",
			vocab: [
				v("u17v1", "international trade", "Purchase, sale, or exchange of goods and services across national borders."),
				v("u17v2", "free trade", "a trade policy that does not restrict imports or exports. It can also be understood as the free market idea applied to international trade."),
				v("u17v3", "protectionism", "the economic policy of restraining trade between nations, through methods such as tariffs on imported goods, restrictive quotas, and other regulations designed to discourage imports and prevent foreign take-over of local markets and companies."),
				v("u17v4", "trade barriers", "Government laws, regulations, policies or practices that either protect domestic products from foreign competition or artificially stimulate exports of particular domestic products."),
				v("u17v5", "tariff", "A duty or tax levied upon goods transported from one customs area to another. Tariffs raise the prices of imported goods, making them generally less competitive."),
				v("u17v6", "quota", "Restriction on the amount of a good that can enter or leave a country during a certain period of time."),
				v("u17v7", "absolute advantage", "Ability of a nation to produce a good more efficiently than any other nation."),
				v("u17v8", "comparative advantage", "Ability of a nation to produce a good more efficiently than it produces any other good."),
				v("u17v9", "infant industry", "a new industry, which in its early stages experiences relative difficulty or is absolutely incapable of competing with established competitors abroad."),
				v("u17v10", "strategic industry", "an industry which is essential for the promotion or stabilization of the growth of the locality in which that industry is situated.")
			],
			questions: [
				q("u17q1", "International trade is the purchase, sale, or exchange of goods and services across what?", "national borders"),
				q("u17q2", "Free trade does not restrict what?", "imports or exports"),
				q("u17q3", "A tariff raises the prices of what?", "imported goods"),
				q("u17q4", "A quota restricts the amount of a good that can enter or leave a country during what?", "a certain period of time"),
				q("u17q5", "Absolute advantage is the ability to produce a good more efficiently than whom?", "any other nation"),
				q("u17q6", "An infant industry has difficulty competing with whom?", "established competitors abroad"),
				q("u17q7", "Ha-Joon Chang compares protection of a new industry to protecting whom?", "his son | a child | his young son")
			]
		}
	];
	for (const unit of units) {
		const pack = PRACTICE[unit.id];
		if (!pack) continue;
		unit.clozes = pack.clozes;
		unit.questions = pack.questions;
		const extra = EXTRA_VOCAB[unit.id];
		if (extra?.length) unit.vocab = [...unit.vocab, ...extra];
	}
	return units;
}
function patchUnit(units, unitId, map) {
	return units.map((unit) => unit.id === unitId ? map(unit) : unit);
}
function blankRun(mode, label, items, sourceItems) {
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
		done: false
	};
}
var memory = {};
function flushStorage() {
	if (!memory.pending || typeof localStorage === "undefined") return;
	localStorage.setItem(memory.pending.name, memory.pending.value);
	memory.pending = void 0;
}
var storage = {
	getItem: (name) => {
		if (typeof localStorage === "undefined") return null;
		const raw = localStorage.getItem(name);
		if (!raw) return null;
		try {
			const parsed = JSON.parse(raw);
			if (!parsed.state) return raw;
			let changed = false;
			if (typeof parsed.state.book === "string" && parsed.state.book.length > 2e4) {
				parsed.state.book = "";
				changed = true;
			}
			if (parsed.state.bank !== "efs-17-v4") {
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
		memory.pending = {
			name,
			value
		};
		clearTimeout(memory.timer);
		memory.timer = setTimeout(flushStorage, 250);
	},
	removeItem: (name) => {
		memory.pending = void 0;
		if (typeof localStorage !== "undefined") localStorage.removeItem(name);
	}
};
if (typeof window !== "undefined") window.addEventListener("pagehide", flushStorage);
var useWorkbook = create()(persist((set, get) => ({
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
	openUnits: (id) => set({
		view: "unit",
		focusUnitId: id ?? null
	}),
	leave: (view) => set({
		run: null,
		view
	}),
	addUnit: () => {
		const unit = {
			id: crypto.randomUUID(),
			label: `Unit ${get().units.length + 1}`,
			vocab: [{
				id: crypto.randomUUID(),
				word: "",
				sentence: ""
			}],
			questions: [{
				id: crypto.randomUUID(),
				prompt: "",
				answer: ""
			}]
		};
		set({
			units: [...get().units, unit],
			source: "user"
		});
	},
	updateUnit: (unitId, label) => set({
		units: patchUnit(get().units, unitId, (unit) => ({
			...unit,
			label
		})),
		source: "user"
	}),
	removeUnit: (unitId) => {
		const units = get().units.filter((unit) => unit.id !== unitId);
		set({
			units,
			source: units.length ? "user" : "empty"
		});
	},
	moveUnit: (unitId, direction) => {
		const units = get().units.slice();
		const index = units.findIndex((unit) => unit.id === unitId);
		const next = index + direction;
		if (index < 0 || next < 0 || next >= units.length) return;
		const [row] = units.splice(index, 1);
		if (!row) return;
		units.splice(next, 0, row);
		set({
			units,
			source: "user"
		});
	},
	addVocab: (unitId) => set({
		source: "user",
		units: patchUnit(get().units, unitId, (unit) => ({
			...unit,
			vocab: [...unit.vocab, {
				id: crypto.randomUUID(),
				word: "",
				sentence: ""
			}]
		}))
	}),
	updateVocab: (unitId, vocabId, patch) => set({
		source: "user",
		units: patchUnit(get().units, unitId, (unit) => ({
			...unit,
			vocab: unit.vocab.map((vocab) => vocab.id === vocabId ? {
				...vocab,
				...patch
			} : vocab)
		}))
	}),
	removeVocab: (unitId, vocabId) => set({
		source: "user",
		units: patchUnit(get().units, unitId, (unit) => ({
			...unit,
			vocab: unit.vocab.filter((vocab) => vocab.id !== vocabId)
		}))
	}),
	addQuestion: (unitId) => set({
		source: "user",
		units: patchUnit(get().units, unitId, (unit) => ({
			...unit,
			questions: [...unit.questions, {
				id: crypto.randomUUID(),
				prompt: "",
				answer: ""
			}]
		}))
	}),
	updateQuestion: (unitId, questionId, patch) => set({
		source: "user",
		units: patchUnit(get().units, unitId, (unit) => ({
			...unit,
			questions: unit.questions.map((question) => question.id === questionId ? {
				...question,
				...patch
			} : question)
		}))
	}),
	removeQuestion: (unitId, questionId) => set({
		source: "user",
		units: patchUnit(get().units, unitId, (unit) => ({
			...unit,
			questions: unit.questions.filter((question) => question.id !== questionId)
		}))
	}),
	replaceAll: (units) => set({
		units,
		source: units.length ? "user" : "empty"
	}),
	appendUnits: (units) => set({
		units: [...get().units, ...units],
		source: "user"
	}),
	loadSample: () => set({
		units: sampleUnits(),
		source: "sample"
	}),
	clearUnits: () => set({
		units: [],
		source: "empty"
	}),
	startRun: ({ mode, label, items }) => set({
		view: "quiz",
		run: blankRun(mode, label, items, items.slice())
	}),
	setDraft: (draft) => {
		const run = get().run;
		if (!run || run.revealed || run.done) return;
		set({ run: {
			...run,
			draft
		} });
	},
	commit: (force) => {
		const run = get().run;
		if (!run || run.revealed || run.done) return false;
		const item = run.items[run.index];
		if (!item) return false;
		if (!force && !run.draft.trim()) return false;
		const ok = run.draft.trim() ? item.accept ? gradeKeywords(run.draft, item.accept) || gradeAnswer(run.draft, item.answer) : gradeAnswer(run.draft, item.answer) : false;
		set({ run: {
			...run,
			revealed: true,
			lastCorrect: ok,
			correctCount: run.correctCount + (ok ? 1 : 0),
			wrong: ok ? run.wrong : [...run.wrong, {
				item,
				input: run.draft
			}]
		} });
		return true;
	},
	next: () => {
		const run = get().run;
		if (!run || !run.revealed || run.done) return;
		const index = run.index + 1;
		if (index >= run.items.length) {
			const entry = {
				at: Date.now(),
				mode: run.mode,
				label: run.label,
				correct: run.correctCount,
				total: run.items.length
			};
			set({
				run: {
					...run,
					done: true,
					draft: ""
				},
				history: [entry, ...get().history].slice(0, 12)
			});
			return;
		}
		set({ run: {
			...run,
			index,
			draft: "",
			revealed: false,
			lastCorrect: null
		} });
	},
	retryWrong: () => {
		const run = get().run;
		if (!run || !run.wrong.length) return;
		set({ run: blankRun(run.mode, `Ôn câu sai · ${run.label}`, run.wrong.map((row) => row.item), run.wrong.map((row) => row.item)) });
	},
	retryAll: () => {
		const run = get().run;
		if (!run) return;
		set({ run: blankRun(run.mode, run.label, shuffle(run.sourceItems), run.sourceItems) });
	}
}), {
	name: "vo-unit-v1",
	skipHydration: true,
	storage: createJSONStorage(() => storage),
	partialize: (state) => ({
		units: state.units,
		source: state.source,
		history: state.history,
		book: state.book,
		bank: state.bank
	})
}));
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var variants = {
	primary: "bg-accent text-accent-fg hover:opacity-90",
	sage: "bg-sage text-sage-fg hover:opacity-90",
	line: "border border-line bg-surface text-ink hover:bg-ink-soft",
	ghost: "bg-transparent text-ink hover:bg-ink-soft",
	quiet: "bg-transparent text-muted hover:text-ink"
};
var Button = (0, import_react.forwardRef)(function Button({ variant = "primary", className, type = "button", ...props }, ref) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		ref,
		type,
		className: cn("inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-4 text-sm font-medium transition-opacity disabled:cursor-not-allowed disabled:opacity-40", variants[variant], className),
		...props
	});
});
function Editor() {
	const units = useWorkbook((state) => state.units);
	const source = useWorkbook((state) => state.source);
	const addUnit = useWorkbook((state) => state.addUnit);
	const updateUnit = useWorkbook((state) => state.updateUnit);
	const removeUnit = useWorkbook((state) => state.removeUnit);
	const moveUnit = useWorkbook((state) => state.moveUnit);
	const addVocab = useWorkbook((state) => state.addVocab);
	const updateVocab = useWorkbook((state) => state.updateVocab);
	const removeVocab = useWorkbook((state) => state.removeVocab);
	const addQuestion = useWorkbook((state) => state.addQuestion);
	const updateQuestion = useWorkbook((state) => state.updateQuestion);
	const removeQuestion = useWorkbook((state) => state.removeQuestion);
	const replaceAll = useWorkbook((state) => state.replaceAll);
	const appendUnits = useWorkbook((state) => state.appendUnits);
	const loadSample = useWorkbook((state) => state.loadSample);
	const clearUnits = useWorkbook((state) => state.clearUnits);
	const book = useWorkbook((state) => state.book);
	const setBook = useWorkbook((state) => state.setBook);
	const reference = useWorkbook((state) => state.reference);
	const setReference = useWorkbook((state) => state.setReference);
	const hydrated = useWorkbook((state) => state.hydrated);
	const [raw, setRaw] = (0, import_react.useState)("");
	const [parsed, setParsed] = (0, import_react.useState)(null);
	const [armReplace, setArmReplace] = (0, import_react.useState)(false);
	const [armClear, setArmClear] = (0, import_react.useState)(false);
	const [armSample, setArmSample] = (0, import_react.useState)(false);
	const [jsonError, setJsonError] = (0, import_react.useState)("");
	const [filtering, setFiltering] = (0, import_react.useState)(false);
	const [filterStatus, setFilterStatus] = (0, import_react.useState)("");
	const [filterError, setFilterError] = (0, import_react.useState)("");
	const [bookNote, setBookNote] = (0, import_react.useState)("");
	const [bookError, setBookError] = (0, import_react.useState)("");
	const [readingBook, setReadingBook] = (0, import_react.useState)(false);
	const [openId, setOpenId] = (0, import_react.useState)(null);
	const fileRef = (0, import_react.useRef)(null);
	const bookFileRef = (0, import_react.useRef)(null);
	const current = openId === null ? units[0]?.id ?? null : openId || null;
	(0, import_react.useEffect)(() => {
		if (!hydrated || reference.trim()) return;
		let stop = false;
		fetch("/books/english-for-business-studies.txt").then(async (response) => {
			if (!response.ok || stop) return;
			const text = (await response.text()).trim();
			if (stop || text.length < 1e3 || useWorkbook.getState().reference.trim()) return;
			setReference(text);
			setBookNote("Đã nạp English for Business Studies. Sách chỉ dùng để đối chiếu, không đổ vào ô.");
		}).catch(() => void 0);
		return () => {
			stop = true;
		};
	}, [
		hydrated,
		reference,
		setReference
	]);
	async function loadBundledBook(announce) {
		setReadingBook(true);
		setBookError("");
		try {
			const response = await fetch("/books/english-for-business-studies.txt");
			if (!response.ok) throw new Error("missing");
			const text = (await response.text()).trim();
			if (text.length < 1e3) throw new Error("short");
			setReference(text);
			setBookNote("Đã nạp English for Business Studies. Sách chỉ dùng để đối chiếu, không đổ vào ô.");
		} catch {
			if (announce) setBookError("Sách chưa đọc xong. Đợi một lát rồi bấm Nạp sách này lại.");
		} finally {
			setReadingBook(false);
		}
	}
	function preview() {
		const result = parseWorkbook(raw);
		setParsed(result);
		setArmReplace(false);
		setFilterError("");
	}
	async function filterMessy() {
		if (filtering || !raw.trim()) return;
		const plan = planChunks(raw, [reference, book].filter((part) => part.trim()).join("\n\n"));
		setFiltering(true);
		setFilterError("");
		setArmReplace(false);
		const next = [];
		const warnings = [...plan.warnings];
		let failed = "";
		try {
			for (let index = 0; index < plan.chunks.length; index += 1) {
				const chunk = plan.chunks[index];
				if (!chunk) continue;
				setFilterStatus(plan.chunks.length > 1 ? `Đang lọc ${index + 1}/${plan.chunks.length} · ${chunk.label}` : "Đang lọc…");
				const result = await organizeContent({ data: {
					notes: chunk.notes,
					book: chunk.book
				} });
				if (!result.ok) {
					failed = result.error;
					break;
				}
				warnings.push(...result.warnings.map((warning) => plan.chunks.length > 1 ? `${chunk.label}: ${warning}` : warning));
				for (const unit of result.units) next.push({
					id: uid(),
					label: unit.label || chunk.label,
					vocab: unit.vocab.map((item) => ({
						id: uid(),
						...item
					})),
					questions: unit.questions.map((item) => ({
						id: uid(),
						...item
					}))
				});
			}
		} catch {
			failed = "Không lọc được. Thử lại, hoặc dùng lọc nhanh.";
		} finally {
			setFiltering(false);
			setFilterStatus("");
		}
		if (next.length) setParsed({
			units: next,
			warnings
		});
		setFilterError(failed || (next.length ? "" : "Không tách được câu nào đúng chữ gốc."));
	}
	function commitParsed(mode) {
		if (!parsed?.units.length) return;
		if (mode === "replace") replaceAll(parsed.units);
		else appendUnits(parsed.units);
		setParsed(null);
		setRaw("");
		setArmReplace(false);
		setOpenId(null);
	}
	function download() {
		const blob = new Blob([exportBank(units)], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = "vo-unit.json";
		link.click();
		URL.revokeObjectURL(url);
	}
	async function loadBook(file) {
		if (!file || readingBook) return;
		setReadingBook(true);
		setBookError("");
		setBookNote("");
		try {
			const result = await readBookFile(file);
			if (!result.ok) {
				setBookError(result.error);
				return;
			}
			if (result.text.length > 2e4) {
				setReference(result.text);
				setBookNote(`${result.note} Không đổ hết vào ô, để trang khỏi đơ.`);
				return;
			}
			setBook(result.text);
			setBookNote(result.note);
		} catch {
			setBookError("Không đọc được PDF này. Thử file khác, hoặc dán chữ vào ô sách gốc.");
		} finally {
			setReadingBook(false);
		}
	}
	function onFile(file) {
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => {
			const result = importBank(String(reader.result ?? ""));
			if (!result.ok) {
				setJsonError(result.error);
				return;
			}
			replaceAll(result.units);
			setJsonError("");
			setOpenId(null);
		};
		reader.readAsText(file);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:py-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-medium text-accent",
					children: "Nguồn bài"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-2 font-display text-4xl leading-tight text-ink",
					children: "Nhập nội dung unit"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-muted",
					children: "Dán bài lộn xộn vào khung trên. Nếu có sách gốc, dán thêm bên dưới để đối chiếu. Lọc sẽ chỉ giữ chữ có thật trong phần bạn gửi, không viết lại."
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
				htmlFor: "paste",
				className: "text-sm font-medium text-ink",
				children: "Bài của bạn"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
				id: "paste",
				className: "field mt-2 min-h-64",
				value: raw,
				onChange: (event) => {
					setRaw(event.target.value);
					setParsed(null);
					setArmReplace(false);
					setFilterError("");
				},
				placeholder: "Dán nguyên bài, kể cả khi lộn xộn.\nUnit 1 hello\nHello, my name is Lan.\nHow are you? — I am fine."
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						htmlFor: "book",
						className: "text-sm font-medium text-ink",
						children: "Sách gốc"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "min-h-11 px-2 text-sm text-muted",
							disabled: readingBook,
							onClick: () => void loadBundledBook(true),
							children: "Nạp sách này"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "min-h-11 px-2 text-sm text-muted",
							disabled: readingBook,
							onClick: () => bookFileRef.current?.click(),
							children: readingBook ? "Đang đọc…" : "Mở PDF"
						})]
					})]
				}),
				reference.trim() ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-sage",
					children: "English for Business Studies đã nạp để đối chiếu. Ô bên dưới chỉ để thêm đoạn ngắn."
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
					id: "book",
					className: "field mt-2",
					rows: 6,
					value: book,
					onChange: (event) => {
						setBook(event.target.value);
						setBookNote("");
						setBookError("");
					},
					onDragOver: (event) => event.preventDefault(),
					onDrop: (event) => {
						event.preventDefault();
						loadBook(event.dataTransfer.files?.[0]);
					},
					placeholder: "Chỉ dán thêm đoạn ngắn nếu cần. Sách dài không được đổ vào đây."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					ref: bookFileRef,
					type: "file",
					accept: "application/pdf,.pdf,.txt,.md,.text,text/plain",
					className: "hidden",
					onChange: (event) => {
						const file = event.target.files?.[0];
						event.target.value = "";
						loadBook(file);
					}
				}),
				bookError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-accent",
					children: bookError
				}) : null,
				bookNote ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-sage",
					children: bookNote
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: "Sách gốc được giữ trên trình duyệt này để lần sau khỏi dán lại."
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-2 sm:flex-row",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					disabled: !raw.trim() || filtering,
					onClick: () => void filterMessy(),
					children: filtering ? filterStatus || "Đang lọc…" : "Lọc lại"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "line",
					disabled: !raw.trim() || filtering,
					onClick: preview,
					children: "Lọc nhanh"
				})]
			}),
			filterError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-accent",
				children: filterError
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
				className: "rounded-card border border-line bg-surface px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
					className: "min-h-11 font-medium text-ink",
					children: "Mẫu nếu bạn muốn dán sẵn thứ tự"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
					className: "mt-3 overflow-auto whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink",
					children: PASTE_TEMPLATE
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-2 sm:flex-row",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					disabled: !parsed?.units.length,
					onClick: () => commitParsed("append"),
					children: "Thêm vào sổ"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "line",
					disabled: !parsed?.units.length,
					onClick: () => {
						if (source === "user" && units.length && !armReplace) {
							setArmReplace(true);
							return;
						}
						commitParsed("replace");
					},
					children: armReplace ? "Xác nhận thay toàn bộ" : "Thay toàn bộ"
				})]
			}),
			parsed ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-card border border-line bg-surface p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
						className: "font-display text-2xl text-ink",
						children: [
							"Đọc được ",
							parsed.units.length,
							" unit, ",
							parsed.units.reduce((sum, unit) => sum + unit.vocab.length, 0),
							" từ,",
							" ",
							parsed.units.reduce((sum, unit) => sum + unit.questions.length, 0),
							" câu"
						]
					}),
					parsed.warnings.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
						className: "mt-3 flex flex-col gap-1 text-sm text-accent",
						children: [parsed.warnings.slice(0, 8).map((warning) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: warning }, warning)), parsed.warnings.length > 8 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
							"Và ",
							parsed.warnings.length - 8,
							" dòng nữa."
						] }) : null]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-sage",
						children: "Không có cảnh báo."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 flex max-h-80 flex-col gap-4 overflow-auto",
						children: parsed.units.map((unit) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewUnit, { unit }, unit.id))
					})
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "line",
						onClick: addUnit,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
							className: "size-4",
							"aria-hidden": "true"
						}), "Thêm unit"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						onClick: () => {
							if (source === "user" && units.length && !armSample) {
								setArmSample(true);
								return;
							}
							loadSample();
							setArmSample(false);
						},
						children: armSample ? "Xác nhận tải mẫu" : "Tải dữ liệu mẫu"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						disabled: !units.length,
						onClick: download,
						children: "Xuất JSON"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						onClick: () => fileRef.current?.click(),
						children: "Nhập JSON"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						ref: fileRef,
						type: "file",
						accept: "application/json,.json",
						className: "hidden",
						onChange: (event) => {
							onFile(event.target.files?.[0]);
							event.target.value = "";
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "quiet",
						disabled: !units.length,
						onClick: () => {
							if (!armClear) {
								setArmClear(true);
								return;
							}
							clearUnits();
							setArmClear(false);
							setOpenId(null);
						},
						children: armClear ? "Xác nhận xoá hết" : "Xoá hết"
					})
				]
			}),
			jsonError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-accent",
				children: jsonError
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-3",
				children: [units.map((unit, index) => {
					const stats = unitStats(unit);
					const open = current === unit.id;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "rounded-card border border-line bg-surface",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 px-3 py-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "flex min-h-11 flex-1 items-center justify-between gap-3 text-left",
									"aria-expanded": open,
									onClick: () => setOpenId(open ? "" : unit.id),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-medium text-ink",
										children: unit.label || "Unit chưa đặt tên"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "shrink-0 text-sm text-muted",
										children: [
											stats.vocab,
											" từ · ",
											stats.questions,
											" câu"
										]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "inline-flex size-11 items-center justify-center rounded-control text-muted hover:bg-ink-soft hover:text-ink disabled:opacity-40",
									"aria-label": "Đưa lên",
									disabled: index === 0,
									onClick: () => moveUnit(unit.id, -1),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronUp, { className: "size-4" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "inline-flex size-11 items-center justify-center rounded-control text-muted hover:bg-ink-soft hover:text-ink disabled:opacity-40",
									"aria-label": "Đưa xuống",
									disabled: index === units.length - 1,
									onClick: () => moveUnit(unit.id, 1),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-4" })
								})
							]
						}), open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UnitFields, {
							unit,
							onLabel: (label) => updateUnit(unit.id, label),
							onRemove: () => removeUnit(unit.id),
							onAddVocab: () => addVocab(unit.id),
							onVocab: (vocabId, patch) => updateVocab(unit.id, vocabId, patch),
							onRemoveVocab: (vocabId) => removeVocab(unit.id, vocabId),
							onAddQuestion: () => addQuestion(unit.id),
							onQuestion: (questionId, patch) => updateQuestion(unit.id, questionId, patch),
							onRemoveQuestion: (questionId) => removeQuestion(unit.id, questionId)
						}) : null]
					}, unit.id);
				}), !units.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "Sổ đang trống. Dán bài hoặc thêm unit thủ công."
				}) : null]
			})
		]
	});
}
function PreviewUnit({ unit }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
		className: "font-medium text-ink",
		children: unit.label
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
		className: "mt-1 text-sm text-muted",
		children: [unit.vocab.slice(0, 2).map((vocab) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
			lang: "en",
			children: [
				vocab.word,
				" — ",
				vocab.sentence
			]
		}, vocab.id)), unit.questions.slice(0, 2).map((question) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
			lang: "en",
			children: question.prompt
		}, question.id))]
	})] });
}
function UnitFields({ unit, onLabel, onRemove, onAddVocab, onVocab, onRemoveVocab, onAddQuestion, onQuestion, onRemoveQuestion }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-5 border-t border-line px-3 py-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block text-sm font-medium text-ink",
				children: ["Tên unit", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: "field mt-2",
					value: unit.label,
					onChange: (event) => onLabel(event.target.value)
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "font-medium text-ink",
					children: "Từ vựng"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: "Ô trái là từ học viên phải gõ, ví dụ planning. Ô phải là câu mô tả từ đó, không cần chứa sẵn từ."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 flex flex-col gap-3",
					children: unit.vocab.map((vocab) => {
						const embedded = vocab.word.trim() && vocab.sentence.trim() && maskSentence(vocab.sentence, vocab.word).hits > 0;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-2 sm:grid-cols-12",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									className: "field sm:col-span-4",
									lang: "en",
									value: vocab.word,
									placeholder: "từ tiếng Anh",
									"aria-label": "Từ tiếng Anh",
									onChange: (event) => onVocab(vocab.id, { word: event.target.value })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
									className: "field sm:col-span-7",
									lang: "en",
									rows: 2,
									value: vocab.sentence,
									placeholder: "Câu mô tả từ này",
									"aria-label": "Câu tiếng Anh",
									onChange: (event) => onVocab(vocab.id, { sentence: event.target.value })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "inline-flex min-h-11 items-center justify-center rounded-control text-muted hover:bg-ink-soft hover:text-ink sm:col-span-1",
									"aria-label": "Xoá từ",
									onClick: () => onRemoveVocab(vocab.id),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" })
								}),
								embedded ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-accent sm:col-span-12",
									children: "Câu đang chứa sẵn từ. Lúc luyện từ đó sẽ bị giấu — nên viết câu giải thích."
								}) : null
							]
						}, vocab.id);
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "ghost",
					className: "mt-3",
					onClick: onAddVocab,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
						className: "size-4",
						"aria-hidden": "true"
					}), "Thêm từ"]
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "font-medium text-ink",
					children: "Trả lời ngắn"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: "Giữ nguyên câu hỏi và đáp án. Nhiều đáp án đúng: ngăn bằng |."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 flex flex-col gap-3",
					children: unit.questions.map((question) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-2 sm:grid-cols-12",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
								className: "field sm:col-span-6",
								lang: "en",
								rows: 2,
								value: question.prompt,
								placeholder: "Câu hỏi nguyên văn",
								"aria-label": "Câu hỏi",
								onChange: (event) => onQuestion(question.id, { prompt: event.target.value })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
								className: "field sm:col-span-5",
								lang: "en",
								rows: 2,
								value: question.answer,
								placeholder: "Đáp án nguyên văn",
								"aria-label": "Đáp án",
								onChange: (event) => onQuestion(question.id, { answer: event.target.value })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "inline-flex min-h-11 items-center justify-center rounded-control text-muted hover:bg-ink-soft hover:text-ink sm:col-span-1",
								"aria-label": "Xoá câu hỏi",
								onClick: () => onRemoveQuestion(question.id),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" })
							})
						]
					}, question.id))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "ghost",
					className: "mt-3",
					onClick: onAddQuestion,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
						className: "size-4",
						"aria-hidden": "true"
					}), "Thêm câu hỏi"]
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "quiet",
				onClick: onRemove,
				children: "Xoá unit này"
			})
		]
	});
}
function Home$1() {
	const units = useWorkbook((state) => state.units);
	const source = useWorkbook((state) => state.source);
	const history = useWorkbook((state) => state.history);
	const openUnits = useWorkbook((state) => state.openUnits);
	const setView = useWorkbook((state) => state.setView);
	const replaceAll = useWorkbook((state) => state.replaceAll);
	const stats = tally(units);
	const empty = units.length === 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-6 sm:py-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "max-w-xl",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-medium text-accent",
						children: "Sổ luyện tập"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-2 font-display text-4xl leading-tight text-balance text-ink sm:text-5xl",
						children: "17 unit đã soạn sẵn."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-base text-muted",
						children: "Chọn một unit, hoặc trộn tất cả. Ba dạng: đục lỗ, đoán từ, rồi câu hỏi ngắn."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 sm:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => empty ? setView("edit") : openUnits(),
					className: "rounded-card border border-line bg-surface p-5 text-left shadow-card",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, {
							className: "size-5 text-accent",
							"aria-hidden": "true"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mt-4 block font-display text-2xl text-ink",
							children: "Theo từng unit"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mt-1 block text-sm text-muted",
							children: empty ? "Chưa có unit." : "Chọn một unit, rồi chọn Đục lỗ, Đoán từ hoặc Trả lời ngắn."
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => setView(empty ? "edit" : "mix"),
					className: "rounded-card border border-line bg-surface p-5 text-left shadow-card",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shuffle, {
							className: "size-5 text-sage",
							"aria-hidden": "true"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mt-4 block font-display text-2xl text-ink",
							children: "Trộn tất cả unit"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mt-1 block text-sm text-muted",
							children: empty ? "Chưa có unit." : "Xáo trộn câu từ cả 17 unit. Chọn một trong ba dạng rồi làm."
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "grid gap-3 lg:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: "rounded-card border border-line bg-ink-soft p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-medium text-accent",
								children: "Dạng 1 · Đục lỗ"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								lang: "en",
								className: "mt-3 font-display text-xl leading-snug text-ink",
								children: [
									"After an organization has",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "cloze-blank",
										"aria-hidden": "true",
										children: "\xA0"
									}),
									", it has to make sure that it achieves them."
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-sm text-muted",
								children: "Không có khung từ. Câu này trong sách là set objectives."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: "rounded-card border border-line bg-ink-soft p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-medium text-accent",
								children: "Dạng 2 · Đoán từ"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								lang: "en",
								className: "mt-3 font-display text-xl leading-snug text-ink",
								children: "The most senior manager responsible for the overall performance and success of a company."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-sm text-muted",
								children: "Gõ thuật ngữ. Câu này là CEO."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: "rounded-card border border-line bg-ink-soft p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-medium text-sage",
								children: "Dạng 3 · Trả lời ngắn"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								lang: "en",
								className: "mt-3 font-display text-xl leading-snug text-ink",
								children: "What are the five functions of management?"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-sm text-muted",
								children: "Viết đủ ý. Câu này cần planning, organizing, coordinating, commanding, controlling."
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-card border border-line bg-surface p-5 shadow-card",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-end justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-2xl text-ink",
							children: "Trong sổ"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted",
							children: empty ? "Chưa có unit." : `${stats.units} unit · ${stats.cloze} đục lỗ · ${stats.vocab} từ · ${stats.questions} câu hỏi ngắn`
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "line",
							onClick: () => setView("edit"),
							children: "Sửa sổ"
						})]
					}),
					source === "sample" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 rounded-control bg-clay-soft px-3 py-2 text-sm text-ink",
						children: "Đang dùng dữ liệu mẫu để thử máy."
					}) : null,
					!empty ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-4 divide-y divide-line border-t border-line",
						children: units.map((unit) => {
							const ready = unit.vocab.filter((vocab) => vocab.word.trim() && vocab.sentence.trim()).length + (unit.clozes ?? []).filter((item) => item.word.trim() && item.sentence.trim()).length + unit.questions.filter((question) => question.prompt.trim() && question.answer.trim()).length;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => openUnits(unit.id),
								className: "flex min-h-11 w-full items-center justify-between gap-3 py-3 text-left",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium text-ink",
									children: unit.label
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "shrink-0 text-sm text-muted",
									children: [ready, " câu"]
								})]
							}) }, unit.id);
						})
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4",
						children: empty ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: () => replaceAll(bookUnits()),
							children: "Tải lại 17 unit"
						}) : null
					})
				]
			}),
			history.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-2xl text-ink",
				children: "Lần làm gần đây"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-3 divide-y divide-line",
				children: history.slice(0, 5).map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex items-baseline justify-between gap-3 py-3 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-ink",
						children: entry.label
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "shrink-0 tabular-nums text-muted",
						children: [
							entry.correct,
							"/",
							entry.total,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "ml-2",
								children: new Date(entry.at).toLocaleString("vi-VN", {
									day: "2-digit",
									month: "2-digit",
									hour: "2-digit",
									minute: "2-digit"
								})
							})
						]
					})]
				}, entry.at))
			})] }) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Nội dung nằm trên trình duyệt này. Xuất file nếu bạn muốn giữ bản sao."
			})
		]
	});
}
function kindName(kind) {
	if (kind === "cloze") return "Đục lỗ";
	if (kind === "vocab") return "Đoán từ";
	return "Trả lời ngắn";
}
function Cue({ run }) {
	const item = run.items[run.index];
	if (!item) return null;
	if (item.kind === "short") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		lang: "en",
		className: "whitespace-pre-wrap font-display text-2xl leading-snug text-ink sm:text-3xl",
		children: item.prompt
	});
	if (item.kind === "cloze") {
		const target = clozeTarget(item.word, item.sentence);
		const masked = maskSentence(item.sentence, target);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted",
			children: "Điền vào chỗ gạch giữa câu. Không có khung từ."
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			lang: "en",
			className: "mt-3 whitespace-pre-wrap font-display text-2xl leading-snug text-ink sm:text-3xl",
			children: masked.parts.map((part, index) => part.blank ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "cloze-blank",
				"aria-label": "chỗ trống",
				children: "\xA0"
			}, index) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: part.text }, index))
		})] });
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-muted",
		children: "Đọc định nghĩa, gõ thuật ngữ. Câu này không có chỗ trống."
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		lang: "en",
		className: "mt-3 whitespace-pre-wrap font-display text-2xl leading-snug text-ink sm:text-3xl",
		children: cueSentence(item.sentence, item.word)
	})] });
}
function Quiz() {
	const run = useWorkbook((state) => state.run);
	const setDraft = useWorkbook((state) => state.setDraft);
	const commit = useWorkbook((state) => state.commit);
	const next = useWorkbook((state) => state.next);
	const retryWrong = useWorkbook((state) => state.retryWrong);
	const retryAll = useWorkbook((state) => state.retryAll);
	const leave = useWorkbook((state) => state.leave);
	const fieldRef = (0, import_react.useRef)(null);
	const nextRef = (0, import_react.useRef)(null);
	const [needInput, setNeedInput] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!run || run.done) return;
		window.scrollTo(0, 0);
		if (run.revealed) nextRef.current?.focus();
		else fieldRef.current?.focus();
	}, [
		run?.index,
		run?.revealed,
		run?.done
	]);
	if (!run) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-3xl px-4 py-10",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-muted",
			children: "Chưa mở bài nào."
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			className: "mt-4",
			onClick: () => leave("home"),
			children: "Về trang chủ"
		})]
	});
	if (run.done) {
		const perfect = run.correctCount === run.items.length;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:py-10",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-medium text-accent",
						children: run.label
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
						className: "mt-2 font-display text-4xl text-ink sm:text-5xl",
						children: [
							run.correctCount,
							"/",
							run.items.length
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-muted",
						children: perfect ? "Hết bài, không câu nào sai." : "Xem lại câu chưa đúng bên dưới."
					})
				] }),
				run.wrong.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "flex flex-col gap-3",
					children: run.wrong.map((row, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "rounded-card border border-line bg-surface p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm text-muted",
								children: [
									kindName(row.item.kind),
									" · ",
									row.item.unitLabel
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								lang: "en",
								className: "mt-2 whitespace-pre-wrap text-ink",
								children: row.item.kind === "short" ? row.item.prompt : row.item.sentence
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-3 text-sm text-muted",
								children: ["Bạn gõ: ", row.input.trim() || "—"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								lang: "en",
								className: "mt-1 font-medium text-ink",
								children: ["Đáp án: ", row.item.answer]
							})
						]
					}, `${row.item.id}-${index}`))
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-2 sm:flex-row",
					children: [
						run.wrong.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: retryWrong,
							children: "Làm lại câu sai"
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: run.wrong.length ? "line" : "primary",
							onClick: retryAll,
							children: "Làm lại tất cả"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							onClick: () => leave("home"),
							children: "Về trang chủ"
						})
					]
				})
			]
		});
	}
	const item = run.items[run.index];
	if (!item) return null;
	const progress = Math.round(run.index / run.items.length * 100);
	function check() {
		const ok = commit(false);
		setNeedInput(!ok);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6 sm:py-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-baseline justify-between gap-3 text-sm text-muted",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
					kindName(item.kind),
					" · ",
					item.unitLabel
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "shrink-0 tabular-nums",
					children: [
						"Câu ",
						run.index + 1,
						"/",
						run.items.length,
						" · đúng ",
						run.correctCount
					]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 h-1.5 overflow-hidden rounded-full bg-ink-soft",
				role: "progressbar",
				"aria-valuenow": run.index,
				"aria-valuemin": 0,
				"aria-valuemax": run.items.length,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-full bg-accent",
					style: { width: `${progress}%` }
				})
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-card border border-line bg-surface p-5 shadow-card sm:p-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cue, { run }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "mt-6 block text-sm font-medium text-ink",
						htmlFor: "answer",
						children: item.kind === "short" ? "Câu trả lời ngắn" : "Gõ từ tiếng Anh"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						id: "answer",
						ref: fieldRef,
						className: "field mt-2",
						lang: "en",
						rows: item.kind === "short" ? 5 : 2,
						value: run.draft,
						readOnly: run.revealed,
						spellCheck: false,
						autoCapitalize: "off",
						autoCorrect: "off",
						enterKeyHint: "done",
						placeholder: item.kind === "short" ? "Viết câu trả lời tiếng Anh" : "Ví dụ: planning",
						onChange: (event) => {
							setNeedInput(false);
							setDraft(event.target.value);
						},
						onKeyDown: (event) => {
							if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
								event.preventDefault();
								if (!run.revealed) check();
							}
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted",
						children: item.kind === "short" ? "Enter để kiểm tra. Shift+Enter để xuống dòng. Đủ ý chính là đúng, không cần trùng từng chữ." : "Enter để kiểm tra. Gõ đúng từ của chỗ trống, không phân biệt hoa thường."
					}),
					needInput ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-accent",
						children: "Gõ đáp án rồi mới kiểm tra."
					}) : null
				]
			}),
			run.revealed ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: `rounded-card px-4 py-4 ${run.lastCorrect ? "bg-sage-soft text-sage" : "bg-clay-soft text-ink"}`,
				"aria-live": "polite",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-medium",
						children: run.lastCorrect ? "Đúng." : "Chưa đúng."
					}),
					!run.lastCorrect ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-sm",
						children: ["Bạn gõ: ", run.draft.trim() || "—"]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						lang: "en",
						className: "mt-2 whitespace-pre-wrap font-display text-xl",
						children: item.answer
					})
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-col gap-2 sm:flex-row",
				children: run.revealed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					ref: nextRef,
					className: "w-full sm:w-auto",
					onClick: next,
					children: run.index + 1 >= run.items.length ? "Xem kết quả" : "Câu tiếp"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					className: "w-full sm:w-auto",
					onClick: check,
					children: "Kiểm tra"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					onClick: () => commit(true),
					children: "Xem đáp án"
				})] })
			})
		]
	});
}
var kinds = [
	{
		kind: "cloze",
		title: "Đục lỗ",
		detail: "Câu trong sách bị khoét giữa. Không đưa sẵn từ, tự điền."
	},
	{
		kind: "vocab",
		title: "Đoán từ",
		detail: "Đọc định nghĩa tiếng Anh, gõ đúng thuật ngữ."
	},
	{
		kind: "short",
		title: "Trả lời ngắn",
		detail: "Câu hỏi giữa kỳ. Viết đủ ý chính, không cần trùng từng chữ."
	}
];
function Setup({ mode }) {
	const units = useWorkbook((state) => state.units);
	const focusUnitId = useWorkbook((state) => state.focusUnitId);
	const startRun = useWorkbook((state) => state.startRun);
	const setView = useWorkbook((state) => state.setView);
	const [selected, setSelected] = (0, import_react.useState)(focusUnitId ?? units[0]?.id ?? "");
	(0, import_react.useEffect)(() => {
		if (focusUnitId) setSelected(focusUnitId);
	}, [focusUnitId]);
	(0, import_react.useEffect)(() => {
		if (mode !== "unit" || !selected) return;
		document.getElementById(`pick-${selected}`)?.scrollIntoView({ block: "nearest" });
	}, [mode, selected]);
	if (!units.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-3xl px-4 py-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-4xl text-ink",
				children: "Chưa có bài trong sổ"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-muted",
				children: "Sổ trống. Quay lại trang chủ để tải 17 unit."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				className: "mt-6",
				onClick: () => setView("home"),
				children: "Về trang chủ"
			})
		]
	});
	const ids = mode === "unit" ? [selected] : units.map((unit) => unit.id);
	const unit = units.find((item) => item.id === selected);
	const label = mode === "mix" ? "Trộn tất cả unit" : unit?.label ?? "Unit";
	function begin(kind) {
		const items = buildQuiz(collectItems(units, ids, [kind]), "all", true);
		if (!items.length) return;
		startRun({
			mode,
			label: `${label} · ${kind === "cloze" ? "Đục lỗ" : kind === "vocab" ? "Đoán từ" : "Trả lời ngắn"}`,
			items
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:py-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-medium text-accent",
					children: mode === "unit" ? "Theo từng unit" : "Trộn tất cả unit"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-2 font-display text-4xl leading-tight text-ink",
					children: mode === "unit" ? "Chọn unit, rồi chọn dạng" : "Chọn một dạng"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-muted",
					children: mode === "unit" ? "Mỗi unit có ba dạng. Chọn một dạng là làm luôn." : "Lấy câu từ cả 17 unit, xáo trộn, rồi làm một mạch."
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-3",
				children: kinds.map((choice) => {
					const count = collectItems(units, ids, [choice.kind]).length;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						disabled: !count,
						onClick: () => begin(choice.kind),
						className: "rounded-card border border-line bg-surface p-5 text-left shadow-card disabled:opacity-40",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm font-medium text-accent",
								children: mode === "mix" ? "Cả 17 unit" : label
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mt-2 block font-display text-2xl text-ink",
								children: choice.title
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mt-1 block text-sm text-muted",
								children: choice.detail
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mt-4 block text-sm font-medium text-ink",
								children: count ? `Bắt đầu · ${count} câu` : "Chưa có câu"
							})
						]
					}, choice.kind);
				})
			}),
			mode === "unit" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "flex flex-col gap-2",
				children: units.map((item) => {
					const stats = unitStats(item);
					const on = selected === item.id;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						id: `pick-${item.id}`,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							"aria-pressed": on,
							onClick: () => setSelected(item.id),
							className: `flex min-h-11 w-full items-center justify-between gap-3 rounded-card border px-4 py-3 text-left ${on ? "border-accent bg-clay-soft" : "border-line bg-surface"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-medium text-ink",
								children: item.label
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "shrink-0 text-sm text-muted",
								children: [
									stats.cloze,
									" lỗ · ",
									stats.vocab,
									" từ · ",
									stats.questions,
									" câu"
								]
							})]
						})
					}, item.id);
				})
			}) : null
		]
	});
}
function WorkbookApp() {
	const view = useWorkbook((state) => state.view);
	const setView = useWorkbook((state) => state.setView);
	const leave = useWorkbook((state) => state.leave);
	const setHydrated = useWorkbook((state) => state.setHydrated);
	const [ask, setAsk] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		Promise.resolve(useWorkbook.persist.rehydrate()).catch(() => void 0).finally(() => {
			const saved = useWorkbook.getState().book;
			if (saved.length > 2e4) useWorkbook.setState({
				book: "",
				reference: saved
			});
			setHydrated();
		});
	}, [setHydrated]);
	function go(target) {
		const state = useWorkbook.getState();
		if (state.view === "quiz" && state.run && !state.run.done && target !== "quiz") {
			setAsk(target);
			return;
		}
		setAsk(null);
		if (state.view === "quiz") leave(target);
		else setView(target);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "sticky top-0 z-10 border-b border-line bg-surface/90 backdrop-blur-md",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => go("home"),
					className: "flex min-h-11 items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "h-6 w-1 rounded-full bg-accent",
						"aria-hidden": "true"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-display text-xl text-ink",
						children: "Vở Unit"
					})]
				}), view === "quiz" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					onClick: () => go("home"),
					children: "Thoát"
				}) : view === "edit" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "line",
					onClick: () => go("home"),
					children: "Xong"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "line",
					onClick: () => go("edit"),
					children: "Sửa sổ"
				})]
			}), ask ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "border-t border-line bg-clay-soft",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex max-w-3xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-ink",
						children: "Thoát bài này? Phần đang làm sẽ không được lưu."
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "line",
							onClick: () => setAsk(null),
							children: "Ở lại"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: () => {
								const target = ask;
								setAsk(null);
								leave(target);
							},
							children: "Thoát"
						})]
					})]
				})
			}) : null]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", { children: [
			view === "home" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Home$1, {}) : null,
			view === "unit" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Setup, { mode: "unit" }) : null,
			view === "mix" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Setup, { mode: "mix" }) : null,
			view === "quiz" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quiz, {}) : null,
			view === "edit" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Editor, {}) : null
		] })]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WorkbookApp, {});
}
//#endregion
export { Home as component };
