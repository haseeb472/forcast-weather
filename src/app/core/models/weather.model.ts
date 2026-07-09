export interface WeatherLocation {
  name: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
  tzId: string;
  localtime: string;
}

export interface AirQuality {
  co: number;
  no2: number;
  o3: number;
  so2: number;
  pm2_5: number;
  pm10: number;
  usEpaIndex: number; // 1-6 standard
}

export interface CurrentWeather {
  tempC: number;
  tempF: number;
  feelsLikeC: number;
  feelsLikeF: number;
  conditionText: string;
  conditionCode: number;
  conditionIcon: string;
  humidity: number;
  windKph: number;
  windDir: string;
  pressureMb: number;
  visibilityKm: number;
  uv: number;
  cloud: number;
  dewPointC: number;
  dewPointF: number;
  rainProbability: number;
  sunrise: string;
  sunset: string;
  moonPhase: string;
  airQuality?: AirQuality;
}

export interface HourlyForecast {
  time: string; // e.g. "09:00"
  tempC: number;
  tempF: number;
  conditionText: string;
  conditionCode: number;
  conditionIcon: string;
  windKph: number;
  rainProbability: number;
  isNight: boolean;
}

export interface DailyForecast {
  date: string; // e.g. "2026-07-07"
  dayName: string; // e.g. "Tuesday"
  maxTempC: number;
  maxTempF: number;
  minTempC: number;
  minTempF: number;
  conditionText: string;
  conditionCode: number;
  conditionIcon: string;
  avgHumidity: number;
  maxWindKph: number;
  rainProbability: number;
}

export interface WeatherAlert {
  event: string;
  headline: string;
  severity: string;
  description: string;
  instruction: string;
  effective: string;
  expires: string;
}

export interface WeatherData {
  location: WeatherLocation;
  current: CurrentWeather;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  alerts: WeatherAlert[];
}
