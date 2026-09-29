//#region node_modules/.nitro/vite/services/ssr/assets/organize-plan-Co18MFu8.js
var HEADER = /^(?:#{1,6}\s*)?((?:unit|bài)\s+(\d+)\b.*)$/i;
function splitByUnit(text) {
	const lines = text.replace(/\r\n/g, "\n").split("\n");
	const parts = [];
	let current = null;
	const preamble = [];
	for (const line of lines) {
		const match = line.trim().match(HEADER);
		if (match?.[1] && match[2]) {
			if (current) parts.push({
				n: current.n,
				label: current.label,
				body: current.lines.join("\n").trim()
			});
			current = {
				n: Number(match[2]),
				label: match[1].replace(/\s+/g, " ").trim(),
				lines: [line]
			};
		} else if (current) current.lines.push(line);
		else preamble.push(line);
	}
	if (current) parts.push({
		n: current.n,
		label: current.label,
		body: current.lines.join("\n").trim()
	});
	const lead = preamble.join("\n").trim();
	if (lead && parts[0]) parts[0] = {
		...parts[0],
		body: `${lead}\n${parts[0].body}`.trim()
	};
	return parts;
}
function clip(value, max) {
	if (value.length <= max) return value;
	return value.slice(0, max);
}
function planChunks(notes, book) {
	const warnings = [];
	const noteParts = splitByUnit(notes);
	const bookParts = splitByUnit(book);
	const bookByNumber = new Map(bookParts.map((part) => [part.n, part.body]));
	if (noteParts.length > 1) {
		const chunks = noteParts.slice(0, 20).map((part) => ({
			label: part.label,
			notes: clip(part.body, 14e3),
			book: clip(bookByNumber.get(part.n) ?? "", 14e3)
		}));
		if (noteParts.length > 20) warnings.push("Chỉ lọc 20 unit đầu. Dán phần còn lại rồi lọc tiếp.");
		for (const part of noteParts.slice(0, 20)) if (book.trim() && !bookByNumber.has(part.n)) warnings.push(`${part.label}: không thấy unit này trong sách gốc.`);
		return {
			chunks,
			warnings
		};
	}
	if (notes.length + book.length <= 7e4) return {
		chunks: [{
			label: "toàn bộ",
			notes: notes.trim(),
			book: book.trim()
		}],
		warnings
	};
	warnings.push("Bài dài nên chỉ đối chiếu phần đầu. Chia theo Unit 1, Unit 2… rồi lọc lại nếu thiếu.");
	return {
		chunks: [{
			label: "phần đầu",
			notes: clip(notes.trim(), 4e4),
			book: clip(book.trim(), 4e4)
		}],
		warnings
	};
}
function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function recoverSpan(query, sources) {
	const trimmed = query.trim();
	if (!trimmed) return null;
	const tokens = trimmed.split(/\s+/).filter(Boolean).map(escapeRegExp);
	const core = tokens.join("\\s+");
	const pattern = tokens.length === 1 ? `(?<![\\p{L}\\p{N}])${core}(?![\\p{L}\\p{N}])` : core;
	let expression;
	try {
		expression = new RegExp(pattern, "iu");
	} catch {
		return null;
	}
	for (const source of sources) {
		const match = expression.exec(source);
		if (match?.[0].trim()) return match[0].trim();
	}
	return null;
}
function keepVerbatim(units, notes, book) {
	const sources = [notes, book].filter((source) => source.trim());
	const kept = [];
	let dropped = 0;
	for (const unit of units) {
		const label = recoverSpan(unit.label, sources) ?? "";
		const vocab = unit.vocab.flatMap((item) => {
			const word = recoverSpan(item.word, sources);
			const sentence = recoverSpan(item.sentence, sources);
			if (!word || !sentence) {
				dropped += 1;
				return [];
			}
			if (/[?？]\s*$/.test(word)) return [];
			return [{
				word,
				sentence
			}];
		});
		const questions = [...unit.vocab.flatMap((item) => {
			const word = recoverSpan(item.word, sources);
			const sentence = recoverSpan(item.sentence, sources);
			if (!word || !sentence || !/[?？]\s*$/.test(word)) return [];
			return [{
				prompt: word,
				answer: sentence
			}];
		}), ...unit.questions.flatMap((item) => {
			const prompt = recoverSpan(item.prompt, sources);
			const answer = recoverSpan(item.answer, sources);
			if (!prompt || !answer) {
				dropped += 1;
				return [];
			}
			return [{
				prompt,
				answer
			}];
		})];
		if (vocab.length || questions.length) kept.push({
			label: label || "Unit",
			vocab,
			questions
		});
	}
	return {
		units: kept,
		dropped
	};
}
//#endregion
export { planChunks as n, keepVerbatim as t };
