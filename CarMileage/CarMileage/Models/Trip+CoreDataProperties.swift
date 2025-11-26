//
//  Trip+CoreDataProperties.swift
//  CarMileage
//
//  Created on [Date]
//

import Foundation
import CoreData

extension Trip {
    @nonobjc public class func fetchRequest() -> NSFetchRequest<Trip> {
        return NSFetchRequest<Trip>(entityName: "Trip")
    }
    
    @NSManaged public var id: UUID?
    @NSManaged public var startDate: Date?
    @NSManaged public var endDate: Date?
    @NSManaged public var startLocation: String?
    @NSManaged public var endLocation: String?
    @NSManaged public var startLatitude: Double
    @NSManaged public var startLongitude: Double
    @NSManaged public var endLatitude: Double
    @NSManaged public var endLongitude: Double
    @NSManaged public var distance: Double
    @NSManaged public var category: String?
    @NSManaged public var notes: String?
    @NSManaged public var mileageRate: Double
    @NSManaged public var totalDeduction: Double
    
    // Convenience computed properties
    var tripCategory: TripCategory {
        get {
            return TripCategory(rawValue: category ?? "Business") ?? .business
        }
        set {
            category = newValue.rawValue
        }
    }
    
    var duration: TimeInterval? {
        guard let start = startDate, let end = endDate else { return nil }
        return end.timeIntervalSince(start)
    }
    
    var formattedDuration: String {
        guard let duration = duration else { return "N/A" }
        let hours = Int(duration) / 3600
        let minutes = (Int(duration) % 3600) / 60
        if hours > 0 {
            return String(format: "%d:%02d", hours, minutes)
        } else {
            return "\(minutes) min"
        }
    }
}

