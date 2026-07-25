"use client";

import React, { useRef, Suspense, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { useTexture, Center, Environment } from "@react-three/drei";
import * as THREE from "three";

// Individual bubble particle definition
interface Bubble {
  position: [number, number, number];
  speed: number;
  scale: number;
  seed: number;
}

function Bottle() {
  const groupRef = useRef<THREE.Group>(null);
  const liquidRef = useRef<THREE.Mesh>(null);
  const bubblesRef = useRef<THREE.Group>(null);
  const targetRotation = useRef({ x: 0, y: 0 });

  // Load custom label texture
  const labelTexture = useTexture("/hero-bottle-transparent.png");
  
  // Crop the texture to display only the label portion of the full bottle mockup image
  useMemo(() => {
    labelTexture.repeat.set(1, 0.40);
    labelTexture.offset.set(0, 0.25);
    labelTexture.wrapS = THREE.ClampToEdgeWrapping;
    labelTexture.wrapT = THREE.ClampToEdgeWrapping;
  }, [labelTexture]);

  // Generate stable bubbles inside the bottle
  const bubbles = useMemo<Bubble[]>(() => {
    return Array.from({ length: 25 }, () => ({
      position: [
        (Math.random() - 0.5) * 0.4,
        (Math.random() - 0.5) * 1.2,
        (Math.random() - 0.5) * 0.4,
      ],
      speed: Math.random() * 0.4 + 0.2,
      scale: Math.random() * 0.015 + 0.005,
      seed: Math.random() * 100,
    }));
  }, []);

  // Track mouse movements to rotate the bottle group
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) - 0.5;
      const y = (e.clientY / window.innerHeight) - 0.5;
      targetRotation.current.y = x * 0.6; // rotation around Y axis
      targetRotation.current.x = y * 0.4; // rotation around X axis
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // R3F frame loop for animations
  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // 1. Gently float the bottle forever
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(time * 1.5) * 0.12;
      
      // Auto-rotation idle loop + mouse target tracking
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetRotation.current.y + time * 0.1,
        0.05
      );
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        targetRotation.current.x,
        0.05
      );
    }

    // 2. Liquid subtle ripple effect
    if (liquidRef.current) {
      liquidRef.current.scale.x = 0.99 + Math.sin(time * 3) * 0.005;
      liquidRef.current.scale.z = 0.99 + Math.cos(time * 3) * 0.005;
    }

    // 3. Float bubbles upwards
    if (bubblesRef.current) {
      bubblesRef.current.children.forEach((child, index) => {
        const bubbleData = bubbles[index];
        if (bubbleData) {
          child.position.y += bubbleData.speed * 0.005;
          // Sway bubble sideways
          child.position.x = bubbleData.position[0] + Math.sin(time * 2 + bubbleData.seed) * 0.03;
          
          // Reset bubble position when it reaches the top of the fluid
          if (child.position.y > 0.8) {
            child.position.y = -0.8;
          }
        }
      });
    }
  });

  return (
    <group ref={groupRef}>
      {/* ── BOTTLE BODY (Frosted/Transparent Glass) ── */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.45, 0.45, 2.0, 32]} />
        <meshPhysicalMaterial
          roughness={0.05}
          transmission={0.9}
          thickness={0.2}
          envMapIntensity={1.5}
          clearcoat={1.0}
          clearcoatRoughness={0.05}
          color="#dbeafe"
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* ── BOTTLE NECK ── */}
      <mesh position={[0, 1.15, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.35, 0.3, 32]} />
        <meshPhysicalMaterial
          roughness={0.05}
          transmission={0.9}
          thickness={0.2}
          clearcoat={1.0}
          color="#dbeafe"
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* ── BOTTLE CAP (Ribbed Blue Cap) ── */}
      <mesh position={[0, 1.35, 0]} castShadow>
        <cylinderGeometry args={[0.24, 0.24, 0.12, 32]} />
        <meshStandardMaterial
          color="#1e40af"
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>

      {/* ── FLUID / WATER (Inside) ── */}
      <mesh ref={liquidRef} position={[0, -0.1, 0]}>
        <cylinderGeometry args={[0.43, 0.43, 1.7, 32]} />
        <meshPhysicalMaterial
          color="#06b6d4"
          transmission={0.7}
          roughness={0.1}
          thickness={0.5}
          transparent
          opacity={0.45}
        />
      </mesh>

      {/* ── BUBBLES ── */}
      <group ref={bubblesRef}>
        {bubbles.map((b, i) => (
          <mesh key={i} position={b.position}>
            <sphereGeometry args={[b.scale, 8, 8]} />
            <meshPhysicalMaterial
              color="#ffffff"
              transmission={0.9}
              roughness={0.0}
              transparent
              opacity={0.7}
            />
          </mesh>
        ))}
      </group>

      {/* ── BRAND LABEL (Curved Decal on Front Only) ── */}
      <mesh position={[0, -0.1, 0.01]}>
        <cylinderGeometry args={[0.456, 0.456, 1.0, 32, 1, true, -Math.PI / 2, Math.PI]} />
        <meshBasicMaterial
          map={labelTexture}
          transparent
          side={THREE.DoubleSide}
          depthWrite={true}
        />
      </mesh>
    </group>
  );
}

export default function BottleCanvas() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Elegant skeleton loader matching viewport dimensions
    return (
      <div className="w-full h-[580px] max-h-[75vh] flex items-center justify-center relative select-none">
        <div className="absolute w-[300px] h-[300px] rounded-full bg-cyan-500/10 blur-[80px] animate-pulse" />
        <div className="w-24 h-64 border border-cyan-500/20 bg-cyan-500/5 rounded-3xl animate-pulse relative">
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full border border-cyan-500/30" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[580px] max-h-[75vh] relative select-none">
      <Canvas
        camera={{ position: [0, 0, 3.2], fov: 45 }}
        shadows
        gl={{ antialias: true, alpha: true }}
      >
        {/* Lights */}
        <ambientLight intensity={0.5} />
        
        {/* Spotlighting for realistic high-key caustics */}
        <spotLight
          position={[5, 8, 5]}
          angle={0.3}
          penumbra={1}
          intensity={2}
          castShadow
          shadow-bias={-0.0001}
        />
        <pointLight position={[-4, -2, -3]} intensity={1.5} color="#06b6d4" />
        <pointLight position={[3, -2, 2]} intensity={1.0} color="#6366f1" />

        {/* Dynamic Studio Environments */}
        <Suspense fallback={null}>
          <Environment preset="studio" />
          <Bottle />
        </Suspense>
      </Canvas>
    </div>
  );
}
