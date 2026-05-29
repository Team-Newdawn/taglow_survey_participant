import { useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, RefObject } from 'react';

type StickerHintStyle = CSSProperties & {
  '--image-tag-hint-start-x'?: string;
  '--image-tag-hint-start-y'?: string;
  '--image-tag-hint-end-x'?: string;
  '--image-tag-hint-end-y'?: string;
};

export function useStickerHintMotion<TImage extends HTMLElement, TSource extends HTMLElement>(
  active: boolean,
  imageRef: RefObject<TImage | null>,
  sourceRef: RefObject<TSource | null>,
): { rootRef: RefObject<HTMLDivElement | null>; hintStyle: StickerHintStyle } {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [hintStyle, setHintStyle] = useState<StickerHintStyle>({});

  useLayoutEffect(() => {
    if (!active) {
      setHintStyle({});
      return undefined;
    }

    const updateHintPath = () => {
      const root = rootRef.current;
      const image = imageRef.current;
      const source = sourceRef.current;

      if (!root || !image || !source) {
        return;
      }

      const rootRect = root.getBoundingClientRect();
      const imageRect = image.getBoundingClientRect();
      const sourceRect = source.getBoundingClientRect();
      const sourceCenter = getRelativeCenter(sourceRect, rootRect);

      setHintStyle({
        '--image-tag-hint-start-x': `${sourceCenter.x}px`,
        '--image-tag-hint-start-y': `${sourceCenter.y}px`,
        '--image-tag-hint-end-x': `${imageRect.left - rootRect.left + imageRect.width * 0.5}px`,
        '--image-tag-hint-end-y': `${imageRect.top - rootRect.top + imageRect.height * 0.5}px`,
      });
    };

    updateHintPath();

    const ResizeObserverConstructor = globalThis.ResizeObserver;
    const observer = ResizeObserverConstructor ? new ResizeObserverConstructor(updateHintPath) : null;
    const root = rootRef.current;
    const image = imageRef.current;
    const source = sourceRef.current;

    if (observer) {
      [root, image, source].forEach((element) => {
        if (element) {
          observer.observe(element);
        }
      });
    }

    globalThis.addEventListener?.('resize', updateHintPath);

    return () => {
      observer?.disconnect();
      globalThis.removeEventListener?.('resize', updateHintPath);
    };
  }, [active, imageRef, sourceRef]);

  return { rootRef, hintStyle };
}

function getRelativeCenter(elementRect: DOMRect, rootRect: DOMRect): { x: number; y: number } {
  return {
    x: elementRect.left - rootRect.left + elementRect.width * 0.5,
    y: elementRect.top - rootRect.top + elementRect.height * 0.5,
  };
}
