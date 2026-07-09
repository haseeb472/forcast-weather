import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type LoaderType = 'current' | 'forecast' | 'grid' | 'chart';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skeleton-loader.component.html',
  styleUrls: ['./skeleton-loader.component.scss']
})
export class SkeletonLoaderComponent {
  @Input() type: LoaderType = 'current';
}
