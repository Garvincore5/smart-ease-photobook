/**
 * SmartAlbums State Management & Photobook Model
 * Manages album settings, spreads, photo library, history (Undo/Redo),
 * and automatic album generation heuristics.
 */

class AlbumState {
  constructor(layoutEngine) {
    this.layoutEngine = layoutEngine || new LayoutEngine();

    // Standard photo sizes (Single Page size; in Spread mode, sheet is double the width)
    this.sizePresets = [
      // Standard Paper & Album Sizes from Chart
      { id: '12x16', name: '12 × 16" A3 (Landscape Spread: 32 × 12" • Portrait Spread: 24 × 16")', pageW: 12, pageH: 16, category: 'Standard' },
      { id: '8x12', name: '8 × 12" A4 (Landscape Spread: 24 × 8" • Portrait Spread: 16 × 12")', pageW: 8, pageH: 12, category: 'Standard' },
      { id: '6x8', name: '6 × 8" A5 (Landscape Spread: 16 × 6" • Portrait Spread: 12 × 8")', pageW: 6, pageH: 8, category: 'Standard' },
      { id: '4x6', name: '4 × 6" A6 (Landscape Spread: 12 × 4" • Portrait Spread: 8 × 6")', pageW: 4, pageH: 6, category: 'Standard' },
      { id: '5x7', name: '5 × 7" (Landscape Spread: 14 × 5" • Portrait Spread: 10 × 7")', pageW: 5, pageH: 7, category: 'Standard' },
      { id: '8x10', name: '8 × 10" Standard (Landscape Spread: 20 × 8" • Portrait Spread: 16 × 10")', pageW: 8, pageH: 10, category: 'Standard' },
      { id: '10x12', name: '10 × 12" (Landscape Spread: 24 × 10" • Portrait Spread: 20 × 12")', pageW: 10, pageH: 12, category: 'Standard' },
      { id: '10x15', name: '10 × 15" (Landscape Spread: 30 × 10" • Portrait Spread: 20 × 15")', pageW: 10, pageH: 15, category: 'Standard' },
      { id: '11x14', name: '11 × 14" Luxury (Landscape Spread: 28 × 11" • Portrait Spread: 22 × 14")', pageW: 11, pageH: 14, category: 'Standard' },
      { id: '12x18', name: '12 × 18" (Landscape Spread: 36 × 12" • Portrait Spread: 24 × 18")', pageW: 12, pageH: 18, category: 'Standard' },

      // Square Album Formats
      { id: '12x12', name: '12 × 12" Square (Spread: 24 × 12")', pageW: 12, pageH: 12, category: 'Square' },
      { id: '10x10', name: '10 × 10" Square (Spread: 20 × 10")', pageW: 10, pageH: 10, category: 'Square' },
      { id: '8x8', name: '8 × 8" Square (Spread: 16 × 8")', pageW: 8, pageH: 8, category: 'Square' },

      // Large Format & Poster Sizes from Chart
      { id: '16x20', name: '16 × 20" A2 (Landscape Spread: 40 × 16" • Portrait Spread: 32 × 20")', pageW: 16, pageH: 20, category: 'Large' },
      { id: '16x24', name: '16 × 24" (Landscape Spread: 48 × 16" • Portrait Spread: 32 × 24")', pageW: 16, pageH: 24, category: 'Large' },
      { id: '20x24', name: '20 × 24" A1 (Landscape Spread: 48 × 20" • Portrait Spread: 40 × 24")', pageW: 20, pageH: 24, category: 'Large' },
      { id: '20x30', name: '20 × 30" (Landscape Spread: 60 × 20" • Portrait Spread: 40 × 30")', pageW: 20, pageH: 30, category: 'Large' },
      { id: '24x36', name: '24 × 36" (Landscape Spread: 72 × 24" • Portrait Spread: 48 × 36")', pageW: 24, pageH: 36, category: 'Large' }
    ];

    this.imagePipeline = typeof FastImagePipeline !== 'undefined' ? new FastImagePipeline() : null;

    this.project = {
      id: 'album-' + Date.now(),
      title: 'Smart Ease Album',
      selectedSize: this.sizePresets[0],
      pageMode: 'spread',       // 'spread' (Double Size Sheet) or 'single' (Single Size Page)
      orientation: 'landscape', // 'landscape' (Wide format) or 'portrait' (Tall format)
      marginPercent: 2.0,       // outer margin padding % (sleek, modern flush mount)
      middleMarginPercent: 0.0, // flush mount layflat albums have 0 middle gutter gap!
      gapPx: 8,                 // sleek 8px spacing between adjacent images
      safeZonePercent: 3.0,     // print cutting / safety buffer %
      fullBleed: false,         // stretch images to spread edge
      backgroundColor: '#ffffff', // #ffffff, #111111, #fcf9f2 (linen)
      photoOrderMode: 'sequential', // 'sequential' (Strict chronological order: 1->1, 2->2) or 'aspect_match'
      spreads: [],
      photos: []
    };

    this.activeSpreadIndex = 0;
    this.listeners = [];
    this.undoStack = [];
    this.redoStack = [];
    this.isDirty = false;

    // Initialize with 1 default spread
    this.addSpread();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  on(event, handler) {
    return this.subscribe((type, detail) => {
      if (type === event) handler(detail);
    });
  }

  notify(changeType = 'update', detail = null) {
    this.listeners.forEach(fn => fn(changeType, detail, this));
  }

  recordSnapshot() {
    this.isDirty = true;
    try {
      const snap = {
        title: this.project.title,
        version: this.project.version,
        selectedSize: this.project.selectedSize,
        pageMode: this.project.pageMode,
        orientation: this.project.orientation,
        marginPercent: this.project.marginPercent,
        middleMarginPercent: this.project.middleMarginPercent,
        gapPx: this.project.gapPx,
        safeZonePercent: this.project.safeZonePercent,
        fullBleed: this.project.fullBleed,
        backgroundColor: this.project.backgroundColor,
        activeSpreadIndex: this.activeSpreadIndex,
        spreads: this.project.spreads,
        photoMeta: (this.project.photos || []).map(p => ({
          id: p.id,
          name: p.name,
          fileName: p.fileName,
          filePath: p.filePath,
          usageCount: p.usageCount
        }))
      };
      this.undoStack.push(JSON.stringify(snap));
      if (this.undoStack.length > 30) this.undoStack.shift();
      this.redoStack = [];
    } catch (e) {
      console.warn('Snapshot record error:', e);
    }
  }

  undo() {
    if (this.undoStack.length === 0) return false;
    try {
      const currentSnap = {
        title: this.project.title,
        version: this.project.version,
        selectedSize: this.project.selectedSize,
        pageMode: this.project.pageMode,
        orientation: this.project.orientation,
        marginPercent: this.project.marginPercent,
        middleMarginPercent: this.project.middleMarginPercent,
        gapPx: this.project.gapPx,
        safeZonePercent: this.project.safeZonePercent,
        fullBleed: this.project.fullBleed,
        backgroundColor: this.project.backgroundColor,
        activeSpreadIndex: this.activeSpreadIndex,
        spreads: this.project.spreads,
        photoMeta: (this.project.photos || []).map(p => ({
          id: p.id,
          name: p.name,
          fileName: p.fileName,
          filePath: p.filePath,
          usageCount: p.usageCount
        }))
      };
      this.redoStack.push(JSON.stringify(currentSnap));
      const previous = JSON.parse(this.undoStack.pop());
      if (previous.spreads) this.project.spreads = previous.spreads;
      if (previous.selectedSize) this.project.selectedSize = previous.selectedSize;
      if (previous.pageMode) this.project.pageMode = previous.pageMode;
      if (previous.orientation) this.project.orientation = previous.orientation;
      if (previous.marginPercent !== undefined) this.project.marginPercent = previous.marginPercent;
      if (previous.middleMarginPercent !== undefined) this.project.middleMarginPercent = previous.middleMarginPercent;
      if (previous.gapPx !== undefined) this.project.gapPx = previous.gapPx;
      if (previous.safeZonePercent !== undefined) this.project.safeZonePercent = previous.safeZonePercent;
      if (previous.fullBleed !== undefined) this.project.fullBleed = previous.fullBleed;
      if (previous.backgroundColor) this.project.backgroundColor = previous.backgroundColor;
      if (typeof previous.activeSpreadIndex === 'number') this.activeSpreadIndex = previous.activeSpreadIndex;
      this._recomputeUsageCounts();
      this.notify('undo');
      return true;
    } catch (e) {
      console.error('Undo error:', e);
      return false;
    }
  }

  redo() {
    if (this.redoStack.length === 0) return false;
    try {
      const currentSnap = {
        title: this.project.title,
        version: this.project.version,
        selectedSize: this.project.selectedSize,
        pageMode: this.project.pageMode,
        orientation: this.project.orientation,
        marginPercent: this.project.marginPercent,
        middleMarginPercent: this.project.middleMarginPercent,
        gapPx: this.project.gapPx,
        safeZonePercent: this.project.safeZonePercent,
        fullBleed: this.project.fullBleed,
        backgroundColor: this.project.backgroundColor,
        activeSpreadIndex: this.activeSpreadIndex,
        spreads: this.project.spreads,
        photoMeta: (this.project.photos || []).map(p => ({
          id: p.id,
          name: p.name,
          fileName: p.fileName,
          filePath: p.filePath,
          usageCount: p.usageCount
        }))
      };
      this.undoStack.push(JSON.stringify(currentSnap));
      const next = JSON.parse(this.redoStack.pop());
      if (next.spreads) this.project.spreads = next.spreads;
      if (next.selectedSize) this.project.selectedSize = next.selectedSize;
      if (next.pageMode) this.project.pageMode = next.pageMode;
      if (next.orientation) this.project.orientation = next.orientation;
      if (next.marginPercent !== undefined) this.project.marginPercent = next.marginPercent;
      if (next.middleMarginPercent !== undefined) this.project.middleMarginPercent = next.middleMarginPercent;
      if (next.gapPx !== undefined) this.project.gapPx = next.gapPx;
      if (next.safeZonePercent !== undefined) this.project.safeZonePercent = next.safeZonePercent;
      if (next.fullBleed !== undefined) this.project.fullBleed = next.fullBleed;
      if (next.backgroundColor) this.project.backgroundColor = next.backgroundColor;
      if (typeof next.activeSpreadIndex === 'number') this.activeSpreadIndex = next.activeSpreadIndex;
      this._recomputeUsageCounts();
      this.notify('redo');
      return true;
    } catch (e) {
      console.error('Redo error:', e);
      return false;
    }
  }

  // --- Photo Pool Management ---

  addPhoto(photoObj) {
    if (!photoObj.id) photoObj.id = 'photo-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
    if (!photoObj.aspect && photoObj.width && photoObj.height) {
      photoObj.aspect = Number((photoObj.width / photoObj.height).toFixed(3));
    }
    photoObj.usageCount = photoObj.usageCount || 0;
    this.project.photos.push(photoObj);
    this.notify('photo-added', photoObj);
    return photoObj;
  }

  addPhotos(photosArray) {
    this.recordSnapshot();
    const added = photosArray.map(p => {
      if (!p.id) p.id = 'photo-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
      if (!p.aspect && p.width && p.height) {
        p.aspect = Number((p.width / p.height).toFixed(3));
      }
      p.usageCount = p.usageCount || 0;
      return p;
    });
    this.project.photos.push(...added);
    this.notify('photos-batch-added', added);
  }

  removePhoto(photoId) {
    this.removePhotos([photoId]);
  }

  removePhotos(photoIdsArray) {
    if (!Array.isArray(photoIdsArray) || photoIdsArray.length === 0) return;
    this.recordSnapshot();
    const idSet = new Set(photoIdsArray);
    this.project.photos = this.project.photos.filter(p => !idSet.has(p.id));
    
    // Remove from all spreads
    let spreadsModified = 0;
    this.project.spreads.forEach(spread => {
      const originalLen = spread.photoIds.length;
      spread.photoIds = spread.photoIds.filter(id => !idSet.has(id));
      spread.slots = (spread.slots || []).filter(s => !idSet.has(s.photoId));
      if (spread.photoIds.length !== originalLen) {
        this._updateSpreadLayout(spread);
        spreadsModified++;
      }
    });

    this._recomputeUsageCounts();
    this.notify('photos-batch-removed', { photoIds: photoIdsArray, spreadsModified });
  }

  reorderPhoto(fromIdx, toIdx) {
    if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0 || fromIdx >= this.project.photos.length || toIdx >= this.project.photos.length) return;
    this.recordSnapshot();
    const [moved] = this.project.photos.splice(fromIdx, 1);
    this.project.photos.splice(toIdx, 0, moved);
    this.notify('photos-reordered', { fromIdx, toIdx });
  }

  sortPhotos(sortType = 'name_asc') {
    this.recordSnapshot();
    if (sortType === 'name_asc') {
      this.project.photos.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { numeric: true }));
    } else if (sortType === 'name_desc') {
      this.project.photos.sort((a, b) => (b.name || '').localeCompare(a.name || '', undefined, { numeric: true }));
    } else if (sortType === 'aspect') {
      this.project.photos.sort((a, b) => (a.aspect || 1) - (b.aspect || 1));
    }
    this.notify('photos-reordered', { sortType });
  }

  setPhotoOrderMode(mode) {
    this.recordSnapshot();
    this.project.photoOrderMode = mode === 'aspect_match' ? 'aspect_match' : 'sequential';
    this.project.spreads.forEach(s => this._updateSpreadLayout(s));
    this.notify('photo-order-mode-changed', this.project.photoOrderMode);
  }

  getPhotoById(id) {
    return this.project.photos.find(p => p.id === id);
  }

  _recomputeUsageCounts() {
    const counts = {};
    this.project.spreads.forEach(spread => {
      spread.photoIds.forEach(id => {
        counts[id] = (counts[id] || 0) + 1;
      });
    });
    this.project.photos.forEach(p => {
      p.usageCount = counts[p.id] || 0;
    });
  }

  // --- Spread Management ---

  getActiveSpread() {
    return this.project.spreads[this.activeSpreadIndex] || null;
  }

  setActiveSpread(index) {
    if (index >= 0 && index < this.project.spreads.length) {
      this.activeSpreadIndex = index;
      this.project.lastActiveSpreadIndex = index;
      try {
        localStorage.setItem('smartEase_lastActiveSpreadIndex', String(index));
      } catch (e) {}
      this.notify('spread-activated', index);
    }
  }

  addSpread(photos = [], insertIndex = -1) {
    this.recordSnapshot();
    const spreadIndex = insertIndex >= 0 ? insertIndex : this.project.spreads.length;
    const pageNum = spreadIndex * 2 + 1;

    const newSpread = {
      id: 'spread-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      pageLabel: `Page ${pageNum} - ${pageNum + 1}`,
      photoIds: [...photos],
      layoutId: null,
      layout: null,
      slots: [], // [{ slotIndex, photoId, panX: 0, panY: 0, zoom: 1.0 }]
      orientation: this.project.orientation || 'landscape',
      customRotation: 0
    };

    if (insertIndex >= 0) {
      this.project.spreads.splice(insertIndex, 0, newSpread);
    } else {
      this.project.spreads.push(newSpread);
    }

    this._updateSpreadLayout(newSpread);
    this._recomputePageLabels();
    this._recomputeUsageCounts();

    this.activeSpreadIndex = insertIndex >= 0 ? insertIndex : this.project.spreads.length - 1;
    this.notify('spread-added', newSpread);
    return newSpread;
  }

  removeSpread(index) {
    if (this.project.spreads.length <= 1) {
      // If only 1 spread left, reset it to blank spread instead of refusing
      this.recordSnapshot();
      const spread = this.project.spreads[0];
      spread.photoIds = [];
      spread.layout = { id: 'empty', name: 'Blank Spread', rects: [] };
      spread.layoutId = 'empty';
      spread.slots = [];
      this._recomputeUsageCounts();
      this.notify('spread-removed', 0);
      this.notify('layout-changed', spread);
      return true;
    }
    this.recordSnapshot();
    this.project.spreads.splice(index, 1);
    if (this.activeSpreadIndex >= this.project.spreads.length) {
      this.activeSpreadIndex = this.project.spreads.length - 1;
    }
    this._recomputePageLabels();
    this._recomputeUsageCounts();
    this.notify('spread-removed', index);
    return true;
  }

  reorderSpreads(fromIdx, toIdx) {
    if (fromIdx === toIdx) return;
    this.recordSnapshot();
    const [moved] = this.project.spreads.splice(fromIdx, 1);
    this.project.spreads.splice(toIdx, 0, moved);
    this.activeSpreadIndex = toIdx;
    this._recomputePageLabels();
    this.notify('spreads-reordered');
  }

  _recomputePageLabels() {
    this.project.spreads.forEach((spread, idx) => {
      const p = idx * 2 + 1;
      spread.pageLabel = `Page ${p} - ${p + 1}`;
    });
  }

  // --- Layout Calculation & Cycling ---

  _updateSpreadLayout(spread, specificLayout = null) {
    // Synchronize photoIds with active slot photo order to guarantee 100% photo order fidelity
    // only when the slot photos match the spread's registered photos
    if (spread.slots && spread.slots.length > 0) {
      const activeIds = spread.slots.map(s => s.photoId).filter(Boolean);
      if (activeIds.length > 0 && activeIds.length === spread.photoIds.length && activeIds.every(id => spread.photoIds.includes(id))) {
        spread.photoIds = activeIds;
      }
    }

    const photoCount = spread.photoIds.length;
    if (photoCount === 0) {
      spread.layout = { id: 'empty', name: 'Blank Spread', rects: [] };
      spread.layoutId = 'empty';
      spread.slots = [];
      return;
    }

    const photos = spread.photoIds.map(id => this.getPhotoById(id)).filter(Boolean);
    const spreadIdx = this.project.spreads.indexOf(spread);
    const activeAspect = this.getActiveAspect(spreadIdx >= 0 ? spreadIdx : this.activeSpreadIndex);
    const availableTemplates = this.layoutEngine.getTemplatesForCount(photoCount, 'all', photos, activeAspect);

    if (specificLayout) {
      spread.layout = specificLayout;
      spread.layoutId = specificLayout.id;
    } else if (!spread.layout || spread.layout.rects.length !== photoCount) {
      // Pick best matching template by aspect ratios and orientation
      spread.layout = availableTemplates[0] || { id: `auto-${photoCount}`, name: `Auto Layout ${photoCount}`, rects: [] };
      spread.layoutId = spread.layout.id;
    }

    // Match photos to slots strictly maintaining chronological photo order
    const preserveOrder = true;
    const match = this.layoutEngine.matchPhotosToLayout(photos, spread.layout, activeAspect, preserveOrder);
    
    // Preserve existing slot pan/zoom/filters if photo was already placed
    const prevSlotsMap = new Map();
    (spread.slots || []).forEach(s => prevSlotsMap.set(s.photoId, s));

    spread.slots = match.assignment.map(item => {
      const photo = photos[item.photoIndex];
      const prev = photo ? prevSlotsMap.get(photo.id) : null;
      return {
        slotIndex: item.slotIndex,
        photoId: photo ? photo.id : null,
        panX: prev ? prev.panX : 0,
        panY: prev ? prev.panY : 0,
        zoom: prev ? prev.zoom : 1.0,
        rotation: prev ? (prev.rotation || 0) : 0,
        flipH: prev ? Boolean(prev.flipH) : false,
        flipV: prev ? Boolean(prev.flipV) : false,
        brightness: prev && prev.brightness !== undefined ? prev.brightness : 100,
        contrast: prev && prev.contrast !== undefined ? prev.contrast : 100,
        saturation: prev && prev.saturation !== undefined ? prev.saturation : 100,
        warmth: prev && prev.warmth !== undefined ? prev.warmth : 0,
        cropMode: prev && prev.cropMode ? prev.cropMode : 'cover',
        rect: item.rect
      };
    });
  }

  nextLayout(spreadIndex = this.activeSpreadIndex) {
    const spread = this.project.spreads[spreadIndex];
    if (!spread) return false;

    const count = spread.photoIds.length > 0 ? spread.photoIds.length : (spread.layout?.rects?.length || 2);
    const photos = spread.photoIds.map(id => this.getPhotoById(id)).filter(Boolean);
    const activeAspect = this.getActiveAspect(spreadIndex);
    const templates = this.layoutEngine.getTemplatesForCount(count, 'all', photos, activeAspect);
    if (!templates || templates.length === 0) return false;

    this.recordSnapshot();
    let currIdx = templates.findIndex(t => t.id === spread.layoutId);
    let nextIdx = (currIdx + 1) % templates.length;

    this._updateSpreadLayout(spread, templates[nextIdx]);
    this.notify('layout-changed', spread);
    return true;
  }

  prevLayout(spreadIndex = this.activeSpreadIndex) {
    const spread = this.project.spreads[spreadIndex];
    if (!spread) return false;

    const count = spread.photoIds.length > 0 ? spread.photoIds.length : (spread.layout?.rects?.length || 2);
    const photos = spread.photoIds.map(id => this.getPhotoById(id)).filter(Boolean);
    const activeAspect = this.getActiveAspect(spreadIndex);
    const templates = this.layoutEngine.getTemplatesForCount(count, 'all', photos, activeAspect);
    if (!templates || templates.length === 0) return false;

    this.recordSnapshot();
    let currIdx = templates.findIndex(t => t.id === spread.layoutId);
    let prevIdx = (currIdx - 1 + templates.length) % templates.length;

    this._updateSpreadLayout(spread, templates[prevIdx]);
    this.notify('layout-changed', spread);
    return true;
  }

  /**
   * Generates a new varying rectangle layout while strictly maintaining the chronological order of photos
   */
  randomizeLayout(spreadIndex = this.activeSpreadIndex) {
    const spread = this.project.spreads[spreadIndex];
    if (!spread) return false;

    // Capture current slot order
    if (spread.slots && spread.slots.length > 0) {
      const activeIds = spread.slots.map(s => s.photoId).filter(Boolean);
      if (activeIds.length > 0) {
        spread.photoIds = activeIds;
      }
    }

    const count = spread.photoIds.length > 0 ? spread.photoIds.length : (spread.layout?.rects?.length || 2);
    this.recordSnapshot();
    const randomTemplate = this.layoutEngine.generateRandomLayout(count, spread.layoutId);
    this._updateSpreadLayout(spread, randomTemplate);
    this.notify('layout-randomized', spread);
    return true;
  }

  _ensureCustomLayout(spread, canvasWidth = null, canvasHeight = null) {
    if (!spread || !spread.layout) return;
    if (!spread.layout.isCustom) {
      if (canvasWidth && canvasHeight) {
        const spreadIdx = this.project.spreads.indexOf(spread);
        const currentPixelRects = this.layoutEngine.computePixelRectangles(
          spread.layout,
          canvasWidth,
          canvasHeight,
          {
            marginPercent: this.getSpreadMarginPercent(spreadIdx >= 0 ? spreadIdx : this.activeSpreadIndex),
            middleMarginPercent: this.getSpreadMiddleMarginPercent(spreadIdx >= 0 ? spreadIdx : this.activeSpreadIndex),
            gapPx: this.getSpreadGapPx(spreadIdx >= 0 ? spreadIdx : this.activeSpreadIndex),
            fullBleed: this.project.fullBleed,
            pageMode: this.project.pageMode
          }
        );
        const initialNormRects = currentPixelRects.map(pr => this.layoutEngine.pixelRectToNormalized(pr, canvasWidth, canvasHeight, {
          isCustom: true,
          directCanvas: true
        }));
        spread.layout = {
          id: (spread.layout.id || 'layout') + '-custom-' + Date.now(),
          name: (spread.layout.name || 'Layout') + ' (Custom)',
          isCustom: true,
          rects: initialNormRects
        };
      } else {
        spread.layout = {
          id: (spread.layout.id || 'layout') + '-custom-' + Date.now(),
          name: (spread.layout.name || 'Layout') + ' (Custom)',
          isCustom: true,
          rects: spread.layout.rects ? spread.layout.rects.map(r => ({ ...r })) : []
        };
      }
      spread.layoutId = spread.layout.id;
    }
  }

  /**
   * Manually switches frames from Left to Right (symmetrical horizontal reflection / swap across spread center)
   */
  switchFramesLeftRight(spreadIndex = this.activeSpreadIndex, slotIndices = null) {
    const spread = this.project.spreads[spreadIndex];
    if (!spread || !spread.layout || !spread.layout.rects || spread.layout.rects.length === 0) return;

    this.recordSnapshot();

    // If no specific frame indices provided, flip the entire spread horizontally
    const indices = slotIndices instanceof Set
      ? Array.from(slotIndices)
      : (Array.isArray(slotIndices) ? slotIndices : (slotIndices !== null && slotIndices !== undefined ? [slotIndices] : []));

    if (indices.length === 0) {
      this.flipLayoutHorizontal(spreadIndex);
      return;
    }

    this._ensureCustomLayout(spread);

    // If exactly 2 frames selected: swap their positions & sizes
    if (indices.length === 2) {
      const idxA = indices[0];
      const idxB = indices[1];
      const rA = spread.layout.rects[idxA];
      const rB = spread.layout.rects[idxB];
      if (rA && rB) {
        const tempRect = { ...rA };
        spread.layout.rects[idxA] = { ...rB };
        spread.layout.rects[idxB] = tempRect;

        if (spread.slots[idxA]) spread.slots[idxA].rect = spread.layout.rects[idxA];
        if (spread.slots[idxB]) spread.slots[idxB].rect = spread.layout.rects[idxB];

        this.notify('layout-changed', spread);
        return;
      }
    }

    // Switch/mirror each selected frame horizontally across the center line
    indices.forEach(idx => {
      const r = spread.layout.rects[idx];
      if (r) {
        r.x = Number(Math.max(0, Math.min(1.0 - r.w, 1.0 - (r.x + r.w))).toFixed(4));
        const slot = spread.slots.find(s => s.slotIndex === idx);
        if (slot) slot.rect = { ...r };
      }
    });

    this.notify('layout-changed', spread);
  }

  /**
   * Layer Arrange: Bring Frame to Front (topmost visual layer)
   */
  bringToFront(spreadIndex = this.activeSpreadIndex, slotIndex = null) {
    const spread = this.project.spreads[spreadIndex];
    if (!spread || !spread.layout || !spread.layout.rects || slotIndex === null) return null;
    const len = spread.layout.rects.length;
    if (slotIndex < 0 || slotIndex >= len - 1) return slotIndex;

    this.recordSnapshot();
    this._ensureCustomLayout(spread);

    const [rect] = spread.layout.rects.splice(slotIndex, 1);
    spread.layout.rects.push(rect);

    const [slot] = spread.slots.splice(slotIndex, 1);
    spread.slots.push(slot);

    spread.slots.forEach((s, idx) => { s.slotIndex = idx; });
    spread.photoIds = spread.slots.map(s => s.photoId).filter(Boolean);

    this.notify('layout-changed', spread);
    return len - 1;
  }

  /**
   * Layer Arrange: Send Frame to Back (bottommost visual layer)
   */
  sendToBack(spreadIndex = this.activeSpreadIndex, slotIndex = null) {
    const spread = this.project.spreads[spreadIndex];
    if (!spread || !spread.layout || !spread.layout.rects || slotIndex === null) return null;
    const len = spread.layout.rects.length;
    if (slotIndex <= 0 || slotIndex >= len) return slotIndex;

    this.recordSnapshot();
    this._ensureCustomLayout(spread);

    const [rect] = spread.layout.rects.splice(slotIndex, 1);
    spread.layout.rects.unshift(rect);

    const [slot] = spread.slots.splice(slotIndex, 1);
    spread.slots.unshift(slot);

    spread.slots.forEach((s, idx) => { s.slotIndex = idx; });
    spread.photoIds = spread.slots.map(s => s.photoId).filter(Boolean);

    this.notify('layout-changed', spread);
    return 0;
  }

  /**
   * Layer Arrange: Bring Frame Forward 1 layer
   */
  bringForward(spreadIndex = this.activeSpreadIndex, slotIndex = null) {
    const spread = this.project.spreads[spreadIndex];
    if (!spread || !spread.layout || !spread.layout.rects || slotIndex === null) return null;
    const len = spread.layout.rects.length;
    if (slotIndex < 0 || slotIndex >= len - 1) return slotIndex;

    this.recordSnapshot();
    this._ensureCustomLayout(spread);

    const targetIdx = slotIndex + 1;
    const tempRect = spread.layout.rects[slotIndex];
    spread.layout.rects[slotIndex] = spread.layout.rects[targetIdx];
    spread.layout.rects[targetIdx] = tempRect;

    const tempSlot = spread.slots[slotIndex];
    spread.slots[slotIndex] = spread.slots[targetIdx];
    spread.slots[targetIdx] = tempSlot;

    spread.slots.forEach((s, idx) => { s.slotIndex = idx; });
    spread.photoIds = spread.slots.map(s => s.photoId).filter(Boolean);

    this.notify('layout-changed', spread);
    return targetIdx;
  }

  /**
   * Layer Arrange: Send Frame Backward 1 layer
   */
  sendBackward(spreadIndex = this.activeSpreadIndex, slotIndex = null) {
    const spread = this.project.spreads[spreadIndex];
    if (!spread || !spread.layout || !spread.layout.rects || slotIndex === null) return null;
    const len = spread.layout.rects.length;
    if (slotIndex <= 0 || slotIndex >= len) return slotIndex;

    this.recordSnapshot();
    this._ensureCustomLayout(spread);

    const targetIdx = slotIndex - 1;
    const tempRect = spread.layout.rects[slotIndex];
    spread.layout.rects[slotIndex] = spread.layout.rects[targetIdx];
    spread.layout.rects[targetIdx] = tempRect;

    const tempSlot = spread.slots[slotIndex];
    spread.slots[slotIndex] = spread.slots[targetIdx];
    spread.slots[targetIdx] = tempSlot;

    spread.slots.forEach((s, idx) => { s.slotIndex = idx; });
    spread.photoIds = spread.slots.map(s => s.photoId).filter(Boolean);

    this.notify('layout-changed', spread);
    return targetIdx;
  }

  flipLayoutHorizontal(spreadIndex = this.activeSpreadIndex) {
    const spread = this.project.spreads[spreadIndex];
    if (!spread || !spread.layout) return;
    this.recordSnapshot();
    const flipped = this.layoutEngine.flipLayoutHorizontal(spread.layout);
    this._updateSpreadLayout(spread, flipped);
    this.notify('layout-flipped-h', spread);
  }

  setLayoutForSpread(spreadIndex, layoutObj) {
    const spread = this.project.spreads[spreadIndex];
    if (!spread) return;
    this.recordSnapshot();
    this._updateSpreadLayout(spread, layoutObj);
    this.notify('layout-changed', spread);
  }

  assignPhotosToSpread(spreadIndex, photoIds) {
    const spread = this.project.spreads[spreadIndex];
    if (!spread) return;
    this.recordSnapshot();
    spread.photoIds = [...photoIds];
    this._updateSpreadLayout(spread);
    this._recomputeUsageCounts();
    this.notify('photos-assigned', spread);
  }

  addPhotoToActiveSpread(photoId) {
    const spread = this.getActiveSpread();
    if (!spread || !photoId) return;
    this.addPhotosToSpreadWithAutoLayout(this.activeSpreadIndex, [photoId]);
  }

  addPhotosToActiveSpread(photoIds) {
    this.addPhotosToSpreadWithAutoLayout(this.activeSpreadIndex, photoIds);
  }

  addPhotosToSpreadWithAutoLayout(spreadIndex, photoIds) {
    const spread = this.project.spreads[spreadIndex];
    if (!spread || !photoIds || photoIds.length === 0) return;
    this.recordSnapshot();

    const existingIds = spread.photoIds ? [...spread.photoIds] : [];
    const newIds = photoIds.filter(id => !existingIds.includes(id));
    if (newIds.length === 0 && existingIds.length > 0) {
      // All dropped photos already on spread, re-apply layout
      this._updateSpreadLayout(spread);
      this.notify('layout-changed', spread);
      return;
    }

    spread.photoIds = [...existingIds, ...newIds];
    // Reset layout and slots to pick fresh template matching new photo count
    spread.layout = null;
    spread.slots = [];
    this._updateSpreadLayout(spread);
    this._recomputeUsageCounts();
    this.notify('photo-assigned', spread);
    this.notify('photos-assigned', spread);
    this.notify('layout-changed', spread);
  }

  removePhotoFromSpread(spreadIndex, photoId) {
    const spread = this.project.spreads[spreadIndex];
    if (!spread) return;
    this.recordSnapshot();
    spread.photoIds = spread.photoIds.filter(id => id !== photoId);
    this._updateSpreadLayout(spread);
    this._recomputeUsageCounts();
    this.notify('photo-unassigned', spread);
  }

  swapSlots(spreadIndex, slotIndexA, slotIndexB) {
    const spread = this.project.spreads[spreadIndex];
    if (!spread || slotIndexA === slotIndexB) return;
    const slotA = spread.slots.find(s => s.slotIndex === slotIndexA);
    const slotB = spread.slots.find(s => s.slotIndex === slotIndexB);
    if (!slotA || !slotB) return;

    this.recordSnapshot();
    const tempPhotoId = slotA.photoId;
    const tempCrop = slotA.cropMode;

    slotA.photoId = slotB.photoId;
    slotA.panX = 0;
    slotA.panY = 0;
    slotA.zoom = 1.0;
    slotA.rotation = 0;
    slotA.flipH = false;
    slotA.flipV = false;
    slotA.cropMode = slotB.cropMode || 'cover';

    slotB.photoId = tempPhotoId;
    slotB.panX = 0;
    slotB.panY = 0;
    slotB.zoom = 1.0;
    slotB.rotation = 0;
    slotB.flipH = false;
    slotB.flipV = false;
    slotB.cropMode = tempCrop || 'cover';

    // Synchronize photoIds order to match the new slots arrangement
    spread.photoIds = spread.slots.map(s => s.photoId).filter(Boolean);
    this._recomputeUsageCounts();
    this.notify('slots-swapped', { spreadIndex, slotIndexA, slotIndexB, spread });
  }

  updateSlotPanZoom(spreadIndex, slotIndex, panX, panY, zoom) {
    const spread = this.project.spreads[spreadIndex];
    if (!spread) return;
    const slot = spread.slots.find(s => s.slotIndex === slotIndex);
    if (!slot) return;
    slot.panX = panX;
    slot.panY = panY;
    if (zoom !== undefined) slot.zoom = zoom;
    this.notify('slot-pan-zoom-updated', { spreadIndex, slotIndex });
  }

  // --- Auto-Build Photobook Wizard ---

  /**
   * Intelligently distributes all or selected photos across spreads,
   * automatically assigning balanced numbers of photos per spread,
   * and selecting optimal varying rectangular templates for each!
   * Supports targetSpreadCount for exact spreads count (e.g. 15 or 20 spreads for 200 photos).
   */
  autoBuildPhotobook(options = {}, onProgress = null) {
    this.recordSnapshot();
    const targetPhotos = options.selectedPhotoIds?.length
      ? this.project.photos.filter(p => options.selectedPhotoIds.includes(p.id))
      : this.project.photos;

    if (targetPhotos.length === 0) return 0;

    let spreadCounts = [];
    const targetSpreadCount = parseInt(options.targetSpreadCount || options.spreadCount, 10);

    if (targetSpreadCount && targetSpreadCount > 0) {
      // Safety check: avoid overloading spreads (e.g. 1 spread for 150 photos). Cap at 8 photos/spread average:
      const effectiveSpreads = (targetPhotos.length / targetSpreadCount > 8)
        ? Math.max(1, Math.ceil(targetPhotos.length / 4))
        : targetSpreadCount;
      spreadCounts = this._partitionPhotosIntoExactSpreads(targetPhotos.length, effectiveSpreads);
    } else {
      const minPerSpread = Math.max(1, parseInt(options.minPhotosPerSpread, 10) || 2);
      const maxPerSpread = Math.max(minPerSpread, Math.min(8, parseInt(options.maxPhotosPerSpread, 10) || 6));
      spreadCounts = this._partitionPhotosForSpreads(targetPhotos.length, minPerSpread, maxPerSpread);
    }

    const spreadsCreated = [];
    let photoIdx = 0;
    this.project.spreads = [];

    const totalSpreads = spreadCounts.length;
    spreadCounts.forEach((count, spreadIndex) => {
      const batch = count > 0 ? targetPhotos.slice(photoIdx, photoIdx + count) : [];
      photoIdx += count;
      const batchIds = batch.map(p => p.id);

      const pNum = spreadIndex * 2 + 1;
      const spread = {
        id: 'spread-' + Date.now() + '-' + spreadIndex + '-' + Math.random().toString(36).substr(2, 4),
        pageLabel: `Page ${pNum} - ${pNum + 1}`,
        photoIds: batchIds,
        layoutId: null,
        layout: null,
        slots: [],
        orientation: this.project.orientation || 'landscape',
        customRotation: 0
      };

      if (batchIds.length > 0) {
        this._updateSpreadLayout(spread);
      }
      spreadsCreated.push(spread);

      if (typeof onProgress === 'function') {
        const pct = Math.round(((spreadIndex + 1) / totalSpreads) * 100);
        onProgress(spreadIndex + 1, totalSpreads, pct);
      }
    });

    this.project.spreads = spreadsCreated;
    this.activeSpreadIndex = 0;
    this._recomputePageLabels();
    this._recomputeUsageCounts();
    this.notify('autobuild-complete', {
      spreadCount: spreadsCreated.length,
      photoCount: targetPhotos.length
    });
    return spreadsCreated.length;
  }

  /**
   * Partitions totalPhotos across exactly numSpreads spreads with dynamic rhythm,
   * alternating between dramatic hero spreads (fewer photos) and high-density story spreads (more photos),
   * strictly guaranteeing that exactly numSpreads spreads are returned and their sum equals totalPhotos.
   */
  _partitionPhotosIntoExactSpreads(totalPhotos, numSpreads) {
    if (totalPhotos <= 0 || numSpreads <= 0) return [];
    if (numSpreads === 1) return [totalPhotos];

    if (totalPhotos < numSpreads) {
      const counts = new Array(numSpreads).fill(0);
      for (let i = 0; i < totalPhotos; i++) counts[i] = 1;
      return counts;
    }

    const avg = totalPhotos / numSpreads;
    const minCap = 1;
    const maxCap = Math.min(10, Math.max(4, Math.ceil(avg * 1.6)));

    // Rhythm factors: slight variations to give a natural storytelling pace
    const baseRhythm = [-0.35, 0.20, -0.15, 0.30, -0.25, 0.25, 0.0, -0.20, 0.35, -0.10, 0.15, -0.25];

    const counts = new Array(numSpreads);
    let totalAssigned = 0;

    for (let i = 0; i < numSpreads; i++) {
      const rhythmFactor = baseRhythm[i % baseRhythm.length];
      const variation = Math.round(avg * rhythmFactor);
      let count = Math.round(avg + variation);
      count = Math.max(minCap, Math.min(maxCap, count));
      counts[i] = count;
      totalAssigned += count;
    }

    // Balance any discrepancy between totalAssigned and totalPhotos
    let diff = totalPhotos - totalAssigned;
    let guard = 0;
    while (diff !== 0 && guard < 1000) {
      guard++;
      const step = diff > 0 ? 1 : -1;
      let adjusted = false;

      for (let i = 0; i < numSpreads; i++) {
        if (diff === 0) break;
        const newCount = counts[i] + step;
        if (newCount >= minCap && newCount <= maxCap) {
          counts[i] = newCount;
          diff -= step;
          adjusted = true;
        }
      }

      if (!adjusted) {
        for (let i = 0; i < numSpreads; i++) {
          if (diff === 0) break;
          const newCount = counts[i] + step;
          if (newCount >= minCap) {
            counts[i] = newCount;
            diff -= step;
          }
        }
      }
    }

    return counts;
  }

  /**
   * Robust integer partitioner for photobook spreads.
   * Guarantees all counts are in [minP, maxP] and sum to totalPhotos.
   */
  _partitionPhotosForSpreads(totalPhotos, minP = 2, maxP = 8) {
    if (totalPhotos <= 0) return [];
    if (totalPhotos <= maxP) return [totalPhotos];

    const targetAvg = Math.min(maxP, Math.max(minP, 4.5));
    let numSpreads = Math.max(1, Math.round(totalPhotos / targetAvg));

    // Ensure totalPhotos / numSpreads is within bounds
    while (Math.floor(totalPhotos / numSpreads) < minP && numSpreads > 1) {
      numSpreads--;
    }
    while (Math.ceil(totalPhotos / numSpreads) > maxP) {
      numSpreads++;
    }

    const counts = new Array(numSpreads).fill(minP);
    let remaining = totalPhotos - (numSpreads * minP);

    // Dynamic rhythm: alternate hero spreads (fewer photos) with detail spreads (more photos)
    const rhythm = [1, 2, 0, 3, 1, 4, 0, 2];
    let step = 0;
    while (remaining > 0) {
      const idx = step % numSpreads;
      const capacity = maxP - counts[idx];
      if (capacity > 0) {
        const bonus = Math.min(remaining, Math.min(capacity, rhythm[step % rhythm.length] || 1));
        counts[idx] += bonus;
        remaining -= bonus;
      }
      step++;
    }

    return counts;
  }

  // --- Settings & Persistence ---

  getPresetSpreadDimensions(preset = this.project.selectedSize, orientation = null, pageMode = null) {
    if (!preset) preset = this.sizePresets[0];
    const orient = orientation || this.project.orientation || 'landscape';
    const mode = pageMode || this.project.pageMode || 'spread';

    const pageLong = Math.max(preset.pageW || 12, preset.pageH || 12);
    const pageShort = Math.min(preset.pageW || 12, preset.pageH || 12);

    // In Landscape mode: single page is (pageLong) wide by (pageShort) high
    // In Portrait mode: single page is (pageShort) wide by (pageLong) high
    const singleW = orient === 'portrait' ? pageShort : pageLong;
    const singleH = orient === 'portrait' ? pageLong : pageShort;

    // In Double Spread mode: 2 facing pages side by side (width is doubled)
    // In Single Page mode: single page
    const fullSpreadW = mode === 'spread' ? singleW * 2 : singleW;
    const fullSpreadH = singleH;

    return {
      width: fullSpreadW,
      height: fullSpreadH,
      pageWidth: singleW,
      pageHeight: singleH,
      spreadLabel: `${fullSpreadW} × ${fullSpreadH}"`,
      pageLabel: `${singleW} × ${singleH}"`,
      aspect: Number((fullSpreadW / fullSpreadH).toFixed(3))
    };
  }

  getSheetWidthInches(spreadIndex = this.activeSpreadIndex) {
    const size = this.project.selectedSize;
    const spread = this.project.spreads[spreadIndex];
    const orientation = spread?.orientation || this.project.orientation || 'landscape';
    const dims = this.getPresetSpreadDimensions(size, orientation, this.project.pageMode);
    return dims.width;
  }

  getSheetHeightInches(spreadIndex = this.activeSpreadIndex) {
    const size = this.project.selectedSize;
    const spread = this.project.spreads[spreadIndex];
    const orientation = spread?.orientation || this.project.orientation || 'landscape';
    const dims = this.getPresetSpreadDimensions(size, orientation, this.project.pageMode);
    return dims.height;
  }

  getActiveAspect(spreadIndex = this.activeSpreadIndex) {
    const w = this.getSheetWidthInches(spreadIndex);
    const h = this.getSheetHeightInches(spreadIndex);
    return Number((w / h).toFixed(3));
  }

  getSpreadOrientation(spreadIndex = this.activeSpreadIndex) {
    const spread = this.project.spreads[spreadIndex];
    return spread?.orientation || this.project.orientation || 'landscape';
  }

  setOrientation(orientation, spreadOnly = false) {
    if (orientation !== 'landscape' && orientation !== 'portrait') return;
    this.recordSnapshot();
    if (spreadOnly) {
      const spread = this.getActiveSpread();
      if (spread) spread.orientation = orientation;
    } else {
      this.project.orientation = orientation;
      this.project.spreads.forEach(s => { s.orientation = orientation; });
    }
    this.project.spreads.forEach(s => this._updateSpreadLayout(s));
    this.notify('orientation-changed', { orientation, spreadOnly });
  }

  setMiddleMarginPercent(val) {
    this.project.middleMarginPercent = Math.max(0, Math.min(15, val));
    this.notify('spacing-changed');
  }

  setPageMode(mode) {
    if (mode !== 'spread' && mode !== 'single') return;
    this.recordSnapshot();
    this.project.pageMode = mode;
    this.project.spreads.forEach(s => this._updateSpreadLayout(s));
    this.notify('page-mode-changed', mode);
  }

  setAlbumSize(presetId) {
    const preset = this.sizePresets.find(p => p.id === presetId);
    if (!preset) return;
    this.recordSnapshot();
    this.project.selectedSize = preset;
    // Recalculate all spread layouts
    this.project.spreads.forEach(s => this._updateSpreadLayout(s));
    this.notify('size-changed', preset);
  }

  getSpreadMarginPercent(spreadIndex = this.activeSpreadIndex) {
    const spread = this.project.spreads[spreadIndex];
    if (spread && spread.marginPercent !== undefined) return spread.marginPercent;
    return this.project.marginPercent !== undefined ? this.project.marginPercent : 2.0;
  }

  setSpreadMarginPercent(spreadIndex, val, applyToAll = false) {
    this.recordSnapshot();
    const clamped = Math.max(0, Math.min(15, parseFloat(val) || 0));
    if (applyToAll) {
      this.project.marginPercent = clamped;
      this.project.spreads.forEach(s => delete s.marginPercent);
    } else {
      const spread = this.project.spreads[spreadIndex];
      if (spread) spread.marginPercent = clamped;
    }
    this.notify('spacing-changed', { spreadIndex, marginPercent: clamped, applyToAll });
  }

  setMarginPercent(val) {
    this.setSpreadMarginPercent(this.activeSpreadIndex, val, true);
  }

  getSpreadGapPx(spreadIndex = this.activeSpreadIndex) {
    const spread = this.project.spreads[spreadIndex];
    if (spread && spread.gapPx !== undefined) return spread.gapPx;
    return this.project.gapPx !== undefined ? this.project.gapPx : 8;
  }

  setSpreadGapPx(spreadIndex, val, applyToAll = false) {
    this.recordSnapshot();
    const clamped = Math.max(0, Math.min(50, parseInt(val, 10) || 0));
    if (applyToAll) {
      this.project.gapPx = clamped;
      this.project.spreads.forEach(s => delete s.gapPx);
    } else {
      const spread = this.project.spreads[spreadIndex];
      if (spread) spread.gapPx = clamped;
    }
    this.notify('spacing-changed', { spreadIndex, gapPx: clamped, applyToAll });
  }

  setGapPx(val) {
    this.setSpreadGapPx(this.activeSpreadIndex, val, true);
  }

  getSpreadMiddleMarginPercent(spreadIndex = this.activeSpreadIndex) {
    const spread = this.project.spreads[spreadIndex];
    if (spread && spread.middleMarginPercent !== undefined) return spread.middleMarginPercent;
    return this.project.middleMarginPercent !== undefined ? this.project.middleMarginPercent : 0.0;
  }

  setSpreadMiddleMarginPercent(spreadIndex, val, applyToAll = false) {
    this.recordSnapshot();
    const clamped = Math.max(0, Math.min(10, parseFloat(val) || 0));
    if (applyToAll) {
      this.project.middleMarginPercent = clamped;
      this.project.spreads.forEach(s => delete s.middleMarginPercent);
    } else {
      const spread = this.project.spreads[spreadIndex];
      if (spread) spread.middleMarginPercent = clamped;
    }
    this.notify('spacing-changed', { spreadIndex, middleMarginPercent: clamped, applyToAll });
  }

  setMiddleMarginPercent(val) {
    this.setSpreadMiddleMarginPercent(this.activeSpreadIndex, val, true);
  }

  setFullBleed(enabled) {
    this.project.fullBleed = Boolean(enabled);
    this.notify('spacing-changed');
  }

  setBackgroundColor(color) {
    this.project.backgroundColor = color;
    this.notify('spacing-changed');
  }

  exportProject() {
    this.project.version = '2.5';
    this.project.updatedAt = new Date().toISOString();
    this.project.hasBeenSaved = true;
    this.project.lastActiveSpreadIndex = this.activeSpreadIndex;
    this.isDirty = false;

    // Fast serialization: lightweight object graph without runtime DOM elements or heavy objects
    const cleanProject = {
      ...this.project,
      lastActiveSpreadIndex: this.activeSpreadIndex,
      savePath: this.project.savePath || '',
      photosFolder: this.project.photosFolder || this.project.sourceFolderPath || '',
      sourceFolderPath: this.project.sourceFolderPath || this.project.photosFolder || '',
      photos: (this.project.photos || []).map(p => {
        const folder = p.sourceFolder || this.project.photosFolder || this.project.sourceFolderPath || '';
        let fullPath = p.filePath || '';
        if (!fullPath && folder && p.fileName) {
          const sep = folder.includes('/') ? '/' : '\\';
          fullPath = folder.endsWith(sep) ? (folder + p.fileName) : (folder + sep + p.fileName);
        }
        const localApiSrc = fullPath ? `/api/local_image?path=${encodeURIComponent(fullPath)}` : '';
        let safeSrc = (p.src && !p.src.startsWith('blob:') && !p.src.startsWith('data:')) ? p.src : (localApiSrc || p.src || '');
        if (typeof safeSrc === 'string' && safeSrc.startsWith('/api/local_image')) {
          safeSrc = safeSrc.replace(/[?&]thumb=[^&]*/g, '').replace(/[?&]w=\d+/g, '').replace(/\?&/, '?').replace(/&$/, '').replace(/\?$/, '');
        }
        let safeThumb = (p.thumbSrc && !p.thumbSrc.startsWith('blob:')) ? p.thumbSrc : (localApiSrc ? (localApiSrc + '&thumb=1') : (safeSrc || ''));
        if (typeof safeThumb === 'string' && safeThumb.startsWith('/api/local_image') && !safeThumb.includes('thumb=')) {
          safeThumb += '&thumb=1';
        }
        return {
          id: p.id,
          name: p.name,
          fileName: p.fileName,
          filePath: fullPath,
          fileHash: p.fileHash || null,
          fileSize: typeof p.fileSize === 'number' ? p.fileSize : 0,
          folderName: p.folderName || '',
          sourceFolder: folder,
          src: safeSrc,
          thumbSrc: safeThumb,
          width: p.width || 1200,
          height: p.height || 800,
          aspect: p.aspect || 1.5,
          lastModified: p.lastModified || null,
          dateTaken: p.dateTaken || null,
          cameraModel: p.cameraModel || null,
          cameraMake: p.cameraMake || null,
          usageCount: p.usageCount || 0,
          rotation: p.rotation || 0,
          tags: p.tags || []
        };
      }),
      spreads: (this.project.spreads || []).map(s => ({
        id: s.id,
        pageLabel: s.pageLabel,
        photoIds: s.photoIds || [],
        layoutId: s.layoutId,
        layout: s.layout,
        slots: s.slots || [],
        orientation: s.orientation,
        customRotation: s.customRotation || 0,
        backgroundColor: s.backgroundColor,
        widthInches: s.widthInches,
        heightInches: s.heightInches
      }))
    };
    delete cleanProject.saveFileHandle;

    return JSON.stringify(cleanProject);
  }

  /**
   * Comprehensive Schema Migration: Automatically upgrades older versions of photobook project files
   * to the latest schema format seamlessly without errors.
   */
  _migrateProjectSchema(raw) {
    if (!raw || typeof raw !== 'object') {
      throw new Error('Invalid project file: not an object');
    }

    const data = { ...raw };

    // 1. Root-level compatibility
    data.version = data.version || '2.5';
    data.id = data.id || ('album-' + Date.now());
    data.title = data.title || data.projectName || data.name || 'Photobook Project';
    data.pageMode = data.pageMode || (data.mode === 'single' ? 'single' : 'spread');
    data.orientation = data.orientation || 'landscape';
    data.photoOrderMode = data.photoOrderMode || 'sequential';
    data.marginPercent = typeof data.marginPercent === 'number' ? data.marginPercent : 2.0;
    data.middleMarginPercent = typeof data.middleMarginPercent === 'number' ? data.middleMarginPercent : 0.0;
    data.gapPx = typeof data.gapPx === 'number' ? data.gapPx : 8;
    data.safeZonePercent = typeof data.safeZonePercent === 'number' ? data.safeZonePercent : 3.0;
    data.fullBleed = Boolean(data.fullBleed);
    data.backgroundColor = data.backgroundColor || '#ffffff';
    data.photosFolder = data.photosFolder || raw.photosFolder || data.sourceFolderPath || raw.sourceFolderPath || '';
    data.sourceFolderPath = data.sourceFolderPath || raw.sourceFolderPath || data.photosFolder || raw.photosFolder || '';
    data.savePath = data.savePath || raw.savePath || '';
    data.hasBeenSaved = Boolean(data.hasBeenSaved || raw.hasBeenSaved || raw.savePath);
    data.lastActiveSpreadIndex = typeof data.lastActiveSpreadIndex === 'number' ? data.lastActiveSpreadIndex : (typeof raw.lastActiveSpreadIndex === 'number' ? raw.lastActiveSpreadIndex : 0);

    // Size preset normalization
    if (!data.selectedSize) {
      const sizeId = data.sizeId || data.albumSize || '12x12';
      data.selectedSize = this.sizePresets.find(s => s.id === sizeId) || this.sizePresets[0];
    }

    // 2. Photos pool normalization (support legacy "images", "media", "photos")
    let rawPhotos = Array.isArray(data.photos) ? data.photos : (Array.isArray(data.images) ? data.images : (Array.isArray(data.media) ? data.media : []));
    data.photos = rawPhotos.map((p, pIdx) => {
      if (!p || typeof p !== 'object') return null;
      const id = String(p.id || p.photoId || p.imageId || ('photo-' + pIdx + '-' + Date.now()));
      const width = p.width || p.w || (p.aspect ? Math.round(1000 * p.aspect) : 1200);
      const height = p.height || p.h || 1000;
      const aspect = p.aspect || (width && height ? Number((width / height).toFixed(4)) : 1.33);

      let src = p.src || p.url || p.dataUrl || '';
      let thumbSrc = p.thumbSrc || p.thumbnail || p.thumb || p.preview || '';
      let originalSrc = p.originalSrc || '';

      const isDeadBlob = (s) => typeof s === 'string' && s.startsWith('blob:');
      const isValidImageUri = (s) => typeof s === 'string' && (s.startsWith('data:image') || s.startsWith('http:') || s.startsWith('https:') || s.startsWith('file:') || s.length > 50);

      // In saved/older projects, blob: URLs are temporary browser session tokens that expire upon app close.
      // Automatically fallback to embedded base64/data thumbnail so the canvas loads immediately!
      let isRestored = false;
      if ((!src || isDeadBlob(src)) && isValidImageUri(thumbSrc)) {
        src = thumbSrc;
        isRestored = true;
      }
      if ((!originalSrc || isDeadBlob(originalSrc)) && isValidImageUri(thumbSrc)) {
        originalSrc = thumbSrc;
      }
      if (!thumbSrc && src) {
        thumbSrc = src;
      }
      if (!src && thumbSrc) {
        src = thumbSrc;
      }

      const pName = p.name || p.filename || p.title || ('Photo ' + (pIdx + 1));
      const pFileName = p.fileName || (pName.includes('.') ? pName : (pName + '.jpg'));
      const pFolder = p.sourceFolder || data.photosFolder || data.sourceFolderPath || '';
      let pFilePath = p.filePath || '';
      if (!pFilePath && pFolder && pFileName) {
        const sep = pFolder.includes('/') ? '/' : '\\';
        pFilePath = pFolder.endsWith(sep) ? (pFolder + pFileName) : (pFolder + sep + pFileName);
      }

      if (pFilePath) {
        const ep = `/api/local_image?path=${encodeURIComponent(pFilePath)}`;
        src = (typeof window.getApiUrl === 'function') ? window.getApiUrl(ep) : ep;
        originalSrc = src;
        thumbSrc = (typeof window.getApiUrl === 'function') ? window.getApiUrl(ep + '&thumb=1') : (ep + '&thumb=1');
      } else {
        if (typeof src === 'string' && src.includes('/api/local_image')) {
          src = src.replace(/[?&]thumb=[^&]*/g, '').replace(/[?&]w=\d+/g, '').replace(/\?&/, '?').replace(/&$/, '').replace(/\?$/, '');
          src = (typeof window.getApiUrl === 'function') ? window.getApiUrl(src) : src;
        }
        if (typeof thumbSrc === 'string' && thumbSrc.includes('/api/local_image') && !thumbSrc.includes('thumb=')) {
          thumbSrc += '&thumb=1';
          thumbSrc = (typeof window.getApiUrl === 'function') ? window.getApiUrl(thumbSrc) : thumbSrc;
        }
      }

      const hasValidPath = Boolean(pFilePath && (pFilePath.includes('/') || pFilePath.includes('\\')));
      const isDead = isDeadBlob(src) || isDeadBlob(originalSrc) || (typeof src === 'string' && src.startsWith('data:image'));

      return {
        id: id,
        name: pName,
        fileName: pFileName,
        filePath: pFilePath,
        fileHash: p.fileHash || null,
        fileSize: typeof p.fileSize === 'number' ? p.fileSize : 0,
        folderName: p.folderName || '',
        sourceFolder: pFolder,
        src: src,
        thumbSrc: thumbSrc,
        originalSrc: originalSrc || src,
        originalFile: p.originalFile || null,
        width: width,
        height: height,
        aspect: aspect,
        lastModified: p.lastModified || null,
        dateTaken: p.dateTaken || null,
        cameraModel: p.cameraModel || null,
        cameraMake: p.cameraMake || null,
        usageCount: typeof p.usageCount === 'number' ? p.usageCount : 0,
        needsRelink: Boolean(p.needsRelink || isDead || (!p.originalFile && !hasValidPath)),
        filePathVerified: Boolean(p.originalFile || hasValidPath)
      };
    }).filter(Boolean);

    // Build photo lookup for fast validation
    const photoIdSet = new Set(data.photos.map(p => p.id));

    // 3. Spreads normalization (support legacy "pages", "spreads", "sheets")
    let rawSpreads = Array.isArray(data.spreads) ? data.spreads : (Array.isArray(data.pages) ? data.pages : (Array.isArray(data.sheets) ? data.sheets : []));
    if (rawSpreads.length === 0) {
      rawSpreads = [{
        id: 'spread-1',
        photoIds: data.photos.slice(0, 3).map(p => p.id),
        slots: []
      }];
    }

    data.spreads = rawSpreads.map((s, sIdx) => {
      if (!s || typeof s !== 'object') s = {};
      const spreadId = String(s.id || ('spread-' + (sIdx + 1)));
      const photoIds = Array.isArray(s.photoIds) ? s.photoIds.map(String).filter(id => photoIdSet.has(id)) : [];

      // Layout normalization
      let layout = s.layout || s.template || null;
      if (layout && typeof layout === 'object') {
        let rects = Array.isArray(layout.rects) ? layout.rects : (Array.isArray(layout.boxes) ? layout.boxes : []);
        rects = rects.map(r => {
          if (Array.isArray(r) && r.length >= 4) {
            return { x: Number(r[0]), y: Number(r[1]), w: Number(r[2]), h: Number(r[3]) };
          }
          if (r && typeof r === 'object') {
            return {
              x: Number(r.x !== undefined ? r.x : 0),
              y: Number(r.y !== undefined ? r.y : 0),
              w: Number(r.w !== undefined ? r.w : (r.width !== undefined ? r.width : 0.5)),
              h: Number(r.h !== undefined ? r.h : (r.height !== undefined ? r.height : 0.5))
            };
          }
          return { x: 0.05, y: 0.05, w: 0.4, h: 0.9 };
        });

        layout = {
          id: layout.id || ('layout-' + sIdx),
          name: layout.name || 'Layout',
          isCustom: Boolean(layout.isCustom),
          rects: rects
        };
      }

      // Slots normalization
      let slots = Array.isArray(s.slots) ? s.slots : [];
      slots = slots.map((slot, slotIdx) => {
        if (!slot || typeof slot !== 'object') slot = {};
        const pId = slot.photoId ? String(slot.photoId) : (photoIds[slotIdx] || null);
        let rect = slot.rect;
        if (Array.isArray(rect) && rect.length >= 4) {
          rect = { x: Number(rect[0]), y: Number(rect[1]), w: Number(rect[2]), h: Number(rect[3]) };
        } else if (rect && typeof rect === 'object') {
          rect = {
            x: Number(rect.x || 0),
            y: Number(rect.y || 0),
            w: Number(rect.w || rect.width || 0.5),
            h: Number(rect.h || rect.height || 0.5)
          };
        } else if (layout && layout.rects && layout.rects[slotIdx]) {
          rect = { ...layout.rects[slotIdx] };
        } else {
          rect = { x: 0.05, y: 0.05, w: 0.4, h: 0.9 };
        }

        return {
          slotIndex: typeof slot.slotIndex === 'number' ? slot.slotIndex : slotIdx,
          isText: Boolean(slot.isText),
          text: slot.text !== undefined ? String(slot.text) : '',
          fontSize: Number(slot.fontSize || 26),
          fontFamily: slot.fontFamily || 'Playfair Display, Georgia, serif',
          textColor: slot.textColor || '#1e293b',
          textAlign: slot.textAlign || 'center',
          fontWeight: slot.fontWeight || 'bold',
          fontStyle: slot.fontStyle || 'normal',
          shape: slot.shape || rect?.shape || 'rectangle',
          photoId: pId,
          panX: Number(slot.panX || 0),
          panY: Number(slot.panY || 0),
          zoom: Number(slot.zoom || 1.0),
          rotation: Number(slot.rotation || 0),
          flipH: Boolean(slot.flipH),
          flipV: Boolean(slot.flipV),
          cropMode: slot.cropMode || 'cover',
          brightness: slot.brightness !== undefined ? Number(slot.brightness) : 100,
          contrast: slot.contrast !== undefined ? Number(slot.contrast) : 100,
          saturation: slot.saturation !== undefined ? Number(slot.saturation) : 100,
          warmth: slot.warmth !== undefined ? Number(slot.warmth) : 0,
          rect: rect
        };
      });

      const pNum = sIdx * 2 + 1;
      const pageLabel = s.pageLabel || `Page ${pNum} - ${pNum + 1}`;

      return {
        id: spreadId,
        pageLabel: pageLabel,
        layoutId: s.layoutId || layout?.id || 'auto',
        layout: layout,
        photoIds: photoIds,
        slots: slots,
        marginPercent: typeof s.marginPercent === 'number' ? s.marginPercent : data.marginPercent,
        middleMarginPercent: typeof s.middleMarginPercent === 'number' ? s.middleMarginPercent : data.middleMarginPercent,
        gapPx: typeof s.gapPx === 'number' ? s.gapPx : data.gapPx,
        orientation: s.orientation || data.orientation,
        customRotation: typeof s.customRotation === 'number' ? s.customRotation : 0
      };
    });

    return data;
  }

  importProject(jsonString, filePath = '') {
    try {
      const raw = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
      const data = this._migrateProjectSchema(raw);
      if (filePath) {
        data.savePath = filePath;
        data.hasBeenSaved = true;
      }
      this.recordSnapshot();
      this.project = data;
      const targetSpread = (typeof data.lastActiveSpreadIndex === 'number' && data.lastActiveSpreadIndex >= 0 && data.lastActiveSpreadIndex < (data.spreads?.length || 1))
        ? data.lastActiveSpreadIndex
        : 0;
      this.activeSpreadIndex = targetSpread;
      this._recomputeUsageCounts();
      this.notify('project-loaded');
      return true;
    } catch (e) {
      console.error('Failed to import project:', e);
      return false;
    }
  }

  newProject(config = 'Smart Ease Photobook') {
    this.recordSnapshot();
    let title = 'Smart Ease Photobook';
    let sizeId = '12x12';
    let pageMode = 'spread';
    let spreadCount = 10;
    let marginPercent = 2.0;
    let middleMarginPercent = 0.0;
    let gapPx = 8;
    let savePath = '';
    let saveFileHandle = null;

    if (typeof config === 'string') {
      title = config;
    } else if (typeof config === 'object' && config !== null) {
      if (config.title) title = config.title;
      if (config.sizeId) sizeId = config.sizeId;
      if (config.pageMode) pageMode = config.pageMode;
      if (config.spreadCount !== undefined) spreadCount = parseInt(config.spreadCount) || 10;
      if (config.marginPercent !== undefined) marginPercent = config.marginPercent;
      if (config.middleMarginPercent !== undefined) middleMarginPercent = config.middleMarginPercent;
      if (config.gapPx !== undefined) gapPx = config.gapPx;
      if (config.savePath) savePath = config.savePath;
      if (config.saveFileHandle) saveFileHandle = config.saveFileHandle;
    }

    const sizePreset = this.sizePresets.find(s => s.id === sizeId) || this.sizePresets[0];

    this.project = {
      id: 'album-' + Date.now(),
      title: title,
      savePath: savePath,
      saveFileHandle: saveFileHandle,
      selectedSize: sizePreset,
      pageMode: pageMode,
      orientation: 'landscape',
      marginPercent: marginPercent,
      middleMarginPercent: middleMarginPercent,
      gapPx: gapPx,
      safeZonePercent: 3.0,
      fullBleed: false,
      backgroundColor: '#ffffff',
      photoOrderMode: 'sequential',
      spreads: [],
      photos: []
    };
    this.activeSpreadIndex = 0;
    this.undoStack = [];
    this.redoStack = [];

    // Generate the requested number of spreads
    const totalSpreads = Math.max(1, Math.min(100, spreadCount));
    for (let i = 0; i < totalSpreads; i++) {
      this.addSpread();
    }

    this.notify('project-loaded');
  }

  updateSlotPixelRect(spreadIndex, slotIndex, pixelRect, canvasWidth, canvasHeight) {
    const spread = this.project.spreads[spreadIndex];
    if (!spread || !spread.layout) return;

    if (!spread.layout.isCustom) {
      // Lock all current slot positions exactly before applying custom movement
      const currentPixelRects = this.layoutEngine.computePixelRectangles(
        spread.layout,
        canvasWidth,
        canvasHeight,
        {
          marginPercent: this.getSpreadMarginPercent(spreadIndex),
          middleMarginPercent: this.getSpreadMiddleMarginPercent(spreadIndex),
          gapPx: this.getSpreadGapPx(spreadIndex),
          fullBleed: this.project.fullBleed,
          pageMode: this.project.pageMode
        }
      );
      const initialNormRects = currentPixelRects.map(pr => this.layoutEngine.pixelRectToNormalized(pr, canvasWidth, canvasHeight, {
        isCustom: true,
        directCanvas: true
      }));

      spread.layout = {
        id: (spread.layout.id || 'layout') + '-custom-' + Date.now(),
        name: (spread.layout.name || 'Layout') + ' (Custom)',
        isCustom: true,
        rects: initialNormRects
      };
      spread.layoutId = spread.layout.id;
    }

    const normRect = this.layoutEngine.pixelRectToNormalized(pixelRect, canvasWidth, canvasHeight, {
      isCustom: true,
      directCanvas: true
    });

    const slot = spread.slots.find(s => s.slotIndex === slotIndex);
    const existingShape = pixelRect.shape || slot?.rect?.shape || slot?.shape || spread.layout.rects[slotIndex]?.shape;
    if (existingShape) {
      normRect.shape = existingShape;
    }

    if (spread.layout.rects[slotIndex]) {
      spread.layout.rects[slotIndex] = normRect;
    }

    if (slot) {
      slot.rect = normRect;
      if (existingShape) slot.shape = existingShape;
    }
  }

  /**
   * Adds a new custom frame rectangle drawn by the user directly onto the spread layout.
   */
  addCustomFrame(spreadIndex, pixelRect, canvasWidth, canvasHeight, photoId = null) {
    const spread = this.project.spreads[spreadIndex];
    if (!spread) return null;
    this.recordSnapshot();

    // Ensure layout is converted to custom
    if (!spread.layout || !spread.layout.isCustom) {
      const currentPixelRects = this.layoutEngine.computePixelRectangles(
        spread.layout || { rects: [] },
        canvasWidth,
        canvasHeight,
        {
          marginPercent: this.getSpreadMarginPercent(spreadIndex),
          middleMarginPercent: this.getSpreadMiddleMarginPercent(spreadIndex),
          gapPx: this.getSpreadGapPx(spreadIndex),
          fullBleed: this.project.fullBleed,
          pageMode: this.project.pageMode
        }
      );
      const initialNormRects = currentPixelRects.map(pr => this.layoutEngine.pixelRectToNormalized(pr, canvasWidth, canvasHeight, {
        isCustom: true,
        directCanvas: true
      }));

      spread.layout = {
        id: (spread.layout?.id || 'layout') + '-custom-' + Date.now(),
        name: (spread.layout?.name || 'Layout') + ' (Custom)',
        isCustom: true,
        rects: initialNormRects
      };
      spread.layoutId = spread.layout.id;
    }

    const normRect = this.layoutEngine.pixelRectToNormalized(pixelRect, canvasWidth, canvasHeight, {
      isCustom: true,
      directCanvas: true
    });

    const newSlotIndex = spread.layout.rects.length;
    spread.layout.rects.push(normRect);

    // If photoId is explicitly null, keep empty frame; if undefined, look for unused photo
    let assignedPhotoId = null;
    if (photoId) {
      assignedPhotoId = photoId;
    } else if (photoId === undefined) {
      const unused = this.project.photos.find(p => (p.usageCount || 0) === 0);
      if (unused) assignedPhotoId = unused.id;
    }

    if (assignedPhotoId && !spread.photoIds.includes(assignedPhotoId)) {
      spread.photoIds.push(assignedPhotoId);
    }

    const newSlot = {
      slotIndex: newSlotIndex,
      photoId: assignedPhotoId || null,
      panX: 0,
      panY: 0,
      zoom: 1.0,
      rotation: 0,
      flipH: false,
      flipV: false,
      brightness: 100,
      contrast: 100,
      saturation: 100,
      warmth: 0,
      cropMode: 'cover',
      shape: pixelRect.shape || normRect.shape || 'rectangle',
      customPath: pixelRect.customPath || normRect.customPath || null,
      rect: normRect
    };

    if (!spread.slots) spread.slots = [];
    spread.slots.push(newSlot);

    this._recomputeUsageCounts();
    this.notify('layout-changed', spread);
    this.notify('slot-added', { spreadIndex, slotIndex: newSlotIndex, slot: newSlot });
    return newSlotIndex;
  }

  /**
   * Adds an interactive text frame onto the active spread (titles, captions, quotes, dates).
   */
  addTextFrame(spreadIndex, textOptions = {}, canvasWidth = 1200, canvasHeight = 600) {
    const spread = this.project.spreads[spreadIndex];
    if (!spread) return null;
    this.recordSnapshot();

    if (!spread.layout || !spread.layout.isCustom) {
      const currentPixelRects = this.layoutEngine.computePixelRectangles(
        spread.layout || { rects: [] },
        canvasWidth,
        canvasHeight,
        {
          marginPercent: this.getSpreadMarginPercent(spreadIndex),
          middleMarginPercent: this.getSpreadMiddleMarginPercent(spreadIndex),
          gapPx: this.getSpreadGapPx(spreadIndex),
          fullBleed: this.project.fullBleed,
          pageMode: this.project.pageMode
        }
      );
      const initialNormRects = currentPixelRects.map(pr => this.layoutEngine.pixelRectToNormalized(pr, canvasWidth, canvasHeight, {
        isCustom: true,
        directCanvas: true
      }));

      spread.layout = {
        id: (spread.layout?.id || 'layout') + '-custom-' + Date.now(),
        name: (spread.layout?.name || 'Layout') + ' (Custom)',
        isCustom: true,
        rects: initialNormRects
      };
      spread.layoutId = spread.layout.id;
    }

    const isSpread = (this.project.pageMode !== 'single');
    const normRect = textOptions.rect || {
      x: isSpread ? 0.35 : 0.15,
      y: 0.82,
      width: isSpread ? 0.30 : 0.70,
      height: 0.10,
      w: isSpread ? 0.30 : 0.70,
      h: 0.10,
      shape: 'rectangle'
    };

    const newSlotIndex = spread.layout.rects.length;
    spread.layout.rects.push(normRect);

    const newSlot = {
      slotIndex: newSlotIndex,
      isText: true,
      text: textOptions.text || 'Add Title / Caption Here',
      fontSize: textOptions.fontSize || 28,
      fontFamily: textOptions.fontFamily || 'Playfair Display, Georgia, serif',
      textColor: textOptions.textColor || '#1e293b',
      textAlign: textOptions.textAlign || 'center',
      fontWeight: textOptions.fontWeight || 'bold',
      fontStyle: textOptions.fontStyle || 'normal',
      shape: 'rectangle',
      photoId: null,
      panX: 0,
      panY: 0,
      zoom: 1.0,
      rotation: 0,
      flipH: false,
      flipV: false,
      cropMode: 'cover',
      rect: { ...normRect }
    };

    if (!spread.slots) spread.slots = [];
    spread.slots.push(newSlot);

    this.notify('text-frame-added', { spreadIndex, slotIndex: newSlotIndex, slot: newSlot });
    return newSlotIndex;
  }

  /**
   * Updates text properties on an existing text frame.
   */
  updateTextFrame(spreadIndex, slotIndex, textData = {}) {
    const spread = this.project.spreads[spreadIndex];
    if (!spread) return;
    const slot = spread.slots.find(s => s.slotIndex === slotIndex);
    if (!slot) return;
    this.recordSnapshot();

    if (textData.text !== undefined) slot.text = textData.text;
    if (textData.fontSize !== undefined) slot.fontSize = Number(textData.fontSize);
    if (textData.fontFamily !== undefined) slot.fontFamily = textData.fontFamily;
    if (textData.textColor !== undefined) slot.textColor = textData.textColor;
    if (textData.textAlign !== undefined) slot.textAlign = textData.textAlign;
    if (textData.fontWeight !== undefined) slot.fontWeight = textData.fontWeight;
    if (textData.fontStyle !== undefined) slot.fontStyle = textData.fontStyle;

    this.notify('text-frame-updated', { spreadIndex, slotIndex, slot });
  }

  /**
   * Duplicates an existing frame, shape, or text layer on the spread (Photoshop Ctrl+J layer duplication).
   * direction: 'left', 'right', or 'offset'
   */
  duplicateSlot(spreadIndex, slotIndex, direction = 'offset', canvasWidth = 1200, canvasHeight = 600) {
    const spread = this.project.spreads[spreadIndex];
    if (!spread || !spread.slots) return null;
    const sourceSlot = spread.slots.find(s => s.slotIndex === slotIndex);
    if (!sourceSlot) return null;

    // Convert to custom layout if not already custom
    if (!spread.layout || !spread.layout.isCustom) {
      const currentPixelRects = this.layoutEngine.computePixelRectangles(
        spread.layout || { rects: [] },
        canvasWidth,
        canvasHeight,
        {
          marginPercent: this.getSpreadMarginPercent(spreadIndex),
          middleMarginPercent: this.getSpreadMiddleMarginPercent(spreadIndex),
          gapPx: this.getSpreadGapPx(spreadIndex),
          fullBleed: this.project.fullBleed,
          pageMode: this.project.pageMode
        }
      );
      const initialNormRects = currentPixelRects.map(pr => this.layoutEngine.pixelRectToNormalized(pr, canvasWidth, canvasHeight, {
        isCustom: true,
        directCanvas: true
      }));

      spread.layout = {
        id: (spread.layout?.id || 'layout') + '-custom-' + Date.now(),
        name: (spread.layout?.name || 'Layout') + ' (Custom)',
        isCustom: true,
        rects: initialNormRects
      };
      spread.layoutId = spread.layout.id;
    }

    const sourceRect = (spread.layout.rects && spread.layout.rects[slotIndex])
      ? { ...spread.layout.rects[slotIndex] }
      : { x: 0.1, y: 0.1, width: 0.35, height: 0.7 };

    const w = sourceRect.width !== undefined ? sourceRect.width : (sourceRect.w || 0.35);
    const h = sourceRect.height !== undefined ? sourceRect.height : (sourceRect.h || 0.7);
    const gap = 0.015; // standard gutter spacing

    let targetX = sourceRect.x;
    let targetY = sourceRect.y;

    if (direction === 'right') {
      targetX = sourceRect.x + w + gap;
      targetY = sourceRect.y;
      if (targetX + w > 0.98) {
        targetX = Math.max(0.02, 0.98 - w);
        if (Math.abs(targetX - sourceRect.x) < 0.02) {
          targetX = Math.max(0.02, sourceRect.x - 0.04);
          targetY = Math.min(0.96 - h, sourceRect.y + 0.04);
        }
      }
    } else if (direction === 'left') {
      targetX = sourceRect.x - w - gap;
      targetY = sourceRect.y;
      if (targetX < 0.02) {
        targetX = 0.02;
        if (Math.abs(targetX - sourceRect.x) < 0.02) {
          targetX = Math.min(0.96 - w, sourceRect.x + 0.04);
          targetY = Math.min(0.96 - h, sourceRect.y + 0.04);
        }
      }
    } else if (direction === 'offset') {
      targetX = sourceRect.x + 0.03;
      targetY = sourceRect.y + 0.03;
      if (targetX + w > 0.98) targetX = Math.max(0.02, sourceRect.x - 0.03);
      if (targetY + h > 0.98) targetY = Math.max(0.02, sourceRect.y - 0.03);
    }

    const shape = sourceRect.shape || sourceSlot.shape || sourceSlot.rect?.shape || 'rectangle';

    const normRect = {
      x: Math.max(0.01, Math.min(0.99 - w, targetX)),
      y: Math.max(0.01, Math.min(0.99 - h, targetY)),
      width: w,
      height: h,
      w: w,
      h: h,
      shape: shape
    };
    if (sourceRect.borderRadius) normRect.borderRadius = sourceRect.borderRadius;
    if (sourceRect.rotation) normRect.rotation = sourceRect.rotation;

    this.recordSnapshot();

    const newSlotIndex = spread.layout.rects.length;
    spread.layout.rects.push(normRect);

    if (sourceSlot.photoId && !spread.photoIds.includes(sourceSlot.photoId)) {
      spread.photoIds.push(sourceSlot.photoId);
    }

    const newSlot = {
      slotIndex: newSlotIndex,
      isText: Boolean(sourceSlot.isText),
      text: sourceSlot.text || '',
      fontSize: sourceSlot.fontSize || 28,
      fontFamily: sourceSlot.fontFamily || 'Playfair Display, Georgia, serif',
      textColor: sourceSlot.textColor || '#1e293b',
      textAlign: sourceSlot.textAlign || 'center',
      fontWeight: sourceSlot.fontWeight || 'bold',
      fontStyle: sourceSlot.fontStyle || 'normal',
      shape: shape,
      photoId: sourceSlot.photoId || null,
      panX: sourceSlot.panX || 0,
      panY: sourceSlot.panY || 0,
      zoom: sourceSlot.zoom !== undefined ? sourceSlot.zoom : 1.0,
      rotation: sourceSlot.rotation || 0,
      flipH: Boolean(sourceSlot.flipH),
      flipV: Boolean(sourceSlot.flipV),
      brightness: sourceSlot.brightness !== undefined ? sourceSlot.brightness : 100,
      contrast: sourceSlot.contrast !== undefined ? sourceSlot.contrast : 100,
      saturation: sourceSlot.saturation !== undefined ? sourceSlot.saturation : 100,
      warmth: sourceSlot.warmth !== undefined ? sourceSlot.warmth : 0,
      cropMode: sourceSlot.cropMode || 'cover',
      rect: { ...normRect }
    };

    if (!spread.slots) spread.slots = [];
    spread.slots.push(newSlot);

    this._recomputeUsageCounts();
    this.notify('layout-changed', spread);
    this.notify('slot-added', { spreadIndex, slotIndex: newSlotIndex, slot: newSlot });
    return newSlotIndex;
  }

  /**
   * Deletes a frame/slot entirely from the spread layout.
   * If the frame contains a photo, the photo is unassigned and immediately returns to unused photos.
   */
  deleteFrame(spreadIndex, slotIndex) {
    return this.deleteFrames(spreadIndex, [slotIndex]);
  }

  deleteFrames(spreadIndex, slotIndices) {
    const spread = this.project.spreads[spreadIndex];
    if (!spread || !spread.slots || !spread.layout) return false;
    if (!slotIndices || slotIndices.length === 0) return false;

    this.recordSnapshot();

    const indicesSet = new Set(slotIndices);
    const removedPhotoIds = [];

    // Collect photos in deleted slots
    spread.slots.forEach(s => {
      if (indicesSet.has(s.slotIndex) && s.photoId) {
        removedPhotoIds.push(s.photoId);
      }
    });

    if (removedPhotoIds.length > 0) {
      spread.photoIds = spread.photoIds.filter(id => !removedPhotoIds.includes(id));
    }

    // Reconstruct remaining layout rectangles & slots
    const remainingRects = [];
    const remainingSlots = [];
    let newSlotIdx = 0;

    if (spread.layout.rects) {
      spread.layout.rects.forEach((r, idx) => {
        if (!indicesSet.has(idx)) {
          remainingRects.push(r);
          const oldSlot = spread.slots.find(s => s.slotIndex === idx);
          if (oldSlot) {
            oldSlot.slotIndex = newSlotIdx;
            remainingSlots.push(oldSlot);
          } else {
            remainingSlots.push({
              slotIndex: newSlotIdx,
              photoId: null,
              panX: 0,
              panY: 0,
              zoom: 1.0,
              rotation: 0,
              flipH: false,
              flipV: false,
              cropMode: 'cover'
            });
          }
          newSlotIdx++;
        }
      });
    }

    spread.layout = {
      id: (spread.layout.id || 'layout') + '-custom-' + Date.now(),
      name: (spread.layout.name || 'Layout') + ' (Custom)',
      isCustom: true,
      rects: remainingRects
    };
    spread.layoutId = spread.layout.id;
    spread.slots = remainingSlots;

    this._recomputeUsageCounts();
    this.notify('photo-removed', spread);
    this.notify('layout-changed', spread);
    this.notify('frames-deleted', { spreadIndex, deletedCount: indicesSet.size, removedPhotoIds });
    return true;
  }

  updateSlotAdjustments(spreadIndex, slotIndex, adjustments) {
    const spread = this.project.spreads[spreadIndex];
    if (!spread) return;
    const slot = spread.slots.find(s => s.slotIndex === slotIndex);
    if (!slot) return;
    Object.assign(slot, adjustments);
    this.notify('slot-adjusted', { spreadIndex, slotIndex, slot });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AlbumState;
} else {
  window.AlbumState = AlbumState;
}
