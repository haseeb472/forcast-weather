import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-svg-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg 
      [attr.width]="size" 
      [attr.height]="size" 
      [attr.viewBox]="'0 0 24 24'" 
      fill="none" 
      [attr.stroke]="color" 
      stroke-width="2" 
      stroke-linecap="round" 
      stroke-linejoin="round"
      [class]="class"
      [ngStyle]="{'display': 'inline-block', 'vertical-align': 'middle'}"
    >
      <!-- Conditionally render SVG paths based on the icon name -->
      <ng-container [ngSwitch]="name">
        <!-- Search -->
        <g *ngSwitchCase="'search'">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </g>
        
        <!-- Map Pin / GPS -->
        <g *ngSwitchCase="'map-pin'">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </g>

        <!-- Sun / Clear -->
        <g *ngSwitchCase="'sun'">
          <circle cx="12" cy="12" r="4"></circle>
          <line x1="12" y1="2" x2="12" y2="4"></line>
          <line x1="12" y1="20" x2="12" y2="22"></line>
          <line x1="4.93" y1="4.93" x2="6.34" y2="6.34"></line>
          <line x1="17.66" y1="17.66" x2="19.07" y2="19.07"></line>
          <line x1="2" y1="12" x2="4" y2="12"></line>
          <line x1="20" y1="12" x2="22" y2="12"></line>
          <line x1="6.34" y1="17.66" x2="4.93" y2="19.07"></line>
          <line x1="19.07" y1="4.93" x2="17.66" y2="6.34"></line>
        </g>

        <!-- Moon / Night -->
        <g *ngSwitchCase="'moon'">
          <path d="M12 3a6.364 6.364 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
        </g>

        <!-- Cloud -->
        <g *ngSwitchCase="'cloud'">
          <path d="M17.5 19A4.5 4.5 0 0 0 22 14.5c0-2.76-2.52-4.5-5.5-4.5-.46 0-.9.05-1.33.15A6 6 0 0 0 4.5 12A5.5 5.5 0 0 0 10 17.5h7.5Z"></path>
        </g>

        <!-- Cloud Rain -->
        <g *ngSwitchCase="'cloud-rain'">
          <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
          <path d="M16 14v6"></path>
          <path d="M8 14v6"></path>
          <path d="M12 16v6"></path>
        </g>

        <!-- Cloud Drizzle -->
        <g *ngSwitchCase="'cloud-drizzle'">
          <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
          <path d="M8 19v1"></path>
          <path d="M12 21v1"></path>
          <path d="M16 19v1"></path>
        </g>

        <!-- Cloud Lightning / Thunder -->
        <g *ngSwitchCase="'cloud-lightning'">
          <path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 8.58"></path>
          <path d="M13 11l-4 6h6l-3 5"></path>
        </g>

        <!-- Cloud Snow -->
        <g *ngSwitchCase="'cloud-snow'">
          <path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 8.58"></path>
          <path d="M8 17h.01"></path>
          <path d="M8 21h.01"></path>
          <line x1="12" y1="17" x2="12" y2="17.01"></line>
          <line x1="12" y1="21" x2="12" y2="21.01"></line>
          <line x1="16" y1="17" x2="16" y2="17.01"></line>
          <line x1="16" y1="21" x2="16" y2="21.01"></line>
        </g>

        <!-- Wind -->
        <g *ngSwitchCase="'wind'">
          <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"></path>
        </g>

        <!-- Droplets / Humidity -->
        <g *ngSwitchCase="'droplets'">
          <path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 0 0 7 7z"></path>
        </g>

        <!-- Gauge / Pressure -->
        <g *ngSwitchCase="'gauge'">
          <path d="M4 15a8 8 0 1 1 16 0"></path>
          <line x1="12" y1="15" x2="15" y2="10"></line>
          <circle cx="12" cy="15" r="2"></circle>
        </g>

        <!-- Eye / Visibility -->
        <g *ngSwitchCase="'eye'">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </g>

        <!-- Thermometer / Temp -->
        <g *ngSwitchCase="'thermometer'">
          <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"></path>
        </g>

        <!-- Clock / Time -->
        <g *ngSwitchCase="'clock'">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </g>

        <!-- Calendar -->
        <g *ngSwitchCase="'calendar'">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </g>

        <!-- Sun Dim / UV Index -->
        <g *ngSwitchCase="'sun-dim'">
          <circle cx="12" cy="12" r="4"></circle>
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 6.34l-1.41 1.41"></path>
        </g>

        <!-- Activity / AQI -->
        <g *ngSwitchCase="'activity'">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </g>

        <!-- Trash / Delete -->
        <g *ngSwitchCase="'trash'">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </g>

        <!-- Star / Favorite -->
        <g *ngSwitchCase="'star'">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </g>

        <!-- Compass / Wind Dir -->
        <g *ngSwitchCase="'compass'">
          <circle cx="12" cy="12" r="10"></circle>
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
        </g>

        <!-- Sunrise -->
        <g *ngSwitchCase="'sunrise'">
          <path d="M18 22H6M12 18V2m0 0l-4 4m4-4l4 4M20.24 12.24l-1.41-1.41M5.17 10.83l-1.41 1.41M12 22a8 8 0 0 0 8-8H4a8 8 0 0 0 8 8z"></path>
        </g>

        <!-- Sunset -->
        <g *ngSwitchCase="'sunset'">
          <path d="M18 22H6M12 2v16m0 0l-4-4m4 4l4-4M20.24 12.24l-1.41-1.41M5.17 10.83l-1.41 1.41M12 18a8 8 0 0 0 8-8H4a8 8 0 0 0 8 8z"></path>
        </g>

        <!-- Alerts -->
        <g *ngSwitchCase="'alert-triangle'">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </g>

        <!-- Lightbulb (Default fallback) -->
        <g *ngSwitchDefault>
          <circle cx="12" cy="12" r="10"></circle>
        </g>
      </ng-container>
    </svg>
  `
})
export class SvgIconComponent {
  @Input() name = '';
  @Input() size = 20;
  @Input() color = 'currentColor';
  @Input() class = '';
}
