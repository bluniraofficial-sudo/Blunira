"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";

export function Hero3DModel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState({ transform: "perspective(1200px) rotateX(0deg) rotateY(0deg) scale(1)", transition: "transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)" });
  const [processedSrc, setProcessedSrc] = useState<string | null>(null);

  // Client-side background transparency filter (preserving full image width for bubbles)
  useEffect(() => {
    const img = new window.Image();
    img.src = "/hero-bottle-transparent.png";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;

      // Draw full image to preserve bubbles on the edges
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      // Filter out white/light background pixels to make them transparent
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Calculate average brightness
        const brightness = (r + g + b) / 3;

        // Only target near-perfect white background pixels (brightness > 250)
        // to preserve the glass highlights and reflections inside the bottle
        if (brightness > 250) {
          // Smooth alpha transition over a narrow 5-unit range to prevent jagged edges
          const alphaFactor = Math.max(0, (255 - brightness) / 5); // 0.0 to 1.0
          data[i + 3] = Math.floor(data[i + 3] * alphaFactor);
        }
      }

      ctx.putImageData(imgData, 0, 0);
      setProcessedSrc(canvas.toDataURL("image/png"));
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      // Max rotation angles (refined for a more pronounced 3D effect)
      const rotateX = -(y / rect.height) * 20; // Max 20 degrees
      const rotateY = (x / rect.width) * 20;

      setStyle({
        transform: `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.12)`,
        transition: "transform 0.1s linear",
      });
    };

    const handleMouseLeave = () => {
      setStyle({
        transform: "perspective(1200px) rotateX(0deg) rotateY(0deg) scale(1)",
        transition: "transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)",
      });
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="relative z-10 w-full flex items-center justify-center"
      style={style}
    >
      <div className="relative w-full max-w-[850px] pointer-events-none group">
        
        {/* Modern Dynamic Glow behind the Model */}
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400/40 via-blue-500/20 to-indigo-500/40 blur-[100px] rounded-[100%] scale-105 -z-10 opacity-75 group-hover:opacity-100 group-hover:scale-115 transition-all duration-700 ease-out" />
        <div className="absolute top-[15%] left-[15%] w-[70%] h-[70%] bg-cyan-300/35 blur-[80px] rounded-full -z-10 mix-blend-screen opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100" />
        
        {/* Render bottle image once processing is complete */}
        <div className="relative z-10 w-full flex justify-center">
          {processedSrc ? (
            <Image
              src={processedSrc}
              alt="Premium Blunira water bottle with QR code label"
              width={1050}
              height={1300}
              className="object-contain scale-[1] drop-shadow-[0_25px_60px_rgba(6,182,212,0.25)] max-h-[320px] sm:max-h-[460px] lg:max-h-[80vh] w-auto transition-transform duration-500"
              priority
              unoptimized
            />
          ) : (
            // Sleek loader skeleton while the browser canvas handles the initial processing
            <div className="w-[240px] h-[320px] sm:w-[300px] sm:h-[460px] flex items-center justify-center">
              <div className="w-24 h-64 border border-cyan-500/20 bg-cyan-500/5 rounded-3xl animate-pulse relative">
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full border border-cyan-500/30" />
              </div>
            </div>
          )}
        </div>
        
        {/* Reflection / Ground Shadow effect */}
        <div className="absolute -bottom-8 inset-x-12 h-8 bg-black/20 dark:bg-black/40 blur-2xl rounded-[100%] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      </div>
    </div>
  );
}
