/**
 * SmartAlbums Canvas Renderer
 * High-performance HTML5 Canvas rendering for photobook spreads.
 * Handles:
 * - Crisp Retina / High-DPI display scaling
 * - Image cover-crop math with panning & zooming
 * - Center crease / gutter spine visualization
 * - Safe zone and bleed guidelines
 * - Drag-and-drop photo swapping and interactive repositioning
 * - Full-resolution 300 DPI print rendering for lab export
 */

class CanvasRenderer {
  constructor(canvasElement, albumState) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.albumState = albumState;

    this.imageCache = new Map(); // src -> Image object
    this.imageLoadPromises = new Map(); // src -> shared in-flight Image load
    this.cachedRectangles = [];  // pixel rects for hit testing

    // Interactive state
    this.hoveredSlotIndex = null;
    this.selectedSlotIndex = null;
    this.selectedSlotIndices = new Set(); // Multi-slot selection set

    // Marquee Drag Selection State
    this.isMarqueeSelecting = false;
    this.marqueeStartPos = null;
    this.marqueeCurrentPos = null;
    this.marqueeMode = false;
    this._initialSelectedSlots = null;
    this.initialMultiSlotRects = null;

    // Frame Moving State
    this.isMovingSlot = false;
    this.moveSlotIndex = null;
    this.moveStartPos = { x: 0, y: 0 };
    this.initialSlotPixelRect = null;

    // Photo Drag & Swap Interchange State
    this.isPotentialDrag = false;
    this.pointerDownPos = { x: 0, y: 0 };
    this.pointerDownSlot = null;
    this.isDraggingPhotoSwap = false;
    this.dragSwapSourceIndex = null;
    this.dragSwapTargetIndex = null;
    this.dragCurrentPos = { x: 0, y: 0 };

    // Panning inside frame
    this.isPanningPhoto = false;
    this.initialPan = { x: 0, y: 0 };

    // Freeform 8-handle frame resize state (aspect ratio can be freely changed)
    this.isResizingSlot = false;
    this.resizeCorner = null; // 'tl', 'tr', 'bl', 'br', 'tm', 'bm', 'lm', 'rm'
    this.resizeSlotIndex = null;
    this.resizeStartPos = { x: 0, y: 0 };
    this.initialPixelRect = null;
    this.slotAspectRatio = 1.0;
    this.initialGroupBounds = null; // Bounding box for multi-slot group resizing
    this.activeSnapGuides = []; // Dynamic Photoshop-like alignment guide snap lines

    this.showGuides = true;
    this.showCrease = true;

    // Drag swap visual feedback
    this.dragOverSlotIndex = null;

    // Hover layout blueprint preview
    this.hoverLayoutPreview = null;

    // Draw Rectangle / Add Photo Frame Tool State
    this.drawNewFrameMode = false;
    this.isDrawingNewFrame = false;
    this.drawFrameStartPos = null;
    this.drawFrameCurrentPos = null;
    this.currentDrawShape = 'rectangle';

    // Tool Modes: 'select' (Cursor / Pointer) vs 'hand' (Mouse Hand / Pan)
    this.activeTool = 'select';
    this.isPanningCanvas = false;
    this.panStartPos = { x: 0, y: 0 };

    // Spread Rulers in Inches State
    this.showRulers = true;

    // Right-Click Drag to Draw Frames State
    this.isRightMouseDown = false;
    this.rightMouseDownPos = { x: 0, y: 0 };
    this.isRightClickDrawing = false;
    this._justFinishedRightDrag = false;

    // Slot Corner & Stem Freeform Rotation State
    this.isRotatingSlot = false;
    this.rotateSlotIndex = null;
    this.rotateCenter = null;
    this.rotateStartAngle = 0;
    this.rotateInitialSlotRotation = 0;

    this._bindEvents();
  }

  setTool(tool) {
    this.activeTool = (tool === 'hand' || tool === 'text') ? tool : 'select';
    const btnSelect = document.getElementById('btnToolSelect');
    const btnHand = document.getElementById('btnToolHand');
    const btnText = document.getElementById('btnAddTextCanvas');
    if (btnSelect) btnSelect.classList.toggle('active', this.activeTool === 'select');
    if (btnHand) btnHand.classList.toggle('active', this.activeTool === 'hand');
    if (btnText) btnText.classList.toggle('active', this.activeTool === 'text');
    if (this.activeTool !== 'select') {
      this.toggleDrawNewFrameMode(false);
    }
    if (this.activeTool === 'hand') {
      this.isPotentialDrag = false;
      this.isMovingSlot = false;
      this.isResizingSlot = false;
      this.isRotatingSlot = false;
      this.isPanningPhoto = false;
      this.isMarqueeSelecting = false;
      this.isPanningCanvas = false;
    }
    this.canvas.style.cursor = this.activeTool === 'hand' ? 'grab' : (this.activeTool === 'text' ? 'text' : 'default');
    this.requestRender();
  }

  toggleRulers(show) {
    this.showRulers = (show !== undefined) ? Boolean(show) : !this.showRulers;
    const wrapper = document.getElementById('canvasWrapper');
    if (wrapper) {
      wrapper.classList.toggle('rulers-hidden', !this.showRulers);
    }
    const btn = document.getElementById('btnDockRulers');
    if (btn) btn.classList.toggle('active', this.showRulers);

    if (this.showRulers) {
      this.renderRulers();
    }
    if (typeof window.resizeCanvasStage === 'function') {
      window.resizeCanvasStage();
    }
  }

  renderRulers(cursorPos = null) {
    if (!this.showRulers) return;
    const rulerTopCanvas = document.getElementById('rulerTop');
    const rulerLeftCanvas = document.getElementById('rulerLeft');
    if (!rulerTopCanvas || !rulerLeftCanvas) return;

    const dpr = window.devicePixelRatio || 1;
    const width = this.displayWidth || this.canvas.clientWidth || 1000;
    const height = this.displayHeight || this.canvas.clientHeight || 500;

    if (rulerTopCanvas.width !== Math.round(width * dpr) || rulerTopCanvas.style.width !== width + 'px') {
      rulerTopCanvas.width = Math.round(width * dpr);
      rulerTopCanvas.height = Math.round(22 * dpr);
      rulerTopCanvas.style.width = width + 'px';
      rulerTopCanvas.style.height = '22px';
    }
    if (rulerLeftCanvas.height !== Math.round(height * dpr) || rulerLeftCanvas.style.height !== height + 'px') {
      rulerLeftCanvas.width = Math.round(22 * dpr);
      rulerLeftCanvas.height = Math.round(height * dpr);
      rulerLeftCanvas.style.width = '22px';
      rulerLeftCanvas.style.height = height + 'px';
    }

    const sheetWInches = this.albumState.getSheetWidthInches() || 24;
    const sheetHInches = this.albumState.getSheetHeightInches() || 12;

    const pxPerInchX = width / sheetWInches;
    const pxPerInchY = height / sheetHInches;

    // 1. Draw Top Horizontal Ruler (Inches)
    const ctxTop = rulerTopCanvas.getContext('2d');
    ctxTop.save();
    ctxTop.scale(dpr, dpr);
    ctxTop.clearRect(0, 0, width, 22);

    ctxTop.fillStyle = '#11151f';
    ctxTop.fillRect(0, 0, width, 22);

    ctxTop.fillStyle = '#94a3b8';
    ctxTop.font = '600 9px monospace, sans-serif';
    ctxTop.textAlign = 'left';
    ctxTop.textBaseline = 'top';

    for (let i = 0; i <= Math.ceil(sheetWInches); i++) {
      const rx = i * pxPerInchX;
      if (rx > width) break;

      // Major Inch Tick
      ctxTop.strokeStyle = '#64748b';
      ctxTop.lineWidth = 1;
      ctxTop.beginPath();
      ctxTop.moveTo(rx, 10);
      ctxTop.lineTo(rx, 22);
      ctxTop.stroke();

      if (i > 0) {
        ctxTop.fillText(`${i}"`, rx + 2, 2);
      }

      // Half-inch tick
      const hx = rx + pxPerInchX * 0.5;
      if (hx <= width) {
        ctxTop.strokeStyle = '#475569';
        ctxTop.beginPath();
        ctxTop.moveTo(hx, 14);
        ctxTop.lineTo(hx, 22);
        ctxTop.stroke();
      }

      // Quarter-inch ticks
      if (pxPerInchX > 30) {
        ctxTop.strokeStyle = '#334155';
        for (const frac of [0.25, 0.75]) {
          const qx = rx + pxPerInchX * frac;
          if (qx <= width) {
            ctxTop.beginPath();
            ctxTop.moveTo(qx, 17);
            ctxTop.lineTo(qx, 22);
            ctxTop.stroke();
          }
        }
      }
    }

    // Spine mark on spread mode
    if (this.albumState.project.pageMode !== 'single') {
      const spineX = width / 2;
      ctxTop.strokeStyle = '#0284c7';
      ctxTop.lineWidth = 1.5;
      ctxTop.beginPath();
      ctxTop.moveTo(spineX, 0);
      ctxTop.lineTo(spineX, 22);
      ctxTop.stroke();

      ctxTop.fillStyle = '#38bdf8';
      ctxTop.font = 'bold 8px sans-serif';
      ctxTop.textAlign = 'center';
      ctxTop.fillText('SPINE', spineX, 2);
    }

    // Live Cursor Hairline on Top Ruler
    if (cursorPos && cursorPos.x >= 0 && cursorPos.x <= width) {
      ctxTop.strokeStyle = '#ef4444';
      ctxTop.lineWidth = 1.5;
      ctxTop.beginPath();
      ctxTop.moveTo(cursorPos.x, 0);
      ctxTop.lineTo(cursorPos.x, 22);
      ctxTop.stroke();

      const inVal = (cursorPos.x / pxPerInchX).toFixed(1) + '"';
      ctxTop.fillStyle = 'rgba(239, 68, 68, 0.9)';
      const pillW = 30;
      const pillX = Math.max(0, Math.min(width - pillW, cursorPos.x - pillW / 2));
      if (ctxTop.roundRect) ctxTop.roundRect(pillX, 1, pillW, 11, 2);
      else ctxTop.rect(pillX, 1, pillW, 11);
      ctxTop.fill();
      ctxTop.fillStyle = '#ffffff';
      ctxTop.font = 'bold 8px sans-serif';
      ctxTop.textAlign = 'center';
      ctxTop.fillText(inVal, pillX + pillW / 2, 2);
    }
    ctxTop.restore();

    // 2. Draw Left Vertical Ruler (Inches)
    const ctxLeft = rulerLeftCanvas.getContext('2d');
    ctxLeft.save();
    ctxLeft.scale(dpr, dpr);
    ctxLeft.clearRect(0, 0, 22, height);

    ctxLeft.fillStyle = '#11151f';
    ctxLeft.fillRect(0, 0, 22, height);

    ctxLeft.fillStyle = '#94a3b8';
    ctxLeft.font = '600 8px monospace, sans-serif';
    ctxLeft.textAlign = 'right';
    ctxLeft.textBaseline = 'top';

    for (let i = 0; i <= Math.ceil(sheetHInches); i++) {
      const ry = i * pxPerInchY;
      if (ry > height) break;

      // Major Inch Tick
      ctxLeft.strokeStyle = '#64748b';
      ctxLeft.lineWidth = 1;
      ctxLeft.beginPath();
      ctxLeft.moveTo(10, ry);
      ctxLeft.lineTo(22, ry);
      ctxLeft.stroke();

      if (i > 0) {
        ctxLeft.fillText(`${i}`, 9, ry + 2);
      }

      // Half-inch tick
      const hy = ry + pxPerInchY * 0.5;
      if (hy <= height) {
        ctxLeft.strokeStyle = '#475569';
        ctxLeft.beginPath();
        ctxLeft.moveTo(14, hy);
        ctxLeft.lineTo(22, hy);
        ctxLeft.stroke();
      }

      // Quarter-inch ticks
      if (pxPerInchY > 30) {
        ctxLeft.strokeStyle = '#334155';
        for (const frac of [0.25, 0.75]) {
          const qy = ry + pxPerInchY * frac;
          if (qy <= height) {
            ctxLeft.beginPath();
            ctxLeft.moveTo(17, qy);
            ctxLeft.lineTo(22, qy);
            ctxLeft.stroke();
          }
        }
      }
    }

    // Live Cursor Hairline on Left Ruler
    if (cursorPos && cursorPos.y >= 0 && cursorPos.y <= height) {
      ctxLeft.strokeStyle = '#ef4444';
      ctxLeft.lineWidth = 1.5;
      ctxLeft.beginPath();
      ctxLeft.moveTo(0, cursorPos.y);
      ctxLeft.lineTo(22, cursorPos.y);
      ctxLeft.stroke();

      const inVal = (cursorPos.y / pxPerInchY).toFixed(1);
      ctxLeft.fillStyle = 'rgba(239, 68, 68, 0.9)';
      const pillH = 10;
      const pillY = Math.max(0, Math.min(height - pillH, cursorPos.y - pillH / 2));
      if (ctxLeft.roundRect) ctxLeft.roundRect(1, pillY, 18, pillH, 2);
      else ctxLeft.rect(1, pillY, 18, pillH);
      ctxLeft.fill();
      ctxLeft.fillStyle = '#ffffff';
      ctxLeft.font = 'bold 7px sans-serif';
      ctxLeft.textAlign = 'center';
      ctxLeft.fillText(inVal, 10, pillY + 1);
    }
    ctxLeft.restore();
  }

  setCanvasDimensions(width, height) {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';
    this.ctx.scale(dpr, dpr);
    this.displayWidth = width;
    this.displayHeight = height;
    this.render();
    if (this.showRulers) {
      this.renderRulers();
    }
  }

  toggleGuides(show) {
    this.showGuides = show !== undefined ? show : !this.showGuides;
    this.requestRender();
  }

  toggleCrease(show) {
    this.showCrease = show !== undefined ? show : !this.showCrease;
    this.requestRender();
  }

  setHoverLayoutPreview(template) {
    this.hoverLayoutPreview = template;
    this.requestRender();
  }

  setDrawShape(shape, customPath = null) {
    this.currentDrawShape = shape || 'rectangle';
    this.currentCustomPath = customPath || null;
  }

  toggleDrawNewFrameMode(enable, shape = null, customPath = null) {
    if (shape) this.currentDrawShape = shape;
    if (customPath !== null) this.currentCustomPath = customPath;
    this.drawNewFrameMode = (enable !== undefined) ? Boolean(enable) : !this.drawNewFrameMode;
    this.isDrawingNewFrame = false;
    this.drawFrameStartPos = null;
    this.drawFrameCurrentPos = null;
    if (this.drawNewFrameMode) {
      if (this.marqueeMode) {
        this.marqueeMode = false;
        this.albumState.notify('select-mode-changed', false);
      }
      this.selectedSlotIndex = null;
      this.selectedSlotIndices.clear();
      this.canvas.style.cursor = 'crosshair';
    } else {
      this.canvas.style.cursor = 'default';
    }
    this.albumState.notify('draw-mode-changed', this.drawNewFrameMode);
    this.requestRender();
  }

  toggleSelectMode(enable) {
    this.marqueeMode = (enable !== undefined) ? Boolean(enable) : !this.marqueeMode;
    this.isMarqueeSelecting = false;
    this.marqueeStartPos = null;
    this.marqueeCurrentPos = null;
    if (this.marqueeMode) {
      if (this.drawNewFrameMode) {
        this.drawNewFrameMode = false;
        this.albumState.notify('draw-mode-changed', false);
      }
      this.canvas.style.cursor = 'crosshair';
    } else {
      this.canvas.style.cursor = 'default';
    }
    this.albumState.notify('select-mode-changed', this.marqueeMode);
    this.requestRender();
  }

  requestRender() {
    if (this._renderPending) return;
    this._renderPending = true;
    requestAnimationFrame(() => {
      this._renderPending = false;
      this.render();
    });
  }

  /**
   * Main render pass
   */
  render() {
    if (!this.displayWidth || !this.displayHeight) return;

    const ctx = this.ctx;
    const spread = this.albumState.getActiveSpread();
    const project = this.albumState.project;

    // Clear canvas
    ctx.clearRect(0, 0, this.displayWidth, this.displayHeight);

    // Spread Background
    ctx.fillStyle = project.backgroundColor || '#ffffff';
    ctx.fillRect(0, 0, this.displayWidth, this.displayHeight);

    const hasSlots = spread && spread.layout && Array.isArray(spread.slots) && spread.slots.length > 0;
    if (!hasSlots) {
      this.cachedRectangles = [];
      if (!this.isDrawingNewFrame && !this.isMarqueeSelecting) {
        this._renderEmptyPlaceholder();
      }
    } else {
      // Compute pixel rectangles from layout
      const rects = this.albumState.layoutEngine.computePixelRectangles(
        spread.layout,
        this.displayWidth,
        this.displayHeight,
        {
          marginPercent: this.albumState.getSpreadMarginPercent(this.albumState.activeSpreadIndex),
          middleMarginPercent: this.albumState.getSpreadMiddleMarginPercent(this.albumState.activeSpreadIndex),
          gapPx: this.albumState.getSpreadGapPx(this.albumState.activeSpreadIndex),
          fullBleed: project.fullBleed,
          pageMode: project.pageMode
        }
      );
      this.cachedRectangles = rects;

      // Draw each slot
      rects.forEach((rect, idx) => {
        const slot = spread.slots.find(s => s.slotIndex === idx);
        const isHovered = this.activeTool !== 'hand' && this.hoveredSlotIndex === idx;
        const isDropTarget = this.activeTool !== 'hand' && (this.dragOverSlotIndex === idx || (this.isDraggingPhotoSwap && this.dragSwapTargetIndex === idx));
        const isSelected = this.activeTool !== 'hand' && ((this.selectedSlotIndex === idx) || (this.selectedSlotIndices && this.selectedSlotIndices.has(idx)));
        this._renderSlot(ctx, rect, slot, isHovered, isDropTarget, isSelected);
      });
    }

    // Proactively preload neighboring spreads in background so spread clicking is instantaneous
    this.preloadAdjacentSpreads();

    // Draw spine / center crease (only in spread mode)
    if (this.showCrease && project.pageMode !== 'single') {
      this._renderCenterCrease(ctx);
    }

    // Draw safe-zone guide
    if (this.showGuides && !project.fullBleed) {
      this._renderSafeZoneGuides(ctx);
    }

    // Live Transparent Blueprint Layout Options Preview Overlay
    if (this.hoverLayoutPreview) {
      this._renderGhostLayoutPreview(ctx, this.hoverLayoutPreview);
    }

    // Interactive Drawing New Frame Rectangle Ghost
    if (this.isDrawingNewFrame && this.drawFrameStartPos && this.drawFrameCurrentPos) {
      this._renderDrawingFrameGhost(ctx);
    }

    // Marquee Drag Selection Ghost
    if (this.isMarqueeSelecting && this.marqueeStartPos && this.marqueeCurrentPos) {
      this._renderMarqueeSelectionGhost(ctx);
    }

    // Dynamic Photoshop-style Smart Alignment Guides
    if (this.activeSnapGuides && this.activeSnapGuides.length > 0) {
      this._renderSnapGuides(ctx);
    }

    // Drag-to-swap floating preview thumbnail
    if (this.isDraggingPhotoSwap && this.dragSwapSourceIndex !== null) {
      this._renderDragSwapGhost(ctx);
    }

    // Spread rulers in inches
    if (this.showRulers) {
      this.renderRulers();
    }
  }

  _buildFramePath(ctx, rect, shape) {
    ctx.beginPath();
    const s = String(shape || rect.shape || 'rectangle').toLowerCase().trim();
    const x = rect.x;
    const y = rect.y;
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);
    const cx = x + w / 2;
    const cy = y + h / 2;
    const rx = Math.max(1, w / 2);
    const ry = Math.max(1, h / 2);

    // 0. Custom / Combined Shapes (SVG, Canvas, Python/Pillow, Cairo, JS)
    if (s === 'custom' || s === 'custom-path' || s === 'combine' || s === 'combined' || rect.customPath) {
      const customData = rect.customPath || this.currentCustomPath;
      if (this._renderCustomPathOnCtx(ctx, rect, customData)) {
        return;
      }
    }

    // 1. Basic / Geometric Shapes
    if (s === 'circle') {
      const r = Math.min(rx, ry);
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.closePath();
    } else if (s === 'ellipse') {
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.closePath();
    } else if (s === 'square') {
      const side = Math.min(w, h);
      ctx.rect(x + (w - side) / 2, y + (h - side) / 2, side, side);
    } else if (s === 'rectangle') {
      ctx.rect(x, y, w, h);
    } else if (s === 'rounded' || s === 'rounded-rectangle' || s === 'rounded_rectangle' || rect.borderRadius) {
      const radius = rect.borderRadius || Math.min(w, h) * 0.14;
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(x, y, w, h, radius);
      } else {
        ctx.rect(x, y, w, h);
      }
    } else if (s === 'triangle') {
      ctx.moveTo(cx, y);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x, y + h);
      ctx.closePath();
    } else if (s === 'line') {
      const thick = Math.max(6, Math.min(w, h) * 0.14);
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(x, cy - thick / 2, w, thick, thick / 2);
      } else {
        ctx.rect(x, cy - thick / 2, w, thick);
      }
    } else if (s === 'arch' || s === 'arc') {
      const archR = Math.min(rx, ry);
      ctx.moveTo(x, y + h);
      ctx.lineTo(x, y + archR);
      ctx.arc(cx, y + archR, rx, Math.PI, 0);
      ctx.lineTo(x + w, y + h);
      ctx.closePath();
    } else if (s === 'ring' || s === 'donut') {
      const rOut = Math.min(rx, ry);
      const rIn = rOut * 0.54;
      ctx.arc(cx, cy, rOut, 0, Math.PI * 2, false);
      ctx.arc(cx, cy, rIn, 0, Math.PI * 2, true);
      ctx.closePath();
    } else if (s === 'semi-circle' || s === 'semicircle') {
      const scR = Math.min(rx, h);
      ctx.arc(cx, y + h, scR, Math.PI, 0, false);
      ctx.closePath();
    } else if (s === 'crescent') {
      const crR = Math.min(rx, ry);
      ctx.arc(cx, cy, crR, -Math.PI / 2, Math.PI / 2, false);
      ctx.bezierCurveTo(cx + crR * 0.25, cy + crR * 0.65, cx + crR * 0.25, cy - crR * 0.65, cx, cy - crR);
      ctx.closePath();
    }

    // 2. Polygons
    else if (s === 'polygon') {
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI / 2 + i * (2 * Math.PI / 7);
        const px = cx + rx * Math.cos(a);
        const py = cy + ry * Math.sin(a);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
    } else if (s === 'star') {
      for (let i = 0; i < 10; i++) {
        const rDistX = (i % 2 === 0) ? rx : rx * 0.42;
        const rDistY = (i % 2 === 0) ? ry : ry * 0.42;
        const a = -Math.PI / 2 + i * (Math.PI / 5);
        const px = cx + rDistX * Math.cos(a);
        const py = cy + rDistY * Math.sin(a);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
    } else if (s === 'hexagon') {
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 + i * (Math.PI / 3);
        const px = cx + rx * Math.cos(a);
        const py = cy + ry * Math.sin(a);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
    } else if (s === 'octagon') {
      for (let i = 0; i < 8; i++) {
        const a = -Math.PI / 2 + Math.PI / 8 + i * (Math.PI / 4);
        const px = cx + rx * Math.cos(a);
        const py = cy + ry * Math.sin(a);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
    } else if (s === 'pentagon') {
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + i * (2 * Math.PI / 5);
        const px = cx + rx * Math.cos(a);
        const py = cy + ry * Math.sin(a);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
    } else if (s === 'diamond') {
      ctx.moveTo(cx, y);
      ctx.lineTo(x + w, cy);
      ctx.lineTo(cx, y + h);
      ctx.lineTo(x, cy);
      ctx.closePath();
    } else if (s === 'trapezoid') {
      ctx.moveTo(x + w * 0.20, y);
      ctx.lineTo(x + w * 0.80, y);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x, y + h);
      ctx.closePath();
    } else if (s === 'parallelogram' || s === 'skew') {
      const slant = Math.min(w * 0.22, 50);
      ctx.moveTo(x + slant, y);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x + w - slant, y + h);
      ctx.lineTo(x, y + h);
      ctx.closePath();
    }

    // 3. Creative & Symbols
    else if (s === 'heart') {
      ctx.moveTo(cx, y + h * 0.28);
      ctx.bezierCurveTo(cx, y + h * 0.08, x, y, x, y + h * 0.38);
      ctx.bezierCurveTo(x, y + h * 0.68, cx, y + h * 0.86, cx, y + h);
      ctx.bezierCurveTo(cx, y + h * 0.86, x + w, y + h * 0.68, x + w, y + h * 0.38);
      ctx.bezierCurveTo(x + w, y, cx, y + h * 0.08, cx, y + h * 0.28);
      ctx.closePath();
    } else if (s === 'arrow') {
      ctx.moveTo(x, y + h * 0.32);
      ctx.lineTo(x + w * 0.58, y + h * 0.32);
      ctx.lineTo(x + w * 0.58, y + h * 0.12);
      ctx.lineTo(x + w, cy);
      ctx.lineTo(x + w * 0.58, y + h * 0.88);
      ctx.lineTo(x + w * 0.58, y + h * 0.68);
      ctx.lineTo(x, y + h * 0.68);
      ctx.closePath();
    } else if (s === 'speech-bubble' || s === 'speech_bubble' || s === 'bubble') {
      const br = Math.min(w, h) * 0.12;
      const bH = h * 0.82;
      ctx.moveTo(x + br, y);
      ctx.lineTo(x + w - br, y);
      ctx.arcTo(x + w, y, x + w, y + br, br);
      ctx.lineTo(x + w, y + bH - br);
      ctx.arcTo(x + w, y + bH, x + w - br, y + bH, br);
      ctx.lineTo(x + w * 0.40, y + bH);
      ctx.lineTo(x + w * 0.18, y + h);
      ctx.lineTo(x + w * 0.24, y + bH);
      ctx.lineTo(x + br, y + bH);
      ctx.arcTo(x, y + bH, x, y + bH - br, br);
      ctx.lineTo(x, y + br);
      ctx.arcTo(x, y, x + br, y, br);
      ctx.closePath();
    } else if (s === 'cloud') {
      ctx.moveTo(x + w * 0.22, y + h * 0.72);
      ctx.bezierCurveTo(x + w * 0.04, y + h * 0.72, x, y + h * 0.54, x + w * 0.06, y + h * 0.42);
      ctx.bezierCurveTo(x, y + h * 0.28, x + w * 0.14, y + h * 0.14, x + w * 0.30, y + h * 0.20);
      ctx.bezierCurveTo(x + w * 0.38, y + h * 0.04, x + w * 0.62, y + h * 0.04, x + w * 0.70, y + h * 0.20);
      ctx.bezierCurveTo(x + w * 0.86, y + h * 0.14, x + w, y + h * 0.28, x + w * 0.94, y + h * 0.42);
      ctx.bezierCurveTo(x + w, y + h * 0.54, x + w * 0.96, y + h * 0.72, x + w * 0.78, y + h * 0.72);
      ctx.closePath();
    } else if (s === 'spiral') {
      const turns = 2.4;
      const steps = 60;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const a = t * turns * Math.PI * 2;
        const dist = t * 0.96;
        const px = cx + rx * dist * Math.cos(a);
        const py = cy + ry * dist * Math.sin(a);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      for (let i = steps; i >= 0; i--) {
        const t = i / steps;
        const a = t * turns * Math.PI * 2;
        const dist = Math.max(0, t * 0.96 - 0.20);
        const px = cx + rx * dist * Math.cos(a);
        const py = cy + ry * dist * Math.sin(a);
        ctx.lineTo(px, py);
      }
      ctx.closePath();
    } else if (s === 'wave') {
      ctx.moveTo(x, y + h * 0.25);
      ctx.bezierCurveTo(x + w * 0.25, y - h * 0.08, x + w * 0.25, y + h * 0.52, x + w * 0.50, y + h * 0.25);
      ctx.bezierCurveTo(x + w * 0.75, y - h * 0.08, x + w * 0.75, y + h * 0.52, x + w, y + h * 0.25);
      ctx.lineTo(x + w, y + h * 0.75);
      ctx.bezierCurveTo(x + w * 0.75, y + h * 1.08, x + w * 0.75, y + h * 0.48, x + w * 0.50, y + h * 0.75);
      ctx.bezierCurveTo(x + w * 0.25, y + h * 1.08, x + w * 0.25, y + h * 0.48, x, y + h * 0.75);
      ctx.closePath();
    } else if (s === 'cross') {
      const armW = w * 0.28;
      const barH = h * 0.24;
      const barY = y + h * 0.25;
      ctx.moveTo(cx - armW / 2, y);
      ctx.lineTo(cx + armW / 2, y);
      ctx.lineTo(cx + armW / 2, barY);
      ctx.lineTo(x + w, barY);
      ctx.lineTo(x + w, barY + barH);
      ctx.lineTo(cx + armW / 2, barY + barH);
      ctx.lineTo(cx + armW / 2, y + h);
      ctx.lineTo(cx - armW / 2, y + h);
      ctx.lineTo(cx - armW / 2, barY + barH);
      ctx.lineTo(x, barY + barH);
      ctx.lineTo(x, barY);
      ctx.lineTo(cx - armW / 2, barY);
      ctx.closePath();
    } else if (s === 'plus' || s === 'plus-shape' || s === 'plus_shape') {
      const pw = w * 0.30;
      const ph = h * 0.30;
      ctx.moveTo(cx - pw / 2, y);
      ctx.lineTo(cx + pw / 2, y);
      ctx.lineTo(cx + pw / 2, cy - ph / 2);
      ctx.lineTo(x + w, cy - ph / 2);
      ctx.lineTo(x + w, cy + ph / 2);
      ctx.lineTo(cx + pw / 2, cy + ph / 2);
      ctx.lineTo(cx + pw / 2, y + h);
      ctx.lineTo(cx - pw / 2, y + h);
      ctx.lineTo(cx - pw / 2, cy + ph / 2);
      ctx.lineTo(x, cy + ph / 2);
      ctx.lineTo(x, cy - ph / 2);
      ctx.lineTo(cx - pw / 2, cy - ph / 2);
      ctx.closePath();
    } else if (s === 'gear') {
      const teeth = 8;
      const rOut = Math.min(rx, ry);
      const rIn = rOut * 0.78;
      for (let i = 0; i < teeth * 2; i++) {
        const rDist = (i % 2 === 0) ? rOut : rIn;
        const a = (i * Math.PI) / teeth;
        const px = cx + (rx / rOut) * rDist * Math.cos(a);
        const py = cy + (ry / rOut) * rDist * Math.sin(a);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
    } else if (s === 'burst' || s === 'sun') {
      const rays = 16;
      for (let i = 0; i < rays * 2; i++) {
        const rad = (i % 2 === 0) ? 1.0 : 0.65;
        const a = (i * Math.PI) / rays;
        const px = cx + rx * rad * Math.cos(a);
        const py = cy + ry * rad * Math.sin(a);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
    } else if (s === 'teardrop') {
      ctx.moveTo(cx, y);
      ctx.bezierCurveTo(x + w * 0.85, y + h * 0.35, x + w, y + h * 0.65, cx, y + h);
      ctx.bezierCurveTo(x, y + h * 0.65, x + w * 0.15, y + h * 0.35, cx, y);
      ctx.closePath();
    } else if (s === 'leaf') {
      ctx.moveTo(x, y + h);
      ctx.bezierCurveTo(x + w * 0.08, y + h * 0.35, x + w * 0.45, y, x + w, y);
      ctx.bezierCurveTo(x + w * 0.92, y + h * 0.65, x + w * 0.55, y + h, x, y + h);
      ctx.closePath();
    }

    // 4. Curves & Paths
    else if (s === 'bezier-curve' || s === 'bezier') {
      ctx.moveTo(x, y + h * 0.35);
      ctx.bezierCurveTo(x + w * 0.35, y, x + w * 0.65, y + h * 0.8, x + w, y + h * 0.15);
      ctx.lineTo(x + w, y + h * 0.65);
      ctx.bezierCurveTo(x + w * 0.65, y + h * 1.1, x + w * 0.35, y + h * 0.4, x, y + h * 0.85);
      ctx.closePath();
    } else if (s === 'spline') {
      ctx.moveTo(x + w * 0.1, y + h * 0.2);
      ctx.bezierCurveTo(x + w * 0.4, y - h * 0.1, x + w * 0.8, y + h * 0.3, x + w * 0.9, y + h * 0.5);
      ctx.bezierCurveTo(x + w, y + h * 0.8, x + w * 0.6, y + h * 1.05, x + w * 0.3, y + h * 0.9);
      ctx.bezierCurveTo(x, y + h * 0.8, x - w * 0.05, y + h * 0.4, x + w * 0.1, y + h * 0.2);
      ctx.closePath();
    }

    // 5. 3D & Mesh Shapes
    else if (s === 'cylinder') {
      const capH = h * 0.22;
      ctx.ellipse(cx, y + capH / 2, rx, capH / 2, 0, Math.PI, 0);
      ctx.lineTo(x + w, y + h - capH / 2);
      ctx.ellipse(cx, y + h - capH / 2, rx, capH / 2, 0, 0, Math.PI, false);
      ctx.lineTo(x, y + capH / 2);
      ctx.closePath();
    } else if (s === 'cone') {
      const baseH = h * 0.22;
      ctx.moveTo(cx, y);
      ctx.lineTo(x + w, y + h - baseH / 2);
      ctx.ellipse(cx, y + h - baseH / 2, rx, baseH / 2, 0, 0, Math.PI, false);
      ctx.lineTo(cx, y);
      ctx.closePath();
    } else if (s === 'cube' || s === '3d-box' || s === 'box') {
      ctx.moveTo(cx, y);
      ctx.lineTo(x + w, y + h * 0.25);
      ctx.lineTo(x + w, y + h * 0.75);
      ctx.lineTo(cx, y + h);
      ctx.lineTo(x, y + h * 0.75);
      ctx.lineTo(x, y + h * 0.25);
      ctx.closePath();
    } else if (s === 'pyramid') {
      ctx.moveTo(cx, y);
      ctx.lineTo(x + w, y + h * 0.85);
      ctx.lineTo(cx, y + h);
      ctx.lineTo(x, y + h * 0.85);
      ctx.closePath();
    } else if (s === 'sphere') {
      const sphR = Math.min(rx, ry);
      ctx.arc(cx, cy, sphR, 0, Math.PI * 2);
      ctx.closePath();
    } else if (s === 'grid') {
      const gPad = Math.min(w, h) * 0.05;
      const hw = (w - gPad) / 2;
      const hh = (h - gPad) / 2;
      ctx.rect(x, y, hw, hh);
      ctx.rect(x + hw + gPad, y, hw, hh);
      ctx.rect(x, y + hh + gPad, hw, hh);
      ctx.rect(x + hw + gPad, y + hh + gPad, hw, hh);
    } else if (s === 'mesh') {
      for (let i = 0; i < 8; i++) {
        const a = -Math.PI / 2 + i * (Math.PI / 4);
        const rad = (i % 2 === 0) ? 1.0 : 0.84;
        const px = cx + rx * rad * Math.cos(a);
        const py = cy + ry * rad * Math.sin(a);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
    } else if (s === 'brush') {
      const pad = Math.min(w, h) * 0.04;
      ctx.moveTo(x + pad * 2, y + pad);
      ctx.bezierCurveTo(x + w * 0.3, y - pad * 0.5, x + w * 0.7, y + pad * 1.5, x + w - pad, y + pad * 0.8);
      ctx.bezierCurveTo(x + w + pad * 0.8, y + h * 0.35, x + w - pad * 0.5, y + h * 0.75, x + w - pad * 1.5, y + h - pad);
      ctx.bezierCurveTo(x + w * 0.65, y + h + pad * 0.6, x + w * 0.25, y + h - pad * 1.2, x + pad, y + h - pad * 0.5);
      ctx.bezierCurveTo(x - pad * 0.8, y + h * 0.65, x + pad * 1.2, y + h * 0.25, x + pad * 2, y + pad);
      ctx.closePath();
    } else {
      ctx.rect(x, y, w, h);
    }
  }

  // --- Advanced Custom / Combined Shapes Engine (SVG, Canvas, Python/Pillow, Cairo, JS) ---
  _renderCustomPathOnCtx(ctx, rect, custom) {
    if (!custom) return false;
    const x = rect.x;
    const y = rect.y;
    const w = rect.width;
    const h = rect.height;

    // 1. Boolean Combination of Two Shapes
    if (typeof custom === 'object' && custom.shapeA && custom.shapeB) {
      this._buildFramePath(ctx, rect, custom.shapeA);
      const sc = custom.scaleB !== undefined ? custom.scaleB : 0.6;
      const offX = (custom.offsetX || 0) * w;
      const offY = (custom.offsetY || 0) * h;
      const bW = w * sc;
      const bH = h * sc;
      const bRect = {
        x: x + (w - bW) / 2 + offX,
        y: y + (h - bH) / 2 + offY,
        width: bW,
        height: bH
      };
      this._buildFramePath(ctx, bRect, custom.shapeB);
      return true;
    }

    // 2. JavaScript / Canvas Function (ctx, w, h, x, y)
    if (typeof custom === 'object' && custom.jsCode) {
      try {
        const fn = new Function('ctx', 'w', 'h', 'x', 'y', custom.jsCode);
        ctx.save();
        ctx.translate(x, y);
        fn(ctx, w, h, 0, 0);
        ctx.restore();
        return true;
      } catch (err) {}
    }

    // 3. SVG Path String (e.g. "M 10 10 C 20 ... Z")
    const svgStr = typeof custom === 'string' ? custom : (custom.svgPath || custom.path || '');
    if (svgStr && typeof svgStr === 'string') {
      try {
        return this._parseSvgPathToCanvas(ctx, svgStr, x, y, w, h);
      } catch (err) {}
    }

    return false;
  }

  _parseSvgPathToCanvas(ctx, svgStr, targetX, targetY, targetW, targetH) {
    if (!svgStr || typeof svgStr !== 'string') return false;
    // Extract numbers to determine source bounding box
    const clean = svgStr.replace(/,/g, ' ').trim();
    const numRegex = /[-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?/g;
    const allNums = clean.match(numRegex);
    if (!allNums || allNums.length < 4) {
      ctx.rect(targetX, targetY, targetW, targetH);
      return true;
    }

    // First scan to determine viewBox bounds
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < allNums.length - 1; i += 2) {
      const px = parseFloat(allNums[i]);
      const py = parseFloat(allNums[i + 1]);
      if (!isNaN(px) && !isNaN(py)) {
        if (px < minX) minX = px;
        if (px > maxX) maxX = px;
        if (py < minY) minY = py;
        if (py > maxY) maxY = py;
      }
    }
    const rangeX = Math.max(1, maxX - minX);
    const rangeY = Math.max(1, maxY - minY);

    const scaleX = (val) => targetX + ((val - minX) / rangeX) * targetW;
    const scaleY = (val) => targetY + ((val - minY) / rangeY) * targetH;

    // Tokenize commands
    const cmdRegex = /([a-df-z])([^a-df-z]*)/gi;
    let match;
    let curX = minX;
    let curY = minY;

    while ((match = cmdRegex.exec(clean)) !== null) {
      const cmd = match[1];
      const isRelative = (cmd === cmd.toLowerCase());
      const type = cmd.toUpperCase();
      const coords = (match[2].match(numRegex) || []).map(Number);

      if (type === 'M' && coords.length >= 2) {
        curX = isRelative ? curX + coords[0] : coords[0];
        curY = isRelative ? curY + coords[1] : coords[1];
        ctx.moveTo(scaleX(curX), scaleY(curY));
        for (let i = 2; i < coords.length; i += 2) {
          curX = isRelative ? curX + coords[i] : coords[i];
          curY = isRelative ? curY + coords[i + 1] : coords[i + 1];
          ctx.lineTo(scaleX(curX), scaleY(curY));
        }
      } else if (type === 'L' && coords.length >= 2) {
        for (let i = 0; i < coords.length; i += 2) {
          curX = isRelative ? curX + coords[i] : coords[i];
          curY = isRelative ? curY + coords[i + 1] : coords[i + 1];
          ctx.lineTo(scaleX(curX), scaleY(curY));
        }
      } else if (type === 'H' && coords.length >= 1) {
        for (const nx of coords) {
          curX = isRelative ? curX + nx : nx;
          ctx.lineTo(scaleX(curX), scaleY(curY));
        }
      } else if (type === 'V' && coords.length >= 1) {
        for (const ny of coords) {
          curY = isRelative ? curY + ny : ny;
          ctx.lineTo(scaleX(curX), scaleY(curY));
        }
      } else if (type === 'C' && coords.length >= 6) {
        for (let i = 0; i < coords.length; i += 6) {
          const cp1x = isRelative ? curX + coords[i] : coords[i];
          const cp1y = isRelative ? curY + coords[i + 1] : coords[i + 1];
          const cp2x = isRelative ? curX + coords[i + 2] : coords[i + 2];
          const cp2y = isRelative ? curY + coords[i + 3] : coords[i + 3];
          curX = isRelative ? curX + coords[i + 4] : coords[i + 4];
          curY = isRelative ? curY + coords[i + 5] : coords[i + 5];
          ctx.bezierCurveTo(scaleX(cp1x), scaleY(cp1y), scaleX(cp2x), scaleY(cp2y), scaleX(curX), scaleY(curY));
        }
      } else if (type === 'Q' && coords.length >= 4) {
        for (let i = 0; i < coords.length; i += 4) {
          const cpx = isRelative ? curX + coords[i] : coords[i];
          const cpy = isRelative ? curY + coords[i + 1] : coords[i + 1];
          curX = isRelative ? curX + coords[i + 2] : coords[i + 2];
          curY = isRelative ? curY + coords[i + 3] : coords[i + 3];
          ctx.quadraticCurveTo(scaleX(cpx), scaleY(cpy), scaleX(curX), scaleY(curY));
        }
      } else if (type === 'Z') {
        ctx.closePath();
      }
    }
    return true;
  }

  _renderSlot(ctx, rect, slot, isHovered, isDropTarget, isSelected) {
    ctx.save();

    const rot = (slot?.rotation !== undefined ? slot.rotation : (rect?.rotation || 0));
    const cx = rect.x + rect.width / 2;
    const cy = rect.y + rect.height / 2;
    if (rot !== 0) {
      ctx.translate(cx, cy);
      ctx.rotate((rot * Math.PI) / 180);
      ctx.translate(-cx, -cy);
    }

    if (slot?.isText) {
      // Text Frame Layer (Strictly standalone and completely free on canvas without clipping box or cutoffs)
      const fontSize = Math.max(12, Math.round((slot.fontSize || 28) * (this.displayWidth / 1200)));
      const fontWeight = slot.fontWeight || 'bold';
      const fontStyle = slot.fontStyle || 'normal';
      const fontFamily = slot.fontFamily || 'Playfair Display, Georgia, serif';
      ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
      ctx.fillStyle = slot.textColor || '#1e293b';
      ctx.textAlign = slot.textAlign || 'center';
      ctx.textBaseline = 'middle';

      let text = slot.text !== undefined ? slot.text : 'Add Title / Caption Here';
      if (slot.allCaps) {
        text = text.toUpperCase();
      }
      const lines = text.split('\n');
      const lineHeight = fontSize * (slot.lineHeight || 1.3);
      const startY = (rect.y + rect.height / 2) - ((lines.length - 1) * lineHeight) / 2;

      let alignX = rect.x + rect.width / 2;
      if (slot.textAlign === 'left') alignX = rect.x + 16;
      else if (slot.textAlign === 'right') alignX = rect.x + rect.width - 16;

      lines.forEach((line, lineIdx) => {
        const curY = startY + lineIdx * lineHeight;
        ctx.fillText(line, alignX, curY);

        if (slot.underline && line) {
          const metrics = ctx.measureText(line);
          const lw = metrics.width;
          let ux = alignX;
          if (slot.textAlign === 'center') ux = alignX - lw / 2;
          else if (slot.textAlign === 'right') ux = alignX - lw;
          ctx.beginPath();
          ctx.strokeStyle = slot.textColor || '#1e293b';
          ctx.lineWidth = Math.max(1, Math.round(fontSize / 16));
          ctx.moveTo(ux, curY + fontSize * 0.42);
          ctx.lineTo(ux + lw, curY + fontSize * 0.42);
          ctx.stroke();
        }
      });
      // If text slot is not selected (e.g. user clicked elsewhere on canvas), keep control box invisible
      if (!isSelected) {
        ctx.restore();
        return;
      }
      // When text is clicked/selected, execution continues so cyan selection box, [✥ MOVE] badge, and 8 handles appear!
    } else {
      // Clip only photo / placeholder frames to shape boundaries
      ctx.save();
      if (slot?.customPath && !rect.customPath) rect.customPath = slot.customPath;
      this._buildFramePath(ctx, rect, rect.shape);
      ctx.clip();

      const photo = slot?.photoId ? this.albumState.getPhotoById(slot.photoId) : null;

      if (photo && (photo.src || photo.thumbSrc || photo.filePath)) {
        let img = this._getWorkingImage(photo);
        if (img && img._hasError && typeof window.markPhotoNeedsRelink === 'function') {
          window.markPhotoNeedsRelink(photo.id);
        }
        if (img && img.complete && img.naturalWidth > 0) {
          this._renderImageCover(ctx, img, rect, slot);
        } else {
          // Instantly use ANY ready thumbnail or preview image so the photo displays immediately with 0ms delay!
          const fallback = this._getAnyReadyImage(photo);
          if (fallback && fallback.complete && fallback.naturalWidth > 0) {
            this._renderImageCover(ctx, fallback, rect, slot);
          } else {
            // Loading placeholder only if absolutely nothing is decoded in memory yet
            ctx.fillStyle = '#1e2430';
            this._buildFramePath(ctx, rect, rect.shape);
            ctx.fill();
            ctx.fillStyle = '#64748b';
            ctx.font = '13px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Loading...', rect.x + rect.width / 2, rect.y + rect.height / 2);
          }
        }
      } else {
        // Empty slot placeholder - Sleek, clearly defined studio placeholder
        ctx.fillStyle = '#141824';
        this._buildFramePath(ctx, rect, rect.shape);
        ctx.fill();

        // Subtle blueprint diagonal guide lines
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.07)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(rect.x, rect.y);
        ctx.lineTo(rect.x + rect.width, rect.y + rect.height);
        ctx.moveTo(rect.x + rect.width, rect.y);
        ctx.lineTo(rect.x, rect.y + rect.height);
        ctx.stroke();

        // Defined dashed contour
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 6]);
        this._buildFramePath(ctx, { x: rect.x + 2, y: rect.y + 2, width: Math.max(1, rect.width - 4), height: Math.max(1, rect.height - 4), shape: rect.shape }, rect.shape);
        ctx.stroke();
        ctx.setLineDash([]);

        // Frame identification badge
        const fNum = (rect.slotIndex !== undefined ? rect.slotIndex + 1 : 1);
        const badgeW = 76;
        const badgeH = 24;
        const bx = rect.x + (rect.width - badgeW) / 2;
        const by = rect.y + rect.height / 2 - 16;
        ctx.fillStyle = 'rgba(30, 41, 59, 0.88)';
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(bx, by, badgeW, badgeH, 12);
        } else {
          ctx.rect(bx, by, badgeW, badgeH);
        }
        ctx.fill();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`Frame ${fNum}`, bx + badgeW / 2, by + badgeH / 2);

        ctx.fillStyle = '#64748b';
        ctx.font = '12px sans-serif';
        ctx.fillText('+ Add Photo', rect.x + rect.width / 2, by + badgeH + 16);
      }
      ctx.restore();
    }

    // Slot border / hover / selected outline
    if (isDropTarget) {
      const isSwapTarget = this.isDraggingPhotoSwap && this.dragSwapTargetIndex === rect.slotIndex;
      if (isSwapTarget) {
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 4;
        ctx.setLineDash([8, 6]);
        ctx.strokeRect(rect.x - 1, rect.y - 1, rect.width + 2, rect.height + 2);
        ctx.setLineDash([]);

        // Tint overlay
        ctx.fillStyle = 'rgba(245, 158, 11, 0.22)';
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
      }

      if (isSwapTarget) {
        // High visibility badge in center of target frame
        const badgeW = Math.min(rect.width - 20, 240);
        const badgeH = 34;
        const bx = rect.x + (rect.width - badgeW) / 2;
        const by = rect.y + (rect.height - badgeH) / 2;

        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 10;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.96)';
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(bx, by, badgeW, badgeH, 17);
        } else {
          ctx.rect(bx, by, badgeW, badgeH);
        }
        ctx.fill();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`⇄ Drop to Swap with Frame ${this.dragSwapSourceIndex + 1}`, bx + badgeW / 2, by + badgeH / 2);
        ctx.restore();
      }
    } else if (isSelected) {
      // Highlight selected frame with defined glowing cyan border
      ctx.save();
      ctx.shadowColor = 'rgba(2, 132, 199, 0.55)';
      ctx.shadowBlur = 10;
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 3;
      this._buildFramePath(ctx, rect, rect.shape);
      ctx.stroke();
      ctx.restore();

      const isMulti = this.selectedSlotIndices && this.selectedSlotIndices.size > 1;

      if (isMulti) {
        // Multi-selection: show crisp cyan badge with checkmark in top-right corner
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 6;
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        const badgeX = rect.x + rect.width - 12;
        const badgeY = rect.y + 12;
        ctx.arc(badgeX, badgeY, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✓', badgeX, badgeY + 1);
        ctx.restore();
      }

      // Top Center Frame Move Grip Badge
      const moveGripX = rect.x + rect.width / 2;
      const moveGripY = rect.y - 13;
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 1;
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(moveGripX - 25, moveGripY - 9, 50, 18, 9);
      } else {
        ctx.rect(moveGripX - 25, moveGripY - 9, 50, 18);
      }
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✥ MOVE', moveGripX, moveGripY + 1);
      ctx.restore();

      // High-contrast, touch-friendly 8 resize handles with drop shadow (corners + edges)
      const handles = [
        // 4 Corner handles (freeform 2D sizing)
        { x: rect.x, y: rect.y, isCorner: true },
        { x: rect.x + rect.width, y: rect.y, isCorner: true },
        { x: rect.x, y: rect.y + rect.height, isCorner: true },
        { x: rect.x + rect.width, y: rect.y + rect.height, isCorner: true },
        // 4 Edge midpoint handles (width / height sizing)
        { x: rect.x + rect.width / 2, y: rect.y, isCorner: false },
        { x: rect.x + rect.width / 2, y: rect.y + rect.height, isCorner: false },
        { x: rect.x, y: rect.y + rect.height / 2, isCorner: false },
        { x: rect.x + rect.width, y: rect.y + rect.height / 2, isCorner: false }
      ];

      handles.forEach(h => {
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 1.5;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        const r = h.isCorner ? 8 : 6;
        ctx.arc(h.x, h.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();
      });

      // Rotation Stem and Circle Grip Handle (24px above top center)
      const rotHandleX = rect.x + rect.width / 2;
      const rotHandleY = rect.y - 24;
      ctx.save();
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(rotHandleX, rect.y);
      ctx.lineTo(rotHandleX, rotHandleY);
      ctx.stroke();

      ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
      ctx.shadowBlur = 6;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(rotHandleX, rotHandleY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // If actively rotating this slot, draw real-time angle badge
      if (this.isRotatingSlot && this.rotateSlotIndex === rect.slotIndex) {
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 8;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
        const bW = 54;
        const bH = 22;
        const bX = rotHandleX - bW / 2;
        const bY = rotHandleY - 26;
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(bX, bY, bW, bH, 6);
        } else {
          ctx.rect(bX, bY, bW, bH);
        }
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${Math.round(rot)}°`, rotHandleX, bY + bH / 2);
        ctx.restore();
      }

    } else if (isHovered) {
      // Clearly defined hover indicator: smooth luminous outline
      ctx.save();
      ctx.shadowColor = 'rgba(56, 189, 248, 0.45)';
      ctx.shadowBlur = 8;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      this._buildFramePath(ctx, rect, rect.shape);
      ctx.stroke();
      ctx.restore();

      // 8 Hover resize handles so user immediately sees handles in all directions
      const hoverHandles = [
        { x: rect.x, y: rect.y, isCorner: true },
        { x: rect.x + rect.width, y: rect.y, isCorner: true },
        { x: rect.x, y: rect.y + rect.height, isCorner: true },
        { x: rect.x + rect.width, y: rect.y + rect.height, isCorner: true },
        { x: rect.x + rect.width / 2, y: rect.y, isCorner: false },
        { x: rect.x + rect.width / 2, y: rect.y + rect.height, isCorner: false },
        { x: rect.x, y: rect.y + rect.height / 2, isCorner: false },
        { x: rect.x + rect.width, y: rect.y + rect.height / 2, isCorner: false }
      ];
      hoverHandles.forEach(h => {
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        const r = h.isCorner ? 6 : 5;
        ctx.arc(h.x, h.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      });
    } else {
      // Crisp, clearly defined frame boundary so photo and empty frames stand out cleanly on spread
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.22)';
      ctx.lineWidth = 1.5;
      this._buildFramePath(ctx, rect, rect.shape);
      ctx.stroke();
    }

    // Render Quick "Delete Frame" Button on Hover or Selection (top-left)
    if ((isSelected || isHovered) && !isDropTarget) {
      const delBtnX = rect.x + 14;
      const delBtnY = rect.y + 14;
      const delRadius = 10;

      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 1;
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(delBtnX, delBtnY, delRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✕', delBtnX, delBtnY + 0.5);
      ctx.restore();
    }

    ctx.restore();
  }

  /**
   * Cover-fit & contain image rendering with panning, zooming, rotation, flips, and color/light filters.
   */
  _renderImageCover(ctx, img, rect, slotOrPanX = 0, panY = 0, zoom = 1.0, rotation = 0) {
    let panX = 0, flipH = false, flipV = false, cropMode = 'cover', brightness = 100, contrast = 100, saturation = 100, warmth = 0;
    if (typeof slotOrPanX === 'object' && slotOrPanX !== null) {
      panX = slotOrPanX.panX || 0;
      panY = slotOrPanX.panY || 0;
      zoom = slotOrPanX.zoom || 1.0;
      rotation = slotOrPanX.photoRotation || 0;
      flipH = Boolean(slotOrPanX.flipH);
      flipV = Boolean(slotOrPanX.flipV);
      cropMode = slotOrPanX.cropMode || 'cover';
      brightness = slotOrPanX.brightness !== undefined ? slotOrPanX.brightness : 100;
      contrast = slotOrPanX.contrast !== undefined ? slotOrPanX.contrast : 100;
      saturation = slotOrPanX.saturation !== undefined ? slotOrPanX.saturation : 100;
      warmth = slotOrPanX.warmth || 0;
    } else {
      panX = slotOrPanX || 0;
    }

    const imgW = img.naturalWidth;
    const imgH = img.naturalHeight;
    if (!imgW || !imgH) return;

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Apply color & light filters via canvas 2D standard filter API
    const filters = [];
    if (brightness !== 100) filters.push(`brightness(${brightness}%)`);
    if (contrast !== 100) filters.push(`contrast(${contrast}%)`);
    if (saturation !== 100) filters.push(`saturate(${saturation}%)`);
    if (warmth > 0) {
      filters.push(`sepia(${warmth * 0.45}%)`);
      filters.push(`hue-rotate(${warmth * -0.15}deg)`);
    } else if (warmth < 0) {
      filters.push(`hue-rotate(${warmth * 0.35}deg)`);
    }
    if (filters.length > 0) {
      ctx.filter = filters.join(' ');
    }

    const isRotated90 = Math.abs(rotation % 180) === 90;
    const orientedW = isRotated90 ? imgH : imgW;
    const orientedH = isRotated90 ? imgW : imgH;

    // Crop Mode: Cover (default) fills frame completely maintaining aspect ratio; Contain fits whole photo
    const scale = (cropMode === 'contain')
      ? Math.min(rect.width / orientedW, rect.height / orientedH) * (zoom || 1.0)
      : Math.max(rect.width / orientedW, rect.height / orientedH) * (zoom || 1.0);

    const drawW = imgW * scale;
    const drawH = imgH * scale;
    const effectiveDrawW = orientedW * scale;
    const effectiveDrawH = orientedH * scale;

    // Maximum screen-aligned pan offsets to prevent white space / gaps inside frame
    const maxPanX = Math.max(0, (effectiveDrawW - rect.width) / 2);
    const maxPanY = Math.max(0, (effectiveDrawH - rect.height) / 2);

    const clampedPanX = cropMode === 'contain' ? (panX || 0) : Math.max(-maxPanX, Math.min(maxPanX, panX || 0));
    const clampedPanY = cropMode === 'contain' ? (panY || 0) : Math.max(-maxPanY, Math.min(maxPanY, panY || 0));

    // 1. Translate to center of slot + screen pan offset
    const cx = rect.x + rect.width / 2 + clampedPanX;
    const cy = rect.y + rect.height / 2 + clampedPanY;
    ctx.translate(cx, cy);

    // 2. Rotate image around its center (0,0)
    if (rotation !== 0) {
      ctx.rotate((rotation * Math.PI) / 180);
    }

    // 3. Apply horizontal & vertical flip
    if (flipH || flipV) {
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    }

    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  }

  _renderGhostLayoutPreview(ctx, template) {
    if (!template || !template.rects) return;
    const rects = this.albumState.layoutEngine.computePixelRectangles(
      template,
      this.displayWidth,
      this.displayHeight,
      {
        marginPercent: this.albumState.getSpreadMarginPercent(this.albumState.activeSpreadIndex),
        middleMarginPercent: this.albumState.getSpreadMiddleMarginPercent(this.albumState.activeSpreadIndex),
        gapPx: this.albumState.getSpreadGapPx(this.albumState.activeSpreadIndex),
        fullBleed: this.albumState.project.fullBleed,
        pageMode: this.albumState.project.pageMode
      }
    );

    ctx.save();
    // Glass overlay tint
    ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
    ctx.fillRect(0, 0, this.displayWidth, this.displayHeight);

    // Draw transparent blueprint boxes
    rects.forEach((rect, idx) => {
      // Semi-transparent luminous cyan fill
      ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
      this._buildFramePath(ctx, rect, rect.shape);
      ctx.fill();

      // Blueprint dashed cyan stroke
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 6]);
      this._buildFramePath(ctx, rect, rect.shape);
      ctx.stroke();
      ctx.setLineDash([]);

      // Center frame number badge
      const badgeW = 76;
      const badgeH = 26;
      const bx = rect.x + (rect.width - badgeW) / 2;
      const by = rect.y + (rect.height - badgeH) / 2;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(bx, by, badgeW, badgeH, 13);
      } else {
        ctx.rect(bx, by, badgeW, badgeH);
      }
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`Frame ${idx + 1}`, bx + badgeW / 2, by + badgeH / 2);
    });

    // Top preview badge
    const bannerW = 280;
    const bannerH = 28;
    const bX = (this.displayWidth - bannerW) / 2;
    const bY = 14;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(bX, bY, bannerW, bannerH, 14);
    } else {
      ctx.rect(bX, bY, bannerW, bannerH);
    }
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`📐 Blueprint Preview: ${template.name}`, bX + bannerW / 2, bY + bannerH / 2);

    ctx.restore();
  }

  _renderCenterCrease(ctx) {
    const centerX = this.displayWidth / 2;
    ctx.save();
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.35)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, this.displayHeight);
    ctx.stroke();

    // Crease shadow gradient to simulate realistic photobook fold
    const grad = ctx.createLinearGradient(centerX - 15, 0, centerX + 15, 0);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.08)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(centerX - 15, 0, 30, this.displayHeight);
    ctx.restore();
  }

  _renderSafeZoneGuides(ctx) {
    const safePercent = (this.albumState.project.safeZonePercent || 3.0) / 100;
    // Top and bottom safe zone size
    const padY = this.displayHeight * safePercent;
    // Left and right safe zone adjusted to match top and bottom size
    const padX = padY;

    ctx.save();
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)'; // soft red dashed line
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(padX, padY, this.displayWidth - padX * 2, this.displayHeight - padY * 2);
    ctx.restore();
  }

  _renderDrawingFrameGhost(ctx) {
    if (!this.isDrawingNewFrame || !this.drawFrameStartPos || !this.drawFrameCurrentPos) return;
    const x1 = Math.min(this.drawFrameStartPos.x, this.drawFrameCurrentPos.x);
    const y1 = Math.min(this.drawFrameStartPos.y, this.drawFrameCurrentPos.y);
    const x2 = Math.max(this.drawFrameStartPos.x, this.drawFrameCurrentPos.x);
    const y2 = Math.max(this.drawFrameStartPos.y, this.drawFrameCurrentPos.y);
    const w = x2 - x1;
    const h = y2 - y1;
    const currentShape = this.currentDrawShape || 'rectangle';
    const ghostRect = { x: x1, y: y1, width: w, height: h, shape: currentShape };

    ctx.save();
    // Semi-transparent luminous cyan fill
    ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
    this._buildFramePath(ctx, ghostRect, currentShape);
    ctx.fill();

    // Dashed animated-style border
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 6]);
    this._buildFramePath(ctx, ghostRect, currentShape);
    ctx.stroke();
    ctx.setLineDash([]);

    // 4 Corner Dots
    ctx.fillStyle = '#ffffff';
    const corners = [
      { x: x1, y: y1 },
      { x: x2, y: y1 },
      { x: x1, y: y2 },
      { x: x2, y: y2 }
    ];
    corners.forEach(c => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // Dimension badge in center
    const badgeW = Math.min(Math.max(w - 10, 160), 220);
    const badgeH = 28;
    const bx = x1 + (w - badgeW) / 2;
    const by = y1 + (h - badgeH) / 2;

    if (w >= 60 && h >= 40) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(bx, by, badgeW, badgeH, 14);
      } else {
        ctx.rect(bx, by, badgeW, badgeH);
      }
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`✏️ ${Math.round(w)} × ${Math.round(h)} px`, bx + badgeW / 2, by + badgeH / 2);
    }

    ctx.restore();
  }

  /**
   * Calculates smart Photoshop-like alignment guide lines and snapped coordinates
   * Snaps against other frames, center crease, and page edges.
   */
  _calculateSnapGuides(box, excludeIndices, isResizing = false, resizeCorner = null) {
    const SNAP_THRESH = 7;
    const guides = [];
    let snappedX = box.x;
    let snappedY = box.y;
    let snappedW = box.width;
    let snappedH = box.height;

    const isSpread = (this.albumState.project.pageMode !== 'single');
    const centerX = this.displayWidth / 2;

    // Reference targets
    const xTargets = [
      { val: 0, label: 'Page Left' },
      { val: this.displayWidth, label: 'Page Right' }
    ];
    if (isSpread) {
      xTargets.push({ val: centerX, label: 'Center Crease' });
    }

    const yTargets = [
      { val: 0, label: 'Page Top' },
      { val: this.displayHeight / 2, label: 'Page Middle' },
      { val: this.displayHeight, label: 'Page Bottom' }
    ];

    if (this.cachedRectangles) {
      for (const r of this.cachedRectangles) {
        if (excludeIndices && excludeIndices.has(r.slotIndex)) continue;
        xTargets.push({ val: r.x, refRect: r });
        xTargets.push({ val: r.x + r.width / 2, refRect: r });
        xTargets.push({ val: r.x + r.width, refRect: r });

        yTargets.push({ val: r.y, refRect: r });
        yTargets.push({ val: r.y + r.height / 2, refRect: r });
        yTargets.push({ val: r.y + r.height, refRect: r });
      }
    }

    // --- SNAP X ---
    let bestDistX = SNAP_THRESH + 1;
    let bestSnapX = null;

    if (!isResizing) {
      const boxXs = [
        { val: box.x, type: 'left' },
        { val: box.x + box.width / 2, type: 'center' },
        { val: box.x + box.width, type: 'right' }
      ];
      for (const bx of boxXs) {
        for (const tx of xTargets) {
          const dist = Math.abs(bx.val - tx.val);
          if (dist < bestDistX) {
            bestDistX = dist;
            let newX = box.x;
            if (bx.type === 'left') newX = tx.val;
            else if (bx.type === 'center') newX = tx.val - box.width / 2;
            else if (bx.type === 'right') newX = tx.val - box.width;
            bestSnapX = {
              newX: Math.round(newX),
              lineX: tx.val,
              refRect: tx.refRect
            };
          }
        }
      }
    } else {
      if (['tr', 'br', 'rm'].includes(resizeCorner)) {
        const rightEdge = box.x + box.width;
        for (const tx of xTargets) {
          const dist = Math.abs(rightEdge - tx.val);
          if (dist < bestDistX) {
            bestDistX = dist;
            bestSnapX = {
              newW: Math.max(20, Math.round(tx.val - box.x)),
              lineX: tx.val,
              refRect: tx.refRect
            };
          }
        }
      } else if (['tl', 'bl', 'lm'].includes(resizeCorner)) {
        const leftEdge = box.x;
        for (const tx of xTargets) {
          const dist = Math.abs(leftEdge - tx.val);
          if (dist < bestDistX) {
            bestDistX = dist;
            const diff = box.x - tx.val;
            bestSnapX = {
              newX: Math.round(tx.val),
              newW: Math.max(20, Math.round(box.width + diff)),
              lineX: tx.val,
              refRect: tx.refRect
            };
          }
        }
      }
    }

    if (bestSnapX) {
      if (bestSnapX.newX !== undefined) snappedX = bestSnapX.newX;
      if (bestSnapX.newW !== undefined) snappedW = bestSnapX.newW;
      const startY = bestSnapX.refRect ? Math.min(box.y, bestSnapX.refRect.y) : 0;
      const endY = bestSnapX.refRect ? Math.max(box.y + box.height, bestSnapX.refRect.y + bestSnapX.refRect.height) : this.displayHeight;
      guides.push({
        type: 'v',
        pos: bestSnapX.lineX,
        start: 0,
        end: this.displayHeight
      });
    }

    // --- SNAP Y ---
    let bestDistY = SNAP_THRESH + 1;
    let bestSnapY = null;

    if (!isResizing) {
      const boxYs = [
        { val: box.y, type: 'top' },
        { val: box.y + box.height / 2, type: 'middle' },
        { val: box.y + box.height, type: 'bottom' }
      ];
      for (const by of boxYs) {
        for (const ty of yTargets) {
          const dist = Math.abs(by.val - ty.val);
          if (dist < bestDistY) {
            bestDistY = dist;
            let newY = box.y;
            if (by.type === 'top') newY = ty.val;
            else if (by.type === 'middle') newY = ty.val - box.height / 2;
            else if (by.type === 'bottom') newY = ty.val - box.height;
            bestSnapY = {
              newY: Math.round(newY),
              lineY: ty.val,
              refRect: ty.refRect
            };
          }
        }
      }
    } else {
      if (['bl', 'br', 'bm'].includes(resizeCorner)) {
        const bottomEdge = box.y + box.height;
        for (const ty of yTargets) {
          const dist = Math.abs(bottomEdge - ty.val);
          if (dist < bestDistY) {
            bestDistY = dist;
            bestSnapY = {
              newH: Math.max(20, Math.round(ty.val - box.y)),
              lineY: ty.val,
              refRect: ty.refRect
            };
          }
        }
      } else if (['tl', 'tr', 'tm'].includes(resizeCorner)) {
        const topEdge = box.y;
        for (const ty of yTargets) {
          const dist = Math.abs(topEdge - ty.val);
          if (dist < bestDistY) {
            bestDistY = dist;
            const diff = box.y - ty.val;
            bestSnapY = {
              newY: Math.round(ty.val),
              newH: Math.max(20, Math.round(box.height + diff)),
              lineY: ty.val,
              refRect: ty.refRect
            };
          }
        }
      }
    }

    if (bestSnapY) {
      if (bestSnapY.newY !== undefined) snappedY = bestSnapY.newY;
      if (bestSnapY.newH !== undefined) snappedH = bestSnapY.newH;
      guides.push({
        type: 'h',
        pos: bestSnapY.lineY,
        start: 0,
        end: this.displayWidth
      });
    }

    return {
      rect: { x: snappedX, y: snappedY, width: snappedW, height: snappedH },
      guides: guides
    };
  }

  _renderSnapGuides(ctx) {
    if (!this.activeSnapGuides || this.activeSnapGuides.length === 0) return;
    ctx.save();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#f43f5e'; // High-contrast Photoshop Magenta Smart Alignment Guide
    ctx.setLineDash([5, 3]);

    this.activeSnapGuides.forEach(g => {
      ctx.beginPath();
      if (g.type === 'v') {
        ctx.moveTo(g.pos + 0.5, g.start);
        ctx.lineTo(g.pos + 0.5, g.end);
      } else if (g.type === 'h') {
        ctx.moveTo(g.start, g.pos + 0.5);
        ctx.lineTo(g.end, g.pos + 0.5);
      }
      ctx.stroke();

      // Draw endpoint tick markers
      ctx.fillStyle = '#f43f5e';
      if (g.type === 'v') {
        ctx.fillRect(g.pos - 3, 0, 7, 4);
        ctx.fillRect(g.pos - 3, this.displayHeight - 4, 7, 4);
      } else if (g.type === 'h') {
        ctx.fillRect(0, g.pos - 3, 4, 7);
        ctx.fillRect(this.displayWidth - 4, g.pos - 3, 4, 7);
      }
    });

    ctx.restore();
  }

  _updateMarqueeSelection(x1, y1, x2, y2, isShiftOrCtrl = false) {
    const minX = Math.min(x1, x2);
    const minY = Math.min(y1, y2);
    const maxX = Math.max(x1, x2);
    const maxY = Math.max(y1, y2);

    const marqueeRect = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };

    if (!isShiftOrCtrl && (!this._initialSelectedSlots || this._initialSelectedSlots.size === 0)) {
      this.selectedSlotIndices.clear();
    } else if (isShiftOrCtrl && this._initialSelectedSlots) {
      this.selectedSlotIndices = new Set(this._initialSelectedSlots);
    }

    if (!this.cachedRectangles || this.cachedRectangles.length === 0) return;

    this.cachedRectangles.forEach(rect => {
      // Check if slot rectangle intersects or is contained within marquee box
      const intersects = !(
        rect.x > marqueeRect.x + marqueeRect.width ||
        rect.x + rect.width < marqueeRect.x ||
        rect.y > marqueeRect.y + marqueeRect.height ||
        rect.y + rect.height < marqueeRect.y
      );

      if (intersects) {
        this.selectedSlotIndices.add(rect.slotIndex);
      } else if (!isShiftOrCtrl) {
        this.selectedSlotIndices.delete(rect.slotIndex);
      }
    });

    if (this.selectedSlotIndices.size > 0) {
      if (this.selectedSlotIndex === null || !this.selectedSlotIndices.has(this.selectedSlotIndex)) {
        this.selectedSlotIndex = Array.from(this.selectedSlotIndices)[0];
      }
    } else {
      this.selectedSlotIndex = null;
    }
  }

  _renderMarqueeSelectionGhost(ctx) {
    if (!this.marqueeStartPos || !this.marqueeCurrentPos) return;

    const x1 = Math.min(this.marqueeStartPos.x, this.marqueeCurrentPos.x);
    const y1 = Math.min(this.marqueeStartPos.y, this.marqueeCurrentPos.y);
    const x2 = Math.max(this.marqueeStartPos.x, this.marqueeCurrentPos.x);
    const y2 = Math.max(this.marqueeStartPos.y, this.marqueeCurrentPos.y);
    const w = x2 - x1;
    const h = y2 - y1;

    ctx.save();
    
    // Fill translucent light cyan
    ctx.fillStyle = 'rgba(56, 189, 248, 0.16)';
    ctx.fillRect(x1, y1, w, h);

    // Glowing dashed border
    ctx.shadowColor = 'rgba(56, 189, 248, 0.6)';
    ctx.shadowBlur = 6;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(x1, y1, w, h);
    ctx.setLineDash([]);
    ctx.restore();

    // 4 Corner accent dots
    const corners = [
      { x: x1, y: y1 },
      { x: x2, y: y1 },
      { x: x1, y: y2 },
      { x: x2, y: y2 }
    ];
    ctx.save();
    ctx.fillStyle = '#38bdf8';
    corners.forEach(c => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // Selection count badge if at least 1 photo intersected
    const selectedCount = this.selectedSlotIndices ? this.selectedSlotIndices.size : 0;
    if (selectedCount > 0 && (w > 20 || h > 20)) {
      ctx.save();
      const badgeText = `🎯 ${selectedCount} Photo${selectedCount > 1 ? 's' : ''} Selected`;
      ctx.font = 'bold 11px sans-serif';
      const textMetrics = ctx.measureText(badgeText);
      const bW = textMetrics.width + 16;
      const bH = 22;
      const bx = x1 + (w - bW) / 2;
      const by = y1 - bH - 6 < 6 ? y2 + 6 : y1 - bH - 6;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(bx, by, bW, bH, 6);
      } else {
        ctx.rect(bx, by, bW, bH);
      }
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeText, bx + bW / 2, by + bH / 2);
      ctx.restore();
    }
  }

  _renderDragSwapGhost(ctx) {
    if (!this.isDraggingPhotoSwap || this.dragSwapSourceIndex === null) return;
    const spread = this.albumState.getActiveSpread();
    if (!spread) return;
    const srcSlot = spread.slots.find(s => s.slotIndex === this.dragSwapSourceIndex);
    if (!srcSlot || !srcSlot.photoId) return;
    const photo = this.albumState.getPhotoById(srcSlot.photoId);
    if (!photo) return;

    let img = this.albumState.imagePipeline?.getDisplayImage(photo.id) || this._getWorkingImage(photo);
    const gx = this.dragCurrentPos.x + 14;
    const gy = this.dragCurrentPos.y + 14;
    const gw = 68;
    const gh = 68;

    ctx.save();
    // Ghost shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 4;

    // Card background
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(gx, gy, gw, gh, 8);
    } else {
      ctx.rect(gx, gy, gw, gh);
    }
    ctx.fill();

    // Clip image to ghost card
    ctx.save();
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(gx, gy, gw, gh, 8);
    } else {
      ctx.rect(gx, gy, gw, gh);
    }
    ctx.clip();
    if (img && img.complete && img.naturalWidth > 0) {
      const scale = Math.max(gw / img.naturalWidth, gh / img.naturalHeight);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      ctx.drawImage(img, gx + (gw - dw) / 2, gy + (gh - dh) / 2, dw, dh);
    }
    ctx.restore();

    // Border
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(gx, gy, gw, gh, 8);
    } else {
      ctx.rect(gx, gy, gw, gh);
    }
    ctx.stroke();

    // Floating Swap Badge at bottom of ghost
    const badgeW = 60;
    const badgeH = 18;
    const bx = gx + (gw - badgeW) / 2;
    const by = gy + gh - 9;
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(bx, by, badgeW, badgeH, 9);
    } else {
      ctx.rect(bx, by, badgeW, badgeH);
    }
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⇄ Swap', bx + badgeW / 2, by + badgeH / 2);

    ctx.restore();
  }

  _renderEmptyPlaceholder() {
    const ctx = this.ctx;
    ctx.save();
    const cx = this.displayWidth / 2;
    const cy = this.displayHeight / 2;

    const badgeW = Math.min(480, this.displayWidth - 60);
    const badgeH = 38;
    ctx.fillStyle = 'rgba(248, 250, 252, 0.96)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 2;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(cx - badgeW / 2, cy - badgeH / 2, badgeW, badgeH, 19);
    } else {
      ctx.rect(cx - badgeW / 2, cy - badgeH / 2, badgeW, badgeH);
    }
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#64748b';
    ctx.font = '500 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('📥 Drag photos from tray below • Or Right-Click & drag to draw frames', cx, cy);
    ctx.restore();
  }

  _getImage(src) {
    if (!src) return null;
    let targetSrc = src;
    if (typeof targetSrc === 'string' && targetSrc.startsWith('/api/')) {
      targetSrc = (typeof window.getApiUrl === 'function') ? window.getApiUrl(targetSrc) : targetSrc;
    }
    if (this.imageCache.has(targetSrc)) {
      const cached = this.imageCache.get(targetSrc);
      if (cached && !cached._hasError) {
        return cached;
      }
    }
    const img = new Image();
    img._hasError = false;
    img._assignedSrc = targetSrc;
    if (typeof targetSrc === 'string' && targetSrc.startsWith('http')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      img._hasError = false;
      this.requestRender();
    };
    img.onerror = () => {
      img._hasError = true;
      // Chrome/file:/// Fallback: If relative /api/ failed, retry with backend server port 8765
      if (typeof targetSrc === 'string' && targetSrc.includes('/api/local_image') && !targetSrc.startsWith('http://127.0.0.1:8765')) {
        const queryPart = targetSrc.includes('?') ? targetSrc.substring(targetSrc.indexOf('?')) : '';
        const retryUrl = 'http://127.0.0.1:8765/api/local_image' + queryPart;
        const retryImg = new Image();
        retryImg.crossOrigin = 'anonymous';
        retryImg.onload = () => {
          retryImg._hasError = false;
          this.imageCache.set(src, retryImg);
          this.imageCache.set(targetSrc, retryImg);
          this.requestRender();
        };
        retryImg.src = retryUrl;
      }
      this.requestRender();
    };
    img.src = targetSrc;
    this.imageCache.set(src, img);
    if (targetSrc !== src) {
      this.imageCache.set(targetSrc, img);
    }
    return img;
  }

  _getHighResSrc(photo) {
    if (!photo) return null;
    const addPhotoVersion = (src) => {
      if (!src || !src.includes('/api/local_image')) return src;
      const version = photo.lastModified || photo.fileSize || '';
      if (!version || /[?&]v=/.test(src)) return src;
      return `${src}${src.includes('?') ? '&' : '?'}v=${encodeURIComponent(version)}`;
    };
    // Prefer the verified original path, even if a saved preview URL is still in src.
    if (photo.filePath && typeof photo.filePath === 'string' && photo.filePath.length > 2) {
      const ep = `/api/local_image?path=${encodeURIComponent(photo.filePath)}`;
      const url = (typeof window.getApiUrl === 'function') ? window.getApiUrl(ep) : ep;
      return addPhotoVersion(url);
    }
    // A thumbnail URL must never be returned as the print source. In particular,
    // strip the desktop API's thumbnail parameters before loading the original.
    const originalIsThumb = Boolean(photo.originalSrc && photo.thumbSrc && photo.originalSrc === photo.thumbSrc);
    const candidates = originalIsThumb ? [photo.src, photo.originalSrc] : [photo.originalSrc, photo.src];
    for (const candidate of candidates) {
      if (typeof candidate !== 'string' || !candidate) continue;
      if (candidate.includes('/api/local_image')) {
        const clean = candidate.replace(/[?&]thumb=[^&]*/g, '').replace(/[?&]w=\d+/g, '').replace(/\?&/, '?').replace(/&$/, '').replace(/\?$/, '');
        const url = (typeof window.getApiUrl === 'function') ? window.getApiUrl(clean) : clean;
        return addPhotoVersion(url);
      }
      if (candidate.startsWith('blob:') || candidate.startsWith('data:') || !/[?&](thumb|w)=/i.test(candidate)) {
        return addPhotoVersion(candidate);
      }
    }
    return null;
  }

  _getThumbSrc(photo) {
    if (!photo) return null;
    // 0. If photo has active blob: or data: thumbnail, return directly
    if (typeof photo.thumbSrc === 'string' && (photo.thumbSrc.startsWith('blob:') || photo.thumbSrc.startsWith('data:'))) {
      return photo.thumbSrc;
    }
    if (typeof photo.src === 'string' && (photo.src.startsWith('blob:') || photo.src.startsWith('data:'))) {
      return photo.src;
    }
    if (photo.filePath && typeof photo.filePath === 'string' && photo.filePath.length > 2) {
      const ep = `/api/local_image?path=${encodeURIComponent(photo.filePath)}&thumb=1`;
      const url = (typeof window.getApiUrl === 'function') ? window.getApiUrl(ep) : ep;
      const version = photo.lastModified || photo.fileSize || '';
      return version ? `${url}&v=${encodeURIComponent(version)}` : url;
    }
    if (typeof photo.src === 'string' && photo.src.includes('/api/local_image')) {
      const ep = photo.src.includes('thumb=') ? photo.src : (photo.src + '&thumb=1');
      const url = (typeof window.getApiUrl === 'function') ? window.getApiUrl(ep) : ep;
      const version = photo.lastModified || photo.fileSize || '';
      return version && !/[?&]v=/.test(url) ? `${url}&v=${encodeURIComponent(version)}` : url;
    }
    if (photo.thumbSrc) {
      const url = (typeof window.getApiUrl === 'function') ? window.getApiUrl(photo.thumbSrc) : photo.thumbSrc;
      const version = photo.lastModified || photo.fileSize || '';
      return version && url.includes('/api/local_image') && !/[?&]v=/.test(url) ? `${url}${url.includes('?') ? '&' : '?'}v=${encodeURIComponent(version)}` : url;
    }
    return null;
  }

  _getAnyReadyImage(photo) {
    if (!photo) return null;
    const candidates = [];
    const thumbSrc = this._getThumbSrc(photo);
    if (thumbSrc) candidates.push(thumbSrc);
    if (photo.thumbSrc && !candidates.includes(photo.thumbSrc)) candidates.push(photo.thumbSrc);
    if (photo.src && !candidates.includes(photo.src)) candidates.push(photo.src);
    if (photo.originalSrc && !candidates.includes(photo.originalSrc)) candidates.push(photo.originalSrc);

    for (const src of candidates) {
      if (this.imageCache.has(src)) {
        const img = this.imageCache.get(src);
        if (img && img.complete && img.naturalWidth > 0 && !img._hasError) {
          return img;
        }
      }
    }

    // Pre-trigger thumbnail loading if not already in flight
    if (thumbSrc) {
      this._getImage(thumbSrc);
    }
    return null;
  }

  _getWorkingImage(photo) {
    if (!photo) return null;
    const highResSrc = this._getHighResSrc(photo);
    if (!highResSrc) return null;

    // Retrieve or trigger loading of the full-resolution image
    const img = this._getImage(highResSrc);
    if (img && img.complete && img.naturalWidth > 0 && !img._hasError) {
      // Sync natural image dimensions to photo model
      if (img.naturalWidth && img.naturalHeight && (!photo.width || photo.width !== img.naturalWidth)) {
        photo.width = img.naturalWidth;
        photo.height = img.naturalHeight;
        photo.aspect = Number((img.naturalWidth / img.naturalHeight).toFixed(3));
      }
      return img;
    }

    // High-res image is currently loading in background.
    // Return null so slot renderer displays the temporary thumbnail proxy while loading!
    return null;
  }

  preloadAllSpreadImages() {
    if (!this.albumState?.project?.spreads) return;
    // Rendering requests full-resolution sources for the active spread. Keep
    // only nearby-spread thumbnails warm instead of decoding every photo at once.
    this.preloadAdjacentSpreads();
  }

  preloadAdjacentSpreads() {
    if (!this.albumState?.project?.spreads) return;
    const spreads = this.albumState.project.spreads;
    const curr = this.albumState.activeSpreadIndex || 0;
    const targets = [curr - 1, curr + 1];
    for (const t of targets) {
      if (t >= 0 && t < spreads.length) {
        const sp = spreads[t];
        if (sp?.slots) {
          for (const s of sp.slots) {
            if (s.photoId) {
              const p = this.albumState.getPhotoById(s.photoId);
              if (p) {
                const thumb = this._getThumbSrc(p);
                if (thumb) this._getImage(thumb);
              }
            }
          }
        }
      }
    }
  }

  // --- Interactive Hit Testing & Event Handling ---

  _bindEvents() {
    this.canvas.addEventListener('mousemove', (e) => this._onMouseMove(e));
    this.canvas.addEventListener('mousedown', (e) => this._onMouseDown(e));
    this.canvas.addEventListener('mouseup', (e) => this._onMouseUp(e));
    this.canvas.addEventListener('mouseleave', () => this._onMouseLeave());
    this.canvas.addEventListener('wheel', (e) => this._onWheel(e), { passive: false });
    this.canvas.addEventListener('dblclick', (e) => this._onDblClick(e));

    // Touch events for touchscreen PCs and tablets
    const getTouchPos = (touch) => {
      const rect = this.canvas.getBoundingClientRect();
      return {
        clientX: touch.clientX,
        clientY: touch.clientY,
        button: 0,
        preventDefault: () => {}
      };
    };

    let lastTouchTime = 0;
    let lastTouchSlot = null;
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        const fakeE = getTouchPos(e.touches[0]);
        fakeE.preventDefault = () => e.preventDefault();
        const now = Date.now();
        const pos = this._getCanvasCoords(fakeE);
        const hit = this._getSlotAt(pos.x, pos.y);
        if (hit && lastTouchSlot === hit.slotIndex && (now - lastTouchTime) < 350) {
          this._onDblClick(fakeE);
          lastTouchTime = 0;
          lastTouchSlot = null;
          return;
        }
        lastTouchTime = now;
        lastTouchSlot = hit ? hit.slotIndex : null;
        this._onMouseDown(fakeE);
      }
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        if (this.isResizingSlot || this.isPanningPhoto || this.isMovingSlot || this.isDraggingPhotoSwap || this.isPanningCanvas) {
          e.preventDefault();
        }
        const fakeE = getTouchPos(e.touches[0]);
        this._onMouseMove(fakeE);
      }
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      this._onMouseUp(e);
    });

    // HTML5 Drag and Drop from Photo Tray
    this.canvas.addEventListener('dragover', (e) => this._onDragOver(e));
    this.canvas.addEventListener('dragleave', (e) => this._onDragLeave(e));
    this.canvas.addEventListener('drop', (e) => this._onDrop(e));

    // Delete / Backspace key to delete selected frame(s)
    window.addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const indices = (this.selectedSlotIndices && this.selectedSlotIndices.size > 0)
          ? Array.from(this.selectedSlotIndices)
          : (this.selectedSlotIndex !== null ? [this.selectedSlotIndex] : []);
        if (indices.length === 0) return;
        e.preventDefault();
        this.albumState.recordSnapshot();
        // Delete in reverse order to avoid index shifting
        indices.sort((a, b) => b - a).forEach(idx => {
          this.albumState.deleteFrame(this.albumState.activeSpreadIndex, idx);
        });
        this.selectedSlotIndex = null;
        this.selectedSlotIndices.clear();
        this.albumState.notify('slot-deselected');
        window.showToastNotification?.(`🗑️ Deleted ${indices.length} frame(s)`);
        this.requestRender();
      }
    });
  }

  _onDblClick(e) {
    const pos = this._getCanvasCoords(e);
    const hit = this._getSlotAt(pos.x, pos.y);
    if (!hit) return;
    const spread = this.albumState.getActiveSpread();
    const slot = spread?.slots?.find(s => s.slotIndex === hit.slotIndex);
    if (!slot) return;

    this.selectedSlotIndex = hit.slotIndex;
    this.requestRender();

    if (slot.isText) {
      if (window.openTextEditorModal) {
        window.openTextEditorModal(this.albumState.activeSpreadIndex, hit.slotIndex);
      } else {
        this.albumState.notify('text-slot-double-clicked', {
          spreadIndex: this.albumState.activeSpreadIndex,
          slotIndex: hit.slotIndex,
          slot: slot
        });
      }
      return;
    }

    if (!slot.photoId) {
      // Empty / newly drawn frame double-clicked -> prompt file import from project source or disk
      if (window.promptImportPhotoForSlot) {
        window.promptImportPhotoForSlot(this.albumState.activeSpreadIndex, hit.slotIndex);
      } else {
        this.albumState.notify('empty-slot-double-clicked', {
          spreadIndex: this.albumState.activeSpreadIndex,
          slotIndex: hit.slotIndex
        });
      }
    } else {
      this.albumState.notify('slot-double-clicked', {
        spreadIndex: this.albumState.activeSpreadIndex,
        slotIndex: hit.slotIndex
      });
    }
  }

  _getCanvasCoords(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = (rect.width > 0) ? (this.displayWidth / rect.width) : 1;
    const scaleY = (rect.height > 0) ? (this.displayHeight / rect.height) : 1;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  _isPointInSlot(x, y, r, tol = 2) {
    let testX = x;
    let testY = y;
    const rot = r.rotation || 0;
    if (rot !== 0) {
      const cx = r.x + r.width / 2;
      const cy = r.y + r.height / 2;
      const rad = (-rot * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const dx = x - cx;
      const dy = y - cy;
      testX = cx + dx * cos - dy * sin;
      testY = cy + dx * sin + dy * cos;
    }
    if (testX < r.x - tol || testX > r.x + r.width + tol || testY < r.y - tol || testY > r.y + r.height + tol) {
      return false;
    }
    const shape = r.shape || 'rectangle';
    if (shape === 'circle') {
      const cx = r.x + r.width / 2;
      const cy = r.y + r.height / 2;
      const rx = r.width / 2 + tol;
      const ry = r.height / 2 + tol;
      const dx = (testX - cx) / rx;
      const dy = (testY - cy) / ry;
      return (dx * dx + dy * dy) <= 1;
    }
    if (shape === 'diamond') {
      const cx = r.x + r.width / 2;
      const cy = r.y + r.height / 2;
      const dx = Math.abs(testX - cx) / (r.width / 2 + tol);
      const dy = Math.abs(testY - cy) / (r.height / 2 + tol);
      return (dx + dy) <= 1;
    }
    return true;
  }

  _getAllSlotsAt(x, y) {
    if (!this.cachedRectangles || this.cachedRectangles.length === 0) return [];
    const tol = 2;
    const matches = [];
    // Search in reverse order so topmost visual layer is first
    for (let i = this.cachedRectangles.length - 1; i >= 0; i--) {
      const r = this.cachedRectangles[i];
      if (this._isPointInSlot(x, y, r, tol)) {
        matches.push(r);
      }
    }
    return matches;
  }

  _getSlotAt(x, y, cycleOnSelection = false) {
    const all = this._getAllSlotsAt(x, y);
    if (all.length === 0) return null;
    if (all.length === 1) return all[0];

    // When multiple frames overlap at (x, y), cycling allows effortless front & back selection
    if (cycleOnSelection && this.selectedSlotIndex !== null) {
      const currIdxInMatches = all.findIndex(r => r.slotIndex === this.selectedSlotIndex);
      if (currIdxInMatches !== -1) {
        const nextIdx = (currIdxInMatches + 1) % all.length;
        const targetHit = all[nextIdx];
        window.showToastNotification?.(`📑 Selected Layer ${nextIdx + 1}/${all.length} (Frame ${targetHit.slotIndex + 1}) • Tap to cycle`);
        return targetHit;
      }
    }
    return all[0];
  }

  _getResizeCursor(handle) {
    switch (handle) {
      case 'tl':
      case 'br':
        return 'nwse-resize';
      case 'tr':
      case 'bl':
        return 'nesw-resize';
      case 'lm':
      case 'rm':
        return 'ew-resize';
      case 'tm':
      case 'bm':
        return 'ns-resize';
      default:
        return 'default';
    }
  }

  _getCornerAt(x, y) {
    if (!this.cachedRectangles || this.cachedRectangles.length === 0) return null;
    const cornerHitRadius = 20;
    const edgeHitRadius = 18;

    const selectedList = (this.selectedSlotIndices && this.selectedSlotIndices.size > 0)
      ? Array.from(this.selectedSlotIndices)
      : (this.selectedSlotIndex !== null ? [this.selectedSlotIndex] : []);

    const activeSpread = this.albumState.getActiveSpread();
    // Check selected slot(s) first, then all other slots so handles are always responsive
    const allSlotIndices = this.cachedRectangles.map(r => r.slotIndex);
    const searchOrder = [...new Set([...selectedList, ...allSlotIndices])];

    for (const sIdx of searchOrder) {
      const slot = activeSpread?.slots?.find(s => s.slotIndex === sIdx);
      const isSlotSelected = (this.selectedSlotIndex === sIdx) || (this.selectedSlotIndices && this.selectedSlotIndices.has(sIdx));
      if (slot?.isText && !isSlotSelected) continue; // Text slots only have active handles when clicked/selected

      const rect = this.cachedRectangles.find(r => r.slotIndex === sIdx);
      if (!rect) continue;

      const rot = slot?.rotation || rect.rotation || 0;
      let testX = x;
      let testY = y;
      if (rot !== 0) {
        const cx = rect.x + rect.width / 2;
        const cy = rect.y + rect.height / 2;
        const rad = (-rot * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const dx = x - cx;
        const dy = y - cy;
        testX = cx + dx * cos - dy * sin;
        testY = cy + dx * sin + dy * cos;
      }

      const handles = [
        // 4 Corner handles (freeform 2D sizing)
        { handle: 'tl', x: rect.x, y: rect.y, r: cornerHitRadius },
        { handle: 'tr', x: rect.x + rect.width, y: rect.y, r: cornerHitRadius },
        { handle: 'bl', x: rect.x, y: rect.y + rect.height, r: cornerHitRadius },
        { handle: 'br', x: rect.x + rect.width, y: rect.y + rect.height, r: cornerHitRadius },
        // 4 Edge midpoint handles (width / height sizing)
        { handle: 'tm', x: rect.x + rect.width / 2, y: rect.y, r: edgeHitRadius },
        { handle: 'bm', x: rect.x + rect.width / 2, y: rect.y + rect.height, r: edgeHitRadius },
        { handle: 'lm', x: rect.x, y: rect.y + rect.height / 2, r: edgeHitRadius },
        { handle: 'rm', x: rect.x + rect.width, y: rect.y + rect.height / 2, r: edgeHitRadius }
      ];

      for (const h of handles) {
        if (Math.hypot(testX - h.x, testY - h.y) <= h.r) {
          return {
            handle: h.handle,
            rect: rect,
            slotIndex: rect.slotIndex
          };
        }
      }
    }
    return null;
  }

  _getRotationHandleAt(x, y) {
    if (!this.cachedRectangles || this.cachedRectangles.length === 0) return null;
    const activeSpread = this.albumState.getActiveSpread();
    if (!activeSpread) return null;

    const selectedList = (this.selectedSlotIndices && this.selectedSlotIndices.size > 0)
      ? Array.from(this.selectedSlotIndices)
      : (this.selectedSlotIndex !== null ? [this.selectedSlotIndex] : []);
    const allSlotIndices = this.cachedRectangles.map(r => r.slotIndex);
    const searchOrder = [...new Set([...selectedList, ...allSlotIndices])];

    for (const sIdx of searchOrder) {
      const slot = activeSpread.slots?.find(s => s.slotIndex === sIdx);
      const rect = this.cachedRectangles.find(r => r.slotIndex === sIdx);
      if (!rect) continue;

      const rot = slot?.rotation || rect.rotation || 0;
      const cx = rect.x + rect.width / 2;
      const cy = rect.y + rect.height / 2;

      let localX = x;
      let localY = y;
      if (rot !== 0) {
        const rad = (-rot * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const dx = x - cx;
        const dy = y - cy;
        localX = cx + dx * cos - dy * sin;
        localY = cy + dx * sin + dy * cos;
      }

      // 1. Top stem handle (24px above top-center)
      const stemDist = Math.hypot(localX - cx, localY - (rect.y - 24));
      if (stemDist <= 14) {
        return {
          type: 'stem',
          handle: 'rotate',
          slotIndex: rect.slotIndex,
          rect: rect,
          cx: cx,
          cy: cy
        };
      }

      // 2. Corner rotation zones (just outside each of the 4 corners, radius 9px to 28px)
      const corners = [
        { handle: 'rotate-tl', x: rect.x, y: rect.y },
        { handle: 'rotate-tr', x: rect.x + rect.width, y: rect.y },
        { handle: 'rotate-bl', x: rect.x, y: rect.y + rect.height },
        { handle: 'rotate-br', x: rect.x + rect.width, y: rect.y + rect.height }
      ];

      for (const c of corners) {
        const d = Math.hypot(localX - c.x, localY - c.y);
        if (d >= 9 && d <= 28) {
          return {
            type: 'corner',
            handle: 'rotate',
            slotIndex: rect.slotIndex,
            rect: rect,
            cx: cx,
            cy: cy
          };
        }
      }
    }
    return null;
  }

  _getFrameEdgeAt(x, y) {
    if (!this.cachedRectangles || this.cachedRectangles.length === 0) return null;
    const threshold = 22;
    const activeSpread = this.albumState.getActiveSpread();

    // Check selected slot first
    if (this.selectedSlotIndex !== null) {
      const selRect = this.cachedRectangles.find(r => r.slotIndex === this.selectedSlotIndex);
      if (selRect) {
        const slot = activeSpread?.slots?.find(s => s.slotIndex === selRect.slotIndex);
        const rot = slot?.rotation || selRect.rotation || 0;
        let testX = x, testY = y;
        if (rot !== 0) {
          const cx = selRect.x + selRect.width / 2;
          const cy = selRect.y + selRect.height / 2;
          const rad = (-rot * Math.PI) / 180;
          const cos = Math.cos(rad);
          const sin = Math.sin(rad);
          const dx = x - cx;
          const dy = y - cy;
          testX = cx + dx * cos - dy * sin;
          testY = cy + dx * sin + dy * cos;
        }
        const badgeX = selRect.x + selRect.width / 2;
        const badgeY = selRect.y - 13;
        if (Math.hypot(testX - badgeX, testY - badgeY) <= 22) {
          return { slotIndex: selRect.slotIndex, rect: selRect, isMoveBadge: true };
        }
        const withinOuter = (testX >= selRect.x - threshold && testX <= selRect.x + selRect.width + threshold &&
                             testY >= selRect.y - threshold && testY <= selRect.y + selRect.height + threshold);
        const withinInner = (testX >= selRect.x + threshold && testX <= selRect.x + selRect.width - threshold &&
                             testY >= selRect.y + threshold && testY <= selRect.y + selRect.height - threshold);
        if (withinOuter && !withinInner) {
          return { slotIndex: selRect.slotIndex, rect: selRect };
        }
      }
    }

    for (let i = 0; i < this.cachedRectangles.length; i++) {
      const rect = this.cachedRectangles[i];
      const slot = activeSpread?.slots?.find(s => s.slotIndex === rect.slotIndex);
      const rot = slot?.rotation || rect.rotation || 0;
      let testX = x, testY = y;
      if (rot !== 0) {
        const cx = rect.x + rect.width / 2;
        const cy = rect.y + rect.height / 2;
        const rad = (-rot * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const dx = x - cx;
        const dy = y - cy;
        testX = cx + dx * cos - dy * sin;
        testY = cy + dx * sin + dy * cos;
      }
      const withinOuter = (testX >= rect.x - threshold && testX <= rect.x + rect.width + threshold &&
                           testY >= rect.y - threshold && testY <= rect.y + rect.height + threshold);
      const withinInner = (testX >= rect.x + threshold && testX <= rect.x + rect.width - threshold &&
                           testY >= rect.y + threshold && testY <= rect.y + rect.height - threshold);
      if (withinOuter && !withinInner) {
        return { slotIndex: rect.slotIndex, rect };
      }
    }
    return null;
  }

  _getDeleteBtnAt(x, y) {
    if (!this.cachedRectangles || this.cachedRectangles.length === 0) return null;
    const activeSpread = this.albumState.getActiveSpread();
    for (let i = 0; i < this.cachedRectangles.length; i++) {
      const rect = this.cachedRectangles[i];
      const slot = activeSpread?.slots?.find(s => s.slotIndex === rect.slotIndex);
      const isSelected = (this.selectedSlotIndex === rect.slotIndex) || (this.selectedSlotIndices && this.selectedSlotIndices.has(rect.slotIndex));
      if (slot?.isText && !isSelected) continue; // Text slots have delete button only when selected

      const isHovered = (this.hoveredSlotIndex === rect.slotIndex);
      if (isSelected || isHovered) {
        const rot = slot?.rotation || rect.rotation || 0;
        let testX = x, testY = y;
        if (rot !== 0) {
          const cx = rect.x + rect.width / 2;
          const cy = rect.y + rect.height / 2;
          const rad = (-rot * Math.PI) / 180;
          const cos = Math.cos(rad);
          const sin = Math.sin(rad);
          const dx = x - cx;
          const dy = y - cy;
          testX = cx + dx * cos - dy * sin;
          testY = cy + dx * sin + dy * cos;
        }
        const delBtnX = rect.x + 14;
        const delBtnY = rect.y + 14;
        if (Math.hypot(testX - delBtnX, testY - delBtnY) <= 14) {
          return { slotIndex: rect.slotIndex, rect };
        }
      }
    }
    return null;
  }

  _onMouseMove(e) {
    const pos = this._getCanvasCoords(e);
    const isShiftOrCtrl = Boolean(e.shiftKey || e.ctrlKey);

    if (this.activeTool === 'hand' && !this.isPanningCanvas) {
      this.canvas.style.cursor = 'grab';
      return;
    }
    if (this.activeTool === 'text') {
      this.canvas.style.cursor = 'text';
      return;
    }

    // Live Rulers Hairline update
    if (this.showRulers) {
      this.renderRulers(pos);
    }

    // Right-Click Drag to Draw Frames Detection
    if (this.isRightMouseDown) {
      const dist = Math.hypot(pos.x - this.rightMouseDownPos.x, pos.y - this.rightMouseDownPos.y);
      if (dist > 15 || this.isRightClickDrawing) {
        this.isRightClickDrawing = true;
        this.isDrawingNewFrame = true;
        this.drawFrameStartPos = this.rightMouseDownPos;
        if (e && (e.shiftKey || this.currentDrawShape === 'circle' || this.currentDrawShape === 'diamond')) {
          const rawW = Math.abs(pos.x - this.drawFrameStartPos.x);
          const rawH = Math.abs(pos.y - this.drawFrameStartPos.y);
          const side = Math.max(rawW, rawH);
          const signX = pos.x >= this.drawFrameStartPos.x ? 1 : -1;
          const signY = pos.y >= this.drawFrameStartPos.y ? 1 : -1;
          this.drawFrameCurrentPos = {
            x: this.drawFrameStartPos.x + signX * side,
            y: this.drawFrameStartPos.y + signY * side
          };
        } else {
          this.drawFrameCurrentPos = { x: pos.x, y: pos.y };
        }
        this.canvas.style.cursor = 'crosshair';
        this.requestRender();
        return;
      }
    }

    // Hand Tool Canvas Panning
    if (this.isPanningCanvas) {
      const dx = e.clientX - this.panStartPos.x;
      const dy = e.clientY - this.panStartPos.y;
      this.panStartPos = { x: e.clientX, y: e.clientY };
      if (typeof window.panCanvasBy === 'function') {
        window.panCanvasBy(dx, dy);
      } else {
        const scrollContainer = document.getElementById('canvasWrapper') || this.canvas.parentElement;
        if (scrollContainer) {
          scrollContainer.scrollLeft -= dx;
          scrollContainer.scrollTop -= dy;
        }
      }
      this.canvas.style.cursor = 'grabbing';
      return;
    }

    // Gesture: Rotating Slot in Circular Motion
    if (this.isRotatingSlot && this.rotateCenter) {
      const curAngle = Math.atan2(pos.y - this.rotateCenter.y, pos.x - this.rotateCenter.x);
      const diffRad = curAngle - this.rotateStartAngle;
      const diffDeg = (diffRad * 180) / Math.PI;
      let newRot = Math.round(this.rotateInitialSlotRotation + diffDeg) % 360;
      if (newRot < 0) newRot += 360;

      if (e.shiftKey) {
        newRot = Math.round(newRot / 15) * 15;
      } else {
        for (const snap of [0, 45, 90, 135, 180, 225, 270, 315, 360]) {
          if (Math.abs(newRot - snap) <= 3) {
            newRot = snap % 360;
            break;
          }
        }
      }

      const spread = this.albumState.getActiveSpread();
      const targetSlot = spread?.slots?.find(s => s.slotIndex === this.rotateSlotIndex);
      if (targetSlot) {
        targetSlot.rotation = newRot;
        if (targetSlot.rect) targetSlot.rect.rotation = newRot;
      }
      const r = this.cachedRectangles?.find(cr => cr.slotIndex === this.rotateSlotIndex);
      if (r) r.rotation = newRot;

      if (window.updateLiveTransformReadouts) window.updateLiveTransformReadouts();
      this.canvas.style.cursor = 'crosshair';
      this.requestRender();
      return;
    }

    // 0. Gesture: Drawing New Frame Rectangle (Click and Drag anywhere)
    if (this.isDrawingNewFrame) {
      if (e && (e.shiftKey || this.currentDrawShape === 'circle' || this.currentDrawShape === 'diamond')) {
        // Photoshop Shift Modifier: 1:1 Aspect Ratio constraint
        const rawW = Math.abs(pos.x - this.drawFrameStartPos.x);
        const rawH = Math.abs(pos.y - this.drawFrameStartPos.y);
        const side = Math.max(rawW, rawH);
        const signX = pos.x >= this.drawFrameStartPos.x ? 1 : -1;
        const signY = pos.y >= this.drawFrameStartPos.y ? 1 : -1;
        this.drawFrameCurrentPos = {
          x: this.drawFrameStartPos.x + signX * side,
          y: this.drawFrameStartPos.y + signY * side
        };
      } else {
        this.drawFrameCurrentPos = { x: pos.x, y: pos.y };
      }
      this.canvas.style.cursor = 'crosshair';
      this.requestRender();
      return;
    }

    // 0.5. Gesture: Photo Drag-to-Swap in Progress (Zero Lag, smooth tracking)
    if (this.isDraggingPhotoSwap) {
      this.dragCurrentPos = { x: pos.x, y: pos.y };
      const targetSlot = this._getSlotAt(pos.x, pos.y);
      if (targetSlot && targetSlot.slotIndex !== this.dragSwapSourceIndex) {
        this.dragSwapTargetIndex = targetSlot.slotIndex;
      } else {
        this.dragSwapTargetIndex = null;
      }
      this.canvas.style.cursor = 'copy';
      this.requestRender();
      return;
    }

    // 1. Gesture: Marquee Drag Selection across canvas
    if (this.isMarqueeSelecting && this.marqueeStartPos) {
      this.marqueeCurrentPos = { x: pos.x, y: pos.y };
      this._updateMarqueeSelection(this.marqueeStartPos.x, this.marqueeStartPos.y, pos.x, pos.y, isShiftOrCtrl);
      this.canvas.style.cursor = 'crosshair';
      this.requestRender();
      return;
    }

    // 2. Gesture: Resizing Frame (Single or Multi-selection corner/edge handle dragging)
    if (this.isResizingSlot && this.initialPixelRect) {
      const dx = pos.x - this.resizeStartPos.x;
      const dy = pos.y - this.resizeStartPos.y;
      const init = this.initialPixelRect;
      const ar = this.slotAspectRatio || (init.width / Math.max(1, init.height));
      const minW = 24;
      const minH = 24;

      const isSpread = (this.albumState.project.pageMode !== 'single');
      const centerX = this.displayWidth / 2;
      const midMarginPct = isSpread ? (this.albumState.getSpreadMiddleMarginPercent(this.albumState.activeSpreadIndex) || 0) : 0;
      const halfMiddle = Math.round((this.displayWidth * (midMarginPct / 100)) / 2);

      let pageMinX = 0;
      let pageMaxX = this.displayWidth;
      const pageMinY = 0;
      const pageMaxY = this.displayHeight;

      if (isSpread) {
        const isLeftSheet = (init.x + init.width / 2) < centerX;
        if (isLeftSheet) {
          pageMinX = 0;
          pageMaxX = Math.max(minW, centerX - halfMiddle);
        } else {
          pageMinX = Math.min(this.displayWidth - minW, centerX + halfMiddle);
          pageMaxX = this.displayWidth;
        }
      }

      // Photoshop Modifiers:
      // Shift: Constrain aspect ratio (1:1 for circles/diamonds, or keep proportions)
      // Ctrl/Alt: Scale proportionally from center
      const isShift = Boolean(e && e.shiftKey) || init.shape === 'circle' || init.shape === 'diamond';
      const isCenterScale = Boolean(e && (e.altKey || e.ctrlKey));

      let newX = init.x;
      let newY = init.y;
      let newW = init.width;
      let newH = init.height;

      if (this.resizeCorner === 'br') {
        newW = Math.max(minW, init.width + dx);
        newH = isShift ? Math.max(minH, (init.shape === 'circle' || init.shape === 'diamond') ? newW : newW / ar) : Math.max(minH, init.height + dy);
        newX = init.x; newY = init.y;
      } else if (this.resizeCorner === 'tl') {
        const anchorX = init.x + init.width;
        const anchorY = init.y + init.height;
        newW = Math.max(minW, init.width - dx);
        newH = isShift ? Math.max(minH, (init.shape === 'circle' || init.shape === 'diamond') ? newW : newW / ar) : Math.max(minH, init.height - dy);
        newX = anchorX - newW; newY = anchorY - newH;
      } else if (this.resizeCorner === 'tr') {
        const anchorX = init.x;
        const anchorY = init.y + init.height;
        newW = Math.max(minW, init.width + dx);
        newH = isShift ? Math.max(minH, (init.shape === 'circle' || init.shape === 'diamond') ? newW : newW / ar) : Math.max(minH, init.height - dy);
        newX = anchorX; newY = anchorY - newH;
      } else if (this.resizeCorner === 'bl') {
        const anchorX = init.x + init.width;
        const anchorY = init.y;
        newW = Math.max(minW, init.width - dx);
        newH = isShift ? Math.max(minH, (init.shape === 'circle' || init.shape === 'diamond') ? newW : newW / ar) : Math.max(minH, init.height + dy);
        newX = anchorX - newW; newY = anchorY;
      } else if (this.resizeCorner === 'rm') {
        newW = Math.max(minW, init.width + dx);
        newH = (init.shape === 'circle' || init.shape === 'diamond') ? newW : init.height;
        newX = init.x; newY = init.y;
      } else if (this.resizeCorner === 'lm') {
        const anchorX = init.x + init.width;
        newW = Math.max(minW, init.width - dx);
        newH = (init.shape === 'circle' || init.shape === 'diamond') ? newW : init.height;
        newX = anchorX - newW; newY = init.y;
      } else if (this.resizeCorner === 'bm') {
        newH = Math.max(minH, init.height + dy);
        newW = (init.shape === 'circle' || init.shape === 'diamond') ? newH : init.width;
        newX = init.x; newY = init.y;
      } else if (this.resizeCorner === 'tm') {
        const anchorY = init.y + init.height;
        newH = Math.max(minH, init.height - dy);
        newW = (init.shape === 'circle' || init.shape === 'diamond') ? newH : init.width;
        newX = init.x; newY = anchorY - newH;
      }

      if (isCenterScale) {
        newX = Math.round(init.x - (newW - init.width) / 2);
        newY = Math.round(init.y - (newH - init.height) / 2);
      }

      // Calculate Snap Guides against other frames & spread edges
      const excludeSet = (this.selectedSlotIndices && this.selectedSlotIndices.size > 0)
        ? this.selectedSlotIndices
        : new Set([this.resizeSlotIndex]);

      const snapResult = this._calculateSnapGuides(
        { x: newX, y: newY, width: newW, height: newH },
        excludeSet,
        true,
        this.resizeCorner
      );

      newX = snapResult.rect.x;
      newY = snapResult.rect.y;
      newW = snapResult.rect.width;
      newH = snapResult.rect.height;
      this.activeSnapGuides = snapResult.guides;

      if (this.initialMultiSlotRects && this.initialMultiSlotRects.size > 1 && this.initialGroupBounds) {
        // Multi-Selection Group Resizing
        const scaleW = Math.max(0.1, newW / Math.max(1, init.width));
        const scaleH = Math.max(0.1, newH / Math.max(1, init.height));

        this.initialMultiSlotRects.forEach((sInit, sIdx) => {
          const sW = Math.max(minW, Math.round(sInit.width * scaleW));
          const sH = Math.max(minH, Math.round(sInit.height * scaleH));
          const sX = Math.round(newX + (sInit.x - init.x) * scaleW);
          const sY = Math.round(newY + (sInit.y - init.y) * scaleH);

          this.albumState.updateSlotPixelRect(
            this.albumState.activeSpreadIndex,
            sIdx,
            { x: sX, y: sY, width: sW, height: sH },
            this.displayWidth,
            this.displayHeight
          );
        });
      } else {
        this.albumState.updateSlotPixelRect(
          this.albumState.activeSpreadIndex,
          this.resizeSlotIndex,
          { x: Math.round(newX), y: Math.round(newY), width: Math.round(newW), height: Math.round(newH) },
          this.displayWidth,
          this.displayHeight
        );
      }

      // If slot is a text layer, adjust font size dynamically in all directions as frame is resized
      const activeSpreadForText = this.albumState.getActiveSpread();
      const targetTextSlot = activeSpreadForText?.slots?.find(s => s.slotIndex === this.resizeSlotIndex);
      if (targetTextSlot && targetTextSlot.isText) {
        const initH = init.height;
        const hScale = newH / Math.max(1, initH);
        const baseFontSize = this.initialTextFontSize || targetTextSlot.fontSize || 28;
        targetTextSlot.fontSize = Math.max(8, Math.min(300, Math.round(baseFontSize * hScale)));
      }

      this.canvas.style.cursor = this._getResizeCursor(this.resizeCorner);
      this.requestRender();
      return;
    }

    // 3. Gesture: Moving Frame (Single or Multi-selection Dragging across canvas)
    if (this.isMovingSlot && this.initialSlotPixelRect) {
      const dx = pos.x - this.moveStartPos.x;
      const dy = pos.y - this.moveStartPos.y;
      const isSpread = (this.albumState.project.pageMode !== 'single');
      const centerX = this.displayWidth / 2;
      const midMarginPct = isSpread ? (this.albumState.getSpreadMiddleMarginPercent(this.albumState.activeSpreadIndex) || 0) : 0;
      const halfMiddle = Math.round((this.displayWidth * (midMarginPct / 100)) / 2);

      const excludeSet = (this.selectedSlotIndices && this.selectedSlotIndices.size > 0)
        ? this.selectedSlotIndices
        : new Set([this.moveSlotIndex]);

      if (this.initialMultiSlotRects && this.initialMultiSlotRects.size > 1) {
        // Multi-Selection Group Moving with Smart Alignment Snap
        const primaryInit = this.initialMultiSlotRects.get(this.moveSlotIndex) || this.initialSlotPixelRect;
        const rawBox = {
          x: primaryInit.x + dx,
          y: primaryInit.y + dy,
          width: primaryInit.width,
          height: primaryInit.height
        };

        const snapResult = this._calculateSnapGuides(rawBox, excludeSet, false);
        this.activeSnapGuides = snapResult.guides;
        const snappedDx = snapResult.rect.x - primaryInit.x;
        const snappedDy = snapResult.rect.y - primaryInit.y;

        const activeSpread = this.albumState.getActiveSpread();
        this.initialMultiSlotRects.forEach((init, slotIdx) => {
          const slotObj = activeSpread?.slots?.find(s => s.slotIndex === slotIdx);
          const isText = Boolean(slotObj?.isText);

          let sheetMinX = 0;
          let sheetMaxX = Math.max(0, this.displayWidth - init.width);

          if (isSpread && !isText) {
            const isLeftSheet = (init.x + init.width / 2) < centerX;
            if (isLeftSheet) {
              sheetMinX = 0;
              sheetMaxX = Math.max(0, centerX - halfMiddle - init.width);
            } else {
              sheetMinX = centerX + halfMiddle;
              sheetMaxX = Math.max(sheetMinX, this.displayWidth - init.width);
            }
          }

          const maxH = this.displayHeight;
          const newX = Math.max(sheetMinX, Math.min(sheetMaxX, init.x + snappedDx));
          const newY = Math.max(0, Math.min(maxH - init.height, init.y + snappedDy));

          this.albumState.updateSlotPixelRect(
            this.albumState.activeSpreadIndex,
            slotIdx,
            { x: Math.round(newX), y: Math.round(newY), width: init.width, height: init.height },
            this.displayWidth,
            this.displayHeight
          );
        });
      } else {
        const init = this.initialSlotPixelRect;
        const rawBox = {
          x: init.x + dx,
          y: init.y + dy,
          width: init.width,
          height: init.height
        };

        const snapResult = this._calculateSnapGuides(rawBox, excludeSet, false);
        this.activeSnapGuides = snapResult.guides;

        const activeSpread = this.albumState.getActiveSpread();
        const movingSlot = activeSpread?.slots?.find(s => s.slotIndex === this.moveSlotIndex);
        const isText = Boolean(movingSlot?.isText);

        let sheetMinX = 0;
        let sheetMaxX = Math.max(0, this.displayWidth - init.width);

        if (isSpread && !isText) {
          const isLeftSheet = (init.x + init.width / 2) < centerX;
          if (isLeftSheet) {
            sheetMinX = 0;
            sheetMaxX = Math.max(0, centerX - halfMiddle - init.width);
          } else {
            sheetMinX = centerX + halfMiddle;
            sheetMaxX = Math.max(sheetMinX, this.displayWidth - init.width);
          }
        }

        const maxH = this.displayHeight;
        const newX = Math.max(sheetMinX, Math.min(sheetMaxX, snapResult.rect.x));
        const newY = Math.max(0, Math.min(maxH - init.height, snapResult.rect.y));

        this.albumState.updateSlotPixelRect(
          this.albumState.activeSpreadIndex,
          this.moveSlotIndex,
          { x: Math.round(newX), y: Math.round(newY), width: init.width, height: init.height },
          this.displayWidth,
          this.displayHeight
        );
      }

      this.canvas.style.cursor = 'move';
      this.requestRender();
      return;
    }

    // 3.5. Gesture: Panning Photo Inside Frame in all directions
    if (this.isPanningPhoto && this.pointerDownSlot !== null) {
      const dx = pos.x - this.pointerDownPos.x;
      const dy = pos.y - this.pointerDownPos.y;
      const spread = this.albumState.getActiveSpread();
      const srcSlot = spread?.slots.find(s => s.slotIndex === this.pointerDownSlot);

      if (srcSlot && srcSlot.photoId) {
        srcSlot.panX = Math.round((this.initialPan.x || 0) + dx);
        srcSlot.panY = Math.round((this.initialPan.y || 0) + dy);
        this.canvas.style.cursor = 'grabbing';
        this.albumState.notify('slot-pan-updated', {
          slotIndex: srcSlot.slotIndex,
          panX: srcSlot.panX,
          panY: srcSlot.panY
        });

        const dist = Math.hypot(dx, dy);
        const currentSlotAtCursor = this._getSlotAt(pos.x, pos.y);
        if (dist > 35 && currentSlotAtCursor && currentSlotAtCursor.slotIndex !== this.pointerDownSlot) {
          this.isDraggingPhotoSwap = true;
          this.dragSwapSourceIndex = this.pointerDownSlot;
          this.dragCurrentPos = { x: pos.x, y: pos.y };
          this.dragSwapTargetIndex = currentSlotAtCursor.slotIndex;
        } else {
          this.isDraggingPhotoSwap = false;
          this.dragSwapTargetIndex = null;
        }

        this.requestRender();
        return;
      }
    }

    // 4. Gesture: Active Drag Detection (Photo Pan vs Photo Swap vs Frame Move)
    if (this.isPotentialDrag) {
      const dx = pos.x - this.pointerDownPos.x;
      const dy = pos.y - this.pointerDownPos.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 4) {
        if (this.dragStartOnEdge) {
          this.isMovingSlot = true;
          this.moveSlotIndex = this.pointerDownSlot;
          this.moveStartPos = { x: this.pointerDownPos.x, y: this.pointerDownPos.y };
          this.initialSlotPixelRect = { ...this.pointerDownRect };
          this.canvas.style.cursor = 'move';
          this.albumState.recordSnapshot();
          this.isPotentialDrag = false;
          return;
        }

        const spread = this.albumState.getActiveSpread();
        const srcSlot = spread?.slots.find(s => s.slotIndex === this.pointerDownSlot);

        if (srcSlot && srcSlot.photoId) {
          // Direct touch & drag moves photo in all directions inside frame
          this.isPanningPhoto = true;
          srcSlot.panX = Math.round((this.initialPan.x || 0) + dx);
          srcSlot.panY = Math.round((this.initialPan.y || 0) + dy);
          this.canvas.style.cursor = 'grabbing';
          this.requestRender();
          this.albumState.notify('slot-pan-updated', {
            slotIndex: srcSlot.slotIndex,
            panX: srcSlot.panX,
            panY: srcSlot.panY
          });

          const currentSlotAtCursor = this._getSlotAt(pos.x, pos.y);
          if (dist > 35 && currentSlotAtCursor && currentSlotAtCursor.slotIndex !== this.pointerDownSlot) {
            this.isDraggingPhotoSwap = true;
            this.dragSwapSourceIndex = this.pointerDownSlot;
            this.dragCurrentPos = { x: pos.x, y: pos.y };
            this.dragSwapTargetIndex = currentSlotAtCursor.slotIndex;
          } else {
            this.isDraggingPhotoSwap = false;
            this.dragSwapTargetIndex = null;
          }
          return;
        } else {
          // Empty frame or text frame -> Move frame
          this.isMovingSlot = true;
          this.moveSlotIndex = this.pointerDownSlot;
          this.moveStartPos = { x: this.pointerDownPos.x, y: this.pointerDownPos.y };
          this.initialSlotPixelRect = { ...this.pointerDownRect };
          this.canvas.style.cursor = 'move';
          this.albumState.recordSnapshot();
          this.isPotentialDrag = false;
          return;
        }
      }
    }

    // 5. Hover states detection & intuitive cursors
    if (this._getDeleteBtnAt(pos.x, pos.y)) {
      this.canvas.style.cursor = 'pointer';
      return;
    }

    if (this.activeTool === 'hand') {
      this.canvas.style.cursor = 'grab';
      return;
    }

    const corner = this._getCornerAt(pos.x, pos.y);
    if (corner) {
      this.canvas.style.cursor = this._getResizeCursor(corner.handle);
      return;
    }

    const rotHandle = this._getRotationHandleAt(pos.x, pos.y);
    if (rotHandle) {
      this.canvas.style.cursor = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%230284c7\' stroke-width=\'2.5\'%3E%3Cpath d=\'M23 4v6h-6\'/%3E%3Cpath d=\'M20.49 15a9 9 0 1 1-2.12-9.36L23 10\'/%3E%3C/svg%3E") 12 12, crosshair';
      return;
    }

    if (this._getFrameEdgeAt(pos.x, pos.y)) {
      this.canvas.style.cursor = 'move';
      return;
    }

    const hit = this._getSlotAt(pos.x, pos.y);
    const newIdx = hit ? hit.slotIndex : null;
    if (hit) {
      const spread = this.albumState.getActiveSpread();
      const slot = spread?.slots.find(s => s.slotIndex === hit.slotIndex);
      this.canvas.style.cursor = slot?.isText ? 'move' : (slot?.photoId ? 'grab' : 'pointer');
    } else {
      this.canvas.style.cursor = this.drawNewFrameMode ? 'crosshair' : 'default';
    }

    if (newIdx !== this.hoveredSlotIndex) {
      this.hoveredSlotIndex = newIdx;
      this.requestRender();
    }
  }

  _onMouseDown(e) {
    if (this.activeTool === 'hand' && e.button === 2) return;
    if (e.button === 2) {
      // Right-click down: prepare for right-click drag to draw new frame
      const pos = this._getCanvasCoords(e);
      this.isRightMouseDown = true;
      this.rightMouseDownPos = { x: pos.x, y: pos.y };
      this.isRightClickDrawing = false;
      return;
    }
    if (e.button !== 0) return; // only left click
    const pos = this._getCanvasCoords(e);
    const isShiftOrCtrl = Boolean(e.shiftKey || e.ctrlKey);

    // Hand Tool Canvas Panning
    if (this.activeTool === 'hand' || e.spaceKey) {
      this.isPanningCanvas = true;
      this.panStartPos = { x: e.clientX, y: e.clientY };
      this.canvas.style.cursor = 'grabbing';
      return;
    }

    if (this.activeTool === 'text') {
      const isSpread = this.albumState.project.pageMode !== 'single';
      const boxWidth = this.displayWidth * (isSpread ? 0.30 : 0.70);
      const boxHeight = Math.max(56, this.displayHeight * 0.10);
      const x = Math.max(0, Math.min(this.displayWidth - boxWidth, pos.x - boxWidth / 2));
      const y = Math.max(0, Math.min(this.displayHeight - boxHeight, pos.y - boxHeight / 2));
      const rect = {
        x: x / this.displayWidth,
        y: y / this.displayHeight,
        width: boxWidth / this.displayWidth,
        height: boxHeight / this.displayHeight,
        w: boxWidth / this.displayWidth,
        h: boxHeight / this.displayHeight,
        shape: 'rectangle'
      };
      const spreadIndex = this.albumState.activeSpreadIndex;
      const slotIndex = this.albumState.addTextFrame(spreadIndex, { rect }, this.displayWidth, this.displayHeight);
      if (slotIndex !== null && slotIndex !== undefined) {
        this.selectedSlotIndex = slotIndex;
        this.selectedSlotIndices = new Set([slotIndex]);
        // Text placement is a one-click action. Return to selection before opening
        // the editor so a later click cannot accidentally create another layer.
        this.setTool('select');
        this.albumState.notify('slot-selected', { spreadIndex, slotIndex, slotIndices: [slotIndex] });
        this.requestRender();
        window.requestAnimationFrame(() => window.openTextEditorModal?.(spreadIndex, slotIndex));
      }
      return;
    }

    // 0. Gesture: Delete Frame Button Clicked
    const delBtnHit = this._getDeleteBtnAt(pos.x, pos.y);
    if (delBtnHit) {
      const delIdx = delBtnHit.slotIndex;
      this.selectedSlotIndex = null;
      if (this.selectedSlotIndices) this.selectedSlotIndices.clear();
      this.albumState.deleteFrame(this.albumState.activeSpreadIndex, delIdx);
      window.showToastNotification?.(`🗑️ Frame ${delIdx + 1} deleted (Photo returned to Unused Photos)`);
      this.requestRender();
      return;
    }

    // 1. Gesture: Drag Select / Marquee Mode Active
    if (this.marqueeMode) {
      this.isMarqueeSelecting = true;
      this.marqueeStartPos = { x: pos.x, y: pos.y };
      this.marqueeCurrentPos = { x: pos.x, y: pos.y };
      this._initialSelectedSlots = isShiftOrCtrl ? new Set(this.selectedSlotIndices) : new Set();
      if (!isShiftOrCtrl) {
        this.selectedSlotIndices.clear();
        this.selectedSlotIndex = null;
      }
      this.canvas.style.cursor = 'crosshair';
      this.requestRender();
      return;
    }

    // 2. Gesture: Click/touch on corner/edge resize handles (supports single and multi-selection group resizing)
    const cornerHit = this._getCornerAt(pos.x, pos.y);
    if (cornerHit) {
      this.selectedSlotIndex = cornerHit.slotIndex;
      this.selectedSlotIndices = new Set([cornerHit.slotIndex]);
      this.albumState.notify('slot-selected', {
        spreadIndex: this.albumState.activeSpreadIndex,
        slotIndex: cornerHit.slotIndex,
        slotIndices: [cornerHit.slotIndex]
      });

      this.isResizingSlot = true;
      this.resizeCorner = cornerHit.handle;
      this.resizeSlotIndex = cornerHit.slotIndex;
      this.resizeStartPos = { x: pos.x, y: pos.y };
      this.initialPixelRect = { ...cornerHit.rect };
      this.slotAspectRatio = cornerHit.rect.width / Math.max(1, cornerHit.rect.height);
      const startSpread = this.albumState.getActiveSpread();
      const startSlot = startSpread?.slots?.find(s => s.slotIndex === cornerHit.slotIndex);
      this.initialTextFontSize = startSlot?.fontSize || 28;

      if (this.selectedSlotIndices && this.selectedSlotIndices.size > 1) {
        this.initialMultiSlotRects = new Map();
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        this.selectedSlotIndices.forEach(idx => {
          const r = this.cachedRectangles.find(cr => cr.slotIndex === idx);
          if (r) {
            this.initialMultiSlotRects.set(idx, { ...r });
            minX = Math.min(minX, r.x);
            minY = Math.min(minY, r.y);
            maxX = Math.max(maxX, r.x + r.width);
            maxY = Math.max(maxY, r.y + r.height);
          }
        });
        this.initialGroupBounds = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
      } else {
        this.initialMultiSlotRects = null;
        this.initialGroupBounds = null;
      }

      this.canvas.style.cursor = this._getResizeCursor(cornerHit.handle);
      this.albumState.recordSnapshot();
      return;
    }

    // 2.5. Gesture: Click/touch on rotation handle or corner rotation zone
    const rotHit = this._getRotationHandleAt(pos.x, pos.y);
    if (rotHit) {
      this.selectedSlotIndex = rotHit.slotIndex;
      this.selectedSlotIndices = new Set([rotHit.slotIndex]);
      this.isRotatingSlot = true;
      this.rotateSlotIndex = rotHit.slotIndex;
      this.rotateCenter = { x: rotHit.cx, y: rotHit.cy };
      this.rotateStartAngle = Math.atan2(pos.y - rotHit.cy, pos.x - rotHit.cx);
      const spread = this.albumState.getActiveSpread();
      const targetSlot = spread?.slots?.find(s => s.slotIndex === rotHit.slotIndex);
      this.rotateInitialSlotRotation = targetSlot?.rotation || rotHit.rect.rotation || 0;
      this.canvas.style.cursor = 'crosshair';
      this.albumState.recordSnapshot();
      this.albumState.notify('slot-selected', {
        spreadIndex: this.albumState.activeSpreadIndex,
        slotIndex: rotHit.slotIndex,
        slotIndices: [rotHit.slotIndex]
      });
      this.requestRender();
      return;
    }

    // 3. Gesture: Click on the border/edge of any frame to move it freely
    const edgeHit = this._getFrameEdgeAt(pos.x, pos.y);
    if (edgeHit) {
      if (isShiftOrCtrl) {
        if (this.selectedSlotIndices.has(edgeHit.slotIndex)) {
          this.selectedSlotIndices.delete(edgeHit.slotIndex);
          if (this.selectedSlotIndex === edgeHit.slotIndex) {
            this.selectedSlotIndex = this.selectedSlotIndices.size > 0 ? Array.from(this.selectedSlotIndices)[0] : null;
          }
        } else {
          this.selectedSlotIndices.add(edgeHit.slotIndex);
          this.selectedSlotIndex = edgeHit.slotIndex;
        }
      } else {
        if (!this.selectedSlotIndices.has(edgeHit.slotIndex)) {
          this.selectedSlotIndex = edgeHit.slotIndex;
          this.selectedSlotIndices = new Set([edgeHit.slotIndex]);
        }
      }

      this.isMovingSlot = true;
      this.moveSlotIndex = edgeHit.slotIndex;
      this.moveStartPos = { x: pos.x, y: pos.y };
      this.initialSlotPixelRect = { ...edgeHit.rect };
      this.initialMultiSlotRects = new Map();
      this.selectedSlotIndices.forEach(idx => {
        const r = this.cachedRectangles.find(cr => cr.slotIndex === idx);
        if (r) this.initialMultiSlotRects.set(idx, { ...r });
      });

      this.canvas.style.cursor = 'move';
      this.albumState.recordSnapshot();
      this.albumState.notify('slot-selected', {
        spreadIndex: this.albumState.activeSpreadIndex,
        slotIndex: edgeHit.slotIndex,
        slotIndices: Array.from(this.selectedSlotIndices)
      });
      this.requestRender();
      return;
    }

    // 4. Gesture: Click inside a frame (with cycleOnSelection for overlapping frames)
    const hit = this._getSlotAt(pos.x, pos.y, true);
    if (hit) {
      if (isShiftOrCtrl) {
        // Toggle slot in multi-selection or start marquee sweep
        if (this.selectedSlotIndices.has(hit.slotIndex)) {
          this.selectedSlotIndices.delete(hit.slotIndex);
          if (this.selectedSlotIndex === hit.slotIndex) {
            this.selectedSlotIndex = this.selectedSlotIndices.size > 0 ? Array.from(this.selectedSlotIndices)[0] : null;
          }
        } else {
          this.selectedSlotIndices.add(hit.slotIndex);
          this.selectedSlotIndex = hit.slotIndex;
        }

        this.albumState.notify('slot-selected', {
          spreadIndex: this.albumState.activeSpreadIndex,
          slotIndex: this.selectedSlotIndex,
          slotIndices: Array.from(this.selectedSlotIndices)
        });

        // Start drag marquee selection with Shift/Ctrl
        this.isMarqueeSelecting = true;
        this.marqueeStartPos = { x: pos.x, y: pos.y };
        this.marqueeCurrentPos = { x: pos.x, y: pos.y };
        this._initialSelectedSlots = new Set(this.selectedSlotIndices);
        this.canvas.style.cursor = 'crosshair';
        this.requestRender();
        return;
      }

      // If user clicked an already multi-selected slot, keep multi-selection for collective moving
      if (!this.selectedSlotIndices.has(hit.slotIndex)) {
        this.selectedSlotIndex = hit.slotIndex;
        this.selectedSlotIndices = new Set([hit.slotIndex]);
      } else {
        this.selectedSlotIndex = hit.slotIndex;
      }

      this.albumState.notify('slot-selected', {
        spreadIndex: this.albumState.activeSpreadIndex,
        slotIndex: hit.slotIndex,
        slotIndices: Array.from(this.selectedSlotIndices)
      });

      const spread = this.albumState.getActiveSpread();
      const slot = spread.slots.find(s => s.slotIndex === hit.slotIndex);
      this.pointerDownSlot = hit.slotIndex;
      this.pointerDownPos = { x: pos.x, y: pos.y };
      this.pointerDownRect = { ...hit };
      this.initialSlotPixelRect = { ...hit };
      this.initialMultiSlotRects = new Map();
      this.selectedSlotIndices.forEach(idx => {
        const r = this.cachedRectangles.find(cr => cr.slotIndex === idx);
        if (r) this.initialMultiSlotRects.set(idx, { ...r });
      });

      this.initialPan = { x: slot?.panX || 0, y: slot?.panY || 0 };
      this.dragStartOnEdge = Boolean(e.altKey || !slot?.photoId || slot?.isText);
      this.isPotentialDrag = true;
      this.canvas.style.cursor = slot?.isText ? 'move' : (slot?.photoId ? 'grab' : 'move');
    } else {
      // 5. Click on empty canvas background / margin / crease
      if (this.drawNewFrameMode) {
        window.dismissDrawBannerToast?.();
        this.isDrawingNewFrame = true;
        this.drawFrameStartPos = { x: pos.x, y: pos.y };
        this.drawFrameCurrentPos = { x: pos.x, y: pos.y };
        this.canvas.style.cursor = 'crosshair';
        this.requestRender();
        return;
      }

      // Marquee Drag Selection on empty canvas
      this.isMarqueeSelecting = true;
      this.marqueeStartPos = { x: pos.x, y: pos.y };
      this.marqueeCurrentPos = { x: pos.x, y: pos.y };
      if (!isShiftOrCtrl) {
        this.selectedSlotIndices.clear();
        this.selectedSlotIndex = null;
        this.albumState.notify('slot-deselected');
      }
      this._initialSelectedSlots = isShiftOrCtrl ? new Set(this.selectedSlotIndices) : new Set();
      this.canvas.style.cursor = 'crosshair';
    }
    this.requestRender();
  }

  _finalizeFrameDrawing() {
    if (!this.drawFrameStartPos || !this.drawFrameCurrentPos) return;
    const x1 = Math.min(this.drawFrameStartPos.x, this.drawFrameCurrentPos.x);
    const y1 = Math.min(this.drawFrameStartPos.y, this.drawFrameCurrentPos.y);
    const x2 = Math.max(this.drawFrameStartPos.x, this.drawFrameCurrentPos.x);
    const y2 = Math.max(this.drawFrameStartPos.y, this.drawFrameCurrentPos.y);
    const drawW = x2 - x1;
    const drawH = y2 - y1;

    if (drawW >= 25 && drawH >= 25) {
      const isSpread = (this.albumState.project.pageMode !== 'single');
      const centerX = this.displayWidth / 2;
      let clampedX = x1;
      let clampedW = drawW;

      if (isSpread) {
        if (x1 + drawW / 2 < centerX) {
          clampedX = Math.max(0, x1);
          clampedW = Math.min(centerX - clampedX, drawW);
        } else {
          clampedX = Math.max(centerX, x1);
          clampedW = Math.min(this.displayWidth - clampedX, drawW);
        }
      }

      const newSlotIdx = this.albumState.addCustomFrame(
        this.albumState.activeSpreadIndex,
        {
          x: Math.round(clampedX),
          y: Math.round(y1),
          width: Math.round(clampedW),
          height: Math.round(drawH),
          shape: this.currentDrawShape || 'rectangle',
          customPath: this.currentCustomPath || null
        },
        this.displayWidth,
        this.displayHeight
      );
      this.selectedSlotIndex = newSlotIdx;
      this.selectedSlotIndices = new Set([newSlotIdx]);
      window.showToastNotification?.('✨ Frame created! Click & drag to draw another frame');
    }
  }

  _onMouseUp(e) {
    // 0. Gesture: Finalize Right-Click Drag Drawing
    if (e && e.button === 2) {
      if (this.isRightClickDrawing && this.drawFrameStartPos && this.drawFrameCurrentPos) {
        this._finalizeFrameDrawing();
        this._justFinishedRightDrag = true;
      }
      this.isRightMouseDown = false;
      this.isRightClickDrawing = false;
      this.isDrawingNewFrame = false;
      this.drawFrameStartPos = null;
      this.drawFrameCurrentPos = null;
      this.canvas.style.cursor = (this.activeTool === 'hand') ? 'grab' : 'default';
      this.requestRender();
      return;
    }

    if (e && e.button !== undefined && e.button !== 0) return;

    if (this.isPanningCanvas) {
      this.isPanningCanvas = false;
      this.canvas.style.cursor = (this.activeTool === 'hand') ? 'grab' : 'default';
      return;
    }

    if (this.isRotatingSlot) {
      this.isRotatingSlot = false;
      this.rotateSlotIndex = null;
      this.rotateCenter = null;
      this.albumState.notify('layout-changed');
      this.canvas.style.cursor = (this.activeTool === 'hand') ? 'grab' : 'default';
      this.requestRender();
      return;
    }

    // 0.5. Gesture: Finalize Left-Click Drawing New Frame Rectangle
    if (this.isDrawingNewFrame && this.drawFrameStartPos && this.drawFrameCurrentPos) {
      this._finalizeFrameDrawing();
      this.isDrawingNewFrame = false;
      this.drawFrameStartPos = null;
      this.drawFrameCurrentPos = null;
      this.canvas.style.cursor = this.drawNewFrameMode ? 'crosshair' : ((this.activeTool === 'hand') ? 'grab' : 'default');
      this.requestRender();
      return;
    }

    // 1. Gesture: Finalize Marquee Drag Selection
    if (this.isMarqueeSelecting) {
      this.isMarqueeSelecting = false;
      const wasDragged = this.marqueeStartPos && this.marqueeCurrentPos &&
        (Math.hypot(this.marqueeCurrentPos.x - this.marqueeStartPos.x, this.marqueeCurrentPos.y - this.marqueeStartPos.y) > 4);

      this.marqueeStartPos = null;
      this.marqueeCurrentPos = null;
      this.canvas.style.cursor = this.marqueeMode ? 'crosshair' : 'default';

      if (wasDragged) {
        const count = this.selectedSlotIndices.size;
        if (count > 0) {
          this.albumState.notify('slots-selected', {
            spreadIndex: this.albumState.activeSpreadIndex,
            slotIndices: Array.from(this.selectedSlotIndices)
          });
          if (count > 1) {
            window.showToastNotification?.(`🎯 Selected ${count} photos on canvas`);
          }
        } else {
          this.selectedSlotIndex = null;
          this.selectedSlotIndices.clear();
          this.albumState.notify('slot-deselected');
        }
      }

      this.requestRender();
      return;
    }

    if (this.isResizingSlot) {
      this.isResizingSlot = false;
      this.resizeCorner = null;
      this.resizeSlotIndex = null;
      this.initialMultiSlotRects = null;
      this.initialGroupBounds = null;
      this.activeSnapGuides = [];
      this.canvas.style.cursor = 'default';
      this.albumState.notify('layout-changed');
      this.requestRender();
      return;
    }

    if (this.isMovingSlot) {
      this.isMovingSlot = false;
      this.moveSlotIndex = null;
      this.initialMultiSlotRects = null;
      this.initialGroupBounds = null;
      this.activeSnapGuides = [];
      this.canvas.style.cursor = 'default';
      this.albumState.notify('layout-changed');
      this.requestRender();
      return;
    }

    if (this.isDraggingPhotoSwap) {
      if (this.dragSwapTargetIndex !== null && this.dragSwapTargetIndex !== this.dragSwapSourceIndex) {
        // *** GESTURE: INTERCHANGE PHOTOS BETWEEN FRAMES ***
        const srcIdx = this.dragSwapSourceIndex;
        const tgtIdx = this.dragSwapTargetIndex;
        this.albumState.swapSlots(this.albumState.activeSpreadIndex, srcIdx, tgtIdx);
        this.selectedSlotIndex = tgtIdx;
        this.selectedSlotIndices = new Set([tgtIdx]);
        this.albumState.notify('slot-selected', {
          spreadIndex: this.albumState.activeSpreadIndex,
          slotIndex: tgtIdx,
          slotIndices: [tgtIdx]
        });
        window.showToastNotification?.(`⇄ Photos interchanged between Frame ${srcIdx + 1} and Frame ${tgtIdx + 1}!`);
      }

      this.isDraggingPhotoSwap = false;
      this.dragSwapSourceIndex = null;
      this.dragSwapTargetIndex = null;
      this.dragCurrentPos = { x: 0, y: 0 };
      this.isPotentialDrag = false;
      this.isPanningPhoto = false;
      this.activeSnapGuides = [];
      this.canvas.style.cursor = this.hoveredSlotIndex !== null ? 'grab' : 'default';
      this.requestRender();
      return;
    }

    if (this.isPanningPhoto) {
      this.isPanningPhoto = false;
      this.isPotentialDrag = false;
      this.activeSnapGuides = [];
      this.albumState.recordSnapshot();
      this.albumState.notify('slot-pan-updated');
      this.canvas.style.cursor = this.hoveredSlotIndex !== null ? 'grab' : 'default';
      this.requestRender();
      return;
    }

    this.isPotentialDrag = false;
    this.activeSnapGuides = [];
    this.canvas.style.cursor = this.hoveredSlotIndex !== null ? 'grab' : 'default';
  }

  _onMouseLeave() {
    this.hoveredSlotIndex = null;
    this.isPanningPhoto = false;
    this.isPanningCanvas = false;
    this.isPotentialDrag = false;
    this.isDraggingPhotoSwap = false;
    this.dragSwapSourceIndex = null;
    this.dragSwapTargetIndex = null;
    this.dragOverSlotIndex = null;
    this.activeSnapGuides = [];
    this.isMarqueeSelecting = false;
    this.marqueeStartPos = null;
    this.marqueeCurrentPos = null;
    this.initialMultiSlotRects = null;
    this.initialGroupBounds = null;
    this.isRightMouseDown = false;
    this.isRightClickDrawing = false;
    if (this.isRotatingSlot) {
      this.isRotatingSlot = false;
      this.rotateSlotIndex = null;
      this.rotateCenter = null;
      this.albumState.notify('layout-changed');
    }
    if (this.isMovingSlot) {
      this.isMovingSlot = false;
      this.moveSlotIndex = null;
      this.albumState.notify('layout-changed');
    }
    if (this.isResizingSlot) {
      this.isResizingSlot = false;
      this.resizeCorner = null;
      this.resizeSlotIndex = null;
      this.albumState.notify('layout-changed');
    }
    this.requestRender();
  }

  _onWheel(e) {
    if (this.activeTool === 'hand' || this.activeTool === 'text') return;
    // If Ctrl/Cmd is held, user explicitly wants to zoom the whole canvas spread
    if (e.ctrlKey || e.metaKey) {
      return; // Bubble to canvas stage zoom handler
    }

    const pos = this._getCanvasCoords(e);
    const hit = this._getSlotAt(pos.x, pos.y);
    if (!hit) {
      // Cursor is on canvas paper/margins outside frames -> bubble to canvas stage zoom
      return;
    }

    const spread = this.albumState.getActiveSpread();
    const slot = spread.slots.find(s => s.slotIndex === hit.slotIndex);
    if (slot && slot.photoId) {
      // Cursor is specifically INSIDE a frame with a photo:
      // Zoom ONLY this photo inside this frame, and stop event propagation so canvas does NOT zoom!
      e.preventDefault();
      e.stopPropagation();
      const zoomDelta = e.deltaY < 0 ? 0.05 : -0.05;
      slot.zoom = Math.max(1.0, Math.min(3.0, (slot.zoom || 1.0) + zoomDelta));
      this.requestRender();
      this.albumState.notify('slot-zoom-updated', {
        slotIndex: slot.slotIndex,
        zoom: slot.zoom
      });
    }
    // If slot has no photo (empty frame), let event bubble to zoom whole canvas
  }

  _onDragOver(e) {
    if (this.activeTool === 'hand') return;
    e.preventDefault();
    const pos = this._getCanvasCoords(e);
    const hit = this._getSlotAt(pos.x, pos.y);
    const newIdx = hit ? hit.slotIndex : null;
    if (newIdx !== this.dragOverSlotIndex) {
      this.dragOverSlotIndex = newIdx;
      this.requestRender();
    }
  }

  _onDragLeave(e) {
    this.dragOverSlotIndex = null;
    this.render();
  }

  _onDrop(e) {
    if (this.activeTool === 'hand') {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const pos = this._getCanvasCoords(e);
    const hit = this._getSlotAt(pos.x, pos.y);
    this.dragOverSlotIndex = null;
    this.selectedSlotIndex = null;
    if (this.selectedSlotIndices) this.selectedSlotIndices.clear();
    this.activeSnapGuides = [];

    // 1. External files dropped from Windows File Explorer / desktop / external source
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      const spread = this.albumState.getActiveSpread();
      const slot = spread?.slots?.find(s => s.slotIndex === hit?.slotIndex);
      if (hit && slot && !slot.photoId && files.length === 1 && window.importAndAssignPhotoToSlot) {
        window.importAndAssignPhotoToSlot(files[0], this.albumState.activeSpreadIndex, hit.slotIndex);
      } else {
        window.importPhotoFiles?.(files, { targetSpreadIndex: this.albumState.activeSpreadIndex, autoLayout: true });
      }
      this.render();
      return;
    }

    const sourceSlotIndex = e.dataTransfer.getData('text/sourceSlot');

    if (sourceSlotIndex !== '') {
      // Swapping slots within the spread
      const fromSlot = parseInt(sourceSlotIndex, 10);
      if (hit && hit.slotIndex !== fromSlot) {
        this.albumState.swapSlots(this.albumState.activeSpreadIndex, fromSlot, hit.slotIndex);
      }
    } else {
      let photoIds = [];
      try {
        const json = e.dataTransfer.getData('application/json');
        if (json) {
          const parsed = JSON.parse(json);
          if (Array.isArray(parsed.photoIds)) {
            photoIds = parsed.photoIds;
          }
        }
      } catch (err) {}

      const singleId = e.dataTransfer.getData('text/photoId');
      if (photoIds.length === 0 && singleId) {
        photoIds = [singleId];
      }

      if (photoIds.length === 1 && hit) {
        // Drop single photo into an empty frame slot if available
        const spread = this.albumState.getActiveSpread();
        const slot = spread?.slots?.find(s => s.slotIndex === hit.slotIndex);
        if (slot && !slot.photoId) {
          slot.photoId = photoIds[0];
          slot.panX = 0; slot.panY = 0; slot.zoom = 1.0; slot.rotation = 0;
          if (!spread.photoIds.includes(photoIds[0])) spread.photoIds.push(photoIds[0]);
          this.albumState._recomputeUsageCounts();
          this.albumState.notify('photo-assigned', spread);
          this.render();
          return;
        }
      }

      if (photoIds.length > 0) {
        // When photos are dragged to canvas, reorder from template according to suitable design depending on number of pics
        this.albumState.addPhotosToSpreadWithAutoLayout(this.albumState.activeSpreadIndex, photoIds);
      }
    }
    this.render();
  }

  // --- High-Resolution 300 DPI Export Renderer ---

  /**
   * Generates a full print-ready 300 DPI offscreen canvas
   * @param {Object} spread - Spread object
   * @param {number} dpi - target DPI (typically 300)
   * @returns {Promise<HTMLCanvasElement>}
   */
  async renderHighResSpreadCanvas(spread, dpi = 300) {
    const spreadIndex = this.albumState.project.spreads.indexOf(spread);
    const sIdx = spreadIndex >= 0 ? spreadIndex : this.albumState.activeSpreadIndex;
    const sheetWInches = this.albumState.getSheetWidthInches(sIdx);
    const sheetHInches = this.albumState.getSheetHeightInches(sIdx);
    const exportWidth = Math.round(sheetWInches * dpi);
    const exportHeight = Math.round(sheetHInches * dpi);

    const offscreen = document.createElement('canvas');
    offscreen.width = exportWidth;
    offscreen.height = exportHeight;
    const ctx = offscreen.getContext('2d');

    // Background
    ctx.fillStyle = this.albumState.project.backgroundColor || '#ffffff';
    ctx.fillRect(0, 0, exportWidth, exportHeight);

    if (!spread || !spread.layout) return offscreen;

    // Use screen display width as base for exact proportional scaling
    const baseDisplayW = (this.displayWidth && this.displayWidth > 0) ? this.displayWidth : 1200;
    const scaleFactor = exportWidth / baseDisplayW;

    const spreadGap = this.albumState.getSpreadGapPx(sIdx) || 0;
    const gapPx = Math.round(spreadGap * scaleFactor);

    // Sync any custom slot rectangles directly to layout rects
    if (spread.slots && spread.layout && spread.layout.rects) {
      spread.slots.forEach(s => {
        if (s.rect && spread.layout.rects[s.slotIndex]) {
          spread.layout.rects[s.slotIndex] = s.rect;
        }
      });
    }

    const rects = this.albumState.layoutEngine.computePixelRectangles(
      spread.layout,
      exportWidth,
      exportHeight,
      {
        marginPercent: this.albumState.getSpreadMarginPercent(sIdx),
        middleMarginPercent: this.albumState.getSpreadMiddleMarginPercent(sIdx),
        gapPx: gapPx,
        fullBleed: this.albumState.project.fullBleed,
        pageMode: this.albumState.project.pageMode
      }
    );

    // Wait for all images/text in this spread to load and render
    for (const rect of rects) {
      const slot = spread.slots.find(s => s.slotIndex === rect.slotIndex);
      if (!slot) continue;

      if (slot.isText) {
        ctx.save();
        const fontSize = Math.max(14, Math.round((slot.fontSize || 28) * scaleFactor));
        const fontWeight = slot.fontWeight || 'bold';
        const fontStyle = slot.fontStyle || 'normal';
        const fontFamily = slot.fontFamily || 'Playfair Display, Georgia, serif';
        ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
        ctx.fillStyle = slot.textColor || '#1e293b';
        ctx.textAlign = slot.textAlign || 'center';
        ctx.textBaseline = 'middle';

        let text = slot.text !== undefined ? slot.text : '';
        if (slot.allCaps) {
          text = text.toUpperCase();
        }
        const lines = text.split('\n');
        const lineHeight = fontSize * (slot.lineHeight || 1.3);
        const startY = (rect.y + rect.height / 2) - ((lines.length - 1) * lineHeight) / 2;

        let alignX = rect.x + rect.width / 2;
        if (slot.textAlign === 'left') alignX = rect.x + 16 * scaleFactor;
        else if (slot.textAlign === 'right') alignX = rect.x + rect.width - 16 * scaleFactor;

        lines.forEach((line, lineIdx) => {
          const curY = startY + lineIdx * lineHeight;
          ctx.fillText(line, alignX, curY);

          if (slot.underline && line) {
            const metrics = ctx.measureText(line);
            const lw = metrics.width;
            let ux = alignX;
            if (slot.textAlign === 'center') ux = alignX - lw / 2;
            else if (slot.textAlign === 'right') ux = alignX - lw;
            ctx.beginPath();
            ctx.strokeStyle = slot.textColor || '#1e293b';
            ctx.lineWidth = Math.max(1, Math.round(fontSize / 16));
            ctx.moveTo(ux, curY + fontSize * 0.42);
            ctx.lineTo(ux + lw, curY + fontSize * 0.42);
            ctx.stroke();
          }
        });
        ctx.restore();
        continue;
      }

      if (!slot.photoId) continue;
      const photo = this.albumState.getPhotoById(slot.photoId);
      if (!photo) continue;

      // Print output must use the original source. Never silently substitute a
      // tray thumbnail: 300 DPI canvas dimensions cannot restore lost detail.
      const highRes = photo.needsRelink ? null : this._getHighResSrc(photo);
      const img = highRes ? await this._loadHighResImage(highRes) : null;
      if (!img || !img.naturalWidth) {
        const name = photo.name || photo.fileName || photo.id;
        throw new Error(`Could not load the original-resolution photo "${name}". Relink the original photo before exporting.`);
      }
      if (img) {
        ctx.save();
        if (slot.customPath && !rect.customPath) rect.customPath = slot.customPath;
        this._buildFramePath(ctx, rect, rect.shape);
        ctx.clip();

        // Proportional scale for panX and panY so image framing, positioning, and crop match the screen 100%
        const scaledSlot = {
          ...slot,
          panX: (slot.panX || 0) * scaleFactor,
          panY: (slot.panY || 0) * scaleFactor
        };

        this._renderImageCover(ctx, img, rect, scaledSlot);
        ctx.restore();
      }
    }

    return offscreen;
  }

  getComputedFrameRectsNormalized() {
    const spread = this.albumState.getActiveSpread();
    if (!spread) return [];
    if (spread.layout && spread.layout.rects && spread.layout.rects.length > 0) {
      return spread.layout.rects.map(r => ({ ...r }));
    }
    if (this.cachedRectangles && this.cachedRectangles.length > 0 && this.canvas) {
      const cw = this.canvas.width / (window.devicePixelRatio || 1);
      const ch = this.canvas.height / (window.devicePixelRatio || 1);
      return this.cachedRectangles.map(r => this.albumState.layoutEngine.pixelRectToNormalized(r, cw, ch, { isCustom: true }));
    }
    return [];
  }

  _loadHighResImage(src) {
    if (!src) return Promise.resolve(null);
    let targetSrc = src;
    if (typeof targetSrc === 'string' && targetSrc.startsWith('/api/') && typeof window.getApiUrl === 'function') {
      targetSrc = window.getApiUrl(targetSrc);
    }
    const cached = this.imageCache?.get(targetSrc) || this.imageCache?.get(src);
    if (cached?.complete) return Promise.resolve(cached.naturalWidth > 0 && !cached._hasError ? cached : null);
    if (this.imageLoadPromises.has(targetSrc)) return this.imageLoadPromises.get(targetSrc);

    const img = cached || this._getImage(targetSrc);
    const promise = new Promise((resolve) => {
      if (img.complete) {
        resolve(img.naturalWidth > 0 && !img._hasError ? img : null);
        return;
      }
      img.addEventListener('load', () => resolve(img.naturalWidth > 0 ? img : null), { once: true });
      img.addEventListener('error', () => resolve(null), { once: true });
    }).finally(() => this.imageLoadPromises.delete(targetSrc));
    this.imageLoadPromises.set(targetSrc, promise);
    return promise;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CanvasRenderer;
} else {
  window.CanvasRenderer = CanvasRenderer;
}
