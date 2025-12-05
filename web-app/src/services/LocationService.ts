import { LocationData } from '../types';

export class LocationService {
  private watchId: number | null = null;
  private onLocationUpdate: ((location: LocationData) => void) | null = null;

  constructor() {
    // Geocoding will use OpenStreetMap API (free, no key required)
  }

  async requestPermission(): Promise<boolean> {
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by your browser');
    }

    // Check Permissions API first (if available) - more reliable
    if ('permissions' in navigator) {
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        
        // If permission is granted, return true immediately
        if (permissionStatus.state === 'granted') {
          return true;
        }
        
        // If explicitly denied, return false
        if (permissionStatus.state === 'denied') {
          return false;
        }
        
        // If 'prompt', we need to try getting position to trigger the prompt
        // Continue to fallback check below
      } catch (error) {
        // Permissions API might not be fully supported (Safari), fall through
        console.debug('Permissions API check failed, using position check');
      }
    }

    // Fallback: Try to get position (will trigger permission prompt if needed)
    // Be more lenient - only fail if permission is actually denied
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve(true),
        (error) => {
          // Only treat PERMISSION_DENIED as a permission issue
          // Other errors (POSITION_UNAVAILABLE, TIMEOUT) mean permission might be granted
          // but location temporarily unavailable - allow trip to start anyway
          if (error.code === error.PERMISSION_DENIED) {
            resolve(false);
          } else {
            // Position unavailable or timeout - permission is likely granted
            // but location temporarily unavailable (GPS signal, CoreLocation errors, etc.)
            // Allow trip to start - location will work when available
            resolve(true);
          }
        },
        { 
          timeout: 10000, // Longer timeout
          maximumAge: 60000, // Allow cached location (up to 1 minute old)
          enableHighAccuracy: false // Start with lower accuracy (faster, less likely to fail)
        }
      );
    });
  }

  startTracking(
    onUpdate: (location: LocationData) => void,
    onError?: (error: Error) => void
  ): void {
    if (!navigator.geolocation) {
      onError?.(new Error('Geolocation is not supported'));
      return;
    }

    // Stop any existing tracking first
    this.stopTracking();
    console.log('[Location] Starting location tracking...');

    this.onLocationUpdate = onUpdate;

    // Phase 1: Try to get initial location quickly using cached/lower accuracy
    // This gives us a location immediately while GPS locks in the background
    console.log('[Location] Getting initial location (fast, cached allowed)...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('[Location] Initial location received:', {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        
        const location: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          address: '',
          timestamp: new Date()
        };

        // Reverse geocode (non-blocking)
        this.reverseGeocode(location.latitude, location.longitude)
          .then((address) => {
            location.address = address;
          })
          .catch(() => {
            location.address = `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
          })
          .finally(() => {
            // Always call onUpdate with initial location
            this.onLocationUpdate?.(location);
            console.log('[Location] Initial location sent:', location);
          });
      },
      (error) => {
        // Initial location failed - that's okay, watchPosition will try again
        console.debug('[Location] Initial location failed (will continue with watchPosition):', error.message);
      },
      {
        enableHighAccuracy: false, // Use cached/network location first (faster)
        maximumAge: 60000, // Allow up to 1 minute old cached location
        timeout: 5000 // Quick timeout - if GPS isn't ready, we'll get it from watchPosition
      }
    );

    // Phase 2: Start continuous tracking with watchPosition
    // This will provide updates as GPS gets more accurate
    const watchOptions: PositionOptions = {
      enableHighAccuracy: true, // Use GPS for continuous tracking
      maximumAge: 10000, // Allow cached location up to 10 seconds old
      timeout: 30000 // Longer timeout - give GPS time to lock
    };

    this.watchId = navigator.geolocation.watchPosition(
      async (position) => {
        console.log('[Location] Position update received:', {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        
        const location: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          address: '',
          timestamp: new Date()
        };

        // Reverse geocode (non-blocking, don't wait)
        this.reverseGeocode(location.latitude, location.longitude)
          .then((address) => {
            location.address = address;
          })
          .catch(() => {
            location.address = `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
          })
          .finally(() => {
            // Always call onUpdate, even if geocoding fails
            this.onLocationUpdate?.(location);
            console.log('[Location] Location update sent:', location);
          });
      },
      (error) => {
        // Suppress CoreLocation framework errors (harmless browser warnings)
        const errorMessage = error.message || '';
        const isCoreLocationError = errorMessage.includes('CoreLocation') || 
                                   errorMessage.includes('kCLError');
        
        if (!isCoreLocationError) {
          // Only log actual errors, not harmless CoreLocation warnings
          switch (error.code) {
            case error.PERMISSION_DENIED:
              const errorMsg = 'Location permission denied. Please enable location access in your browser settings.';
              console.error('[Location]', errorMsg);
              onError?.(new Error(errorMsg));
              // Stop tracking if permission denied
              this.stopTracking();
              break;
            case error.POSITION_UNAVAILABLE:
              // Position unavailable is common - log as debug
              console.debug('[Location] Position temporarily unavailable - will continue watching');
              break;
            case error.TIMEOUT:
              // Timeout is common - log as debug
              console.debug('[Location] Location request timed out - will continue watching');
              break;
            default:
              console.debug('[Location] Location error (will continue watching):', error.message || 'Unknown error');
          }
        }
        // Continue watching - location may become available later
        // watchPosition continues even after errors
      },
      watchOptions
    );
    
    console.log('[Location] Location tracking started, watchId:', this.watchId);
  }

  stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      console.log('[Location] Tracking stopped.');
    }
    this.onLocationUpdate = null;
  }

  isTracking(): boolean {
    return this.watchId !== null;
  }

  async reverseGeocode(lat: number, lng: number): Promise<string> {
    // Use OpenStreetMap Nominatim API (free, no API key required)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        {
          headers: {
            'User-Agent': 'CarMileageTracker/1.0'
          }
        }
      );
      const data = await response.json();
      if (data.display_name) {
        return data.display_name;
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
    // Fallback to coordinates if geocoding fails
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }

  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    // Use OpenStreetMap Nominatim API for forward geocoding
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        {
          headers: {
            'User-Agent': 'CarMileageTracker/1.0'
          }
        }
      );
      const data = await response.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
    return null;
  }

  async calculateDistanceFromAddresses(startAddress: string, endAddress: string): Promise<number | null> {
    const startCoords = await this.geocodeAddress(startAddress);
    const endCoords = await this.geocodeAddress(endAddress);
    
    if (startCoords && endCoords) {
      return this.calculateDistance(
        startCoords.lat,
        startCoords.lng,
        endCoords.lat,
        endCoords.lng
      );
    }
    
    return null;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export const locationService = new LocationService();
