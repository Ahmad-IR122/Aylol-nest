"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";

export default function ProductImage({
  src,
  alt,
  placeholder,
}: {
  src: string | null;
  alt: string;
  placeholder: string;
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  if (!src || failedSource === src) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-4 text-center text-[#8A7B6B] dark:text-[#C9B8A4]">
        <ImageOff className="size-10" aria-hidden="true" />
        <span className="text-xs">{placeholder}</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(min-width: 1280px) 300px, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
      // Legacy HTTPS images are supported without opening the image optimizer
      // to arbitrary hosts. Cloudinary uploads use Next's responsive optimizer.
      unoptimized={new URL(src).origin !== "https://res.cloudinary.com"}
      onError={() => setFailedSource(src)}
      className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none"
    />
  );
}
