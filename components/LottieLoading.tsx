"use client";

import Lottie from "lottie-react";
import loadingAnimation from "@/public/loading-animation.json";

interface LottieLoadingProps {
  size?: "sm" | "md" | "lg";
  text?: string;
}

const sizeMap = {
  sm: "w-16 h-16",
  md: "w-24 h-24",
  lg: "w-32 h-32",
};

export default function LottieLoading({ size = "md", text }: LottieLoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div className={sizeMap[size]}>
        <Lottie animationData={loadingAnimation} loop={true} />
      </div>
      {text && <p className="text-sm text-gray-500">{text}</p>}
    </div>
  );
}

// Full page loading overlay - now with logo
export function FullPageLoading({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm gap-4">
      <div className="logo-loading-pulse" style={{ width: 64, height: 64 }}>
        <img
          src="/logo-light.svg"
          alt="MasterExam"
          className="w-full h-full"
          style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.08))" }}
        />
      </div>
      <div className="flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="logo-loading-dot rounded-full bg-gray-400"
            style={{
              width: 8,
              height: 8,
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
      {text && <p className="text-sm text-gray-400 font-medium">{text}</p>}
    </div>
  );
}
