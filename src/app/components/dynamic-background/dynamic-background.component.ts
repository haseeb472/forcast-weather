import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import gsap from 'gsap';

export type WeatherState = 'clear' | 'partly-cloudy' | 'cloudy' | 'rain' | 'thunderstorm' | 'snow' | 'fog' | 'night';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  opacity: number;
  angle?: number;
  spin?: number;
}

@Component({
  selector: 'app-dynamic-background',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dynamic-background.component.html',
  styleUrls: ['./dynamic-background.component.scss']
})
export class DynamicBackgroundComponent implements OnInit, OnDestroy {
  @Input() set conditionCode(code: number | undefined) {
    if (code === undefined) return;
    this.updateWeatherState(code);
  }

  @Input() set isNight(night: boolean | undefined) {
    this._isNight = !!night;
    // Re-evaluate if condition code is set
    if (this._lastCode !== undefined) {
      this.updateWeatherState(this._lastCode);
    }
  }

  private _isNight = false;
  private _lastCode: number | undefined;

  weatherState = signal<WeatherState>('clear');

  @ViewChild('particleCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('lightning', { static: true }) lightningRef!: ElementRef<HTMLDivElement>;

  private ctx!: CanvasRenderingContext2D | null;
  private animationId = 0;
  private particles: Particle[] = [];
  private width = 0;
  private height = 0;
  
  // Track active elements for GSAP gradient crossfading
  private currentActiveGradientClass = '';

  constructor() {
    // React to changes in weather state to trigger GSAP cross-fades
    effect(() => {
      const state = this.weatherState();
      this.transitionGradients(state);
      this.initParticles(state);
    });
  }

  ngOnInit(): void {
    this.initCanvas();
    window.addEventListener('resize', this.onResize);
  }

  ngOnDestroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener('resize', this.onResize);
  }

  private initCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d');
    this.onResize();
    this.loop();
  }

  private onResize = (): void => {
    const canvas = this.canvasRef.nativeElement;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    canvas.width = this.width;
    canvas.height = this.height;
    this.initParticles(this.weatherState());
  };

  private updateWeatherState(code: number): void {
    this._lastCode = code;
    
    if (this._isNight) {
      this.weatherState.set('night');
      return;
    }

    // WeatherAPI codes: https://www.weatherapi.com/docs/weather_conditions.json
    switch (code) {
      case 1000: // Sunny / Clear
        this.weatherState.set('clear');
        break;
      case 1003: // Partly cloudy
        this.weatherState.set('partly-cloudy');
        break;
      case 1006: // Cloudy
      case 1009: // Overcast
        this.weatherState.set('cloudy');
        break;
      case 1030: // Mist
      case 1135: // Fog
      case 1147: // Freezing fog
        this.weatherState.set('fog');
        break;
      // Rain
      case 1063: // Patchy rain nearby
      case 1150: // Patchy light drizzle
      case 1153: // Light drizzle
      case 1180: // Patchy light rain
      case 1183: // Light rain
      case 1186: // Moderate rain at times
      case 1189: // Moderate rain
      case 1192: // Heavy rain at times
      case 1195: // Heavy rain
      case 1240: // Light rain shower
      case 1243: // Moderate or heavy rain shower
      case 1246: // Torrential rain shower
        this.weatherState.set('rain');
        break;
      // Thunder
      case 1087: // Thundery outbreaks nearby
      case 1273: // Patchy light rain with thunder
      case 1276: // Moderate or heavy rain with thunder
      case 1279: // Patchy light snow with thunder
      case 1282: // Moderate or heavy snow with thunder
        this.weatherState.set('thunderstorm');
        break;
      // Snow
      case 1066: // Patchy snow nearby
      case 1114: // Blowing snow
      case 1117: // Blizzard
      case 1201: // Patchy freezing drizzle
      case 1210: // Patchy light snow
      case 1213: // Light snow
      case 1216: // Patchy moderate snow
      case 1219: // Moderate snow
      case 1222: // Patchy heavy snow
      case 1225: // Heavy snow
      case 1255: // Light snow showers
      case 1258: // Moderate or heavy snow showers
        this.weatherState.set('snow');
        break;
      default:
        this.weatherState.set('clear');
    }
  }

  private transitionGradients(state: WeatherState): void {
    const targetClass = `.${state}-sky`;
    const allGradients = '.gradient-overlay';
    
    // Hide other gradients smoothly and show the target one
    gsap.to(allGradients, {
      opacity: 0,
      duration: 1.5,
      ease: 'power2.inOut'
    });
    
    gsap.to(targetClass, {
      opacity: 1,
      duration: 1.5,
      ease: 'power2.inOut'
    });
    
    this.currentActiveGradientClass = targetClass;
  }

  private initParticles(state: WeatherState): void {
    this.particles = [];
    if (!this.width || !this.height) return;

    let count = 0;
    
    if (state === 'rain' || state === 'thunderstorm') {
      count = state === 'thunderstorm' ? 120 : 80;
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          size: 1 + Math.random() * 2,
          speedY: 10 + Math.random() * 12,
          speedX: -2 - Math.random() * 3, // slightly slanted rain
          opacity: 0.15 + Math.random() * 0.4
        });
      }
    } else if (state === 'snow') {
      count = 60;
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          size: 2 + Math.random() * 4,
          speedY: 1 + Math.random() * 2,
          speedX: -0.5 + Math.random() * 1.5,
          opacity: 0.3 + Math.random() * 0.5,
          angle: Math.random() * Math.PI * 2,
          spin: 0.01 + Math.random() * 0.03
        });
      }
    } else if (state === 'night') {
      count = 80;
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          size: 0.5 + Math.random() * 1.5,
          speedY: 0,
          speedX: 0,
          opacity: 0.1 + Math.random() * 0.8,
          angle: Math.random() * Math.PI * 2,
          spin: 0.01 + Math.random() * 0.02 // used here as shimmer frequency
        });
      }
    } else if (state === 'fog') {
      count = 20;
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          size: 80 + Math.random() * 150, // large foggy circles
          speedY: -0.1 + Math.random() * 0.2,
          speedX: 0.2 + Math.random() * 0.4,
          opacity: 0.04 + Math.random() * 0.06
        });
      }
    } else if (state === 'clear' || state === 'partly-cloudy') {
      // Warm floating sun dust particles
      count = 25;
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          size: 1 + Math.random() * 3,
          speedY: -0.2 - Math.random() * 0.4,
          speedX: -0.1 + Math.random() * 0.3,
          opacity: 0.1 + Math.random() * 0.25
        });
      }
    }
  }

  private loop = (): void => {
    this.updateParticles();
    this.draw();
    
    // Random lightning triggers in thunderstorm state
    if (this.weatherState() === 'thunderstorm' && Math.random() < 0.004) {
      this.triggerLightningFlash();
    }
    
    this.animationId = requestAnimationFrame(this.loop);
  };

  private updateParticles(): void {
    const state = this.weatherState();
    
    this.particles.forEach(p => {
      if (state === 'rain' || state === 'thunderstorm') {
        p.y += p.speedY;
        p.x += p.speedX;
        if (p.y > this.height) {
          p.y = -10;
          p.x = Math.random() * this.width;
        }
      } else if (state === 'snow') {
        p.y += p.speedY;
        if (p.angle !== undefined && p.spin !== undefined) {
          p.angle += p.spin;
          p.x += p.speedX + Math.sin(p.angle) * 0.5;
        }
        if (p.y > this.height) {
          p.y = -10;
          p.x = Math.random() * this.width;
        }
      } else if (state === 'night') {
        // Twinkling stars
        if (p.angle !== undefined && p.spin !== undefined) {
          p.angle += p.spin;
          p.opacity = 0.2 + (Math.sin(p.angle) + 1) * 0.35; // pulses between 0.2 and 0.9
        }
      } else if (state === 'fog') {
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.x > this.width + p.size) {
          p.x = -p.size;
          p.y = Math.random() * this.height;
        }
      } else if (state === 'clear' || state === 'partly-cloudy') {
        p.y += p.speedY;
        p.x += p.speedX;
        if (p.y < -p.size) {
          p.y = this.height + p.size;
          p.x = Math.random() * this.width;
        }
      }
    });
  }

  private draw(): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const state = this.weatherState();

    ctx.clearRect(0, 0, this.width, this.height);

    if (state === 'rain' || state === 'thunderstorm') {
      ctx.strokeStyle = 'rgba(174, 194, 224, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      
      this.particles.forEach(p => {
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.speedX * 0.8, p.y + p.speedY * 0.8);
      });
      ctx.stroke();
    } else if (state === 'snow') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      this.particles.forEach(p => {
        ctx.moveTo(p.x, p.y);
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      });
      ctx.fill();
    } else if (state === 'night') {
      ctx.beginPath();
      this.particles.forEach(p => {
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      });
    } else if (state === 'fog') {
      this.particles.forEach(p => {
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        grad.addColorStop(0, `rgba(224, 231, 255, ${p.opacity})`);
        grad.addColorStop(0.5, `rgba(224, 231, 255, ${p.opacity * 0.4})`);
        grad.addColorStop(1, 'rgba(224, 231, 255, 0)');
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (state === 'clear' || state === 'partly-cloudy') {
      // Draw solar dust motes
      ctx.fillStyle = 'rgba(255, 223, 150, 0.3)';
      ctx.beginPath();
      this.particles.forEach(p => {
        ctx.moveTo(p.x, p.y);
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      });
      ctx.fill();
    }
  }

  private triggerLightningFlash(): void {
    const flash = this.lightningRef.nativeElement;
    
    // Quick flashing pattern using GSAP
    const tl = gsap.timeline();
    tl.to(flash, { opacity: 0.8, duration: 0.05 })
      .to(flash, { opacity: 0.1, duration: 0.05 })
      .to(flash, { opacity: 0.9, duration: 0.08 })
      .to(flash, { opacity: 0, duration: 0.3 });
  }
}
