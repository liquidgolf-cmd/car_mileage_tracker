//
//  TripDetailView.swift
//  CarMileage
//
//  Created on [Date]
//

import SwiftUI
import MapKit

struct TripDetailView: View {
    @Environment(\.dismiss) private var dismiss
    @ObservedObject var trip: Trip
    @State private var editedCategory: TripCategory
    @State private var editedNotes: String
    @State private var showingDeleteAlert = false
    
    init(trip: Trip) {
        self.trip = trip
        _editedCategory = State(initialValue: trip.tripCategory)
        _editedNotes = State(initialValue: trip.notes ?? "")
    }
    
    var body: some View {
        NavigationView {
            Form {
                Section("Trip Information") {
                    if let startDate = trip.startDate {
                        LabeledContent("Date") {
                            Text(startDate, style: .date)
                        }
                        LabeledContent("Time") {
                            Text(startDate, style: .time)
                        }
                    }
                    
                    if let duration = trip.duration {
                        LabeledContent("Duration") {
                            Text(trip.formattedDuration)
                        }
                    }
                }
                
                Section("Locations") {
                    if let start = trip.startLocation {
                        LabeledContent("Start") {
                            Text(start)
                                .multilineTextAlignment(.trailing)
                        }
                    }
                    
                    if let end = trip.endLocation {
                        LabeledContent("End") {
                            Text(end)
                                .multilineTextAlignment(.trailing)
                        }
                    }
                    
                    if trip.distance > 0 {
                        MapView(
                            startLat: trip.startLatitude,
                            startLon: trip.startLongitude,
                            endLat: trip.endLatitude,
                            endLon: trip.endLongitude
                        )
                        .frame(height: 200)
                        .listRowInsets(EdgeInsets())
                    }
                }
                
                Section("Details") {
                    Picker("Category", selection: $editedCategory) {
                        ForEach(TripCategory.allCases, id: \.self) { category in
                            Text(category.displayName).tag(category)
                        }
                    }
                    
                    TextField("Notes", text: $editedNotes, axis: .vertical)
                        .lineLimit(3...6)
                }
                
                Section("Mileage") {
                    LabeledContent("Distance") {
                        Text("\(String(format: "%.2f", trip.distance)) miles")
                    }
                    
                    LabeledContent("Rate") {
                        Text(String(format: "$%.2f/mile", trip.mileageRate))
                    }
                    
                    LabeledContent("Total Deduction") {
                        Text(String(format: "$%.2f", trip.totalDeduction))
                            .foregroundColor(.green)
                            .fontWeight(.semibold)
                    }
                }
                
                Section {
                    Button("Delete Trip", role: .destructive) {
                        showingDeleteAlert = true
                    }
                }
            }
            .navigationTitle("Trip Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        saveChanges()
                    }
                }
            }
            .alert("Delete Trip?", isPresented: $showingDeleteAlert) {
                Button("Cancel", role: .cancel) {}
                Button("Delete", role: .destructive) {
                    deleteTrip()
                }
            } message: {
                Text("This action cannot be undone.")
            }
        }
    }
    
    private func saveChanges() {
        trip.category = editedCategory.rawValue
        trip.notes = editedNotes.isEmpty ? nil : editedNotes
        CoreDataService.shared.save()
        dismiss()
    }
    
    private func deleteTrip() {
        CoreDataService.shared.deleteTrip(trip)
        dismiss()
    }
}

struct MapView: UIViewRepresentable {
    let startLat: Double
    let startLon: Double
    let endLat: Double
    let endLon: Double
    
    func makeUIView(context: Context) -> MKMapView {
        let mapView = MKMapView()
        mapView.delegate = context.coordinator
        
        let startCoord = CLLocationCoordinate2D(latitude: startLat, longitude: startLon)
        let endCoord = CLLocationCoordinate2D(latitude: endLat, longitude: endLon)
        
        let startAnnotation = MKPointAnnotation()
        startAnnotation.coordinate = startCoord
        startAnnotation.title = "Start"
        mapView.addAnnotation(startAnnotation)
        
        let endAnnotation = MKPointAnnotation()
        endAnnotation.coordinate = endCoord
        endAnnotation.title = "End"
        mapView.addAnnotation(endAnnotation)
        
        let region = MKCoordinateRegion(
            center: CLLocationCoordinate2D(
                latitude: (startLat + endLat) / 2,
                longitude: (startLon + endLon) / 2
            ),
            span: MKCoordinateSpan(latitudeDelta: 0.1, longitudeDelta: 0.1)
        )
        mapView.setRegion(region, animated: false)
        
        // Draw route
        let request = MKDirections.Request()
        request.source = MKMapItem(placemark: MKPlacemark(coordinate: startCoord))
        request.destination = MKMapItem(placemark: MKPlacemark(coordinate: endCoord))
        request.transportType = .automobile
        
        let directions = MKDirections(request: request)
        directions.calculate { response, error in
            guard let route = response?.routes.first else { return }
            mapView.addOverlay(route.polyline)
            mapView.setVisibleMapRect(route.polyline.boundingMapRect, edgePadding: UIEdgeInsets(top: 50, left: 50, bottom: 50, right: 50), animated: true)
        }
        
        return mapView
    }
    
    func updateUIView(_ uiView: MKMapView, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator()
    }
    
    class Coordinator: NSObject, MKMapViewDelegate {
        func mapView(_ mapView: MKMapView, rendererFor overlay: MKOverlay) -> MKOverlayRenderer {
            let renderer = MKPolylineRenderer(overlay: overlay)
            renderer.strokeColor = .systemBlue
            renderer.lineWidth = 4
            return renderer
        }
    }
}

#Preview {
    let context = CoreDataService.shared.viewContext
    let trip = Trip(context: context)
    trip.id = UUID()
    trip.startDate = Date()
    trip.endDate = Date()
    trip.distance = 15.5
    trip.category = "Business"
    trip.mileageRate = 0.67
    trip.totalDeduction = 10.39
    trip.startLocation = "123 Main St, City"
    trip.endLocation = "456 Oak Ave, City"
    trip.startLatitude = 37.7749
    trip.startLongitude = -122.4194
    trip.endLatitude = 37.7849
    trip.endLongitude = -122.4094
    
    return TripDetailView(trip: trip)
}

