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

// Full page loading overlay
export function FullPageLoading({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <LottieLoading size="lg" text={text} />
    </div>
  );
}
