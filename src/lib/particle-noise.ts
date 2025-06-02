// CLIENT-SAFE: Simple noise implementation for browser environments
interface NoiseFunction {
  (x: number, y: number): number;
}

// Fallback noise function for client-side usage
const createSimpleNoise2D = (): NoiseFunction => {
  const grad = [
    [1, 1], [-1, 1], [1, -1], [-1, -1],
    [1, 0], [-1, 0], [1, 0], [-1, 0],
    [0, 1], [0, -1], [0, 1], [0, -1]
  ];
  
  const perm = new Array(512);
  const p = new Array(256);
  
  // Initialize permutation table
  for (let i = 0; i < 256; i++) {
    p[i] = Math.floor(Math.random() * 256);
  }
  for (let i = 0; i < 512; i++) {
    perm[i] = p[i & 255];
  }
  
  const dot = (g: number[], x: number, y: number): number => g[0] * x + g[1] * y;
  
  const fade = (t: number): number => t * t * t * (t * (t * 6 - 15) + 10);
  
  const lerp = (t: number, a: number, b: number): number => a + t * (b - a);
  
  return (x: number, y: number): number => {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    
    x -= Math.floor(x);
    y -= Math.floor(y);
    
    const u = fade(x);
    const v = fade(y);
    
    const A = perm[X] + Y;
    const AA = perm[A & 255];
    const AB = perm[(A + 1) & 255];
    const B = perm[(X + 1) & 255] + Y;
    const BA = perm[B & 255];
    const BB = perm[(B + 1) & 255];
    
    return lerp(v, 
      lerp(u, dot(grad[AA & 15], x, y), dot(grad[BA & 15], x - 1, y)),
      lerp(u, dot(grad[AB & 15], x, y - 1), dot(grad[BB & 15], x - 1, y - 1))
    );
  };
};

// CLIENT-SAFE: Create noise function with fallback
const createNoise2D = (): NoiseFunction => {
  // Use simple client-side noise instead of simplex-noise
  return createSimpleNoise2D();
};

interface Particle {
  el: HTMLElement;
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  seed: number;
  speed: number;
  energy: number;
  resonance: number;
}

export class OrganicParticleSystem {
  private particles: Particle[] = [];
  private noise: NoiseFunction = createNoise2D();
  private time = 0;
  private animationId: number | null = null;
  private energyField: NoiseFunction = createNoise2D();

  init(elements: NodeListOf<Element>) {
    elements.forEach((el, i) => {
      if (el instanceof HTMLElement) {
        const rect = el.getBoundingClientRect();
        this.particles.push({
          el,
          x: rect.left,
          y: rect.top,
          baseX: rect.left,
          baseY: rect.top,
          seed: i * 1000 + Math.random() * 1000,
          speed: 0.2 + Math.random() * 0.3,
          energy: Math.random() * 0.5 + 0.5,
          resonance: Math.random() * 2 + 1
        });
      }
    });
  }

  start() {
    const animate = () => {
      this.time += 0.004; // Slower, more luxurious movement
      
      this.particles.forEach(p => {
        // Enhanced crystal field physics
        const energyX = this.energyField(p.seed * 0.5, this.time * 0.7) * 60;
        const energyY = this.energyField(p.seed * 0.7, this.time * 0.5) * 60;
        
        // Organic drift with crystal resonance
        const noiseX = this.noise(p.seed, this.time) * (40 * p.energy);
        const noiseY = this.noise(p.seed * 2, this.time) * (40 * p.energy);
        
        // Crystal prism rotation with energy influence
        const rotation = this.noise(p.seed * 3, this.time) * (25 * p.resonance);
        
        // Combined movement with energy field influence
        const finalX = (noiseX + energyX * 0.3) * p.speed;
        const finalY = (noiseY + energyY * 0.3) * p.speed;
        
        p.x = p.baseX + finalX;
        p.y = p.baseY + finalY;
        
        // Enhanced crystal transformation
        const scale = 1 + Math.sin(this.time * p.speed * p.resonance) * 0.15;
        const brightness = 0.7 + Math.sin(this.time * p.speed * 1.5) * 0.3;
        
        p.el.style.transform = `
          translate3d(${finalX}px, ${finalY}px, 0) 
          rotate(${rotation}deg)
          scale(${scale})
        `;
        
        // Dynamic crystal opacity with energy resonance
        const baseOpacity = 0.4 + Math.sin(this.time * p.speed * 2) * 0.3;
        const energyOpacity = p.energy * brightness;
        p.el.style.opacity = Math.min(baseOpacity * energyOpacity, 0.8).toString();
        
        // Crystal prism color shifting
        p.el.style.filter = `brightness(${brightness}) hue-rotate(${Math.sin(this.time * p.resonance) * 30}deg)`;
      });
      
      this.animationId = requestAnimationFrame(animate);
    };
    
    animate();
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
} 