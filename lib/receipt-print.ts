import { code39Bars } from "@/components/Barcode";
import {
  LANDING_CTA,
  LANDING_ITEMS,
  LANDING_OPEN,
  LANDING_TOTALS,
} from "./landing-check";

/**
 * Prints the landing check onto a canvas, for the 3D receipt to wear.
 * Real thermal heads print on a fixed character grid, so layout is in
 * columns and lines, not CSS boxes.
 */

const COLS = 42;
const INK = "rgb(28 26 24 / 0.88)";

export type PrintStamp = {
  check: string;
  date: string;
  time: string;
  barcode: string;
};

/** A tappable line, in canvas pixels. */
export type PrintRegion = {
  id: string;
  href: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
};

export type PrintedCheck = {
  canvas: HTMLCanvasElement;
  regions: PrintRegion[];
  /** Height over width, for the paper mesh. */
  aspect: number;
  /** Reprints with a line underlined, for hover. */
  draw: (hovered: string | null) => void;
};

type Op =
  | { kind: "text"; text: string; align: "left" | "center" | "right"; bold?: boolean; faint?: boolean; double?: boolean; link?: { id: string; href: string } }
  | { kind: "split"; left: string; right: string; bold?: boolean; tall?: boolean }
  | { kind: "leader"; left: string; right: string; bold?: boolean; tall?: boolean }
  | { kind: "rule"; char: "-" | "=" }
  | { kind: "item"; qty: string; name: string; amt: string; link: { id: string; href: string } }
  | { kind: "reverse"; text: string; link: { id: string; href: string } }
  | { kind: "barcode"; value: string }
  | { kind: "gap"; lines: number };

function layout(stamp: PrintStamp): Op[] {
  const ops: Op[] = [
    { kind: "gap", lines: 0.6 },
    { kind: "text", text: "PLATE", align: "center", bold: true, double: true },
    { kind: "gap", lines: 0.4 },
    { kind: "text", text: "DIARY FOR MEALS OUT", align: "center" },
    { kind: "text", text: "PORTLAND, OR · EST. 2026", align: "center", faint: true },
    { kind: "text", text: "DATA STAYS ON THIS DEVICE", align: "center", faint: true },
    { kind: "gap", lines: 0.4 },
    { kind: "rule", char: "=" },
    { kind: "split", left: `CHK ${stamp.check}`, right: "TBL 12" },
    { kind: "split", left: "SVR YOU", right: "GST 1" },
    { kind: "split", left: stamp.date, right: stamp.time },
    { kind: "rule", char: "-" },
    { kind: "text", text: "QTY ITEM" + " ".repeat(COLS - 11) + "AMT", align: "left", faint: true },
  ];
  LANDING_ITEMS.forEach((item, i) => {
    ops.push({
      kind: "item",
      qty: "1",
      name: item.name,
      amt: "0.00",
      link: { id: `item-${i}`, href: item.href },
    });
    ops.push({ kind: "text", text: `    > ${item.mod}`, align: "left", faint: true });
  });
  ops.push({ kind: "gap", lines: 0.3 }, { kind: "rule", char: "-" });
  for (const row of LANDING_TOTALS) {
    ops.push({ kind: "leader", left: row.label, right: row.value });
  }
  ops.push(
    { kind: "rule", char: "=" },
    { kind: "leader", left: "TOTAL", right: "$0.00", bold: true, tall: true },
    { kind: "leader", left: "YOU GET", right: "YOUR TASTE, NEARBY" },
    { kind: "rule", char: "-" },
    { kind: "gap", lines: 0.5 },
    { kind: "reverse", text: LANDING_CTA.label, link: { id: "cta", href: LANDING_CTA.href } },
    { kind: "gap", lines: 0.5 },
    { kind: "text", text: LANDING_OPEN.label, align: "center", link: { id: "open", href: LANDING_OPEN.href } },
    { kind: "gap", lines: 0.3 },
    { kind: "rule", char: "-" },
    { kind: "gap", lines: 0.4 },
    { kind: "text", text: "*** THANK YOU ***", align: "center", bold: true },
    { kind: "text", text: "NO BOOKING · NO DELIVERY", align: "center", faint: true },
    { kind: "text", text: "JUST WHERE YOU ATE", align: "center", faint: true },
    { kind: "gap", lines: 0.8 },
    { kind: "barcode", value: stamp.barcode },
    { kind: "gap", lines: 0.6 },
    { kind: "text", text: "CUSTOMER COPY", align: "center", faint: true },
    { kind: "gap", lines: 2.2 },
  );
  return ops;
}

function opLines(op: Op): number {
  switch (op.kind) {
    case "gap":
      return op.lines;
    case "text":
      return op.double ? 1.9 : 1;
    case "split":
    case "leader":
      return op.tall ? 1.35 : 1;
    case "reverse":
      return 1.8;
    case "barcode":
      return 4.2;
    default:
      return 1;
  }
}

/** Mulberry32: stable grain, so a reprint on hover doesn't shimmer. */
function seeded(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Bare paper: warm gradient, coating grain, faint head-pressure banding. */
function paintPaper(width: number, height: number, tooth: number): HTMLCanvasElement {
  const paper = document.createElement("canvas");
  paper.width = width;
  paper.height = height;
  const ctx = paper.getContext("2d")!;

  const base = ctx.createLinearGradient(0, 0, width * 0.2, height);
  base.addColorStop(0, "#f8f4ec");
  base.addColorStop(0.5, "#f4efe5");
  base.addColorStop(1, "#efe8dc");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);

  const rand = seeded(7);
  // The head presses unevenly across its width: soft vertical bands.
  const banding = ctx.createLinearGradient(0, 0, width, 0);
  for (let i = 0; i <= 8; i++) {
    const shade = rand() * 2 - 1;
    banding.addColorStop(
      i / 8,
      shade > 0
        ? `rgb(255 255 255 / ${shade * 0.05})`
        : `rgb(60 48 36 / ${-shade * 0.035})`,
    );
  }
  ctx.fillStyle = banding;
  ctx.fillRect(0, 0, width, height);

  // Coating grain: one noise tile, repeated.
  const tile = document.createElement("canvas");
  tile.width = tile.height = 256;
  const tctx = tile.getContext("2d")!;
  const image = tctx.createImageData(256, 256);
  for (let i = 0; i < image.data.length; i += 4) {
    const v = rand() * 255;
    image.data[i] = image.data[i + 1] = image.data[i + 2] = v;
    image.data[i + 3] = 255;
  }
  tctx.putImageData(image, 0, 0);
  ctx.globalAlpha = 0.06;
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = ctx.createPattern(tile, "repeat")!;
  ctx.fillRect(0, 0, width, height);
  ctx.globalAlpha = 1;

  // Torn from the roll: punch the serrated top and bottom out of the alpha.
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = "#000";
  ctx.beginPath();
  for (let x = 0; x <= width; x += tooth * 2) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x + tooth, tooth);
    ctx.lineTo(x + tooth * 2, 0);
    ctx.moveTo(x, height);
    ctx.lineTo(x + tooth, height - tooth);
    ctx.lineTo(x + tooth * 2, height);
  }
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";
  return paper;
}

export function printLandingCheck(
  stamp: PrintStamp,
  fontFamily: string,
  maxSize: number,
): PrintedCheck {
  const ops = layout(stamp);
  const width = Math.min(1152, maxSize);
  const pad = Math.round(width * 0.075);
  const charW = (width - pad * 2) / COLS;
  const fontSize = charW / 0.6;
  const lineH = fontSize * 1.55;
  const tooth = Math.round(width / 80);
  const totalLines = ops.reduce((sum, op) => sum + opLines(op), 0);
  const height = Math.min(maxSize, Math.ceil(totalLines * lineH + tooth * 4));

  const paper = paintPaper(width, height, tooth);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  const font = (bold?: boolean) =>
    `${bold ? 700 : 400} ${fontSize}px ${fontFamily}`;
  const colX = (col: number) => pad + col * charW;

  // Regions depend only on layout, so measure them once.
  const regions: PrintRegion[] = [];

  function draw(hovered: string | null) {
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(paper, 0, 0);
    ctx.textBaseline = "middle";
    // Dot gain: heat bleeds a hair into the coating.
    ctx.shadowColor = "rgb(28 26 24 / 0.45)";
    ctx.shadowBlur = fontSize * 0.04;
    const measuring = regions.length === 0;

    let y = tooth * 2;
    for (const op of ops) {
      const lines = opLines(op);
      const mid = y + (lines * lineH) / 2;
      ctx.fillStyle = INK;
      ctx.globalAlpha = 1;

      if (op.kind === "text") {
        ctx.font = font(op.bold);
        ctx.globalAlpha = op.faint ? 0.72 : 1;
        const cols = op.text.length * (op.double ? 2 : 1);
        const startCol =
          op.align === "center"
            ? (COLS - cols) / 2
            : op.align === "right"
              ? COLS - cols
              : 0;
        if (op.double) {
          // ESC/POS double width and height: same glyphs, stretched.
          ctx.save();
          ctx.translate(colX(startCol), mid);
          ctx.scale(2, 1.7);
          ctx.fillText(op.text, 0, 0, op.text.length * charW);
          ctx.restore();
        } else {
          ctx.fillText(op.text, colX(startCol), mid, cols * charW);
        }
        if (op.link) {
          const box = { x0: colX(startCol), x1: colX(startCol + cols), y0: y, y1: y + lines * lineH };
          if (measuring) regions.push({ id: op.link.id, href: op.link.href, ...box });
          if (hovered === op.link.id) underline(box.x0, box.x1, mid);
        }
      } else if (op.kind === "split" || op.kind === "leader") {
        ctx.font = font(op.bold);
        const scaleY = op.tall ? 1.3 : 1;
        ctx.save();
        ctx.translate(0, mid);
        ctx.scale(1, scaleY);
        ctx.fillText(op.left, colX(0), 0);
        ctx.textAlign = "right";
        ctx.fillText(op.right, colX(COLS), 0);
        ctx.textAlign = "left";
        if (op.kind === "leader") {
          const free = COLS - op.left.length - op.right.length - 2;
          ctx.fillText(".".repeat(Math.max(0, free)), colX(op.left.length + 1), 0);
        }
        ctx.restore();
      } else if (op.kind === "rule") {
        ctx.font = font();
        ctx.globalAlpha = 0.8;
        ctx.fillText(op.char.repeat(COLS), colX(0), mid, COLS * charW);
      } else if (op.kind === "item") {
        ctx.font = font();
        ctx.fillText(op.qty, colX(0), mid);
        ctx.fillText(op.name, colX(4), mid);
        ctx.textAlign = "right";
        ctx.fillText(op.amt, colX(COLS), mid);
        ctx.textAlign = "left";
        const box = { x0: colX(0), x1: colX(COLS), y0: y, y1: y + lineH * 2 };
        if (measuring) regions.push({ id: op.link.id, href: op.link.href, ...box });
        if (hovered === op.link.id) underline(colX(4), colX(4 + op.name.length), mid);
      } else if (op.kind === "reverse") {
        // Reverse print: paper-white type out of a solid black block.
        const box = { x0: colX(0), x1: colX(COLS), y0: y, y1: y + lines * lineH };
        ctx.globalAlpha = hovered === op.link.id ? 0.78 : 1;
        ctx.fillRect(box.x0, box.y0, box.x1 - box.x0, box.y1 - box.y0);
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#f6f2ea";
        ctx.font = font(true);
        ctx.textAlign = "center";
        ctx.fillText(op.text, width / 2, mid);
        ctx.textAlign = "left";
        ctx.shadowBlur = fontSize * 0.04;
        if (measuring) regions.push({ id: op.link.id, href: op.link.href, ...box });
      } else if (op.kind === "barcode") {
        const { bars, width: units, digits } = code39Bars(op.value);
        const barsW = (width - pad * 2) * 0.8;
        const unit = barsW / units;
        const x0 = (width - barsW) / 2;
        const barH = lineH * 2.6;
        ctx.shadowBlur = 0;
        for (const bar of bars) {
          ctx.fillRect(x0 + bar.x * unit, y, bar.w * unit, barH);
        }
        ctx.shadowBlur = fontSize * 0.04;
        ctx.font = font();
        ctx.textAlign = "center";
        const spaced = digits.split("").join(" ");
        ctx.fillText(spaced, width / 2, y + barH + lineH * 0.85);
        ctx.textAlign = "left";
      }
      y += lines * lineH;
    }
    ctx.globalAlpha = 1;
  }

  function underline(x0: number, x1: number, mid: number) {
    ctx.fillRect(x0, mid + fontSize * 0.55, x1 - x0, Math.max(2, fontSize * 0.07));
  }

  draw(null);
  return { canvas, regions, aspect: height / width, draw };
}
