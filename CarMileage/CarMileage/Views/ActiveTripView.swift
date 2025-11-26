//
//  ActiveTripView.swift
//  CarMileage
//
//  Created on [Date]
//

import SwiftUI
import MapKit

struct ActiveTripView: View {
    @ObservedObject var tracker: TripTrackerViewModel
    @State private var showingSaveConfirmation = false
    
    var body: some View {
        VStack(spacing: 20) {
            // Status indicator
            HStack {
                Circle()
                    .fill(Color.red)
                    .frame(width: 12, height: 12)
                Text("Tracking")
                    .font(.headline)
                    .foregroundColor(.red)
            }
            .padding(.top, 20)
            
            Spacer()
            
            // Duration
            Text(formatDuration(tracker.duration))
                .font(.system(size: 72, weight: .bold, design: .rounded))
                .foregroundColor(.primary)
            
            // Distance
            VStack(spacing: 4) {
                Text(String(format: "%.2f", tracker.distance))
                    .font(.system(size: 48, weight: .semibold))
                Text("miles")
                    .font(.title2)
                    .foregroundColor(.secondary)
            }
            .padding(.vertical, 20)
            
            // Category selector
            Picker("Category", selection: $tracker.category) {
                ForEach(TripCategory.allCases, id: \.self) { category in
                    Text(category.displayName).tag(category)
                }
            }
            .pickerStyle(.segmented)
            .padding(.horizontal, 20)
            
            // Notes field
            TextField("Notes (optional)", text: $tracker.notes, axis: .vertical)
                .textFieldStyle(.roundedBorder)
                .padding(.horizontal, 20)
                .lineLimit(3...6)
            
            Spacer()
            
            // End Trip button
            Button(action: {
                tracker.endTrip()
                showingSaveConfirmation = true
            }) {
                Text("End Trip")
                    .font(.system(size: 24, weight: .semibold))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 60)
                    .background(
                        RoundedRectangle(cornerRadius: 15)
                            .fill(Color.red)
                    )
            }
            .padding(.horizontal, 40)
            .padding(.bottom, 40)
        }
        .alert("Save Trip?", isPresented: $showingSaveConfirmation) {
            Button("Cancel", role: .cancel) {
                tracker.cancelTrip()
            }
            Button("Save") {
                tracker.saveTrip()
            }
        } message: {
            Text("Distance: \(String(format: "%.2f", tracker.distance)) miles\nCategory: \(tracker.category.displayName)")
        }
        
        if let error = tracker.errorMessage {
            Text(error)
                .foregroundColor(.red)
                .padding()
        }
    }
    
    private func formatDuration(_ duration: TimeInterval) -> String {
        let hours = Int(duration) / 3600
        let minutes = (Int(duration) % 3600) / 60
        let seconds = Int(duration) % 60
        
        if hours > 0 {
            return String(format: "%d:%02d:%02d", hours, minutes, seconds)
        } else {
            return String(format: "%d:%02d", minutes, seconds)
        }
    }
}

#Preview {
    ActiveTripView(tracker: TripTrackerViewModel())
}

