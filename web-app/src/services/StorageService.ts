import { Trip, Expense, Business, Receipt } from '../types';

const TRIPS_STORAGE_KEY = 'car_mileage_trips';
const EXPENSES_STORAGE_KEY = 'car_mileage_expenses';
const SETTINGS_STORAGE_KEY = 'car_mileage_settings';
const BUSINESSES_STORAGE_KEY = 'car_mileage_businesses';
const RECEIPTS_STORAGE_KEY = 'car_mileage_receipts';

export interface AppSettings {
  defaultCategory: string;
  mileageRate: number;
  customExpenseCategories?: string[];
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

  // Expense methods
  static getExpenses(): Expense[] {
    try {
      const stored = localStorage.getItem(EXPENSES_STORAGE_KEY);
      if (!stored) return [];
      
      const expenses = JSON.parse(stored);
      return expenses.map((expense: any) => ({
        ...expense,
        date: new Date(expense.date)
      }));
    } catch (error) {
      console.error('Error loading expenses:', error);
      return [];
    }
  }

  static getExpensesForDateRange(startDate: Date, endDate: Date): Expense[] {
    const expenses = this.getExpenses();
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= startDate && expenseDate <= endDate;
    });
  }

  static getExpensesForTrip(tripId: string): Expense[] {
    const expenses = this.getExpenses();
    return expenses.filter(expense => expense.tripId === tripId);
  }

  static saveExpense(expense: Expense): void {
    const expenses = this.getExpenses();
    expenses.unshift(expense); // Add to beginning
    localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(expenses));
  }

  static updateExpense(updatedExpense: Expense): void {
    const expenses = this.getExpenses();
    const index = expenses.findIndex(e => e.id === updatedExpense.id);
    if (index !== -1) {
      expenses[index] = updatedExpense;
      localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(expenses));
    }
  }

  static deleteExpense(expenseId: string): void {
    const expenses = this.getExpenses();
    const filtered = expenses.filter(e => e.id !== expenseId);
    localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(filtered));
  }

  static getExpenseCountForMonth(month: number, year: number): number {
    const expenses = this.getExpenses();
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === month && expenseDate.getFullYear() === year;
    }).length;
  }

  // Custom expense category methods
  static getCustomExpenseCategories(): string[] {
    const settings = this.getSettings();
    return settings.customExpenseCategories || [];
  }

  static addCustomExpenseCategory(category: string): void {
    if (!category || category.trim() === '') return;
    
    const categories = this.getCustomExpenseCategories();
    const trimmedCategory = category.trim();
    
    // Don't add duplicates
    if (categories.includes(trimmedCategory)) return;
    
    categories.push(trimmedCategory);
    this.saveSettings({ customExpenseCategories: categories });
  }

  static removeCustomExpenseCategory(category: string): void {
    const categories = this.getCustomExpenseCategories();
    const filtered = categories.filter(cat => cat !== category);
    this.saveSettings({ customExpenseCategories: filtered });
  }

  static isCustomCategoryInUse(category: string): boolean {
    const expenses = this.getExpenses();
    return expenses.some(expense => expense.category === category);
  }

  // Business methods
  static getBusinesses(): Business[] {
    try {
      const stored = localStorage.getItem(BUSINESSES_STORAGE_KEY);
      if (!stored) return [];
      
      const businesses = JSON.parse(stored);
      return businesses.map((business: any) => ({
        ...business,
        createdAt: new Date(business.createdAt)
      }));
    } catch (error) {
      console.error('Error loading businesses:', error);
      return [];
    }
  }

  static saveBusiness(business: Business): void {
    const businesses = this.getBusinesses();
    const existingIndex = businesses.findIndex(b => b.id === business.id);
    
    if (existingIndex !== -1) {
      businesses[existingIndex] = business;
    } else {
      businesses.push(business);
    }
    
    localStorage.setItem(BUSINESSES_STORAGE_KEY, JSON.stringify(businesses));
  }

  static updateBusiness(business: Business): void {
    this.saveBusiness(business);
  }

  static deleteBusiness(businessId: string): void {
    const businesses = this.getBusinesses();
    const filtered = businesses.filter(b => b.id !== businessId);
    localStorage.setItem(BUSINESSES_STORAGE_KEY, JSON.stringify(filtered));
  }

  static getBusiness(businessId: string): Business | undefined {
    const businesses = this.getBusinesses();
    return businesses.find(b => b.id === businessId);
  }

  static isBusinessInUse(businessId: string): boolean {
    const trips = this.getTrips();
    const expenses = this.getExpenses();
    return trips.some(trip => trip.businessId === businessId) ||
           expenses.some(expense => expense.businessId === businessId);
  }

  // Receipt methods
  static getReceipts(): Receipt[] {
    try {
      const stored = localStorage.getItem(RECEIPTS_STORAGE_KEY);
      if (!stored) return [];
      
      const receipts = JSON.parse(stored);
      return receipts.map((receipt: any) => ({
        ...receipt,
        uploadDate: new Date(receipt.uploadDate),
        extractedData: receipt.extractedData ? {
          ...receipt.extractedData,
          date: receipt.extractedData.date ? new Date(receipt.extractedData.date) : undefined
        } : undefined
      }));
    } catch (error) {
      console.error('Error loading receipts:', error);
      return [];
    }
  }

  static saveReceipt(receipt: Receipt): void {
    const receipts = this.getReceipts();
    const existingIndex = receipts.findIndex(r => r.id === receipt.id);
    
    if (existingIndex !== -1) {
      receipts[existingIndex] = receipt;
    } else {
      receipts.unshift(receipt); // Add to beginning
    }
    
    localStorage.setItem(RECEIPTS_STORAGE_KEY, JSON.stringify(receipts));
  }

  static updateReceipt(receipt: Receipt): void {
    this.saveReceipt(receipt);
  }

  static deleteReceipt(receiptId: string): void {
    const receipts = this.getReceipts();
    const filtered = receipts.filter(r => r.id !== receiptId);
    localStorage.setItem(RECEIPTS_STORAGE_KEY, JSON.stringify(filtered));
  }

  static getReceiptsForDateRange(startDate: Date, endDate: Date): Receipt[] {
    const receipts = this.getReceipts();
    return receipts.filter(receipt => {
      const receiptDate = new Date(receipt.uploadDate);
      return receiptDate >= startDate && receiptDate <= endDate;
    });
  }

  static getUnprocessedReceipts(): Receipt[] {
    return this.getReceipts().filter(r => !r.expenseId);
  }

  static linkReceiptToExpense(receiptId: string, expenseId: string): void {
    const receipt = this.getReceipts().find(r => r.id === receiptId);
    if (receipt) {
      receipt.expenseId = expenseId;
      this.saveReceipt(receipt);
    }
  }
}

