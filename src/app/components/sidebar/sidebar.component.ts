import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SvgIconComponent } from '../../shared/components/svg-icon/svg-icon.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, SvgIconComponent],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  @Input() favorites: string[] = [];
  @Input() history: string[] = [];
  @Input() currentCity = '';

  @Output() selectCity = new EventEmitter<string>();
  @Output() removeFavorite = new EventEmitter<string>();
  @Output() removeHistoryItem = new EventEmitter<string>();
  @Output() clearHistory = new EventEmitter<void>();

  onSelect(city: string): void {
    this.selectCity.emit(city);
  }

  onRemoveFav(event: MouseEvent, city: string): void {
    event.stopPropagation(); // prevent select city trigger
    this.removeFavorite.emit(city);
  }

  onRemoveHistory(event: MouseEvent, city: string): void {
    event.stopPropagation();
    this.removeHistoryItem.emit(city);
  }

  onClearHistory(): void {
    this.clearHistory.emit();
  }
}
