/**
 * estimatePdfGenerator.js - Professional Estimate PDF Export
 * ===========================================================
 * 
 * Estimate Workbench v1.1 - Phase 5: Professional PDF Generation
 * 
 * Generates commercial-quality PDF estimates suitable for submission
 * to clients and general contractors.
 * 
 * Layout includes:
 * - Company Logo & Information
 * - Client Information
 * - Project Information
 * - Estimate Header with Pricing Profile
 * - Line Items Table (Line, Item, Scope, Notes, Qty, Unit, Rate, Amount)
 * - Pricing Summary (Subtotal, Markup, Contingency, Tax, Total)
 * - Clarifications & Terms
 * - Signature Area
 * - Page Numbers
 */

import { jsPDF } from 'jspdf';

// Professional color scheme
const COLORS = {
  primary: [16, 185, 129], // Emerald 500
  primaryDark: [5, 150, 105], // Emerald 600
  dark: [23, 23, 23], // Near black
  text: [55, 65, 81], // Gray 700
  lightText: [107, 114, 128], // Gray 500
  muted: [156, 163, 175], // Gray 400
  white: [255, 255, 255],
  background: [249, 250, 251], // Gray 50
  border: [229, 231, 235], // Gray 200
  tableHeader: [243, 244, 246], // Gray 100
  alternateRow: [249, 250, 251] // Gray 50
};

// Page dimensions (Letter size in mm)
const PAGE = {
  width: 215.9,
  height: 279.4,
  marginLeft: 15,
  marginRight: 15,
  marginTop: 15,
  marginBottom: 20,
  get contentWidth() { return this.width - this.marginLeft - this.marginRight; }
};

// Format helpers
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2
  }).format(amount || 0);
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

/**
 * Generate a professional PDF estimate document
 */
export const generateEstimatePDF = ({
  estimateName = 'Estimate',
  estimateNumber = null,
  lineItems = [],
  calculations = {},
  companyProfile = {},
  clientInfo = {},
  projectInfo = {},
  pricingProfile = 'Standard',
  taxRate = 5,
  markupPercent = 15,
  contingencyPercent = 10,
  notes = '',
  clarifications = ''
}) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  let yPos = PAGE.marginTop;
  let pageNumber = 1;
  
  // Helper to check page break
  const checkPageBreak = (requiredHeight) => {
    if (yPos + requiredHeight > PAGE.height - PAGE.marginBottom - 15) {
      // Don't add footer during page break - all footers added at the end
      doc.addPage();
      pageNumber++;
      yPos = PAGE.marginTop;
      return true;
    }
    return false;
  };
  
  // Footer will be added at the end after all pages are generated

  // ============================================
  // HEADER SECTION - Company Logo & Title
  // ============================================
  
  // Logo area (green brand bar if no logo)
  if (companyProfile.logo) {
    try {
      doc.addImage(companyProfile.logo, 'AUTO', PAGE.marginLeft, yPos, 40, 15);
    } catch (e) {
      // Fallback to brand bar if logo fails
      doc.setFillColor(...COLORS.primary);
      doc.rect(PAGE.marginLeft, yPos, 45, 12, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(...COLORS.white);
      doc.text(companyProfile.name || 'TradeOS', PAGE.marginLeft + 4, yPos + 8);
    }
  } else {
    doc.setFillColor(...COLORS.primary);
    doc.rect(PAGE.marginLeft, yPos, 45, 12, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...COLORS.white);
    doc.text(companyProfile.name || 'TradeOS', PAGE.marginLeft + 4, yPos + 8);
  }
  
  // "ESTIMATE" title right-aligned
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(...COLORS.dark);
  doc.text('ESTIMATE', PAGE.width - PAGE.marginRight, yPos + 10, { align: 'right' });
  
  yPos += 18;
  
  // Estimate number and dates
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.lightText);
  
  const estNum = estimateNumber || projectInfo.estimate_number || `EST-${Date.now().toString().slice(-8)}`;
  doc.text(`Estimate #: ${estNum}`, PAGE.width - PAGE.marginRight, yPos, { align: 'right' });
  yPos += 4;
  
  if (projectInfo.revision && projectInfo.revision > 1) {
    doc.text(`Revision: ${projectInfo.revision}`, PAGE.width - PAGE.marginRight, yPos, { align: 'right' });
    yPos += 4;
  }
  
  const currentDate = projectInfo.date ? formatDate(projectInfo.date) : formatDate(new Date());
  doc.text(`Date: ${currentDate}`, PAGE.width - PAGE.marginRight, yPos, { align: 'right' });
  
  if (projectInfo.valid_until) {
    yPos += 4;
    doc.text(`Valid Until: ${formatDate(projectInfo.valid_until)}`, PAGE.width - PAGE.marginRight, yPos, { align: 'right' });
  }
  
  yPos += 12;
  
  // ============================================
  // COMPANY & CLIENT INFORMATION (Side by Side)
  // ============================================
  
  const infoBlockStart = yPos;
  const leftColX = PAGE.marginLeft;
  const rightColX = PAGE.width / 2 + 5;
  
  // Company Info (LEFT)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.primary);
  doc.text('FROM', leftColX, yPos);
  yPos += 5;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.dark);
  doc.text(companyProfile.name || 'Your Company', leftColX, yPos);
  yPos += 4;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.text);
  
  // Address
  if (companyProfile.address) {
    doc.text(companyProfile.address, leftColX, yPos);
    yPos += 4;
  }
  
  // City, Province, Postal
  const cityLine = [companyProfile.city, companyProfile.province, companyProfile.postal_code]
    .filter(Boolean).join(', ');
  if (cityLine) {
    doc.text(cityLine, leftColX, yPos);
    yPos += 4;
  }
  
  if (companyProfile.phone) {
    doc.text(`Phone: ${companyProfile.phone}`, leftColX, yPos);
    yPos += 4;
  }
  
  if (companyProfile.email) {
    doc.text(`Email: ${companyProfile.email}`, leftColX, yPos);
    yPos += 4;
  }
  
  if (companyProfile.website) {
    doc.text(companyProfile.website, leftColX, yPos);
    yPos += 4;
  }
  
  // Business numbers
  yPos += 2;
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.lightText);
  
  if (companyProfile.gst_number) {
    doc.text(`GST: ${companyProfile.gst_number}`, leftColX, yPos);
    yPos += 3;
  }
  
  if (companyProfile.wcb_number) {
    doc.text(`WCB: ${companyProfile.wcb_number}`, leftColX, yPos);
    yPos += 3;
  }
  
  if (companyProfile.gl_insurance) {
    doc.text(`GL Insurance: ${companyProfile.gl_insurance}`, leftColX, yPos);
    yPos += 3;
  }
  
  // Client Info (RIGHT)
  let clientY = infoBlockStart;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.primary);
  doc.text('TO', rightColX, clientY);
  clientY += 5;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.dark);
  doc.text(clientInfo.company || clientInfo.contact_name || 'Client', rightColX, clientY);
  clientY += 4;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.text);
  
  if (clientInfo.contact_name && clientInfo.company) {
    doc.text(`Attn: ${clientInfo.contact_name}`, rightColX, clientY);
    clientY += 4;
  }
  
  if (clientInfo.address) {
    doc.text(clientInfo.address, rightColX, clientY);
    clientY += 4;
  }
  
  const clientCityLine = [clientInfo.city, clientInfo.province, clientInfo.postal_code]
    .filter(Boolean).join(', ');
  if (clientCityLine) {
    doc.text(clientCityLine, rightColX, clientY);
    clientY += 4;
  }
  
  if (clientInfo.phone) {
    doc.text(`Phone: ${clientInfo.phone}`, rightColX, clientY);
    clientY += 4;
  }
  
  if (clientInfo.email) {
    doc.text(`Email: ${clientInfo.email}`, rightColX, clientY);
  }
  
  yPos = Math.max(yPos, clientY) + 10;
  
  // ============================================
  // PROJECT INFORMATION BAR
  // ============================================
  
  doc.setFillColor(...COLORS.tableHeader);
  doc.roundedRect(PAGE.marginLeft, yPos, PAGE.contentWidth, 18, 1, 1, 'F');
  
  const projectY = yPos + 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.dark);
  doc.text(projectInfo.name || estimateName, PAGE.marginLeft + 5, projectY);
  
  if (projectInfo.address) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.text);
    doc.text(projectInfo.address, PAGE.marginLeft + 5, projectY + 6);
  }
  
  // Pricing profile badge on right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.primary);
  doc.text(`${pricingProfile.toUpperCase()} RATES`, PAGE.width - PAGE.marginRight - 5, projectY, { align: 'right' });
  
  // Estimator
  const estimator = projectInfo.estimator || companyProfile.default_estimator;
  if (estimator) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.lightText);
    doc.text(`Prepared by: ${estimator}`, PAGE.width - PAGE.marginRight - 5, projectY + 6, { align: 'right' });
  }
  
  yPos += 24;
  
  // ============================================
  // LINE ITEMS TABLE
  // ============================================
  
  // Table column widths
  const cols = {
    line: 10,
    item: 50,
    scope: 35,
    notes: 30,
    qty: 18,
    unit: 15,
    rate: 22,
    amount: 25
  };
  
  // Table header
  doc.setFillColor(...COLORS.primary);
  doc.rect(PAGE.marginLeft, yPos, PAGE.contentWidth, 7, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.white);
  
  let xPos = PAGE.marginLeft + 2;
  doc.text('#', xPos, yPos + 5);
  xPos += cols.line;
  doc.text('PRODUCTION ITEM', xPos, yPos + 5);
  xPos += cols.item;
  doc.text('SCOPE', xPos, yPos + 5);
  xPos += cols.scope;
  doc.text('NOTES', xPos, yPos + 5);
  xPos += cols.notes;
  doc.text('QTY', xPos + cols.qty - 2, yPos + 5, { align: 'right' });
  xPos += cols.qty;
  doc.text('UNIT', xPos, yPos + 5);
  xPos += cols.unit;
  doc.text('RATE', xPos + cols.rate - 2, yPos + 5, { align: 'right' });
  xPos += cols.rate;
  doc.text('AMOUNT', xPos + cols.amount - 2, yPos + 5, { align: 'right' });
  
  yPos += 9;
  
  // Group items by domain
  const groupedItems = {};
  lineItems.forEach((item, idx) => {
    const group = item.domain_name || 'Other';
    if (!groupedItems[group]) {
      groupedItems[group] = [];
    }
    groupedItems[group].push({ ...item, lineNumber: idx + 1 });
  });
  
  // Render line items
  let lineNum = 1;
  
  Object.entries(groupedItems).forEach(([groupName, items]) => {
    checkPageBreak(10 + (items.length * 6));
    
    // Group header row
    doc.setFillColor(...COLORS.tableHeader);
    doc.rect(PAGE.marginLeft, yPos, PAGE.contentWidth, 6, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.dark);
    doc.text(groupName, PAGE.marginLeft + 2, yPos + 4.5);
    
    // Group total
    const groupTotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    doc.text(formatCurrency(groupTotal), PAGE.width - PAGE.marginRight - 2, yPos + 4.5, { align: 'right' });
    
    yPos += 7;
    
    // Items in group
    items.forEach((item, idx) => {
      checkPageBreak(6);
      
      // Alternate row shading
      if (idx % 2 === 0) {
        doc.setFillColor(...COLORS.alternateRow);
        doc.rect(PAGE.marginLeft, yPos - 0.5, PAGE.contentWidth, 6, 'F');
      }
      
      const itemTotal = item.quantity * item.unit_price;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.text);
      
      xPos = PAGE.marginLeft + 2;
      
      // Line number
      doc.setTextColor(...COLORS.lightText);
      doc.text(lineNum.toString(), xPos, yPos + 4);
      xPos += cols.line;
      
      // Production Item (truncate if needed)
      doc.setTextColor(...COLORS.dark);
      let itemName = item.production_name || 'Item';
      if (itemName.length > 28) itemName = itemName.substring(0, 25) + '...';
      doc.text(itemName, xPos, yPos + 4);
      xPos += cols.item;
      
      // Scope
      doc.setTextColor(...COLORS.text);
      let scope = item.scope || '';
      if (scope.length > 18) scope = scope.substring(0, 15) + '...';
      doc.text(scope, xPos, yPos + 4);
      xPos += cols.scope;
      
      // Notes
      let itemNotes = item.notes || '';
      if (itemNotes.length > 15) itemNotes = itemNotes.substring(0, 12) + '...';
      doc.text(itemNotes, xPos, yPos + 4);
      xPos += cols.notes;
      
      // Quantity
      doc.text(item.quantity.toString(), xPos + cols.qty - 2, yPos + 4, { align: 'right' });
      xPos += cols.qty;
      
      // Unit
      doc.text(item.unit || 'EA', xPos, yPos + 4);
      xPos += cols.unit;
      
      // Rate
      doc.text(formatCurrency(item.unit_price), xPos + cols.rate - 2, yPos + 4, { align: 'right' });
      xPos += cols.rate;
      
      // Amount
      doc.setFont('helvetica', 'bold');
      doc.text(formatCurrency(itemTotal), xPos + cols.amount - 2, yPos + 4, { align: 'right' });
      
      yPos += 6;
      lineNum++;
    });
    
    yPos += 2;
  });
  
  yPos += 8;
  
  // ============================================
  // PRICING SUMMARY
  // ============================================
  
  checkPageBreak(50);
  
  // Summary box on right side
  const summaryX = PAGE.marginLeft + PAGE.contentWidth - 85;
  const summaryWidth = 85;
  
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(summaryX, yPos, summaryWidth, 48, 2, 2, 'S');
  
  let summaryY = yPos + 6;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.dark);
  doc.text('PRICING SUMMARY', summaryX + summaryWidth / 2, summaryY, { align: 'center' });
  
  summaryY += 7;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.text);
  
  // Subtotal
  doc.text('Subtotal:', summaryX + 5, summaryY);
  doc.text(formatCurrency(calculations.subtotal || 0), summaryX + summaryWidth - 5, summaryY, { align: 'right' });
  summaryY += 5;
  
  // Markup
  if (markupPercent > 0) {
    doc.text(`Markup (${markupPercent}%):`, summaryX + 5, summaryY);
    doc.text(formatCurrency(calculations.markup || 0), summaryX + summaryWidth - 5, summaryY, { align: 'right' });
    summaryY += 5;
  }
  
  // Contingency
  if (contingencyPercent > 0) {
    doc.text(`Contingency (${contingencyPercent}%):`, summaryX + 5, summaryY);
    doc.text(formatCurrency(calculations.contingency || 0), summaryX + summaryWidth - 5, summaryY, { align: 'right' });
    summaryY += 5;
  }
  
  // Tax
  doc.text(`GST (${taxRate}%):`, summaryX + 5, summaryY);
  doc.text(formatCurrency(calculations.tax || 0), summaryX + summaryWidth - 5, summaryY, { align: 'right' });
  summaryY += 3;
  
  // Separator line
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.5);
  doc.line(summaryX + 5, summaryY, summaryX + summaryWidth - 5, summaryY);
  summaryY += 5;
  
  // Total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.primary);
  doc.text('TOTAL:', summaryX + 5, summaryY);
  doc.text(formatCurrency(calculations.total || 0), summaryX + summaryWidth - 5, summaryY, { align: 'right' });
  
  yPos += 55;
  
  // ============================================
  // NOTES (if provided)
  // ============================================
  
  if (notes && notes.trim()) {
    checkPageBreak(20);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.dark);
    doc.text('NOTES', PAGE.marginLeft, yPos);
    yPos += 5;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.text);
    
    const noteLines = doc.splitTextToSize(notes, PAGE.contentWidth);
    noteLines.forEach(line => {
      checkPageBreak(5);
      doc.text(line, PAGE.marginLeft, yPos);
      yPos += 4;
    });
    
    yPos += 5;
  }
  
  // ============================================
  // CLARIFICATIONS & QUALIFICATIONS
  // ============================================
  
  if (clarifications && clarifications.trim()) {
    checkPageBreak(25);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.dark);
    doc.text('CLARIFICATIONS & QUALIFICATIONS', PAGE.marginLeft, yPos);
    yPos += 5;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.text);
    
    const clarificationLines = clarifications.split('\n');
    clarificationLines.forEach(line => {
      checkPageBreak(4);
      doc.text(line.trim(), PAGE.marginLeft, yPos);
      yPos += 4;
    });
    
    yPos += 5;
  }
  
  // ============================================
  // TERMS & CONDITIONS
  // ============================================
  
  checkPageBreak(25);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.dark);
  doc.text('TERMS & CONDITIONS', PAGE.marginLeft, yPos);
  yPos += 5;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.lightText);
  
  const defaultTerms = companyProfile.default_terms || 
    '• Pricing valid for 30 days from date of estimate.\n• Labour only unless otherwise noted.\n• Materials by others unless specified.\n• Subject to final drawings and specifications.\n• Excludes permits unless noted.';
  
  const termLines = defaultTerms.split('\n');
  termLines.forEach(line => {
    checkPageBreak(4);
    doc.text(line.trim(), PAGE.marginLeft, yPos);
    yPos += 4;
  });
  
  yPos += 10;
  
  // ============================================
  // SIGNATURE AREA
  // ============================================
  
  checkPageBreak(40);
  
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  
  // Accepted by section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.dark);
  doc.text('ACCEPTED BY:', PAGE.marginLeft, yPos);
  
  yPos += 15;
  
  // Signature line
  doc.line(PAGE.marginLeft, yPos, PAGE.marginLeft + 70, yPos);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.lightText);
  doc.text('Signature', PAGE.marginLeft, yPos + 5);
  
  // Date line
  doc.line(PAGE.marginLeft + 85, yPos, PAGE.marginLeft + 130, yPos);
  doc.text('Date', PAGE.marginLeft + 85, yPos + 5);
  
  // Print name line
  yPos += 15;
  doc.line(PAGE.marginLeft, yPos, PAGE.marginLeft + 70, yPos);
  doc.text('Print Name', PAGE.marginLeft, yPos + 5);
  
  // Title line
  doc.line(PAGE.marginLeft + 85, yPos, PAGE.marginLeft + 130, yPos);
  doc.text('Title', PAGE.marginLeft + 85, yPos + 5);
  
  // Add footer to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const footerY = PAGE.height - 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.text(companyProfile.name || 'TradeOS', PAGE.marginLeft, footerY);
    doc.text(`Page ${i} of ${totalPages}`, PAGE.width - PAGE.marginRight, footerY, { align: 'right' });
  }
  
  return doc;
};

/**
 * Download the PDF estimate
 */
export const downloadEstimatePDF = (options) => {
  const doc = generateEstimatePDF(options);
  const fileName = `${options.estimateName || 'Estimate'}_${options.estimateNumber || 'draft'}.pdf`;
  doc.save(fileName);
  return fileName;
};

/**
 * Open PDF in new tab for preview
 */
export const previewEstimatePDF = (options) => {
  const doc = generateEstimatePDF(options);
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
  return pdfUrl;
};

export default {
  generateEstimatePDF,
  downloadEstimatePDF,
  previewEstimatePDF
};
