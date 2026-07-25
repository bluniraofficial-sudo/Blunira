"use client";

import React from "react";
import dynamic from "next/dynamic";

// Dynamic import on the client-side to prevent hydration issues
const BottleCanvas = dynamic(() => import("./bottle-canvas"), {
  ssr: false,
});

export function BottleDynamic() {
  return <BottleCanvas />;
}
