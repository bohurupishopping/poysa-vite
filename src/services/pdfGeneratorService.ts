import jsPDF from 'jspdf';

// Define Company type for the buildInvoiceFooter method
interface Company {
  id: string;
  name: string;
  address_line_1?: string;
  city?: string;
  state_province?: string;
  postal_code?: string;
  gstin?: string;
  pan_number?: string;
  phone?: string;
  email?: string;
  website?: string;
}

// Use the InvoicePrintData type that matches the RPC response
export interface InvoicePrintData {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date?: string;
  subtotal: number;
  total_tax: number;
  total_amount: number;
  amount_paid: number;
  status: string;
  place_of_supply?: string;
  company: {
    id: string;
    name: string;
    address_line_1?: string;
    city?: string;
    state_province?: string;
    postal_code?: string;
    gstin?: string;
    pan_number?: string;
    phone?: string;
    email?: string;
    website?: string;
  };
  customer: {
    id: string;
    name: string;
    details?: {
      address_line1?: string;
      address_line2?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      gstin?: string;
      state_code?: string;
      phone?: string;
      email?: string;
    };
  };
  lines: Array<{
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    line_total: number;
    hsn_sac_code?: string;
    product?: {
      name: string;
      type: 'GOOD' | 'SERVICE';
    };
    taxes?: Array<{
      tax_amount: number;
      tax_rate: {
        name: string;
        rate: number;
      };
    }>;
  }>;
  payments?: Array<{
    payment_date: string;
    amount: number;
    method: string;
  }>;
}

// PDF color constants matching the demo image
const BORDER_COLOR = '#000000';

// Font sizes and styles
const FONT_SIZES = {
  TITLE: 14,
  HEADER: 11,
  SUBHEADER: 9,
  BODY: 9,
  SMALL: 8,
  XSMALL: 7
};

export class PdfGeneratorService {
  private static instance: PdfGeneratorService;

  public static getInstance(): PdfGeneratorService {
    if (!PdfGeneratorService.instance) {
      PdfGeneratorService.instance = new PdfGeneratorService();
    }
    return PdfGeneratorService.instance;
  }

  /**
   * Generate PDF for Sales Invoice using the new RPC data format
   */
  generateInvoicePdf(invoice: InvoicePrintData): jsPDF {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const margin = 10;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const contentWidth = pageWidth - (margin * 2);

    let yPosition = margin;

    // TAX INVOICE Title
    pdf.setFontSize(FONT_SIZES.TITLE);
    pdf.setFont('helvetica', 'bold');
    pdf.text('TAX INVOICE', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;

    // Seller & Invoice Details
    yPosition = this.buildSellerAndInvoiceDetails(pdf, invoice, margin, contentWidth, yPosition);

    // Consignee & Buyer Details
    yPosition = this.buildPartyDetails(pdf, invoice, margin, contentWidth, yPosition);

    // Line Items Table
    yPosition = this.buildInvoiceLineItems(pdf, invoice, margin, contentWidth, yPosition);
    
    // Totals and Tax Summary
    yPosition = this.buildTotals(pdf, invoice, margin, contentWidth, yPosition);
    yPosition = this.buildAmountInWords(pdf, invoice.total_amount, "Amount Chargeable (in words)", margin, contentWidth, yPosition);
    yPosition = this.buildTaxSummaryTable(pdf, invoice, margin, contentWidth, yPosition);
    yPosition = this.buildAmountInWords(pdf, invoice.total_tax, "Tax Amount (in words)", margin, contentWidth, yPosition);
    
    // Footer
    this.buildInvoiceFooter(pdf, invoice.company, margin, contentWidth, yPosition, pageWidth);

    return pdf;
  }

  /**
   * Builds the top section with Seller and Invoice details
   */
  private buildSellerAndInvoiceDetails(pdf: jsPDF, invoice: InvoicePrintData, margin: number, contentWidth: number, y: number): number {
    const boxHeight = 35;
    const separatorX = margin + contentWidth * 0.55;
    
    pdf.setDrawColor(BORDER_COLOR);
    pdf.setLineWidth(0.1);
    pdf.rect(margin, y, contentWidth, boxHeight);
    pdf.line(separatorX, y, separatorX, y + boxHeight);

    // Left Column: Seller Details
    let currentY = y + 4;
    const leftX = margin + 3;
    pdf.setFontSize(FONT_SIZES.HEADER);
    pdf.setFont('helvetica', 'bold');
    pdf.text(invoice.company.name || '', leftX, currentY);
    currentY += 5;

    pdf.setFontSize(FONT_SIZES.SMALL);
    pdf.setFont('helvetica', 'normal');
    const address = `${invoice.company.address_line_1 || ''}, ${invoice.company.city || ''} - ${invoice.company.postal_code || ''}`;
    pdf.text(address, leftX, currentY, { maxWidth: contentWidth * 0.55 - 6 });
    currentY += 8;
    if (invoice.company.gstin) pdf.text(`GSTIN/UIN: ${invoice.company.gstin}`, leftX, currentY);
    currentY += 4;
    pdf.text(`State Name : ${invoice.company.state_province || ''}`, leftX, currentY);
    currentY += 4;
    if (invoice.company.phone) pdf.text(`Contact: ${invoice.company.phone}`, leftX, currentY);

    // Right Column: Invoice Details
    currentY = y + 4;
    const rightXLabel = separatorX + 3;
    const rightXValue = margin + contentWidth - 3;

    const addMetaRow = (label: string, value: string, isBold: boolean = false) => {
        pdf.setFontSize(FONT_SIZES.SMALL);
        pdf.setFont('helvetica', 'normal');
        pdf.text(label, rightXLabel, currentY);
        pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
        pdf.text(value, rightXValue, currentY, { align: 'right' });
        currentY += 4;
    };
    
    addMetaRow('Invoice No.', invoice.invoice_number, true);
    addMetaRow('Dated', this.formatDate(invoice.invoice_date));
    addMetaRow('Place of Supply', invoice.place_of_supply || '');
    addMetaRow('Due Date', invoice.due_date ? this.formatDate(invoice.due_date) : 'N/A');

    return y + boxHeight + 2;
  }

  /**
   * Builds the party details section (Consignee and Buyer)
   */
  private buildPartyDetails(pdf: jsPDF, invoice: InvoicePrintData, margin: number, contentWidth: number, y: number): number {
    const boxHeight = 38; // Increased height
    const separatorX = margin + contentWidth * 0.5;

    pdf.rect(margin, y, contentWidth, boxHeight);
    pdf.line(separatorX, y, separatorX, y + boxHeight);

    const customer = invoice.customer;
    const details = customer?.details;

    const partyName = customer?.name ?? 'N/A';
    // Safely construct the address string from potentially missing parts
    const address = [
        details?.address_line1,
        details?.address_line2,
        details?.city,
        details?.state,
        details?.postal_code
    ].filter(Boolean).join(', ') || 'Address not available';
    
    const stateInfo = `State: ${details?.state || 'N/A'}, Code: ${details?.state_code || 'N/A'}`;
    const gstin = `GSTIN: ${details?.gstin || 'Unregistered'}`;
    const phone = `Phone: ${details?.phone || 'N/A'}`;

    const printPartyInfo = (startX: number, title: string) => {
        let currentY = y + 4;
        const textX = startX + 3;
        const maxWidth = contentWidth * 0.5 - 6;

        pdf.setFontSize(FONT_SIZES.SMALL);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title, textX, currentY);
        currentY += 5;

        pdf.setFontSize(FONT_SIZES.SUBHEADER);
        pdf.text(partyName, textX, currentY);
        currentY += 4;

        pdf.setFontSize(FONT_SIZES.SMALL);
        pdf.setFont('helvetica', 'normal');
        
        const addressLines = pdf.splitTextToSize(address, maxWidth);
        addressLines.forEach((line: string) => {
            pdf.text(line, textX, currentY);
            currentY += 4;
        });
        
        pdf.text(stateInfo, textX, currentY);
        currentY += 4;
        pdf.text(gstin, textX, currentY);
        currentY += 4;
        pdf.text(phone, textX, currentY);
    };

    // Consignee (Ship to)
    printPartyInfo(margin, 'Consignee (Ship to)');
    
    // Buyer (Bill to)
    printPartyInfo(separatorX, 'Buyer (Bill to)');

    return y + boxHeight + 2;
  }

  /**
   * Builds the line items table
   */
  private buildInvoiceLineItems(pdf: jsPDF, invoice: InvoicePrintData, margin: number, contentWidth: number, y: number): number {
    const columnWidths = {
      si: contentWidth * 0.05,
      desc: contentWidth * 0.30,
      hsn: contentWidth * 0.12,
      qty: contentWidth * 0.13,
      rate: contentWidth * 0.13,
      per: contentWidth * 0.07,
      amount: contentWidth * 0.20,
    };
    
    const tableStartY = y;
    let currentY = y;
    
    // Table Headers
    const drawHeader = () => {
        pdf.setFontSize(FONT_SIZES.SMALL);
        pdf.setFont('helvetica', 'bold');
        const headerY = currentY + 4;
        
        let currentX = margin;
        const addHeader = (text: string, width: number) => {
          pdf.text(text, currentX + width / 2, headerY, { align: 'center' });
          currentX += width;
        };
    
        addHeader('Sl.', columnWidths.si);
        addHeader('Description of Goods', columnWidths.desc);
        addHeader('HSN/SAC', columnWidths.hsn);
        addHeader('Quantity', columnWidths.qty);
        addHeader('Rate', columnWidths.rate);
        addHeader('per', columnWidths.per);
        addHeader('Amount', columnWidths.amount);
        currentY += 6;
    };
    
    drawHeader();

    // Table Rows
    pdf.setFontSize(FONT_SIZES.BODY);
    pdf.setFont('helvetica', 'normal');

    invoice.lines?.forEach((line, index) => {
      const lineTextY = currentY + 4;
      let currentX = margin;

      const addCell = (text: string, width: number, align: 'left' | 'center' | 'right' = 'left', isBold: boolean = false) => {
        pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
        let textX;
        if (align === 'left') textX = currentX + 1.5;
        else if (align === 'right') textX = currentX + width - 1.5;
        else textX = currentX + width / 2;
        pdf.text(text, textX, lineTextY, { align });
        currentX += width;
      };
      
      const unit = line.product?.type === 'GOOD' ? 'PCS' : 'NOS';
      
      addCell((index + 1).toString(), columnWidths.si, 'center');
      addCell(line.product?.name || line.description, columnWidths.desc, 'left');
      // Ensure HSN code from the line item is displayed
      addCell(line.hsn_sac_code || 'N/A', columnWidths.hsn, 'center');
      addCell(`${line.quantity.toFixed(2)}`, columnWidths.qty, 'center');
      addCell(this.formatCurrency(line.unit_price, false), columnWidths.rate, 'right');
      addCell(unit, columnWidths.per, 'center');
      addCell(this.formatCurrency(line.line_total, false), columnWidths.amount, 'right', true);

      currentY += 6;
    });
    
    // Draw table borders
    pdf.setLineWidth(0.1);
    const tableHeight = currentY - tableStartY;
    pdf.rect(margin, tableStartY, contentWidth, tableHeight);
    let colX = margin;
    Object.values(columnWidths).forEach(width => {
        colX += width;
        if(colX < margin + contentWidth) pdf.line(colX, tableStartY, colX, currentY);
    });
    pdf.line(margin, tableStartY + 6, margin + contentWidth, tableStartY + 6);


    return currentY;
  }
  
  /**
   * Builds the totals section
   */
  private buildTotals(pdf: jsPDF, invoice: InvoicePrintData, margin: number, contentWidth: number, y: number): number {
      const rightX = margin + contentWidth;
      const labelX = rightX - 50;
      let currentY = y;

      // Add gap above the Subtotal section
      currentY += 5;

      pdf.setFontSize(FONT_SIZES.BODY);
      
      const addRow = (label: string, value: number, isBold: boolean = false) => {
          pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
          pdf.text(label, labelX, currentY, {align: 'right'});
          pdf.text(this.formatCurrency(value, false), rightX, currentY, { align: 'right' });
          currentY += 5;
      };

      addRow('Subtotal', invoice.subtotal);
      
      const taxBreakdown = this.calculateTaxBreakdown(invoice);
      Object.entries(taxBreakdown).forEach(([taxName, taxAmount]) => {
          addRow(taxName, taxAmount);
      });
      
      pdf.setLineWidth(0.2);
      pdf.line(labelX - 5, currentY - 2, rightX, currentY - 2);
      
      addRow('TOTAL', invoice.total_amount, true);
      
      return currentY;
  }
  
  /**
   * Builds the amount in words section
   */
  private buildAmountInWords(pdf: jsPDF, amount: number, label: string, margin: number, contentWidth: number, y: number): number {
      const amountInWords = this.numberToWords(amount);
      const text = `${label}: ${amountInWords}`;
      
      pdf.setFontSize(FONT_SIZES.SMALL);
      pdf.setFont('helvetica', 'normal');
      pdf.text(text, margin, y, { maxWidth: contentWidth * 0.7 });
      
      return y + 8;
  }

  /**
   * Builds the tax summary table
   */
  private buildTaxSummaryTable(pdf: jsPDF, invoice: InvoicePrintData, margin: number, contentWidth: number, y: number): number {
    const columnWidths = {
      hsn: contentWidth * 0.15,
      taxable: contentWidth * 0.20,
      cgstRate: contentWidth * 0.10,
      cgstAmount: contentWidth * 0.12,
      sgstRate: contentWidth * 0.10,
      sgstAmount: contentWidth * 0.12,
      totalTax: contentWidth * 0.21,
    };
    const rowHeight = 5;
    
    const hsnSummary = this.summarizeByHsn(invoice);
    const tableHeight = rowHeight * (Object.keys(hsnSummary).length + 2);
    pdf.setLineWidth(0.1);
    pdf.rect(margin, y, contentWidth, tableHeight);

    // Header
    let currentY = y;
    let currentX = margin;
    const headerY = currentY + rowHeight / 2 + 1.5;
    pdf.setFontSize(FONT_SIZES.XSMALL);
    pdf.setFont('helvetica', 'bold');
    
    const addHeader = (text: string, width: number) => {
        pdf.text(text, currentX + width / 2, headerY, { align: 'center' });
        currentX += width;
        if(currentX < margin + contentWidth) pdf.line(currentX, currentY, currentX, currentY + tableHeight);
    };

    addHeader('HSN/SAC', columnWidths.hsn);
    addHeader('Taxable Value', columnWidths.taxable);
    addHeader('CGST Rate', columnWidths.cgstRate);
    addHeader('CGST Amount', columnWidths.cgstAmount);
    addHeader('SGST Rate', columnWidths.sgstRate);
    addHeader('SGST Amount', columnWidths.sgstAmount);
    addHeader('Total Tax', columnWidths.totalTax);
    
    currentY += rowHeight;
    pdf.line(margin, currentY, margin + contentWidth, currentY);

    // Rows
    pdf.setFont('helvetica', 'normal');
    Object.entries(hsnSummary).forEach(([hsn, data]) => {
      const lineY = currentY + rowHeight / 2 + 1.5;
      currentX = margin;

      const addCell = (text: string, width: number, align: 'right' | 'center' = 'right') => {
          pdf.text(text, align === 'right' ? currentX + width - 1.5 : currentX + width / 2, lineY, { align });
          currentX += width;
      };

      addCell(hsn, columnWidths.hsn, 'center');
      addCell(this.formatCurrency(data.taxableValue, false), columnWidths.taxable);
      addCell(`${data.cgstRate.toFixed(2)}%`, columnWidths.cgstRate);
      addCell(this.formatCurrency(data.cgstAmount, false), columnWidths.cgstAmount);
      addCell(`${data.sgstRate.toFixed(2)}%`, columnWidths.sgstRate);
      addCell(this.formatCurrency(data.sgstAmount, false), columnWidths.sgstAmount);
      addCell(this.formatCurrency(data.totalTax, false), columnWidths.totalTax);
      
      currentY += rowHeight;
    });

    // Footer
    pdf.line(margin, currentY, margin + contentWidth, currentY);
    const footerY = currentY + rowHeight / 2 + 1.5;
    pdf.setFont('helvetica', 'bold');
    currentX = margin;
    pdf.text("Total", currentX + 2, footerY);
    
    pdf.text(this.formatCurrency(invoice.subtotal, false), margin + columnWidths.hsn + columnWidths.taxable - 1.5, footerY, {align: 'right'});
    
    const totalCGST = this.calculateTaxBreakdown(invoice)['CGST'] || 0;
    const totalSGST = this.calculateTaxBreakdown(invoice)['SGST'] || 0;
    
    pdf.text(this.formatCurrency(totalCGST, false), margin + columnWidths.hsn + columnWidths.taxable + columnWidths.cgstRate + columnWidths.cgstAmount - 1.5, footerY, {align: 'right'});
    pdf.text(this.formatCurrency(totalSGST, false), margin + contentWidth - columnWidths.totalTax - columnWidths.sgstAmount -1.5, footerY, {align: 'right'});
    pdf.text(this.formatCurrency(invoice.total_tax, false), margin + contentWidth - 1.5, footerY, {align: 'right'});

    return currentY + rowHeight + 5;
  }
  
  /**
   * Builds the final footer section
   */
  private buildInvoiceFooter(pdf: jsPDF, company: Company, margin: number, contentWidth: number, y: number, pageWidth: number): void {
    let currentY = y;
    
    // PAN and Declaration
    pdf.setFontSize(FONT_SIZES.SMALL);
    if(company.pan_number) {
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Company's PAN: ${company.pan_number}`, margin, currentY);
        currentY += 8;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.text('Declaration:', margin, currentY);
    currentY += 4;
    pdf.setFont('helvetica', 'normal');
    const declaration = 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.';
    pdf.text(declaration, margin, currentY, { maxWidth: contentWidth * 0.6 });

    // Signature Area
    const signatureX = margin + contentWidth;
    const signatureY = y;
    pdf.setFont('helvetica', 'bold');
    pdf.text(`for ${company.name || ''}`, signatureX, signatureY + 15, { align: 'right' });
    pdf.text('Authorised Signatory', signatureX, signatureY + 25, { align: 'right' });

    // Bottom centered text
    const bottomY = pdf.internal.pageSize.getHeight() - 15;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(FONT_SIZES.SMALL);
    const jurisdiction = `SUBJECT TO ${company.city?.toUpperCase() || 'LOCAL'} JURISDICTION`;
    pdf.text(jurisdiction, pageWidth / 2, bottomY, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.text('This is a Computer Generated Invoice', pageWidth / 2, bottomY + 5, { align: 'center' });
  }

  // --- UTILITY FUNCTIONS ---

  private summarizeByHsn(invoice: InvoicePrintData): Record<string, any> {
      const summary: Record<string, any> = {};

      invoice.lines?.forEach(line => {
          const hsn = line.hsn_sac_code || 'N/A';
          if (!summary[hsn]) {
              summary[hsn] = { taxableValue: 0, cgstRate: 0, cgstAmount: 0, sgstRate: 0, sgstAmount: 0, totalTax: 0 };
          }
          summary[hsn].taxableValue += line.line_total;

          const cgst = line.taxes?.find(t => t.tax_rate?.name.includes('CGST'));
          const sgst = line.taxes?.find(t => t.tax_rate?.name.includes('SGST'));

          if (cgst) {
              summary[hsn].cgstRate = cgst.tax_rate?.rate ?? 0;
              summary[hsn].cgstAmount += cgst.tax_amount;
              summary[hsn].totalTax += cgst.tax_amount;
          }
          if (sgst) {
              summary[hsn].sgstRate = sgst.tax_rate?.rate ?? 0;
              summary[hsn].sgstAmount += sgst.tax_amount;
              summary[hsn].totalTax += sgst.tax_amount;
          }
      });
      return summary;
  }

  private calculateTaxBreakdown(invoice: InvoicePrintData): Record<string, number> {
    const taxBreakdown: Record<string, number> = {};
    invoice.lines?.forEach(line => {
      line.taxes?.forEach(tax => {
        const taxName = tax.tax_rate?.name || 'Tax';
        if (taxName.includes('CGST')) taxBreakdown['CGST'] = (taxBreakdown['CGST'] || 0) + tax.tax_amount;
        else if (taxName.includes('SGST')) taxBreakdown['SGST'] = (taxBreakdown['SGST'] || 0) + tax.tax_amount;
        else taxBreakdown[taxName] = (taxBreakdown[taxName] || 0) + tax.tax_amount;
      });
    });
    return taxBreakdown;
  }

  private formatCurrency(amount: number, withSymbol: boolean = true): string {
    const formatted = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    return withSymbol ? `₹ ${formatted}` : formatted;
  }

  private formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).replace(/ /g, '-');
  }

  private numberToWords(num: number): string {
    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    const inWords = (n: number) : string => {
        if (n < 0) return '';
        let str = '';
        if (n > 99) {
            str += a[Math.floor(n / 100)] + ' Hundred ';
            n %= 100;
        }
        if (n > 19) {
            str += b[Math.floor(n / 10)] + ' ' + a[n % 10];
        } else {
            str += a[n];
        }
        return str.trim();
    }

    const integer = Math.floor(num);
    const paise = Math.round((num - integer) * 100);

    let words = '';
    if (integer > 0) {
        let temp = integer;
        if (temp >= 10000000) {
            words += inWords(Math.floor(temp / 10000000)) + ' Crore ';
            temp %= 10000000;
        }
        if (temp >= 100000) {
            words += inWords(Math.floor(temp / 100000)) + ' Lakh ';
            temp %= 100000;
        }
        if (temp >= 1000) {
            words += inWords(Math.floor(temp / 1000)) + ' Thousand ';
            temp %= 1000;
        }
        if (temp > 0) {
            words += inWords(temp);
        }
    } else {
      words = "Zero";
    }
    
    // Capitalize first letter and add Rupees
    words = words.charAt(0).toUpperCase() + words.slice(1) + " Rupees";

    if (paise > 0) {
        words += ` And ${inWords(paise)} Paise`;
    }

    return words.replace(/  +/g, ' ').trim() + ' Only';
  }

  // --- PUBLIC INTERFACE FUNCTIONS ---

  async downloadInvoicePdf(invoice: InvoicePrintData): Promise<void> {
    const pdf = this.generateInvoicePdf(invoice);
    const fileName = `invoice_${invoice.invoice_number.replace(/[\/\\?%*:|"<>]/g, '_')}.pdf`;
    pdf.save(fileName);
  }

  async printInvoicePdf(invoice: InvoicePrintData): Promise<void> {
    const pdf = this.generateInvoicePdf(invoice);
    const pdfBlob = pdf.output('blob');
    const printWindow = window.open('', '_blank');
    
    if (printWindow) {
      const pdfUrl = URL.createObjectURL(pdfBlob);
      printWindow.document.write(`<html><body style="margin:0;"><iframe src="${pdfUrl}" style="width:100%; height:100vh; border:none;" onload="this.contentWindow.print();"></iframe></body></html>`);
      printWindow.document.close();
    }
  }
}
