//
//  ReportsView.swift
//  CarMileage
//
//  Created on [Date]
//

import SwiftUI

struct ReportsView: View {
    @StateObject private var viewModel = ReportsViewModel()
    @State private var pdfURL: URL?
    @State private var showingShareSheet = false
    @Environment(\.managedObjectContext) private var viewContext
    
    var body: some View {
        NavigationView {
            Form {
                Section("Report Period") {
                    Picker("Period", selection: $viewModel.selectedPeriod) {
                        ForEach(ReportPeriod.allCases, id: \.self) { period in
                            Text(period.rawValue).tag(period)
                        }
                    }
                    
                    if viewModel.selectedPeriod == .custom {
                        DatePicker("Start Date", selection: $viewModel.customStartDate, displayedComponents: .date)
                        DatePicker("End Date", selection: $viewModel.customEndDate, displayedComponents: .date)
                    }
                }
                
                Section("Filter") {
                    Picker("Category", selection: $viewModel.selectedCategory) {
                        Text("All Categories").tag(nil as TripCategory?)
                        ForEach(TripCategory.allCases, id: \.self) { category in
                            Text(category.displayName).tag(category as TripCategory?)
                        }
                    }
                }
                
                Section {
                    let trips = viewModel.getTripsForReport()
                    let totalMiles = viewModel.getTotalMiles(for: trips)
                    let totalDeduction = viewModel.getTotalDeduction(for: trips)
                    
                    LabeledContent("Trips") {
                        Text("\(trips.count)")
                    }
                    
                    LabeledContent("Total Miles") {
                        Text(String(format: "%.2f", totalMiles))
                    }
                    
                    LabeledContent("Total Deduction") {
                        Text(String(format: "$%.2f", totalDeduction))
                            .foregroundColor(.green)
                            .fontWeight(.semibold)
                    }
                }
                
                Section {
                    Button("Generate PDF Report") {
                        generatePDF()
                    }
                    .disabled(viewModel.getTripsForReport().isEmpty)
                }
            }
            .navigationTitle("Reports")
            .sheet(isPresented: $showingShareSheet) {
                if let url = pdfURL {
                    ShareSheet(activityItems: [url])
                }
            }
        }
    }
    
    private func generatePDF() {
        let trips = viewModel.getTripsForReport()
        guard !trips.isEmpty else { return }
        
        let (startDate, endDate): (Date, Date)
        if viewModel.selectedPeriod == .custom {
            startDate = viewModel.customStartDate
            endDate = viewModel.customEndDate
        } else {
            let range = viewModel.selectedPeriod.dateRange()
            startDate = range.start
            endDate = range.end
        }
        
        let dateFormatter = DateFormatter()
        dateFormatter.dateStyle = .medium
        let periodString = "\(dateFormatter.string(from: startDate)) - \(dateFormatter.string(from: endDate))"
        
        if let url = PDFReportService.generatePDF(
            trips: trips,
            period: viewModel.selectedPeriod.rawValue,
            startDate: startDate,
            endDate: endDate
        ) {
            pdfURL = url
            showingShareSheet = true
        }
    }
}

struct ShareSheet: UIViewControllerRepresentable {
    let activityItems: [Any]
    
    func makeUIViewController(context: Context) -> UIActivityViewController {
        let controller = UIActivityViewController(activityItems: activityItems, applicationActivities: nil)
        return controller
    }
    
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}

#Preview {
    ReportsView()
        .environment(\.managedObjectContext, CoreDataService.shared.viewContext)
}

