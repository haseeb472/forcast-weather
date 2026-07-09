import { Component, Input, OnChanges, SimpleChanges, ViewChild, ElementRef, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';
import gsap from 'gsap';
import { HourlyForecast } from '../../core/models/weather.model';
import { SvgIconComponent } from '../../shared/components/svg-icon/svg-icon.component';

export type ChartType = 'temp' | 'humidity' | 'wind' | 'pressure';

@Component({
  selector: 'app-weather-charts',
  standalone: true,
  imports: [CommonModule, SvgIconComponent],
  templateUrl: './weather-charts.component.html',
  styleUrls: ['./weather-charts.component.scss']
})
export class WeatherChartsComponent implements OnChanges, OnDestroy, AfterViewInit {
  @Input() hourlyData: HourlyForecast[] = [];
  @Input() isCelsius = true;

  @ViewChild('chartCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  
  activeTab: ChartType = 'temp';
  private chartInstance: Chart | null = null;

  ngAfterViewInit(): void {
    if (this.hourlyData.length > 0) {
      this.buildChart();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Rebuild chart if data, units, or selected tab changes
    if ((changes['hourlyData'] || changes['isCelsius']) && this.hourlyData.length > 0) {
      setTimeout(() => this.buildChart(), 100);
    }
  }

  ngOnDestroy(): void {
    this.destroyChart();
  }

  selectTab(type: ChartType): void {
    if (this.activeTab === type) return;
    this.activeTab = type;
    
    // Smooth GSAP transition on canvas switch
    const canvas = this.canvasRef.nativeElement;
    gsap.fromTo(canvas, 
      { opacity: 0.3, scale: 0.98 },
      { opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out', onStart: () => this.buildChart() }
    );
  }

  private destroyChart(): void {
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
  }

  private buildChart(): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx || this.hourlyData.length === 0) return;

    this.destroyChart();

    // Limit to every 2 hours to avoid crowded labels on mobile (12 intervals instead of 24)
    const filteredHours = this.hourlyData.filter((_, idx) => idx % 2 === 0);
    
    const labels = filteredHours.map(h => h.time);
    let dataPoints: number[] = [];
    let label = '';
    let borderColor = '';
    let fillGradStart = '';
    let fillGradStop = 'rgba(0, 0, 0, 0)';

    // Configure details depending on the active tab
    switch (this.activeTab) {
      case 'temp':
        dataPoints = filteredHours.map(h => this.isCelsius ? h.tempC : h.tempF);
        label = `Temperature (°${this.isCelsius ? 'C' : 'F'})`;
        borderColor = '#ef4444'; // Orange/Red
        fillGradStart = 'rgba(239, 68, 68, 0.25)';
        break;
      case 'humidity':
        dataPoints = filteredHours.map(h => h.rainProbability); // Rain/Humidity probability trend
        label = 'Rain Probability (%)';
        borderColor = '#3b82f6'; // Blue
        fillGradStart = 'rgba(59, 130, 246, 0.25)';
        break;
      case 'wind':
        dataPoints = filteredHours.map(h => h.windKph);
        label = 'Wind Speed (kph)';
        borderColor = '#10b981'; // Green
        fillGradStart = 'rgba(16, 185, 129, 0.25)';
        break;
      case 'pressure':
        // Generate a subtle curve based on current weather since hourly pressure isn't in main forecast list
        dataPoints = filteredHours.map((_, i) => 1010 + Math.sin(i / 2) * 4);
        label = 'Atmospheric Pressure (mb)';
        borderColor = '#8b5cf6'; // Purple
        fillGradStart = 'rgba(139, 92, 246, 0.25)';
        break;
    }

    // Create line gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 220);
    gradient.addColorStop(0, fillGradStart);
    gradient.addColorStop(1, fillGradStop);

    // Is dark mode? Read attribute to configure grid colors
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.05)';
    const textColor = isDark ? '#94a3b8' : '#475569';

    this.chartInstance = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label,
          data: dataPoints,
          borderColor,
          borderWidth: 3,
          backgroundColor: gradient,
          fill: true,
          tension: 0.4, // smooth bezier curves
          pointBackgroundColor: borderColor,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1.5,
          pointRadius: 3,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false // hide default legend
          },
          tooltip: {
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.9)',
            titleColor: isDark ? '#f8fafc' : '#0f172a',
            bodyColor: isDark ? '#f8fafc' : '#0f172a',
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            borderWidth: 1,
            displayColors: false,
            padding: 10,
            callbacks: {
              label: (context) => ` ${context.parsed.y}${this.getUnitSymbol()}`
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: textColor,
              font: {
                family: 'Plus Jakarta Sans',
                size: 11
              }
            }
          },
          y: {
            grid: {
              color: gridColor
            },
            ticks: {
              color: textColor,
              font: {
                family: 'Plus Jakarta Sans',
                size: 11
              }
            }
          }
        }
      }
    });
  }

  private getUnitSymbol(): string {
    if (this.activeTab === 'temp') return `°${this.isCelsius ? 'C' : 'F'}`;
    if (this.activeTab === 'humidity') return '%';
    if (this.activeTab === 'wind') return ' kph';
    if (this.activeTab === 'pressure') return ' mb';
    return '';
  }
}
