import jsPDF from 'jspdf';
import { Trip, ReportPeriod, TripCategory, Expense, ReportType } from '../types';
import { format, startOfMonth, startOfQuarter, startOfYear, endOfMonth, endOfQuarter, endOfYear } from 'date-fns';
import { StorageService } from './StorageService';

export class PDFService {
  static generatePDF(
    trips: Trip[],
    expenses: Expense[],
    reportType: ReportType,
    period: ReportPeriod,
    startDate: Date,
    endDate: Date,
    selectedCategory?: TripCategory
  ): void {
    const doc = new jsPDF();
    
    // Determine fileName based on report type
    let fileName = '';
    
    if (reportType === ReportType.Mileage) {
      fileName = `MileageReport_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      this.addMileageSection(doc, trips, period, startDate, endDate, selectedCategory);
    } else if (reportType === ReportType.Expenses) {
      fileName = `ExpenseReport_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      this.addExpenseSection(doc, expenses, period, startDate, endDate);
    } else {
      // Combined
      fileName = `CombinedReport_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      this.addMileageSection(doc, trips, period, startDate, endDate, selectedCategory);
      this.addExpenseSection(doc, expenses, period, startDate, endDate, true);
      
      // Add combined totals
      const totalMileage = trips.reduce((sum, t) => sum + t.totalDeduction, 0);
      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
      const grandTotal = totalMileage + totalExpenses;
      
      let yPos = doc.internal.pageSize.height - 40;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setLineWidth(0.5);
      doc.line(14, yPos, 200, yPos);
      yPos += 10;
      doc.text('Grand Total:', 150, yPos);
      doc.text(`$${grandTotal.toFixed(2)}`, 170, yPos);
    }
    
    // Save PDF
    doc.save(fileName);
  }

  private static addMileageSection(
    doc: jsPDF,
    trips: Trip[],
    period: ReportPeriod,
    startDate: Date,
    endDate: Date,
    selectedCategory?: TripCategory,
    isCombined: boolean = false
  ): void {
    let yPos = isCombined ? doc.internal.pageSize.height - 40 : 20;
    
    if (isCombined) {
      // Add new page if we're in combined mode and need space
      if (yPos < 100) {
        doc.addPage();
        yPos = 20;
      } else {
        yPos += 30;
      }
    }
    
    // Header
    doc.setFontSize(isCombined ? 18 : 24);
    doc.setFont('helvetica', 'bold');
    doc.text(isCombined ? 'Mileage Expenses' : 'Business Expense Mileage Report', 105, yPos, { align: 'center' });
    yPos += 10;
    
    // Period
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    let periodText: string = period;
    if (period === ReportPeriod.Custom) {
      periodText = `${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`;
    }
    doc.text(`Period: ${periodText}`, 14, yPos);
    yPos += 15;
    
    if (trips.length === 0) {
      doc.setFontSize(10);
      doc.text('No mileage trips found for this period.', 14, yPos);
      return;
    }
    
    // Filter trips by category if needed
    let filteredTrips = trips;
    if (selectedCategory) {
      filteredTrips = trips.filter(t => t.category === selectedCategory);
    }
    
    // Table headers
    const headers = ['Date', 'Start Location', 'End Location', 'Miles', 'Category', 'Rate', 'Amount'];
    const columnWidths = [25, 55, 55, 20, 25, 20, 25];
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    let xPos = 14;
    headers.forEach((header, i) => {
      doc.text(header, xPos, yPos);
      xPos += columnWidths[i];
    });
    
    // Draw line under headers
    doc.setLineWidth(0.5);
    doc.line(14, yPos + 3, 200, yPos + 3);
    yPos += 10;
    
    // Table rows
    doc.setFont('helvetica', 'normal');
    let totalMiles = 0;
    let totalAmount = 0;
    
    filteredTrips.forEach((trip) => {
      if (yPos > (doc.internal.pageSize.height - 30)) {
        doc.addPage();
        yPos = 20;
      }
      
      xPos = 14;
      
      // Date
      doc.text(format(new Date(trip.startDate), 'MM/dd/yy'), xPos, yPos);
      xPos += columnWidths[0];
      
      // Start Location
      const startLoc = this.truncateText(trip.startLocation || '', 40);
      doc.text(startLoc, xPos, yPos);
      xPos += columnWidths[1];
      
      // End Location
      const endLoc = this.truncateText(trip.endLocation || '', 40);
      doc.text(endLoc, xPos, yPos);
      xPos += columnWidths[2];
      
      // Miles
      doc.text(trip.distance.toFixed(2), xPos, yPos);
      totalMiles += trip.distance;
      xPos += columnWidths[3];
      
      // Category
      doc.text(trip.category, xPos, yPos);
      xPos += columnWidths[4];
      
      // Rate
      doc.text(`$${trip.mileageRate.toFixed(2)}`, xPos, yPos);
      xPos += columnWidths[5];
      
      // Amount
      doc.text(`$${trip.totalDeduction.toFixed(2)}`, xPos, yPos);
      totalAmount += trip.totalDeduction;
      
      yPos += 7;
    });
    
    // Total line
    yPos += 3;
    doc.setLineWidth(0.5);
    doc.line(14, yPos, 200, yPos);
    yPos += 7;
    
    // Totals
    doc.setFont('helvetica', 'bold');
    xPos = 14 + columnWidths[0] + columnWidths[1] + columnWidths[2];
    doc.text('Total:', xPos, yPos);
    xPos += columnWidths[3];
    doc.text(totalMiles.toFixed(2), xPos, yPos);
    xPos += columnWidths[4] + columnWidths[5];
    doc.text(`$${totalAmount.toFixed(2)}`, xPos, yPos);
  }

  private static addExpenseSection(
    doc: jsPDF,
    expenses: Expense[],
    period: ReportPeriod,
    startDate: Date,
    endDate: Date,
    isCombined: boolean = false
  ): void {
    let yPos = isCombined ? doc.internal.pageSize.height - 40 : 20;
    
    if (isCombined) {
      if (yPos < 100) {
        doc.addPage();
        yPos = 20;
      } else {
        yPos += 30;
      }
    }
    
    // Header
    doc.setFontSize(isCombined ? 18 : 24);
    doc.setFont('helvetica', 'bold');
    doc.text(isCombined ? 'Business Expenses' : 'Business Expense Report', 105, yPos, { align: 'center' });
    yPos += 10;
    
    // Period (only show if not combined, already shown in mileage section)
    if (!isCombined) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      let periodText: string = period;
      if (period === ReportPeriod.Custom) {
        periodText = `${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`;
      }
      doc.text(`Period: ${periodText}`, 14, yPos);
      yPos += 15;
    } else {
      yPos += 10;
    }
    
    if (expenses.length === 0) {
      doc.setFontSize(10);
      doc.text('No expenses found for this period.', 14, yPos);
      return;
    }
    
    // Table headers
    const headers = ['Date', 'Category', 'Description', 'Amount', 'Trip'];
    const columnWidths = [25, 40, 65, 25, 45];
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    let xPos = 14;
    headers.forEach((header, i) => {
      doc.text(header, xPos, yPos);
      xPos += columnWidths[i];
    });
    
    // Draw line under headers
    doc.setLineWidth(0.5);
    doc.line(14, yPos + 3, 200, yPos + 3);
    yPos += 10;
    
    // Table rows
    doc.setFont('helvetica', 'normal');
    let totalAmount = 0;
    
    expenses.forEach((expense) => {
      if (yPos > (doc.internal.pageSize.height - 30)) {
        doc.addPage();
        yPos = 20;
      }
      
      xPos = 14;
      
      // Date
      doc.text(format(new Date(expense.date), 'MM/dd/yy'), xPos, yPos);
      xPos += columnWidths[0];
      
      // Category
      doc.text(this.truncateText(expense.category, 30), xPos, yPos);
      xPos += columnWidths[1];
      
      // Description
      doc.text(this.truncateText(expense.description || '', 50), xPos, yPos);
      xPos += columnWidths[2];
      
      // Amount
      doc.text(`$${expense.amount.toFixed(2)}`, xPos, yPos);
      totalAmount += expense.amount;
      xPos += columnWidths[3];
      
      // Trip link
      if (expense.tripId) {
        const trip = StorageService.getTrips().find(t => t.id === expense.tripId);
        if (trip) {
          doc.text(this.truncateText(`${format(new Date(trip.startDate), 'MM/dd/yy')}`, 30), xPos, yPos);
        } else {
          doc.text('-', xPos, yPos);
        }
      } else {
        doc.text('-', xPos, yPos);
      }
      
      yPos += 7;
    });
    
    // Total line
    yPos += 3;
    doc.setLineWidth(0.5);
    doc.line(14, yPos, 200, yPos);
    yPos += 7;
    
    // Totals
    doc.setFont('helvetica', 'bold');
    xPos = 14 + columnWidths[0] + columnWidths[1] + columnWidths[2];
    doc.text('Total:', xPos, yPos);
    xPos += columnWidths[3];
    doc.text(`$${totalAmount.toFixed(2)}`, xPos, yPos);
  }
  
  private static truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }
  
  static getDateRangeForPeriod(period: ReportPeriod): { start: Date; end: Date } {
    const now = new Date();
    
    switch (period) {
      case ReportPeriod.Month:
        return {
          start: startOfMonth(now),
          end: endOfMonth(now)
        };
      case ReportPeriod.Quarter:
        return {
          start: startOfQuarter(now),
          end: endOfQuarter(now)
        };
      case ReportPeriod.Year:
        return {
          start: startOfYear(now),
          end: endOfYear(now)
        };
      default:
        return {
          start: now,
          end: now
        };
    }
  }
}

