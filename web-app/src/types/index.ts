export enum TripCategory {
  Business = 'Business',
  Personal = 'Personal',
  Medical = 'Medical',
  Charity = 'Charity',
  Uncategorized = 'Uncategorized'
}

export interface Business {
  id: string;
  name: string;
  color?: string;
  createdAt: Date;
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
  businessId?: string;
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

export enum ExpenseCategory {
  Gas = 'Gas',
  Parking = 'Parking',
  Tolls = 'Tolls',
  Meals = 'Meals',
  OfficeSupplies = 'Office Supplies',
  Equipment = 'Equipment',
  Phone = 'Phone',
  Internet = 'Internet',
  Software = 'Software',
  Travel = 'Travel',
  ProfessionalServices = 'Professional Services',
  Other = 'Other'
}

export interface Expense {
  id: string;
  date: Date;
  amount: number;
  category: ExpenseCategory | string; // string for custom categories
  description: string;
  receiptImage?: string; // optional, base64 or URL for future receipt attachment
  tripId?: string; // optional link to Trip
  businessId?: string;
  notes: string;
}

export enum ReportType {
  Mileage = 'Mileage Only',
  Expenses = 'Expenses Only',
  Combined = 'Combined'
}

export interface ReceiptExtractedData {
  amount?: number;
  date?: Date;
  merchant?: string;
  items?: string[];
  confidence: number; // 0-1
  rawText?: string;
}

export interface Receipt {
  id: string;
  imageData: string; // base64 encoded image
  uploadDate: Date;
  extractedData?: ReceiptExtractedData;
  expenseId?: string; // linked expense if converted
  businessId?: string;
}

