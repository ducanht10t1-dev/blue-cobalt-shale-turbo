import { useEffect, useRef, useState } from "react";
import { clozeTarget, cueSentence, maskSentence, type Kind } from "@/lib/workbook";
import { useWorkbook, type Run } from "@/lib/store";
import { Button } from "@/components/workbook/ui";

function kindName(kind: Kind) {
  if (kind === "cloze") return "Đục lỗ";
  if (kind === "vocab") return "Đoán từ";
  return "Trả lời ngắn";
}

function Cue({ run }: { run: Run }) {
  const item = run.items[run.index];
  if (!item) return null;
  if (item.kind === "short") {
    return (
      <p lang="en" className="whitespace-pre-wrap font-display text-2xl leading-snug text-ink sm:text-3xl">
        {item.prompt}
      </p>
    );
  }
  if (item.kind === "cloze") {
    const target = clozeTarget(item.word, item.sentence);
    const masked = maskSentence(item.sentence, target);
    return (
      <div>
        <p className="text-sm text-muted">Điền vào chỗ gạch giữa câu. Không có khung từ.</p>
        <p lang="en" className="mt-3 whitespace-pre-wrap font-display text-2xl leading-snug text-ink sm:text-3xl">
          {masked.parts.map((part, index) =>
            part.blank ? (
              <span key={index} className="cloze-blank" aria-label="chỗ trống">
                {"\u00a0"}
              </span>
            ) : (
              <span key={index}>{part.text}</span>
            ),
          )}
        </p>
      </div>
    );
  }
  return (
    <div>
      <p className="text-sm text-muted">Đọc định nghĩa, gõ thuật ngữ. Câu này không có chỗ trống.</p>
      <p lang="en" className="mt-3 whitespace-pre-wrap font-display text-2xl leading-snug text-ink sm:text-3xl">
        {cueSentence(item.sentence, item.word)}
      </p>
    </div>
  );
}

export function Quiz() {
  const run = useWorkbook((state) => state.run);
  const setDraft = useWorkbook((state) => state.setDraft);
  const commit = useWorkbook((state) => state.commit);
  const next = useWorkbook((state) => state.next);
  const retryWrong = useWorkbook((state) => state.retryWrong);
  const retryAll = useWorkbook((state) => state.retryAll);
  const leave = useWorkbook((state) => state.leave);
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const [needInput, setNeedInput] = useState(false);

  useEffect(() => {
    if (!run || run.done) return;
    window.scrollTo(0, 0);
    if (run.revealed) nextRef.current?.focus();
    else fieldRef.current?.focus();
  }, [run?.index, run?.revealed, run?.done]);

  if (!run) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-muted">Chưa mở bài nào.</p>
        <Button className="mt-4" onClick={() => leave("home")}>
          Về trang chủ
        </Button>
      </div>
    );
  }

  if (run.done) {
    const perfect = run.correctCount === run.items.length;
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:py-10">
        <div>
          <p className="text-sm font-medium text-accent">{run.label}</p>
          <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">
            {run.correctCount}/{run.items.length}
          </h1>
          <p className="mt-2 text-muted">{perfect ? "Hết bài, không câu nào sai." : "Xem lại câu chưa đúng bên dưới."}</p>
        </div>
        {run.wrong.length ? (
          <ul className="flex flex-col gap-3">
            {run.wrong.map((row, index) => (
              <li key={`${row.item.id}-${index}`} className="rounded-card border border-line bg-surface p-4">
                <p className="text-sm text-muted">
                  {kindName(row.item.kind)} · {row.item.unitLabel}
                </p>
                <p lang="en" className="mt-2 whitespace-pre-wrap text-ink">
                  {row.item.kind === "short" ? row.item.prompt : row.item.sentence}
                </p>
                <p className="mt-3 text-sm text-muted">Bạn gõ: {row.input.trim() || "—"}</p>
                <p lang="en" className="mt-1 font-medium text-ink">
                  Đáp án: {row.item.answer}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row">
          {run.wrong.length ? (
            <Button onClick={retryWrong}>Làm lại câu sai</Button>
          ) : null}
          <Button variant={run.wrong.length ? "line" : "primary"} onClick={retryAll}>
            Làm lại tất cả
          </Button>
          <Button variant="ghost" onClick={() => leave("home")}>
            Về trang chủ
          </Button>
        </div>
      </div>
    );
  }

  const item = run.items[run.index];
  if (!item) return null;
  const progress = Math.round((run.index / run.items.length) * 100);

  function check() {
    const ok = commit(false);
    setNeedInput(!ok);
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6 sm:py-10">
      <div>
        <div className="flex items-baseline justify-between gap-3 text-sm text-muted">
          <p>
            {kindName(item.kind)} · {item.unitLabel}
          </p>
          <p className="shrink-0 tabular-nums">
            Câu {run.index + 1}/{run.items.length} · đúng {run.correctCount}
          </p>
        </div>
        <div
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-soft"
          role="progressbar"
          aria-valuenow={run.index}
          aria-valuemin={0}
          aria-valuemax={run.items.length}
        >
          <div className="h-full bg-accent" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="rounded-card border border-line bg-surface p-5 shadow-card sm:p-6">
        <Cue run={run} />
        <label className="mt-6 block text-sm font-medium text-ink" htmlFor="answer">
          {item.kind === "short" ? "Câu trả lời ngắn" : "Gõ từ tiếng Anh"}
        </label>
        <textarea
          id="answer"
          ref={fieldRef}
          className="field mt-2"
          lang="en"
          rows={item.kind === "short" ? 5 : 2}
          value={run.draft}
          readOnly={run.revealed}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          enterKeyHint="done"
          placeholder={item.kind === "short" ? "Viết câu trả lời tiếng Anh" : "Ví dụ: planning"}
          onChange={(event) => {
            setNeedInput(false);
            setDraft(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              if (!run.revealed) check();
            }
          }}
        />
        <p className="mt-2 text-sm text-muted">
          {item.kind === "short"
            ? "Enter để kiểm tra. Shift+Enter để xuống dòng. Đủ ý chính là đúng, không cần trùng từng chữ."
            : "Enter để kiểm tra. Gõ đúng từ của chỗ trống, không phân biệt hoa thường."}
        </p>
        {needInput ? <p className="mt-2 text-sm text-accent">Gõ đáp án rồi mới kiểm tra.</p> : null}
      </div>

      {run.revealed ? (
        <div
          className={`rounded-card px-4 py-4 ${run.lastCorrect ? "bg-sage-soft text-sage" : "bg-clay-soft text-ink"}`}
          aria-live="polite"
        >
          <p className="font-medium">{run.lastCorrect ? "Đúng." : "Chưa đúng."}</p>
          {!run.lastCorrect ? <p className="mt-1 text-sm">Bạn gõ: {run.draft.trim() || "—"}</p> : null}
          <p lang="en" className="mt-2 whitespace-pre-wrap font-display text-xl">
            {item.answer}
          </p>
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        {run.revealed ? (
          <Button ref={nextRef} className="w-full sm:w-auto" onClick={next}>
            {run.index + 1 >= run.items.length ? "Xem kết quả" : "Câu tiếp"}
          </Button>
        ) : (
          <>
            <Button className="w-full sm:w-auto" onClick={check}>
              Kiểm tra
            </Button>
            <Button variant="ghost" onClick={() => commit(true)}>
              Xem đáp án
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
