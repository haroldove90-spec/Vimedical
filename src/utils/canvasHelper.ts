/**
 * Helper utility to trim empty/transparent space around an HTML5 Canvas drawing.
 * This is a 100% dependency-free, robust replacement for the broken transitive dependency
 * `trim-canvas` of the `react-signature-canvas` package.
 */
export function trimCanvas(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const width = canvas.width;
  const height = canvas.height;
  const pixels = ctx.getImageData(0, 0, width, height);
  const len = pixels.data.length;
  
  const bound = {
    top: height,
    left: width,
    right: 0,
    bottom: 0
  };

  let hasContent = false;

  for (let i = 0; i < len; i += 4) {
    // Check alpha channel > 0, indicating non-transparent pixel
    if (pixels.data[i + 3] > 0) {
      const idx = i / 4;
      const x = idx % width;
      const y = Math.floor(idx / width);

      if (x < bound.left) {
        bound.left = x;
      }
      if (y < bound.top) {
        bound.top = y;
      }
      if (x > bound.right) {
        bound.right = x;
      }
      if (y > bound.bottom) {
        bound.bottom = y;
      }
      hasContent = true;
    }
  }

  // If the canvas is completely blank, return the original canvas
  if (!hasContent || bound.left > bound.right || bound.top > bound.bottom) {
    return canvas;
  }

  const trimWidth = bound.right - bound.left + 1;
  const trimHeight = bound.bottom - bound.top + 1;
  
  const trimmed = document.createElement('canvas');
  trimmed.width = trimWidth;
  trimmed.height = trimHeight;
  
  const trimmedCtx = trimmed.getContext('2d');
  if (trimmedCtx) {
    try {
      trimmedCtx.putImageData(
        ctx.getImageData(bound.left, bound.top, trimWidth, trimHeight),
        0,
        0
      );
    } catch (e) {
      console.warn('Canvas putImageData failed, fallback to original canvas', e);
      return canvas;
    }
  }
  
  return trimmed;
}
