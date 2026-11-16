import jsPDF from "jspdf";
import { formatRM } from "./utils";

/**
 * Pure Code-128B Barcode Pattern Table (107 patterns) for 100% real scannable SVG/Canvas barcodes
 */
const CODE128_PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312",
  "132212", "221213", "221312", "231212", "112232", "122132", "122231", "113222",
  "123122", "123221", "223211", "221132", "221231", "213212", "223112", "312131",
  "311222", "321122", "321221", "312212", "322112", "322211", "212123", "212321",
  "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121",
  "313121", "211331", "231131", "213113", "213311", "213131", "311123", "311321",
  "331121", "312113", "312311", "332111", "314111", "221411", "431111", "111224",
  "111422", "121124", "121421", "141122", "141221", "112214", "112412", "122114",
  "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112",
  "421211", "212141", "214121", "412121", "111143", "111341", "131141", "114113",
  "114311", "411113", "411311", "113141", "114131", "311141", "411131", "211412",
  "211214", "211232", "2331112",
];

/**
 * Encodes an ASCII string into Code-128B bar widths and returns an SVG string
 */
export function generateCode128Svg(
  code: string,
  width = 160,
  height = 38
): string {
  const clean = String(code || "000000").replace(/[^\x20-\x7E]/g, "") || "000000";
  const codes: number[] = [104]; // Start Code B
  let checksum = 104;

  for (let i = 0; i < clean.length; i++) {
    const val = clean.charCodeAt(i) - 32;
    codes.push(val);
    checksum += val * (i + 1);
  }
  codes.push(checksum % 103);
  codes.push(106); // Stop pattern

  const pattern = codes.map((c) => CODE128_PATTERNS[c]).join("");
  let totalModules = 0;
  for (let i = 0; i < pattern.length; i++) {
    totalModules += Number(pattern[i]);
  }

  const quietZone = 6;
  const viewWidth = totalModules + quietZone * 2;
  let currentX = quietZone;
  let rects = "";

  for (let i = 0; i < pattern.length; i++) {
    const w = Number(pattern[i]);
    if (i % 2 === 0) {
      rects += `<rect x="${currentX}" y="0" width="${w}" height="${height}" fill="#000000" />`;
    }
    currentX += w;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewWidth} ${height}" width="${width}" height="${height}" preserveAspectRatio="none">${rects}</svg>`;
}

export interface BarcodeLabelItem {
  productCode: string;
  name: string;
  price: number | string;
  copies?: number;
}

/**
 * Prints 1 or more barcode sticker labels inline (without opening a new browser tab)
 * If only 1 label is printed, uses compact 50mm x 30mm single sticker page size.
 */
export function printBarcodeLabelsInline(items: BarcodeLabelItem[]) {
  const expanded: BarcodeLabelItem[] = [];
  for (const item of items) {
    const count = Math.max(1, Number(item.copies || 1));
    for (let i = 0; i < count; i++) {
      expanded.push(item);
    }
  }
  if (expanded.length === 0) return;

  const existingFrame = document.getElementById("pos-barcode-print-frame");
  if (existingFrame) {
    existingFrame.remove();
  }

  const iframe = document.createElement("iframe");
  iframe.id = "pos-barcode-print-frame";
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const isSingle = expanded.length === 1;

  const labelsHtml = expanded
    .map((item) => {
      const svg = generateCode128Svg(item.productCode, 145, 30);
      return `
        <div class="label-box">
          <div class="prod-name">${item.name}</div>
          <div class="barcode-wrap">${svg}</div>
          <div class="prod-code">${item.productCode}</div>
          <div class="prod-price">${formatRM(item.price)}</div>
        </div>
      `;
    })
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print Barcode Labels</title>
        <style>
          @page {
            margin: ${isSingle ? "2mm" : "5mm"};
            ${isSingle ? "size: 50mm 30mm;" : ""}
          }
          body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            color: #000;
          }
          .container {
            display: ${isSingle ? "block" : "flex"};
            flex-wrap: wrap;
            gap: 4mm;
          }
          .label-box {
            width: 46mm;
            height: 26mm;
            border: 1px dashed #94a3b8;
            border-radius: 4px;
            padding: 1.5mm 2mm;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            text-align: center;
            page-break-inside: avoid;
          }
          .prod-name {
            font-size: 7.5pt;
            font-weight: 800;
            line-height: 1.15;
            max-height: 18px;
            overflow: hidden;
            width: 100%;
            white-space: nowrap;
            text-overflow: ellipsis;
          }
          .barcode-wrap {
            width: 100%;
            display: flex;
            justify-content: center;
            margin-top: 1px;
          }
          .barcode-wrap svg {
            width: 40mm;
            height: 8.5mm;
          }
          .prod-code {
            font-family: 'Courier New', monospace;
            font-size: 6.5pt;
            font-weight: 700;
            letter-spacing: 0.5px;
          }
          .prod-price {
            font-family: 'Courier New', monospace;
            font-size: 8.5pt;
            font-weight: 900;
            background: #000;
            color: #fff;
            padding: 0.5mm 2.5mm;
            border-radius: 2px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          ${labelsHtml}
        </div>
      </body>
    </html>
  `;

  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(html);
    doc.close();
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }, 150);
  }
}

/**
 * Downloads barcode sticker(s) as a compact PDF
 */
export function downloadBarcodeLabelsPdf(items: BarcodeLabelItem[]) {
  const expanded: BarcodeLabelItem[] = [];
  for (const item of items) {
    const count = Math.max(1, Number(item.copies || 1));
    for (let i = 0; i < count; i++) {
      expanded.push(item);
    }
  }
  if (expanded.length === 0) return;

  // Compact 50mm x 30mm thermal sticker format, 1 sticker per page
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [50, 30],
  });

  expanded.forEach((item, index) => {
    if (index > 0) {
      doc.addPage([50, 30], "landscape");
    }

    // Outer border
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.2);
    doc.roundedRect(1.5, 1.5, 47, 27, 1.5, 1.5);

    // Product Name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(15, 23, 42);
    const shortName =
      item.name.length > 30 ? item.name.slice(0, 29) + "…" : item.name;
    doc.text(shortName, 25, 5.2, { align: "center" });

    // Draw Code-128 Barcode Bars directly onto PDF
    const clean =
      String(item.productCode || "000000").replace(/[^\x20-\x7E]/g, "") ||
      "000000";
    const codes: number[] = [104];
    let checksum = 104;
    for (let i = 0; i < clean.length; i++) {
      const val = clean.charCodeAt(i) - 32;
      codes.push(val);
      checksum += val * (i + 1);
    }
    codes.push(checksum % 103);
    codes.push(106);

    const pattern = codes.map((c) => CODE128_PATTERNS[c]).join("");
    let totalModules = 0;
    for (let i = 0; i < pattern.length; i++) {
      totalModules += Number(pattern[i]);
    }

    const barWidthTotal = 40; // 40mm wide
    const moduleWidth = barWidthTotal / totalModules;
    let curX = 5; // start at 5mm

    doc.setFillColor(0, 0, 0);
    for (let i = 0; i < pattern.length; i++) {
      const w = Number(pattern[i]) * moduleWidth;
      if (i % 2 === 0) {
        doc.rect(curX, 7, w, 10.5, "F");
      }
      curX += w;
    }

    // Barcode Code text
    doc.setFont("courier", "bold");
    doc.setFontSize(6.5);
    doc.text(String(item.productCode), 25, 20.5, { align: "center" });

    // Price Badge
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(11, 22, 28, 5, 1, 1, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("courier", "bold");
    doc.setFontSize(8);
    doc.text(formatRM(item.price), 25, 25.5, { align: "center" });
  });

  const fileName =
    expanded.length === 1
      ? `Barcode-${expanded[0].productCode}.pdf`
      : `Barcodes-Bulk-${expanded.length}-Items.pdf`;
  doc.save(fileName);
}
