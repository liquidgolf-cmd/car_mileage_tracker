//
//  SubscriptionView.swift
//  CarMileage
//
//  Created on [Date]
//

import SwiftUI
import StoreKit

struct SubscriptionView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var subscriptionService = SubscriptionService.shared
    @State private var products: [Product] = []
    @State private var isLoadingProducts = true
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Header
                    VStack(spacing: 12) {
                        Image(systemName: "star.fill")
                            .font(.system(size: 60))
                            .foregroundColor(.yellow)
                        
                        Text("Upgrade to Premium")
                            .font(.system(size: 32, weight: .bold))
                        
                        Text("Get unlimited trips and more features")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .padding(.top, 40)
                    
                    // Features list
                    VStack(alignment: .leading, spacing: 16) {
                        FeatureRow(icon: "infinity", text: "Unlimited trips per month")
                        FeatureRow(icon: "lock.fill", text: "Cloud backup (coming soon)")
                        FeatureRow(icon: "chart.bar.fill", text: "Advanced reports (coming soon)")
                        FeatureRow(icon: "crown.fill", text: "Priority support")
                    }
                    .padding()
                    
                    // Pricing
                    if isLoadingProducts {
                        ProgressView()
                            .padding()
                    } else if let product = products.first {
                        VStack(spacing: 12) {
                            Text(product.displayPrice)
                                .font(.system(size: 36, weight: .bold))
                            
                            if let subscription = product.subscription {
                                Text("per \(subscription.subscriptionPeriod.unit.localizedDescription)")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                            }
                            
                            Button(action: {
                                Task {
                                    await subscriptionService.purchaseSubscription()
                                }
                            }) {
                                Text("Subscribe Now")
                                    .font(.headline)
                                    .foregroundColor(.white)
                                    .frame(maxWidth: .infinity)
                                    .frame(height: 50)
                                    .background(
                                        RoundedRectangle(cornerRadius: 12)
                                            .fill(Color.blue)
                                    )
                            }
                            .padding(.horizontal, 40)
                            .padding(.top, 8)
                        }
                    } else {
                        Text("Subscription product not available")
                            .foregroundColor(.secondary)
                            .padding()
                    }
                    
                    if let error = subscriptionService.errorMessage {
                        Text(error)
                            .foregroundColor(.red)
                            .font(.caption)
                            .padding()
                    }
                    
                    // Restore purchases
                    Button("Restore Purchases") {
                        subscriptionService.restorePurchases()
                    }
                    .font(.subheadline)
                    .foregroundColor(.blue)
                    .padding(.bottom, 40)
                }
            }
            .navigationTitle("Premium")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
            .task {
                await loadProducts()
            }
            .onAppear {
                Task {
                    await subscriptionService.checkSubscriptionStatus()
                }
            }
        }
    }
    
    @MainActor
    private func loadProducts() async {
        isLoadingProducts = true
        do {
            products = try await Product.products(for: [SubscriptionService.shared.productId])
        } catch {
            print("Error loading products: \(error)")
        }
        isLoadingProducts = false
    }
}

struct FeatureRow: View {
    let icon: String
    let text: String
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(.blue)
                .frame(width: 30)
            
            Text(text)
                .font(.body)
            
            Spacer()
        }
    }
}

extension Product.SubscriptionPeriod.Unit {
    var localizedDescription: String {
        switch self {
        case .day:
            return "day"
        case .week:
            return "week"
        case .month:
            return "month"
        case .year:
            return "year"
        @unknown default:
            return "period"
        }
    }
}

#Preview {
    SubscriptionView()
}

