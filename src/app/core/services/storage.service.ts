import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly THEME_KEY = 'weather_dashboard_theme';
  private readonly FAVORITES_KEY = 'weather_dashboard_favorites';
  private readonly HISTORY_KEY = 'weather_dashboard_history';
  private readonly WEATHER_CACHE_KEY = 'weather_dashboard_cache';

  // --- Theme ---
  getTheme(): 'dark' | 'light' {
    const theme = localStorage.getItem(this.THEME_KEY);
    return theme === 'light' ? 'light' : 'dark'; // default to dark
  }

  setTheme(theme: 'dark' | 'light'): void {
    localStorage.setItem(this.THEME_KEY, theme);
  }

  // --- Favorites ---
  getFavorites(): string[] {
    const favs = localStorage.getItem(this.FAVORITES_KEY);
    return favs ? JSON.parse(favs) : [];
  }

  addFavorite(city: string): void {
    const favs = this.getFavorites();
    const cleanCity = city.trim();
    if (!favs.some(f => f.toLowerCase() === cleanCity.toLowerCase())) {
      favs.push(cleanCity);
      localStorage.setItem(this.FAVORITES_KEY, JSON.stringify(favs));
    }
  }

  removeFavorite(city: string): void {
    let favs = this.getFavorites();
    favs = favs.filter(f => f.toLowerCase() !== city.trim().toLowerCase());
    localStorage.setItem(this.FAVORITES_KEY, JSON.stringify(favs));
  }

  isFavorite(city: string): boolean {
    const favs = this.getFavorites();
    return favs.some(f => f.toLowerCase() === city.trim().toLowerCase());
  }

  // --- Search History ---
  getHistory(): string[] {
    const history = localStorage.getItem(this.HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  }

  addHistory(city: string): void {
    let history = this.getHistory();
    const cleanCity = city.trim();
    
    // Remove if already exists (to move it to top)
    history = history.filter(h => h.toLowerCase() !== cleanCity.toLowerCase());
    
    // Add to beginning of history
    history.unshift(cleanCity);
    
    // Limit to 10 items
    if (history.length > 10) {
      history = history.slice(0, 10);
    }
    
    localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
  }

  removeHistoryItem(city: string): void {
    let history = this.getHistory();
    history = history.filter(h => h.toLowerCase() !== city.trim().toLowerCase());
    localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
  }

  clearHistory(): void {
    localStorage.removeItem(this.HISTORY_KEY);
  }

  // --- Weather Offline Cache ---
  getWeatherCache(city: string): any | null {
    const cacheStr = localStorage.getItem(`${this.WEATHER_CACHE_KEY}_${city.toLowerCase()}`);
    if (!cacheStr) return null;
    try {
      const cache = JSON.parse(cacheStr);
      // Let's cache it for 30 minutes. If older, return null.
      const now = new Date().getTime();
      if (now - cache.timestamp > 30 * 60 * 1000) {
        this.clearWeatherCache(city);
        return null;
      }
      return cache.data;
    } catch {
      return null;
    }
  }

  setWeatherCache(city: string, data: any): void {
    const cacheObj = {
      timestamp: new Date().getTime(),
      data: data
    };
    localStorage.setItem(`${this.WEATHER_CACHE_KEY}_${city.toLowerCase()}`, JSON.stringify(cacheObj));
  }

  clearWeatherCache(city: string): void {
    localStorage.removeItem(`${this.WEATHER_CACHE_KEY}_${city.toLowerCase()}`);
  }
}
