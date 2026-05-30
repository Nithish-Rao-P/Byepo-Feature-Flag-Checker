"use client";

import React, { createContext, useContext, useRef, useEffect, useState } from "react";
import gsap from "gsap";

interface TransitionContextType {
  startTransition: (onSwap: () => void) => void;
  isPending: boolean;
}

const TransitionContext = createContext<TransitionContextType | undefined>(undefined);

export function useTransition() {
  const context = useContext(TransitionContext);
  if (!context) {
    throw new Error("useTransition must be used within a TransitionProvider");
  }
  return context;
}

export function TransitionProvider({ children }: { children: React.ReactNode }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const [isPending, setIsPending] = useState(false);

  // Set up initial GSAP coordinates on mount
  useEffect(() => {
    if (overlayRef.current) {
      gsap.set(overlayRef.current, { xPercent: -100 });
    }
    if (pathRef.current) {
      const length = pathRef.current.getTotalLength() || 1000;
      gsap.set(pathRef.current, {
        strokeDasharray: length,
        strokeDashoffset: length,
        fill: "transparent",
      });
    }
  }, []);

  const startTransition = (onSwap: () => void) => {
    if (isPending) return;
    setIsPending(true);

    const overlay = overlayRef.current;
    const path = pathRef.current;
    if (!overlay || !path) {
      onSwap();
      setIsPending(false);
      return;
    }

    const length = path.getTotalLength() || 1000;

    // Build timeline to perform slide in, vector drawing, solid color fill, routing, and slide out
    const tl = gsap.timeline({
      onComplete: () => {
        setIsPending(false);
      },
    });

    tl.set(overlay, { xPercent: -100 })
      .set(path, { strokeDashoffset: length, fill: "transparent" })
      .to(overlay, {
        xPercent: 0,
        duration: 0.35,
        ease: "power3.inOut",
      })
      .to(path, {
        strokeDashoffset: 0,
        duration: 0.35,
        ease: "power2.inOut",
      })
      .to(path, {
        fill: "#111111",
        duration: 0.25,
        ease: "power1.in",
      })
      .call(() => {
        onSwap();
      })
      .delay(0.12)
      .to(overlay, {
        xPercent: 100,
        duration: 0.35,
        ease: "power3.inOut",
      })
      .set(path, {
        fill: "transparent",
        strokeDashoffset: length,
      })
      .set(overlay, {
        xPercent: -100,
      });
  };

  return (
    <TransitionContext.Provider value={{ startTransition, isPending }}>
      {children}
      
      {/* Stark Full-Screen Transition Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-bg-paper select-none pointer-events-none"
        style={{
          boxShadow: "-10px 0 30px rgba(0,0,0,0.15)",
        }}
      >
        <div className="bg-[radial-gradient(#000_1px,transparent_1px)] opacity-[0.02] [background-size:16px_16px] absolute inset-0 pointer-events-none" />
        
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="p-4 bg-bg-paper h-32 w-32 flex items-center justify-center select-none">
            <svg
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-24 w-24"
            >
              <path
                ref={pathRef}
                d="M 27.5,15 L 60,15 L 75,27.5 L 60,40 L 40,40 L 40,60 L 60,60 L 75,72.5 L 60,85 L 27.5,85 L 15,72.5 L 15,27.5 Z"
                stroke="#111111"
                strokeWidth={8.5}
                strokeLinejoin="miter"
                strokeLinecap="square"
              />
            </svg>
          </div>
          
          <div className="flex flex-col items-center gap-1 select-none">
            <span className="font-mono text-[10px] tracking-[0.35em] uppercase font-bold text-ink-black">
              BYEPO TECHNOLOGIES
            </span>
            <span className="font-serif text-lg font-black uppercase tracking-wider text-ink-black animate-pulse">
              LOADING LEDGER EDITION...
            </span>
          </div>
        </div>
      </div>
    </TransitionContext.Provider>
  );
}
