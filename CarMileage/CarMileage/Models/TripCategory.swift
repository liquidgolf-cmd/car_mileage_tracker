//
//  TripCategory.swift
//  CarMileage
//
//  Created on [Date]
//

import Foundation

enum TripCategory: String, CaseIterable, Codable {
    case business = "Business"
    case personal = "Personal"
    case medical = "Medical"
    case charity = "Charity"
    
    var displayName: String {
        return self.rawValue
    }
}

