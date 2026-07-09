import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import gsap from 'gsap';
import { CurrentWeather, WeatherLocation } from '../../core/models/weather.model';
import { SvgIconComponent } from '../../shared/components/svg-icon/svg-icon.component';

@Component({
  selector: 'app-current-weather-card',
  standalone: true,
  imports: [CommonModule, SvgIconComponent],
  templateUrl: './current-weather-card.component.html',
  styleUrls: ['./current-weather-card.component.scss']
})
export class CurrentWeatherCardComponent implements OnChanges {
  @Input() weather: CurrentWeather | null = null;
  @Input() location: WeatherLocation | null = null;
  @Input() todayMaxC = 0;
  @Input() todayMinC = 0;
  @Input() todayMaxF = 32;
  @Input() todayMinF = 32;
  @Input() isCelsius = true;

  @Output() toggleUnits = new EventEmitter<void>();

  // Signal for counting temperature animation
  animatedTemp = signal(0);
  animatedFeelsLike = signal(0);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['weather'] && this.weather) {
      const prevWeather = changes['weather'].previousValue as CurrentWeather | null;
      
      const targetTemp = this.isCelsius ? this.weather.tempC : this.weather.tempF;
      const prevTemp = prevWeather ? (this.isCelsius ? prevWeather.tempC : prevWeather.tempF) : 0;
      
      const targetFeels = this.isCelsius ? this.weather.feelsLikeC : this.weather.feelsLikeF;
      const prevFeels = prevWeather ? (this.isCelsius ? prevWeather.feelsLikeC : prevWeather.feelsLikeF) : 0;

      this.animateMetric('temp', prevTemp, targetTemp);
      this.animateMetric('feels', prevFeels, targetFeels);
    }
    
    // Also re-animate if temperature unit changes
    if (changes['isCelsius'] && this.weather) {
      const targetTemp = this.isCelsius ? this.weather.tempC : this.weather.tempF;
      const prevTemp = this.animatedTemp();
      
      const targetFeels = this.isCelsius ? this.weather.feelsLikeC : this.weather.feelsLikeF;
      const prevFeels = this.animatedFeelsLike();

      this.animateMetric('temp', prevTemp, targetTemp);
      this.animateMetric('feels', prevFeels, targetFeels);
    }
  }

  private animateMetric(type: 'temp' | 'feels', startVal: number, endVal: number): void {
    const obj = { val: startVal };
    gsap.to(obj, {
      val: endVal,
      duration: 1.2,
      ease: 'power3.out',
      onUpdate: () => {
        if (type === 'temp') {
          this.animatedTemp.set(Math.round(obj.val));
        } else {
          this.animatedFeelsLike.set(Math.round(obj.val));
        }
      }
    });
  }

  getWeatherClass(code: number | undefined): string {
    if (!code) return 'clear';
    // Map condition code to a keyword for styling if needed
    if ([1183, 1186, 1189, 1192, 1195, 1240, 1243].includes(code)) return 'rain';
    if ([1213, 1219, 1225, 1258].includes(code)) return 'snow';
    if ([1087, 1273, 1276].includes(code)) return 'storm';
    if ([1030, 1135].includes(code)) return 'mist';
    if (code !== 1000) return 'cloudy';
    return 'clear';
  }

  onUnitToggle(): void {
    this.toggleUnits.emit();
  }
}
