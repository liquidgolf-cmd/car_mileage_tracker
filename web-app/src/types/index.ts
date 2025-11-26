export enum TripCategory {
  Business = 'Business',
  Personal = 'Personal',
  Medical = 'Medical',
  Charity = 'Charity'
}

export interface Trip {
  id: string;
  startDate: Date;
  endDate: Date | null;
  startLocation: string;
  endLocation: string;
  startLatitude: number;
  startLongitude: number;
  endLatitude: number;
  endLongitude: number;
  distance: number; // in miles
  category: TripCategory;
  notes: string;
  mileageRate: number;
  totalDeduction: number;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  timestamp: Date;
}

export enum ReportPeriod {
  Month = 'Current Month',
  Quarter = 'Current Quarter',
  Year = 'Current Year',
  Custom = 'Custom Range'
}

export interface SubscriptionStatus {
  isPremium: boolean;
  tripsThisMonth: number;
  freeTripsPerMonth: number;
}

