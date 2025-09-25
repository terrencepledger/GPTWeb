"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useRef, useState } from "react";

type EventImageProps = {
  /**
   * Additional classes applied to the clickable wrapper element.
   */
  containerClassName?: string;
  /**
   * Additional classes applied to the internal image wrapper div.
   * This should include sizing styles (e.g. height/width) when using `fill`.
   */
  wrapperClassName?: string;
  /**
   * Accessible label for the button that opens the lightbox. Defaults to a
   * string derived from the image alt text when not provided.
   */
  openButtonLabel?: string;
} & ImageProps;

export default function EventImage({
  containerClassName,
  wrapperClassName,
  className,
  openButtonLabel,
  alt,
  ...imageProps
}: EventImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isLightboxLoaded, setIsLightboxLoaded] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const triggerButtonRef = useRef<HTMLButtonElement | null>(null);
  const wasOpen = useRef(false);

  const derivedLabel = openButtonLabel || (alt ? `View larger image for ${alt}` : "View larger image");

  const handleLoad = () => {
    setIsLoaded(true);
  };

  useEffect(() => {
    if (isOpen) {
      setIsLightboxLoaded(false);
      const handleKeydown = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          setIsOpen(false);
        }
      };

      window.addEventListener("keydown", handleKeydown);
      const button = closeButtonRef.current;
      button?.focus({ preventScroll: true });
      wasOpen.current = true;

      return () => {
        window.removeEventListener("keydown", handleKeydown);
      };
    }

    if (wasOpen.current) {
      triggerButtonRef.current?.focus({ preventScroll: true });
      wasOpen.current = false;
    }

    return undefined;
  }, [isOpen]);

  return (
    <>
      <button
        ref={triggerButtonRef}
        type="button"
        onClick={() => setIsOpen(true)}
        className={`group relative block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-accent)] ${containerClassName ?? ""}`}
        aria-label={derivedLabel}
      >
        <div className={`relative ${wrapperClassName ?? ""}`}>
          <Image
            {...imageProps}
            alt={alt}
            className={`${className ?? ""} ${isLoaded ? "opacity-100" : "opacity-0"}`.trim()}
            onLoad={handleLoad}
            onLoadingComplete={handleLoad}
          />
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-[var(--brand-overlay-muted)]">
              <span
                className="h-10 w-10 animate-spin rounded-full border-2 border-[color:color-mix(in_oklab,var(--brand-fg)_75%,transparent)] border-t-transparent"
                role="status"
                aria-label="Loading image"
              />
            </div>
          )}
        </div>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-[color:color-mix(in_oklab,var(--brand-ink)_85%,transparent)] p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative flex h-full w-full max-h-[90vh] max-w-5xl flex-col"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex justify-end pb-2">
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded bg-[var(--brand-accent)] px-3 py-1 text-sm font-medium text-[var(--brand-ink)] transition hover:bg-[color:color-mix(in_oklab,var(--brand-accent)_85%,white_15%)]"
              >
                Close
              </button>
            </div>
            <div className="relative flex-1">
              <Image
                src={imageProps.src}
                alt={alt}
                fill
                className={`object-contain ${isLightboxLoaded ? "opacity-100" : "opacity-0"}`}
                sizes="100vw"
                onLoad={() => setIsLightboxLoaded(true)}
                onLoadingComplete={() => setIsLightboxLoaded(true)}
              />
              {!isLightboxLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className="h-12 w-12 animate-spin rounded-full border-2 border-[color:color-mix(in_oklab,var(--brand-fg)_75%,transparent)] border-t-transparent"
                    role="status"
                    aria-label="Loading image"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
