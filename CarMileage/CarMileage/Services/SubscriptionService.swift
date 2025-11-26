//
//  SubscriptionService.swift
//  CarMileage
//
//  Created on [Date]
//

import Foundation
import StoreKit
import Combine

class SubscriptionService: ObservableObject {
    static let shared = SubscriptionService()
    
    @Published var isPremium = false
    @Published var subscriptionStatus: Product.SubscriptionInfo.Status?
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    let productId = "com.carmileage.premium.monthly"
    private let freeTripsPerMonth = 40
    private var updateListenerTask: Task<Void, Error>?
    
    private init() {
        updateListenerTask = listenForTransactions()
        Task {
            await checkSubscriptionStatus()
        }
    }
    
    var tripsThisMonth: Int {
        return CoreDataService.shared.getTripCountForCurrentMonth()
    }
    
    func canStartTrip() -> Bool {
        if isPremium {
            return true
        }
        return tripsThisMonth < freeTripsPerMonth
    }
    
    @MainActor
    func checkSubscriptionStatus() async {
        do {
            guard let product = try await Product.products(for: [productId]).first else {
                // Product not configured in App Store Connect yet
                // In development, we'll allow free tier
                return
            }
            
            guard let subscriptionInfo = product.subscription else {
                return
            }
            
            let statuses = try await subscriptionInfo.status
            
            var highestStatus: Product.SubscriptionInfo.Status?
            var highestProduct: Product?
            
            for (status, product) in statuses {
                switch status.state {
                case .subscribed, .inGracePeriod:
                    let transaction = try? checkVerified(status.transaction)
                    if transaction?.expirationDate ?? Date.distantFuture > Date() {
                        if highestStatus == nil || status.transaction.expirationDate ?? Date.distantFuture > highestStatus?.transaction.expirationDate ?? Date.distantPast {
                            highestStatus = status
                            highestProduct = product
                        }
                    }
                case .revoked:
                    break
                case .expired:
                    break
                @unknown default:
                    break
                }
            }
            
            self.subscriptionStatus = highestStatus
            self.isPremium = highestStatus != nil && (highestStatus?.state == .subscribed || highestStatus?.state == .inGracePeriod)
        } catch {
            print("Error checking subscription status: \(error)")
            errorMessage = "Failed to check subscription status"
        }
    }
    
    @MainActor
    func purchaseSubscription() async {
        isLoading = true
        errorMessage = nil
        
        do {
            guard let product = try await Product.products(for: [productId]).first else {
                errorMessage = "Subscription product not available"
                isLoading = false
                return
            }
            
            let result = try await product.purchase()
            
            switch result {
            case .success(let verification):
                let transaction = try checkVerified(verification)
                await transaction.finish()
                await checkSubscriptionStatus()
            case .userCancelled:
                errorMessage = "Purchase cancelled"
            case .pending:
                errorMessage = "Purchase pending"
            @unknown default:
                errorMessage = "Unknown purchase result"
            }
        } catch {
            errorMessage = "Purchase failed: \(error.localizedDescription)"
        }
        
        isLoading = false
    }
    
    @MainActor
    func restorePurchases() {
        Task {
            isLoading = true
            errorMessage = nil
            
            do {
                try await AppStore.sync()
                await checkSubscriptionStatus()
            } catch {
                errorMessage = "Failed to restore purchases: \(error.localizedDescription)"
            }
            
            isLoading = false
        }
    }
    
    private func listenForTransactions() -> Task<Void, Error> {
        return Task.detached {
            for await result in Transaction.updates {
                do {
                    let transaction = try self.checkVerified(result)
                    await transaction.finish()
                    await self.checkSubscriptionStatus()
                } catch {
                    print("Transaction verification failed: \(error)")
                }
            }
        }
    }
    
    private func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .unverified:
            throw StoreError.failedVerification
        case .verified(let safe):
            return safe
        }
    }
    
    deinit {
        updateListenerTask?.cancel()
    }
}

enum StoreError: Error {
    case failedVerification
}

