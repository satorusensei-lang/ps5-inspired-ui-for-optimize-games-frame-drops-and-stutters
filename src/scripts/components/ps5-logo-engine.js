/* ==========================================================================
   PS5LogoEngine — Universal Game Logo Normalization Engine
   - 100% automated optical logo normalization for EVERY game in the library
   - Detects real visible bounding box (alpha threshold > 14) using offscreen canvas
   - Automatically eliminates excessive transparent margins & padding (>8%)
   - Preserves 1:1 original logo aspect ratio without distortion or stretching
   - Enforces authentic PS5 optical sizing across 4 distinct aspect tiers:
     1. Ultra-wide banner (aspect >= 3.8): maxHeight ~72px, maxWidth ~460px
     2. Wide cinematic (2.2 <= aspect < 3.8): maxHeight ~88px, maxWidth ~420px
     3. Standard horizontal (1.4 <= aspect < 2.2): maxHeight ~94px, maxWidth ~360px
     4. Compact / square (aspect < 1.4): maxHeight ~102px, maxWidth ~220px
   - Anchors firmly at bottom-left in the PS5 brand slot above play actions
   - In-memory bounds caching for instant 0ms switching
   - High-resolution rendering with smooth hardware-accelerated transitions
   ========================================================================== */

const boundsCache = new Map();
const croppedUrlCache = new Map();

/**
 * Detects the actual non-transparent visible bounds of an image.
 * Samples using a fast offscreen canvas (alpha threshold > 14).
 */
export function detectVisibleBounds(img) {
  if (!img) return null;
  const srcKey = img.src || img.currentSrc;
  if (!srcKey) return null;

  if (boundsCache.has(srcKey)) {
    return boundsCache.get(srcKey);
  }

  const nw = img.naturalWidth;
  const nh = img.naturalHeight;
  if (!nw || !nh) {
    return null;
  }

  // Fast-path: SVG logos generally have vector viewbox or clean geometry
  if (srcKey.endsWith('.svg') || srcKey.startsWith('data:image/svg+xml')) {
    const res = {
      minX: 0,
      minY: 0,
      maxX: nw,
      maxY: nh,
      visibleWidth: nw,
      visibleHeight: nh,
      aspect: nw / nh,
      paddingRatioX: 1,
      paddingRatioY: 1,
      isClean: true
    };
    boundsCache.set(srcKey, res);
    return res;
  }

  try {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    const maxSample = 400;
    const ratio = Math.min(1, maxSample / Math.max(nw, nh));
    const sw = Math.max(1, Math.round(nw * ratio));
    const sh = Math.max(1, Math.round(nh * ratio));
    canvas.width = sw;
    canvas.height = sh;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    ctx.drawImage(img, 0, 0, sw, sh);
    const imgData = ctx.getImageData(0, 0, sw, sh);
    const data = imgData.data;

    let minX = sw, minY = sh, maxX = 0, maxY = 0;
    let nonTransparentCount = 0;

    for (let y = 0; y < sh; y++) {
      const rowOffset = y * sw * 4;
      for (let x = 0; x < sw; x++) {
        const alpha = data[rowOffset + x * 4 + 3];
        if (alpha > 14) {
          nonTransparentCount++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (nonTransparentCount === 0) {
      const fallback = {
        minX: 0,
        minY: 0,
        maxX: nw,
        maxY: nh,
        visibleWidth: nw,
        visibleHeight: nh,
        aspect: nw / nh,
        paddingRatioX: 1,
        paddingRatioY: 1,
        isClean: true
      };
      boundsCache.set(srcKey, fallback);
      return fallback;
    }

    const visibleWidth = Math.max(1, maxX - minX + 1);
    const visibleHeight = Math.max(1, maxY - minY + 1);
    const paddingRatioX = visibleWidth / sw;
    const paddingRatioY = visibleHeight / sh;

    const result = {
      minX: Math.round(minX / ratio),
      minY: Math.round(minY / ratio),
      maxX: Math.round(maxX / ratio),
      maxY: Math.round(maxY / ratio),
      visibleWidth: Math.round(visibleWidth / ratio),
      visibleHeight: Math.round(visibleHeight / ratio),
      aspect: visibleWidth / visibleHeight,
      paddingRatioX,
      paddingRatioY,
      isClean: paddingRatioX >= 0.90 && paddingRatioY >= 0.90
    };

    boundsCache.set(srcKey, result);
    return result;
  } catch (err) {
    // If CORS or tainted canvas prevents reading, gracefully fallback to natural dimensions
    const fallback = {
      minX: 0,
      minY: 0,
      maxX: nw,
      maxY: nh,
      visibleWidth: nw,
      visibleHeight: nw > 0 && nh > 0 ? nh : 1,
      aspect: nw > 0 && nh > 0 ? nw / nh : 2.5,
      paddingRatioX: 1,
      paddingRatioY: 1,
      isClean: true
    };
    boundsCache.set(srcKey, fallback);
    return fallback;
  }
}

/**
 * Generates a tightly-cropped DataURL of the visible logo area if excess padding is found.
 */
export function getCroppedLogoUrl(img, bounds) {
  if (!img || !bounds || bounds.isClean) {
    return img?.src || '';
  }
  const srcKey = img.src || img.currentSrc;
  if (!srcKey || srcKey.startsWith('data:image/svg')) {
    return srcKey;
  }
  if (croppedUrlCache.has(srcKey)) {
    return croppedUrlCache.get(srcKey);
  }

  try {
    if (typeof document === 'undefined') return srcKey;
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = bounds.visibleWidth;
    cropCanvas.height = bounds.visibleHeight;
    const ctx = cropCanvas.getContext('2d');
    if (!ctx) return srcKey;

    ctx.drawImage(
      img,
      bounds.minX, bounds.minY, bounds.visibleWidth, bounds.visibleHeight,
      0, 0, bounds.visibleWidth, bounds.visibleHeight
    );

    const croppedDataUrl = cropCanvas.toDataURL('image/png');
    croppedUrlCache.set(srcKey, croppedDataUrl);
    return croppedDataUrl;
  } catch (err) {
    return srcKey;
  }
}

/**
 * Calculates authentic PS5 optical dimensions for any aspect ratio.
 */
export function getOpticalDimensions(aspect, viewportHeight = 1080) {
  const vh = viewportHeight || (typeof window !== 'undefined' ? window.innerHeight : 1080);
  const scale = vh < 740 ? 0.80 : vh < 900 ? 0.90 : 1.0;

  let maxHeight, maxWidth;

  if (aspect >= 3.8) {
    // Ultra-wide banner logos (e.g. wide text banners)
    maxHeight = Math.round(72 * scale);
    maxWidth = Math.round(460 * scale);
  } else if (aspect >= 2.2) {
    // Wide cinematic logos (e.g. Spider-Man 2, Ghost of Tsushima, Horizon)
    maxHeight = Math.round(88 * scale);
    maxWidth = Math.round(420 * scale);
  } else if (aspect >= 1.4) {
    // Standard horizontal logos (e.g. Tekken 8, RE4, God of War)
    maxHeight = Math.round(94 * scale);
    maxWidth = Math.round(360 * scale);
  } else {
    // Square or compact/portrait emblems (e.g. crests or stacked text)
    maxHeight = Math.round(102 * scale);
    maxWidth = Math.round(220 * scale);
  }

  return {
    maxHeight: `${maxHeight}px`,
    maxWidth: `${maxWidth}px`,
    scale
  };
}

/**
 * Centralized universal normalization function.
 * Called automatically whenever any game logo loads or the window resizes.
 */
export function normalizeGameLogo(logoEl, img, options = {}) {
  if (!logoEl) return null;

  const targetImg = img || logoEl;
  if (!targetImg || !targetImg.naturalWidth || !targetImg.naturalHeight) {
    const fallbackDim = getOpticalDimensions(2.5);
    logoEl.style.maxHeight = fallbackDim.maxHeight;
    logoEl.style.maxWidth = fallbackDim.maxWidth;
    logoEl.style.width = 'auto';
    logoEl.style.height = 'auto';
    logoEl.style.objectFit = 'contain';
    logoEl.style.objectPosition = 'left bottom';
    return fallbackDim;
  }

  // 1. Detect actual visible bounds (excluding transparent padding)
  const bounds = detectVisibleBounds(targetImg);
  const aspect = bounds ? bounds.aspect : (targetImg.naturalWidth / targetImg.naturalHeight);

  // 2. If the image has >10% transparent padding and is not yet cropped, crop it for tight optical rendering
  if (bounds && !bounds.isClean && options.autoCrop !== false) {
    const croppedUrl = getCroppedLogoUrl(targetImg, bounds);
    if (croppedUrl && croppedUrl !== logoEl.src && !logoEl.dataset.isCropped) {
      logoEl.dataset.isCropped = '1';
      logoEl.src = croppedUrl;
    }
  }

  // 3. Compute authentic optical dimensions
  const dims = getOpticalDimensions(aspect, options.viewportHeight);

  // 4. Apply clean styles to container & element
  logoEl.style.maxHeight = dims.maxHeight;
  logoEl.style.maxWidth = dims.maxWidth;
  logoEl.style.width = 'auto';
  logoEl.style.height = 'auto';
  logoEl.style.objectFit = 'contain';
  logoEl.style.objectPosition = 'left bottom';
  logoEl.style.filter = 'drop-shadow(0 6px 20px rgba(0, 0, 0, 0.75))';

  return {
    bounds,
    aspect,
    dimensions: dims
  };
}

export const PS5LogoEngine = {
  detectVisibleBounds,
  getCroppedLogoUrl,
  getOpticalDimensions,
  normalizeGameLogo
};
