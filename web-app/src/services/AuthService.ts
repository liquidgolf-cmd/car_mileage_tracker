import { Business } from '../types';
import { StorageService } from './StorageService';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

const AUTH_STORAGE_KEY = 'car_mileage_auth';
const USER_STORAGE_KEY = 'car_mileage_user';

export class AuthService {
  static isAuthenticated(): boolean {
    try {
      const auth = localStorage.getItem(AUTH_STORAGE_KEY);
      return auth === 'true';
    } catch {
      return false;
    }
  }

  static getCurrentUser(): User | null {
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      if (!stored) return null;
      const user = JSON.parse(stored);
      return {
        ...user,
        createdAt: new Date(user.createdAt)
      };
    } catch {
      return null;
    }
  }

  static login(email: string, password: string): boolean {
    // For MVP, we'll use a simple check against stored credentials
    // In production, this would connect to a backend API
    try {
      const users = this.getStoredUsers();
      const user = users.find(u => u.email === email);
      
      if (user && user.password === password) {
        localStorage.setItem(AUTH_STORAGE_KEY, 'true');
        const { password: _, ...userWithoutPassword } = user;
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userWithoutPassword));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  static async signUp(
    email: string,
    password: string,
    name: string,
    businesses: Business[]
  ): Promise<boolean> {
    try {
      const users = this.getStoredUsers();
      
      // Check if email already exists
      if (users.some(u => u.email === email)) {
        return false; // Email already registered
      }

      // Create new user
      const newUser = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        email,
        password, // In production, this should be hashed
        name,
        createdAt: new Date(),
        businesses
      };

      users.push(newUser);
      localStorage.setItem('car_mileage_users', JSON.stringify(users));

      // Also save businesses immediately
      businesses.forEach(business => {
        StorageService.saveBusiness(business);
      });

      // Auto-login after signup
      localStorage.setItem(AUTH_STORAGE_KEY, 'true');
      const { password: _, ...userWithoutPassword } = newUser;
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userWithoutPassword));

      return true;
    } catch (error) {
      console.error('Sign up error:', error);
      return false;
    }
  }

  static logout(): void {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  }

  private static getStoredUsers(): any[] {
    try {
      const stored = localStorage.getItem('car_mileage_users');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  static isFirstLaunch(): boolean {
    // Check if user has ever logged in or signed up
    return !this.isAuthenticated() && this.getStoredUsers().length === 0;
  }
}

