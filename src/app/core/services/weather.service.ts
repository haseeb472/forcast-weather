import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError, forkJoin } from 'rxjs';
import { map, switchMap, tap, catchError } from 'rxjs/operators';
import { WeatherData, WeatherLocation, CurrentWeather, HourlyForecast, DailyForecast, AirQuality } from '../models/weather.model';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  constructor(
    private http: HttpClient,
    private storageService: StorageService
  ) {}

  /**
   * Main method to fetch complete weather details from Open-Meteo keyless APIs
   * @param query City name or "lat,lon" coordinates
   */
  getWeather(query: string): Observable<WeatherData> {
    const parts = query.split('|');
    const trimmedQuery = parts[0].trim();
    const displayName = parts[1] ? parts[1].trim() : undefined;

    if (!trimmedQuery) {
      return throwError(() => new Error('Query cannot be empty'));
    }

    // Check if query is in lat,lon coordinate format
    const coordMatch = trimmedQuery.match(/^([+-]?\d+\.?\d*)\s*,\s*([+-]?\d+\.?\d*)$/);
    
    let geocodingObs: Observable<WeatherLocation>;

    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lon = parseFloat(coordMatch[2]);
      
      const name = displayName ? displayName.split(',')[0].trim() : `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
      const region = displayName ? displayName.split(',').slice(1).join(', ').trim() : 'GPS Coordinates';

      geocodingObs = of({
        name,
        region,
        country: '',
        lat,
        lon,
        tzId: 'UTC', // will be overwritten by forecast timezone response
        localtime: ''
      });
    } else {
      // Real-time Geocoding lookup
      const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmedQuery)}&count=1&language=en&format=json`;
      geocodingObs = this.http.get<any>(geocodingUrl).pipe(
        switchMap(res => {
          if (!res.results || res.results.length === 0) {
            return throwError(() => new Error(`City "${trimmedQuery}" not found. Please verify the spelling.`));
          }
          const r = res.results[0];
          return of({
            name: r.name,
            region: r.admin1 || '',
            country: r.country || '',
            lat: r.latitude,
            lon: r.longitude,
            tzId: r.timezone || 'UTC',
            localtime: ''
          });
        })
      );
    }

    return geocodingObs.pipe(
      switchMap(loc => {
        // Query Forecast & Air Quality in parallel
        const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,visibility&hourly=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation_probability,is_day,dew_point_2m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max,wind_speed_10m_max&timezone=auto`;
        const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${loc.lat}&longitude=${loc.lon}&current=european_aqi,pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone`;

        return forkJoin({
          forecast: this.http.get<any>(forecastUrl),
          aq: this.http.get<any>(aqUrl).pipe(catchError(() => of(null)))
        }).pipe(
          map(({ forecast, aq }) => this.mapOpenMeteoResponse(loc, forecast, aq))
        );
      }),
      tap(mappedData => {
        // Update history and cache list
        this.storageService.setWeatherCache(mappedData.location.name, mappedData);
        this.storageService.addHistory(mappedData.location.name);
      }),
      catchError(err => {
        // Fallback to offline local storage cache if available
        const cached = this.storageService.getWeatherCache(trimmedQuery);
        if (cached) {
          return of(cached);
        }
        return throwError(() => new Error(err.message || 'Failed to retrieve weather data from Open-Meteo.'));
      })
    );
  }

  /**
   * Autocomplete Geocoding Suggestions
   */
  getSuggestions(query: string): Observable<any[]> {
    const trimmed = query.trim();
    if (trimmed.length < 3) return of([]);

    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=5&language=en&format=json`;
    return this.http.get<any>(url).pipe(
      map(res => {
        if (!res.results) return [];
        return res.results.map((item: any) => ({
          name: item.name,
          region: item.admin1 || '',
          country: item.country || '',
          lat: item.latitude,
          lon: item.longitude
        }));
      }),
      catchError(() => of([]))
    );
  }

  /**
   * Adapts WMO API structures onto our dashboard's schema models
   */
  private mapOpenMeteoResponse(loc: WeatherLocation, forecast: any, aq: any): WeatherData {
    const currentLocalTime = new Date();
    
    // Update local timezone from response
    const updatedLocation: WeatherLocation = {
      ...loc,
      tzId: forecast.timezone,
      // Create local ISO string
      localtime: currentLocalTime.toISOString().replace('T', ' ').substring(0, 16)
    };

    // Calculate current hour index based on forecast timezone response time
    const nowHourStr = currentLocalTime.toISOString().substring(0, 13) + ':00'; // e.g. "2026-07-09T07:00"
    let currentHourIndex = forecast.hourly.time.findIndex((t: string) => t.startsWith(nowHourStr.substring(0, 13)));
    if (currentHourIndex < 0) currentHourIndex = 0;

    // Format Air Quality PM metrics
    let airQuality: AirQuality | undefined;
    if (aq && aq.current) {
      airQuality = {
        co: aq.current.carbon_monoxide || 0,
        no2: aq.current.nitrogen_dioxide || 0,
        o3: aq.current.ozone || 0,
        so2: aq.current.sulphur_dioxide || 0,
        pm2_5: aq.current.pm2_5 || 0,
        pm10: aq.current.pm10 || 0,
        usEpaIndex: aq.current.european_aqi || 1
      };
    }

    const currentWmo = forecast.current.weather_code;
    const isNight = forecast.current.is_day === 0;

    // Current Weather Mapping
    const current: CurrentWeather = {
      tempC: Math.round(forecast.current.temperature_2m),
      tempF: Math.round(forecast.current.temperature_2m * 9/5 + 32),
      feelsLikeC: Math.round(forecast.current.apparent_temperature),
      feelsLikeF: Math.round(forecast.current.apparent_temperature * 9/5 + 32),
      conditionText: this.getWmoText(currentWmo),
      conditionCode: this.getWmoWeatherApiCode(currentWmo),
      conditionIcon: this.getWmoIcon(currentWmo, isNight),
      humidity: forecast.current.relative_humidity_2m,
      windKph: Math.round(forecast.current.wind_speed_10m),
      windDir: this.getWindDirectionText(forecast.current.wind_direction_10m),
      pressureMb: Math.round(forecast.current.pressure_msl),
      visibilityKm: Math.round(forecast.current.visibility / 1000), // convert meters to km
      uv: Math.round(forecast.daily.uv_index_max[0] || 0),
      cloud: forecast.current.cloud_cover,
      dewPointC: Math.round(forecast.hourly.dew_point_2m[currentHourIndex] || 0),
      dewPointF: Math.round((forecast.hourly.dew_point_2m[currentHourIndex] || 0) * 9/5 + 32),
      rainProbability: forecast.hourly.precipitation_probability[currentHourIndex] || 0,
      sunrise: this.formatTimeString(forecast.daily.sunrise[0]),
      sunset: this.formatTimeString(forecast.daily.sunset[0]),
      moonPhase: this.calculateMoonPhase(new Date()),
      airQuality
    };

    // 24 Hourly Items Mapping
    const hourly: HourlyForecast[] = [];
    for (let i = 0; i < 24; i++) {
      const idx = currentHourIndex + i;
      if (idx >= forecast.hourly.time.length) break;

      const hourlyTime = new Date(forecast.hourly.time[idx]);
      const timeStr = hourlyTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      const hWmo = forecast.hourly.weather_code[idx];
      const hIsNight = forecast.hourly.is_day[idx] === 0;

      hourly.push({
        time: timeStr,
        tempC: Math.round(forecast.hourly.temperature_2m[idx]),
        tempF: Math.round(forecast.hourly.temperature_2m[idx] * 9/5 + 32),
        conditionText: this.getWmoText(hWmo),
        conditionCode: this.getWmoWeatherApiCode(hWmo),
        conditionIcon: this.getWmoIcon(hWmo, hIsNight),
        windKph: Math.round(forecast.hourly.wind_speed_10m[idx]),
        rainProbability: forecast.hourly.precipitation_probability[idx] || 0,
        isNight: hIsNight
      });
    }

    // 7 Days Items Mapping
    const daily: DailyForecast[] = [];
    for (let i = 0; i < 7; i++) {
      if (i >= forecast.daily.time.length) break;

      const dateObj = new Date(forecast.daily.time[i] + 'T00:00:00');
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
      const dWmo = forecast.daily.weather_code[i];

      // Estimate relative humidity by averaging the day's 24 hours
      const dayHourlyHumidities = forecast.hourly.relative_humidity_2m.slice(i * 24, (i + 1) * 24);
      const avgHumidity = dayHourlyHumidities.length > 0 
        ? Math.round(dayHourlyHumidities.reduce((a: number, b: number) => a + b, 0) / dayHourlyHumidities.length) 
        : 65;

      daily.push({
        date: forecast.daily.time[i],
        dayName,
        maxTempC: Math.round(forecast.daily.temperature_2m_max[i]),
        maxTempF: Math.round(forecast.daily.temperature_2m_max[i] * 9/5 + 32),
        minTempC: Math.round(forecast.daily.temperature_2m_min[i]),
        minTempF: Math.round(forecast.daily.temperature_2m_min[i] * 9/5 + 32),
        conditionText: this.getWmoText(dWmo),
        conditionCode: this.getWmoWeatherApiCode(dWmo),
        conditionIcon: this.getWmoIcon(dWmo, false),
        avgHumidity,
        maxWindKph: Math.round(forecast.daily.wind_speed_10m_max[i] || 0),
        rainProbability: forecast.daily.precipitation_probability_max[i] || 0
      });
    }

    return {
      location: updatedLocation,
      current,
      hourly,
      daily,
      alerts: [] // Open-Meteo doesn't bundle global weather alerts in the base free layer
    };
  }

  // --- WMO Weather Code Mappings ---

  private getWmoText(code: number): string {
    switch (code) {
      case 0: return 'Clear Sky';
      case 1: return 'Mainly Clear';
      case 2: return 'Partly Cloudy';
      case 3: return 'Overcast';
      case 45: case 48: return 'Fog';
      case 51: case 53: case 55: return 'Drizzle';
      case 56: case 57: return 'Freezing Drizzle';
      case 61: case 63: return 'Moderate Rain';
      case 65: return 'Heavy Rain';
      case 66: case 67: return 'Freezing Rain';
      case 71: case 73: case 75: return 'Snow';
      case 77: return 'Snow Grains';
      case 80: case 81: case 82: return 'Rain Showers';
      case 85: case 86: return 'Snow Showers';
      case 95: case 96: case 99: return 'Thunderstorm';
      default: return 'Clear Sky';
    }
  }

  private getWmoWeatherApiCode(code: number): number {
    switch (code) {
      case 0: return 1000;
      case 1: case 2: return 1003;
      case 3: return 1006;
      case 45: case 48: return 1135;
      case 51: case 53: case 55: return 1153;
      case 56: case 57: return 1201;
      case 61: case 63: return 1189;
      case 65: return 1195;
      case 66: case 67: return 1201;
      case 71: case 73: case 75: return 1213;
      case 77: return 1213;
      case 80: case 81: case 82: return 1240;
      case 85: case 86: return 1255;
      case 95: case 96: case 99: return 1276;
      default: return 1000;
    }
  }

  private getWmoIcon(code: number, isNight: boolean): string {
    const dir = isNight ? 'night' : 'day';
    let codeIndex = 113;
    switch (code) {
      case 0: codeIndex = 113; break;
      case 1: case 2: codeIndex = 116; break;
      case 3: codeIndex = 119; break;
      case 45: case 48: codeIndex = 248; break;
      case 51: case 53: case 55: codeIndex = 266; break;
      case 61: case 63: codeIndex = 296; break;
      case 65: codeIndex = 302; break;
      case 71: case 73: case 75: codeIndex = 326; break;
      case 95: case 96: case 99: codeIndex = 389; break;
      default: codeIndex = 113;
    }
    return `https://cdn.weatherapi.com/weather/128x128/${dir}/${codeIndex}.png`;
  }

  // --- Clock & Astronomical Helper Methods ---

  private formatTimeString(isoStr: string): string {
    if (!isoStr) return '06:00 AM';
    const parts = isoStr.split('T');
    if (parts.length < 2) return '06:00 AM';
    const timeParts = parts[1].split(':');
    const hour = parseInt(timeParts[0]);
    const minute = timeParts[1];
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minute} ${ampm}`;
  }

  private getWindDirectionText(deg: number): string {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(((deg % 360) / 22.5)) % 16;
    return directions[index];
  }

  private calculateMoonPhase(date: Date): string {
    const cycle = 29.530588853;
    const baseDate = new Date(1970, 0, 7); // Known new moon base date
    const diff = date.getTime() - baseDate.getTime();
    const days = diff / (1000 * 60 * 60 * 24);
    const phaseValue = (days % cycle) / cycle;

    if (phaseValue < 0.03 || phaseValue > 0.97) return 'New Moon';
    if (phaseValue < 0.22) return 'Waxing Crescent';
    if (phaseValue < 0.28) return 'First Quarter';
    if (phaseValue < 0.47) return 'Waxing Gibbous';
    if (phaseValue < 0.53) return 'Full Moon';
    if (phaseValue < 0.72) return 'Waning Gibbous';
    if (phaseValue < 0.78) return 'Last Quarter';
    return 'Waning Crescent';
  }
}
