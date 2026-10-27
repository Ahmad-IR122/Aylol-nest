"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProductImage({
  src,
  alt,
  placeholder,
  sizes = "(min-width: 1280px) 300px, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw",
  preload = false,
  fit = "cover",
  compact = false,
  className,
}: {
  src: string | null;
  alt: string;
  placeholder: string;
  sizes?: string;
  preload?: boolean;
  fit?: "cover" | "contain";
  compact?: boolean;
  className?: string;
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  let imageUrl: URL | null = null;
  try {
    imageUrl = src ? new URL(src) : null;
  } catch {
    // Missing or malformed legacy images use the same accessible fallback.
  }
  if (
    !imageUrl ||
    imageUrl.protocol !== "https:" ||
    imageUrl.username ||
    imageUrl.password ||
    !src ||
    failedSource === src
  ) {
    return (
      <div
        role="img"
        aria-label={`${alt} — ${placeholder}`}
        className="flex h-full flex-col items-center justify-center gap-4 p-3 text-center text-[#8A7B6B] dark:text-[#C9B8A4]"
      >
        <ImageOff className={compact ? "size-5" : "size-10"} aria-hidden="true" />
        {!compact && (
          <span className="text-xs" aria-hidden="true">
            {placeholder}
          </span>
        )}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      preload={preload}
      // Legacy HTTPS images are supported without opening the image optimizer
      // to arbitrary hosts. Cloudinary uploads use Next's responsive optimizer.
      unoptimized={imageUrl.origin !== "https://res.cloudinary.com"}
      onError={() => setFailedSource(src)}
      className={cn(
        fit === "contain"
          ? "object-contain"
          : "object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none",
        className,
      )}
    />
  );
}
