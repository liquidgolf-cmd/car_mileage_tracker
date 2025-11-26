//
//  SettingsView.swift
//  CarMileage
//
//  Created on [Date]
//

import SwiftUI

struct SettingsView: View {
    @StateObject private var subscriptionService = SubscriptionService.shared
    @AppStorage("defaultTripCategory") private var defaultCategory: String = TripCategory.business.rawValue
    @AppStorage("customMileageRate") private var customRate: Double = MileageRate.defaultRate
    @State private var showingRateEditor = false
    @State private var editedRate: Double = MileageRate.defaultRate
    
    var body: some View {
        NavigationView {
            Form {
                Section("Subscription") {
                    HStack {
                        Text("Status")
                        Spacer()
                        Text(subscriptionService.isPremium ? "Premium" : "Free")
                            .foregroundColor(subscriptionService.isPremium ? .green : .secondary)
                    }
                    
                    if !subscriptionService.isPremium {
                        NavigationLink("Upgrade to Premium") {
                            SubscriptionView()
                        }
                    }
                    
                    Button("Restore Purchases") {
                        subscriptionService.restorePurchases()
                    }
                }
                
                Section("Trip Settings") {
                    Picker("Default Category", selection: $defaultCategory) {
                        ForEach(TripCategory.allCases, id: \.self) { category in
                            Text(category.displayName).tag(category.rawValue)
                        }
                    }
                    
                    HStack {
                        Text("Mileage Rate")
                        Spacer()
                        Text(String(format: "$%.2f/mile", customRate))
                            .foregroundColor(.secondary)
                    }
                    .contentShape(Rectangle())
                    .onTapGesture {
                        editedRate = customRate
                        showingRateEditor = true
                    }
                }
                
                Section("About") {
                    HStack {
                        Text("Version")
                        Spacer()
                        Text(Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0")
                            .foregroundColor(.secondary)
                    }
                    
                    Link("Privacy Policy", destination: URL(string: "https://example.com/privacy")!)
                    Link("Terms of Service", destination: URL(string: "https://example.com/terms")!)
                }
            }
            .navigationTitle("Settings")
            .sheet(isPresented: $showingRateEditor) {
                NavigationView {
                    Form {
                        Section {
                            TextField("Rate per mile", value: $editedRate, format: .number)
                                .keyboardType(.decimalPad)
                        } footer: {
                            Text("2025 IRS standard rate: $0.67/mile. You can adjust this for past years or special cases.")
                        }
                    }
                    .navigationTitle("Mileage Rate")
                    .navigationBarTitleDisplayMode(.inline)
                    .toolbar {
                        ToolbarItem(placement: .navigationBarLeading) {
                            Button("Cancel") {
                                showingRateEditor = false
                            }
                        }
                        ToolbarItem(placement: .navigationBarTrailing) {
                            Button("Save") {
                                customRate = editedRate
                                MileageRate.setCustomRate(editedRate)
                                showingRateEditor = false
                            }
                        }
                    }
                }
            }
            .onChange(of: defaultCategory) { newValue in
                UserDefaults.standard.set(newValue, forKey: "defaultTripCategory")
            }
        }
    }
}

#Preview {
    SettingsView()
}

