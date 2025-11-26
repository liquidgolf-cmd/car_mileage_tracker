import jsPDF from 'jspdf';
import { Trip, ReportPeriod, TripCategory } from '../types';
import { format, startOfMonth, startOfQuarter, startOfYear, endOfMonth, endOfQuarter, endOfYear } from 'date-fns';

export class PDFService {
  static generatePDF(
    trips: Trip[],
    period: ReportPeriod,
    startDate: Date,
    endDate: Date,
    selectedCategory?: TripCategory
  ): void {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Business Expense Mileage Report', 105, 20, { align: 'center' });
    
    // Period
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    let periodText: string = period;
    if (period === ReportPeriod.Custom) {
      periodText = `${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`;
    }
    doc.text(`Period: ${periodText}`, 14, 35);
    
    // Filter trips by category if needed
    let filteredTrips = trips;
    if (selectedCategory) {
      filteredTrips = trips.filter(t => t.category === selectedCategory);
    }
    
    // Table headers
    const headers = ['Date', 'Start Location', 'End Location', 'Miles', 'Category', 'Rate', 'Amount'];
    const columnWidths = [25, 55, 55, 20, 25, 20, 25];
    let yPos = 50;
    
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
      if (yPos > 270) {
        // New page
        doc.addPage();
        yPos = 20;
      }
      
      xPos = 14;
      
      // Date
      doc.text(format(new Date(trip.startDate), 'MM/dd/yy'), xPos, yPos);
      xPos += columnWidths[0];
      
      // Start Location (truncate if needed)
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
    
    // Save PDF
    const fileName = `MileageReport_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    doc.save(fileName);
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

