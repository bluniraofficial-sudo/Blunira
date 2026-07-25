"use client";

import { useEffect } from "react";
import { ServerErrorClient } from "@/components/server-error-client";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console
    console.error("Uncaught runtime error:", error);
  }, [error]);

  return <ServerErrorClient reset={reset} />;
}
