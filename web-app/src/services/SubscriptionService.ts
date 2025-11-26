import { SubscriptionStatus } from '../types';
import { StorageService } from './StorageService';

const PREMIUM_STORAGE_KEY = 'car_mileage_premium';

export class SubscriptionService {
  private static instance: SubscriptionService;
  private freeTripsPerMonth = 40;

  static getInstance(): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService();
    }
    return SubscriptionService.instance;
  }

  getSubscriptionStatus(): SubscriptionStatus {
    const now = new Date();
    const isPremium = this.isPremium();
    const tripsThisMonth = StorageService.getTripCountForMonth(
      now.getMonth(),
      now.getFullYear()
    );

    return {
      isPremium,
      tripsThisMonth,
      freeTripsPerMonth: this.freeTripsPerMonth
    };
  }

  isPremium(): boolean {
    // For MVP, we'll simulate premium status via localStorage
    // In production, this would check with a backend/subscription service
    const stored = localStorage.getItem(PREMIUM_STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      if (data.expiresAt) {
        return new Date(data.expiresAt) > new Date();
      }
      return data.isPremium === true;
    }
    return false;
  }

  canStartTrip(): boolean {
    const status = this.getSubscriptionStatus();
    if (status.isPremium) return true;
    return status.tripsThisMonth < this.freeTripsPerMonth;
  }

  setPremium(isPremium: boolean, expiresAt?: Date): void {
    localStorage.setItem(
      PREMIUM_STORAGE_KEY,
      JSON.stringify({
        isPremium,
        expiresAt: expiresAt?.toISOString()
      })
    );
  }

  // For testing - simulate premium purchase
  purchasePremium(): Promise<void> {
    return new Promise((resolve) => {
      // Simulate API call delay
      setTimeout(() => {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month subscription
        this.setPremium(true, expiresAt);
        resolve();
      }, 1000);
    });
  }

  restorePurchases(): Promise<void> {
    // In production, this would check with backend
    return Promise.resolve();
  }
}

export const subscriptionService = SubscriptionService.getInstance();

