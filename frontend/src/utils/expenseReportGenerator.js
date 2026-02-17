import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Generate a tax-ready expense report PDF
 */
export const generateExpenseReportPDF = (expenses, options = {}) => {
  const {
    companyName = 'TradeOS',
    fiscalYear = new Date().getFullYear(),
    userName = 'Contractor',
    dateRange = null
  } = options;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Colors
  const primaryColor = [90, 143, 184]; // Steel blue
  const darkColor = [13, 13, 13];
  
  // ===== HEADER =====
  doc.setFillColor(...darkColor);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('EXPENSE REPORT', 20, 25);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fiscal Year ${fiscalYear}`, 20, 35);
  
  doc.setFontSize(10);
  doc.text(companyName, pageWidth - 20, 20, { align: 'right' });
  doc.text(userName, pageWidth - 20, 28, { align: 'right' });
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 20, 36, { align: 'right' });
  
  // ===== SUMMARY SECTION =====
  let y = 55;
  
  // Calculate totals
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.total_amount || 0), 0);
  const totalTax = expenses.reduce((sum, e) => sum + (e.tax_amount || 0), 0);
  const totalDeductible = expenses.filter(e => e.is_deductible).reduce((sum, e) => sum + (e.total_amount || 0), 0);
  
  // Category breakdown
  const categoryTotals = {};
  expenses.forEach(e => {
    const cat = e.category || 'Other';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + (e.total_amount || 0);
  });
  
  // Summary box
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(15, y, pageWidth - 30, 40, 3, 3, 'F');
  
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('SUMMARY', 20, y + 10);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  const summaryItems = [
    { label: 'Total Expenses', value: `$${totalExpenses.toFixed(2)}` },
    { label: 'Total Tax Paid', value: `$${totalTax.toFixed(2)}` },
    { label: 'Tax Deductible', value: `$${totalDeductible.toFixed(2)}` },
    { label: 'Receipt Count', value: expenses.length.toString() }
  ];
  
  summaryItems.forEach((item, i) => {
    const xPos = 20 + (i * 45);
    doc.text(item.label, xPos, y + 22);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(item.value, xPos, y + 32);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
  });
  
  y += 50;
  
  // ===== CATEGORY BREAKDOWN =====
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Expense by Category', 20, y);
  y += 8;
  
  const categoryData = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([category, amount]) => [
      category,
      `$${amount.toFixed(2)}`,
      `${((amount / totalExpenses) * 100).toFixed(1)}%`
    ]);
  
  doc.autoTable({
    startY: y,
    head: [['Category', 'Amount', '% of Total']],
    body: categoryData,
    theme: 'striped',
    headStyles: { 
      fillColor: primaryColor,
      textColor: 255,
      fontStyle: 'bold'
    },
    styles: { fontSize: 9 },
    margin: { left: 20, right: 20 }
  });
  
  y = doc.lastAutoTable.finalY + 15;
  
  // ===== TAX BREAKDOWN =====
  const taxBreakdown = {};
  expenses.forEach(e => {
    const taxType = e.tax_type || 'Unknown';
    if (!taxBreakdown[taxType]) {
      taxBreakdown[taxType] = { count: 0, amount: 0 };
    }
    taxBreakdown[taxType].count++;
    taxBreakdown[taxType].amount += (e.tax_amount || 0);
  });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Tax Summary', 20, y);
  y += 8;
  
  const taxData = Object.entries(taxBreakdown).map(([type, data]) => [
    type,
    data.count.toString(),
    `$${data.amount.toFixed(2)}`
  ]);
  
  doc.autoTable({
    startY: y,
    head: [['Tax Type', 'Transactions', 'Total Tax']],
    body: taxData,
    theme: 'striped',
    headStyles: { 
      fillColor: primaryColor,
      textColor: 255,
      fontStyle: 'bold'
    },
    styles: { fontSize: 9 },
    margin: { left: 20, right: 20 }
  });
  
  // ===== DETAILED EXPENSES (New Page) =====
  doc.addPage();
  
  doc.setFillColor(...darkColor);
  doc.rect(0, 0, pageWidth, 25, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('DETAILED EXPENSE LIST', 20, 17);
  
  y = 35;
  
  const expenseData = expenses.map(e => [
    e.receipt_date ? new Date(e.receipt_date).toLocaleDateString() : 'N/A',
    (e.vendor_name || 'Unknown').substring(0, 25),
    e.category || 'Other',
    `$${(e.subtotal || 0).toFixed(2)}`,
    `$${(e.tax_amount || 0).toFixed(2)}`,
    `$${(e.total_amount || 0).toFixed(2)}`,
    e.is_deductible ? 'Yes' : 'No'
  ]);
  
  doc.autoTable({
    startY: y,
    head: [['Date', 'Vendor', 'Category', 'Subtotal', 'Tax', 'Total', 'Deductible']],
    body: expenseData,
    theme: 'striped',
    headStyles: { 
      fillColor: primaryColor,
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8
    },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 40 },
      2: { cellWidth: 30 },
      3: { cellWidth: 22 },
      4: { cellWidth: 20 },
      5: { cellWidth: 22 },
      6: { cellWidth: 18 }
    },
    margin: { left: 15, right: 15 }
  });
  
  // ===== FOOTER =====
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount} | Generated by TradeOS | ${new Date().toLocaleString()}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  // Save
  const filename = `Expense_Report_${fiscalYear}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
  
  return filename;
};

/**
 * Generate a quarterly tax summary
 */
export const generateQuarterlyReport = (expenses, quarter, year, options = {}) => {
  const quarterExpenses = expenses.filter(e => {
    if (!e.receipt_date) return false;
    const date = new Date(e.receipt_date);
    const expenseQuarter = Math.ceil((date.getMonth() + 1) / 3);
    return expenseQuarter === quarter && date.getFullYear() === year;
  });
  
  return generateExpenseReportPDF(quarterExpenses, {
    ...options,
    fiscalYear: `${year} Q${quarter}`
  });
};
