"use client";

import React from "react";

export type AtmosphericVariant = "landing" | "app" | "auth" | "portal";

interface AtmosphericBackgroundProps {
  variant?: AtmosphericVariant;
  className?: string;
}

/**
 * AtmosphericBackground — Global atmospheric visual system for ResolveX.
 *
 * Provides a consistent, premium SaaS canvas with soft off-white base tones,
 * heavily blurred ambient light zones (periwinkle/violet), and subtle tonal depth.
 *
 * Variants:
 * - 'landing': Expressive atmospheric glow behind hero headline & section transitions.
 * - 'app': Calm, minimal ambient light designed for high readability in data-heavy screens.
 * - 'auth': Centered aura framing login and signup forms.
 * - 'portal': Welcoming, soft ambient gradient for customer self-service intake.
 */
export function AtmosphericBackground({
  variant = "app",
  className = "",
}: AtmosphericBackgroundProps) {
  return (
    <div
      className={`fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none transition-opacity duration-700 ${className}`}
      aria-hidden="true"
    >
      {/* Base Canvas Tone: Light Pearl / Cool Slate */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#F2F5F9] via-[#EEF2F7] to-[#E9EFF6]" />

      {variant === "landing" && (
        <>
          {/* Hero primary ambient light field (Vibrant soft indigo & blue) */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[62rem] h-[40rem] bg-gradient-to-b from-[#6366F1]/30 via-[#3B82F6]/26 to-transparent rounded-full blur-[120px] will-change-transform" />

          {/* Hero bright core highlight behind headline */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[44rem] h-[26rem] bg-gradient-to-r from-[#818CF8]/32 via-[#7779D8]/35 to-[#60A5FA]/30 rounded-full blur-[100px] will-change-transform" />

          {/* Hero upper flanks: Blue top-left & periwinkle top-right */}
          <div className="absolute top-8 -left-[8%] w-[40rem] h-[34rem] bg-[#3B82F6]/25 rounded-full blur-[130px]" />
          <div className="absolute top-24 -right-[8%] w-[42rem] h-[34rem] bg-[#818CF8]/25 rounded-full blur-[130px]" />

          {/* Mid-page ambient fields (behind Customer Intake & Features) */}
          <div className="absolute top-[32%] -left-[10%] w-[50rem] h-[42rem] bg-[#5052C9]/24 rounded-full blur-[140px]" />
          <div className="absolute top-[44%] -right-[8%] w-[48rem] h-[40rem] bg-[#2563EB]/22 rounded-full blur-[140px]" />

          {/* Lower section ambient fields (behind Incident Narrative, Canvas & Analytics) */}
          <div className="absolute top-[64%] left-[2%] w-[48rem] h-[38rem] bg-[#7779D8]/24 rounded-full blur-[140px]" />
          <div className="absolute top-[78%] right-[0%] w-[52rem] h-[42rem] bg-[#3B82F6]/22 rounded-full blur-[150px]" />

          {/* Bottom gentle depth transition into #151827 Dark Midnight footer */}
          <div className="absolute bottom-0 inset-x-0 h-[24rem] bg-gradient-to-t from-[#151827]/25 to-transparent pointer-events-none" />
        </>
      )}

      {variant === "app" && (
        <>
          {/* Authenticated Application Pages: Calm, luminous glass diffusion */}
          {/* Top-right soft blue ambient aura */}
          <div className="absolute -top-12 right-[5%] w-[42rem] h-[30rem] bg-[#3B82F6]/16 rounded-full blur-[130px]" />

          {/* Central-left soft brand violet glow */}
          <div className="absolute top-[30%] -left-12 w-[38rem] h-[34rem] bg-[#5052C9]/14 rounded-full blur-[140px]" />

          {/* Central periwinkle diffuse light */}
          <div className="absolute top-[18%] left-[25%] w-[46rem] h-[30rem] bg-[#818CF8]/14 rounded-full blur-[130px]" />

          {/* Lower subtle blue anchor */}
          <div className="absolute bottom-[-5%] right-[20%] w-[44rem] h-[28rem] bg-[#2563EB]/12 rounded-full blur-[140px]" />
        </>
      )}

      {variant === "auth" && (
        <>
          {/* Authentication Pages (Login/Signup): Centered pearl aura framing forms */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[48rem] h-[42rem] bg-gradient-to-br from-[#6366F1]/25 via-[#3B82F6]/22 to-transparent rounded-full blur-[130px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[34rem] h-[30rem] bg-[#818CF8]/25 rounded-full blur-[100px]" />
          <div className="absolute top-[10%] right-[10%] w-[32rem] h-[28rem] bg-[#3B82F6]/18 rounded-full blur-[120px]" />
          <div className="absolute bottom-[10%] left-[10%] w-[36rem] h-[30rem] bg-[#7779D8]/18 rounded-full blur-[130px]" />
        </>
      )}

      {variant === "portal" && (
        <>
          {/* Customer Intake Support Portal: Welcoming, radiant pearl & violet depth */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[48rem] h-[32rem] bg-gradient-to-b from-[#6366F1]/24 via-[#3B82F6]/20 to-transparent rounded-full blur-[125px]" />
          <div className="absolute top-20 left-1/3 w-[38rem] h-[28rem] bg-[#818CF8]/22 rounded-full blur-[105px]" />
          <div className="absolute bottom-10 right-[10%] w-[36rem] h-[30rem] bg-[#5052C9]/16 rounded-full blur-[130px]" />
        </>
      )}
    </div>
  );
}
