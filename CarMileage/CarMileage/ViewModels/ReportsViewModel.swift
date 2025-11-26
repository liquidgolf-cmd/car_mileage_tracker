//
//  ReportsViewModel.swift
//  CarMileage
//
//  Created on [Date]
//

import Foundation
import CoreData

enum ReportPeriod: String, CaseIterable {
    case month = "Current Month"
    case quarter = "Current Quarter"
    case year = "Current Year"
    case custom = "Custom Range"
    
    func dateRange() -> (start: Date, end: Date) {
        let calendar = Calendar.current
        let now = Date()
        
        switch self {
        case .month:
            let start = calendar.date(from: calendar.dateComponents([.year, .month], from: now))!
            let end = calendar.date(byAdding: .month, value: 1, to: start)!
            return (start, end)
        case .quarter:
            let quarter = calendar.component(.quarter, from: now)
            let month = (quarter - 1) * 3 + 1
            let start = calendar.date(from: DateComponents(year: calendar.component(.year, from: now), month: month, day: 1))!
            let end = calendar.date(byAdding: .month, value: 3, to: start)!
            return (start, end)
        case .year:
            let start = calendar.date(from: DateComponents(year: calendar.component(.year, from: now), month: 1, day: 1))!
            let end = calendar.date(byAdding: .year, value: 1, to: start)!
            return (start, end)
        case .custom:
            return (now, now)
        }
    }
}

class ReportsViewModel: ObservableObject {
    @Published var selectedPeriod: ReportPeriod = .month
    @Published var customStartDate: Date = Date()
    @Published var customEndDate: Date = Date()
    @Published var selectedCategory: TripCategory? = nil
    
    private let coreDataService = CoreDataService.shared
    
    func getTripsForReport() -> [Trip] {
        let (startDate, endDate): (Date, Date)
        
        if selectedPeriod == .custom {
            startDate = customStartDate
            endDate = customEndDate
        } else {
            let range = selectedPeriod.dateRange()
            startDate = range.start
            endDate = range.end
        }
        
        var trips = coreDataService.fetchTrips(from: startDate, to: endDate)
        
        if let category = selectedCategory {
            trips = trips.filter { $0.tripCategory == category }
        }
        
        return trips
    }
    
    func getTotalMiles(for trips: [Trip]) -> Double {
        return trips.reduce(0) { $0 + $1.distance }
    }
    
    func getTotalDeduction(for trips: [Trip]) -> Double {
        return trips.reduce(0) { $0 + $1.totalDeduction }
    }
}

