import { LocationData, TripCategory } from '../types';
import { locationService } from './LocationService';

export interface ActiveTripData {
  startTime: number; // timestamp in milliseconds
  startLocation: LocationData | null;
  currentLocation: LocationData | null;
  distance: number;
  category: TripCategory;
  notes: string;
}

const ACTIVE_TRIP_STORAGE_KEY = 'car_mileage_active_trip';

export class ActiveTripService {
  private static intervalId: number | null = null;
  private static listeners: Set<(data: ActiveTripData | null) => void> = new Set();
  private static locationListeners: Set<(location: LocationData) => void> = new Set();

  static getActiveTrip(): ActiveTripData | null {
    try {
      const stored = localStorage.getItem(ACTIVE_TRIP_STORAGE_KEY);
      if (!stored) return null;
      
      const data = JSON.parse(stored);
      return {
        ...data,
        startLocation: data.startLocation ? {
          ...data.startLocation,
          timestamp: new Date(data.startLocation.timestamp)
        } : null,
        currentLocation: data.currentLocation ? {
          ...data.currentLocation,
          timestamp: new Date(data.currentLocation.timestamp)
        } : null
      };
    } catch (error) {
      console.error('Error loading active trip:', error);
      return null;
    }
  }

  static saveActiveTrip(data: ActiveTripData): void {
    try {
      localStorage.setItem(ACTIVE_TRIP_STORAGE_KEY, JSON.stringify(data));
      this.notifyListeners(data);
    } catch (error) {
      console.error('Error saving active trip:', error);
    }
  }

  static clearActiveTrip(): void {
    localStorage.removeItem(ACTIVE_TRIP_STORAGE_KEY);
    this.stopTimer();
    this.notifyListeners(null);
  }

  static startTimer(onUpdate: () => void): void {
    // Clear existing timer if any
    this.stopTimer();
    
    // Start new timer
    this.intervalId = window.setInterval(() => {
      onUpdate();
    }, 1000);
  }

  static stopTimer(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  static subscribe(listener: (data: ActiveTripData | null) => void): () => void {
    this.listeners.add(listener);
    // Immediately notify with current state
    listener(this.getActiveTrip());
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  static subscribeToLocation(listener: (location: LocationData) => void): () => void {
    this.locationListeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.locationListeners.delete(listener);
    };
  }

  private static notifyListeners(data: ActiveTripData | null): void {
    this.listeners.forEach(listener => listener(data));
  }

  static notifyLocationListeners(location: LocationData): void {
    this.locationListeners.forEach(listener => listener(location));
  }

  static updateLocation(location: LocationData): void {
    const activeTrip = this.getActiveTrip();
    if (!activeTrip) {
      console.warn('[ActiveTrip] updateLocation called but no active trip');
      return;
    }

    console.log('[ActiveTrip] Location update received:', {
      hasStartLocation: !!activeTrip.startLocation,
      newLocation: { lat: location.latitude, lng: location.longitude }
    });

    // If no start location yet, set it
    if (!activeTrip.startLocation) {
      activeTrip.startLocation = location;
      console.log('[ActiveTrip] Start location set:', location);
    }

    activeTrip.currentLocation = location;

    // Calculate distance if we have start location
    if (activeTrip.startLocation) {
      const dist = locationService.calculateDistance(
        activeTrip.startLocation.latitude,
        activeTrip.startLocation.longitude,
        location.latitude,
        location.longitude
      );
      activeTrip.distance = dist;
      console.log('[ActiveTrip] Distance updated:', dist.toFixed(2), 'miles');
    } else {
      console.warn('[ActiveTrip] Cannot calculate distance - no start location');
    }
    
    this.saveActiveTrip(activeTrip);

    this.notifyLocationListeners(location);
  }

  static updateDuration(): void {
    const activeTrip = this.getActiveTrip();
    if (!activeTrip) return;

    // Duration is calculated on-the-fly, so we just notify listeners
    this.notifyListeners(activeTrip);
  }

  static updateCategory(category: TripCategory): void {
    const activeTrip = this.getActiveTrip();
    if (!activeTrip) return;

    activeTrip.category = category;
    this.saveActiveTrip(activeTrip);
  }

  static updateNotes(notes: string): void {
    const activeTrip = this.getActiveTrip();
    if (!activeTrip) return;

    activeTrip.notes = notes;
    this.saveActiveTrip(activeTrip);
  }

  static isActive(): boolean {
    return this.getActiveTrip() !== null;
  }
}

