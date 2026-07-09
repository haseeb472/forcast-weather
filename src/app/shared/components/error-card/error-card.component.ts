import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SvgIconComponent } from '../svg-icon/svg-icon.component';

@Component({
  selector: 'app-error-card',
  standalone: true,
  imports: [CommonModule, SvgIconComponent],
  template: `
    <div class="glass-card error-card-container">
      <div class="error-icon-wrapper">
        <app-svg-icon name="alert-triangle" [size]="40" color="#ef4444"></app-svg-icon>
      </div>
      
      <h3 class="error-title">Something went wrong</h3>
      <p class="error-message">{{ message || 'Failed to retrieve weather data. Please try again.' }}</p>
      
      <button class="glass-button retry-btn" (click)="onRetry()">
        <span>Try Again</span>
      </button>
    </div>
  `,
  styles: [`
    .error-card-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 40px 24px;
      max-width: 480px;
      margin: 40px auto;
      border-color: rgba(239, 68, 68, 0.2) !important;
      box-shadow: 0 8px 32px 0 rgba(239, 68, 68, 0.05), var(--shadow-inset) !important;
    }

    .error-icon-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: rgba(239, 68, 68, 0.1);
      margin-bottom: 20px;
      border: 1px solid rgba(239, 68, 68, 0.2);
    }

    .error-title {
      font-family: var(--font-title);
      font-size: 20px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 10px;
    }

    .error-message {
      font-size: 14px;
      color: var(--text-secondary);
      line-height: 1.5;
      margin-bottom: 24px;
      max-width: 320px;
    }

    .retry-btn {
      min-width: 140px;
      font-size: 14px;
      height: 42px;
      background: rgba(239, 68, 68, 0.15) !important;
      border-color: rgba(239, 68, 68, 0.3) !important;
      color: #ef4444 !important;
      
      &:hover {
        background: rgba(239, 68, 68, 0.25) !important;
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15) !important;
      }
    }
  `]
})
export class ErrorCardComponent {
  @Input() message = '';
  @Output() retry = new EventEmitter<void>();

  onRetry(): void {
    this.retry.emit();
  }
}
