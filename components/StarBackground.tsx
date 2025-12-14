import React, { useEffect, useRef } from 'react';

/**
 * StarBackground Component
 * 
 * A high-performance, interactive HTML5 Canvas background.
 * It creates a particle system of stars that float, twinkle, and react to mouse movements.
 * 
 * Features:
 * 1. Responsive canvas resizing.
 * 2. Particle physics (velocity, boundary bouncing).
 * 3. Mouse interaction (constellation effect via proximity detection).
 */
const StarBackground: React.FC = () => {
  // Reference to the <canvas> DOM element to access the 2D drawing context
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Get the 2D rendering context
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Track window dimensions
    let width = window.innerWidth;
    let height = window.innerHeight;
    
    // Mouse state: Coordinates and the interaction radius
    const mouse = { x: -100, y: -100, radius: 150 };

    // Function to set canvas size to full screen
    const setCanvasSize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    setCanvasSize();

    // Definition of a Star particle
    interface Star {
      x: number;      // X Coordinate
      y: number;      // Y Coordinate
      radius: number; // Size of the star
      vx: number;     // Velocity X (horizontal movement speed)
      vy: number;     // Velocity Y (vertical movement speed)
      alpha: number;  // Current opacity
      baseAlpha: number; // Minimum opacity to prevent it from disappearing
      flashSpeed: number; // Speed at which opacity changes (twinkling)
    }

    const stars: Star[] = [];
    // Calculate number of stars based on screen area.
    // Adjusted divisor for balanced density with higher brightness
    const starCount = Math.floor((width * height) / 5500); 

    // Initialize stars with random properties
    for (let i = 0; i < starCount; i++) {
      const radius = 0.5 + Math.random() * 1.8; // Guaranteed minimum size of 0.5px
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: radius,
        vx: (Math.random() - 0.5) * 0.4, // Slightly faster for more life
        vy: (Math.random() - 0.5) * 0.4,
        alpha: Math.random(),
        // Much higher base alpha for brighter stars (0.4 to 0.9)
        baseAlpha: 0.4 + Math.random() * 0.5, 
        flashSpeed: 0.005 + Math.random() * 0.01 // Random twinkle speed
      });
    }

    /**
     * Animation Loop
     * Runs roughly 60 times per second using requestAnimationFrame.
     */
    const animate = () => {
      // Clear previous frame
      ctx.clearRect(0, 0, width, height);
      
      // Global glow setting for "brightness" feel
      ctx.shadowBlur = 4;
      ctx.shadowColor = "white";

      stars.forEach((star) => {
        // --- Physics Update ---
        star.x += star.vx;
        star.y += star.vy;

        // Bounce off screen edges (reverse velocity)
        if (star.x < 0 || star.x > width) star.vx = -star.vx;
        if (star.y < 0 || star.y > height) star.vy = -star.vy;

        // --- Visual Effects ---
        // Twinkle logic: oscillating alpha value
        star.alpha += star.flashSpeed;
        if (star.alpha > 1 || star.alpha < star.baseAlpha) {
          star.flashSpeed = -star.flashSpeed; // Reverse fading direction
        }

        // --- Interaction Logic (The "Constellation" effect) ---
        // Calculate distance between mouse and star using Pythagorean theorem
        const dx = mouse.x - star.x;
        const dy = mouse.y - star.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // If mouse is close enough, interact
        if (distance < mouse.radius) {
            // 1. Repulsion Effect: Push stars gently away from cursor
            const forceDirectionX = dx / distance;
            const forceDirectionY = dy / distance;
            const force = (mouse.radius - distance) / mouse.radius;
            
            star.x -= forceDirectionX * force * 0.5;
            star.y -= forceDirectionY * force * 0.5;

            // 2. Connector Lines: Draw a line between star and mouse cursor
            ctx.beginPath();
            // Opacity of line depends on distance (fades out as it gets further)
            ctx.strokeStyle = `rgba(129, 140, 248, ${1 - distance / mouse.radius})`; // Indigo tint
            ctx.lineWidth = 0.6; // Slightly thicker lines
            ctx.moveTo(star.x, star.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
            ctx.closePath();
        }

        // --- Draw the Star ---
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        // Ensure alpha is never negative
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, Math.min(1, star.alpha))})`;
        ctx.fill();
      });

      // Schedule next frame
      requestAnimationFrame(animate);
    };

    // Start animation loop
    const animationId = requestAnimationFrame(animate);

    // --- Event Listeners ---
    const handleResize = () => {
      setCanvasSize();
    };

    const handleMouseMove = (e: MouseEvent) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    // Cleanup listeners on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      // Fixed position: z-1 to ensure it sits above background but below z-10 content
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-[1]"
    />
  );
};

export default StarBackground;