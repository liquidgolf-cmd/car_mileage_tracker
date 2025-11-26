//
//  HomeView.swift
//  CarMileage
//
//  Created on [Date]
//

import SwiftUI

struct HomeView: View {
    @StateObject private var tracker = TripTrackerViewModel()
    @StateObject private var subscriptionService = SubscriptionService.shared
    @State private var showingActiveTrip = false
    @State private var showingUpgradePrompt = false
    
    var body: some View {
        NavigationView {
            ZStack {
                if tracker.isTracking {
                    ActiveTripView(tracker: tracker)
                        .transition(.opacity)
                        .onDisappear {
                            // Refresh subscription status when trip view disappears
                            Task {
                                await subscriptionService.checkSubscriptionStatus()
                            }
                        }
                } else {
                    VStack(spacing: 30) {
                        Spacer()
                        
                        // Trip count display
                        if !subscriptionService.isPremium {
                            VStack(spacing: 8) {
                                Text("Trips This Month")
                                    .font(.headline)
                                    .foregroundColor(.secondary)
                                Text("\(subscriptionService.tripsThisMonth)/40")
                                    .font(.system(size: 48, weight: .bold))
                                    .foregroundColor(subscriptionService.tripsThisMonth >= 40 ? .red : .primary)
                                
                                if subscriptionService.tripsThisMonth >= 40 {
                                    Button("Upgrade to Premium") {
                                        showingUpgradePrompt = true
                                    }
                                    .buttonStyle(.borderedProminent)
                                    .padding(.top, 8)
                                }
                            }
                            .padding()
                        }
                        
                        Spacer()
                        
                        // Start Trip Button
                        Button(action: {
                            if subscriptionService.canStartTrip() {
                                tracker.startTrip()
                                withAnimation {
                                    showingActiveTrip = true
                                }
                            } else {
                                showingUpgradePrompt = true
                            }
                        }) {
                            VStack(spacing: 12) {
                                Image(systemName: "location.fill")
                                    .font(.system(size: 60))
                                Text("Start Trip")
                                    .font(.system(size: 28, weight: .semibold))
                            }
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .frame(height: 150)
                            .background(
                                RoundedRectangle(cornerRadius: 20)
                                    .fill(subscriptionService.canStartTrip() ? Color.blue : Color.gray)
                            )
                        }
                        .disabled(!subscriptionService.canStartTrip())
                        .padding(.horizontal, 40)
                        .padding(.bottom, 60)
                    }
                }
            }
            .navigationTitle("Mileage Tracker")
            .sheet(isPresented: $showingUpgradePrompt) {
                SubscriptionView()
            }
            .onReceive(NotificationCenter.default.publisher(for: .tripSaved)) { _ in
                Task {
                    await subscriptionService.checkSubscriptionStatus()
                }
            }
        }
    }
}

#Preview {
    HomeView()
}

