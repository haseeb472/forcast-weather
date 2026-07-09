import { Component, OnInit, OnDestroy, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, interval } from 'rxjs';
import gsap from 'gsap';

import { WeatherService } from '../../core/services/weather.service';
import { GeolocationService } from '../../core/services/geolocation.service';
import { StorageService } from '../../core/services/storage.service';
import { WeatherData } from '../../core/models/weather.model';

// Component imports
import { HeaderComponent } from '../../components/header/header.component';
import { DynamicBackgroundComponent } from '../../components/dynamic-background/dynamic-background.component';
import { CurrentWeatherCardComponent } from '../../components/current-weather-card/current-weather-card.component';
import { HourlyForecastComponent } from '../../components/hourly-forecast/hourly-forecast.component';
import { DailyForecastComponent } from '../../components/daily-forecast/daily-forecast.component';
import { WeatherWidgetsComponent } from '../../components/weather-widgets/weather-widgets.component';
import { WeatherChartsComponent } from '../../components/weather-charts/weather-charts.component';
import { InteractiveMapComponent } from '../../components/interactive-map/interactive-map.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';
import { ErrorCardComponent } from '../../shared/components/error-card/error-card.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    DynamicBackgroundComponent,
    CurrentWeatherCardComponent,
    HourlyForecastComponent,
    DailyForecastComponent,
    WeatherWidgetsComponent,
    WeatherChartsComponent,
    InteractiveMapComponent,
    SidebarComponent,
    SkeletonLoaderComponent,
    ErrorCardComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild('customCursor', { static: false }) cursorRef!: ElementRef<HTMLDivElement>;

  // Dashboard Signals
  weatherData = signal<WeatherData | null>(null);
  isLoading = signal(true);
  errorText = signal<string | null>(null);
  isCelsius = signal(true);
  
  // Storage caching signals
  favorites = signal<string[]>([]);
  history = signal<string[]>([]);

  // Computed checks
  currentCityName = computed(() => this.weatherData()?.location.name || '');
  isFavorited = computed(() => {
    const name = this.currentCityName();
    if (!name) return false;
    return this.favorites().some(f => f.toLowerCase() === name.toLowerCase());
  });

  private subscriptions = new Subscription();
  private refreshSubscription!: Subscription;

  constructor(
    private weatherService: WeatherService,
    private geolocationService: GeolocationService,
    private storageService: StorageService
  ) {}

  ngOnInit(): void {
    // Load local storage states
    this.refreshLocalLists();

    // Auto-detect Location or load fallback
    this.detectLocationAndLoad();

    // Auto-refresh every 10 minutes (10 * 60 * 1000 ms)
    this.refreshSubscription = interval(10 * 60 * 1000).subscribe(() => {
      const city = this.currentCityName();
      if (city) {
        this.fetchWeatherData(city, false); // silent refresh
      }
    });

    // Custom Cursor tracking (Desktop Only)
    if (window.innerWidth >= 1024) {
      document.addEventListener('mousemove', this.moveCursor);
      document.addEventListener('mouseover', this.handleHoverState);
    }

    // Keyboard shortcut listeners
    document.addEventListener('keydown', this.handleShortcuts);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
    document.removeEventListener('mousemove', this.moveCursor);
    document.removeEventListener('mouseover', this.handleHoverState);
    document.removeEventListener('keydown', this.handleShortcuts);
  }

  private refreshLocalLists(): void {
    this.favorites.set(this.storageService.getFavorites());
    this.history.set(this.storageService.getHistory());
  }

  detectLocationAndLoad(): void {
    this.isLoading.set(true);
    this.subscriptions.add(
      this.geolocationService.getCurrentLocation().subscribe({
        next: (coords) => {
          this.fetchWeatherData(`${coords.lat},${coords.lon}`);
        },
        error: (err) => {
          console.warn('GPS location denied or timed out:', err);
          // Fallback to recent history, or default city (New York)
          const recentHistory = this.history();
          if (recentHistory.length > 0) {
            this.fetchWeatherData(recentHistory[0]);
          } else {
            this.fetchWeatherData('New York');
          }
        }
      })
    );
  }

  fetchWeatherData(query: string, showLoader = true): void {
    if (showLoader) {
      this.isLoading.set(true);
    }
    this.errorText.set(null);

    this.weatherService.getWeather(query).subscribe({
      next: (data) => {
        this.weatherData.set(data);
        this.isLoading.set(false);
        this.refreshLocalLists();
        
        // Trigger a staggered entrance GSAP animation for dashboard blocks after rendering
        setTimeout(() => this.animateDashboardElements(), 50);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorText.set(err.message || 'Unable to retrieve forecast data.');
      }
    });
  }

  onFavoriteToggle(city: string): void {
    if (this.isFavorited()) {
      this.storageService.removeFavorite(city);
    } else {
      this.storageService.addFavorite(city);
    }
    this.refreshLocalLists();
  }

  onRemoveFavorite(city: string): void {
    this.storageService.removeFavorite(city);
    this.refreshLocalLists();
  }

  onRemoveHistoryItem(city: string): void {
    this.storageService.removeHistoryItem(city);
    this.refreshLocalLists();
  }

  onClearHistory(): void {
    this.storageService.clearHistory();
    this.refreshLocalLists();
  }

  onUnitToggle(): void {
    this.isCelsius.update(val => !val);
  }

  // --- GSAP Dashboard animations ---
  private animateDashboardElements(): void {
    // Staggered slide up and fade in for major grids
    const panels = document.querySelectorAll(
      '.layout-left > *, .layout-middle > *, .layout-right > *'
    );
    
    if (panels.length > 0) {
      gsap.fromTo(panels,
        { opacity: 0, y: 30, scale: 0.98 },
        { 
          opacity: 1, 
          y: 0, 
          scale: 1, 
          duration: 0.8, 
          stagger: 0.08, 
          ease: 'power3.out',
          clearProps: 'transform' // clean transform attributes after animation for CSS performance
        }
      );
    }
  }

  // --- Custom Cursor Trailing Logic ---
  private moveCursor = (e: MouseEvent): void => {
    if (this.cursorRef) {
      const cursor = this.cursorRef.nativeElement;
      gsap.to(cursor, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.1,
        ease: 'power2.out'
      });
    }
  };

  private handleHoverState = (e: MouseEvent): void => {
    if (this.cursorRef) {
      const target = e.target as HTMLElement;
      const isHoverable = target.closest('button, a, input, .list-item, .hourly-card, .tab-btn');
      
      const cursor = this.cursorRef.nativeElement;
      if (isHoverable) {
        cursor.classList.add('hovering');
      } else {
        cursor.classList.remove('hovering');
      }
    }
  };

  // --- Keyboard Shortcuts ---
  private handleShortcuts = (e: KeyboardEvent): void => {
    // Focus search input when pressing "/"
    if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
      e.preventDefault();
      const input = document.querySelector('.search-input') as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
    }

    // Toggle unit when pressing "U" (celsius/fahrenheit)
    if (e.key.toLowerCase() === 'u' && document.activeElement?.tagName !== 'INPUT') {
      this.onUnitToggle();
    }
  };
}
