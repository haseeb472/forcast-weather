import { Component, Input, AfterViewInit, ElementRef, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import gsap from 'gsap';
import { DailyForecast } from '../../core/models/weather.model';
import { SvgIconComponent } from '../../shared/components/svg-icon/svg-icon.component';

@Component({
  selector: 'app-daily-forecast',
  standalone: true,
  imports: [CommonModule, SvgIconComponent],
  templateUrl: './daily-forecast.component.html',
  styleUrls: ['./daily-forecast.component.scss']
})
export class DailyForecastComponent implements AfterViewInit, OnChanges {
  @Input() forecast: DailyForecast[] = [];
  @Input() isCelsius = true;

  constructor(private el: ElementRef) {}

  ngAfterViewInit(): void {
    this.animateEntrance();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['forecast'] && this.forecast.length > 0) {
      setTimeout(() => this.animateEntrance(), 50);
    }
  }

  private animateEntrance(): void {
    const cards = this.el.nativeElement.querySelectorAll('.daily-row');
    if (cards.length > 0) {
      gsap.fromTo(cards, 
        { opacity: 0, x: 30 },
        { opacity: 1, x: 0, duration: 0.7, stagger: 0.07, ease: 'power3.out' }
      );
    }
  }
}
