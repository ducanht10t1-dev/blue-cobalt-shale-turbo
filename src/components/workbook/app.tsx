import { useEffect, useState } from "react";
import { Editor } from "@/components/workbook/editor";
import { Home } from "@/components/workbook/home";
import { Quiz } from "@/components/workbook/quiz";
import { Setup } from "@/components/workbook/setup";
import { useWorkbook, type View } from "@/lib/store";
import { Button } from "@/components/workbook/ui";

export function WorkbookApp() {
  const view = useWorkbook((state) => state.view);
  const setView = useWorkbook((state) => state.setView);
  const leave = useWorkbook((state) => state.leave);
  const setHydrated = useWorkbook((state) => state.setHydrated);
  const [ask, setAsk] = useState<View | null>(null);

  useEffect(() => {
    void Promise.resolve(useWorkbook.persist.rehydrate())
      .catch(() => undefined)
      .finally(() => {
        const saved = useWorkbook.getState().book;
        if (saved.length > 20_000) useWorkbook.setState({ book: "", reference: saved });
        setHydrated();
      });
  }, [setHydrated]);

  function go(target: View) {
    const state = useWorkbook.getState();
    const blocking = state.view === "quiz" && state.run && !state.run.done;
    if (blocking && target !== "quiz") {
      setAsk(target);
      return;
    }
    setAsk(null);
    if (state.view === "quiz") leave(target);
    else setView(target);
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-line bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <button type="button" onClick={() => go("home")} className="flex min-h-11 items-center gap-2">
            <span className="h-6 w-1 rounded-full bg-accent" aria-hidden="true" />
            <span className="font-display text-xl text-ink">Vở Unit</span>
          </button>
          {view === "quiz" ? (
            <Button variant="ghost" onClick={() => go("home")}>
              Thoát
            </Button>
          ) : view === "edit" ? (
            <Button variant="line" onClick={() => go("home")}>
              Xong
            </Button>
          ) : (
            <Button variant="line" onClick={() => go("edit")}>
              Sửa sổ
            </Button>
          )}
        </div>
        {ask ? (
          <div className="border-t border-line bg-clay-soft">
            <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-ink">Thoát bài này? Phần đang làm sẽ không được lưu.</p>
              <div className="flex gap-2">
                <Button variant="line" onClick={() => setAsk(null)}>
                  Ở lại
                </Button>
                <Button
                  onClick={() => {
                    const target = ask;
                    setAsk(null);
                    leave(target);
                  }}
                >
                  Thoát
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </header>
      <main>
        {view === "home" ? <Home /> : null}
        {view === "unit" ? <Setup mode="unit" /> : null}
        {view === "mix" ? <Setup mode="mix" /> : null}
        {view === "quiz" ? <Quiz /> : null}
        {view === "edit" ? <Editor /> : null}
      </main>
    </div>
  );
}
