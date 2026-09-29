const MAX_BYTES = 120 * 1024 * 1024;
const MAX_CHARS = 1_500_000;

export type BookFileResult =
  | { ok: true; text: string; note: string }
  | { ok: false; error: string };

export async function readBookFile(file: File): Promise<BookFileResult> {
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "File quá nặng. Hãy tách PDF theo từng unit rồi mở lại." };
  }
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) {
    const text = (await file.text()).trim();
    if (!text) return { ok: false, error: "File không có chữ." };
    return { ok: true, text: clip(text), note: "Đã mở file chữ." };
  }

  const { extractText } = await import("unpdf");
  const data = new Uint8Array(await file.arrayBuffer());
  const result = await extractText(data, { mergePages: true });
  const raw = Array.isArray(result.text) ? result.text.join("\n") : result.text;
  const text = raw.replace(/\u0000/g, "").trim();
  const pages = result.totalPages;
  if (!text || (pages > 1 && text.length < 40)) {
    return {
      ok: false,
      error:
        "PDF này là ảnh scan, không có chữ để copy. Bấm Nạp sách này — English for Business Studies đã được đọc sẵn.",
    };
  }
  const clipped = text.length > MAX_CHARS;
  return {
    ok: true,
    text: clip(text),
    note: clipped
      ? `Đã đọc ${pages} trang, chỉ giữ phần đầu vì file quá dài.`
      : `Đã đọc ${pages} trang từ PDF.`,
  };
}

function clip(text: string) {
  return text.length > MAX_CHARS ? text.slice(0, MAX_CHARS) : text;
}
