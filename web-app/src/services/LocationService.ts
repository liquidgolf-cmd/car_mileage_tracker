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

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve(true),
        () => resolve(false),
        { timeout: 5000 }
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
        onError?.(new Error(`Location error: ${error.message}`));
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

  private async reverseGeocode(lat: number, lng: number): Promise<string> {
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

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export const locationService = new LocationService();

