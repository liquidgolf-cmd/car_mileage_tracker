import { Trip, Expense } from '../types';

const TRIPS_STORAGE_KEY = 'car_mileage_trips';
const EXPENSES_STORAGE_KEY = 'car_mileage_expenses';
const SETTINGS_STORAGE_KEY = 'car_mileage_settings';

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
}

