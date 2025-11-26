//
//  TripListView.swift
//  CarMileage
//
//  Created on [Date]
//

import SwiftUI

struct TripListView: View {
    @Environment(\.managedObjectContext) private var viewContext
    @FetchRequest(
        sortDescriptors: [NSSortDescriptor(keyPath: \Trip.startDate, ascending: false)],
        animation: .default)
    private var trips: FetchedResults<Trip>
    
    @State private var selectedTrip: Trip?
    
    var body: some View {
        NavigationView {
            List {
                ForEach(trips) { trip in
                    TripRowView(trip: trip)
                        .contentShape(Rectangle())
                        .onTapGesture {
                            selectedTrip = trip
                        }
                }
                .onDelete(perform: deleteTrips)
            }
            .navigationTitle("Trip History")
            .sheet(item: $selectedTrip) { trip in
                TripDetailView(trip: trip)
            }
        }
    }
    
    private func deleteTrips(offsets: IndexSet) {
        withAnimation {
            offsets.map { trips[$0] }.forEach(CoreDataService.shared.deleteTrip)
        }
    }
}

struct TripRowView: View {
    let trip: Trip
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(trip.tripCategory.displayName)
                    .font(.headline)
                    .foregroundColor(categoryColor(trip.tripCategory))
                
                Spacer()
                
                if let date = trip.startDate {
                    Text(formatDate(date))
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
            }
            
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    if let start = trip.startLocation {
                        Text(start)
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .lineLimit(1)
                    }
                    
                    if let end = trip.endLocation {
                        Text(end)
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .lineLimit(1)
                    }
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 4) {
                    Text("\(String(format: "%.2f", trip.distance)) mi")
                        .font(.headline)
                    Text(String(format: "$%.2f", trip.totalDeduction))
                        .font(.subheadline)
                        .foregroundColor(.green)
                }
            }
        }
        .padding(.vertical, 4)
    }
    
    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
    
    private func categoryColor(_ category: TripCategory) -> Color {
        switch category {
        case .business: return .blue
        case .personal: return .gray
        case .medical: return .red
        case .charity: return .purple
        }
    }
}

#Preview {
    TripListView()
        .environment(\.managedObjectContext, CoreDataService.shared.viewContext)
}

