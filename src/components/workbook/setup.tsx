import { useEffect, useState } from "react";
import { buildQuiz, collectItems, unitStats, type Kind } from "@/lib/workbook";
import { useWorkbook } from "@/lib/store";
import { Button } from "@/components/workbook/ui";

const kinds = [
  {
    kind: "cloze" as const,
    title: "Đục lỗ",
    detail: "Câu trong sách bị khoét giữa. Không đưa sẵn từ, tự điền.",
  },
  {
    kind: "vocab" as const,
    title: "Đoán từ",
    detail: "Đọc định nghĩa tiếng Anh, gõ đúng thuật ngữ.",
  },
  {
    kind: "short" as const,
    title: "Trả lời ngắn",
    detail: "Câu hỏi giữa kỳ. Viết đủ ý chính, không cần trùng từng chữ.",
  },
];

export function Setup({ mode }: { mode: "unit" | "mix" }) {
  const units = useWorkbook((state) => state.units);
  const focusUnitId = useWorkbook((state) => state.focusUnitId);
  const startRun = useWorkbook((state) => state.startRun);
  const setView = useWorkbook((state) => state.setView);
  const [selected, setSelected] = useState(focusUnitId ?? units[0]?.id ?? "");

  useEffect(() => {
    if (focusUnitId) setSelected(focusUnitId);
  }, [focusUnitId]);

  useEffect(() => {
    if (mode !== "unit" || !selected) return;
    document.getElementById(`pick-${selected}`)?.scrollIntoView({ block: "nearest" });
  }, [mode, selected]);

  if (!units.length) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="font-display text-4xl text-ink">Chưa có bài trong sổ</h1>
        <p className="mt-3 text-muted">Sổ trống. Quay lại trang chủ để tải 17 unit.</p>
        <Button className="mt-6" onClick={() => setView("home")}>
          Về trang chủ
        </Button>
      </div>
    );
  }

  const ids = mode === "unit" ? [selected] : units.map((unit) => unit.id);
  const unit = units.find((item) => item.id === selected);
  const label = mode === "mix" ? "Trộn tất cả unit" : (unit?.label ?? "Unit");

  function begin(kind: Kind) {
    const pool = collectItems(units, ids, [kind]);
    const items = buildQuiz(pool, "all", true);
    if (!items.length) return;
    const kindLabel = kind === "cloze" ? "Đục lỗ" : kind === "vocab" ? "Đoán từ" : "Trả lời ngắn";
    startRun({ mode, label: `${label} · ${kindLabel}`, items });
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:py-10">
      <div>
        <p className="text-sm font-medium text-accent">{mode === "unit" ? "Theo từng unit" : "Trộn tất cả unit"}</p>
        <h1 className="mt-2 font-display text-4xl leading-tight text-ink">
          {mode === "unit" ? "Chọn unit, rồi chọn dạng" : "Chọn một dạng"}
        </h1>
        <p className="mt-3 text-muted">
          {mode === "unit"
            ? "Mỗi unit có ba dạng. Chọn một dạng là làm luôn."
            : "Lấy câu từ cả 17 unit, xáo trộn, rồi làm một mạch."}
        </p>
      </div>

      <div className="grid gap-3">
        {kinds.map((choice) => {
          const count = collectItems(units, ids, [choice.kind]).length;
          return (
            <button
              key={choice.kind}
              type="button"
              disabled={!count}
              onClick={() => begin(choice.kind)}
              className="rounded-card border border-line bg-surface p-5 text-left shadow-card disabled:opacity-40"
            >
              <span className="text-sm font-medium text-accent">{mode === "mix" ? "Cả 17 unit" : label}</span>
              <span className="mt-2 block font-display text-2xl text-ink">{choice.title}</span>
              <span className="mt-1 block text-sm text-muted">{choice.detail}</span>
              <span className="mt-4 block text-sm font-medium text-ink">{count ? `Bắt đầu · ${count} câu` : "Chưa có câu"}</span>
            </button>
          );
        })}
      </div>

      {mode === "unit" ? (
        <ul className="flex flex-col gap-2">
          {units.map((item) => {
            const stats = unitStats(item);
            const on = selected === item.id;
            return (
              <li key={item.id} id={`pick-${item.id}`}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => setSelected(item.id)}
                  className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-card border px-4 py-3 text-left ${
                    on ? "border-accent bg-clay-soft" : "border-line bg-surface"
                  }`}
                >
                  <span className="font-medium text-ink">{item.label}</span>
                  <span className="shrink-0 text-sm text-muted">
                    {stats.cloze} lỗ · {stats.vocab} từ · {stats.questions} câu
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
