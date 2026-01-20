"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import {
  Camera,
  CameraOff,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { checkInMember } from "./actions";

type CheckInResult = {
  success: boolean;
  alreadyCheckedIn?: boolean;
  member?: { id: string; name: string };
  error?: string;
};

// Dynamically import html5-qrcode to avoid SSR issues
let Html5Qrcode: typeof import("html5-qrcode").Html5Qrcode | null = null;

export function QRScanner({ onCheckIn }: { onCheckIn: () => void }) {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const scannerRef = useRef<InstanceType<
    typeof import("html5-qrcode").Html5Qrcode
  > | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerIdRef = useRef<string>(`qr-reader-${Date.now()}`);
  const isMountedRef = useRef(true);
  const isCleaningUpRef = useRef(false);

  const cleanup = useCallback(async () => {
    if (isCleaningUpRef.current) return;
    isCleaningUpRef.current = true;

    const scanner = scannerRef.current;
    if (scanner) {
      try {
        // Check if scanner is running before stopping
        const state = scanner.getState();
        // States: NOT_STARTED = 1, SCANNING = 2, PAUSED = 3
        if (state === 2 || state === 3) {
          await scanner.stop();
        }
        // Clear the scanner's internal state
        scanner.clear();
      } catch (e) {
        // Ignore cleanup errors
        console.debug("Scanner cleanup:", e);
      }
      scannerRef.current = null;
    }

    // Manually clear the container to prevent React conflicts
    if (containerRef.current) {
      while (containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }
    }

    if (isMountedRef.current) {
      setScanning(false);
    }
    isCleaningUpRef.current = false;
  }, []);

  const stopScanning = useCallback(async () => {
    await cleanup();
  }, [cleanup]);

  const startScanning = async () => {
    if (isInitializing) return;
    setIsInitializing(true);
    setError(null);
    setResult(null);

    try {
      // Ensure previous scanner is cleaned up
      await cleanup();

      // Dynamically import html5-qrcode
      if (!Html5Qrcode) {
        const module = await import("html5-qrcode");
        Html5Qrcode = module.Html5Qrcode;
      }

      // Create a fresh ID for this scanner instance
      scannerIdRef.current = `qr-reader-${Date.now()}`;

      // Set up the container with a fresh div
      if (containerRef.current) {
        while (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild);
        }
        const innerDiv = document.createElement("div");
        innerDiv.id = scannerIdRef.current;
        containerRef.current.appendChild(innerDiv);
      }

      // Small delay to ensure DOM is ready
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (!isMountedRef.current) return;

      const scanner = new Html5Qrcode(scannerIdRef.current, { verbose: false });
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          if (!isMountedRef.current || !scannerRef.current) return;

          // Pause scanning while processing
          try {
            await scanner.pause();
          } catch {
            return; // Scanner was stopped
          }

          const checkInResult = await checkInMember(decodedText);

          if (isMountedRef.current) {
            setResult(checkInResult);
            if (checkInResult.success) {
              onCheckIn();
            }
          }

          // Resume scanning after a delay
          setTimeout(async () => {
            if (!isMountedRef.current || !scannerRef.current) return;
            try {
              const state = scanner.getState();
              if (state === 3) {
                // PAUSED
                await scanner.resume();
              }
              if (isMountedRef.current) {
                setResult(null);
              }
            } catch {
              // Scanner might be stopped
            }
          }, 2000);
        },
        () => {
          // QR code scan error - ignore (just means no QR code in frame)
        },
      );

      if (isMountedRef.current) {
        setScanning(true);
      }
    } catch (err) {
      if (isMountedRef.current) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        if (errorMessage.includes("Permission")) {
          setError("Camera permission denied. Please allow camera access.");
        } else if (errorMessage.includes("NotFoundError")) {
          setError("No camera found. Please connect a camera.");
        } else {
          setError("Failed to start camera. Please try again.");
        }
      }
      console.error("Scanner start error:", err);
    } finally {
      if (isMountedRef.current) {
        setIsInitializing(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;

      // Synchronous cleanup - stop the scanner immediately
      const scanner = scannerRef.current;
      if (scanner) {
        try {
          const state = scanner.getState();
          if (state === 2 || state === 3) {
            // Fire and forget - we can't await in cleanup
            scanner.stop().catch(() => {});
          }
          scanner.clear();
        } catch {
          // Ignore errors during cleanup
        }
        scannerRef.current = null;
      }

      // Clear the container
      if (containerRef.current) {
        while (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild);
        }
      }
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scan QR Code</CardTitle>
        <CardDescription>
          Point the camera at a member&apos;s QR code to check them in
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Wrapper div for positioning the overlay */}
          <div className="relative aspect-square max-w-md mx-auto bg-muted rounded-lg overflow-hidden">
            {/* Scanner container - NO React children allowed here */}
            <div ref={containerRef} className="absolute inset-0" />
            {/* Overlay - positioned absolutely, separate from scanner container */}
            {!scanning && !isInitializing && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted pointer-events-none">
                <p className="text-muted-foreground">Camera not active</p>
              </div>
            )}
            {isInitializing && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted pointer-events-none">
                <p className="text-muted-foreground">Starting camera...</p>
              </div>
            )}
          </div>

          {result && (
            <div
              className={`flex items-center gap-3 p-4 rounded-lg ${
                result.success
                  ? result.alreadyCheckedIn
                    ? "bg-yellow-500/10 text-yellow-600"
                    : "bg-green-500/10 text-green-600"
                  : "bg-red-500/10 text-red-600"
              }`}
            >
              {result.success ? (
                result.alreadyCheckedIn ? (
                  <>
                    <AlertCircle className="size-6" />
                    <div>
                      <p className="font-medium">{result.member?.name}</p>
                      <p className="text-sm">Already checked in today</p>
                    </div>
                  </>
                ) : (
                  <>
                    <CheckCircle className="size-6" />
                    <div>
                      <p className="font-medium">{result.member?.name}</p>
                      <p className="text-sm">Checked in successfully!</p>
                    </div>
                  </>
                )
              ) : (
                <>
                  <XCircle className="size-6" />
                  <div>
                    <p className="font-medium">Check-in failed</p>
                    <p className="text-sm">{result.error}</p>
                  </div>
                </>
              )}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 text-red-600">
              <XCircle className="size-6" />
              <p>{error}</p>
            </div>
          )}

          <div className="flex justify-center">
            {scanning ? (
              <Button variant="destructive" onClick={stopScanning}>
                <CameraOff className="mr-2 size-4" />
                Stop Camera
              </Button>
            ) : (
              <Button onClick={startScanning} disabled={isInitializing}>
                <Camera className="mr-2 size-4" />
                {isInitializing ? "Starting..." : "Start Camera"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
