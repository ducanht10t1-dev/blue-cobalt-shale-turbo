import { BookOpen, Shuffle } from "lucide-react";
import { bookUnits } from "@/lib/book-units";
import { tally } from "@/lib/workbook";
import { useWorkbook } from "@/lib/store";
import { Button } from "@/components/workbook/ui";

export function Home() {
  const units = useWorkbook((state) => state.units);
  const source = useWorkbook((state) => state.source);
  const history = useWorkbook((state) => state.history);
  const openUnits = useWorkbook((state) => state.openUnits);
  const setView = useWorkbook((state) => state.setView);
  const replaceAll = useWorkbook((state) => state.replaceAll);
  const stats = tally(units);
  const empty = units.length === 0;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-6 sm:py-10">
      <div className="max-w-xl">
        <p className="text-sm font-medium text-accent">Sổ luyện tập</p>
        <h1 className="mt-2 font-display text-4xl leading-tight text-balance text-ink sm:text-5xl">
          17 unit đã soạn sẵn.
        </h1>
        <p className="mt-3 text-base text-muted">
          Chọn một unit, hoặc trộn tất cả. Ba dạng: đục lỗ, đoán từ, rồi câu hỏi ngắn.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => (empty ? setView("edit") : openUnits())}
          className="rounded-card border border-line bg-surface p-5 text-left shadow-card"
        >
          <BookOpen className="size-5 text-accent" aria-hidden="true" />
          <span className="mt-4 block font-display text-2xl text-ink">Theo từng unit</span>
          <span className="mt-1 block text-sm text-muted">
            {empty ? "Chưa có unit." : "Chọn một unit, rồi chọn Đục lỗ, Đoán từ hoặc Trả lời ngắn."}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setView(empty ? "edit" : "mix")}
          className="rounded-card border border-line bg-surface p-5 text-left shadow-card"
        >
          <Shuffle className="size-5 text-sage" aria-hidden="true" />
          <span className="mt-4 block font-display text-2xl text-ink">Trộn tất cả unit</span>
          <span className="mt-1 block text-sm text-muted">
            {empty ? "Chưa có unit." : "Xáo trộn câu từ cả 17 unit. Chọn một trong ba dạng rồi làm."}
          </span>
        </button>
      </div>

      <section className="grid gap-3 lg:grid-cols-3">
        <article className="rounded-card border border-line bg-ink-soft p-5">
          <p className="text-sm font-medium text-accent">Dạng 1 · Đục lỗ</p>
          <p lang="en" className="mt-3 font-display text-xl leading-snug text-ink">
            After an organization has
            <span className="cloze-blank" aria-hidden="true">
              &nbsp;
            </span>
            , it has to make sure that it achieves them.
          </p>
          <p className="mt-3 text-sm text-muted">Không có khung từ. Câu này trong sách là set objectives.</p>
        </article>
        <article className="rounded-card border border-line bg-ink-soft p-5">
          <p className="text-sm font-medium text-accent">Dạng 2 · Đoán từ</p>
          <p lang="en" className="mt-3 font-display text-xl leading-snug text-ink">
            The most senior manager responsible for the overall performance and success of a company.
          </p>
          <p className="mt-3 text-sm text-muted">Gõ thuật ngữ. Câu này là CEO.</p>
        </article>
        <article className="rounded-card border border-line bg-ink-soft p-5">
          <p className="text-sm font-medium text-sage">Dạng 3 · Trả lời ngắn</p>
          <p lang="en" className="mt-3 font-display text-xl leading-snug text-ink">
            What are the five functions of management?
          </p>
          <p className="mt-3 text-sm text-muted">Viết đủ ý. Câu này cần planning, organizing, coordinating, commanding, controlling.</p>
        </article>
      </section>

      <section className="rounded-card border border-line bg-surface p-5 shadow-card">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl text-ink">Trong sổ</h2>
            <p className="mt-1 text-sm text-muted">
              {empty
                ? "Chưa có unit."
                : `${stats.units} unit · ${stats.cloze} đục lỗ · ${stats.vocab} từ · ${stats.questions} câu hỏi ngắn`}
            </p>
          </div>
          <Button variant="line" onClick={() => setView("edit")}>
            Sửa sổ
          </Button>
        </div>

        {source === "sample" ? (
          <p className="mt-4 rounded-control bg-clay-soft px-3 py-2 text-sm text-ink">
            Đang dùng dữ liệu mẫu để thử máy.
          </p>
        ) : null}

        {!empty ? (
          <ul className="mt-4 divide-y divide-line border-t border-line">
            {units.map((unit) => {
              const ready =
                unit.vocab.filter((vocab) => vocab.word.trim() && vocab.sentence.trim()).length +
                (unit.clozes ?? []).filter((item) => item.word.trim() && item.sentence.trim()).length +
                unit.questions.filter((question) => question.prompt.trim() && question.answer.trim()).length;
              return (
                <li key={unit.id}>
                  <button
                    type="button"
                    onClick={() => openUnits(unit.id)}
                    className="flex min-h-11 w-full items-center justify-between gap-3 py-3 text-left"
                  >
                    <span className="font-medium text-ink">{unit.label}</span>
                    <span className="shrink-0 text-sm text-muted">{ready} câu</span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}

        <div className="mt-4">
          {empty ? (
            <Button onClick={() => replaceAll(bookUnits())}>Tải lại 17 unit</Button>
          ) : null}
        </div>
      </section>

      {history.length ? (
        <section>
          <h2 className="font-display text-2xl text-ink">Lần làm gần đây</h2>
          <ul className="mt-3 divide-y divide-line">
            {history.slice(0, 5).map((entry) => (
              <li key={entry.at} className="flex items-baseline justify-between gap-3 py-3 text-sm">
                <span className="text-ink">{entry.label}</span>
                <span className="shrink-0 tabular-nums text-muted">
                  {entry.correct}/{entry.total}
                  <span className="ml-2">
                    {new Date(entry.at).toLocaleString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="text-sm text-muted">Nội dung nằm trên trình duyệt này. Xuất file nếu bạn muốn giữ bản sao.</p>
    </div>
  );
}
