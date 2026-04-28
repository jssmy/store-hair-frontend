import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

@Injectable({ providedIn: 'root' })
export class StorageService {

  private isNative = Capacitor.isNativePlatform();

  async set(key: string, value: any): Promise<void> {
    const data = JSON.stringify(value);

    if (this.isNative) {
      await Preferences.set({ key, value: data });
    } else {
      localStorage.setItem(key, data);
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    if (this.isNative) {
      const { value } = await Preferences.get({ key });
      return value ? JSON.parse(value) : null;
    } else {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    }
  }

  async remove(key: string): Promise<void> {
    if (this.isNative) {
      await Preferences.remove({ key });
    } else {
      localStorage.removeItem(key);
    }
  }

  async clear(): Promise<void> {
    if (this.isNative) {
      await Preferences.clear();
    } else {
      localStorage.clear();
    }
  }
}
