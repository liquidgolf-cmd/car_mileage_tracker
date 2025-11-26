//
//  CarMileageApp.swift
//  CarMileage
//
//  Created on [Date]
//

import SwiftUI

@main
struct CarMileageApp: App {
    let persistenceController = CoreDataService.shared
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(\.managedObjectContext, persistenceController.viewContext)
        }
    }
}

