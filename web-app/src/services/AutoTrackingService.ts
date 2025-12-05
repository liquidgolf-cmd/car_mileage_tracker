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
  private static tripActive = false; // Whether we're in an active trip
  private static drivingStartTime: number | null = null;
  private static stationaryStartTime: number | null = null;
  private static lastSignificantMovement: number | null = null; // Timestamp of last position change
  private static lastSignificantLocation: LocationData | null = null; // Last location where movement was detected
  private static listeners: Set<(isDriving: boolean) => void> = new Set();
  
  // Configuration - Trip Start (strict to prevent false starts)
  private static readonly TRIP_START_SPEED_THRESHOLD = 10; // mph - minimum speed to start a new trip
  private static readonly MIN_TRIP_START_TIME = 30000; // 30 seconds - minimum time moving to start trip
  
  // Configuration - Trip Continuation (lenient for rush hour traffic)
  private static readonly TRIP_CONTINUATION_SPEED_THRESHOLD = 3; // mph - keep trip alive at lower speeds
  private static readonly MIN_MOVEMENT_DISTANCE = 0.01; // miles (~50 feet) - minimum distance to count as movement
  private static readonly MOVEMENT_CHECK_WINDOW = 120000; // 2 minutes - window to check for movement
  
  // Configuration - Trip End (very strict - only end when truly stopped)
  private static readonly MIN_TRIP_END_STATIONARY_TIME = 300000; // 5 minutes (300 seconds) - time before considering trip ended
  private static readonly MAX_STATIONARY_SPEED = 2; // mph - max speed to consider stationary

  static isAutoTrackingEnabled(): boolean {
    return this.isEnabled;
  }

  static enableAutoTracking(): void {
    if (this.isEnabled) {
      console.log('[Auto-Tracking] Already enabled');
      return;
    }
    
    console.log('[Auto-Tracking] Enabling auto-tracking...');
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
    this.tripActive = false;
  }

  private static startMonitoring(): void {
    if (!navigator.geolocation) {
      console.error('[Auto-Tracking] Geolocation not supported');
      return;
    }

    console.log('[Auto-Tracking] Starting location monitoring...');
    
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
        console.error('[Auto-Tracking] Location error:', error);
        let errorMsg = 'Unknown error';
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = 'Permission denied - check browser settings';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = 'Position unavailable - GPS signal weak?';
        } else if (error.code === error.TIMEOUT) {
          errorMsg = 'Location request timed out';
        }
        console.error(`[Auto-Tracking] ${errorMsg}`);
      },
      options
    );
    
    console.log('[Auto-Tracking] Monitoring started successfully');
  }

  private static stopMonitoring(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.lastLocation = null;
    this.lastSpeed = 0;
    this.speedHistory = [];
    this.tripActive = false;
    this.lastSignificantMovement = null;
    this.lastSignificantLocation = null;
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

    // Update speed history (keep last 10 readings for better smoothing)
    this.speedHistory.push(speed);
    if (this.speedHistory.length > 10) {
      this.speedHistory.shift();
    }
    
    // Calculate weighted average (recent speeds weighted more heavily)
    let totalWeight = 0;
    let weightedSum = 0;
    this.speedHistory.forEach((s, index) => {
      const weight = index + 1; // More recent = higher weight
      weightedSum += s * weight;
      totalWeight += weight;
    });
    const avgSpeed = totalWeight > 0 ? weightedSum / totalWeight : 0;
    this.lastSpeed = avgSpeed;

    // Calculate distance moved since last location
    let distanceMoved = 0;
    if (this.lastLocation) {
      distanceMoved = locationService.calculateDistance(
        this.lastLocation.latitude,
        this.lastLocation.longitude,
        currentLocation.latitude,
        currentLocation.longitude
      );
    }

    const now = Date.now();

    // Check if trip is currently active
    const hasActiveTrip = ActiveTripService.isActive();
    if (hasActiveTrip && !this.tripActive) {
      // Trip was started (maybe manually), mark as active
      this.tripActive = true;
      this.lastSignificantMovement = now;
      this.lastSignificantLocation = currentLocation;
    }

    if (this.tripActive) {
      // Trip is active - use lenient continuation logic
      this.handleActiveTrip(currentLocation, avgSpeed, distanceMoved, now);
    } else {
      // No active trip - use strict start logic
      this.handleTripStart(currentLocation, avgSpeed, distanceMoved, now);
    }

    // Update significant movement tracking
    if (distanceMoved >= this.MIN_MOVEMENT_DISTANCE) {
      this.lastSignificantMovement = now;
      this.lastSignificantLocation = currentLocation;
    }

    this.lastLocation = currentLocation;
  }

  private static handleTripStart(
    location: LocationData,
    avgSpeed: number,
    _distanceMoved: number, // Reserved for future use
    now: number
  ): void {
    // Strict criteria to start a new trip
    if (avgSpeed >= this.TRIP_START_SPEED_THRESHOLD) {
      // Moving fast enough to start a trip
      if (!this.isDriving) {
        this.drivingStartTime = now;
        this.stationaryStartTime = null;
        console.log(`[Auto-Tracking] Detected movement at ${avgSpeed.toFixed(1)} mph - starting timer`);
      }
      
      // Check if we've been moving long enough to start tracking
      if (this.drivingStartTime) {
        const timeMoving = now - this.drivingStartTime;
        const timeRemaining = (this.MIN_TRIP_START_TIME - timeMoving) / 1000;
        
        if (timeMoving >= this.MIN_TRIP_START_TIME) {
          console.log(`[Auto-Tracking] Starting trip - been moving for ${(timeMoving / 1000).toFixed(0)}s at ${avgSpeed.toFixed(1)} mph`);
          this.startAutoTrip(location);
          this.isDriving = true;
          this.tripActive = true;
          this.lastSignificantMovement = now;
          this.lastSignificantLocation = location;
          this.notifyListeners(true);
        } else if (timeMoving % 5000 < 1000) { // Log every 5 seconds
          console.log(`[Auto-Tracking] Moving at ${avgSpeed.toFixed(1)} mph - ${timeRemaining.toFixed(0)}s until trip starts`);
        }
      }
    } else {
      // Not moving fast enough - reset start timer
      if (this.drivingStartTime) {
        console.log(`[Auto-Tracking] Speed dropped to ${avgSpeed.toFixed(1)} mph (need ${this.TRIP_START_SPEED_THRESHOLD} mph) - resetting timer`);
        this.drivingStartTime = null;
      }
    }
  }

  private static handleActiveTrip(
    location: LocationData,
    avgSpeed: number,
    distanceMoved: number,
    now: number
  ): void {
    // Lenient criteria to continue an active trip
    const wasDriving = this.isDriving;
    
    // Update trip location continuously
    if (ActiveTripService.isActive()) {
      ActiveTripService.updateLocation(location);
    }

    // Check if we should continue the trip
    const shouldContinue = this.shouldContinueTrip(avgSpeed, distanceMoved, now);

    if (shouldContinue) {
      // Continue trip - reset stationary timer
      this.stationaryStartTime = null;
      this.isDriving = avgSpeed >= this.TRIP_CONTINUATION_SPEED_THRESHOLD;
      
      if (!wasDriving && this.isDriving) {
        this.notifyListeners(true);
      }
    } else {
      // Might be stopping - check if truly stopped
      // Only consider stationary if speed is very low
      if (avgSpeed <= this.MAX_STATIONARY_SPEED) {
        if (!this.stationaryStartTime) {
          this.stationaryStartTime = now;
        }

        // Check if we've been truly stationary long enough to consider trip ended
        const stationaryDuration = now - this.stationaryStartTime;
        if (stationaryDuration >= this.MIN_TRIP_END_STATIONARY_TIME) {
          // Been stationary for 5+ minutes - mark as stopped
          // Don't auto-end - let user confirm when they open the app
          this.isDriving = false;
          this.notifyListeners(false);
        } else {
          // Still in the grace period - keep trip alive
          this.isDriving = false;
        }
      } else {
        // Speed is low but not zero - reset stationary timer
        this.stationaryStartTime = null;
      }
    }
  }

  private static shouldContinueTrip(
    avgSpeed: number,
    distanceMoved: number,
    now: number
  ): boolean {
    // Continue trip if ANY of these conditions are met:
    
    // 1. Speed is above continuation threshold (even slow traffic)
    if (avgSpeed >= this.TRIP_CONTINUATION_SPEED_THRESHOLD) {
      return true;
    }

    // 2. Position moved significantly (creeping forward in traffic)
    if (distanceMoved >= this.MIN_MOVEMENT_DISTANCE) {
      return true;
    }

    // 3. Movement detected recently (within last 2 minutes)
    if (this.lastSignificantMovement && 
        (now - this.lastSignificantMovement) < this.MOVEMENT_CHECK_WINDOW) {
      return true;
    }

    // 4. Speed was decent recently (was moving in last 5 minutes)
    // Check if any recent speeds in history were above 5 mph
    const recentSpeeds = this.speedHistory.slice(-10); // Last 10 readings
    const hasRecentSpeed = recentSpeeds.some(s => s >= 5);
    if (hasRecentSpeed) {
      return true;
    }

    return false;
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
    this.tripActive = true;
    this.lastSignificantMovement = Date.now();
    this.lastSignificantLocation = location;

    // Start location tracking
    locationService.startTracking(
      (loc) => {
        ActiveTripService.updateLocation(loc);
        // Update movement tracking
        if (this.lastSignificantLocation) {
          const dist = locationService.calculateDistance(
            this.lastSignificantLocation.latitude,
            this.lastSignificantLocation.longitude,
            loc.latitude,
            loc.longitude
          );
          if (dist >= this.MIN_MOVEMENT_DISTANCE) {
            this.lastSignificantMovement = Date.now();
            this.lastSignificantLocation = loc;
          }
        }
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

