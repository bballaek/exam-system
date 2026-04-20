"use client";

import { useEffect, useState } from "react";

interface LogoLoadingProps {
  text?: string;
  size?: "sm" | "md" | "lg";
  fullPage?: boolean;
}

const sizeConfig = {
  sm: { logo: 40, dotSize: 6, gap: 6, textSize: "text-xs" },
  md: { logo: 56, dotSize: 8, gap: 8, textSize: "text-sm" },
  lg: { logo: 72, dotSize: 10, gap: 10, textSize: "text-base" },
};

export default function LogoLoading({ text, size = "md", fullPage = false }: LogoLoadingProps) {
  const config = sizeConfig[size];
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const content = (
    <div
      className={`flex flex-col items-center justify-center gap-4 ${
        mounted ? "opacity-100" : "opacity-0"
      } transition-opacity duration-500`}
    >
      {/* Logo with pulse animation */}
      <div
        className="logo-loading-pulse"
        style={{ width: config.logo, height: config.logo }}
      >
        <img
          src="/favicon.svg"
          alt="MasterExam"
          className="w-full h-full"
          style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.08))" }}
        />
      </div>

      {/* Three bouncing dots */}
      <div className="flex items-center" style={{ gap: config.gap }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="logo-loading-dot rounded-full bg-gray-400"
            style={{
              width: config.dotSize,
              height: config.dotSize,
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>

      {/* Optional text */}
      {text && (
        <p className={`${config.textSize} text-gray-400 font-medium tracking-wide`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-20">
      {content}
    </div>
  );
}
