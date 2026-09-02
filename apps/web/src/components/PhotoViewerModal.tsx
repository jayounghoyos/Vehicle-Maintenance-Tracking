import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import type { PhotoItem } from '../lib/api';

type Props = {
  photos: PhotoItem[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
};

export function PhotoViewerModal({
  photos,
  initialIndex = 0,
  isOpen,
  onClose,
  title,
  subtitle,
}: Props) {
  if (!isOpen || photos.length === 0) return null;

  return (
    <PhotoViewerDialog
      photos={photos}
      initialIndex={initialIndex}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
    />
  );
}

function PhotoViewerDialog({
  photos,
  initialIndex,
  onClose,
  title,
  subtitle,
}: {
  photos: PhotoItem[];
  initialIndex: number;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && photos.length > 1) {
        setCurrentIndex((i) => (i > 0 ? i - 1 : photos.length - 1));
      }
      if (e.key === 'ArrowRight' && photos.length > 1) {
        setCurrentIndex((i) => (i < photos.length - 1 ? i + 1 : 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [photos.length, onClose]);

  const currentPhoto = photos[currentIndex] ?? photos[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/90 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative z-10 flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-panel shadow-2xl">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-white/5 bg-panel/95 px-5 py-3.5">
          <div>
            <h3 className="text-section font-semibold text-ink">
              {title ?? 'Service Photo'}
              {photos.length > 1 && (
                <span className="ml-2 text-body font-normal text-ink-muted">
                  ({currentIndex + 1} of {photos.length})
                </span>
              )}
            </h3>
            {subtitle && <p className="text-body text-ink-muted">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-white/10 hover:text-ink"
            aria-label="Close photo viewer"
          >
            <X className="size-5" />
          </button>
        </header>

        {/* Photo Display Area */}
        <div className="relative flex min-h-[300px] max-h-[70vh] items-center justify-center overflow-hidden bg-black/60 p-4">
          <img
            src={currentPhoto.url}
            alt={title ?? `Photo ${currentIndex + 1}`}
            className="max-h-[65vh] max-w-full rounded-lg object-contain shadow-lg"
          />

          {/* Prev/Next Navigation Buttons */}
          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={() =>
                  setCurrentIndex((i) => (i > 0 ? i - 1 : photos.length - 1))
                }
                className="absolute left-4 rounded-full bg-black/60 p-2.5 text-white/90 backdrop-blur-xs transition-all hover:bg-black/90 hover:text-white"
                aria-label="Previous photo"
              >
                <ChevronLeft className="size-6" />
              </button>

              <button
                type="button"
                onClick={() =>
                  setCurrentIndex((i) => (i < photos.length - 1 ? i + 1 : 0))
                }
                className="absolute right-4 rounded-full bg-black/60 p-2.5 text-white/90 backdrop-blur-xs transition-all hover:bg-black/90 hover:text-white"
                aria-label="Next photo"
              >
                <ChevronRight className="size-6" />
              </button>
            </>
          )}
        </div>

        {/* Footer Thumbnails if multiple */}
        {photos.length > 1 && (
          <footer className="flex items-center justify-center gap-2 overflow-x-auto border-t border-white/5 bg-panel/80 p-3">
            {photos.map((p, idx) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`size-12 overflow-hidden rounded-lg border-2 transition-all ${
                  idx === currentIndex
                    ? 'border-lime ring-2 ring-lime/30'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={p.url}
                  alt={`Thumbnail ${idx + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </footer>
        )}
      </div>
    </div>
  );
}
