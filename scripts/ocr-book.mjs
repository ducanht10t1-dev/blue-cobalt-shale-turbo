import { writeFileSync, appendFileSync, renameSync, mkdirSync } from "node:fs";
import { extractImages, getDocumentProxy } from "unpdf";
import { PNG } from "pngjs";
import { createWorker } from "tesseract.js";

const src = "/workspace/attachments/1 sách English for Business Studies.1 (2).pdf";
const partial = "/tmp/efs-ocr.txt";
const finalPath = "/workspace/public/books/english-for-business-studies.txt";

function rotateCW(rgb, w, h) {
  const out = new Uint8Array(w * h * 3);
  const nw = h;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const nx = h - 1 - y;
      const ny = x;
      const si = (y * w + x) * 3;
      const di = (ny * nw + nx) * 3;
      out[di] = rgb[si];
      out[di + 1] = rgb[si + 1];
      out[di + 2] = rgb[si + 2];
    }
  }
  return { data: out, width: h, height: w };
}

function rotateCCW(rgb, w, h) {
  const out = new Uint8Array(w * h * 3);
  const nw = h;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const nx = y;
      const ny = w - 1 - x;
      const si = (y * w + x) * 3;
      const di = (ny * nw + nx) * 3;
      out[di] = rgb[si];
      out[di + 1] = rgb[si + 1];
      out[di + 2] = rgb[si + 2];
    }
  }
  return { data: out, width: h, height: w };
}

function toPng(rgb, width, height) {
  const png = new PNG({ width, height });
  for (let i = 0, j = 0; i < rgb.length; i += 3, j += 4) {
    png.data[j] = rgb[i];
    png.data[j + 1] = rgb[i + 1];
    png.data[j + 2] = rgb[i + 2];
    png.data[j + 3] = 255;
  }
  return PNG.sync.write(png);
}

function tidy(text) {
  return text
    .replace(/\u0000/g, "")
    .split("\n")
    .map((line) => line.replace(/^[|¦]\s*/, "").replace(/\s*[|¦]+$/, "").replace(/[ \t]+/g, " ").trim())
    .filter((line) => /[A-Za-z]/.test(line))
    .join("\n")
    .trim();
}

const start = Number(process.argv[2] || 1);
mkdirSync("/workspace/public/books", { recursive: true });
if (start <= 1) writeFileSync(partial, "");
const bytes = new Uint8Array((await import("node:fs")).readFileSync(src));
const pdf = await getDocumentProxy(bytes);
const worker = await createWorker("eng");
console.log("pages", pdf.numPages);
for (let i = start; i <= pdf.numPages; i++) {
  const page = await pdf.getPage(i);
  const images = await extractImages(pdf, i);
  const img = images.sort((a, b) => b.width * b.height - a.width * a.height)[0];
  let body = "";
  if (img) {
    let rgb = img.data;
    let w = img.width;
    let h = img.height;
    const turn = page.rotate % 360;
    if (turn === 90) ({ data: rgb, width: w, height: h } = rotateCW(rgb, w, h));
    else if (turn === 270) ({ data: rgb, width: w, height: h } = rotateCCW(rgb, w, h));
    else if (turn === 180) {
      ({ data: rgb, width: w, height: h } = rotateCW(rgb, w, h));
      ({ data: rgb, width: w, height: h } = rotateCW(rgb, w, h));
    }
    const png = toPng(rgb, w, h);
    const { data } = await worker.recognize(png);
    body = tidy(data.text);
  }
  const sep = i === start && start <= 1 ? "" : "\n\n";
  appendFileSync(partial, sep + body + "\n");
  if (i % 10 === 0 || i === pdf.numPages) console.log("page", i, "chars", body.length);
}
await worker.terminate();
renameSync(partial, finalPath);
console.log("wrote", finalPath);
