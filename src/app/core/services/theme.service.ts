import { Injectable, signal } from '@angular/core';
import { StorageService } from './storage.service';
import gsap from 'gsap';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private activeTheme = signal<'dark' | 'light'>('dark');
  
  // Readonly signal for components to subscribe to
  theme = this.activeTheme.asReadonly();

  constructor(private storageService: StorageService) {
    const savedTheme = this.storageService.getTheme();
    this.activeTheme.set(savedTheme);
    this.applyTheme(savedTheme);
  }

  toggleTheme(): void {
    const current = this.activeTheme();
    const nextTheme = current === 'dark' ? 'light' : 'dark';
    
    // Premium GSAP animation on toggle
    // We animate the dashboard body elements for a smooth theme transition
    const elementsToAnimate = document.querySelectorAll('app-root, .glass-card');
    
    if (elementsToAnimate.length > 0) {
      gsap.to(elementsToAnimate, {
        opacity: 0.5,
        duration: 0.15,
        yoyo: true,
        repeat: 1,
        ease: 'power1.inOut',
        onRepeat: () => {
          this.activeTheme.set(nextTheme);
          this.storageService.setTheme(nextTheme);
          this.applyTheme(nextTheme);
        }
      });
    } else {
      this.activeTheme.set(nextTheme);
      this.storageService.setTheme(nextTheme);
      this.applyTheme(nextTheme);
    }
  }

  private applyTheme(theme: 'dark' | 'light'): void {
    document.documentElement.setAttribute('data-theme', theme);
  }
}
