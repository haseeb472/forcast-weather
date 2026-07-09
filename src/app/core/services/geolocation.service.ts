import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {
  
  getCurrentLocation(): Observable<{ lat: number; lon: number }> {
    return new Observable<{ lat: number; lon: number }>((observer) => {
      if (!navigator.geolocation) {
        observer.error('Geolocation is not supported by your browser.');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          observer.next({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
          observer.complete();
        },
        (error) => {
          let errorMessage = 'Failed to retrieve location.';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'GPS access was denied. Please enable location permissions.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'The request to get location timed out.';
              break;
          }
          observer.error(errorMessage);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    });
  }
}
