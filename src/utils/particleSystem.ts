/**
 * High-performance 60fps particle and floating-text engine
 */

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  gravity: number;
  spin: number;
  angle: number;
  shape: 'circle' | 'square' | 'star';
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  scale: number;
  vy: number;
  decay: number;
  fontSize: number;
}

export interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  lineWidth: number;
  alpha: number;
}

export class ParticleEngine {
  private particles: Particle[] = [];
  private texts: FloatingText[] = [];
  private shockwaves: Shockwave[] = [];
  private ctx: CanvasRenderingContext2D | null = null;

  public init(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  public clear() {
    this.particles = [];
    this.texts = [];
    this.shockwaves = [];
  }

  /**
   * Spawn an explosive burst of sparks at (x, y)
   */
  public burst(
    x: number,
    y: number,
    colors: string[] = ['#06b6d4', '#ec4899', '#a855f7', '#fbbf24', '#ffffff'],
    count: number = 32,
    speedMultiplier: number = 1
  ) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (2 + Math.random() * 8) * speedMultiplier;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const shapes: ('circle' | 'square' | 'star')[] = ['circle', 'square', 'star'];

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 5,
        color,
        alpha: 1,
        decay: 0.018 + Math.random() * 0.02,
        gravity: 0.12,
        spin: (Math.random() - 0.5) * 0.2,
        angle: Math.random() * Math.PI * 2,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
      });
    }

    // Add shockwave ring
    this.shockwaves.push({
      x,
      y,
      radius: 5,
      maxRadius: 65 * speedMultiplier,
      color: colors[0] || '#06b6d4',
      lineWidth: 3,
      alpha: 0.9,
    });
  }

  /**
   * Spawn floating combo text
   */
  public addFloatingText(
    x: number,
    y: number,
    text: string,
    color: string = '#38bdf8',
    fontSize: number = 24
  ) {
    this.texts.push({
      id: Math.random().toString(),
      x,
      y,
      text,
      color,
      alpha: 1,
      scale: 1.4,
      vy: -2.8,
      decay: 0.024,
      fontSize,
    });
  }

  /**
   * Render and advance 1 frame of physics
   */
  public render(width: number, height: number) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, width, height);

    // Render shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += (sw.maxRadius - sw.radius) * 0.18;
      sw.alpha -= 0.04;

      if (sw.alpha <= 0.01) {
        this.shockwaves.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.strokeStyle = sw.color;
      ctx.globalAlpha = Math.max(0, sw.alpha);
      ctx.lineWidth = sw.lineWidth;
      ctx.stroke();
      ctx.restore();
    }

    // Render particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.98;
      p.angle += p.spin;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);

      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'square') {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      } else {
        // Simple 4-point star
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.lineTo(p.size * 0.3, -p.size * 0.3);
        ctx.lineTo(p.size, 0);
        ctx.lineTo(p.size * 0.3, p.size * 0.3);
        ctx.lineTo(0, p.size);
        ctx.lineTo(-p.size * 0.3, p.size * 0.3);
        ctx.lineTo(-p.size, 0);
        ctx.lineTo(-p.size * 0.3, -p.size * 0.3);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    // Render floating text
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.y += t.vy;
      t.vy *= 0.94;
      t.scale = Math.max(1, t.scale - 0.03);
      t.alpha -= t.decay;

      if (t.alpha <= 0) {
        this.texts.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, t.alpha);
      ctx.font = `700 ${Math.round(t.fontSize * t.scale)}px 'Fredoka', 'Trebuchet MS', sans-serif`;
      ctx.fillStyle = t.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = t.color;
      ctx.shadowBlur = 10;
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    }
  }
}

export const particleEngine = new ParticleEngine();
