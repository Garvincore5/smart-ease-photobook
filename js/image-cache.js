/**
 * SmartAlbums High-Performance Image Pipeline & Fast Cache
 * Handles:
 * - Ultra-fast non-blocking thumbnail and preview proxy generation
 * - Memory-efficient caching for instant 60+ FPS canvas rendering
 * - Preserves original full-resolution files for 300 DPI pro print exports
 */

// --- Global Smart Ease Backend API Connector (Supports Chrome, Edge, and Desktop) ---
(function() {
  let detectedApiBase = null;

  window.getApiBaseUrl = function() {
    if (window.__API_BASE__) return window.__API_BASE__;
    if (detectedApiBase) return detectedApiBase;
    if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
      return window.location.origin;
    }
    // When opened in Chrome or Edge via file:///, point to default desktop backend server port 8765
    return 'http://127.0.0.1:8765';
  };

  window.getApiUrl = function(endpoint) {
    if (!endpoint) return '';
    if (typeof endpoint !== 'string') return endpoint;
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://') || endpoint.startsWith('blob:') || endpoint.startsWith('data:')) {
      return endpoint;
    }
    const base = window.getApiBaseUrl();
    const clean = endpoint.startsWith('/') ? endpoint : ('/' + endpoint);
    return base + clean;
  };

  // Auto-probe local desktop backend ports when running on file:///
  if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
    const probePorts = [8765, 8000, 5000, 8080];
    for (const port of probePorts) {
      fetch(`http://127.0.0.1:${port}/api/list_drives`, { method: 'GET', mode: 'cors' })
        .then(res => {
          if (res.ok) {
            detectedApiBase = `http://127.0.0.1:${port}`;
            window.__API_BASE__ = detectedApiBase;
            console.log('[SmartEase] Connected to local desktop backend at:', detectedApiBase);
          }
        })
        .catch(() => {});
    }
  }
})();

class FastImagePipeline {
  constructor() {
    this.cache = new Map(); // id -> { data, displayImg, originalImg, thumbReady }
    this.thumbnailQueue = [];
    this.isProcessingQueue = false;
    this.sharedCanvas = null;
    this.sharedCtx = null;
  }

  _getCanvas() {
    if (!this.sharedCanvas) {
      this.sharedCanvas = document.createElement('canvas');
      this.sharedCtx = this.sharedCanvas.getContext('2d', { alpha: false });
    }
    return { canvas: this.sharedCanvas, ctx: this.sharedCtx };
  }

  /**
   * Process a photo file or URL into high-speed display proxies.
   */
  async processPhoto(source, id, name = 'Photo') {
    return new Promise((resolve) => {
      let isResolved = false;
      const safeResolve = (data) => {
        if (isResolved) return;
        isResolved = true;
        clearTimeout(timer);
        resolve(data);
      };

      const timer = setTimeout(() => {
        safeResolve({
          id: id,
          name: name,
          src: srcUrl,
          thumbSrc: srcUrl,
          originalSrc: srcUrl,
          originalFile: (source instanceof File || source instanceof Blob) ? source : null,
          width: 1200,
          height: 800,
          aspect: 1.5,
          usageCount: 0
        });
      }, 2500);

      let srcUrl = '';
      if (typeof source === 'string') {
        srcUrl = source;
      } else if (source instanceof Blob || source instanceof File) {
        srcUrl = URL.createObjectURL(source);
      } else {
        srcUrl = String(source);
      }

      const img = new Image();
      if (srcUrl.startsWith('http')) {
        img.crossOrigin = 'anonymous';
      }

      img.onload = () => {
        const naturalWidth = img.naturalWidth || 1200;
        const naturalHeight = img.naturalHeight || 800;
        const aspect = Number((naturalWidth / naturalHeight).toFixed(3)) || 1.5;

        // Fast low-res thumbnail generation
        let thumbSrc = srcUrl;
        try {
          thumbSrc = this._createFastThumbnail(img, 200);
        } catch (e) {
          thumbSrc = srcUrl;
        }

        const photoData = {
          id: id,
          name: name,
          src: srcUrl,
          thumbSrc: thumbSrc,
          originalSrc: srcUrl,
          originalFile: (source instanceof File || source instanceof Blob) ? source : null,
          width: naturalWidth,
          height: naturalHeight,
          aspect: aspect,
          usageCount: 0
        };

        this.cache.set(id, {
          data: photoData,
          displayImg: img,
          originalImg: img,
          thumbReady: true
        });

        safeResolve(photoData);
      };

      img.onerror = () => {
        const fallback = this._createFallbackCard(name);
        safeResolve(fallback);
      };

      img.src = srcUrl;
    });
  }

  /**
   * Fast offscreen canvas downsampling
   */
  _createFastThumbnail(img, maxDim = 200) {
    try {
      const w = img.naturalWidth || 1200;
      const h = img.naturalHeight || 800;
      let targetW = w;
      let targetH = h;

      if (w > h) {
        if (w > maxDim) {
          targetW = maxDim;
          targetH = Math.round((h * maxDim) / w);
        }
      } else {
        if (h > maxDim) {
          targetH = maxDim;
          targetW = Math.round((w * maxDim) / h);
        }
      }

      const { canvas, ctx } = this._getCanvas();
      canvas.width = targetW;
      canvas.height = targetH;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'medium';
      ctx.drawImage(img, 0, 0, targetW, targetH);

      return canvas.toDataURL('image/jpeg', 0.72);
    } catch (err) {
      return img.src;
    }
  }

  /**
   * Queue background thumbnail generation to avoid blocking UI on massive 200+ photo imports
   */
  queueThumbnail(photo, onGenerated) {
    this.thumbnailQueue.push({ photo, onGenerated });
    if (!this.isProcessingQueue) {
      this._processNextInQueue();
    }
  }

  _processNextInQueue() {
    if (this.thumbnailQueue.length === 0) {
      this.isProcessingQueue = false;
      return;
    }
    this.isProcessingQueue = true;
    const item = this.thumbnailQueue.shift();

    const doWork = () => {
      const img = new Image();
      img.onload = () => {
        try {
          const thumb = this._createFastThumbnail(img, 200);
          item.photo.thumbSrc = thumb;
          if (item.onGenerated) item.onGenerated(item.photo, thumb);
        } catch (e) {}
        setTimeout(() => this._processNextInQueue(), 6);
      };
      img.onerror = () => {
        setTimeout(() => this._processNextInQueue(), 6);
      };
      img.src = item.photo.src;
    };

    if (window.requestIdleCallback) {
      window.requestIdleCallback(doWork, { timeout: 50 });
    } else {
      setTimeout(doWork, 4);
    }
  }

  _createFallbackCard(title) {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 600, 400);
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title || 'Photo', 300, 200);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    return {
      id: 'photo-' + Date.now(),
      name: title,
      src: dataUrl,
      thumbSrc: dataUrl,
      originalSrc: dataUrl,
      width: 600,
      height: 400,
      aspect: 1.5,
      usageCount: 0
    };
  }

  getDisplayImage(photoId, fallbackSrc) {
    const cached = this.cache.get(photoId);
    if (cached?.displayImg && cached.displayImg.complete && cached.displayImg.naturalWidth > 0) {
      return cached.displayImg;
    }
    if (fallbackSrc) {
      const newImg = new Image();
      newImg.src = fallbackSrc;
      this.cache.set(photoId, {
        data: null,
        displayImg: newImg,
        originalImg: newImg,
        thumbReady: false
      });
      return newImg;
    }
    return null;
  }
}

// Global pipeline singleton
window.FastImagePipeline = FastImagePipeline;
