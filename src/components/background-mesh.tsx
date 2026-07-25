"use client";

import React, { useEffect, useRef } from "react";

interface GlowNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  colorDark: string;
  colorLight: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
}

export function BackgroundMesh() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Dynamic sizing listener
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Track mouse coordinates
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.active = true;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Shifting colored glowing nodes
    const glowNodes: GlowNode[] = [
      {
        x: width * 0.25,
        y: height * 0.25,
        vx: 0.6,
        vy: 0.4,
        radius: Math.min(width, height) * 0.4,
        colorDark: "rgba(6, 182, 212, 0.08)", // Cyan
        colorLight: "rgba(6, 182, 212, 0.05)",
      },
      {
        x: width * 0.75,
        y: height * 0.3,
        vx: -0.4,
        vy: 0.5,
        radius: Math.min(width, height) * 0.45,
        colorDark: "rgba(99, 102, 241, 0.08)", // Indigo
        colorLight: "rgba(99, 102, 241, 0.05)",
      },
      {
        x: width * 0.5,
        y: height * 0.75,
        vx: 0.3,
        vy: -0.5,
        radius: Math.min(width, height) * 0.35,
        colorDark: "rgba(20, 184, 166, 0.07)", // Teal
        colorLight: "rgba(20, 184, 166, 0.04)",
      },
    ];

    // Drifting dust particles
    const particles: Particle[] = Array.from({ length: 45 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.2,
      vy: -Math.random() * 0.4 - 0.1, // Drifting upwards
      size: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.5 + 0.1,
    }));

    // Animation Loop
    const draw = () => {
      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Check current theme
      const isDark = document.documentElement.getAttribute("data-theme") !== "light";

      // Render base mesh gradient glows
      ctx.globalCompositeOperation = "screen";

      glowNodes.forEach((node) => {
        // Move nodes
        node.x += node.vx;
        node.y += node.vy;

        // Bounce nodes off screen boundaries
        if (node.x - node.radius < 0 || node.x + node.radius > width) node.vx *= -1;
        if (node.y - node.radius < 0 || node.y + node.radius > height) node.vy *= -1;

        // Create radial gradient glow
        const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.radius);
        const color = isDark ? node.colorDark : node.colorLight;

        gradient.addColorStop(0, color);
        gradient.addColorStop(0.5, color.replace(/[\d.]+\)$/, "0.03)"));
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Render Mouse Reactive Ambient Glow
      if (mouseRef.current.active) {
        ctx.globalCompositeOperation = "screen";
        const mouseGlowRadius = Math.min(width, height) * 0.25;
        const mouseGradient = ctx.createRadialGradient(
          mouseRef.current.x,
          mouseRef.current.y,
          0,
          mouseRef.current.x,
          mouseRef.current.y,
          mouseGlowRadius
        );

        const mouseColor = isDark
          ? "rgba(6, 182, 212, 0.04)"
          : "rgba(6, 182, 212, 0.03)";

        mouseGradient.addColorStop(0, mouseColor);
        mouseGradient.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = mouseGradient;
        ctx.beginPath();
        ctx.arc(mouseRef.current.x, mouseRef.current.y, mouseGlowRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Render Dust Particles
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = isDark ? "rgba(226, 234, 244, 0.8)" : "rgba(15, 23, 42, 0.4)";

      particles.forEach((p) => {
        // Move particle
        p.y += p.vy;
        p.x += p.vx;

        // Wrap around screen boundaries
        if (p.y < 0) {
          p.y = height;
          p.x = Math.random() * width;
        }
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.globalAlpha = p.alpha;
        ctx.fill();
      });

      ctx.globalAlpha = 1.0;
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* Dynamic Canvas Rendering */}
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* SVG Micro-Noise Grain Overlay for Texture */}
      <div 
        className="absolute inset-0 opacity-[0.025] dark:opacity-[0.035] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />
    </div>
  );
}
