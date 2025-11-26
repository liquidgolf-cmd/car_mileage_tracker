import { LocationData } from '../types';
import { locationService } from './LocationService';
import { ActiveTripService, ActiveTripData } from './ActiveTripService';
import { StorageService } from './StorageService';
import { TripCategory } from '../types';

export class AutoTrackingService {
  private static isEnabled = false;
  private static watchId: number | null = null;
  private static lastLocation: LocationData | null = null;
  private static lastSpeed: number = 0;
  private static speedHistory: number[] = [];
  private static isDriving = false;
  private static drivingStartTime: number | null = null;
  private static stationaryStartTime: number | null = null;
  private static listeners: Set<(isDriving: boolean) => void> = new Set();
  
  // Configuration
  private static readonly DRIVING_SPEED_THRESHOLD = 10; // mph - minimum speed to consider driving
  private static readonly STATIONARY_SPEED_THRESHOLD = 3; // mph - below this is considered stopped
  private static readonly MIN_DRIVING_TIME = 30000; // 30 seconds - minimum time moving to start trip
  private static readonly MIN_STATIONARY_TIME = 60000; // 60 seconds - minimum time stopped to end trip

  static isAutoTrackingEnabled(): boolean {
    return this.isEnabled;
  }

  static enableAutoTracking(): void {
    if (this.isEnabled) return;
    
    this.isEnabled = true;
    this.startMonitoring();
  }

  static disableAutoTracking(): void {
    if (!this.isEnabled) return;
    
    this.isEnabled = false;
    this.stopMonitoring();
    
    // If currently driving and tracking, stop the trip
    if (this.isDriving && ActiveTripService.isActive()) {
      // Trip will be stopped when user opens app
      this.isDriving = false;
    }
  }

  private static startMonitoring(): void {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 10000
    };

    // Start watching position
    this.watchId = navigator.geolocation.watchPosition(
      async (position) => {
        await this.handleLocationUpdate(position);
      },
      (error) => {
        console.error('Auto-tracking location error:', error);
      },
      options
    );
  }

  private static stopMonitoring(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.lastLocation = null;
    this.lastSpeed = 0;
    this.speedHistory = [];
  }

  private static async handleLocationUpdate(position: GeolocationPosition): Promise<void> {
    const currentLocation: LocationData = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      address: '',
      timestamp: new Date()
    };

    // Calculate speed if we have previous location
    let speed = 0;
    if (this.lastLocation && position.coords.speed !== null && position.coords.speed !== undefined) {
      // Use device-reported speed (converted from m/s to mph)
      speed = (position.coords.speed || 0) * 2.237; // m/s to mph
    } else if (this.lastLocation) {
      // Calculate speed from distance and time
      const distance = locationService.calculateDistance(
        this.lastLocation.latitude,
        this.lastLocation.longitude,
        currentLocation.latitude,
        currentLocation.longitude
      );
      const timeDiff = (currentLocation.timestamp.getTime() - this.lastLocation.timestamp.getTime()) / 1000; // seconds
      if (timeDiff > 0) {
        speed = (distance / timeDiff) * 3600; // miles per hour
      }
    }

    // Update speed history (keep last 5 readings for smoothing)
    this.speedHistory.push(speed);
    if (this.speedHistory.length > 5) {
      this.speedHistory.shift();
    }
    
    // Average speed for more stable detection
    const avgSpeed = this.speedHistory.reduce((a, b) => a + b, 0) / this.speedHistory.length;
    this.lastSpeed = avgSpeed;

    // Determine if driving
    const now = Date.now();
    const wasDriving = this.isDriving;

    if (avgSpeed >= this.DRIVING_SPEED_THRESHOLD) {
      // Moving fast enough to be driving
      if (!this.isDriving) {
        // Just started moving
        this.drivingStartTime = now;
        this.stationaryStartTime = null;
      }
      
      // Check if we've been moving long enough to start tracking
      if (!wasDriving && this.drivingStartTime && (now - this.drivingStartTime) >= this.MIN_DRIVING_TIME) {
        this.startAutoTrip(currentLocation);
        this.isDriving = true;
        this.notifyListeners(true);
      } else if (wasDriving) {
        // Already driving - update trip location
        if (ActiveTripService.isActive()) {
          ActiveTripService.updateLocation(currentLocation);
        }
      }
    } else if (avgSpeed <= this.STATIONARY_SPEED_THRESHOLD) {
      // Moving slowly or stopped
      if (this.isDriving) {
        // Just stopped
        if (!this.stationaryStartTime) {
          this.stationaryStartTime = now;
        }
        
        // Check if we've been stopped long enough to end trip
        if (this.stationaryStartTime && (now - this.stationaryStartTime) >= this.MIN_STATIONARY_TIME) {
          // Don't auto-end - let user confirm when they open the app
          // Just mark as not driving
          this.isDriving = false;
          this.notifyListeners(false);
        }
      } else {
        this.stationaryStartTime = null;
        this.drivingStartTime = null;
      }
    }

    this.lastLocation = currentLocation;
  }

  private static async startAutoTrip(location: LocationData): Promise<void> {
    // Don't start if already tracking
    if (ActiveTripService.isActive()) {
      return;
    }

    // Check subscription limits (only if subscription service exists)
    try {
      const { subscriptionService } = await import('./SubscriptionService');
      if (!subscriptionService.canStartTrip()) {
        // Can't start trip due to limits - notify user when they open app
        console.log('Auto-tracking: Cannot start trip - subscription limit reached');
        return;
      }
    } catch (e) {
      // Subscription service might not be available, continue anyway
    }

    // Get default settings
    const settings = StorageService.getSettings();
    const defaultCategory = (settings.defaultCategory as TripCategory) || TripCategory.Business;

    // Reverse geocode the start location (async, but don't wait)
    locationService.reverseGeocode(location.latitude, location.longitude).then((address) => {
      if (address) {
        location.address = address;
        // Update the trip with geocoded address
        const currentTrip = ActiveTripService.getActiveTrip();
        if (currentTrip && currentTrip.startLocation) {
          currentTrip.startLocation.address = address;
          ActiveTripService.saveActiveTrip(currentTrip);
        }
      }
    }).catch(() => {
      location.address = `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
    });
    
    // Set initial address to coordinates
    if (!location.address) {
      location.address = `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
    }

    // Initialize trip
    const tripData: ActiveTripData = {
      startTime: Date.now(),
      startLocation: location,
      currentLocation: location,
      distance: 0,
      category: defaultCategory,
      notes: 'Auto-started'
    };

    ActiveTripService.saveActiveTrip(tripData);

    // Start location tracking
    locationService.startTracking(
      (loc) => {
        ActiveTripService.updateLocation(loc);
      },
      (err) => {
        console.error('Auto-tracking location error:', err);
      }
    );

    // Start timer
    ActiveTripService.startTimer(() => {
      ActiveTripService.updateDuration();
    });

    console.log('Auto-tracking: Trip started automatically');
  }

  static subscribe(listener: (isDriving: boolean) => void): () => void {
    this.listeners.add(listener);
    // Immediately notify with current state
    listener(this.isDriving);
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notifyListeners(isDriving: boolean): void {
    this.listeners.forEach(listener => listener(isDriving));
  }

  static getCurrentSpeed(): number {
    return this.lastSpeed;
  }

  static isCurrentlyDriving(): boolean {
    return this.isDriving;
  }

  // Load saved auto-tracking preference
  static loadPreference(): boolean {
    try {
      const stored = localStorage.getItem('car_mileage_auto_tracking_enabled');
      return stored === 'true';
    } catch {
      return false;
    }
  }

  // Save auto-tracking preference
  static savePreference(enabled: boolean): void {
    try {
      localStorage.setItem('car_mileage_auto_tracking_enabled', enabled ? 'true' : 'false');
    } catch (error) {
      console.error('Error saving auto-tracking preference:', error);
    }
  }
}

// Initialize auto-tracking if previously enabled
if (typeof window !== 'undefined') {
  const wasEnabled = AutoTrackingService.loadPreference();
  if (wasEnabled) {
    // Request permission first
    locationService.requestPermission().then((granted) => {
      if (granted) {
        AutoTrackingService.enableAutoTracking();
      }
    });
  }
}

