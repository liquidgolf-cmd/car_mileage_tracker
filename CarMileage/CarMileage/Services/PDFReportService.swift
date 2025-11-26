//
//  PDFReportService.swift
//  CarMileage
//
//  Created on [Date]
//

import Foundation
import PDFKit
import UIKit

class PDFReportService {
    static func generatePDF(trips: [Trip], period: String, startDate: Date, endDate: Date) -> URL? {
        let pdfMetaData = [
            kCGPDFContextCreator: "Car Mileage Tracker",
            kCGPDFContextAuthor: "Mileage Tracking App",
            kCGPDFContextTitle: "Business Expense Mileage Report"
        ]
        
        let format = UIGraphicsPDFRendererFormat()
        format.documentInfo = pdfMetaData as [String: Any]
        
        let pageWidth = 8.5 * 72.0
        let pageHeight = 11 * 72.0
        let pageRect = CGRect(x: 0, y: 0, width: pageWidth, height: pageHeight)
        
        let renderer = UIGraphicsPDFRenderer(bounds: pageRect, format: format)
        
        let data = renderer.pdfData { context in
            context.beginPage()
            
            var yPosition: CGFloat = 60
            
            // Header
            let headerText = "Business Expense Mileage Report"
            let headerAttributes: [NSAttributedString.Key: Any] = [
                .font: UIFont.boldSystemFont(ofSize: 24),
                .foregroundColor: UIColor.black
            ]
            let headerSize = headerText.size(withAttributes: headerAttributes)
            let headerRect = CGRect(x: (pageWidth - headerSize.width) / 2, y: yPosition, width: headerSize.width, height: headerSize.height)
            headerText.draw(in: headerRect, withAttributes: headerAttributes)
            yPosition += headerSize.height + 20
            
            // Period
            let periodText = "Period: \(period)"
            let periodAttributes: [NSAttributedString.Key: Any] = [
                .font: UIFont.systemFont(ofSize: 14),
                .foregroundColor: UIColor.black
            ]
            periodText.draw(at: CGPoint(x: 60, y: yPosition), withAttributes: periodAttributes)
            yPosition += 30
            
            // Date range
            let dateFormatter = DateFormatter()
            dateFormatter.dateStyle = .medium
            let dateRangeText = "\(dateFormatter.string(from: startDate)) - \(dateFormatter.string(from: endDate))"
            dateRangeText.draw(at: CGPoint(x: 60, y: yPosition), withAttributes: periodAttributes)
            yPosition += 40
            
            // Column headers
            let columnHeaders = ["Date", "Start Location", "End Location", "Miles", "Category", "Rate", "Amount"]
            let columnWidths: [CGFloat] = [80, 150, 150, 60, 80, 60, 70]
            var xPosition: CGFloat = 60
            
            let headerAttributes2: [NSAttributedString.Key: Any] = [
                .font: UIFont.boldSystemFont(ofSize: 10),
                .foregroundColor: UIColor.black
            ]
            
            for (index, header) in columnHeaders.enumerated() {
                let rect = CGRect(x: xPosition, y: yPosition, width: columnWidths[index], height: 20)
                header.draw(in: rect, withAttributes: headerAttributes2)
                xPosition += columnWidths[index] + 5
            }
            yPosition += 25
            
            // Draw line under headers
            context.cgContext.move(to: CGPoint(x: 60, y: yPosition - 5))
            context.cgContext.addLine(to: CGPoint(x: pageWidth - 60, y: yPosition - 5))
            context.cgContext.strokePath()
            yPosition += 10
            
            // Trip rows
            let rowAttributes: [NSAttributedString.Key: Any] = [
                .font: UIFont.systemFont(ofSize: 9),
                .foregroundColor: UIColor.black
            ]
            
            var totalMiles: Double = 0
            var totalAmount: Double = 0
            
            for trip in trips {
                if yPosition > pageHeight - 100 {
                    context.beginPage()
                    yPosition = 60
                }
                
                xPosition = 60
                
                // Date
                if let date = trip.startDate {
                    dateFormatter.dateStyle = .short
                    dateFormatter.timeStyle = .none
                    let dateStr = dateFormatter.string(from: date)
                    dateStr.draw(in: CGRect(x: xPosition, y: yPosition, width: columnWidths[0], height: 15), withAttributes: rowAttributes)
                }
                xPosition += columnWidths[0] + 5
                
                // Start location (truncated if needed)
                let startLoc = (trip.startLocation ?? "N/A") as NSString
                startLoc.draw(in: CGRect(x: xPosition, y: yPosition, width: columnWidths[1], height: 15), withAttributes: rowAttributes)
                xPosition += columnWidths[1] + 5
                
                // End location (truncated if needed)
                let endLoc = (trip.endLocation ?? "N/A") as NSString
                endLoc.draw(in: CGRect(x: xPosition, y: yPosition, width: columnWidths[2], height: 15), withAttributes: rowAttributes)
                xPosition += columnWidths[2] + 5
                
                // Miles
                let milesStr = String(format: "%.2f", trip.distance)
                milesStr.draw(in: CGRect(x: xPosition, y: yPosition, width: columnWidths[3], height: 15), withAttributes: rowAttributes)
                totalMiles += trip.distance
                xPosition += columnWidths[3] + 5
                
                // Category
                (trip.category ?? "Business").draw(in: CGRect(x: xPosition, y: yPosition, width: columnWidths[4], height: 15), withAttributes: rowAttributes)
                xPosition += columnWidths[4] + 5
                
                // Rate
                let rateStr = String(format: "$%.2f", trip.mileageRate)
                rateStr.draw(in: CGRect(x: xPosition, y: yPosition, width: columnWidths[5], height: 15), withAttributes: rowAttributes)
                xPosition += columnWidths[5] + 5
                
                // Amount
                let amountStr = String(format: "$%.2f", trip.totalDeduction)
                amountStr.draw(in: CGRect(x: xPosition, y: yPosition, width: columnWidths[6], height: 15), withAttributes: rowAttributes)
                totalAmount += trip.totalDeduction
                
                yPosition += 18
            }
            
            yPosition += 10
            
            // Total line
            context.cgContext.move(to: CGPoint(x: 60, y: yPosition))
            context.cgContext.addLine(to: CGPoint(x: pageWidth - 60, y: yPosition))
            context.cgContext.strokePath()
            yPosition += 15
            
            // Totals
            xPosition = 60 + columnWidths[0] + columnWidths[1] + columnWidths[2] + 15
            let totalLabel = "Total:"
            totalLabel.draw(at: CGPoint(x: xPosition, y: yPosition), withAttributes: headerAttributes2)
            xPosition += columnWidths[3]
            
            let totalMilesStr = String(format: "%.2f", totalMiles)
            totalMilesStr.draw(at: CGPoint(x: xPosition, y: yPosition), withAttributes: headerAttributes2)
            xPosition += columnWidths[4] + columnWidths[5]
            
            let totalAmountStr = String(format: "$%.2f", totalAmount)
            totalAmountStr.draw(at: CGPoint(x: xPosition, y: yPosition), withAttributes: headerAttributes2)
        }
        
        // Save to temporary file
        let fileName = "MileageReport_\(Date().timeIntervalSince1970).pdf"
        let tempURL = FileManager.default.temporaryDirectory.appendingPathComponent(fileName)
        
        do {
            try data.write(to: tempURL)
            return tempURL
        } catch {
            print("Error saving PDF: \(error)")
            return nil
        }
    }
}

