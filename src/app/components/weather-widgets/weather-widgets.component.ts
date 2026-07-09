import { Component, Input, AfterViewInit, ElementRef, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import gsap from 'gsap';
import { CurrentWeather } from '../../core/models/weather.model';
import { SvgIconComponent } from '../../shared/components/svg-icon/svg-icon.component';

@Component({
  selector: 'app-weather-widgets',
  standalone: true,
  imports: [CommonModule, SvgIconComponent],
  templateUrl: './weather-widgets.component.html',
  styleUrls: ['./weather-widgets.component.scss']
})
export class WeatherWidgetsComponent implements AfterViewInit, OnChanges {
  @Input() weather: CurrentWeather | null = null;
  @Input() isCelsius = true;

  readonly Math = Math;

  constructor(private el: ElementRef) {}

  ngAfterViewInit(): void {
    this.animateWidgets();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['weather'] && this.weather) {
      setTimeout(() => this.animateWidgets(), 50);
    }
  }

  private animateWidgets(): void {
    const cards = this.el.nativeElement.querySelectorAll('.widget-card');
    if (cards.length > 0) {
      gsap.fromTo(cards, 
        { opacity: 0, scale: 0.95, y: 15 },
        { opacity: 1, scale: 1, y: 0, duration: 0.6, stagger: 0.04, ease: 'power2.out' }
      );
    }
  }

  // --- Helper calculations for Premium Widget Subtexts ---
  getUvStatus(uv: number): string {
    if (uv <= 2) return 'Low Risk';
    if (uv <= 5) return 'Moderate Risk';
    if (uv <= 7) return 'High Risk';
    if (uv <= 10) return 'Very High Risk';
    return 'Extreme Risk';
  }

  getUvComment(uv: number): string {
    if (uv <= 2) return 'No protection required.';
    if (uv <= 5) return 'Sunscreen is recommended.';
    if (uv <= 7) return 'Seek shade during midday.';
    if (uv <= 10) return 'Limit exposure between 10am-4pm.';
    return 'Avoid outdoors if possible.';
  }

  getAqiStatus(index: number): string {
    switch (index) {
      case 1: return 'Good';
      case 2: return 'Moderate';
      case 3: return 'Unhealthy (Sensitives)';
      case 4: return 'Unhealthy';
      case 5: return 'Very Unhealthy';
      case 6: return 'Hazardous';
      default: return 'Moderate';
    }
  }

  getAqiClass(index: number): string {
    switch (index) {
      case 1: return 'aqi-good';
      case 2: return 'aqi-mod';
      case 3: return 'aqi-sens';
      case 4: return 'aqi-unhealthy';
      default: return 'aqi-hazard';
    }
  }

  getWindRotation(dir: string): number {
    if (!dir) return 0;
    const directions: { [key: string]: number } = {
      'N': 0, 'NNE': 22.5, 'NE': 45, 'ENE': 67.5,
      'E': 90, 'ESE': 112.5, 'SE': 135, 'SSE': 157.5,
      'S': 180, 'SSW': 202.5, 'SW': 225, 'WSW': 247.5,
      'W': 270, 'WNW': 292.5, 'NW': 315, 'NNW': 337.5
    };
    const cleanDir = dir.toUpperCase().trim();
    return directions[cleanDir] !== undefined ? directions[cleanDir] : 0;
  }

  getPressureComment(pressure: number): string {
    if (pressure > 1020) return 'High pressure. Stable weather.';
    if (pressure < 1009) return 'Low pressure. Stormy weather.';
    return 'Normal pressure conditions.';
  }

  getVisibilityComment(vis: number): string {
    if (vis >= 10) return 'Perfect clear view.';
    if (vis >= 5) return 'Moderate visibility.';
    if (vis >= 2) return 'Hazy conditions.';
    return 'Dense fog. Travel caution.';
  }

  getHumidityComment(humidity: number): string {
    if (humidity > 70) return 'Sticky, moisture-heavy air.';
    if (humidity < 35) return 'Dry air. Drink water.';
    return 'Comfortable humidity level.';
  }

  getDewPointComment(dp: number): string {
    if (dp > 20) return 'Feels muggy and uncomfortable.';
    if (dp < 10) return 'Feels dry and crisp.';
    return 'Feels normal and comfortable.';
  }

  getMoonPhaseIcon(phase: string): string {
    // Return standard representation
    const lower = phase.toLowerCase();
    if (lower.includes('new')) return 'New Moon';
    if (lower.includes('full')) return 'Full Moon';
    if (lower.includes('crescent')) return 'Crescent Moon';
    if (lower.includes('gibbous')) return 'Gibbous Moon';
    return 'Quarter Moon';
  }
}
