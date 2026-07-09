import { Component, Input, AfterViewInit, ElementRef, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import gsap from 'gsap';
import { HourlyForecast } from '../../core/models/weather.model';
import { SvgIconComponent } from '../../shared/components/svg-icon/svg-icon.component';

@Component({
  selector: 'app-hourly-forecast',
  standalone: true,
  imports: [CommonModule, SvgIconComponent],
  templateUrl: './hourly-forecast.component.html',
  styleUrls: ['./hourly-forecast.component.scss']
})
export class HourlyForecastComponent implements AfterViewInit, OnChanges {
  @Input() forecast: HourlyForecast[] = [];
  @Input() isCelsius = true;

  constructor(private el: ElementRef) {}

  ngAfterViewInit(): void {
    this.animateEntrance();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['forecast'] && this.forecast.length > 0) {
      // Re-trigger entrance animation when data changes
      setTimeout(() => this.animateEntrance(), 50);
    }
  }

  private animateEntrance(): void {
    const cards = this.el.nativeElement.querySelectorAll('.hourly-card');
    if (cards.length > 0) {
      gsap.fromTo(cards, 
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.02, ease: 'power2.out' }
      );
    }
  }

  onCardHover(event: MouseEvent, enter: boolean): void {
    const card = event.currentTarget as HTMLElement;
    if (enter) {
      gsap.to(card, {
        scale: 1.05,
        y: -4,
        duration: 0.25,
        ease: 'power1.out',
        boxShadow: 'var(--shadow-glow), var(--shadow-main)',
        borderColor: 'var(--accent)'
      });
    } else {
      gsap.to(card, {
        scale: 1,
        y: 0,
        duration: 0.25,
        ease: 'power1.out',
        boxShadow: 'var(--shadow-main)',
        borderColor: 'var(--border-glass)'
      });
    }
  }
}
