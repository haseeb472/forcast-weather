import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { ThemeService } from '../../core/services/theme.service';
import { GeolocationService } from '../../core/services/geolocation.service';
import { WeatherService } from '../../core/services/weather.service';
import { SvgIconComponent } from '../../shared/components/svg-icon/svg-icon.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, SvgIconComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Input() currentCity = '';
  @Input() isFavorite = false;
  
  @Output() search = new EventEmitter<string>();
  @Output() toggleFavorite = new EventEmitter<string>();

  searchQuery = '';
  suggestions = signal<any[]>([]);
  showSuggestions = signal(false);
  
  // Clock state
  currentTime = signal('');
  currentDate = signal('');

  private searchSubject = new Subject<string>();
  private subscriptions = new Subscription();
  private clockInterval: any;

  constructor(
    public themeService: ThemeService,
    private geolocationService: GeolocationService,
    private weatherService: WeatherService
  ) {}

  ngOnInit(): void {
    // Live Digital Clock
    this.updateClock();
    this.clockInterval = setInterval(() => this.updateClock(), 1000);

    // Debounced Search Suggestions
    this.subscriptions.add(
      this.searchSubject.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(query => this.weatherService.getSuggestions(query))
      ).subscribe({
        next: (data) => {
          this.suggestions.set(data);
          this.showSuggestions.set(data.length > 0);
        },
        error: () => this.suggestions.set([])
      })
    );

    // Close autocomplete on click outside
    document.addEventListener('click', this.handleDocumentClick);
  }

  ngOnDestroy(): void {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
    this.subscriptions.unsubscribe();
    document.removeEventListener('click', this.handleDocumentClick);
  }

  updateClock(): void {
    const now = new Date();
    
    // Time format: 17:05:42
    this.currentTime.set(now.toLocaleTimeString('en-US', { hour12: false }));
    
    // Date format: Tuesday, Jul 7, 2026
    this.currentDate.set(now.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }));
  }

  onInputChanged(value: string): void {
    if (value.trim().length >= 3) {
      this.searchSubject.next(value);
    } else {
      this.suggestions.set([]);
      this.showSuggestions.set(false);
    }
  }

  triggerSearch(): void {
    const query = this.searchQuery.trim();
    if (query) {
      this.search.emit(query);
      this.showSuggestions.set(false);
    }
  }

  selectSuggestion(item: any): void {
    const displayName = `${item.name}${item.region ? ', ' + item.region : ''}${item.country ? ', ' + item.country : ''}`;
    this.searchQuery = displayName;
    this.search.emit(`${item.lat},${item.lon}|${displayName}`);
    this.showSuggestions.set(false);
  }

  useGPS(): void {
    this.geolocationService.getCurrentLocation().subscribe({
      next: (coords) => {
        const query = `${coords.lat},${coords.lon}`;
        this.search.emit(query);
      },
      error: (err) => {
        alert(err || 'Failed to acquire Geolocation.');
      }
    });
  }

  toggleFav(): void {
    if (this.currentCity) {
      this.toggleFavorite.emit(this.currentCity);
    }
  }

  private handleDocumentClick = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;
    if (!target.closest('.search-box-wrapper')) {
      this.showSuggestions.set(false);
    }
  };
}
