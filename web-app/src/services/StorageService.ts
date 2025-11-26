import { Trip } from '../types';

const TRIPS_STORAGE_KEY = 'car_mileage_trips';
const SETTINGS_STORAGE_KEY = 'car_mileage_settings';

export interface AppSettings {
  defaultCategory: string;
  mileageRate: number;
}

export class StorageService {
  private static defaultSettings: AppSettings = {
    defaultCategory: 'Business',
    mileageRate: 0.67 // 2025 IRS rate
  };

  static getTrips(): Trip[] {
    try {
      const stored = localStorage.getItem(TRIPS_STORAGE_KEY);
      if (!stored) return [];
      
      const trips = JSON.parse(stored);
      return trips.map((trip: any) => ({
        ...trip,
        startDate: new Date(trip.startDate),
        endDate: trip.endDate ? new Date(trip.endDate) : null
      }));
    } catch (error) {
      console.error('Error loading trips:', error);
      return [];
    }
  }

  static saveTrip(trip: Trip): void {
    const trips = this.getTrips();
    trips.unshift(trip); // Add to beginning
    localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(trips));
  }

  static deleteTrip(tripId: string): void {
    const trips = this.getTrips();
    const filtered = trips.filter(t => t.id !== tripId);
    localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(filtered));
  }

  static updateTrip(updatedTrip: Trip): void {
    const trips = this.getTrips();
    const index = trips.findIndex(t => t.id === updatedTrip.id);
    if (index !== -1) {
      trips[index] = updatedTrip;
      localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(trips));
    }
  }

  static getSettings(): AppSettings {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!stored) return { ...this.defaultSettings };
      return { ...this.defaultSettings, ...JSON.parse(stored) };
    } catch (error) {
      console.error('Error loading settings:', error);
      return { ...this.defaultSettings };
    }
  }

  static saveSettings(settings: Partial<AppSettings>): void {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
  }

  static getTripCountForMonth(month: number, year: number): number {
    const trips = this.getTrips();
    return trips.filter(trip => {
      const tripDate = new Date(trip.startDate);
      return tripDate.getMonth() === month && tripDate.getFullYear() === year;
    }).length;
  }

  static getTripsForDateRange(startDate: Date, endDate: Date): Trip[] {
    const trips = this.getTrips();
    return trips.filter(trip => {
      const tripDate = new Date(trip.startDate);
      return tripDate >= startDate && tripDate <= endDate;
    });
  }
}

