//
//  TripTrackerViewModel.swift
//  CarMileage
//
//  Created on [Date]
//

import Foundation
import CoreLocation
import CoreData
import Combine

class TripTrackerViewModel: ObservableObject {
    @Published var isTracking = false
    @Published var startLocation: CLLocation?
    @Published var currentLocation: CLLocation?
    @Published var endLocation: CLLocation?
    @Published var startAddress: String?
    @Published var endAddress: String?
    @Published var distance: Double = 0.0
    @Published var startTime: Date?
    @Published var endTime: Date?
    @Published var category: TripCategory = .business
    @Published var notes: String = ""
    @Published var duration: TimeInterval = 0
    @Published var errorMessage: String?
    
    private let locationService = LocationService.shared
    private let coreDataService = CoreDataService.shared
    private var timer: Timer?
    private var cancellables = Set<AnyCancellable>()
    
    init() {
        // Set default category from settings
        if let defaultCategoryString = UserDefaults.standard.string(forKey: "defaultTripCategory"),
           let defaultCategory = TripCategory(rawValue: defaultCategoryString) {
            category = defaultCategory
        }
        
        // Subscribe to location updates
        locationService.$currentLocation
            .compactMap { $0 }
            .sink { [weak self] location in
                self?.currentLocation = location
                if let start = self?.startLocation {
                    self?.distance = self?.locationService.calculateDistance(from: start, to: location) ?? 0.0
                }
            }
            .store(in: &cancellables)
    }
    
    func startTrip() {
        guard !isTracking else { return }
        
        // Check location authorization
        locationService.requestPermission()
        
        guard locationService.authorizationStatus == .authorizedWhenInUse || 
              locationService.authorizationStatus == .authorizedAlways else {
            errorMessage = "Location access required. Please enable location services in Settings."
            return
        }
        
        isTracking = true
        startTime = Date()
        startLocation = nil
        endLocation = nil
        distance = 0.0
        notes = ""
        errorMessage = nil
        
        locationService.startTracking()
        
        // Wait for initial location
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) { [weak self] in
            if let location = self?.locationService.currentLocation {
                self?.startLocation = location
                self?.reverseGeocodeStartLocation()
            }
        }
        
        // Start timer
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            guard let self = self, let start = self.startTime else { return }
            self.duration = Date().timeIntervalSince(start)
        }
    }
    
    func endTrip() {
        guard isTracking else { return }
        
        isTracking = false
        endTime = Date()
        endLocation = currentLocation ?? startLocation
        
        locationService.stopTracking()
        timer?.invalidate()
        timer = nil
        
        if let endLoc = endLocation {
            reverseGeocodeEndLocation()
        }
    }
    
    func cancelTrip() {
        isTracking = false
        locationService.stopTracking()
        timer?.invalidate()
        timer = nil
        
        // Reset state
        startLocation = nil
        currentLocation = nil
        endLocation = nil
        startAddress = nil
        endAddress = nil
        distance = 0.0
        startTime = nil
        endTime = nil
        duration = 0
        notes = ""
    }
    
    func saveTrip() {
        guard let start = startLocation,
              let startTime = startTime,
              let end = endLocation,
              let endTime = endTime else {
            errorMessage = "Missing trip data. Cannot save."
            return
        }
        
        let context = coreDataService.viewContext
        let trip = Trip(context: context)
        
        trip.id = UUID()
        trip.startDate = startTime
        trip.endDate = endTime
        trip.startLatitude = start.coordinate.latitude
        trip.startLongitude = start.coordinate.longitude
        trip.endLatitude = end.coordinate.latitude
        trip.endLongitude = end.coordinate.longitude
        trip.distance = distance
        trip.category = category.rawValue
        trip.notes = notes.isEmpty ? nil : notes
        trip.mileageRate = MileageRate.getDefaultRate()
        trip.totalDeduction = distance * trip.mileageRate
        trip.startLocation = startAddress
        trip.endLocation = endAddress
        
        coreDataService.save()
        
        // Notify subscription service to update trip count
        NotificationCenter.default.post(name: .tripSaved, object: nil)
        
        // Reset for next trip
        cancelTrip()
    }
    
    private func reverseGeocodeStartLocation() {
        guard let location = startLocation else { return }
        locationService.reverseGeocode(location) { [weak self] address in
            DispatchQueue.main.async {
                self?.startAddress = address
            }
        }
    }
    
    private func reverseGeocodeEndLocation() {
        guard let location = endLocation else { return }
        locationService.reverseGeocode(location) { [weak self] address in
            DispatchQueue.main.async {
                self?.endAddress = address
            }
        }
    }
}

