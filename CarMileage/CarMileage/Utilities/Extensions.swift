//
//  Extensions.swift
//  CarMileage
//
//  Created on [Date]
//

import Foundation

extension Notification.Name {
    static let tripSaved = Notification.Name("tripSaved")
}

import CoreData

extension Trip: Identifiable {
    // Use objectID as stable identifier for SwiftUI ForEach
    // The UUID id property is used for business logic, objectID for SwiftUI identification
}

