//
//  MileageRate.swift
//  CarMileage
//
//  Created on [Date]
//

import Foundation

struct MileageRate {
    // 2025 IRS standard mileage rate (to be verified)
    static let defaultRate: Double = 0.67
    
    static func getDefaultRate() -> Double {
        return UserDefaults.standard.object(forKey: "customMileageRate") as? Double ?? defaultRate
    }
    
    static func setCustomRate(_ rate: Double) {
        UserDefaults.standard.set(rate, forKey: "customMileageRate")
    }
}

