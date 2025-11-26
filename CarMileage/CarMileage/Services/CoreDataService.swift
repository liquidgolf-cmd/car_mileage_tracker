//
//  CoreDataService.swift
//  CarMileage
//
//  Created on [Date]
//

import Foundation
import CoreData

class CoreDataService: ObservableObject {
    static let shared = CoreDataService()
    
    lazy var persistentContainer: NSPersistentContainer = {
        let container = NSPersistentContainer(name: "CarMileage")
        container.loadPersistentStores { description, error in
            if let error = error {
                fatalError("Core Data store failed to load: \(error.localizedDescription)")
            }
        }
        container.viewContext.automaticallyMergesChangesFromParent = true
        return container
    }()
    
    var viewContext: NSManagedObjectContext {
        return persistentContainer.viewContext
    }
    
    func save() {
        let context = persistentContainer.viewContext
        if context.hasChanges {
            do {
                try context.save()
            } catch {
                let nsError = error as NSError
                fatalError("Unresolved error \(nsError), \(nsError.userInfo)")
            }
        }
    }
    
    func deleteTrip(_ trip: Trip) {
        viewContext.delete(trip)
        save()
    }
    
    func fetchTrips(month: Int? = nil, year: Int? = nil) -> [Trip] {
        let request: NSFetchRequest<Trip> = Trip.fetchRequest()
        request.sortDescriptors = [NSSortDescriptor(keyPath: \Trip.startDate, ascending: false)]
        
        if let month = month, let year = year {
            let calendar = Calendar.current
            let startDate = calendar.date(from: DateComponents(year: year, month: month, day: 1))!
            let endDate = calendar.date(byAdding: .month, value: 1, to: startDate)!
            
            request.predicate = NSPredicate(format: "startDate >= %@ AND startDate < %@", startDate as NSDate, endDate as NSDate)
        }
        
        do {
            return try viewContext.fetch(request)
        } catch {
            print("Error fetching trips: \(error)")
            return []
        }
    }
    
    func fetchTrips(from startDate: Date, to endDate: Date) -> [Trip] {
        let request: NSFetchRequest<Trip> = Trip.fetchRequest()
        request.sortDescriptors = [NSSortDescriptor(keyPath: \Trip.startDate, ascending: false)]
        request.predicate = NSPredicate(format: "startDate >= %@ AND startDate <= %@", startDate as NSDate, endDate as NSDate)
        
        do {
            return try viewContext.fetch(request)
        } catch {
            print("Error fetching trips: \(error)")
            return []
        }
    }
    
    func getTripCountForCurrentMonth() -> Int {
        let calendar = Calendar.current
        let now = Date()
        let month = calendar.component(.month, from: now)
        let year = calendar.component(.year, from: now)
        return fetchTrips(month: month, year: year).count
    }
}

