import { Component, Input, OnChanges, SimpleChanges, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import gsap from 'gsap';
import { SvgIconComponent } from '../../shared/components/svg-icon/svg-icon.component';

@Component({
  selector: 'app-interactive-map',
  standalone: true,
  imports: [CommonModule, SvgIconComponent],
  templateUrl: './interactive-map.component.html',
  styleUrls: ['./interactive-map.component.scss']
})
export class InteractiveMapComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {
  @Input() latitude = 0;
  @Input() longitude = 0;
  @Input() cityName = '';
  @Input() tempC = 0;
  @Input() tempF = 32;
  @Input() isCelsius = true;
  @Input() conditionText = '';

  @ViewChild('mapElement', { static: true }) mapElementRef!: ElementRef<HTMLDivElement>;

  private map!: L.Map;
  private marker!: L.Marker;
  private isMapInitialized = false;

  constructor(private el: ElementRef) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initMap();
    this.animateMapEntrance();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.isMapInitialized) return;

    if (changes['latitude'] || changes['longitude']) {
      this.updateMapPosition();
    } else if (changes['cityName'] || changes['tempC'] || changes['tempF'] || changes['isCelsius'] || changes['conditionText']) {
      this.updatePopupContent();
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap(): void {
    const mapEl = this.mapElementRef.nativeElement;
    
    // Set up Leaflet Map
    this.map = L.map(mapEl, {
      center: [this.latitude, this.longitude],
      zoom: 11,
      zoomControl: false // Disable default zoom to add customized zoom controls later if needed or keep top-right
    });

    // Add Zoom Control at a different position
    L.control.zoom({ position: 'topright' }).addTo(this.map);

    // Dark-themed tiles from CartoDB or standard OpenStreetMap
    // CartoDB Dark Matter fits the dark theme beautifully! CartoDB Positron for light theme.
    // We can change the tile URL based on theme dynamically, or use a neutral premium tile.
    // Let's use OpenStreetMap standard or a premium CartoDB tile:
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const tileUrl = isDark 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' 
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
      
    L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19
    }).addTo(this.map);

    // Create a beautiful custom pulsing marker
    const customIcon = L.divIcon({
      className: 'custom-map-marker-container',
      html: `
        <div class="map-pulse-marker">
          <div class="pulse-ring"></div>
          <div class="pulse-dot"></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    this.marker = L.marker([this.latitude, this.longitude], { icon: customIcon }).addTo(this.map);
    this.updatePopupContent();

    this.isMapInitialized = true;
  }

  private updateMapPosition(): void {
    if (!this.map) return;
    
    // Fly to new coordinate coordinates smoothly
    this.map.flyTo([this.latitude, this.longitude], 11, {
      animate: true,
      duration: 1.5
    });

    this.marker.setLatLng([this.latitude, this.longitude]);
    
    // Slight delay to allow flyTo to complete before opening popup
    setTimeout(() => {
      this.updatePopupContent();
    }, 1500);
  }

  private updatePopupContent(): void {
    if (!this.marker) return;

    const popupHtml = `
      <div class="map-popup-card">
        <h4 style="font-family: var(--font-title); font-size: 14px; font-weight: 700; margin-bottom: 2px;">${this.cityName}</h4>
        <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 500;">
          <span style="font-family: var(--font-title); font-weight: 700; font-size: 15px; color: var(--accent);">${this.isCelsius ? this.tempC : this.tempF}°</span>
          <span style="color: var(--text-secondary);">${this.conditionText}</span>
        </div>
      </div>
    `;

    this.marker.bindPopup(popupHtml, {
      closeButton: false,
      offset: [0, -5]
    }).openPopup();
  }

  private animateMapEntrance(): void {
    const container = this.el.nativeElement.querySelector('.map-container-wrapper');
    if (container) {
      gsap.fromTo(container,
        { opacity: 0, scale: 0.96, y: 15 },
        { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: 'power3.out' }
      );
    }
  }
}
