import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface PdfInvoiceItem {
  product: { name: string; capacity: string };
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
}

export interface PdfInvoiceData {
  orderNumber: string;
  invoiceNumber: string;
  status: string;
  totalAmount: number;
  advanceAmount: number;
  balanceAmount: number;
  advancePaid: boolean;
  fullPaid: boolean;
  paidAmount: number;
  createdAt: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingPincode: string;
  gstNumber?: string;
  advertiser: {
    name: string;
    companyName: string;
    email: string;
    phone?: string;
  };
  items: PdfInvoiceItem[];
}

function fmt(n: number): string {
  return "INR " + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function fmtShort(n: number): string {
  return n.toFixed(2);
}

export async function downloadPdfInvoice(data: PdfInvoiceData, logoSrc?: string) {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const m = 20;
  const uw = pw - m * 2;

  // ── Modern Gradient Header ──
  doc.setFillColor(8, 145, 178);
  doc.rect(0, 0, pw, 50, "F");
  
  // Add gradient effect with overlapping rectangles
  doc.setFillColor(6, 182, 212, 0.8);
  doc.rect(0, 0, pw, 45, "F");
  
  doc.setFillColor(14, 165, 233, 0.6);
  doc.rect(0, 0, pw, 40, "F");

  let y = 20;

  // Logo + Brand (modern placement)
  if (logoSrc) {
    try {
      doc.addImage(logoSrc, "PNG", m, y, 20, 20);
    } catch { /* ignore */ }
  }
  const lx = logoSrc ? m + 24 : m;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(255, 255, 255);
  doc.text("BLUNIRA", lx, y + 9);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("Premium QR Hydration Marketing Solutions", lx, y + 16);

  // Contact info on right
  const rx = pw - m;
  doc.setFontSize(8);
  doc.text("support@blunira.com", rx, y + 6, { align: "right" });
  doc.text("+91 98765 43210", rx, y + 12, { align: "right" });

  // ── White Content Card ──
  y = 60;
  const cardY = y;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(m, y, uw, ph - y - 30, 8, 8, "F");
  
  // Add subtle shadow effect
  doc.setDrawColor(200, 210, 230);
  doc.setLineWidth(0.5);
  doc.roundedRect(m, y, uw, ph - y - 30, 8, 8, "S");

  y += 15;

  // ── Modern INVOICE Header ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(32);
  doc.setTextColor(15, 23, 42);
  doc.text("INVOICE", m + 10, y);

  // Invoice metadata in modern card
  const metaX = pw - m - 70;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(metaX, y - 10, 60, 28, 4, 4, "F");
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("INVOICE NO.", metaX + 5, y - 4);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(data.invoiceNumber, metaX + 5, y + 2);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("ORDER NO.", metaX + 5, y + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(data.orderNumber, metaX + 5, y + 14);

  // Modern status badge
  const statusColors: Record<string, { bg: [number, number, number], text: string }> = {
    PENDING: { bg: [251, 191, 36], text: "Pending" },
    CONFIRMED: { bg: [6, 182, 212], text: "Confirmed" },
    PROCESSING: { bg: [59, 130, 246], text: "Processing" },
    SHIPPED: { bg: [139, 92, 246], text: "Shipped" },
    DELIVERED: { bg: [34, 197, 94], text: "Delivered" },
    CANCELLED: { bg: [239, 68, 68], text: "Cancelled" },
  };
  const statusInfo = statusColors[data.status] || { bg: [100, 116, 139], text: data.status };
  const statusText = statusInfo.text;
  const sw = Math.max(doc.getTextWidth(statusText) + 12, 28);
  
  doc.setFillColor(statusInfo.bg[0], statusInfo.bg[1], statusInfo.bg[2]);
  doc.roundedRect(m + 10, y + 5, sw, 9, 4, 4, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(statusText, m + 10 + sw / 2, y + 11, { align: "center" });

  // Date with icon-like presentation
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const dateStr = new Date(data.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  doc.text("Date: " + dateStr, m + 10, y + 19);

  // ── Modern Info Cards ──
  y += 35;
  const cardW = (uw - 16) / 2;
  
  // Bill To Card
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(m + 10, y, cardW, 40, 5, 5, "F");
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(m + 10, y, cardW, 40, 5, 5, "S");
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(6, 182, 212);
  doc.text("BILL TO", m + 15, y + 6);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(data.advertiser.companyName, m + 15, y + 14);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(data.advertiser.name, m + 15, y + 21);
  doc.setFontSize(8);
  doc.text(data.advertiser.email, m + 15, y + 27);
  if (data.advertiser.phone) doc.text(data.advertiser.phone, m + 15, y + 33);

  // Ship To Card
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(m + 10 + cardW + 6, y, cardW, 40, 5, 5, "F");
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(m + 10 + cardW + 6, y, cardW, 40, 5, 5, "S");
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(6, 182, 212);
  doc.text("SHIP TO", m + 15 + cardW + 6, y + 6);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  const maxLineWidth = cardW - 15;
  const addressLines = doc.splitTextToSize(data.shippingAddress, maxLineWidth);
  doc.text(addressLines[0], m + 15 + cardW + 6, y + 14);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`${data.shippingCity}, ${data.shippingState}`, m + 15 + cardW + 6, y + 21);
  doc.text(`PIN: ${data.shippingPincode}`, m + 15 + cardW + 6, y + 27);
  if (data.gstNumber) {
    doc.setFontSize(8);
    doc.text(`GST: ${data.gstNumber}`, m + 15 + cardW + 6, y + 33);
  }

  // ── Payment Status Bar (Modern) ──
  y += 50;
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(m + 10, y, uw - 20, 26, 5, 5, "F");
  doc.setDrawColor(147, 197, 253);
  doc.setLineWidth(1);
  doc.roundedRect(m + 10, y, uw - 20, 26, 5, 5, "S");

  const payStatus = data.fullPaid ? "✓ Fully Paid" : data.advancePaid ? "◐ Advance Paid" : "○ Pending";
  const payLabels = ["PAYMENT", "TOTAL", "PAID", "BALANCE"];
  const payVals   = [payStatus, fmt(data.totalAmount), fmt(data.paidAmount), fmt(Math.max(0, data.totalAmount - data.paidAmount))];
  const payColors = [[6, 182, 212], [15, 23, 42], [34, 197, 94], [239, 68, 68]];
  const segmentW = (uw - 20) / 4;

  for (let i = 0; i < 4; i++) {
    const xPos = m + 10 + i * segmentW + 8;
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text(payLabels[i], xPos, y + 8);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(payColors[i][0], payColors[i][1], payColors[i][2]);
    doc.text(payVals[i], xPos, y + 17);
  }

  // ── Modern Items Table ──
  y += 36;
  const headRow = [["#", "PRODUCT DESCRIPTION", "QTY", "UNIT PRICE", "TOTAL"]];
  const bodyRows = data.items.map((it, i) => [
    String(i + 1),
    `${it.product.name}\n${it.product.capacity}`,
    it.quantity.toLocaleString("en-IN"),
    fmtShort(it.pricePerUnit),
    fmtShort(it.totalPrice),
  ]);

  autoTable(doc, {
    head: headRow,
    body: bodyRows,
    startY: y,
    theme: "striped",
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      cellPadding: 5,
      halign: "center",
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
      textColor: [30, 41, 59],
      fontSize: 9,
      cellPadding: 5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 12, halign: "center", fontStyle: "bold", textColor: [100, 116, 139] },
      1: { cellWidth: 70, halign: "left" },
      2: { cellWidth: 22, halign: "center" },
      3: { cellWidth: 32, halign: "right" },
      4: { cellWidth: 36, halign: "right", fontStyle: "bold", textColor: [15, 23, 42] },
    },
    margin: { left: m + 10, right: m + 10 },
  });

  // ── Modern Summary Box ──
  const fy = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
  const sw2 = 90;
  const sx2 = pw - m - sw2;
  const sh2 = 56;

  // Gradient summary box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(sx2, fy, sw2, sh2, 6, 6, "F");
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.5);
  doc.roundedRect(sx2, fy, sw2, sh2, 6, 6, "S");

  const summaryItems = [
    { label: "SUBTOTAL", value: fmt(data.totalAmount), color: [71, 85, 105] },
    { label: "ADVANCE (50%)", value: fmt(data.advanceAmount), color: [100, 116, 139] },
    { label: "BALANCE (50%)", value: fmt(data.balanceAmount), color: [239, 68, 68] },
  ];

  let summaryY = fy + 10;
  for (const item of summaryItems) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(item.label, sx2 + 8, summaryY);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(item.color[0], item.color[1], item.color[2]);
    doc.text(item.value, sx2 + sw2 - 8, summaryY, { align: "right" });
    
    summaryY += 10;
  }

  // Total with gradient background
  doc.setFillColor(6, 182, 212);
  doc.roundedRect(sx2 + 6, summaryY + 2, sw2 - 12, 16, 4, 4, "F");
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("GRAND TOTAL", sx2 + 10, summaryY + 11);
  doc.setFontSize(12);
  doc.text(fmt(data.totalAmount), sx2 + sw2 - 12, summaryY + 11, { align: "right" });

  // ── Modern Footer ──
  doc.setFillColor(248, 250, 252);
  doc.rect(0, ph - 28, pw, 28, "F");
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(0, ph - 28, pw, ph - 28);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(6, 182, 212);
  doc.text("BLUNIRA", m, ph - 16);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8);
  doc.text("Thank you for choosing BLUNIRA!", pw / 2, ph - 16, { align: "center" });
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("This is a computer-generated invoice. For queries: support@blunira.com", pw / 2, ph - 10, { align: "center" });

  doc.save("Invoice_" + (data.invoiceNumber || data.orderNumber) + ".pdf");
}
