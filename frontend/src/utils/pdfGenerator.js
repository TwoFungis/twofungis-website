import { jsPDF } from 'jspdf';

// Professional Invoice/Quote PDF Generator
export const generateInvoicePDF = (quote, companyInfo = {}) => {
  const doc = new jsPDF();
  
  // Colors
  const primaryColor = [90, 143, 184]; // Steel blue
  const darkColor = [45, 45, 45];
  const lightGray = [128, 128, 128];
  const borderColor = [200, 200, 200];
  
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  
  // Header background
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 50, 'F');
  
  // Company name / Logo area
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(companyInfo.company_name || 'TradeOS', margin, 30);
  
  // Document type badge
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const docType = quote.status === 'approved' ? 'INVOICE' : 'QUOTE';
  doc.text(docType, pageWidth - margin - 30, 30);
  
  // Quote/Invoice number
  doc.setTextColor(...darkColor);
  doc.setFontSize(12);
  let y = 65;
  
  // Left side - From
  doc.setFont('helvetica', 'bold');
  doc.text('FROM', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  y += 7;
  doc.text(companyInfo.company_name || 'Your Company', margin, y);
  y += 5;
  doc.setTextColor(...lightGray);
  if (companyInfo.address) {
    doc.text(companyInfo.address, margin, y);
    y += 5;
  }
  if (companyInfo.phone) {
    doc.text(companyInfo.phone, margin, y);
    y += 5;
  }
  if (companyInfo.email) {
    doc.text(companyInfo.email, margin, y);
  }
  
  // Right side - To & Details
  y = 65;
  const rightCol = pageWidth - margin - 60;
  doc.setTextColor(...darkColor);
  doc.setFont('helvetica', 'bold');
  doc.text('TO', rightCol, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  y += 7;
  doc.text(quote.client_gc || 'Client Name', rightCol, y);
  y += 5;
  if (quote.client_email) {
    doc.setTextColor(...lightGray);
    doc.text(quote.client_email, rightCol, y);
  }
  
  // Quote details box
  y = 65;
  const detailsX = pageWidth / 2 - 10;
  doc.setTextColor(...darkColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('DETAILS', detailsX, y);
  doc.setFont('helvetica', 'normal');
  y += 7;
  doc.setTextColor(...lightGray);
  doc.text(`${docType} #: ${quote.quote_number || 'N/A'}`, detailsX, y);
  y += 5;
  doc.text(`Date: ${new Date(quote.created_at || Date.now()).toLocaleDateString()}`, detailsX, y);
  y += 5;
  if (quote.region) {
    doc.text(`Region: ${quote.region}`, detailsX, y);
  }
  
  // Line items header
  y = 115;
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, y - 5, contentWidth, 10, 'F');
  doc.setTextColor(...darkColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('ITEM', margin + 3, y + 2);
  doc.text('QTY', margin + 90, y + 2);
  doc.text('UNIT', margin + 110, y + 2);
  doc.text('RATE', margin + 130, y + 2);
  doc.text('AMOUNT', pageWidth - margin - 25, y + 2);
  
  // Line items
  y += 15;
  doc.setFont('helvetica', 'normal');
  const lines = quote.lines || [];
  
  lines.forEach((line, index) => {
    if (y > pageHeight - 80) {
      doc.addPage();
      y = 30;
    }
    
    // Alternate row background
    if (index % 2 === 0) {
      doc.setFillColor(252, 252, 252);
      doc.rect(margin, y - 4, contentWidth, 8, 'F');
    }
    
    doc.setTextColor(...darkColor);
    // Truncate long item names
    const itemName = line.scope_item || line.description || 'Item';
    const truncatedName = itemName.length > 35 ? itemName.substring(0, 35) + '...' : itemName;
    doc.text(truncatedName, margin + 3, y);
    doc.text(String(line.qty || 1), margin + 90, y);
    doc.text(line.unit || 'EA', margin + 110, y);
    doc.text(`$${(line.unit_price || 0).toFixed(2)}`, margin + 130, y);
    doc.text(`$${(line.line_total || 0).toFixed(2)}`, pageWidth - margin - 25, y);
    
    y += 10;
  });
  
  // Totals section
  y += 10;
  doc.setDrawColor(...borderColor);
  doc.line(pageWidth - 80, y, pageWidth - margin, y);
  
  y += 10;
  doc.setTextColor(...lightGray);
  doc.setFontSize(10);
  doc.text('Subtotal:', pageWidth - 80, y);
  doc.setTextColor(...darkColor);
  doc.text(`$${(quote.subtotal || 0).toFixed(2)}`, pageWidth - margin - 25, y);
  
  if (quote.markup_amount && quote.markup_amount > 0) {
    y += 8;
    doc.setTextColor(...lightGray);
    doc.text(`Markup (${quote.profit_target_pct || 0}%):`, pageWidth - 80, y);
    doc.setTextColor(...darkColor);
    doc.text(`$${(quote.markup_amount || 0).toFixed(2)}`, pageWidth - margin - 25, y);
  }
  
  y += 12;
  doc.setFillColor(...primaryColor);
  doc.rect(pageWidth - 85, y - 5, 65, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TOTAL:', pageWidth - 80, y + 3);
  doc.text(`$${(quote.total || 0).toFixed(2)}`, pageWidth - margin - 25, y + 3);
  
  // Terms & Exclusions
  y += 25;
  if (y > pageHeight - 60) {
    doc.addPage();
    y = 30;
  }
  
  if (quote.terms) {
    doc.setTextColor(...darkColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('TERMS & CONDITIONS', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...lightGray);
    y += 7;
    
    const termsLines = doc.splitTextToSize(quote.terms, contentWidth);
    termsLines.forEach((line) => {
      if (y > pageHeight - 30) {
        doc.addPage();
        y = 30;
      }
      doc.text(line, margin, y);
      y += 5;
    });
  }
  
  if (quote.exclusions) {
    y += 8;
    doc.setTextColor(...darkColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('EXCLUSIONS', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...lightGray);
    y += 7;
    
    const exclusionLines = doc.splitTextToSize(quote.exclusions, contentWidth);
    exclusionLines.forEach((line) => {
      if (y > pageHeight - 30) {
        doc.addPage();
        y = 30;
      }
      doc.text(line, margin, y);
      y += 5;
    });
  }
  
  // Footer
  const footerY = pageHeight - 15;
  doc.setTextColor(...lightGray);
  doc.setFontSize(8);
  doc.text('Generated by TradeOS™ - Built for Builders', margin, footerY);
  doc.text(`Page 1`, pageWidth - margin - 15, footerY);
  
  return doc;
};

// Generate and download PDF
export const downloadQuotePDF = (quote, companyInfo = {}) => {
  const doc = generateInvoicePDF(quote, companyInfo);
  const filename = `${quote.quote_number || 'quote'}_${quote.client_gc || 'client'}.pdf`.replace(/\s+/g, '_');
  doc.save(filename);
};

// Generate PDF as blob for preview
export const getQuotePDFBlob = (quote, companyInfo = {}) => {
  const doc = generateInvoicePDF(quote, companyInfo);
  return doc.output('blob');
};

// Project Summary PDF
export const generateProjectSummaryPDF = (project, milestones = [], companyInfo = {}) => {
  const doc = new jsPDF();
  
  const primaryColor = [90, 143, 184];
  const darkColor = [45, 45, 45];
  const lightGray = [128, 128, 128];
  const successColor = [34, 197, 94];
  const warningColor = [234, 179, 8];
  
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  
  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 45, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('PROJECT SUMMARY', margin, 28);
  
  let y = 60;
  
  // Project Info
  doc.setTextColor(...darkColor);
  doc.setFontSize(16);
  doc.text(project.name || 'Project', margin, y);
  y += 8;
  doc.setFontSize(10);
  doc.setTextColor(...lightGray);
  doc.text(`Client: ${project.client_gc || 'N/A'}`, margin, y);
  y += 5;
  doc.text(`Region: ${project.region || 'N/A'}`, margin, y);
  
  // Financial Summary Box
  y += 20;
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, y, contentWidth, 40, 'F');
  
  const boxY = y + 12;
  const col1 = margin + 10;
  const col2 = margin + 60;
  const col3 = margin + 110;
  
  doc.setTextColor(...darkColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  
  doc.text('Contract Value', col1, boxY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.text(`$${(project.contract_value || 0).toLocaleString()}`, col1, boxY + 10);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Approved COs', col2, boxY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.text(`$${(project.approved_cos || 0).toLocaleString()}`, col2, boxY + 10);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Total Value', col3, boxY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  const totalValue = (project.contract_value || 0) + (project.approved_cos || 0);
  doc.text(`$${totalValue.toLocaleString()}`, col3, boxY + 10);
  
  // Progress
  y += 50;
  doc.setTextColor(...darkColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('PROJECT PROGRESS', margin, y);
  
  y += 10;
  // Progress bar
  doc.setFillColor(220, 220, 220);
  doc.rect(margin, y, contentWidth, 8, 'F');
  doc.setFillColor(...successColor);
  const progressWidth = (contentWidth * (project.percent_complete || 0)) / 100;
  doc.rect(margin, y, progressWidth, 8, 'F');
  
  y += 15;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...lightGray);
  doc.text(`${project.percent_complete || 0}% Complete`, margin, y);
  doc.text(`Margin: ${project.forecast_margin || 0}%`, margin + 60, y);
  
  // Milestones
  if (milestones.length > 0) {
    y += 20;
    doc.setTextColor(...darkColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('MILESTONES', margin, y);
    
    y += 10;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, y - 4, contentWidth, 8, 'F');
    doc.text('Milestone', margin + 3, y + 1);
    doc.text('Value', margin + 100, y + 1);
    doc.text('Status', margin + 140, y + 1);
    
    y += 10;
    doc.setFont('helvetica', 'normal');
    
    milestones.forEach((m) => {
      doc.setTextColor(...darkColor);
      doc.text(m.name || 'Milestone', margin + 3, y);
      doc.text(`$${(m.milestone_value || 0).toLocaleString()}`, margin + 100, y);
      
      // Status color
      if (m.status === 'approved' || m.status === 'paid') {
        doc.setTextColor(...successColor);
      } else if (m.status === 'submitted') {
        doc.setTextColor(...primaryColor);
      } else {
        doc.setTextColor(...lightGray);
      }
      doc.text(m.status?.toUpperCase() || 'DRAFT', margin + 140, y);
      
      y += 8;
    });
  }
  
  // Footer
  const footerY = doc.internal.pageSize.height - 15;
  doc.setTextColor(...lightGray);
  doc.setFontSize(8);
  doc.text(`Generated ${new Date().toLocaleDateString()} by TradeOS™`, margin, footerY);
  
  return doc;
};

export const downloadProjectPDF = (project, milestones = [], companyInfo = {}) => {
  const doc = generateProjectSummaryPDF(project, milestones, companyInfo);
  const filename = `project_${project.name || 'summary'}.pdf`.replace(/\s+/g, '_');
  doc.save(filename);
};
