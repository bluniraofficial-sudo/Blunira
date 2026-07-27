export function generateInvoiceHtml(order: {
  orderNumber: string;
  invoiceNumber: string;
  status: string;
  totalAmount: number;
  advanceAmount: number;
  balanceAmount: number;
  advancePaid: boolean;
  fullPaid: boolean;
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
  items: Array<{
    product: { name: string; capacity: string };
    quantity: number;
    pricePerUnit: number;
    totalPrice: number;
  }>;
}) {
  return `
    <!DOCTYPE html>
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>Invoice ${order.invoiceNumber}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; background: #ffffff; }
        .container { max-width: 850px; margin: 0 auto; }
        
        /* Modern Gradient Header */
        .header-gradient {
          background: linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #0ea5e9 100%);
          padding: 40px 50px;
          color: white;
          position: relative;
          overflow: hidden;
        }
        .header-gradient::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -10%;
          width: 400px;
          height: 400px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
        }
        .header-content { position: relative; z-index: 1; }
        .brand { font-size: 32px; font-weight: 700; letter-spacing: 1px; margin-bottom: 8px; }
        .tagline { font-size: 14px; opacity: 0.95; font-weight: 300; }
        
        /* Content Card */
        .content-card {
          background: white;
          margin: -20px 30px 30px;
          padding: 40px;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
          position: relative;
          z-index: 2;
        }
        
        /* Invoice Title Section */
        .invoice-title-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 35px;
          padding-bottom: 25px;
          border-bottom: 2px solid #e2e8f0;
        }
        .invoice-title {
          font-size: 42px;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -1px;
        }
        .invoice-meta {
          text-align: right;
          background: #f1f5f9;
          padding: 16px 20px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }
        .invoice-meta-label {
          font-size: 11px;
          color: #64748b;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .invoice-meta-value {
          font-size: 15px;
          color: #0f172a;
          font-weight: 600;
          margin-top: 4px;
        }
        .invoice-date {
          font-size: 13px;
          color: #64748b;
          margin-top: 8px;
        }
        
        /* Status Badge */
        .status-badge {
          display: inline-block;
          padding: 8px 18px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 12px;
        }
        .status-pending { background: #fef3c7; color: #92400e; }
        .status-confirmed { background: #cffafe; color: #155e75; }
        .status-processing { background: #dbeafe; color: #1e40af; }
        .status-shipped { background: #e9d5ff; color: #6b21a8; }
        .status-delivered { background: #d1fae5; color: #065f46; }
        .status-cancelled { background: #fee2e2; color: #991b1b; }
        
        /* Info Cards Grid */
        .info-grid {
          display: flex;
          gap: 20px;
          margin-bottom: 35px;
        }
        .info-card {
          flex: 1;
          background: #f8fafc;
          padding: 24px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          position: relative;
          overflow: hidden;
        }
        .info-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          background: linear-gradient(180deg, #06b6d4, #0ea5e9);
        }
        .info-card-title {
          font-size: 12px;
          font-weight: 700;
          color: #06b6d4;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 12px;
        }
        .info-card p {
          margin: 6px 0;
          font-size: 14px;
          color: #475569;
          line-height: 1.6;
        }
        .info-card strong {
          color: #0f172a;
          font-size: 16px;
        }
        
        /* Payment Status Bar */
        .payment-bar {
          background: linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%);
          border: 2px solid #93c5fd;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 30px;
          display: flex;
          justify-content: space-around;
          align-items: center;
        }
        .payment-item {
          text-align: center;
          flex: 1;
        }
        .payment-label {
          font-size: 10px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }
        .payment-value {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
        }
        .payment-value.highlight-green { color: #059669; }
        .payment-value.highlight-red { color: #dc2626; }
        .payment-value.highlight-blue { color: #06b6d4; }
        
        /* Modern Table */
        .table-wrapper {
          margin-bottom: 30px;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        thead {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        }
        th {
          padding: 16px;
          text-align: left;
          font-size: 12px;
          font-weight: 700;
          color: white;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        th:first-child { text-align: center; width: 8%; }
        th:nth-child(2) { width: 44%; }
        th:nth-child(3) { text-align: center; width: 16%; }
        th:nth-child(4), th:nth-child(5) { text-align: right; width: 16%; }
        
        tbody tr {
          border-bottom: 1px solid #f1f5f9;
          transition: background 0.2s;
        }
        tbody tr:nth-child(even) {
          background: #f8fafc;
        }
        tbody tr:hover {
          background: #f1f5f9;
        }
        td {
          padding: 16px;
          font-size: 14px;
          color: #475569;
        }
        td:first-child {
          text-align: center;
          font-weight: 700;
          color: #94a3b8;
        }
        td:nth-child(3) { text-align: center; }
        td:nth-child(4), td:nth-child(5) {
          text-align: right;
          font-weight: 600;
        }
        td:nth-child(5) {
          color: #0f172a;
          font-size: 15px;
        }
        
        /* Summary Section */
        .summary-section {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 30px;
        }
        .summary-box {
          width: 380px;
          background: #f1f5f9;
          border-radius: 12px;
          padding: 24px;
          border: 1px solid #cbd5e1;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          font-size: 14px;
          color: #475569;
        }
        .summary-row.subtotal {
          padding-top: 0;
        }
        .summary-row.balance .summary-value {
          color: #dc2626;
          font-weight: 700;
        }
        .summary-divider {
          height: 2px;
          background: linear-gradient(90deg, #06b6d4, #0ea5e9);
          margin: 16px 0;
        }
        .summary-total {
          display: flex;
          justify-content: space-between;
          background: linear-gradient(135deg, #06b6d4, #0ea5e9);
          padding: 16px 20px;
          border-radius: 8px;
          margin-top: 12px;
        }
        .summary-total-label {
          font-size: 16px;
          font-weight: 700;
          color: white;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .summary-total-value {
          font-size: 20px;
          font-weight: 700;
          color: white;
        }
        
        /* Footer */
        .footer {
          background: #f8fafc;
          padding: 30px 50px;
          text-align: center;
          border-top: 2px solid #e2e8f0;
        }
        .footer-brand {
          font-size: 18px;
          font-weight: 700;
          color: #06b6d4;
          margin-bottom: 12px;
        }
        .footer-text {
          font-size: 13px;
          color: #64748b;
          line-height: 1.8;
        }
        .footer-text strong {
          color: #475569;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Modern Gradient Header -->
        <div class="header-gradient">
          <div class="header-content">
            <div class="brand">BLUNIRA</div>
            <div class="tagline">Premium QR Hydration Marketing Solutions</div>
          </div>
        </div>
        
        <!-- Main Content Card -->
        <div class="content-card">
          <!-- Invoice Title Section -->
          <div class="invoice-title-section">
            <div>
              <div class="invoice-title">INVOICE</div>
              <div class="status-badge status-${order.status.toLowerCase()}">
                ${order.status}
              </div>
            </div>
            <div class="invoice-meta">
              <div class="invoice-meta-label">Invoice No.</div>
              <div class="invoice-meta-value">${order.invoiceNumber}</div>
              <div class="invoice-meta-label" style="margin-top: 12px;">Order No.</div>
              <div class="invoice-meta-value">${order.orderNumber}</div>
              <div class="invoice-date">${new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
            </div>
          </div>
          
          <!-- Info Cards -->
          <div class="info-grid">
            <div class="info-card">
              <div class="info-card-title">Bill To</div>
              <p><strong>${order.advertiser.companyName}</strong></p>
              <p>${order.advertiser.name}</p>
              <p>${order.advertiser.email}</p>
              ${order.advertiser.phone ? `<p>${order.advertiser.phone}</p>` : ""}
            </div>
            <div class="info-card">
              <div class="info-card-title">Ship To</div>
              <p><strong>${order.shippingAddress}</strong></p>
              <p>${order.shippingCity}, ${order.shippingState}</p>
              <p>PIN: ${order.shippingPincode}</p>
              ${order.gstNumber ? `<p>GST: ${order.gstNumber}</p>` : ""}
            </div>
          </div>
          
          <!-- Payment Status Bar -->
          <div class="payment-bar">
            <div class="payment-item">
              <div class="payment-label">Payment Status</div>
              <div class="payment-value highlight-blue">
                ${order.fullPaid ? '✓ Fully Paid' : order.advancePaid ? '◐ Advance Paid' : '○ Pending'}
              </div>
            </div>
            <div class="payment-item">
              <div class="payment-label">Total Amount</div>
              <div class="payment-value">₹${Number(order.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            <div class="payment-item">
              <div class="payment-label">Amount Paid</div>
              <div class="payment-value highlight-green">₹${Number(order.advancePaid ? order.advanceAmount : order.fullPaid ? order.totalAmount : 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            <div class="payment-item">
              <div class="payment-label">Balance Due</div>
              <div class="payment-value highlight-red">₹${Number(order.fullPaid ? 0 : order.balanceAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
          </div>
          
          <!-- Items Table -->
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product Description</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map((item, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>
                      <strong style="color: #0f172a;">${item.product.name}</strong><br>
                      <span style="font-size: 12px; color: #94a3b8;">${item.product.capacity}</span>
                    </td>
                    <td>${item.quantity.toLocaleString('en-IN')}</td>
                    <td>₹${Number(item.pricePerUnit).toFixed(2)}</td>
                    <td>₹${Number(item.totalPrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <!-- Summary Section -->
          <div class="summary-section">
            <div class="summary-box">
              <div class="summary-row subtotal">
                <span class="summary-label">Subtotal</span>
                <span class="summary-value">₹${Number(order.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Advance (50%)</span>
                <span class="summary-value">₹${Number(order.advanceAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div class="summary-row balance">
                <span class="summary-label">Balance (50%)</span>
                <span class="summary-value">₹${Number(order.balanceAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div class="summary-divider"></div>
              <div class="summary-total">
                <span class="summary-total-label">Grand Total</span>
                <span class="summary-total-value">₹${Number(order.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <div class="footer-brand">BLUNIRA</div>
          <div class="footer-text">
            <strong>Thank you for choosing BLUNIRA!</strong><br>
            This is a computer-generated invoice. For queries, contact <strong>support@blunira.com</strong>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function getInvoiceFilename(order: {
  invoiceNumber?: string;
  orderNumber: string;
}): string {
  return `Invoice_${order.invoiceNumber || order.orderNumber}.doc`;
}
