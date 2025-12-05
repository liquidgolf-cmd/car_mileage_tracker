/**
 * Auto-Tracking Diagnostics Tool
 * Helps debug why auto-tracking isn't working
 */

import { AutoTrackingService } from '../services/AutoTrackingService';
import { locationService } from '../services/LocationService';

export interface AutoTrackingDiagnostics {
  isEnabled: boolean;
  hasPermission: boolean;
  isMonitoring: boolean;
  currentSpeed: number;
  isDriving: boolean;
  lastLocation: { lat: number; lng: number; timestamp: Date } | null;
  errors: string[];
  recommendations: string[];
}

export async function diagnoseAutoTracking(): Promise<AutoTrackingDiagnostics> {
  const diagnostics: AutoTrackingDiagnostics = {
    isEnabled: false,
    hasPermission: false,
    isMonitoring: false,
    currentSpeed: 0,
    isDriving: false,
    lastLocation: null,
    errors: [],
    recommendations: []
  };

  // Check if auto-tracking is enabled
  diagnostics.isEnabled = AutoTrackingService.isAutoTrackingEnabled();
  if (!diagnostics.isEnabled) {
    diagnostics.errors.push('Auto-tracking is not enabled in settings');
    diagnostics.recommendations.push('Go to Settings and enable Auto-Tracking');
    return diagnostics;
  }

  // Check location permissions
  try {
    diagnostics.hasPermission = await locationService.requestPermission();
    if (!diagnostics.hasPermission) {
      diagnostics.errors.push('Location permission is not granted');
      diagnostics.recommendations.push('Grant location permission in your browser settings');
      diagnostics.recommendations.push('On Mac: System Settings → Privacy & Security → Location Services');
    }
  } catch (error) {
    diagnostics.errors.push(`Permission check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    diagnostics.recommendations.push('Try refreshing the page and allowing location access');
  }

  // Check current state
  diagnostics.isDriving = AutoTrackingService.isCurrentlyDriving();
  diagnostics.currentSpeed = AutoTrackingService.getCurrentSpeed();

  // Check if geolocation is available
  if (!navigator.geolocation) {
    diagnostics.errors.push('Geolocation API is not supported by your browser');
    diagnostics.recommendations.push('Use a modern browser (Chrome, Safari, Firefox, Edge)');
    return diagnostics;
  }

  // Check if monitoring is active (try to get a position)
  try {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Location request timed out'));
      }, 5000);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeout);
          diagnostics.lastLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: new Date()
          };
          diagnostics.isMonitoring = true;
          resolve();
        },
        (error) => {
          clearTimeout(timeout);
          diagnostics.isMonitoring = false;
          if (error.code === error.PERMISSION_DENIED) {
            diagnostics.errors.push('Location permission denied by browser');
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            diagnostics.errors.push('Location temporarily unavailable (GPS signal weak?)');
            diagnostics.recommendations.push('Try moving to an area with better GPS signal');
            diagnostics.recommendations.push('Make sure Location Services is enabled on your device');
          } else if (error.code === error.TIMEOUT) {
            diagnostics.errors.push('Location request timed out');
            diagnostics.recommendations.push('Check your internet connection');
          }
          resolve(); // Don't reject, just log the error
        },
        { timeout: 5000 }
      );
    });
  } catch (error) {
    diagnostics.errors.push(`Location check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Additional recommendations
  if (diagnostics.isEnabled && diagnostics.hasPermission && diagnostics.isMonitoring) {
    if (diagnostics.currentSpeed === 0) {
      diagnostics.recommendations.push('Auto-tracking is active but you\'re not moving. Drive at least 10 mph for 30 seconds to start a trip.');
    } else if (diagnostics.currentSpeed > 0 && diagnostics.currentSpeed < 10) {
      diagnostics.recommendations.push(`Current speed: ${diagnostics.currentSpeed.toFixed(1)} mph. Need 10 mph for 30 seconds to start a trip.`);
    } else if (!diagnostics.isDriving) {
      diagnostics.recommendations.push('Speed detected but trip not started yet. Keep moving for 30 seconds.');
    }
  }

  return diagnostics;
}

export function formatDiagnostics(diagnostics: AutoTrackingDiagnostics): string {
  let output = '=== Auto-Tracking Diagnostics ===\n\n';
  
  output += `Enabled: ${diagnostics.isEnabled ? '✅ Yes' : '❌ No'}\n`;
  output += `Permission: ${diagnostics.hasPermission ? '✅ Granted' : '❌ Not Granted'}\n`;
  output += `Monitoring: ${diagnostics.isMonitoring ? '✅ Active' : '❌ Not Active'}\n`;
  output += `Driving: ${diagnostics.isDriving ? '✅ Yes' : '❌ No'}\n`;
  output += `Speed: ${diagnostics.currentSpeed.toFixed(1)} mph\n`;
  
  if (diagnostics.lastLocation) {
    output += `Last Location: ${diagnostics.lastLocation.lat.toFixed(6)}, ${diagnostics.lastLocation.lng.toFixed(6)}\n`;
    output += `Last Update: ${diagnostics.lastLocation.timestamp.toLocaleTimeString()}\n`;
  }
  
  if (diagnostics.errors.length > 0) {
    output += `\nErrors:\n`;
    diagnostics.errors.forEach(error => {
      output += `  ❌ ${error}\n`;
    });
  }
  
  if (diagnostics.recommendations.length > 0) {
    output += `\nRecommendations:\n`;
    diagnostics.recommendations.forEach(rec => {
      output += `  💡 ${rec}\n`;
    });
  }
  
  return output;
}

