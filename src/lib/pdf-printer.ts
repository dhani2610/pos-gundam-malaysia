import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatRM, formatDateTime } from "./utils";
import { WebsiteSettingsData } from "@/store/use-app-store";

export function formatPaymentBreakdownText(tx: any): string {
  const method = String(tx.paymentMethod || "cash").toLowerCase();
  if (method === "split") {
    return `Cash: ${formatRM(tx.cashAmount)} | Transfer: ${formatRM(tx.transferAmount)}${tx.bankAccountInfo ? ` (${tx.bankAccountInfo})` : ""}`;
  }
  if (method === "qr_pay") {
    return `QR Pay: ${formatRM(tx.transferAmount || tx.netTotal)}${tx.bankAccountInfo ? ` (${tx.bankAccountInfo})` : ""}`;
  }
  if (method === "transfer") {
    return `Transfer: ${formatRM(tx.transferAmount)}${tx.bankAccountInfo ? ` (${tx.bankAccountInfo})` : ""}`;
  }
  return `Cash Paid: ${formatRM(tx.cashAmount)} | Change: ${formatRM(tx.changeAmount)}`;
}

/**
 * Prints the receipt directly inside the current page using a hidden iframe (NO new tab!)
 */
export function printReceiptInline(
  tx: any,
  settings: WebsiteSettingsData | null
) {
  const existingFrame = document.getElementById("pos-receipt-print-frame");
  if (existingFrame) {
    existingFrame.remove();
  }

  const iframe = document.createElement("iframe");
  iframe.id = "pos-receipt-print-frame";
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const siteName = settings?.siteName || tx.branchName || "GUNDAM BASE POS";
  const address =
    settings?.address ||
    tx.branchAddress ||
    "Level 4, Bukit Bintang Plaza, Kuala Lumpur";
  const phone = settings?.phone || tx.branchPhone || "+60 3-2148 8899";
  const footer =
    settings?.receiptFooter ||
    "Thank you for shopping at Gundam Base! Gunpla is Freedom.";

  const itemsHtml = (tx.items || [])
    .map(
      (item: any) => `
      <tr>
        <td style="padding: 4px 0; border-bottom: 1px dashed #ddd;">
          <div style="font-weight: 700; font-size: 12px;">${item.productName}</div>
          <div style="font-size: 11px; color: #444;">
            ${item.qty} x ${formatRM(item.customPrice)}
            ${Number(item.discountAmount) > 0 ? ` (Disc: -${formatRM(item.discountAmount)})` : ""}
          </div>
        </td>
        <td style="padding: 4px 0; border-bottom: 1px dashed #ddd; text-align: right; font-weight: 700; font-size: 12px; vertical-align: bottom;">
          ${formatRM(item.netSubtotal)}
        </td>
      </tr>
    `
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt ${tx.invoiceNo}</title>
        <style>
          @page { margin: 8mm; size: 80mm auto; }
          body {
            font-family: 'Courier New', Courier, monospace;
            width: 74mm;
            margin: 0 auto;
            color: #000;
            font-size: 12px;
          }
          .center { text-align: center; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          .row { display: flex; justify-content: space-between; margin: 3px 0; }
          .bold { font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="center">
          <div style="font-size: 15px; font-weight: 900; letter-spacing: 0.5px;">${siteName}</div>
          <div style="font-size: 11px; margin-top: 2px;">${address}</div>
          <div style="font-size: 11px;">Tel: ${phone}</div>
        </div>
        <div class="divider"></div>
        <div class="row"><span>Invoice:</span><span class="bold">${tx.invoiceNo}</span></div>
        <div class="row"><span>Date:</span><span>${formatDateTime(tx.createdAt)}</span></div>
        <div class="row"><span>Cashier:</span><span>${tx.cashierName || "Cashier"}</span></div>
        <div class="row"><span>Customer:</span><span>${tx.customerName || "Walk-in Customer"}</span></div>
        ${tx.customerPhone ? `<div class="row"><span>Phone:</span><span>${tx.customerPhone}</span></div>` : ""}
        <div class="divider"></div>
        <table style="width: 100%; border-collapse: collapse;">
          ${itemsHtml}
        </table>
        <div class="divider"></div>
        <div class="row"><span>Gross Total:</span><span>${formatRM(tx.grossTotal)}</span></div>
        ${
          Number(tx.itemDiscountTotal || 0) > 0
            ? `<div class="row"><span>Item Discounts:</span><span>-${formatRM(tx.itemDiscountTotal)}</span></div>`
            : ""
        }
        ${
          Number(tx.orderDiscountAmount || 0) > 0
            ? `<div class="row"><span>Total Discount${tx.orderDiscountType === "percent" ? ` (${Number(tx.orderDiscountValue)}%)` : ""}:</span><span>-${formatRM(tx.orderDiscountAmount)}</span></div>`
            : ""
        }
        <div class="row"><span>Total Discount:</span><span>-${formatRM(tx.discountTotal)}</span></div>
        <div class="row bold" style="font-size: 14px; margin-top: 4px;">
          <span>NET TOTAL:</span><span>${formatRM(tx.netTotal)}</span>
        </div>
        <div class="divider"></div>
        <div class="row"><span>Payment Method:</span><span class="bold">${String(tx.paymentMethod).replace("_", " ").toUpperCase()}</span></div>
        ${
          tx.paymentMethod === "cash" || tx.paymentMethod === "split"
            ? `<div class="row"><span>Cash Paid:</span><span>${formatRM(tx.cashAmount)}</span></div>`
            : ""
        }
        ${
          tx.paymentMethod === "transfer" || tx.paymentMethod === "split"
            ? `<div class="row"><span>Bank Transfer:</span><span>${formatRM(tx.transferAmount)}</span></div>`
            : ""
        }
        ${
          tx.paymentMethod === "qr_pay"
            ? `<div class="row"><span>QR Pay Amount:</span><span>${formatRM(tx.transferAmount || tx.netTotal)}</span></div>`
            : ""
        }
        ${
          tx.bankAccountInfo
            ? `<div class="row"><span>Bank Account:</span><span>${tx.bankAccountInfo}</span></div>`
            : ""
        }
        <div class="row bold"><span>Change:</span><span>${formatRM(tx.changeAmount)}</span></div>
        <div class="divider"></div>
        <div class="center" style="font-size: 11px; margin-top: 8px;">${footer}</div>
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
 * Downloads the receipt directly as a PDF file (NO new tab!)
 */
export function downloadReceiptPdf(
  tx: any,
  settings: WebsiteSettingsData | null
) {
  const doc = new jsPDF({
    unit: "mm",
    format: [80, 210],
  });

  const siteName = settings?.siteName || tx.branchName || "GUNDAM BASE POS";
  const address =
    settings?.address ||
    tx.branchAddress ||
    "Level 4, Bukit Bintang Plaza, Kuala Lumpur";
  const phone = settings?.phone || tx.branchPhone || "+60 3-2148 8899";

  let y = 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(siteName, 40, y, { align: "center" });

  y += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  const addrLines = doc.splitTextToSize(address, 68);
  doc.text(addrLines, 40, y, { align: "center" });
  y += addrLines.length * 3.5;

  doc.text(`Tel: ${phone}`, 40, y, { align: "center" });
  y += 4;
  doc.line(5, y, 75, y);
  y += 4;

  doc.setFontSize(8);
  doc.text(`Invoice: ${tx.invoiceNo}`, 5, y);
  y += 4;
  doc.text(`Date: ${formatDateTime(tx.createdAt)}`, 5, y);
  y += 4;
  doc.text(`Cashier: ${tx.cashierName || "Staff"}`, 5, y);
  y += 4;
  doc.text(
    `Customer: ${tx.customerName || "Walk-in"}${tx.customerPhone ? ` (${tx.customerPhone})` : ""}`,
    5,
    y
  );
  y += 4;
  doc.line(5, y, 75, y);
  y += 4;

  for (const item of tx.items || []) {
    doc.setFont("helvetica", "bold");
    const prodLines = doc.splitTextToSize(item.productName, 68);
    doc.text(prodLines, 5, y);
    y += prodLines.length * 3.6;

    doc.setFont("helvetica", "normal");
    const lineLeft = `${item.qty} x ${formatRM(item.customPrice)}${Number(item.discountAmount) > 0 ? ` (-${formatRM(item.discountAmount)})` : ""}`;
    doc.text(lineLeft, 5, y);
    doc.text(formatRM(item.netSubtotal), 75, y, { align: "right" });
    y += 4.5;
  }

  doc.line(5, y, 75, y);
  y += 4.5;

  doc.text("Gross Total:", 5, y);
  doc.text(formatRM(tx.grossTotal), 75, y, { align: "right" });
  y += 4;

  if (Number(tx.itemDiscountTotal || 0) > 0) {
    doc.text("Item Discounts:", 5, y);
    doc.text(`-${formatRM(tx.itemDiscountTotal)}`, 75, y, { align: "right" });
    y += 4;
  }

  if (Number(tx.orderDiscountAmount || 0) > 0) {
    doc.text(
      `Receipt Discount${tx.orderDiscountType === "percent" ? ` (${Number(tx.orderDiscountValue)}%)` : ""}:`,
      5,
      y
    );
    doc.text(`-${formatRM(tx.orderDiscountAmount)}`, 75, y, { align: "right" });
    y += 4;
  }

  doc.text("Total Discount:", 5, y);
  doc.text(`-${formatRM(tx.discountTotal)}`, 75, y, { align: "right" });
  y += 4.5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("NET TOTAL:", 5, y);
  doc.text(formatRM(tx.netTotal), 75, y, { align: "right" });
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Method: ${String(tx.paymentMethod).toUpperCase()}`, 5, y);
  y += 4;

  if (tx.paymentMethod === "cash" || tx.paymentMethod === "split") {
    doc.text("Cash Paid:", 5, y);
    doc.text(formatRM(tx.cashAmount), 75, y, { align: "right" });
    y += 4;
  }
  if (tx.paymentMethod === "transfer" || tx.paymentMethod === "split") {
    doc.text("Transfer Paid:", 5, y);
    doc.text(formatRM(tx.transferAmount), 75, y, { align: "right" });
    y += 4;
  }
  doc.text("Change:", 5, y);
  doc.text(formatRM(tx.changeAmount), 75, y, { align: "right" });
  y += 6;

  doc.setFontSize(7.5);
  const footerText =
    settings?.receiptFooter ||
    "Thank you for shopping at Gundam Base! Gunpla is Freedom.";
  const footerLines = doc.splitTextToSize(footerText, 68);
  doc.text(footerLines, 40, y, { align: "center" });

  doc.save(`${tx.invoiceNo}.pdf`);
}

/**
 * Generates an official A4 Sales Report PDF with Store Letterhead (Kop Surat)
 * and a dedicated Payment Breakdown column (Cash / Transfer / Split details)
 */
export function exportSalesReportPdf(params: {
  transactions: any[];
  cards: any;
  settings: WebsiteSettingsData | null;
  branchName: string;
  startDate?: string;
  endDate?: string;
}) {
  const { transactions, cards, settings, branchName, startDate, endDate } =
    params;
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const siteName = settings?.siteName || "GUNDAM BASE MALAYSIA HQ";
  const address =
    settings?.address ||
    "Level 4, Lot 4-12, Bukit Bintang Plaza, 55100 Kuala Lumpur, Malaysia";
  const phone = settings?.phone || "+60 3-2148 8899";
  const email = settings?.email || "hq@gundambase.my";

  // Official Letterhead (Kop Surat)
  doc.setFillColor(37, 99, 235);
  doc.rect(14, 12, 18, 18, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("GB", 23, 23, { align: "center" });

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(siteName.toUpperCase(), 36, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Branch: ${branchName} | Address: ${address}`, 36, 23.5);
  doc.text(
    `Phone: ${phone} | Email: ${email} | Bank: ${settings?.bankName || "Maybank"} (${settings?.bankAccountNumber || "-"})`,
    36,
    28.5
  );

  // Double horizontal letterhead line
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.8);
  doc.line(14, 33, 283, 33);
  doc.setLineWidth(0.25);
  doc.line(14, 34.2, 283, 34.2);

  // Report Title & Date Period
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("OFFICIAL SALES & REVENUE REPORT", 14, 42);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const periodStr =
    startDate || endDate
      ? `Period: ${startDate || "Beginning"} to ${endDate || "Today"}`
      : "Period: All Active Transactions";
  doc.text(periodStr, 14, 47);
  doc.text(`Generated on: ${formatDateTime(new Date())}`, 283, 47, {
    align: "right",
  });

  // Summary Boxes
  const summaryData = [
    ["Daily Revenue (Today)", formatRM(cards.dailyNet)],
    ["Weekly Revenue (7 Days)", formatRM(cards.weeklyNet)],
    ["Monthly Revenue", formatRM(cards.monthlyNet)],
    ["Filtered Gross Revenue", formatRM(cards.filteredGross)],
    ["Filtered Discounts", formatRM(cards.filteredDiscount)],
    ["Filtered Net Revenue", formatRM(cards.filteredNet)],
  ];

  autoTable(doc, {
    startY: 51,
    head: [summaryData.map((s) => s[0])],
    body: [summaryData.map((s) => s[1])],
    theme: "grid",
    headStyles: {
      fillColor: [30, 64, 175],
      textColor: 255,
      fontSize: 8,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 9,
      fontStyle: "bold",
      textColor: [15, 23, 42],
    },
  });

  const tableRows = transactions.map((tx: any, idx: number) => {
    const itemDisc = Number(tx.itemDiscountTotal || 0);
    const ordDisc = Number(tx.orderDiscountAmount || 0);
    const totalDisc = Number(tx.discountTotal || 0);
    let discDetail = `-${formatRM(totalDisc)}`;
    if (itemDisc > 0 && ordDisc > 0) {
      discDetail = `-${formatRM(totalDisc)} (Item: -${formatRM(itemDisc)} | Receipt: -${formatRM(ordDisc)})`;
    } else if (ordDisc > 0) {
      discDetail = `-${formatRM(totalDisc)} (Receipt Disc)`;
    } else if (itemDisc > 0) {
      discDetail = `-${formatRM(totalDisc)} (Item Disc)`;
    }
    return [
      idx + 1,
      tx.invoiceNo,
      formatDateTime(tx.createdAt),
      tx.customerName || "Walk-in Customer",
      tx.cashierName || "-",
      String(tx.paymentMethod).replace("_", " ").toUpperCase(),
      formatPaymentBreakdownText(tx),
      formatRM(tx.grossTotal),
      discDetail,
      formatRM(tx.netTotal),
    ];
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 6,
    head: [
      [
        "No.",
        "Invoice No",
        "Date & Time",
        "Customer",
        "Cashier",
        "Method",
        "Payment Breakdown (Cash / Transfer Details)",
        "Gross (RM)",
        "Discount (RM)",
        "Net Total (RM)",
      ],
    ],
    body: tableRows,
    foot: [
      [
        "",
        "",
        "",
        "",
        "",
        "",
        "TOTAL REVENUE",
        formatRM(cards.filteredGross),
        formatRM(cards.filteredDiscount),
        formatRM(cards.filteredNet),
      ],
    ],
    theme: "striped",
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: 255,
      fontSize: 8,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 7.5,
    },
    footStyles: {
      fillColor: [30, 58, 138],
      textColor: 255,
      fontSize: 8,
      fontStyle: "bold",
    },
  });

  doc.save(
    `Sales-Report-${branchName.replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`
  );
}
