/**
 * estimatePdfGenerator.js - Estimate PDF Export using jsPDF
 * ==========================================================
 * 
 * Phase 3 of the Estimate Workbench Architecture.
 * Generates professional client-ready PDF estimates.
 * 
 * IMPORTANT: This uses jsPDF exclusively as per architectural requirements.
 * No html2canvas or other PDF libraries should be used.
 */

import { jsPDF } from 'jspdf';

// TradeOS brand colors
const COLORS = {
  primary: [16, 185, 129], // Emerald 500 - RGB
  dark: [23, 23, 23], // Neutral 900
  text: [64, 64, 64], // Neutral 700
  light: [163, 163, 163], // Neutral 400
  white: [255, 255, 255],
  background: [245, 245, 245] // Neutral 100
};

/**
 * Generate a PDF estimate document
 * 
 * @param {Object} options Configuration options
 * @param {string} options.estimateName Name of the estimate
 * @param {Array} options.lineItems Array of line items
 * @param {Object} options.calculations Calculated totals
 * @param {Object} options.company Company info
 * @param {Object} options.client Client info (optional)
 * @param {number} options.taxRate Tax rate percentage
 * @param {number} options.markupPercent Markup percentage
 * @returns {jsPDF} The generated PDF document
 */
export const generateEstimatePDF = ({
  estimateName = 'Estimate',
  lineItems = [],
  calculations = {},
  company = {},
  client = null,
  taxRate = 13,
  markupPercent = 0,
  estimateNumber = null,
  validUntil = null,
  notes = ''
}) => {
  // Create new PDF document (Letter size, portrait)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  
  let yPos = margin;
  
  // Helper functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };
  
  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date || new Date());
  };
  
  const addNewPageIfNeeded = (requiredSpace) => {
    if (yPos + requiredSpace > pageHeight - margin - 30) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };
  
  // ============================================
  // HEADER SECTION
  // ============================================
  
  // Company logo placeholder (green bar)
  doc.setFillColor(...COLORS.primary);
  doc.rect(margin, yPos, 50, 10, 'F');
  
  // TradeOS text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...COLORS.white);
  doc.text('TradeOS', margin + 5, yPos + 7);
  
  // Estimate title
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(24);
  doc.text('ESTIMATE', pageWidth - margin, yPos + 8, { align: 'right' });
  
  yPos += 18;
  
  // Estimate number and date
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.light);
  
  const estimateNum = estimateNumber || `EST-${Date.now().toString().slice(-6)}`;
  doc.text(`Estimate #: ${estimateNum}`, pageWidth - margin, yPos, { align: 'right' });
  yPos += 5;
  doc.text(`Date: ${formatDate(new Date())}`, pageWidth - margin, yPos, { align: 'right' });
  
  if (validUntil) {
    yPos += 5;
    doc.text(`Valid Until: ${formatDate(validUntil)}`, pageWidth - margin, yPos, { align: 'right' });
  }
  
  yPos += 10;
  
  // ============================================
  // COMPANY & CLIENT INFO
  // ============================================
  
  // Company info (left side)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.dark);
  doc.text('FROM', margin, yPos);
  yPos += 5;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.text);
  
  const companyName = company.name || 'Your Company';
  const companyAddress = company.address || '';
  const companyPhone = company.phone || '';
  const companyEmail = company.email || '';
  
  doc.text(companyName, margin, yPos);
  if (companyAddress) {
    yPos += 4;
    doc.text(companyAddress, margin, yPos);
  }
  if (companyPhone) {
    yPos += 4;
    doc.text(companyPhone, margin, yPos);
  }
  if (companyEmail) {
    yPos += 4;
    doc.text(companyEmail, margin, yPos);
  }
  
  // Client info (right side)
  if (client) {
    let clientY = yPos - 18;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.dark);
    doc.text('TO', pageWidth / 2 + 10, clientY);
    clientY += 5;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.text);
    
    if (client.name) {
      doc.text(client.name, pageWidth / 2 + 10, clientY);
      clientY += 4;
    }
    if (client.address) {
      doc.text(client.address, pageWidth / 2 + 10, clientY);
      clientY += 4;
    }
    if (client.email) {
      doc.text(client.email, pageWidth / 2 + 10, clientY);
    }
  }
  
  yPos += 15;
  
  // ============================================
  // ESTIMATE NAME
  // ============================================
  
  doc.setFillColor(...COLORS.background);
  doc.roundedRect(margin, yPos, contentWidth, 12, 2, 2, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.dark);
  doc.text(estimateName, margin + 5, yPos + 8);
  
  yPos += 20;
  
  // ============================================
  // LINE ITEMS TABLE
  // ============================================
  
  // Table header
  const colWidths = {
    item: contentWidth * 0.45,
    qty: contentWidth * 0.10,
    unit: contentWidth * 0.15,
    rate: contentWidth * 0.15,
    amount: contentWidth * 0.15
  };
  
  // Header background
  doc.setFillColor(...COLORS.primary);
  doc.rect(margin, yPos, contentWidth, 8, 'F');
  
  // Header text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.white);
  
  let xPos = margin + 3;
  doc.text('Item', xPos, yPos + 5.5);
  xPos += colWidths.item;
  doc.text('Qty', xPos, yPos + 5.5);
  xPos += colWidths.qty;
  doc.text('Unit', xPos, yPos + 5.5);
  xPos += colWidths.unit;
  doc.text('Rate', xPos, yPos + 5.5);
  xPos += colWidths.rate;
  doc.text('Amount', xPos, yPos + 5.5);
  
  yPos += 10;
  
  // Group items by domain
  const groupedItems = {};
  lineItems.forEach(item => {
    const group = item.domain_name || 'Other';
    if (!groupedItems[group]) {
      groupedItems[group] = [];
    }
    groupedItems[group].push(item);
  });
  
  // Render grouped items
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  let rowIndex = 0;
  
  Object.entries(groupedItems).forEach(([groupName, items]) => {
    // Check if we need a new page
    addNewPageIfNeeded(8 + (items.length * 7));
    
    // Group header
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPos, contentWidth, 7, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.text);
    doc.text(groupName, margin + 3, yPos + 5);
    
    // Group subtotal
    const groupTotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    doc.text(formatCurrency(groupTotal), margin + contentWidth - 3, yPos + 5, { align: 'right' });
    
    yPos += 8;
    
    // Items in group
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.text);
    
    items.forEach((item, idx) => {
      addNewPageIfNeeded(7);
      
      // Alternate row background
      if (idx % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, yPos, contentWidth, 7, 'F');
      }
      
      const itemTotal = item.quantity * item.unit_price;
      
      xPos = margin + 3;
      
      // Item name (truncate if too long)
      let itemName = item.production_name || 'Item';
      if (itemName.length > 40) {
        itemName = itemName.substring(0, 37) + '...';
      }
      doc.text(itemName, xPos, yPos + 5);
      
      xPos += colWidths.item;
      doc.text(item.quantity.toString(), xPos, yPos + 5);
      
      xPos += colWidths.qty;
      doc.text(item.unit || 'ea', xPos, yPos + 5);
      
      xPos += colWidths.unit;
      doc.text(formatCurrency(item.unit_price), xPos, yPos + 5);
      
      xPos += colWidths.rate;
      doc.text(formatCurrency(itemTotal), xPos, yPos + 5);
      
      yPos += 7;
      rowIndex++;
    });
    
    yPos += 3;
  });
  
  yPos += 5;
  
  // ============================================
  // TOTALS SECTION
  // ============================================
  
  addNewPageIfNeeded(40);
  
  // Totals box
  const totalsX = margin + contentWidth - 80;
  const totalsWidth = 80;
  
  doc.setDrawColor(...COLORS.light);
  doc.setLineWidth(0.1);
  
  // Subtotal
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.text);
  doc.text('Subtotal:', totalsX, yPos);
  doc.text(formatCurrency(calculations.subtotal), totalsX + totalsWidth, yPos, { align: 'right' });
  yPos += 6;
  
  // Markup (if applicable)
  if (markupPercent > 0) {
    doc.text(`Markup (${markupPercent}%):`, totalsX, yPos);
    doc.text(formatCurrency(calculations.markup), totalsX + totalsWidth, yPos, { align: 'right' });
    yPos += 6;
  }
  
  // Tax
  doc.text(`Tax (${taxRate}%):`, totalsX, yPos);
  doc.text(formatCurrency(calculations.tax), totalsX + totalsWidth, yPos, { align: 'right' });
  yPos += 3;
  
  // Line
  doc.line(totalsX, yPos, totalsX + totalsWidth, yPos);
  yPos += 5;
  
  // Total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.primary);
  doc.text('TOTAL:', totalsX, yPos);
  doc.text(formatCurrency(calculations.total), totalsX + totalsWidth, yPos, { align: 'right' });
  
  yPos += 15;
  
  // ============================================
  // NOTES SECTION
  // ============================================
  
  if (notes) {
    addNewPageIfNeeded(25);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.dark);
    doc.text('Notes', margin, yPos);
    yPos += 5;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.text);
    
    // Split notes into lines
    const noteLines = doc.splitTextToSize(notes, contentWidth);
    doc.text(noteLines, margin, yPos);
    yPos += noteLines.length * 4 + 5;
  }
  
  // ============================================
  // FOOTER
  // ============================================
  
  // Footer on last page
  const footerY = pageHeight - 15;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.light);
  doc.text('Generated by TradeOS', margin, footerY);
  doc.text(`Page 1 of ${doc.getNumberOfPages()}`, pageWidth - margin, footerY, { align: 'right' });
  
  return doc;
};

/**
 * Download the PDF estimate
 */
export const downloadEstimatePDF = (options) => {
  const doc = generateEstimatePDF(options);
  const fileName = `${options.estimateName || 'Estimate'}_${new Date().toISOString().split('T')[0]}.pdf`;
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
