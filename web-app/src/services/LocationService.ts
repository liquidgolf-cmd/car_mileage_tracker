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

    this.onLocationUpdate = onUpdate;

    const options: PositionOptions = {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000
    };

    this.watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const location: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          address: '',
          timestamp: new Date()
        };

        // Reverse geocode
        try {
          location.address = await this.reverseGeocode(
            location.latitude,
            location.longitude
          );
        } catch (error) {
          location.address = `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
        }

        this.onLocationUpdate?.(location);
      },
      (error) => {
        // Handle different location error codes
        let errorMessage = 'Location error: ';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location unavailable. Your device may not be able to determine location.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again.';
            break;
          default:
            errorMessage = `Location error: ${error.message || 'Unable to get location'}`;
        }
        
        // Suppress CoreLocation framework errors (harmless browser warnings)
        const shouldSuppress = error.message?.includes('CoreLocation') || 
                              error.message?.includes('kCLError');
        
        if (!shouldSuppress) {
          onError?.(new Error(errorMessage));
        }
      },
      options
    );
  }

  stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.onLocationUpdate = null;
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
