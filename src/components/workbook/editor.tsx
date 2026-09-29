import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { organizeContent } from "@/lib/organize";
import { readBookFile } from "@/lib/read-book-file";
import { planChunks } from "@/lib/organize-plan";
import {
  exportBank,
  importBank,
  maskSentence,
  parseWorkbook,
  PASTE_TEMPLATE,
  uid,
  unitStats,
  type ParseResult,
  type Unit,
} from "@/lib/workbook";
import { useWorkbook } from "@/lib/store";
import { Button } from "@/components/workbook/ui";

export function Editor() {
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

  const [raw, setRaw] = useState("");
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [armReplace, setArmReplace] = useState(false);
  const [armClear, setArmClear] = useState(false);
  const [armSample, setArmSample] = useState(false);
  const [jsonError, setJsonError] = useState("");
  const [filtering, setFiltering] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterError, setFilterError] = useState("");
  const [bookNote, setBookNote] = useState("");
  const [bookError, setBookError] = useState("");
  const [readingBook, setReadingBook] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const bookFileRef = useRef<HTMLInputElement>(null);
  const current = openId === null ? (units[0]?.id ?? null) : openId || null;

  useEffect(() => {
    if (!hydrated || reference.trim()) return;
    let stop = false;
    void fetch("/books/english-for-business-studies.txt")
      .then(async (response) => {
        if (!response.ok || stop) return;
        const text = (await response.text()).trim();
        if (stop || text.length < 1000 || useWorkbook.getState().reference.trim()) return;
        setReference(text);
        setBookNote("Đã nạp English for Business Studies. Sách chỉ dùng để đối chiếu, không đổ vào ô.");
      })
      .catch(() => undefined);
    return () => {
      stop = true;
    };
  }, [hydrated, reference, setReference]);

  async function loadBundledBook(announce: boolean) {
    setReadingBook(true);
    setBookError("");
    try {
      const response = await fetch("/books/english-for-business-studies.txt");
      if (!response.ok) throw new Error("missing");
      const text = (await response.text()).trim();
      if (text.length < 1000) throw new Error("short");
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
    const next: Unit[] = [];
    const warnings = [...plan.warnings];
    let failed = "";
    try {
      for (let index = 0; index < plan.chunks.length; index += 1) {
        const chunk = plan.chunks[index];
        if (!chunk) continue;
        setFilterStatus(
          plan.chunks.length > 1 ? `Đang lọc ${index + 1}/${plan.chunks.length} · ${chunk.label}` : "Đang lọc…",
        );
        const result = await organizeContent({ data: { notes: chunk.notes, book: chunk.book } });
        if (!result.ok) {
          failed = result.error;
          break;
        }
        warnings.push(...result.warnings.map((warning) => (plan.chunks.length > 1 ? `${chunk.label}: ${warning}` : warning)));
        for (const unit of result.units) {
          next.push({
            id: uid(),
            label: unit.label || chunk.label,
            vocab: unit.vocab.map((item) => ({ id: uid(), ...item })),
            questions: unit.questions.map((item) => ({ id: uid(), ...item })),
          });
        }
      }
    } catch {
      failed = "Không lọc được. Thử lại, hoặc dùng lọc nhanh.";
    } finally {
      setFiltering(false);
      setFilterStatus("");
    }
    if (next.length) setParsed({ units: next, warnings });
    setFilterError(failed || (next.length ? "" : "Không tách được câu nào đúng chữ gốc."));
  }

  function commitParsed(mode: "append" | "replace") {
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

  async function loadBook(file: File | undefined) {
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
      if (result.text.length > 20_000) {
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

  function onFile(file: File | undefined) {
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

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:py-10">
      <div>
        <p className="text-sm font-medium text-accent">Nguồn bài</p>
        <h1 className="mt-2 font-display text-4xl leading-tight text-ink">Nhập nội dung unit</h1>
        <p className="mt-3 text-muted">
          Dán bài lộn xộn vào khung trên. Nếu có sách gốc, dán thêm bên dưới để đối chiếu. Lọc sẽ chỉ giữ chữ có thật trong phần bạn gửi, không viết lại.
        </p>
      </div>

      <div>
        <label htmlFor="paste" className="text-sm font-medium text-ink">
          Bài của bạn
        </label>
        <textarea
          id="paste"
          className="field mt-2 min-h-64"
          value={raw}
          onChange={(event) => {
            setRaw(event.target.value);
            setParsed(null);
            setArmReplace(false);
            setFilterError("");
          }}
          placeholder={"Dán nguyên bài, kể cả khi lộn xộn.\nUnit 1 hello\nHello, my name is Lan.\nHow are you? — I am fine."}
        />
      </div>

      <div>
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="book" className="text-sm font-medium text-ink">
            Sách gốc
          </label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="min-h-11 px-2 text-sm text-muted"
              disabled={readingBook}
              onClick={() => void loadBundledBook(true)}
            >
              Nạp sách này
            </button>
            <button
              type="button"
              className="min-h-11 px-2 text-sm text-muted"
              disabled={readingBook}
              onClick={() => bookFileRef.current?.click()}
            >
              {readingBook ? "Đang đọc…" : "Mở PDF"}
            </button>
          </div>
        </div>
        {reference.trim() ? (
          <p className="mt-2 text-sm text-sage">
            English for Business Studies đã nạp để đối chiếu. Ô bên dưới chỉ để thêm đoạn ngắn.
          </p>
        ) : null}
        <textarea
          id="book"
          className="field mt-2"
          rows={6}
          value={book}
          onChange={(event) => {
            setBook(event.target.value);
            setBookNote("");
            setBookError("");
          }}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            void loadBook(event.dataTransfer.files?.[0]);
          }}
          placeholder="Chỉ dán thêm đoạn ngắn nếu cần. Sách dài không được đổ vào đây."
        />
        <input
          ref={bookFileRef}
          type="file"
          accept="application/pdf,.pdf,.txt,.md,.text,text/plain"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            void loadBook(file);
          }}
        />
        {bookError ? <p className="mt-2 text-sm text-accent">{bookError}</p> : null}
        {bookNote ? <p className="mt-2 text-sm text-sage">{bookNote}</p> : null}
        <p className="mt-2 text-sm text-muted">Sách gốc được giữ trên trình duyệt này để lần sau khỏi dán lại.</p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button disabled={!raw.trim() || filtering} onClick={() => void filterMessy()}>
          {filtering ? filterStatus || "Đang lọc…" : "Lọc lại"}
        </Button>
        <Button variant="line" disabled={!raw.trim() || filtering} onClick={preview}>
          Lọc nhanh
        </Button>
      </div>
      {filterError ? <p className="text-sm text-accent">{filterError}</p> : null}

      <details className="rounded-card border border-line bg-surface px-4 py-3">
        <summary className="min-h-11 font-medium text-ink">Mẫu nếu bạn muốn dán sẵn thứ tự</summary>
        <pre className="mt-3 overflow-auto whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink">{PASTE_TEMPLATE}</pre>
      </details>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button disabled={!parsed?.units.length} onClick={() => commitParsed("append")}>
          Thêm vào sổ
        </Button>
        <Button
          variant="line"
          disabled={!parsed?.units.length}
          onClick={() => {
            if (source === "user" && units.length && !armReplace) {
              setArmReplace(true);
              return;
            }
            commitParsed("replace");
          }}
        >
          {armReplace ? "Xác nhận thay toàn bộ" : "Thay toàn bộ"}
        </Button>
      </div>

      {parsed ? (
        <section className="rounded-card border border-line bg-surface p-4">
          <h2 className="font-display text-2xl text-ink">
            Đọc được {parsed.units.length} unit, {parsed.units.reduce((sum, unit) => sum + unit.vocab.length, 0)} từ,{" "}
            {parsed.units.reduce((sum, unit) => sum + unit.questions.length, 0)} câu
          </h2>
          {parsed.warnings.length ? (
            <ul className="mt-3 flex flex-col gap-1 text-sm text-accent">
              {parsed.warnings.slice(0, 8).map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
              {parsed.warnings.length > 8 ? <li>Và {parsed.warnings.length - 8} dòng nữa.</li> : null}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-sage">Không có cảnh báo.</p>
          )}
          <div className="mt-4 flex max-h-80 flex-col gap-4 overflow-auto">
            {parsed.units.map((unit) => (
              <PreviewUnit key={unit.id} unit={unit} />
            ))}
          </div>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button variant="line" onClick={addUnit}>
          <Plus className="size-4" aria-hidden="true" />
          Thêm unit
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            if (source === "user" && units.length && !armSample) {
              setArmSample(true);
              return;
            }
            loadSample();
            setArmSample(false);
          }}
        >
          {armSample ? "Xác nhận tải mẫu" : "Tải dữ liệu mẫu"}
        </Button>
        <Button variant="ghost" disabled={!units.length} onClick={download}>
          Xuất JSON
        </Button>
        <Button variant="ghost" onClick={() => fileRef.current?.click()}>
          Nhập JSON
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            onFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        <Button
          variant="quiet"
          disabled={!units.length}
          onClick={() => {
            if (!armClear) {
              setArmClear(true);
              return;
            }
            clearUnits();
            setArmClear(false);
            setOpenId(null);
          }}
        >
          {armClear ? "Xác nhận xoá hết" : "Xoá hết"}
        </Button>
      </div>
      {jsonError ? <p className="text-sm text-accent">{jsonError}</p> : null}

      <div className="flex flex-col gap-3">
        {units.map((unit, index) => {
          const stats = unitStats(unit);
          const open = current === unit.id;
          return (
            <section key={unit.id} className="rounded-card border border-line bg-surface">
              <div className="flex items-center gap-2 px-3 py-2">
                <button
                  type="button"
                  className="flex min-h-11 flex-1 items-center justify-between gap-3 text-left"
                  aria-expanded={open}
                  onClick={() => setOpenId(open ? "" : unit.id)}
                >
                  <span className="font-medium text-ink">{unit.label || "Unit chưa đặt tên"}</span>
                  <span className="shrink-0 text-sm text-muted">
                    {stats.vocab} từ · {stats.questions} câu
                  </span>
                </button>
                <button
                  type="button"
                  className="inline-flex size-11 items-center justify-center rounded-control text-muted hover:bg-ink-soft hover:text-ink disabled:opacity-40"
                  aria-label="Đưa lên"
                  disabled={index === 0}
                  onClick={() => moveUnit(unit.id, -1)}
                >
                  <ChevronUp className="size-4" />
                </button>
                <button
                  type="button"
                  className="inline-flex size-11 items-center justify-center rounded-control text-muted hover:bg-ink-soft hover:text-ink disabled:opacity-40"
                  aria-label="Đưa xuống"
                  disabled={index === units.length - 1}
                  onClick={() => moveUnit(unit.id, 1)}
                >
                  <ChevronDown className="size-4" />
                </button>
              </div>
              {open ? (
                <UnitFields
                  unit={unit}
                  onLabel={(label) => updateUnit(unit.id, label)}
                  onRemove={() => removeUnit(unit.id)}
                  onAddVocab={() => addVocab(unit.id)}
                  onVocab={(vocabId, patch) => updateVocab(unit.id, vocabId, patch)}
                  onRemoveVocab={(vocabId) => removeVocab(unit.id, vocabId)}
                  onAddQuestion={() => addQuestion(unit.id)}
                  onQuestion={(questionId, patch) => updateQuestion(unit.id, questionId, patch)}
                  onRemoveQuestion={(questionId) => removeQuestion(unit.id, questionId)}
                />
              ) : null}
            </section>
          );
        })}
        {!units.length ? <p className="text-sm text-muted">Sổ đang trống. Dán bài hoặc thêm unit thủ công.</p> : null}
      </div>
    </div>
  );
}

function PreviewUnit({ unit }: { unit: Unit }) {
  return (
    <div>
      <h3 className="font-medium text-ink">{unit.label}</h3>
      <ul className="mt-1 text-sm text-muted">
        {unit.vocab.slice(0, 2).map((vocab) => (
          <li key={vocab.id} lang="en">
            {vocab.word} — {vocab.sentence}
          </li>
        ))}
        {unit.questions.slice(0, 2).map((question) => (
          <li key={question.id} lang="en">
            {question.prompt}
          </li>
        ))}
      </ul>
    </div>
  );
}

function UnitFields({
  unit,
  onLabel,
  onRemove,
  onAddVocab,
  onVocab,
  onRemoveVocab,
  onAddQuestion,
  onQuestion,
  onRemoveQuestion,
}: {
  unit: Unit;
  onLabel: (label: string) => void;
  onRemove: () => void;
  onAddVocab: () => void;
  onVocab: (vocabId: string, patch: { word?: string; sentence?: string }) => void;
  onRemoveVocab: (vocabId: string) => void;
  onAddQuestion: () => void;
  onQuestion: (questionId: string, patch: { prompt?: string; answer?: string }) => void;
  onRemoveQuestion: (questionId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-5 border-t border-line px-3 py-4">
      <label className="block text-sm font-medium text-ink">
        Tên unit
        <input className="field mt-2" value={unit.label} onChange={(event) => onLabel(event.target.value)} />
      </label>

      <div>
        <h3 className="font-medium text-ink">Từ vựng</h3>
        <p className="mt-1 text-sm text-muted">
          Ô trái là từ học viên phải gõ, ví dụ planning. Ô phải là câu mô tả từ đó, không cần chứa sẵn từ.
        </p>
        <div className="mt-3 flex flex-col gap-3">
          {unit.vocab.map((vocab) => {
            const embedded =
              vocab.word.trim() && vocab.sentence.trim() && maskSentence(vocab.sentence, vocab.word).hits > 0;
            return (
              <div key={vocab.id} className="grid gap-2 sm:grid-cols-12">
                <input
                  className="field sm:col-span-4"
                  lang="en"
                  value={vocab.word}
                  placeholder="từ tiếng Anh"
                  aria-label="Từ tiếng Anh"
                  onChange={(event) => onVocab(vocab.id, { word: event.target.value })}
                />
                <textarea
                  className="field sm:col-span-7"
                  lang="en"
                  rows={2}
                  value={vocab.sentence}
                  placeholder="Câu mô tả từ này"
                  aria-label="Câu tiếng Anh"
                  onChange={(event) => onVocab(vocab.id, { sentence: event.target.value })}
                />
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center justify-center rounded-control text-muted hover:bg-ink-soft hover:text-ink sm:col-span-1"
                  aria-label="Xoá từ"
                  onClick={() => onRemoveVocab(vocab.id)}
                >
                  <Trash2 className="size-4" />
                </button>
                {embedded ? (
                  <p className="text-sm text-accent sm:col-span-12">
                    Câu đang chứa sẵn từ. Lúc luyện từ đó sẽ bị giấu — nên viết câu giải thích.
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
        <Button variant="ghost" className="mt-3" onClick={onAddVocab}>
          <Plus className="size-4" aria-hidden="true" />
          Thêm từ
        </Button>
      </div>

      <div>
        <h3 className="font-medium text-ink">Trả lời ngắn</h3>
        <p className="mt-1 text-sm text-muted">Giữ nguyên câu hỏi và đáp án. Nhiều đáp án đúng: ngăn bằng |.</p>
        <div className="mt-3 flex flex-col gap-3">
          {unit.questions.map((question) => (
            <div key={question.id} className="grid gap-2 sm:grid-cols-12">
              <textarea
                className="field sm:col-span-6"
                lang="en"
                rows={2}
                value={question.prompt}
                placeholder="Câu hỏi nguyên văn"
                aria-label="Câu hỏi"
                onChange={(event) => onQuestion(question.id, { prompt: event.target.value })}
              />
              <textarea
                className="field sm:col-span-5"
                lang="en"
                rows={2}
                value={question.answer}
                placeholder="Đáp án nguyên văn"
                aria-label="Đáp án"
                onChange={(event) => onQuestion(question.id, { answer: event.target.value })}
              />
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center rounded-control text-muted hover:bg-ink-soft hover:text-ink sm:col-span-1"
                aria-label="Xoá câu hỏi"
                onClick={() => onRemoveQuestion(question.id)}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
        <Button variant="ghost" className="mt-3" onClick={onAddQuestion}>
          <Plus className="size-4" aria-hidden="true" />
          Thêm câu hỏi
        </Button>
      </div>

      <Button variant="quiet" onClick={onRemove}>
        Xoá unit này
      </Button>
    </div>
  );
}
