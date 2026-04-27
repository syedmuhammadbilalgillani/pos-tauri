"use client";

import { cn } from "@/lib/utils";
import Image, { type ImageProps } from "next/image";
import * as React from "react";

export type ImageWithFallbackProps = Omit<
  ImageProps,
  "src" | "alt" | "onError" | "onLoadingComplete"
> & {
  /** Remote URL, path, or `StaticImageData`; empty → fallback */
  src?: ImageProps["src"] | null | "";
  alt: ImageProps["alt"];

  /** Main label in the fallback panel */
  fallbackText: string;
  fallbackDescription?: string;

  className?: string;
  /** Applied to `<Image />` when shown */
  imageClassName?: string;
  /** Outer box (aspect / max size) */
  frameClassName?: string;
  fallbackClassName?: string;

  onError?: React.ReactEventHandler<HTMLImageElement>;
  /** Next/Image uses `onLoadingComplete` instead of `onLoad` */
  onLoadingComplete?: ImageProps["onLoadingComplete"];
};

function isUsableSrc(src: ImageWithFallbackProps["src"]): boolean {
  if (src == null) return false;
  if (typeof src === "string") return src.trim().length > 0;
  return true;
}

export const ImageWithFallback = React.forwardRef<
  HTMLImageElement,
  ImageWithFallbackProps
>(function ImageWithFallback(
  {
    src,
    alt,
    fallbackText,
    fallbackDescription,
    className,
    imageClassName,
    frameClassName,
    fallbackClassName,
    onError,
    onLoadingComplete,
    // pull layout props so we can default `fill` safely
    fill,
    width,
    height,
    sizes,
    className: _nextImageClassName,
    ...imageProps
  },
  ref,
) {
  const [failed, setFailed] = React.useState(false);
  const usable = isUsableSrc(src) && !failed;

  React.useEffect(() => {
    setFailed(false);
  }, [src]);

  const useFill = Boolean(fill) || (!width && !height);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md border bg-muted",
        className,
      )}
    >
      <div
        className={cn(
          "relative flex aspect-square w-full items-center justify-center bg-muted",
          frameClassName,
        )}
      >
        {usable ? (
          <Image
            ref={ref}
            src={src as NonNullable<ImageProps["src"]>}
            alt={alt}
            className={cn(
              useFill ? "object-cover" : "h-full w-full object-cover",
              imageClassName,
            )}
            fill={useFill ? true : undefined}
            width={useFill ? undefined : (width as number)}
            height={useFill ? undefined : (height as number)}
            sizes={useFill ? (sizes ?? "(max-width: 768px) 100vw, 240px") : sizes}
            onError={(e) => {
              setFailed(true);
              onError?.(e);
            }}
            onLoadingComplete={onLoadingComplete}
            {...imageProps}
          />
        ) : (
          <div
            className={cn(
              "flex h-full w-full flex-col items-center justify-center gap-1 px-3 text-center",
              fallbackClassName,
            )}
            role="img"
            aria-label={alt ? `${String(alt)} (unavailable)` : fallbackText}
          >
            <span className="line-clamp-2 text-sm font-medium text-foreground">
              {fallbackText}
            </span>
            {fallbackDescription ? (
              <span className="line-clamp-2 text-xs text-muted-foreground">
                {fallbackDescription}
              </span>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
});