/**
 * SmartAlbums Layout Engine
 * Generates harmonic, balanced, and randomized rectangular layouts for photobook spreads.
 * Supports:
 * - Curated template library for 1-12 photos
 * - Dynamic Procedural Binary Space Partitioning (BSP) / Treemap rectangular generator
 * - Intelligent photo-to-slot aspect ratio matching (minimizes cropping)
 * - Safe zone, center crease / gutter, bleed, margins, and gaps
 */

class LayoutEngine {
  constructor() {
    this.templates = this._initTemplates();
    this.deletedTemplateIds = this.loadDeletedTemplateIds();
    // Filter out deleted templates
    if (this.deletedTemplateIds && this.deletedTemplateIds.length > 0) {
      const delSet = new Set(this.deletedTemplateIds);
      Object.keys(this.templates).forEach(k => {
        if (Array.isArray(this.templates[k])) {
          this.templates[k] = this.templates[k].filter(t => !delSet.has(t.id));
        }
      });
    }

    this.customTemplates = this.loadCustomTemplates();
    // Merge custom templates into active templates pool
    if (this.customTemplates && this.customTemplates.length > 0) {
      this.customTemplates.forEach(tpl => {
        const count = tpl.rects ? tpl.rects.length : 0;
        if (count > 0) {
          if (!this.templates[count]) this.templates[count] = [];
          this.templates[count].unshift(tpl);
        }
      });
    }
    this._fullLibraryCache = {};
  }

  loadDeletedTemplateIds() {
    try {
      const stored = localStorage.getItem('smartease_deleted_templates');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error reading deleted templates list:', e);
    }
    return [];
  }

  saveDeletedTemplateIdsToStorage() {
    try {
      localStorage.setItem('smartease_deleted_templates', JSON.stringify(this.deletedTemplateIds || []));
    } catch (e) {
      console.warn('Error saving deleted templates list:', e);
    }
  }

  getTotalTemplateCount() {
    let total = 0;
    if (this.templates) {
      Object.keys(this.templates).forEach(k => {
        if (Array.isArray(this.templates[k])) {
          total += this.templates[k].length;
        }
      });
    }
    return total;
  }

  getAllTemplates(options = {}) {
    const list = [];
    if (this.templates) {
      const counts = Object.keys(this.templates).map(Number).sort((a, b) => a - b);
      counts.forEach(count => {
        if (options.count !== undefined && options.count !== 'all') {
          if (options.count === '7plus' || options.count === '7+') {
            if (count < 7) return;
          } else if (Number(options.count) !== count) {
            return;
          }
        }
        const tpls = this.templates[count] || [];
        tpls.forEach(t => {
          if (options.orientation && options.orientation !== 'all') {
            const hasShapes = (t.rects || []).some(r => r.shape && r.shape !== 'rect' && r.shape !== 'rectangle');
            if (options.orientation === 'shapes') {
              if (!hasShapes) return;
            } else if (options.orientation === 'wide') {
              const wideCount = (t.rects || []).filter(r => (r.w || 0) >= (r.h || 0)).length;
              if (wideCount === 0) return;
            } else if (options.orientation === 'tall') {
              const tallCount = (t.rects || []).filter(r => (r.h || 0) > (r.w || 0)).length;
              if (tallCount === 0) return;
            }
          }
          if (options.search) {
            const q = options.search.toLowerCase().trim();
            const name = (t.name || '').toLowerCase();
            const id = (t.id || '').toLowerCase();
            if (!name.includes(q) && !id.includes(q)) return;
          }
          list.push({ ...t, photoCount: count });
        });
      });
    }
    return list;
  }

  getTemplateById(templateId) {
    if (!templateId) return null;
    if (this.templates) {
      for (const k in this.templates) {
        const found = this.templates[k].find(t => t.id === templateId);
        if (found) return found;
      }
    }
    if (this.customTemplates) {
      const found = this.customTemplates.find(t => t.id === templateId);
      if (found) return found;
    }
    return null;
  }

  deleteTemplate(templateId) {
    if (!templateId) return false;
    let deleted = false;
    if (this.customTemplates && this.customTemplates.some(t => t.id === templateId)) {
      this.deleteCustomTemplate(templateId);
      deleted = true;
    }
    if (this.templates) {
      Object.keys(this.templates).forEach(k => {
        if (Array.isArray(this.templates[k])) {
          const before = this.templates[k].length;
          this.templates[k] = this.templates[k].filter(t => t.id !== templateId);
          if (this.templates[k].length < before) {
            deleted = true;
            delete this._fullLibraryCache[k];
          }
        }
      });
    }
    if (deleted) {
      if (!this.deletedTemplateIds) this.deletedTemplateIds = [];
      if (!this.deletedTemplateIds.includes(templateId)) {
        this.deletedTemplateIds.push(templateId);
        this.saveDeletedTemplateIdsToStorage();
      }
      return true;
    }
    return false;
  }

  saveOrUpdateTemplate(template) {
    if (!template || !template.rects) return null;
    const existing = this.getTemplateById(template.id);
    if (existing) {
      existing.name = template.name || existing.name;
      existing.rects = template.rects;
      existing.isCustom = true;
      if (this.customTemplates) {
        const cIdx = this.customTemplates.findIndex(t => t.id === template.id);
        if (cIdx >= 0) {
          this.customTemplates[cIdx] = { ...existing };
        } else {
          this.customTemplates.unshift({ ...existing });
        }
        this.saveCustomTemplatesToStorage();
      }
      delete this._fullLibraryCache[existing.rects.length];
      return existing;
    } else {
      return this.addCustomTemplate(template);
    }
  }

  loadCustomTemplates() {
    try {
      const stored = localStorage.getItem('smartease_custom_templates');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error reading custom templates:', e);
    }
    return [];
  }

  saveCustomTemplatesToStorage() {
    try {
      localStorage.setItem('smartease_custom_templates', JSON.stringify(this.customTemplates || []));
    } catch (e) {
      console.warn('Error saving custom templates:', e);
    }
  }

  addCustomTemplate(template) {
    if (!template || !template.rects || template.rects.length === 0) return null;
    const count = template.rects.length;
    const customId = template.id || ('custom-tpl-' + count + '-' + Date.now());
    const customName = template.name || ('Custom ' + count + '-Photo Template');

    const newTpl = {
      id: customId,
      name: customName,
      rects: template.rects.map(r => {
        const x = typeof r.x === 'number' ? r.x : parseFloat(r.x) || 0;
        const y = typeof r.y === 'number' ? r.y : parseFloat(r.y) || 0;
        const wVal = r.w !== undefined ? r.w : (r.width !== undefined ? r.width : 0.4);
        const hVal = r.h !== undefined ? r.h : (r.height !== undefined ? r.height : 0.4);
        const w = typeof wVal === 'number' ? wVal : parseFloat(wVal) || 0.4;
        const h = typeof hVal === 'number' ? hVal : parseFloat(hVal) || 0.4;
        const normW = Math.max(0.01, Math.min(1.0, Number(w.toFixed(4))));
        const normH = Math.max(0.01, Math.min(1.0, Number(h.toFixed(4))));
        return {
          x: Math.max(0, Math.min(0.995, Number(x.toFixed(4)))),
          y: Math.max(0, Math.min(0.995, Number(y.toFixed(4)))),
          w: normW,
          h: normH,
          width: normW,
          height: normH
        };
      }),
      isCustom: true,
      createdAt: Date.now()
    };

    if (!this.customTemplates) this.customTemplates = [];
    const existingIdx = this.customTemplates.findIndex(t => t.id === customId);
    if (existingIdx >= 0) {
      this.customTemplates[existingIdx] = newTpl;
    } else {
      this.customTemplates.unshift(newTpl);
    }

    if (!this.templates[count]) this.templates[count] = [];
    const tplIdx = this.templates[count].findIndex(t => t.id === customId);
    if (tplIdx >= 0) {
      this.templates[count][tplIdx] = newTpl;
    } else {
      this.templates[count].unshift(newTpl);
    }

    delete this._fullLibraryCache[count];
    this.saveCustomTemplatesToStorage();
    return newTpl;
  }

  updateCustomTemplate(templateId, updatedData) {
    if (!this.customTemplates) return null;
    const tpl = this.customTemplates.find(t => t.id === templateId);
    if (!tpl) return null;

    if (updatedData.name) tpl.name = updatedData.name;
    if (updatedData.rects) {
      const oldCount = tpl.rects.length;
      tpl.rects = updatedData.rects.map(r => {
        const x = typeof r.x === 'number' ? r.x : parseFloat(r.x) || 0;
        const y = typeof r.y === 'number' ? r.y : parseFloat(r.y) || 0;
        const wVal = r.w !== undefined ? r.w : (r.width !== undefined ? r.width : 0.4);
        const hVal = r.h !== undefined ? r.h : (r.height !== undefined ? r.height : 0.4);
        const w = typeof wVal === 'number' ? wVal : parseFloat(wVal) || 0.4;
        const h = typeof hVal === 'number' ? hVal : parseFloat(hVal) || 0.4;
        const normW = Math.max(0.01, Math.min(1.0, Number(w.toFixed(4))));
        const normH = Math.max(0.01, Math.min(1.0, Number(h.toFixed(4))));
        return {
          x: Math.max(0, Math.min(0.995, Number(x.toFixed(4)))),
          y: Math.max(0, Math.min(0.995, Number(y.toFixed(4)))),
          w: normW,
          h: normH,
          width: normW,
          height: normH
        };
      });
      const newCount = tpl.rects.length;

      if (this.templates[oldCount]) {
        this.templates[oldCount] = this.templates[oldCount].filter(t => t.id !== templateId);
        delete this._fullLibraryCache[oldCount];
      }
      if (!this.templates[newCount]) this.templates[newCount] = [];
      this.templates[newCount].unshift(tpl);
      delete this._fullLibraryCache[newCount];
    }

    this.saveCustomTemplatesToStorage();
    return tpl;
  }

  deleteCustomTemplate(templateId) {
    if (!this.customTemplates) return false;
    const idx = this.customTemplates.findIndex(t => t.id === templateId);
    if (idx === -1) return false;

    const tpl = this.customTemplates.splice(idx, 1)[0];
    const count = tpl.rects ? tpl.rects.length : 0;
    if (this.templates[count]) {
      this.templates[count] = this.templates[count].filter(t => t.id !== templateId);
      delete this._fullLibraryCache[count];
    }
    this.saveCustomTemplatesToStorage();
    return true;
  }

  getCustomTemplates() {
    return this.customTemplates || [];
  }

  /**
   * Predefined smart curated templates categorized by photo count.
   * Coordinates are normalized [0..1] relative to the content area (after margins).
   * Rect format: { x, y, w, h }
   */
  _initTemplates() {
    const templates = {
      // 1 Photo Spreads - (temps: WHCC / LemonPaperie / temp 3)
      1: [
        { id: '1-whcc-left-square', name: 'Left Page Exhibition Mat (WHCC)', rects: [{ x: 0.06, y: 0.10, w: 0.38, h: 0.80 }] },
        { id: '1-whcc-right-square', name: 'Right Page Exhibition Mat (WHCC)', rects: [{ x: 0.56, y: 0.10, w: 0.38, h: 0.80 }] },
        { id: '1-whcc-left-fineart', name: 'Left Page Fine Art Portrait (WHCC)', rects: [{ x: 0.04, y: 0.06, w: 0.42, h: 0.88 }] },
        { id: '1-whcc-right-fineart', name: 'Right Page Fine Art Portrait (WHCC)', rects: [{ x: 0.54, y: 0.06, w: 0.42, h: 0.88 }] },
        { id: '1-whcc-left-hero', name: 'Left Page Full Bleed Hero (WHCC)', rects: [{ x: 0, y: 0, w: 0.50, h: 1 }] },
        { id: '1-whcc-right-hero', name: 'Right Page Full Bleed Hero (WHCC)', rects: [{ x: 0.50, y: 0, w: 0.50, h: 1 }] },
        { id: '1-temp3-minimal-framed-left', name: 'Minimalist Framed Inset Left (Temp 3)', rects: [{ x: 0.08, y: 0.15, w: 0.34, h: 0.50 }] },
        { id: '1-temp3-minimal-framed-right', name: 'Minimalist Framed Inset Right (Temp 3)', rects: [{ x: 0.58, y: 0.15, w: 0.34, h: 0.50 }] }
      ],

      // 2 Photo Spreads - (temps: WHCC, Etsy Olive, Screenshot 18, Screenshot 8, Temp 3)
      2: [
        { id: '2-whcc-dual-tall', name: 'Dual Tall Portrait Insets (WHCC)', rects: [
          { x: 0.09, y: 0.08, w: 0.34, h: 0.84 },
          { x: 0.57, y: 0.08, w: 0.34, h: 0.84 }
        ]},
        { id: '2-etsy-olive-duo-inset', name: 'Dual Square Inset (Etsy Olive)', rects: [
          { x: 0.08, y: 0.18, w: 0.34, h: 0.64 },
          { x: 0.58, y: 0.18, w: 0.34, h: 0.64 }
        ]},
        { id: '2-temp3-dual-minimal-landscape', name: 'Dual Minimal Landscape Insets (Temp 3)', rects: [
          { x: 0.08, y: 0.15, w: 0.34, h: 0.50 },
          { x: 0.58, y: 0.15, w: 0.34, h: 0.50 }
        ]},
        { id: '2-temp3-stacked-horizontal-bleed-right', name: '2 Stacked Left + Full Bleed Right (Temp 3)', rects: [
          { x: 0.04, y: 0.08, w: 0.42, h: 0.40 },
          { x: 0.04, y: 0.52, w: 0.42, h: 0.40 },
          { x: 0.50, y: 0.0, w: 0.50, h: 1.0 }
        ]},
        { id: '2-temp3-horizontal-split-story', name: '2 Horizontal Story Panoramas Left (Temp 3)', rects: [
          { x: 0.06, y: 0.08, w: 0.40, h: 0.38 },
          { x: 0.06, y: 0.50, w: 0.40, h: 0.38 }
        ]},
        { id: '2-temp3-side-by-side-tall-right', name: '2 Tall Portraits Right (Temp 3)', rects: [
          { x: 0.52, y: 0.08, w: 0.21, h: 0.84 },
          { x: 0.75, y: 0.08, w: 0.21, h: 0.84 }
        ]},
        { id: '2-etsy-hero-left-tall-right', name: 'Wide Landscape Left + Tall Portrait Right (Etsy Olive)', rects: [
          { x: 0.04, y: 0.12, w: 0.43, h: 0.76 },
          { x: 0.62, y: 0.08, w: 0.26, h: 0.84 }
        ]},
        { id: '2-etsy-tall-left-hero-right', name: 'Tall Portrait Left + Wide Landscape Right (Etsy Olive)', rects: [
          { x: 0.12, y: 0.08, w: 0.26, h: 0.84 },
          { x: 0.53, y: 0.12, w: 0.43, h: 0.76 }
        ]},
        { id: '2-screenshot18-stacked-left', name: '2 Stacked Left Page (Screenshot 18)', rects: [
          { x: 0.04, y: 0.06, w: 0.43, h: 0.42 },
          { x: 0.04, y: 0.52, w: 0.43, h: 0.42 }
        ]},
        { id: '2-screenshot18-stacked-right', name: '2 Stacked Right Page (Screenshot 18)', rects: [
          { x: 0.53, y: 0.06, w: 0.43, h: 0.42 },
          { x: 0.53, y: 0.52, w: 0.43, h: 0.42 }
        ]},
        { id: '2-screenshot8-2cols-left', name: '2 Story Columns Left (Screenshot 8)', rects: [
          { x: 0.04, y: 0.06, w: 0.20, h: 0.88 },
          { x: 0.27, y: 0.06, w: 0.20, h: 0.88 }
        ]},
        { id: '2-screenshot8-2cols-right', name: '2 Story Columns Right (Screenshot 8)', rects: [
          { x: 0.53, y: 0.06, w: 0.20, h: 0.88 },
          { x: 0.76, y: 0.06, w: 0.20, h: 0.88 }
        ]}
      ],

      // 3 Photo Spreads - (temps: WHCC, Collage PSD, Etsy Olive, Screenshot 8, Screenshot 9, Temp 3)
      3: [
        { id: '3-whcc-tall-hero-2stacked', name: 'Tall Hero Left + 2 Stacked Right (WHCC)', rects: [
          { x: 0.09, y: 0.08, w: 0.34, h: 0.84 },
          { x: 0.53, y: 0.08, w: 0.43, h: 0.40 },
          { x: 0.53, y: 0.52, w: 0.43, h: 0.40 }
        ]},
        { id: '3-whcc-2stacked-tall-hero', name: '2 Stacked Left + Tall Hero Right (WHCC)', rects: [
          { x: 0.04, y: 0.08, w: 0.43, h: 0.40 },
          { x: 0.04, y: 0.52, w: 0.43, h: 0.40 },
          { x: 0.57, y: 0.08, w: 0.34, h: 0.84 }
        ]},
        { id: '3-temp3-tall-portrait-2stacked-wide', name: 'Tall + 2 Stacked Left + Wide Landscape Right (Temp 3)', rects: [
          { x: 0.08, y: 0.10, w: 0.18, h: 0.80 },
          { x: 0.28, y: 0.10, w: 0.18, h: 0.38 },
          { x: 0.28, y: 0.52, w: 0.18, h: 0.38 },
          { x: 0.54, y: 0.12, w: 0.40, h: 0.76 }
        ]},
        { id: '3-temp3-2stacked-left-hero-right', name: '2 Stacked Left + Square Hero Right (Temp 3)', rects: [
          { x: 0.06, y: 0.10, w: 0.40, h: 0.38 },
          { x: 0.06, y: 0.52, w: 0.40, h: 0.38 },
          { x: 0.54, y: 0.10, w: 0.40, h: 0.80 }
        ]},
        { id: '3-temp3-modern-editorial-triple', name: 'Modern Editorial Triple Sequence (Temp 3)', rects: [
          { x: 0.08, y: 0.15, w: 0.34, h: 0.70 },
          { x: 0.48, y: 0.15, w: 0.24, h: 0.70 },
          { x: 0.74, y: 0.0, w: 0.26, h: 1.0 }
        ]},
        { id: '3-psd-t-layout-left', name: '2 Squares + Landscape Left + Hero Right (Collage PSD)', rects: [
          { x: 0.04, y: 0.06, w: 0.20, h: 0.42 },
          { x: 0.26, y: 0.06, w: 0.20, h: 0.42 },
          { x: 0.54, y: 0.06, w: 0.42, h: 0.88 }
        ]},
        { id: '3-psd-t-layout-right', name: 'Hero Left + 2 Squares + Landscape Right (Collage PSD)', rects: [
          { x: 0.04, y: 0.06, w: 0.42, h: 0.88 },
          { x: 0.53, y: 0.06, w: 0.20, h: 0.42 },
          { x: 0.76, y: 0.06, w: 0.20, h: 0.42 }
        ]},
        { id: '3-etsy-2cols-left-wide-right', name: '2 Columns Left + 1 Wide Landscape Right (Etsy Olive)', rects: [
          { x: 0.05, y: 0.12, w: 0.19, h: 0.76 },
          { x: 0.26, y: 0.12, w: 0.19, h: 0.76 },
          { x: 0.53, y: 0.12, w: 0.43, h: 0.76 }
        ]},
        { id: '3-etsy-wide-left-2cols-right', name: '1 Wide Landscape Left + 2 Columns Right (Etsy Olive)', rects: [
          { x: 0.04, y: 0.12, w: 0.43, h: 0.76 },
          { x: 0.55, y: 0.12, w: 0.19, h: 0.76 },
          { x: 0.76, y: 0.12, w: 0.19, h: 0.76 }
        ]},
        { id: '3-screenshot8-3columns-left', name: '3 Story Columns Left (Screenshot 8)', rects: [
          { x: 0.04, y: 0.06, w: 0.13, h: 0.88 },
          { x: 0.19, y: 0.06, w: 0.13, h: 0.88 },
          { x: 0.34, y: 0.06, w: 0.13, h: 0.88 }
        ]},
        { id: '3-screenshot8-3columns-right', name: '3 Story Columns Right (Screenshot 8)', rects: [
          { x: 0.53, y: 0.06, w: 0.13, h: 0.88 },
          { x: 0.68, y: 0.06, w: 0.13, h: 0.88 },
          { x: 0.83, y: 0.06, w: 0.13, h: 0.88 }
        ]},
        { id: '3-screenshot9-3landscape-left', name: '3 Landscapes Left (Screenshot 9)', rects: [
          { x: 0.04, y: 0.06, w: 0.43, h: 0.27 },
          { x: 0.04, y: 0.36, w: 0.43, h: 0.27 },
          { x: 0.04, y: 0.67, w: 0.43, h: 0.27 }
        ]},
        { id: '3-screenshot9-3landscape-right', name: '3 Landscapes Right (Screenshot 9)', rects: [
          { x: 0.53, y: 0.06, w: 0.43, h: 0.27 },
          { x: 0.53, y: 0.36, w: 0.43, h: 0.27 },
          { x: 0.53, y: 0.67, w: 0.43, h: 0.27 }
        ]}
      ],

      // 4 Photo Spreads - (temps: WHCC, Shortcake, Etsy Olive, Screenshot 10, Temp 3)
      4: [
        { id: '4-whcc-landscape-2squares-hero', name: 'Landscape + 2 Squares Left + Tall Hero Right (WHCC)', rects: [
          { x: 0.04, y: 0.06, w: 0.43, h: 0.42 },
          { x: 0.04, y: 0.52, w: 0.20, h: 0.42 },
          { x: 0.27, y: 0.52, w: 0.20, h: 0.42 },
          { x: 0.57, y: 0.06, w: 0.34, h: 0.88 }
        ]},
        { id: '4-temp3-hero-left-3stacked-right', name: 'Large Square Left + 3 Stacked Horizontal Right (Temp 3)', rects: [
          { x: 0.08, y: 0.12, w: 0.36, h: 0.76 },
          { x: 0.54, y: 0.08, w: 0.40, h: 0.25 },
          { x: 0.54, y: 0.37, w: 0.40, h: 0.25 },
          { x: 0.54, y: 0.66, w: 0.40, h: 0.25 }
        ]},
        { id: '4-temp3-square-left-2stacked-tall-right', name: 'Square Left + 2 Stacked & Tall Column Right (Temp 3)', rects: [
          { x: 0.04, y: 0.06, w: 0.44, h: 0.88 },
          { x: 0.52, y: 0.10, w: 0.20, h: 0.38 },
          { x: 0.52, y: 0.52, w: 0.20, h: 0.38 },
          { x: 0.74, y: 0.10, w: 0.22, h: 0.80 }
        ]},
        { id: '4-temp3-bridal-party-4grid', name: 'Bridal Party Hero Left + 4-Grid Right (Temp 3)', rects: [
          { x: 0.06, y: 0.08, w: 0.40, h: 0.84 },
          { x: 0.52, y: 0.10, w: 0.21, h: 0.38 },
          { x: 0.75, y: 0.10, w: 0.21, h: 0.38 },
          { x: 0.52, y: 0.52, w: 0.21, h: 0.38 },
          { x: 0.75, y: 0.52, w: 0.21, h: 0.38 }
        ]},
        { id: '4-temp3-modern-editorial-duo-bleed', name: '2 Portraits Left + Bleed Hero & Accent Right (Temp 3)', rects: [
          { x: 0.08, y: 0.10, w: 0.18, h: 0.60 },
          { x: 0.28, y: 0.10, w: 0.18, h: 0.60 },
          { x: 0.50, y: 0.0, w: 0.34, h: 1.0 },
          { x: 0.86, y: 0.15, w: 0.11, h: 0.45 }
        ]},
        { id: '4-temp3-classic-editorial-1left-3right', name: 'Portrait Left + Hero & 2 Stacked Right (Temp 3)', rects: [
          { x: 0.25, y: 0.10, w: 0.22, h: 0.80 },
          { x: 0.52, y: 0.10, w: 0.22, h: 0.80 },
          { x: 0.76, y: 0.10, w: 0.18, h: 0.38 },
          { x: 0.76, y: 0.52, w: 0.18, h: 0.38 }
        ]},
        { id: '4-whcc-hero-landscape-2squares', name: 'Tall Hero Left + Landscape + 2 Squares Right (WHCC)', rects: [
          { x: 0.09, y: 0.06, w: 0.34, h: 0.88 },
          { x: 0.53, y: 0.06, w: 0.43, h: 0.42 },
          { x: 0.53, y: 0.52, w: 0.20, h: 0.42 },
          { x: 0.76, y: 0.52, w: 0.20, h: 0.42 }
        ]},
        { id: '4-shortcake-quad-insets', name: '4 Gallery Portrait Insets (Shortcake / WHCC)', rects: [
          { x: 0.05, y: 0.08, w: 0.19, h: 0.84 },
          { x: 0.26, y: 0.08, w: 0.19, h: 0.84 },
          { x: 0.55, y: 0.08, w: 0.19, h: 0.84 },
          { x: 0.76, y: 0.08, w: 0.19, h: 0.84 }
        ]},
        { id: '4-shortcake-top-squares-panoramas', name: '2 Top Squares + Panorama Left + Inset Right (Shortcake)', rects: [
          { x: 0.04, y: 0.06, w: 0.20, h: 0.42 },
          { x: 0.26, y: 0.06, w: 0.20, h: 0.42 },
          { x: 0.04, y: 0.52, w: 0.42, h: 0.42 },
          { x: 0.54, y: 0.08, w: 0.42, h: 0.84 }
        ]},
        { id: '4-etsy-3strips-left-hero-right', name: '3 Stacked Rows Left + 1 Hero Right (Etsy Olive)', rects: [
          { x: 0.04, y: 0.06, w: 0.43, h: 0.27 },
          { x: 0.04, y: 0.36, w: 0.43, h: 0.27 },
          { x: 0.04, y: 0.67, w: 0.43, h: 0.27 },
          { x: 0.53, y: 0.06, w: 0.43, h: 0.88 }
        ]},
        { id: '4-etsy-hero-left-3strips-right', name: '1 Hero Left + 3 Stacked Rows Right (Etsy Olive)', rects: [
          { x: 0.04, y: 0.06, w: 0.43, h: 0.88 },
          { x: 0.53, y: 0.06, w: 0.43, h: 0.27 },
          { x: 0.53, y: 0.36, w: 0.43, h: 0.27 },
          { x: 0.53, y: 0.67, w: 0.43, h: 0.27 }
        ]},
        { id: '4-screenshot10-2cols-left-2stacked-right', name: '2 Columns Left + 2 Stacked Right (Screenshot 10)', rects: [
          { x: 0.04, y: 0.06, w: 0.20, h: 0.88 },
          { x: 0.27, y: 0.06, w: 0.20, h: 0.88 },
          { x: 0.53, y: 0.06, w: 0.43, h: 0.42 },
          { x: 0.53, y: 0.52, w: 0.43, h: 0.42 }
        ]},
        { id: '4-screenshot10-2stacked-left-2cols-right', name: '2 Stacked Left + 2 Columns Right (Screenshot 10)', rects: [
          { x: 0.04, y: 0.06, w: 0.43, h: 0.42 },
          { x: 0.04, y: 0.52, w: 0.43, h: 0.42 },
          { x: 0.53, y: 0.06, w: 0.20, h: 0.88 },
          { x: 0.76, y: 0.06, w: 0.20, h: 0.88 }
        ]}
      ],

      // 5 Photo Spreads - (temps: WHCC, Shortcake, PSD, Screenshot 20, Screenshot 19, Etsy Olive, Screenshot 14, Temp 3)
      5: [
        { id: '5-whcc-square-hero-4collage', name: 'Square Hero Left + 4 Collage Right (WHCC)', rects: [
          { x: 0.04, y: 0.06, w: 0.43, h: 0.88 },
          { x: 0.53, y: 0.06, w: 0.23, h: 0.42 },
          { x: 0.78, y: 0.06, w: 0.18, h: 0.88 },
          { x: 0.53, y: 0.52, w: 0.11, h: 0.42 },
          { x: 0.65, y: 0.52, w: 0.11, h: 0.42 }
        ]},
        { id: '5-temp3-fullbleed-left-4grid-right', name: 'Full Bleed Left + 4-Grid Right (Temp 3)', rects: [
          { x: 0.0, y: 0.0, w: 0.50, h: 1.0 },
          { x: 0.54, y: 0.10, w: 0.20, h: 0.38 },
          { x: 0.76, y: 0.10, w: 0.20, h: 0.38 },
          { x: 0.54, y: 0.52, w: 0.20, h: 0.38 },
          { x: 0.76, y: 0.52, w: 0.20, h: 0.38 }
        ]},
        { id: '5-temp3-1large-2stacked-left-hero-right', name: '1 Tall & 2 Stacked Left + Bleed Hero Right (Temp 3)', rects: [
          { x: 0.05, y: 0.10, w: 0.22, h: 0.80 },
          { x: 0.29, y: 0.10, w: 0.18, h: 0.38 },
          { x: 0.29, y: 0.52, w: 0.18, h: 0.38 },
          { x: 0.52, y: 0.0, w: 0.48, h: 1.0 }
        ]},
        { id: '5-temp3-banner-left-4grid-right', name: 'Banner Left + 4-Grid Right (Temp 3)', rects: [
          { x: 0.08, y: 0.20, w: 0.36, h: 0.60 },
          { x: 0.52, y: 0.10, w: 0.18, h: 0.38 },
          { x: 0.72, y: 0.10, w: 0.18, h: 0.38 },
          { x: 0.52, y: 0.52, w: 0.18, h: 0.38 },
          { x: 0.72, y: 0.52, w: 0.18, h: 0.38 }
        ]},
        { id: '5-temp3-3top-2bottom-editorial', name: '2 Top & Landscape Left + 2 Top Right (Temp 3)', rects: [
          { x: 0.06, y: 0.12, w: 0.18, h: 0.36 },
          { x: 0.26, y: 0.12, w: 0.18, h: 0.36 },
          { x: 0.06, y: 0.52, w: 0.38, h: 0.36 },
          { x: 0.54, y: 0.12, w: 0.19, h: 0.36 },
          { x: 0.75, y: 0.12, w: 0.19, h: 0.36 }
        ]},
        { id: '5-temp3-first-look-3stacked-2right', name: '3 Vertical Strips Left + Couple Hero & Inset Right (Temp 3)', rects: [
          { x: 0.06, y: 0.10, w: 0.12, h: 0.80 },
          { x: 0.20, y: 0.10, w: 0.12, h: 0.80 },
          { x: 0.34, y: 0.10, w: 0.12, h: 0.80 },
          { x: 0.52, y: 0.08, w: 0.23, h: 0.84 },
          { x: 0.77, y: 0.18, w: 0.18, h: 0.64 }
        ]},
        { id: '5-whcc-4collage-square-hero', name: '4 Collage Left + Square Hero Right (WHCC)', rects: [
          { x: 0.04, y: 0.06, w: 0.23, h: 0.42 },
          { x: 0.29, y: 0.06, w: 0.18, h: 0.88 },
          { x: 0.04, y: 0.52, w: 0.11, h: 0.42 },
          { x: 0.16, y: 0.52, w: 0.11, h: 0.42 },
          { x: 0.53, y: 0.06, w: 0.43, h: 0.88 }
        ]},
        { id: '5-shortcake-stacked-tall-squares', name: '2 Stacked Left + Tall Column & 2 Squares Right (Shortcake)', rects: [
          { x: 0.04, y: 0.06, w: 0.43, h: 0.42 },
          { x: 0.04, y: 0.52, w: 0.43, h: 0.42 },
          { x: 0.53, y: 0.06, w: 0.20, h: 0.88 },
          { x: 0.76, y: 0.06, w: 0.20, h: 0.42 },
          { x: 0.76, y: 0.52, w: 0.20, h: 0.42 }
        ]},
        { id: '5-psd-tall-square-landscape-split', name: 'Tall Inset + Square Left + Wide Landscape + Tall Right (PSD)', rects: [
          { x: 0.04, y: 0.06, w: 0.20, h: 0.88 },
          { x: 0.26, y: 0.06, w: 0.20, h: 0.42 },
          { x: 0.53, y: 0.06, w: 0.43, h: 0.42 },
          { x: 0.53, y: 0.52, w: 0.20, h: 0.42 },
          { x: 0.76, y: 0.52, w: 0.20, h: 0.42 }
        ]},
        { id: '5-screenshot20-3cols-wide-left-hero-right', name: '3 Columns + Wide Left + Hero Right (Gallery Wall)', rects: [
          { x: 0.04, y: 0.06, w: 0.125, h: 0.42 },
          { x: 0.185, y: 0.06, w: 0.125, h: 0.42 },
          { x: 0.33, y: 0.06, w: 0.125, h: 0.42 },
          { x: 0.04, y: 0.52, w: 0.415, h: 0.42 },
          { x: 0.53, y: 0.06, w: 0.43, h: 0.88 }
        ]},
        { id: '5-screenshot20-hero-left-3cols-wide-right', name: 'Hero Left + 3 Columns + Wide Right (Gallery Wall)', rects: [
          { x: 0.04, y: 0.06, w: 0.43, h: 0.88 },
          { x: 0.53, y: 0.06, w: 0.125, h: 0.42 },
          { x: 0.675, y: 0.06, w: 0.125, h: 0.42 },
          { x: 0.82, y: 0.06, w: 0.125, h: 0.42 },
          { x: 0.53, y: 0.52, w: 0.415, h: 0.42 }
        ]},
        { id: '5-screenshot19-2stacked-tall-2stacked', name: '2 Stacked Left + 1 Tall Center + 2 Stacked Right (Moodboard)', rects: [
          { x: 0.04, y: 0.06, w: 0.19, h: 0.42 },
          { x: 0.04, y: 0.52, w: 0.19, h: 0.42 },
          { x: 0.26, y: 0.06, w: 0.21, h: 0.88 },
          { x: 0.53, y: 0.06, w: 0.43, h: 0.42 },
          { x: 0.53, y: 0.52, w: 0.43, h: 0.42 }
        ]},
        { id: '5-etsy-large-landscape-4grid', name: '1 Large Landscape Left + 4-Grid (2x2) Right (Etsy Olive)', rects: [
          { x: 0.04, y: 0.15, w: 0.43, h: 0.70 },
          { x: 0.53, y: 0.08, w: 0.20, h: 0.40 },
          { x: 0.76, y: 0.08, w: 0.20, h: 0.40 },
          { x: 0.53, y: 0.52, w: 0.20, h: 0.40 },
          { x: 0.76, y: 0.52, w: 0.20, h: 0.40 }
        ]},
        { id: '5-screenshot14-2cols-left-3stacked-right', name: '2 Columns Left + 3 Stacked Right (Screenshot 14)', rects: [
          { x: 0.04, y: 0.06, w: 0.20, h: 0.88 },
          { x: 0.27, y: 0.06, w: 0.20, h: 0.88 },
          { x: 0.53, y: 0.05, w: 0.43, h: 0.27 },
          { x: 0.53, y: 0.36, w: 0.43, h: 0.27 },
          { x: 0.53, y: 0.67, w: 0.43, h: 0.27 }
        ]},
        { id: '5-screenshot14-3stacked-left-2cols-right', name: '3 Stacked Left + 2 Columns Right (Screenshot 14)', rects: [
          { x: 0.04, y: 0.05, w: 0.43, h: 0.27 },
          { x: 0.04, y: 0.36, w: 0.43, h: 0.27 },
          { x: 0.04, y: 0.67, w: 0.43, h: 0.27 },
          { x: 0.53, y: 0.06, w: 0.20, h: 0.88 },
          { x: 0.76, y: 0.06, w: 0.20, h: 0.88 }
        ]}
      ],

      // 6 Photo Spreads - (temps: WHCC, PSD, Karamela, Shortcake, Screenshot 6, Screenshot 18, Screenshot 9, Screenshot 8, Temp 3)
      6: [
        { id: '6-temp3-classic-wedding-spread', name: 'Tall & 2 Stacked Left + 3 Story Columns Right (Temp 3)', rects: [
          { x: 0.06, y: 0.08, w: 0.18, h: 0.84 },
          { x: 0.26, y: 0.08, w: 0.20, h: 0.40 },
          { x: 0.26, y: 0.52, w: 0.20, h: 0.40 },
          { x: 0.52, y: 0.08, w: 0.13, h: 0.84 },
          { x: 0.67, y: 0.08, w: 0.13, h: 0.84 },
          { x: 0.82, y: 0.08, w: 0.13, h: 0.84 }
        ]},
        { id: '6-temp3-dress-details-tall-hero', name: '3 Details Left + Tall Hero & 2 Stacked Right (Temp 3)', rects: [
          { x: 0.06, y: 0.10, w: 0.18, h: 0.38 },
          { x: 0.26, y: 0.10, w: 0.18, h: 0.38 },
          { x: 0.06, y: 0.52, w: 0.38, h: 0.38 },
          { x: 0.52, y: 0.06, w: 0.22, h: 0.88 },
          { x: 0.76, y: 0.06, w: 0.18, h: 0.42 },
          { x: 0.76, y: 0.52, w: 0.18, h: 0.42 }
        ]},
        { id: '6-temp3-storybook-grid-5left-1right', name: '2 Top & 3 Bottom Left + Hero Right (Temp 3)', rects: [
          { x: 0.06, y: 0.08, w: 0.18, h: 0.40 },
          { x: 0.26, y: 0.08, w: 0.18, h: 0.40 },
          { x: 0.06, y: 0.52, w: 0.11, h: 0.36 },
          { x: 0.19, y: 0.52, w: 0.11, h: 0.36 },
          { x: 0.32, y: 0.52, w: 0.11, h: 0.36 },
          { x: 0.54, y: 0.10, w: 0.40, h: 0.80 }
        ]},
        { id: '6-whcc-3strips-3collage', name: '3 Vertical Strips Left + 3 Collage Right (WHCC)', rects: [
          { x: 0.04, y: 0.08, w: 0.13, h: 0.84 },
          { x: 0.19, y: 0.08, w: 0.13, h: 0.84 },
          { x: 0.34, y: 0.08, w: 0.13, h: 0.84 },
          { x: 0.53, y: 0.08, w: 0.43, h: 0.40 },
          { x: 0.53, y: 0.52, w: 0.20, h: 0.40 },
          { x: 0.76, y: 0.52, w: 0.20, h: 0.40 }
        ]},
        { id: '6-whcc-3collage-3strips', name: '3 Collage Left + 3 Vertical Strips Right (WHCC)', rects: [
          { x: 0.04, y: 0.08, w: 0.43, h: 0.40 },
          { x: 0.04, y: 0.52, w: 0.20, h: 0.40 },
          { x: 0.27, y: 0.52, w: 0.20, h: 0.40 },
          { x: 0.53, y: 0.08, w: 0.13, h: 0.84 },
          { x: 0.68, y: 0.08, w: 0.13, h: 0.84 },
          { x: 0.83, y: 0.08, w: 0.13, h: 0.84 }
        ]},
        { id: '6-psd-square-2stacked-3columns', name: 'Square & 2 Bottom Left + 2 Stacked & Landscape Right (Collage PSD)', rects: [
          { x: 0.04, y: 0.06, w: 0.43, h: 0.42 },
          { x: 0.04, y: 0.52, w: 0.20, h: 0.42 },
          { x: 0.27, y: 0.52, w: 0.20, h: 0.42 },
          { x: 0.53, y: 0.06, w: 0.43, h: 0.20 },
          { x: 0.53, y: 0.28, w: 0.43, h: 0.20 },
          { x: 0.53, y: 0.52, w: 0.43, h: 0.42 }
        ]},
        { id: '6-karamela-3top-3bottom', name: '3 Story Columns Top + 3 Story Columns Bottom (Karamela)', rects: [
          { x: 0.04, y: 0.05, w: 0.13, h: 0.42 },
          { x: 0.19, y: 0.05, w: 0.13, h: 0.42 },
          { x: 0.34, y: 0.05, w: 0.13, h: 0.42 },
          { x: 0.53, y: 0.05, w: 0.13, h: 0.42 },
          { x: 0.68, y: 0.05, w: 0.13, h: 0.42 },
          { x: 0.83, y: 0.05, w: 0.13, h: 0.42 }
        ]},
        { id: '6-shortcake-landscape-2squares-4grid', name: 'Top Wide + 2 Squares Left + 4 Grid Right (Shortcake)', rects: [
          { x: 0.04, y: 0.05, w: 0.43, h: 0.42 },
          { x: 0.04, y: 0.53, w: 0.20, h: 0.42 },
          { x: 0.27, y: 0.53, w: 0.20, h: 0.42 },
          { x: 0.53, y: 0.05, w: 0.20, h: 0.42 },
          { x: 0.76, y: 0.05, w: 0.20, h: 0.42 },
          { x: 0.53, y: 0.53, w: 0.20, h: 0.42 },
          { x: 0.76, y: 0.53, w: 0.20, h: 0.42 }
        ]},
        { id: '6-screenshot6-top-wide-2bottom-each', name: 'Top Wide + 2 Squares Left & Right (Collage)', rects: [
          { x: 0.04, y: 0.06, w: 0.43, h: 0.42 },
          { x: 0.04, y: 0.52, w: 0.20, h: 0.42 },
          { x: 0.27, y: 0.52, w: 0.20, h: 0.42 },
          { x: 0.53, y: 0.06, w: 0.43, h: 0.42 },
          { x: 0.53, y: 0.52, w: 0.20, h: 0.42 },
          { x: 0.76, y: 0.52, w: 0.20, h: 0.42 }
        ]},
        { id: '6-screenshot18-tall-left-top-wide-2bottom-2right', name: 'Tall Left + Top Wide & 2 Bottom Left + 2 Stacked Right', rects: [
          { x: 0.04, y: 0.06, w: 0.18, h: 0.88 },
          { x: 0.25, y: 0.06, w: 0.22, h: 0.42 },
          { x: 0.25, y: 0.52, w: 0.22, h: 0.42 },
          { x: 0.53, y: 0.06, w: 0.43, h: 0.42 },
          { x: 0.53, y: 0.52, w: 0.20, h: 0.42 },
          { x: 0.76, y: 0.52, w: 0.20, h: 0.42 }
        ]},
        { id: '6-screenshot9-3landscape-left-3landscape-right', name: '3 Landscapes Left + 3 Landscapes Right (Screenshot 9)', rects: [
          { x: 0.04, y: 0.06, w: 0.43, h: 0.27 },
          { x: 0.04, y: 0.36, w: 0.43, h: 0.27 },
          { x: 0.04, y: 0.67, w: 0.43, h: 0.27 },
          { x: 0.53, y: 0.06, w: 0.43, h: 0.27 },
          { x: 0.53, y: 0.36, w: 0.43, h: 0.27 },
          { x: 0.53, y: 0.67, w: 0.43, h: 0.27 }
        ]},
        { id: '6-screenshot8-6vertical-columns', name: '6 Vertical Story Columns (3 Left, 3 Right) (Screenshot 8)', rects: [
          { x: 0.04, y: 0.06, w: 0.13, h: 0.88 },
          { x: 0.19, y: 0.06, w: 0.13, h: 0.88 },
          { x: 0.34, y: 0.06, w: 0.13, h: 0.88 },
          { x: 0.53, y: 0.06, w: 0.13, h: 0.88 },
          { x: 0.68, y: 0.06, w: 0.13, h: 0.88 },
          { x: 0.83, y: 0.06, w: 0.13, h: 0.88 }
        ]}
      ],

      // 7 Photo Spreads - (temps: Karamela, PSD, Screenshot 6, Screenshot 21)
      7: [
        { id: '7-karamela-c-mosaic', name: 'Wide Landscape + 2 Portraits Left + Mosaic Right (Karamela)', rects: [
          { x: 0.04, y: 0.05, w: 0.43, h: 0.42 },
          { x: 0.04, y: 0.53, w: 0.20, h: 0.42 },
          { x: 0.27, y: 0.53, w: 0.20, h: 0.42 },
          { x: 0.53, y: 0.05, w: 0.43, h: 0.30 },
          { x: 0.53, y: 0.38, w: 0.20, h: 0.57 },
          { x: 0.76, y: 0.38, w: 0.20, h: 0.27 },
          { x: 0.76, y: 0.68, w: 0.20, h: 0.27 }
        ]},
        { id: '7-psd-left3-center-right3', name: '3 Stacked Left + 4 Mosaic Right (Collage PSD)', rects: [
          { x: 0.04, y: 0.05, w: 0.43, h: 0.27 },
          { x: 0.04, y: 0.36, w: 0.43, h: 0.27 },
          { x: 0.04, y: 0.67, w: 0.43, h: 0.27 },
          { x: 0.53, y: 0.05, w: 0.20, h: 0.88 },
          { x: 0.76, y: 0.05, w: 0.20, h: 0.42 },
          { x: 0.76, y: 0.52, w: 0.20, h: 0.20 },
          { x: 0.76, y: 0.75, w: 0.20, h: 0.20 }
        ]},
        { id: '7-screenshot6-6grid-left-hero-right', name: '6 Grid Left (3x2) + Hero Right Inset (Screenshot 6)', rects: [
          { x: 0.04, y: 0.06, w: 0.125, h: 0.42 },
          { x: 0.185, y: 0.06, w: 0.125, h: 0.42 },
          { x: 0.33, y: 0.06, w: 0.125, h: 0.42 },
          { x: 0.04, y: 0.52, w: 0.125, h: 0.42 },
          { x: 0.185, y: 0.52, w: 0.125, h: 0.42 },
          { x: 0.33, y: 0.52, w: 0.125, h: 0.42 },
          { x: 0.55, y: 0.08, w: 0.38, h: 0.84 }
        ]},
        { id: '7-screenshot6-hero-left-6grid-right', name: 'Hero Left Inset + 6 Grid Right (3x2) (Screenshot 6)', rects: [
          { x: 0.07, y: 0.08, w: 0.38, h: 0.84 },
          { x: 0.53, y: 0.06, w: 0.125, h: 0.42 },
          { x: 0.675, y: 0.06, w: 0.125, h: 0.42 },
          { x: 0.82, y: 0.06, w: 0.125, h: 0.42 },
          { x: 0.53, y: 0.52, w: 0.125, h: 0.42 },
          { x: 0.675, y: 0.52, w: 0.125, h: 0.42 },
          { x: 0.82, y: 0.52, w: 0.125, h: 0.42 }
        ]},
        { id: '7-screenshot21-mosaic-4left-3right', name: '4 Mosaic Left + 3 Stacked Right (Screenshot 21)', rects: [
          { x: 0.04, y: 0.06, w: 0.125, h: 0.42 },
          { x: 0.185, y: 0.06, w: 0.125, h: 0.42 },
          { x: 0.33, y: 0.06, w: 0.125, h: 0.42 },
          { x: 0.04, y: 0.52, w: 0.415, h: 0.42 },
          { x: 0.53, y: 0.06, w: 0.43, h: 0.27 },
          { x: 0.53, y: 0.36, w: 0.43, h: 0.27 },
          { x: 0.53, y: 0.67, w: 0.43, h: 0.27 }
        ]},
        { id: '7-screenshot21-3stacked-left-4mosaic-right', name: '3 Stacked Left + 4 Mosaic Right (Screenshot 21)', rects: [
          { x: 0.04, y: 0.06, w: 0.43, h: 0.27 },
          { x: 0.04, y: 0.36, w: 0.43, h: 0.27 },
          { x: 0.04, y: 0.67, w: 0.43, h: 0.27 },
          { x: 0.53, y: 0.06, w: 0.125, h: 0.42 },
          { x: 0.675, y: 0.06, w: 0.125, h: 0.42 },
          { x: 0.82, y: 0.06, w: 0.125, h: 0.42 },
          { x: 0.53, y: 0.52, w: 0.415, h: 0.42 }
        ]}
      ],

      // 8 Photo Spreads - (temps: WHCC, Screenshot 13, Screenshot 22, Screenshot 23)
      8: [
        { id: '8-whcc-dual-4grid', name: 'Dual 4-Grid Quad (4 Left, 4 Right - WHCC)', rects: [
          { x: 0.04, y: 0.06, w: 0.20, h: 0.42 },
          { x: 0.27, y: 0.06, w: 0.20, h: 0.42 },
          { x: 0.04, y: 0.52, w: 0.20, h: 0.42 },
          { x: 0.27, y: 0.52, w: 0.20, h: 0.42 },
          { x: 0.53, y: 0.06, w: 0.20, h: 0.42 },
          { x: 0.76, y: 0.06, w: 0.20, h: 0.42 },
          { x: 0.53, y: 0.52, w: 0.20, h: 0.42 },
          { x: 0.76, y: 0.52, w: 0.20, h: 0.42 }
        ]},
        { id: '8-screenshot13-gallery-wall', name: '8 Gallery Wall Mosaic (4 Left, 4 Right) (Screenshot 13)', rects: [
          { x: 0.04, y: 0.06, w: 0.20, h: 0.42 },
          { x: 0.27, y: 0.06, w: 0.20, h: 0.42 },
          { x: 0.04, y: 0.52, w: 0.20, h: 0.42 },
          { x: 0.27, y: 0.52, w: 0.20, h: 0.42 },
          { x: 0.53, y: 0.06, w: 0.43, h: 0.42 },
          { x: 0.53, y: 0.52, w: 0.20, h: 0.42 },
          { x: 0.76, y: 0.52, w: 0.20, h: 0.42 },
          { x: 0.76, y: 0.06, w: 0.20, h: 0.42 }
        ]},
        { id: '8-screenshot22-moodboard-4left-4right', name: 'Moodboard Split (4 Left, 4 Right) (Screenshot 22)', rects: [
          { x: 0.04, y: 0.06, w: 0.43, h: 0.25 },
          { x: 0.04, y: 0.35, w: 0.20, h: 0.27 },
          { x: 0.04, y: 0.66, w: 0.20, h: 0.27 },
          { x: 0.27, y: 0.35, w: 0.20, h: 0.58 },
          { x: 0.53, y: 0.06, w: 0.20, h: 0.42 },
          { x: 0.76, y: 0.06, w: 0.20, h: 0.88 },
          { x: 0.53, y: 0.52, w: 0.095, h: 0.42 },
          { x: 0.645, y: 0.52, w: 0.095, h: 0.42 }
        ]},
        { id: '8-screenshot23-2cols-left-6grid-right', name: '2 Columns Left + 6 Grid Right (3x2) (Screenshot 23)', rects: [
          { x: 0.04, y: 0.06, w: 0.20, h: 0.88 },
          { x: 0.27, y: 0.06, w: 0.20, h: 0.88 },
          { x: 0.53, y: 0.06, w: 0.13, h: 0.42 },
          { x: 0.68, y: 0.06, w: 0.13, h: 0.42 },
          { x: 0.83, y: 0.06, w: 0.13, h: 0.42 },
          { x: 0.53, y: 0.52, w: 0.13, h: 0.42 },
          { x: 0.68, y: 0.52, w: 0.13, h: 0.42 },
          { x: 0.83, y: 0.52, w: 0.13, h: 0.42 }
        ]},
        { id: '8-screenshot23-6grid-left-2cols-right', name: '6 Grid Left + 2 Columns Right (Screenshot 23)', rects: [
          { x: 0.04, y: 0.06, w: 0.13, h: 0.42 },
          { x: 0.19, y: 0.06, w: 0.13, h: 0.42 },
          { x: 0.34, y: 0.06, w: 0.13, h: 0.42 },
          { x: 0.04, y: 0.52, w: 0.13, h: 0.42 },
          { x: 0.19, y: 0.52, w: 0.13, h: 0.42 },
          { x: 0.34, y: 0.52, w: 0.13, h: 0.42 },
          { x: 0.53, y: 0.06, w: 0.20, h: 0.88 },
          { x: 0.76, y: 0.06, w: 0.20, h: 0.88 }
        ]}
      ],

      // 9 Photo Spreads - (temps: Screenshot 16, Screenshot 17)
      9: [
        { id: '9-screenshot16-poster-mosaic-4left-5right', name: 'Poster Mosaic (4 Left, 5 Right) (Screenshot 16)', rects: [
          { x: 0.04, y: 0.06, w: 0.43, h: 0.42 },
          { x: 0.04, y: 0.52, w: 0.20, h: 0.42 },
          { x: 0.27, y: 0.52, w: 0.10, h: 0.42 },
          { x: 0.38, y: 0.52, w: 0.09, h: 0.42 },
          { x: 0.53, y: 0.06, w: 0.20, h: 0.42 },
          { x: 0.76, y: 0.06, w: 0.20, h: 0.42 },
          { x: 0.53, y: 0.52, w: 0.13, h: 0.42 },
          { x: 0.68, y: 0.52, w: 0.13, h: 0.42 },
          { x: 0.83, y: 0.52, w: 0.13, h: 0.42 }
        ]},
        { id: '9-screenshot17-grid-4left-5right', name: 'Editorial Grid (4 Left, 5 Right) (Screenshot 17)', rects: [
          { x: 0.04, y: 0.06, w: 0.20, h: 0.42 },
          { x: 0.27, y: 0.06, w: 0.20, h: 0.42 },
          { x: 0.04, y: 0.52, w: 0.20, h: 0.42 },
          { x: 0.27, y: 0.52, w: 0.20, h: 0.42 },
          { x: 0.53, y: 0.06, w: 0.20, h: 0.42 },
          { x: 0.76, y: 0.06, w: 0.20, h: 0.42 },
          { x: 0.53, y: 0.52, w: 0.13, h: 0.42 },
          { x: 0.68, y: 0.52, w: 0.13, h: 0.42 },
          { x: 0.83, y: 0.52, w: 0.13, h: 0.42 }
        ]},
        { id: '9-screenshot16-poster-mosaic-5left-4right', name: 'Poster Mosaic (5 Left, 4 Right) (Screenshot 16)', rects: [
          { x: 0.04, y: 0.06, w: 0.20, h: 0.42 },
          { x: 0.27, y: 0.06, w: 0.20, h: 0.42 },
          { x: 0.04, y: 0.52, w: 0.13, h: 0.42 },
          { x: 0.19, y: 0.52, w: 0.13, h: 0.42 },
          { x: 0.34, y: 0.52, w: 0.13, h: 0.42 },
          { x: 0.53, y: 0.06, w: 0.43, h: 0.42 },
          { x: 0.53, y: 0.52, w: 0.20, h: 0.42 },
          { x: 0.76, y: 0.52, w: 0.10, h: 0.42 },
          { x: 0.87, y: 0.52, w: 0.09, h: 0.42 }
        ]},
        { id: '9-screenshot17-grid-5left-4right', name: 'Editorial Grid (5 Left, 4 Right) (Screenshot 17)', rects: [
          { x: 0.04, y: 0.06, w: 0.20, h: 0.42 },
          { x: 0.27, y: 0.06, w: 0.20, h: 0.42 },
          { x: 0.04, y: 0.52, w: 0.13, h: 0.42 },
          { x: 0.19, y: 0.52, w: 0.13, h: 0.42 },
          { x: 0.34, y: 0.52, w: 0.13, h: 0.42 },
          { x: 0.53, y: 0.06, w: 0.20, h: 0.42 },
          { x: 0.76, y: 0.06, w: 0.20, h: 0.42 },
          { x: 0.53, y: 0.52, w: 0.20, h: 0.42 },
          { x: 0.76, y: 0.52, w: 0.20, h: 0.42 }
        ]}
      ],

      // 10 Photo Spreads - (temps: WHCC, Vector Wall, Shortcake, PSD, Screenshot 11, Screenshot 15)
      10: [
        { id: '10-whcc-storyboard-5-5', name: 'Dual 5-Photo Storyboards (WHCC)', rects: [
          { x: 0.04, y: 0.05, w: 0.43, h: 0.44 },
          { x: 0.04, y: 0.53, w: 0.09, h: 0.42 },
          { x: 0.155, y: 0.53, w: 0.09, h: 0.42 },
          { x: 0.27, y: 0.53, w: 0.09, h: 0.42 },
          { x: 0.385, y: 0.53, w: 0.09, h: 0.42 },
          { x: 0.53, y: 0.05, w: 0.43, h: 0.44 },
          { x: 0.53, y: 0.53, w: 0.09, h: 0.42 },
          { x: 0.645, y: 0.53, w: 0.09, h: 0.42 },
          { x: 0.76, y: 0.53, w: 0.09, h: 0.42 },
          { x: 0.875, y: 0.53, w: 0.09, h: 0.42 }
        ]},
        { id: '10-vector-wall-mosaic-a', name: 'Dual 5-Mosaic Wall Pages (Vector Wall)', rects: [
          { x: 0.04, y: 0.05, w: 0.14, h: 0.90 },
          { x: 0.20, y: 0.05, w: 0.13, h: 0.43 },
          { x: 0.20, y: 0.52, w: 0.13, h: 0.43 },
          { x: 0.35, y: 0.05, w: 0.12, h: 0.43 },
          { x: 0.35, y: 0.52, w: 0.12, h: 0.43 },
          { x: 0.53, y: 0.05, w: 0.12, h: 0.43 },
          { x: 0.53, y: 0.52, w: 0.12, h: 0.43 },
          { x: 0.67, y: 0.05, w: 0.13, h: 0.43 },
          { x: 0.67, y: 0.52, w: 0.13, h: 0.43 },
          { x: 0.82, y: 0.05, w: 0.14, h: 0.90 }
        ]},
        { id: '10-shortcake-4left-6right', name: '4-Grid Left (2x2) + 6-Grid Right (2x3) (Shortcake)', rects: [
          { x: 0.04, y: 0.05, w: 0.20, h: 0.42 },
          { x: 0.27, y: 0.05, w: 0.20, h: 0.42 },
          { x: 0.04, y: 0.53, w: 0.20, h: 0.42 },
          { x: 0.27, y: 0.53, w: 0.20, h: 0.42 },
          { x: 0.53, y: 0.05, w: 0.13, h: 0.42 },
          { x: 0.685, y: 0.05, w: 0.13, h: 0.42 },
          { x: 0.84, y: 0.05, w: 0.13, h: 0.42 },
          { x: 0.53, y: 0.53, w: 0.13, h: 0.42 },
          { x: 0.685, y: 0.53, w: 0.13, h: 0.42 },
          { x: 0.84, y: 0.53, w: 0.13, h: 0.42 }
        ]},
        { id: '10-psd-collage-6left-4right', name: '6-Grid Left (2x3) + 4-Grid Right (2x2) (Collage PSD)', rects: [
          { x: 0.04, y: 0.05, w: 0.13, h: 0.42 },
          { x: 0.195, y: 0.05, w: 0.13, h: 0.42 },
          { x: 0.35, y: 0.05, w: 0.13, h: 0.42 },
          { x: 0.04, y: 0.53, w: 0.13, h: 0.42 },
          { x: 0.195, y: 0.53, w: 0.13, h: 0.42 },
          { x: 0.35, y: 0.53, w: 0.13, h: 0.42 },
          { x: 0.53, y: 0.05, w: 0.20, h: 0.42 },
          { x: 0.76, y: 0.05, w: 0.20, h: 0.42 },
          { x: 0.53, y: 0.53, w: 0.20, h: 0.42 },
          { x: 0.76, y: 0.53, w: 0.20, h: 0.42 }
        ]},
        { id: '10-screenshot11-3left-4center-3right', name: 'Symmetric Center Filmstrip (5 Left, 5 Right) (Screenshot 11)', rects: [
          { x: 0.04, y: 0.06, w: 0.19, h: 0.27 },
          { x: 0.04, y: 0.36, w: 0.19, h: 0.27 },
          { x: 0.04, y: 0.67, w: 0.19, h: 0.27 },
          { x: 0.26, y: 0.06, w: 0.10, h: 0.88 },
          { x: 0.37, y: 0.06, w: 0.10, h: 0.88 },
          { x: 0.53, y: 0.06, w: 0.10, h: 0.88 },
          { x: 0.64, y: 0.06, w: 0.10, h: 0.88 },
          { x: 0.77, y: 0.06, w: 0.19, h: 0.27 },
          { x: 0.77, y: 0.36, w: 0.19, h: 0.27 },
          { x: 0.77, y: 0.67, w: 0.19, h: 0.27 }
        ]},
        { id: '10-screenshot15-collage-5left-5right', name: 'Multi-Frame Collage (5 Left, 5 Right) (Screenshot 15)', rects: [
          { x: 0.04, y: 0.06, w: 0.20, h: 0.27 },
          { x: 0.27, y: 0.06, w: 0.20, h: 0.27 },
          { x: 0.04, y: 0.36, w: 0.20, h: 0.27 },
          { x: 0.27, y: 0.36, w: 0.20, h: 0.27 },
          { x: 0.04, y: 0.67, w: 0.43, h: 0.27 },
          { x: 0.53, y: 0.06, w: 0.20, h: 0.57 },
          { x: 0.76, y: 0.06, w: 0.20, h: 0.27 },
          { x: 0.76, y: 0.36, w: 0.20, h: 0.27 },
          { x: 0.53, y: 0.67, w: 0.20, h: 0.27 },
          { x: 0.76, y: 0.67, w: 0.20, h: 0.27 }
        ]}
      ],

      // 11 Photo Spreads - (temps: Vector Wall, Screenshot 17)
      11: [
        { id: '11-vector-wall-mosaic-5-6', name: '5 Mosaic Left + 6 Grid Right (Vector Wall)', rects: [
          { x: 0.04, y: 0.05, w: 0.43, h: 0.44 },
          { x: 0.04, y: 0.53, w: 0.09, h: 0.42 },
          { x: 0.155, y: 0.53, w: 0.09, h: 0.42 },
          { x: 0.27, y: 0.53, w: 0.09, h: 0.42 },
          { x: 0.385, y: 0.53, w: 0.09, h: 0.42 },
          { x: 0.53, y: 0.05, w: 0.13, h: 0.42 },
          { x: 0.685, y: 0.05, w: 0.13, h: 0.42 },
          { x: 0.84, y: 0.05, w: 0.13, h: 0.42 },
          { x: 0.53, y: 0.53, w: 0.13, h: 0.42 },
          { x: 0.685, y: 0.53, w: 0.13, h: 0.42 },
          { x: 0.84, y: 0.53, w: 0.13, h: 0.42 }
        ]},
        { id: '11-vector-wall-mosaic-6-5', name: '6 Grid Left + 5 Mosaic Right (Vector Wall)', rects: [
          { x: 0.04, y: 0.05, w: 0.13, h: 0.42 },
          { x: 0.195, y: 0.05, w: 0.13, h: 0.42 },
          { x: 0.35, y: 0.05, w: 0.13, h: 0.42 },
          { x: 0.04, y: 0.53, w: 0.13, h: 0.42 },
          { x: 0.195, y: 0.53, w: 0.13, h: 0.42 },
          { x: 0.35, y: 0.53, w: 0.13, h: 0.42 },
          { x: 0.53, y: 0.05, w: 0.43, h: 0.44 },
          { x: 0.53, y: 0.53, w: 0.09, h: 0.42 },
          { x: 0.645, y: 0.53, w: 0.09, h: 0.42 },
          { x: 0.76, y: 0.53, w: 0.09, h: 0.42 },
          { x: 0.875, y: 0.53, w: 0.09, h: 0.42 }
        ]},
        { id: '11-screenshot17-5left-6right-moodboard', name: 'Editorial Moodboard (5 Left, 6 Right) (Screenshot 17)', rects: [
          { x: 0.04, y: 0.06, w: 0.13, h: 0.42 },
          { x: 0.19, y: 0.06, w: 0.13, h: 0.42 },
          { x: 0.34, y: 0.06, w: 0.13, h: 0.42 },
          { x: 0.04, y: 0.52, w: 0.20, h: 0.42 },
          { x: 0.27, y: 0.52, w: 0.20, h: 0.42 },
          { x: 0.53, y: 0.06, w: 0.13, h: 0.42 },
          { x: 0.68, y: 0.06, w: 0.13, h: 0.42 },
          { x: 0.83, y: 0.06, w: 0.13, h: 0.42 },
          { x: 0.53, y: 0.52, w: 0.13, h: 0.42 },
          { x: 0.68, y: 0.52, w: 0.13, h: 0.42 },
          { x: 0.83, y: 0.52, w: 0.13, h: 0.42 }
        ]},
        { id: '11-screenshot17-6left-5right-moodboard', name: 'Editorial Moodboard (6 Left, 5 Right) (Screenshot 17)', rects: [
          { x: 0.04, y: 0.06, w: 0.13, h: 0.42 },
          { x: 0.19, y: 0.06, w: 0.13, h: 0.42 },
          { x: 0.34, y: 0.06, w: 0.13, h: 0.42 },
          { x: 0.04, y: 0.52, w: 0.13, h: 0.42 },
          { x: 0.19, y: 0.52, w: 0.13, h: 0.42 },
          { x: 0.34, y: 0.52, w: 0.13, h: 0.42 },
          { x: 0.53, y: 0.06, w: 0.13, h: 0.42 },
          { x: 0.68, y: 0.06, w: 0.13, h: 0.42 },
          { x: 0.83, y: 0.06, w: 0.13, h: 0.42 },
          { x: 0.53, y: 0.52, w: 0.20, h: 0.42 },
          { x: 0.76, y: 0.52, w: 0.20, h: 0.42 }
        ]}
      ],

      // 12 Photo Spreads - (temps: Screenshot 7, WHCC, Screenshot 12)
      12: [
        { id: '12-screenshot7-6top-6bottom-filmstrip', name: 'Dual 6-Filmstrip Matrix (6 Left, 6 Right) (Screenshot 7)', rects: [
          { x: 0.04, y: 0.06, w: 0.13, h: 0.42 }, { x: 0.19, y: 0.06, w: 0.13, h: 0.42 }, { x: 0.34, y: 0.06, w: 0.13, h: 0.42 },
          { x: 0.04, y: 0.52, w: 0.13, h: 0.42 }, { x: 0.19, y: 0.52, w: 0.13, h: 0.42 }, { x: 0.34, y: 0.52, w: 0.13, h: 0.42 },
          { x: 0.53, y: 0.06, w: 0.13, h: 0.42 }, { x: 0.68, y: 0.06, w: 0.13, h: 0.42 }, { x: 0.83, y: 0.06, w: 0.13, h: 0.42 },
          { x: 0.53, y: 0.52, w: 0.13, h: 0.42 }, { x: 0.68, y: 0.52, w: 0.13, h: 0.42 }, { x: 0.83, y: 0.52, w: 0.13, h: 0.42 }
        ]},
        { id: '12-whcc-dual-6storyboards', name: 'Dual WHCC Storyboards (1 Hero + 5 Columns each)', rects: [
          { x: 0.04, y: 0.05, w: 0.43, h: 0.46 },
          { x: 0.04, y: 0.54, w: 0.075, h: 0.41 },
          { x: 0.128, y: 0.54, w: 0.075, h: 0.41 },
          { x: 0.216, y: 0.54, w: 0.075, h: 0.41 },
          { x: 0.304, y: 0.54, w: 0.075, h: 0.41 },
          { x: 0.392, y: 0.54, w: 0.075, h: 0.41 },
          { x: 0.53, y: 0.05, w: 0.43, h: 0.46 },
          { x: 0.53, y: 0.54, w: 0.075, h: 0.41 },
          { x: 0.618, y: 0.54, w: 0.075, h: 0.41 },
          { x: 0.706, y: 0.54, w: 0.075, h: 0.41 },
          { x: 0.794, y: 0.54, w: 0.075, h: 0.41 },
          { x: 0.882, y: 0.54, w: 0.075, h: 0.41 }
        ]}
      ],

      // 18 Photo Spreads - (temps 3: Screenshot 27, 30)
      18: [
        { id: '18-temp3-dual-3x3-contact-sheet', name: 'Dual 3x3 Contact Sheet Matrix (9 Left, 9 Right) (Temp 3)', rects: [
          { x: 0.04, y: 0.06, w: 0.13, h: 0.27 }, { x: 0.19, y: 0.06, w: 0.13, h: 0.27 }, { x: 0.34, y: 0.06, w: 0.13, h: 0.27 },
          { x: 0.04, y: 0.36, w: 0.13, h: 0.27 }, { x: 0.19, y: 0.36, w: 0.13, h: 0.27 }, { x: 0.34, y: 0.36, w: 0.13, h: 0.27 },
          { x: 0.04, y: 0.67, w: 0.13, h: 0.27 }, { x: 0.19, y: 0.67, w: 0.13, h: 0.27 }, { x: 0.34, y: 0.67, w: 0.13, h: 0.27 },
          { x: 0.53, y: 0.06, w: 0.13, h: 0.27 }, { x: 0.68, y: 0.06, w: 0.13, h: 0.27 }, { x: 0.83, y: 0.06, w: 0.13, h: 0.27 },
          { x: 0.53, y: 0.36, w: 0.13, h: 0.27 }, { x: 0.68, y: 0.36, w: 0.13, h: 0.27 }, { x: 0.83, y: 0.36, w: 0.13, h: 0.27 },
          { x: 0.53, y: 0.67, w: 0.13, h: 0.27 }, { x: 0.68, y: 0.67, w: 0.13, h: 0.27 }, { x: 0.83, y: 0.67, w: 0.13, h: 0.27 }
        ]}
      ],

      // 24 Photo Spreads - (temps 3: Screenshot 27, 30)
      24: [
        { id: '24-temp3-dual-4x3-contact-sheet', name: 'Dual 4x3 Gallery Wall Mosaic (12 Left, 12 Right) (Temp 3)', rects: [
          { x: 0.04, y: 0.05, w: 0.095, h: 0.28 }, { x: 0.15, y: 0.05, w: 0.095, h: 0.28 }, { x: 0.26, y: 0.05, w: 0.095, h: 0.28 }, { x: 0.37, y: 0.05, w: 0.095, h: 0.28 },
          { x: 0.04, y: 0.36, w: 0.095, h: 0.28 }, { x: 0.15, y: 0.36, w: 0.095, h: 0.28 }, { x: 0.26, y: 0.36, w: 0.095, h: 0.28 }, { x: 0.37, y: 0.36, w: 0.095, h: 0.28 },
          { x: 0.04, y: 0.67, w: 0.095, h: 0.28 }, { x: 0.15, y: 0.67, w: 0.095, h: 0.28 }, { x: 0.26, y: 0.67, w: 0.095, h: 0.28 }, { x: 0.37, y: 0.67, w: 0.095, h: 0.28 },
          { x: 0.53, y: 0.05, w: 0.095, h: 0.28 }, { x: 0.64, y: 0.05, w: 0.095, h: 0.28 }, { x: 0.75, y: 0.05, w: 0.095, h: 0.28 }, { x: 0.86, y: 0.05, w: 0.095, h: 0.28 },
          { x: 0.53, y: 0.36, w: 0.095, h: 0.28 }, { x: 0.64, y: 0.36, w: 0.095, h: 0.28 }, { x: 0.75, y: 0.36, w: 0.095, h: 0.28 }, { x: 0.86, y: 0.36, w: 0.095, h: 0.28 },
          { x: 0.53, y: 0.67, w: 0.095, h: 0.28 }, { x: 0.64, y: 0.67, w: 0.095, h: 0.28 }, { x: 0.75, y: 0.67, w: 0.095, h: 0.28 }, { x: 0.86, y: 0.67, w: 0.095, h: 0.28 }
        ]}
      ]
    };

    // Merge authentic single-page designs and two-by-two spread pairings from "temp new/single page"
    const singlePageTemplates = this._getTempNewSinglePageTemplates();
    for (const count in singlePageTemplates) {
      if (!templates[count]) templates[count] = [];
      templates[count].push(...singlePageTemplates[count]);
    }

    // Merge authentic artistic designs and pairings from "temp new/artistic" (circles, brush, arches, diamonds, etc.)
    // Saved at the TOP (unshift) so they appear first!
    const artisticTemplates = this._getTempNewArtisticTemplates();
    for (const count in artisticTemplates) {
      if (!templates[count]) templates[count] = [];
      templates[count].unshift(...artisticTemplates[count]);
    }

    // Merge authentic cropped spread designs from "temp new/spreads/cropped/spreads"
    const croppedSpreadTemplates = this._getTempNewCroppedSpreadsTemplates();
    for (const count in croppedSpreadTemplates) {
      if (!templates[count]) templates[count] = [];
      templates[count].unshift(...croppedSpreadTemplates[count]);
    }

    return templates;
  }

  /**
   * Single page designs and two-by-two spread pairings extracted from:
   * temp new/single page (IMG_3827, IMG_3860, IMG_3861, IMG_3862, IMG_3864, IMG_3865, IMG_3866, IMG_3867)
   */
  _getTempNewSinglePageTemplates() {
    return {
      // 4 Photos (temp new single page designs & pairings)
      4: [
        { id: '4-tempnew-4strips-left', name: '4 Magazine Strips Left (Single Page)', rects: [
          { x: 0.057, y: 0.13, w: 0.084, h: 0.739 }, { x: 0.158, y: 0.13, w: 0.084, h: 0.739 }, { x: 0.258, y: 0.13, w: 0.084, h: 0.739 }, { x: 0.359, y: 0.13, w: 0.084, h: 0.739 }
        ]},
        { id: '4-tempnew-4strips-right', name: '4 Magazine Strips Right (Single Page)', rects: [
          { x: 0.557, y: 0.13, w: 0.084, h: 0.739 }, { x: 0.658, y: 0.13, w: 0.084, h: 0.739 }, { x: 0.758, y: 0.13, w: 0.084, h: 0.739 }, { x: 0.859, y: 0.13, w: 0.084, h: 0.739 }
        ]}
      ],

      // 5 Photos (temp new single page designs & pairings)
      5: [
        { id: '5-tempnew-4strips-hero-right', name: '4 Magazine Strips Left + Hero Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.13, w: 0.084, h: 0.739 }, { x: 0.158, y: 0.13, w: 0.084, h: 0.739 }, { x: 0.258, y: 0.13, w: 0.084, h: 0.739 }, { x: 0.359, y: 0.13, w: 0.084, h: 0.739 },
          { x: 0.56, y: 0.08, w: 0.38, h: 0.84 }
        ]},
        { id: '5-tempnew-hero-left-4strips', name: 'Hero Left + 4 Magazine Strips Right (Single Pages Combined)', rects: [
          { x: 0.06, y: 0.08, w: 0.38, h: 0.84 }, { x: 0.557, y: 0.13, w: 0.084, h: 0.739 }, { x: 0.658, y: 0.13, w: 0.084, h: 0.739 }, { x: 0.758, y: 0.13, w: 0.084, h: 0.739 },
          { x: 0.859, y: 0.13, w: 0.084, h: 0.739 }
        ]}
      ],

      // 7 Photos (temp new single page designs & pairings)
      7: [
        { id: '7-tempnew-7panorama-left', name: '7 Panoramic Insets Left (Single Page)', rects: [
          { x: 0.057, y: 0.113, w: 0.122, h: 0.202 }, { x: 0.189, y: 0.113, w: 0.122, h: 0.202 }, { x: 0.321, y: 0.113, w: 0.122, h: 0.202 }, { x: 0.057, y: 0.35, w: 0.386, h: 0.299 },
          { x: 0.057, y: 0.685, w: 0.122, h: 0.202 }, { x: 0.189, y: 0.685, w: 0.122, h: 0.202 }, { x: 0.321, y: 0.685, w: 0.122, h: 0.202 }
        ]},
        { id: '7-tempnew-7panorama-right', name: '7 Panoramic Insets Right (Single Page)', rects: [
          { x: 0.557, y: 0.113, w: 0.122, h: 0.202 }, { x: 0.689, y: 0.113, w: 0.122, h: 0.202 }, { x: 0.821, y: 0.113, w: 0.122, h: 0.202 }, { x: 0.557, y: 0.35, w: 0.386, h: 0.299 },
          { x: 0.557, y: 0.685, w: 0.122, h: 0.202 }, { x: 0.689, y: 0.685, w: 0.122, h: 0.202 }, { x: 0.821, y: 0.685, w: 0.122, h: 0.202 }
        ]}
      ],

      // 8 Photos (temp new single page designs & pairings)
      8: [
        { id: '8-tempnew-8editorial-left', name: '8 Editorial Hero & Matrix Left (Single Page)', rects: [
          { x: 0.057, y: 0.113, w: 0.151, h: 0.774 }, { x: 0.225, y: 0.113, w: 0.103, h: 0.229 }, { x: 0.34, y: 0.113, w: 0.103, h: 0.229 }, { x: 0.225, y: 0.377, w: 0.067, h: 0.229 },
          { x: 0.3, y: 0.377, w: 0.067, h: 0.229 }, { x: 0.376, y: 0.377, w: 0.067, h: 0.229 }, { x: 0.225, y: 0.641, w: 0.103, h: 0.246 }, { x: 0.34, y: 0.641, w: 0.103, h: 0.246 }
        ]},
        { id: '8-tempnew-8editorial-right', name: '8 Editorial Hero & Matrix Right (Single Page)', rects: [
          { x: 0.557, y: 0.113, w: 0.151, h: 0.774 }, { x: 0.725, y: 0.113, w: 0.103, h: 0.229 }, { x: 0.84, y: 0.113, w: 0.103, h: 0.229 }, { x: 0.725, y: 0.377, w: 0.067, h: 0.229 },
          { x: 0.8, y: 0.377, w: 0.067, h: 0.229 }, { x: 0.876, y: 0.377, w: 0.067, h: 0.229 }, { x: 0.725, y: 0.641, w: 0.103, h: 0.246 }, { x: 0.84, y: 0.641, w: 0.103, h: 0.246 }
        ]},
        { id: '8-tempnew-8asymmetric-left', name: '8 Asymmetric Storyboard Left (Single Page)', rects: [
          { x: 0.057, y: 0.113, w: 0.181, h: 0.475 }, { x: 0.254, y: 0.113, w: 0.189, h: 0.22 }, { x: 0.254, y: 0.359, w: 0.088, h: 0.229 }, { x: 0.355, y: 0.359, w: 0.088, h: 0.229 },
          { x: 0.057, y: 0.623, w: 0.084, h: 0.264 }, { x: 0.158, y: 0.623, w: 0.084, h: 0.264 }, { x: 0.254, y: 0.623, w: 0.084, h: 0.264 }, { x: 0.355, y: 0.623, w: 0.088, h: 0.264 }
        ]},
        { id: '8-tempnew-8asymmetric-right', name: '8 Asymmetric Storyboard Right (Single Page)', rects: [
          { x: 0.557, y: 0.113, w: 0.181, h: 0.475 }, { x: 0.754, y: 0.113, w: 0.189, h: 0.22 }, { x: 0.754, y: 0.359, w: 0.088, h: 0.229 }, { x: 0.855, y: 0.359, w: 0.088, h: 0.229 },
          { x: 0.557, y: 0.623, w: 0.084, h: 0.264 }, { x: 0.658, y: 0.623, w: 0.084, h: 0.264 }, { x: 0.754, y: 0.623, w: 0.084, h: 0.264 }, { x: 0.855, y: 0.623, w: 0.088, h: 0.264 }
        ]},
        { id: '8-tempnew-7panorama-hero-right', name: '7 Panoramic Insets Left + Hero Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.113, w: 0.122, h: 0.202 }, { x: 0.189, y: 0.113, w: 0.122, h: 0.202 }, { x: 0.321, y: 0.113, w: 0.122, h: 0.202 }, { x: 0.057, y: 0.35, w: 0.386, h: 0.299 },
          { x: 0.057, y: 0.685, w: 0.122, h: 0.202 }, { x: 0.189, y: 0.685, w: 0.122, h: 0.202 }, { x: 0.321, y: 0.685, w: 0.122, h: 0.202 }, { x: 0.56, y: 0.08, w: 0.38, h: 0.84 }
        ]},
        { id: '8-tempnew-hero-left-7panorama', name: 'Hero Left + 7 Panoramic Insets Right (Single Pages Combined)', rects: [
          { x: 0.06, y: 0.08, w: 0.38, h: 0.84 }, { x: 0.557, y: 0.113, w: 0.122, h: 0.202 }, { x: 0.689, y: 0.113, w: 0.122, h: 0.202 }, { x: 0.821, y: 0.113, w: 0.122, h: 0.202 },
          { x: 0.557, y: 0.35, w: 0.386, h: 0.299 }, { x: 0.557, y: 0.685, w: 0.122, h: 0.202 }, { x: 0.689, y: 0.685, w: 0.122, h: 0.202 }, { x: 0.821, y: 0.685, w: 0.122, h: 0.202 }
        ]},
        { id: '8-tempnew-4strips-4strips', name: '4 Magazine Strips Left + 4 Magazine Strips Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.13, w: 0.084, h: 0.739 }, { x: 0.158, y: 0.13, w: 0.084, h: 0.739 }, { x: 0.258, y: 0.13, w: 0.084, h: 0.739 }, { x: 0.359, y: 0.13, w: 0.084, h: 0.739 },
          { x: 0.557, y: 0.13, w: 0.084, h: 0.739 }, { x: 0.658, y: 0.13, w: 0.084, h: 0.739 }, { x: 0.758, y: 0.13, w: 0.084, h: 0.739 }, { x: 0.859, y: 0.13, w: 0.084, h: 0.739 }
        ]}
      ],

      // 9 Photos (temp new single page designs & pairings)
      9: [
        { id: '9-tempnew-8editorial-hero-right', name: '8 Editorial Hero & Matrix Left + Hero Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.113, w: 0.151, h: 0.774 }, { x: 0.225, y: 0.113, w: 0.103, h: 0.229 }, { x: 0.34, y: 0.113, w: 0.103, h: 0.229 }, { x: 0.225, y: 0.377, w: 0.067, h: 0.229 },
          { x: 0.3, y: 0.377, w: 0.067, h: 0.229 }, { x: 0.376, y: 0.377, w: 0.067, h: 0.229 }, { x: 0.225, y: 0.641, w: 0.103, h: 0.246 }, { x: 0.34, y: 0.641, w: 0.103, h: 0.246 },
          { x: 0.56, y: 0.08, w: 0.38, h: 0.84 }
        ]},
        { id: '9-tempnew-hero-left-8editorial', name: 'Hero Left + 8 Editorial Hero & Matrix Right (Single Pages Combined)', rects: [
          { x: 0.06, y: 0.08, w: 0.38, h: 0.84 }, { x: 0.557, y: 0.113, w: 0.151, h: 0.774 }, { x: 0.725, y: 0.113, w: 0.103, h: 0.229 }, { x: 0.84, y: 0.113, w: 0.103, h: 0.229 },
          { x: 0.725, y: 0.377, w: 0.067, h: 0.229 }, { x: 0.8, y: 0.377, w: 0.067, h: 0.229 }, { x: 0.876, y: 0.377, w: 0.067, h: 0.229 }, { x: 0.725, y: 0.641, w: 0.103, h: 0.246 },
          { x: 0.84, y: 0.641, w: 0.103, h: 0.246 }
        ]},
        { id: '9-tempnew-8asymmetric-hero-right', name: '8 Asymmetric Storyboard Left + Hero Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.113, w: 0.181, h: 0.475 }, { x: 0.254, y: 0.113, w: 0.189, h: 0.22 }, { x: 0.254, y: 0.359, w: 0.088, h: 0.229 }, { x: 0.355, y: 0.359, w: 0.088, h: 0.229 },
          { x: 0.057, y: 0.623, w: 0.084, h: 0.264 }, { x: 0.158, y: 0.623, w: 0.084, h: 0.264 }, { x: 0.254, y: 0.623, w: 0.084, h: 0.264 }, { x: 0.355, y: 0.623, w: 0.088, h: 0.264 },
          { x: 0.56, y: 0.08, w: 0.38, h: 0.84 }
        ]},
        { id: '9-tempnew-hero-left-8asymmetric', name: 'Hero Left + 8 Asymmetric Storyboard Right (Single Pages Combined)', rects: [
          { x: 0.06, y: 0.08, w: 0.38, h: 0.84 }, { x: 0.557, y: 0.113, w: 0.181, h: 0.475 }, { x: 0.754, y: 0.113, w: 0.189, h: 0.22 }, { x: 0.754, y: 0.359, w: 0.088, h: 0.229 },
          { x: 0.855, y: 0.359, w: 0.088, h: 0.229 }, { x: 0.557, y: 0.623, w: 0.084, h: 0.264 }, { x: 0.658, y: 0.623, w: 0.084, h: 0.264 }, { x: 0.754, y: 0.623, w: 0.084, h: 0.264 },
          { x: 0.855, y: 0.623, w: 0.088, h: 0.264 }
        ]}
      ],

      // 10 Photos (temp new single page designs & pairings)
      10: [
        { id: '10-tempnew-10flanked-left', name: '10 Flanked Gallery Left (Single Page)', rects: [
          { x: 0.057, y: 0.113, w: 0.076, h: 0.774 }, { x: 0.368, y: 0.113, w: 0.076, h: 0.774 }, { x: 0.145, y: 0.113, w: 0.063, h: 0.22 }, { x: 0.216, y: 0.113, w: 0.063, h: 0.22 },
          { x: 0.288, y: 0.113, w: 0.063, h: 0.22 }, { x: 0.145, y: 0.368, w: 0.101, h: 0.246 }, { x: 0.254, y: 0.368, w: 0.097, h: 0.246 }, { x: 0.145, y: 0.65, w: 0.063, h: 0.238 },
          { x: 0.216, y: 0.65, w: 0.063, h: 0.238 }, { x: 0.288, y: 0.65, w: 0.063, h: 0.238 }
        ]},
        { id: '10-tempnew-10flanked-right', name: '10 Flanked Gallery Right (Single Page)', rects: [
          { x: 0.557, y: 0.113, w: 0.076, h: 0.774 }, { x: 0.868, y: 0.113, w: 0.076, h: 0.774 }, { x: 0.645, y: 0.113, w: 0.063, h: 0.22 }, { x: 0.716, y: 0.113, w: 0.063, h: 0.22 },
          { x: 0.788, y: 0.113, w: 0.063, h: 0.22 }, { x: 0.645, y: 0.368, w: 0.101, h: 0.246 }, { x: 0.754, y: 0.368, w: 0.097, h: 0.246 }, { x: 0.645, y: 0.65, w: 0.063, h: 0.238 },
          { x: 0.716, y: 0.65, w: 0.063, h: 0.238 }, { x: 0.788, y: 0.65, w: 0.063, h: 0.238 }
        ]}
      ],

      // 11 Photos (temp new single page designs & pairings)
      11: [
        { id: '11-tempnew-11mosaic-left', name: '11 Mosaic Matrix with Strip Left (Single Page)', rects: [
          { x: 0.057, y: 0.104, w: 0.122, h: 0.238 }, { x: 0.191, y: 0.104, w: 0.122, h: 0.238 }, { x: 0.321, y: 0.104, w: 0.122, h: 0.238 }, { x: 0.057, y: 0.377, w: 0.189, h: 0.299 },
          { x: 0.258, y: 0.377, w: 0.185, h: 0.136 }, { x: 0.258, y: 0.54, w: 0.185, h: 0.136 }, { x: 0.057, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.137, y: 0.711, w: 0.067, h: 0.185 },
          { x: 0.216, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.296, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.376, y: 0.711, w: 0.067, h: 0.185 }
        ]},
        { id: '11-tempnew-11mosaic-right', name: '11 Mosaic Matrix with Strip Right (Single Page)', rects: [
          { x: 0.557, y: 0.104, w: 0.122, h: 0.238 }, { x: 0.691, y: 0.104, w: 0.122, h: 0.238 }, { x: 0.821, y: 0.104, w: 0.122, h: 0.238 }, { x: 0.557, y: 0.377, w: 0.189, h: 0.299 },
          { x: 0.758, y: 0.377, w: 0.185, h: 0.136 }, { x: 0.758, y: 0.54, w: 0.185, h: 0.136 }, { x: 0.557, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.637, y: 0.711, w: 0.067, h: 0.185 },
          { x: 0.716, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.796, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.876, y: 0.711, w: 0.067, h: 0.185 }
        ]},
        { id: '11-tempnew-10flanked-hero-right', name: '10 Flanked Gallery Left + Hero Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.113, w: 0.076, h: 0.774 }, { x: 0.368, y: 0.113, w: 0.076, h: 0.774 }, { x: 0.145, y: 0.113, w: 0.063, h: 0.22 }, { x: 0.216, y: 0.113, w: 0.063, h: 0.22 },
          { x: 0.288, y: 0.113, w: 0.063, h: 0.22 }, { x: 0.145, y: 0.368, w: 0.101, h: 0.246 }, { x: 0.254, y: 0.368, w: 0.097, h: 0.246 }, { x: 0.145, y: 0.65, w: 0.063, h: 0.238 },
          { x: 0.216, y: 0.65, w: 0.063, h: 0.238 }, { x: 0.288, y: 0.65, w: 0.063, h: 0.238 }, { x: 0.56, y: 0.08, w: 0.38, h: 0.84 }
        ]},
        { id: '11-tempnew-hero-left-10flanked', name: 'Hero Left + 10 Flanked Gallery Right (Single Pages Combined)', rects: [
          { x: 0.06, y: 0.08, w: 0.38, h: 0.84 }, { x: 0.557, y: 0.113, w: 0.076, h: 0.774 }, { x: 0.868, y: 0.113, w: 0.076, h: 0.774 }, { x: 0.645, y: 0.113, w: 0.063, h: 0.22 },
          { x: 0.716, y: 0.113, w: 0.063, h: 0.22 }, { x: 0.788, y: 0.113, w: 0.063, h: 0.22 }, { x: 0.645, y: 0.368, w: 0.101, h: 0.246 }, { x: 0.754, y: 0.368, w: 0.097, h: 0.246 },
          { x: 0.645, y: 0.65, w: 0.063, h: 0.238 }, { x: 0.716, y: 0.65, w: 0.063, h: 0.238 }, { x: 0.788, y: 0.65, w: 0.063, h: 0.238 }
        ]},
        { id: '11-tempnew-4strips-7panorama', name: '4 Magazine Strips Left + 7 Panoramic Insets Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.13, w: 0.084, h: 0.739 }, { x: 0.158, y: 0.13, w: 0.084, h: 0.739 }, { x: 0.258, y: 0.13, w: 0.084, h: 0.739 }, { x: 0.359, y: 0.13, w: 0.084, h: 0.739 },
          { x: 0.557, y: 0.113, w: 0.122, h: 0.202 }, { x: 0.689, y: 0.113, w: 0.122, h: 0.202 }, { x: 0.821, y: 0.113, w: 0.122, h: 0.202 }, { x: 0.557, y: 0.35, w: 0.386, h: 0.299 },
          { x: 0.557, y: 0.685, w: 0.122, h: 0.202 }, { x: 0.689, y: 0.685, w: 0.122, h: 0.202 }, { x: 0.821, y: 0.685, w: 0.122, h: 0.202 }
        ]},
        { id: '11-tempnew-7panorama-4strips', name: '7 Panoramic Insets Left + 4 Magazine Strips Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.113, w: 0.122, h: 0.202 }, { x: 0.189, y: 0.113, w: 0.122, h: 0.202 }, { x: 0.321, y: 0.113, w: 0.122, h: 0.202 }, { x: 0.057, y: 0.35, w: 0.386, h: 0.299 },
          { x: 0.057, y: 0.685, w: 0.122, h: 0.202 }, { x: 0.189, y: 0.685, w: 0.122, h: 0.202 }, { x: 0.321, y: 0.685, w: 0.122, h: 0.202 }, { x: 0.557, y: 0.13, w: 0.084, h: 0.739 },
          { x: 0.658, y: 0.13, w: 0.084, h: 0.739 }, { x: 0.758, y: 0.13, w: 0.084, h: 0.739 }, { x: 0.859, y: 0.13, w: 0.084, h: 0.739 }
        ]}
      ],

      // 12 Photos (temp new single page designs & pairings)
      12: [
        { id: '12-tempnew-12anchor-left', name: '12 Dual Anchor Mosaic Wall Left (Single Page)', rects: [
          { x: 0.057, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.158, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.258, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.359, y: 0.104, w: 0.084, h: 0.158 },
          { x: 0.057, y: 0.298, w: 0.143, h: 0.387 }, { x: 0.212, y: 0.298, w: 0.05, h: 0.387 }, { x: 0.275, y: 0.298, w: 0.05, h: 0.387 }, { x: 0.338, y: 0.298, w: 0.105, h: 0.387 },
          { x: 0.057, y: 0.72, w: 0.084, h: 0.176 }, { x: 0.158, y: 0.72, w: 0.084, h: 0.176 }, { x: 0.258, y: 0.72, w: 0.084, h: 0.176 }, { x: 0.359, y: 0.72, w: 0.084, h: 0.176 }
        ]},
        { id: '12-tempnew-12anchor-right', name: '12 Dual Anchor Mosaic Wall Right (Single Page)', rects: [
          { x: 0.557, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.658, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.758, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.859, y: 0.104, w: 0.084, h: 0.158 },
          { x: 0.557, y: 0.298, w: 0.143, h: 0.387 }, { x: 0.712, y: 0.298, w: 0.05, h: 0.387 }, { x: 0.775, y: 0.298, w: 0.05, h: 0.387 }, { x: 0.838, y: 0.298, w: 0.105, h: 0.387 },
          { x: 0.557, y: 0.72, w: 0.084, h: 0.176 }, { x: 0.658, y: 0.72, w: 0.084, h: 0.176 }, { x: 0.758, y: 0.72, w: 0.084, h: 0.176 }, { x: 0.859, y: 0.72, w: 0.084, h: 0.176 }
        ]},
        { id: '12-tempnew-11mosaic-hero-right', name: '11 Mosaic Matrix with Strip Left + Hero Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.104, w: 0.122, h: 0.238 }, { x: 0.191, y: 0.104, w: 0.122, h: 0.238 }, { x: 0.321, y: 0.104, w: 0.122, h: 0.238 }, { x: 0.057, y: 0.377, w: 0.189, h: 0.299 },
          { x: 0.258, y: 0.377, w: 0.185, h: 0.136 }, { x: 0.258, y: 0.54, w: 0.185, h: 0.136 }, { x: 0.057, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.137, y: 0.711, w: 0.067, h: 0.185 },
          { x: 0.216, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.296, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.376, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.56, y: 0.08, w: 0.38, h: 0.84 }
        ]},
        { id: '12-tempnew-hero-left-11mosaic', name: 'Hero Left + 11 Mosaic Matrix with Strip Right (Single Pages Combined)', rects: [
          { x: 0.06, y: 0.08, w: 0.38, h: 0.84 }, { x: 0.557, y: 0.104, w: 0.122, h: 0.238 }, { x: 0.691, y: 0.104, w: 0.122, h: 0.238 }, { x: 0.821, y: 0.104, w: 0.122, h: 0.238 },
          { x: 0.557, y: 0.377, w: 0.189, h: 0.299 }, { x: 0.758, y: 0.377, w: 0.185, h: 0.136 }, { x: 0.758, y: 0.54, w: 0.185, h: 0.136 }, { x: 0.557, y: 0.711, w: 0.067, h: 0.185 },
          { x: 0.637, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.716, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.796, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.876, y: 0.711, w: 0.067, h: 0.185 }
        ]},
        { id: '12-tempnew-4strips-8editorial', name: '4 Magazine Strips Left + 8 Editorial Hero & Matrix Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.13, w: 0.084, h: 0.739 }, { x: 0.158, y: 0.13, w: 0.084, h: 0.739 }, { x: 0.258, y: 0.13, w: 0.084, h: 0.739 }, { x: 0.359, y: 0.13, w: 0.084, h: 0.739 },
          { x: 0.557, y: 0.113, w: 0.151, h: 0.774 }, { x: 0.725, y: 0.113, w: 0.103, h: 0.229 }, { x: 0.84, y: 0.113, w: 0.103, h: 0.229 }, { x: 0.725, y: 0.377, w: 0.067, h: 0.229 },
          { x: 0.8, y: 0.377, w: 0.067, h: 0.229 }, { x: 0.876, y: 0.377, w: 0.067, h: 0.229 }, { x: 0.725, y: 0.641, w: 0.103, h: 0.246 }, { x: 0.84, y: 0.641, w: 0.103, h: 0.246 }
        ]},
        { id: '12-tempnew-8editorial-4strips', name: '8 Editorial Hero & Matrix Left + 4 Magazine Strips Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.113, w: 0.151, h: 0.774 }, { x: 0.225, y: 0.113, w: 0.103, h: 0.229 }, { x: 0.34, y: 0.113, w: 0.103, h: 0.229 }, { x: 0.225, y: 0.377, w: 0.067, h: 0.229 },
          { x: 0.3, y: 0.377, w: 0.067, h: 0.229 }, { x: 0.376, y: 0.377, w: 0.067, h: 0.229 }, { x: 0.225, y: 0.641, w: 0.103, h: 0.246 }, { x: 0.34, y: 0.641, w: 0.103, h: 0.246 },
          { x: 0.557, y: 0.13, w: 0.084, h: 0.739 }, { x: 0.658, y: 0.13, w: 0.084, h: 0.739 }, { x: 0.758, y: 0.13, w: 0.084, h: 0.739 }, { x: 0.859, y: 0.13, w: 0.084, h: 0.739 }
        ]},
        { id: '12-tempnew-4strips-8asymmetric', name: '4 Magazine Strips Left + 8 Asymmetric Storyboard Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.13, w: 0.084, h: 0.739 }, { x: 0.158, y: 0.13, w: 0.084, h: 0.739 }, { x: 0.258, y: 0.13, w: 0.084, h: 0.739 }, { x: 0.359, y: 0.13, w: 0.084, h: 0.739 },
          { x: 0.557, y: 0.113, w: 0.181, h: 0.475 }, { x: 0.754, y: 0.113, w: 0.189, h: 0.22 }, { x: 0.754, y: 0.359, w: 0.088, h: 0.229 }, { x: 0.855, y: 0.359, w: 0.088, h: 0.229 },
          { x: 0.557, y: 0.623, w: 0.084, h: 0.264 }, { x: 0.658, y: 0.623, w: 0.084, h: 0.264 }, { x: 0.754, y: 0.623, w: 0.084, h: 0.264 }, { x: 0.855, y: 0.623, w: 0.088, h: 0.264 }
        ]},
        { id: '12-tempnew-8asymmetric-4strips', name: '8 Asymmetric Storyboard Left + 4 Magazine Strips Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.113, w: 0.181, h: 0.475 }, { x: 0.254, y: 0.113, w: 0.189, h: 0.22 }, { x: 0.254, y: 0.359, w: 0.088, h: 0.229 }, { x: 0.355, y: 0.359, w: 0.088, h: 0.229 },
          { x: 0.057, y: 0.623, w: 0.084, h: 0.264 }, { x: 0.158, y: 0.623, w: 0.084, h: 0.264 }, { x: 0.254, y: 0.623, w: 0.084, h: 0.264 }, { x: 0.355, y: 0.623, w: 0.088, h: 0.264 },
          { x: 0.557, y: 0.13, w: 0.084, h: 0.739 }, { x: 0.658, y: 0.13, w: 0.084, h: 0.739 }, { x: 0.758, y: 0.13, w: 0.084, h: 0.739 }, { x: 0.859, y: 0.13, w: 0.084, h: 0.739 }
        ]}
      ],

      // 13 Photos (temp new single page designs & pairings)
      13: [
        { id: '13-tempnew-13hero-left', name: '13 Master Storyboard Collage Left (Single Page)', rects: [
          { x: 0.132, y: 0.289, w: 0.235, h: 0.422 }, { x: 0.057, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.158, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.258, y: 0.104, w: 0.084, h: 0.15 },
          { x: 0.359, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.057, y: 0.289, w: 0.063, h: 0.194 }, { x: 0.057, y: 0.518, w: 0.063, h: 0.194 }, { x: 0.38, y: 0.289, w: 0.063, h: 0.194 },
          { x: 0.38, y: 0.518, w: 0.063, h: 0.194 }, { x: 0.057, y: 0.746, w: 0.084, h: 0.15 }, { x: 0.158, y: 0.746, w: 0.084, h: 0.15 }, { x: 0.258, y: 0.746, w: 0.084, h: 0.15 },
          { x: 0.359, y: 0.746, w: 0.084, h: 0.15 }
        ]},
        { id: '13-tempnew-13hero-right', name: '13 Master Storyboard Collage Right (Single Page)', rects: [
          { x: 0.632, y: 0.289, w: 0.235, h: 0.422 }, { x: 0.557, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.658, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.758, y: 0.104, w: 0.084, h: 0.15 },
          { x: 0.859, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.557, y: 0.289, w: 0.063, h: 0.194 }, { x: 0.557, y: 0.518, w: 0.063, h: 0.194 }, { x: 0.88, y: 0.289, w: 0.063, h: 0.194 },
          { x: 0.88, y: 0.518, w: 0.063, h: 0.194 }, { x: 0.557, y: 0.746, w: 0.084, h: 0.15 }, { x: 0.658, y: 0.746, w: 0.084, h: 0.15 }, { x: 0.758, y: 0.746, w: 0.084, h: 0.15 },
          { x: 0.859, y: 0.746, w: 0.084, h: 0.15 }
        ]},
        { id: '13-tempnew-12anchor-hero-right', name: '12 Dual Anchor Mosaic Wall Left + Hero Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.158, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.258, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.359, y: 0.104, w: 0.084, h: 0.158 },
          { x: 0.057, y: 0.298, w: 0.143, h: 0.387 }, { x: 0.212, y: 0.298, w: 0.05, h: 0.387 }, { x: 0.275, y: 0.298, w: 0.05, h: 0.387 }, { x: 0.338, y: 0.298, w: 0.105, h: 0.387 },
          { x: 0.057, y: 0.72, w: 0.084, h: 0.176 }, { x: 0.158, y: 0.72, w: 0.084, h: 0.176 }, { x: 0.258, y: 0.72, w: 0.084, h: 0.176 }, { x: 0.359, y: 0.72, w: 0.084, h: 0.176 },
          { x: 0.56, y: 0.08, w: 0.38, h: 0.84 }
        ]},
        { id: '13-tempnew-hero-left-12anchor', name: 'Hero Left + 12 Dual Anchor Mosaic Wall Right (Single Pages Combined)', rects: [
          { x: 0.06, y: 0.08, w: 0.38, h: 0.84 }, { x: 0.557, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.658, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.758, y: 0.104, w: 0.084, h: 0.158 },
          { x: 0.859, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.557, y: 0.298, w: 0.143, h: 0.387 }, { x: 0.712, y: 0.298, w: 0.05, h: 0.387 }, { x: 0.775, y: 0.298, w: 0.05, h: 0.387 },
          { x: 0.838, y: 0.298, w: 0.105, h: 0.387 }, { x: 0.557, y: 0.72, w: 0.084, h: 0.176 }, { x: 0.658, y: 0.72, w: 0.084, h: 0.176 }, { x: 0.758, y: 0.72, w: 0.084, h: 0.176 },
          { x: 0.859, y: 0.72, w: 0.084, h: 0.176 }
        ]}
      ],

      // 14 Photos (temp new single page designs & pairings)
      14: [
        { id: '14-tempnew-13hero-hero-right', name: '13 Master Storyboard Collage Left + Hero Right (Single Pages Combined)', rects: [
          { x: 0.132, y: 0.289, w: 0.235, h: 0.422 }, { x: 0.057, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.158, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.258, y: 0.104, w: 0.084, h: 0.15 },
          { x: 0.359, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.057, y: 0.289, w: 0.063, h: 0.194 }, { x: 0.057, y: 0.518, w: 0.063, h: 0.194 }, { x: 0.38, y: 0.289, w: 0.063, h: 0.194 },
          { x: 0.38, y: 0.518, w: 0.063, h: 0.194 }, { x: 0.057, y: 0.746, w: 0.084, h: 0.15 }, { x: 0.158, y: 0.746, w: 0.084, h: 0.15 }, { x: 0.258, y: 0.746, w: 0.084, h: 0.15 },
          { x: 0.359, y: 0.746, w: 0.084, h: 0.15 }, { x: 0.56, y: 0.08, w: 0.38, h: 0.84 }
        ]},
        { id: '14-tempnew-hero-left-13hero', name: 'Hero Left + 13 Master Storyboard Collage Right (Single Pages Combined)', rects: [
          { x: 0.06, y: 0.08, w: 0.38, h: 0.84 }, { x: 0.632, y: 0.289, w: 0.235, h: 0.422 }, { x: 0.557, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.658, y: 0.104, w: 0.084, h: 0.15 },
          { x: 0.758, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.859, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.557, y: 0.289, w: 0.063, h: 0.194 }, { x: 0.557, y: 0.518, w: 0.063, h: 0.194 },
          { x: 0.88, y: 0.289, w: 0.063, h: 0.194 }, { x: 0.88, y: 0.518, w: 0.063, h: 0.194 }, { x: 0.557, y: 0.746, w: 0.084, h: 0.15 }, { x: 0.658, y: 0.746, w: 0.084, h: 0.15 },
          { x: 0.758, y: 0.746, w: 0.084, h: 0.15 }, { x: 0.859, y: 0.746, w: 0.084, h: 0.15 }
        ]},
        { id: '14-tempnew-4strips-10flanked', name: '4 Magazine Strips Left + 10 Flanked Gallery Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.13, w: 0.084, h: 0.739 }, { x: 0.158, y: 0.13, w: 0.084, h: 0.739 }, { x: 0.258, y: 0.13, w: 0.084, h: 0.739 }, { x: 0.359, y: 0.13, w: 0.084, h: 0.739 },
          { x: 0.557, y: 0.113, w: 0.076, h: 0.774 }, { x: 0.868, y: 0.113, w: 0.076, h: 0.774 }, { x: 0.645, y: 0.113, w: 0.063, h: 0.22 }, { x: 0.716, y: 0.113, w: 0.063, h: 0.22 },
          { x: 0.788, y: 0.113, w: 0.063, h: 0.22 }, { x: 0.645, y: 0.368, w: 0.101, h: 0.246 }, { x: 0.754, y: 0.368, w: 0.097, h: 0.246 }, { x: 0.645, y: 0.65, w: 0.063, h: 0.238 },
          { x: 0.716, y: 0.65, w: 0.063, h: 0.238 }, { x: 0.788, y: 0.65, w: 0.063, h: 0.238 }
        ]},
        { id: '14-tempnew-10flanked-4strips', name: '10 Flanked Gallery Left + 4 Magazine Strips Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.113, w: 0.076, h: 0.774 }, { x: 0.368, y: 0.113, w: 0.076, h: 0.774 }, { x: 0.145, y: 0.113, w: 0.063, h: 0.22 }, { x: 0.216, y: 0.113, w: 0.063, h: 0.22 },
          { x: 0.288, y: 0.113, w: 0.063, h: 0.22 }, { x: 0.145, y: 0.368, w: 0.101, h: 0.246 }, { x: 0.254, y: 0.368, w: 0.097, h: 0.246 }, { x: 0.145, y: 0.65, w: 0.063, h: 0.238 },
          { x: 0.216, y: 0.65, w: 0.063, h: 0.238 }, { x: 0.288, y: 0.65, w: 0.063, h: 0.238 }, { x: 0.557, y: 0.13, w: 0.084, h: 0.739 }, { x: 0.658, y: 0.13, w: 0.084, h: 0.739 },
          { x: 0.758, y: 0.13, w: 0.084, h: 0.739 }, { x: 0.859, y: 0.13, w: 0.084, h: 0.739 }
        ]},
        { id: '14-tempnew-7panorama-7panorama', name: '7 Panoramic Insets Left + 7 Panoramic Insets Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.113, w: 0.122, h: 0.202 }, { x: 0.189, y: 0.113, w: 0.122, h: 0.202 }, { x: 0.321, y: 0.113, w: 0.122, h: 0.202 }, { x: 0.057, y: 0.35, w: 0.386, h: 0.299 },
          { x: 0.057, y: 0.685, w: 0.122, h: 0.202 }, { x: 0.189, y: 0.685, w: 0.122, h: 0.202 }, { x: 0.321, y: 0.685, w: 0.122, h: 0.202 }, { x: 0.557, y: 0.113, w: 0.122, h: 0.202 },
          { x: 0.689, y: 0.113, w: 0.122, h: 0.202 }, { x: 0.821, y: 0.113, w: 0.122, h: 0.202 }, { x: 0.557, y: 0.35, w: 0.386, h: 0.299 }, { x: 0.557, y: 0.685, w: 0.122, h: 0.202 },
          { x: 0.689, y: 0.685, w: 0.122, h: 0.202 }, { x: 0.821, y: 0.685, w: 0.122, h: 0.202 }
        ]}
      ],

      // 15 Photos (temp new single page designs & pairings)
      15: [
        { id: '15-tempnew-4strips-11mosaic', name: '4 Magazine Strips Left + 11 Mosaic Matrix with Strip Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.13, w: 0.084, h: 0.739 }, { x: 0.158, y: 0.13, w: 0.084, h: 0.739 }, { x: 0.258, y: 0.13, w: 0.084, h: 0.739 }, { x: 0.359, y: 0.13, w: 0.084, h: 0.739 },
          { x: 0.557, y: 0.104, w: 0.122, h: 0.238 }, { x: 0.691, y: 0.104, w: 0.122, h: 0.238 }, { x: 0.821, y: 0.104, w: 0.122, h: 0.238 }, { x: 0.557, y: 0.377, w: 0.189, h: 0.299 },
          { x: 0.758, y: 0.377, w: 0.185, h: 0.136 }, { x: 0.758, y: 0.54, w: 0.185, h: 0.136 }, { x: 0.557, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.637, y: 0.711, w: 0.067, h: 0.185 },
          { x: 0.716, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.796, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.876, y: 0.711, w: 0.067, h: 0.185 }
        ]},
        { id: '15-tempnew-11mosaic-4strips', name: '11 Mosaic Matrix with Strip Left + 4 Magazine Strips Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.104, w: 0.122, h: 0.238 }, { x: 0.191, y: 0.104, w: 0.122, h: 0.238 }, { x: 0.321, y: 0.104, w: 0.122, h: 0.238 }, { x: 0.057, y: 0.377, w: 0.189, h: 0.299 },
          { x: 0.258, y: 0.377, w: 0.185, h: 0.136 }, { x: 0.258, y: 0.54, w: 0.185, h: 0.136 }, { x: 0.057, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.137, y: 0.711, w: 0.067, h: 0.185 },
          { x: 0.216, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.296, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.376, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.557, y: 0.13, w: 0.084, h: 0.739 },
          { x: 0.658, y: 0.13, w: 0.084, h: 0.739 }, { x: 0.758, y: 0.13, w: 0.084, h: 0.739 }, { x: 0.859, y: 0.13, w: 0.084, h: 0.739 }
        ]},
        { id: '15-tempnew-7panorama-8editorial', name: '7 Panoramic Insets Left + 8 Editorial Hero & Matrix Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.113, w: 0.122, h: 0.202 }, { x: 0.189, y: 0.113, w: 0.122, h: 0.202 }, { x: 0.321, y: 0.113, w: 0.122, h: 0.202 }, { x: 0.057, y: 0.35, w: 0.386, h: 0.299 },
          { x: 0.057, y: 0.685, w: 0.122, h: 0.202 }, { x: 0.189, y: 0.685, w: 0.122, h: 0.202 }, { x: 0.321, y: 0.685, w: 0.122, h: 0.202 }, { x: 0.557, y: 0.113, w: 0.151, h: 0.774 },
          { x: 0.725, y: 0.113, w: 0.103, h: 0.229 }, { x: 0.84, y: 0.113, w: 0.103, h: 0.229 }, { x: 0.725, y: 0.377, w: 0.067, h: 0.229 }, { x: 0.8, y: 0.377, w: 0.067, h: 0.229 },
          { x: 0.876, y: 0.377, w: 0.067, h: 0.229 }, { x: 0.725, y: 0.641, w: 0.103, h: 0.246 }, { x: 0.84, y: 0.641, w: 0.103, h: 0.246 }
        ]},
        { id: '15-tempnew-8editorial-7panorama', name: '8 Editorial Hero & Matrix Left + 7 Panoramic Insets Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.113, w: 0.151, h: 0.774 }, { x: 0.225, y: 0.113, w: 0.103, h: 0.229 }, { x: 0.34, y: 0.113, w: 0.103, h: 0.229 }, { x: 0.225, y: 0.377, w: 0.067, h: 0.229 },
          { x: 0.3, y: 0.377, w: 0.067, h: 0.229 }, { x: 0.376, y: 0.377, w: 0.067, h: 0.229 }, { x: 0.225, y: 0.641, w: 0.103, h: 0.246 }, { x: 0.34, y: 0.641, w: 0.103, h: 0.246 },
          { x: 0.557, y: 0.113, w: 0.122, h: 0.202 }, { x: 0.689, y: 0.113, w: 0.122, h: 0.202 }, { x: 0.821, y: 0.113, w: 0.122, h: 0.202 }, { x: 0.557, y: 0.35, w: 0.386, h: 0.299 },
          { x: 0.557, y: 0.685, w: 0.122, h: 0.202 }, { x: 0.689, y: 0.685, w: 0.122, h: 0.202 }, { x: 0.821, y: 0.685, w: 0.122, h: 0.202 }
        ]},
        { id: '15-tempnew-7panorama-8asymmetric', name: '7 Panoramic Insets Left + 8 Asymmetric Storyboard Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.113, w: 0.122, h: 0.202 }, { x: 0.189, y: 0.113, w: 0.122, h: 0.202 }, { x: 0.321, y: 0.113, w: 0.122, h: 0.202 }, { x: 0.057, y: 0.35, w: 0.386, h: 0.299 },
          { x: 0.057, y: 0.685, w: 0.122, h: 0.202 }, { x: 0.189, y: 0.685, w: 0.122, h: 0.202 }, { x: 0.321, y: 0.685, w: 0.122, h: 0.202 }, { x: 0.557, y: 0.113, w: 0.181, h: 0.475 },
          { x: 0.754, y: 0.113, w: 0.189, h: 0.22 }, { x: 0.754, y: 0.359, w: 0.088, h: 0.229 }, { x: 0.855, y: 0.359, w: 0.088, h: 0.229 }, { x: 0.557, y: 0.623, w: 0.084, h: 0.264 },
          { x: 0.658, y: 0.623, w: 0.084, h: 0.264 }, { x: 0.754, y: 0.623, w: 0.084, h: 0.264 }, { x: 0.855, y: 0.623, w: 0.088, h: 0.264 }
        ]},
        { id: '15-tempnew-8asymmetric-7panorama', name: '8 Asymmetric Storyboard Left + 7 Panoramic Insets Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.113, w: 0.181, h: 0.475 }, { x: 0.254, y: 0.113, w: 0.189, h: 0.22 }, { x: 0.254, y: 0.359, w: 0.088, h: 0.229 }, { x: 0.355, y: 0.359, w: 0.088, h: 0.229 },
          { x: 0.057, y: 0.623, w: 0.084, h: 0.264 }, { x: 0.158, y: 0.623, w: 0.084, h: 0.264 }, { x: 0.254, y: 0.623, w: 0.084, h: 0.264 }, { x: 0.355, y: 0.623, w: 0.088, h: 0.264 },
          { x: 0.557, y: 0.113, w: 0.122, h: 0.202 }, { x: 0.689, y: 0.113, w: 0.122, h: 0.202 }, { x: 0.821, y: 0.113, w: 0.122, h: 0.202 }, { x: 0.557, y: 0.35, w: 0.386, h: 0.299 },
          { x: 0.557, y: 0.685, w: 0.122, h: 0.202 }, { x: 0.689, y: 0.685, w: 0.122, h: 0.202 }, { x: 0.821, y: 0.685, w: 0.122, h: 0.202 }
        ]}
      ],

      // 16 Photos (temp new single page designs & pairings)
      16: [
        { id: '16-tempnew-4strips-12anchor', name: '4 Magazine Strips Left + 12 Dual Anchor Mosaic Wall Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.13, w: 0.084, h: 0.739 }, { x: 0.158, y: 0.13, w: 0.084, h: 0.739 }, { x: 0.258, y: 0.13, w: 0.084, h: 0.739 }, { x: 0.359, y: 0.13, w: 0.084, h: 0.739 },
          { x: 0.557, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.658, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.758, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.859, y: 0.104, w: 0.084, h: 0.158 },
          { x: 0.557, y: 0.298, w: 0.143, h: 0.387 }, { x: 0.712, y: 0.298, w: 0.05, h: 0.387 }, { x: 0.775, y: 0.298, w: 0.05, h: 0.387 }, { x: 0.838, y: 0.298, w: 0.105, h: 0.387 },
          { x: 0.557, y: 0.72, w: 0.084, h: 0.176 }, { x: 0.658, y: 0.72, w: 0.084, h: 0.176 }, { x: 0.758, y: 0.72, w: 0.084, h: 0.176 }, { x: 0.859, y: 0.72, w: 0.084, h: 0.176 }
        ]},
        { id: '16-tempnew-12anchor-4strips', name: '12 Dual Anchor Mosaic Wall Left + 4 Magazine Strips Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.158, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.258, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.359, y: 0.104, w: 0.084, h: 0.158 },
          { x: 0.057, y: 0.298, w: 0.143, h: 0.387 }, { x: 0.212, y: 0.298, w: 0.05, h: 0.387 }, { x: 0.275, y: 0.298, w: 0.05, h: 0.387 }, { x: 0.338, y: 0.298, w: 0.105, h: 0.387 },
          { x: 0.057, y: 0.72, w: 0.084, h: 0.176 }, { x: 0.158, y: 0.72, w: 0.084, h: 0.176 }, { x: 0.258, y: 0.72, w: 0.084, h: 0.176 }, { x: 0.359, y: 0.72, w: 0.084, h: 0.176 },
          { x: 0.557, y: 0.13, w: 0.084, h: 0.739 }, { x: 0.658, y: 0.13, w: 0.084, h: 0.739 }, { x: 0.758, y: 0.13, w: 0.084, h: 0.739 }, { x: 0.859, y: 0.13, w: 0.084, h: 0.739 }
        ]},
        { id: '16-tempnew-8editorial-8editorial', name: '8 Editorial Hero & Matrix Left + 8 Editorial Hero & Matrix Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.113, w: 0.151, h: 0.774 }, { x: 0.225, y: 0.113, w: 0.103, h: 0.229 }, { x: 0.34, y: 0.113, w: 0.103, h: 0.229 }, { x: 0.225, y: 0.377, w: 0.067, h: 0.229 },
          { x: 0.3, y: 0.377, w: 0.067, h: 0.229 }, { x: 0.376, y: 0.377, w: 0.067, h: 0.229 }, { x: 0.225, y: 0.641, w: 0.103, h: 0.246 }, { x: 0.34, y: 0.641, w: 0.103, h: 0.246 },
          { x: 0.557, y: 0.113, w: 0.151, h: 0.774 }, { x: 0.725, y: 0.113, w: 0.103, h: 0.229 }, { x: 0.84, y: 0.113, w: 0.103, h: 0.229 }, { x: 0.725, y: 0.377, w: 0.067, h: 0.229 },
          { x: 0.8, y: 0.377, w: 0.067, h: 0.229 }, { x: 0.876, y: 0.377, w: 0.067, h: 0.229 }, { x: 0.725, y: 0.641, w: 0.103, h: 0.246 }, { x: 0.84, y: 0.641, w: 0.103, h: 0.246 }
        ]},
        { id: '16-tempnew-8editorial-8asymmetric', name: '8 Editorial Hero & Matrix Left + 8 Asymmetric Storyboard Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.113, w: 0.151, h: 0.774 }, { x: 0.225, y: 0.113, w: 0.103, h: 0.229 }, { x: 0.34, y: 0.113, w: 0.103, h: 0.229 }, { x: 0.225, y: 0.377, w: 0.067, h: 0.229 },
          { x: 0.3, y: 0.377, w: 0.067, h: 0.229 }, { x: 0.376, y: 0.377, w: 0.067, h: 0.229 }, { x: 0.225, y: 0.641, w: 0.103, h: 0.246 }, { x: 0.34, y: 0.641, w: 0.103, h: 0.246 },
          { x: 0.557, y: 0.113, w: 0.181, h: 0.475 }, { x: 0.754, y: 0.113, w: 0.189, h: 0.22 }, { x: 0.754, y: 0.359, w: 0.088, h: 0.229 }, { x: 0.855, y: 0.359, w: 0.088, h: 0.229 },
          { x: 0.557, y: 0.623, w: 0.084, h: 0.264 }, { x: 0.658, y: 0.623, w: 0.084, h: 0.264 }, { x: 0.754, y: 0.623, w: 0.084, h: 0.264 }, { x: 0.855, y: 0.623, w: 0.088, h: 0.264 }
        ]},
        { id: '16-tempnew-8asymmetric-8editorial', name: '8 Asymmetric Storyboard Left + 8 Editorial Hero & Matrix Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.113, w: 0.181, h: 0.475 }, { x: 0.254, y: 0.113, w: 0.189, h: 0.22 }, { x: 0.254, y: 0.359, w: 0.088, h: 0.229 }, { x: 0.355, y: 0.359, w: 0.088, h: 0.229 },
          { x: 0.057, y: 0.623, w: 0.084, h: 0.264 }, { x: 0.158, y: 0.623, w: 0.084, h: 0.264 }, { x: 0.254, y: 0.623, w: 0.084, h: 0.264 }, { x: 0.355, y: 0.623, w: 0.088, h: 0.264 },
          { x: 0.557, y: 0.113, w: 0.151, h: 0.774 }, { x: 0.725, y: 0.113, w: 0.103, h: 0.229 }, { x: 0.84, y: 0.113, w: 0.103, h: 0.229 }, { x: 0.725, y: 0.377, w: 0.067, h: 0.229 },
          { x: 0.8, y: 0.377, w: 0.067, h: 0.229 }, { x: 0.876, y: 0.377, w: 0.067, h: 0.229 }, { x: 0.725, y: 0.641, w: 0.103, h: 0.246 }, { x: 0.84, y: 0.641, w: 0.103, h: 0.246 }
        ]},
        { id: '16-tempnew-8asymmetric-8asymmetric', name: '8 Asymmetric Storyboard Left + 8 Asymmetric Storyboard Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.113, w: 0.181, h: 0.475 }, { x: 0.254, y: 0.113, w: 0.189, h: 0.22 }, { x: 0.254, y: 0.359, w: 0.088, h: 0.229 }, { x: 0.355, y: 0.359, w: 0.088, h: 0.229 },
          { x: 0.057, y: 0.623, w: 0.084, h: 0.264 }, { x: 0.158, y: 0.623, w: 0.084, h: 0.264 }, { x: 0.254, y: 0.623, w: 0.084, h: 0.264 }, { x: 0.355, y: 0.623, w: 0.088, h: 0.264 },
          { x: 0.557, y: 0.113, w: 0.181, h: 0.475 }, { x: 0.754, y: 0.113, w: 0.189, h: 0.22 }, { x: 0.754, y: 0.359, w: 0.088, h: 0.229 }, { x: 0.855, y: 0.359, w: 0.088, h: 0.229 },
          { x: 0.557, y: 0.623, w: 0.084, h: 0.264 }, { x: 0.658, y: 0.623, w: 0.084, h: 0.264 }, { x: 0.754, y: 0.623, w: 0.084, h: 0.264 }, { x: 0.855, y: 0.623, w: 0.088, h: 0.264 }
        ]}
      ],

      // 17 Photos (temp new single page designs & pairings)
      17: [
        { id: '17-tempnew-4strips-13hero', name: '4 Magazine Strips Left + 13 Master Storyboard Collage Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.13, w: 0.084, h: 0.739 }, { x: 0.158, y: 0.13, w: 0.084, h: 0.739 }, { x: 0.258, y: 0.13, w: 0.084, h: 0.739 }, { x: 0.359, y: 0.13, w: 0.084, h: 0.739 },
          { x: 0.632, y: 0.289, w: 0.235, h: 0.422 }, { x: 0.557, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.658, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.758, y: 0.104, w: 0.084, h: 0.15 },
          { x: 0.859, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.557, y: 0.289, w: 0.063, h: 0.194 }, { x: 0.557, y: 0.518, w: 0.063, h: 0.194 }, { x: 0.88, y: 0.289, w: 0.063, h: 0.194 },
          { x: 0.88, y: 0.518, w: 0.063, h: 0.194 }, { x: 0.557, y: 0.746, w: 0.084, h: 0.15 }, { x: 0.658, y: 0.746, w: 0.084, h: 0.15 }, { x: 0.758, y: 0.746, w: 0.084, h: 0.15 },
          { x: 0.859, y: 0.746, w: 0.084, h: 0.15 }
        ]},
        { id: '17-tempnew-13hero-4strips', name: '13 Master Storyboard Collage Left + 4 Magazine Strips Right (Single Pages Combined)', rects: [
          { x: 0.132, y: 0.289, w: 0.235, h: 0.422 }, { x: 0.057, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.158, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.258, y: 0.104, w: 0.084, h: 0.15 },
          { x: 0.359, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.057, y: 0.289, w: 0.063, h: 0.194 }, { x: 0.057, y: 0.518, w: 0.063, h: 0.194 }, { x: 0.38, y: 0.289, w: 0.063, h: 0.194 },
          { x: 0.38, y: 0.518, w: 0.063, h: 0.194 }, { x: 0.057, y: 0.746, w: 0.084, h: 0.15 }, { x: 0.158, y: 0.746, w: 0.084, h: 0.15 }, { x: 0.258, y: 0.746, w: 0.084, h: 0.15 },
          { x: 0.359, y: 0.746, w: 0.084, h: 0.15 }, { x: 0.557, y: 0.13, w: 0.084, h: 0.739 }, { x: 0.658, y: 0.13, w: 0.084, h: 0.739 }, { x: 0.758, y: 0.13, w: 0.084, h: 0.739 },
          { x: 0.859, y: 0.13, w: 0.084, h: 0.739 }
        ]},
        { id: '17-tempnew-7panorama-10flanked', name: '7 Panoramic Insets Left + 10 Flanked Gallery Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.113, w: 0.122, h: 0.202 }, { x: 0.189, y: 0.113, w: 0.122, h: 0.202 }, { x: 0.321, y: 0.113, w: 0.122, h: 0.202 }, { x: 0.057, y: 0.35, w: 0.386, h: 0.299 },
          { x: 0.057, y: 0.685, w: 0.122, h: 0.202 }, { x: 0.189, y: 0.685, w: 0.122, h: 0.202 }, { x: 0.321, y: 0.685, w: 0.122, h: 0.202 }, { x: 0.557, y: 0.113, w: 0.076, h: 0.774 },
          { x: 0.868, y: 0.113, w: 0.076, h: 0.774 }, { x: 0.645, y: 0.113, w: 0.063, h: 0.22 }, { x: 0.716, y: 0.113, w: 0.063, h: 0.22 }, { x: 0.788, y: 0.113, w: 0.063, h: 0.22 },
          { x: 0.645, y: 0.368, w: 0.101, h: 0.246 }, { x: 0.754, y: 0.368, w: 0.097, h: 0.246 }, { x: 0.645, y: 0.65, w: 0.063, h: 0.238 }, { x: 0.716, y: 0.65, w: 0.063, h: 0.238 },
          { x: 0.788, y: 0.65, w: 0.063, h: 0.238 }
        ]},
        { id: '17-tempnew-10flanked-7panorama', name: '10 Flanked Gallery Left + 7 Panoramic Insets Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.113, w: 0.076, h: 0.774 }, { x: 0.368, y: 0.113, w: 0.076, h: 0.774 }, { x: 0.145, y: 0.113, w: 0.063, h: 0.22 }, { x: 0.216, y: 0.113, w: 0.063, h: 0.22 },
          { x: 0.288, y: 0.113, w: 0.063, h: 0.22 }, { x: 0.145, y: 0.368, w: 0.101, h: 0.246 }, { x: 0.254, y: 0.368, w: 0.097, h: 0.246 }, { x: 0.145, y: 0.65, w: 0.063, h: 0.238 },
          { x: 0.216, y: 0.65, w: 0.063, h: 0.238 }, { x: 0.288, y: 0.65, w: 0.063, h: 0.238 }, { x: 0.557, y: 0.113, w: 0.122, h: 0.202 }, { x: 0.689, y: 0.113, w: 0.122, h: 0.202 },
          { x: 0.821, y: 0.113, w: 0.122, h: 0.202 }, { x: 0.557, y: 0.35, w: 0.386, h: 0.299 }, { x: 0.557, y: 0.685, w: 0.122, h: 0.202 }, { x: 0.689, y: 0.685, w: 0.122, h: 0.202 },
          { x: 0.821, y: 0.685, w: 0.122, h: 0.202 }
        ]}
      ],

      // 18 Photos (temp new single page designs & pairings)
      18: [
        { id: '18-tempnew-7panorama-11mosaic', name: '7 Panoramic Insets Left + 11 Mosaic Matrix with Strip Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.113, w: 0.122, h: 0.202 }, { x: 0.189, y: 0.113, w: 0.122, h: 0.202 }, { x: 0.321, y: 0.113, w: 0.122, h: 0.202 }, { x: 0.057, y: 0.35, w: 0.386, h: 0.299 },
          { x: 0.057, y: 0.685, w: 0.122, h: 0.202 }, { x: 0.189, y: 0.685, w: 0.122, h: 0.202 }, { x: 0.321, y: 0.685, w: 0.122, h: 0.202 }, { x: 0.557, y: 0.104, w: 0.122, h: 0.238 },
          { x: 0.691, y: 0.104, w: 0.122, h: 0.238 }, { x: 0.821, y: 0.104, w: 0.122, h: 0.238 }, { x: 0.557, y: 0.377, w: 0.189, h: 0.299 }, { x: 0.758, y: 0.377, w: 0.185, h: 0.136 },
          { x: 0.758, y: 0.54, w: 0.185, h: 0.136 }, { x: 0.557, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.637, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.716, y: 0.711, w: 0.067, h: 0.185 },
          { x: 0.796, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.876, y: 0.711, w: 0.067, h: 0.185 }
        ]},
        { id: '18-tempnew-11mosaic-7panorama', name: '11 Mosaic Matrix with Strip Left + 7 Panoramic Insets Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.104, w: 0.122, h: 0.238 }, { x: 0.191, y: 0.104, w: 0.122, h: 0.238 }, { x: 0.321, y: 0.104, w: 0.122, h: 0.238 }, { x: 0.057, y: 0.377, w: 0.189, h: 0.299 },
          { x: 0.258, y: 0.377, w: 0.185, h: 0.136 }, { x: 0.258, y: 0.54, w: 0.185, h: 0.136 }, { x: 0.057, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.137, y: 0.711, w: 0.067, h: 0.185 },
          { x: 0.216, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.296, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.376, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.557, y: 0.113, w: 0.122, h: 0.202 },
          { x: 0.689, y: 0.113, w: 0.122, h: 0.202 }, { x: 0.821, y: 0.113, w: 0.122, h: 0.202 }, { x: 0.557, y: 0.35, w: 0.386, h: 0.299 }, { x: 0.557, y: 0.685, w: 0.122, h: 0.202 },
          { x: 0.689, y: 0.685, w: 0.122, h: 0.202 }, { x: 0.821, y: 0.685, w: 0.122, h: 0.202 }
        ]},
        { id: '18-tempnew-8editorial-10flanked', name: '8 Editorial Hero & Matrix Left + 10 Flanked Gallery Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.113, w: 0.151, h: 0.774 }, { x: 0.225, y: 0.113, w: 0.103, h: 0.229 }, { x: 0.34, y: 0.113, w: 0.103, h: 0.229 }, { x: 0.225, y: 0.377, w: 0.067, h: 0.229 },
          { x: 0.3, y: 0.377, w: 0.067, h: 0.229 }, { x: 0.376, y: 0.377, w: 0.067, h: 0.229 }, { x: 0.225, y: 0.641, w: 0.103, h: 0.246 }, { x: 0.34, y: 0.641, w: 0.103, h: 0.246 },
          { x: 0.557, y: 0.113, w: 0.076, h: 0.774 }, { x: 0.868, y: 0.113, w: 0.076, h: 0.774 }, { x: 0.645, y: 0.113, w: 0.063, h: 0.22 }, { x: 0.716, y: 0.113, w: 0.063, h: 0.22 },
          { x: 0.788, y: 0.113, w: 0.063, h: 0.22 }, { x: 0.645, y: 0.368, w: 0.101, h: 0.246 }, { x: 0.754, y: 0.368, w: 0.097, h: 0.246 }, { x: 0.645, y: 0.65, w: 0.063, h: 0.238 },
          { x: 0.716, y: 0.65, w: 0.063, h: 0.238 }, { x: 0.788, y: 0.65, w: 0.063, h: 0.238 }
        ]},
        { id: '18-tempnew-10flanked-8editorial', name: '10 Flanked Gallery Left + 8 Editorial Hero & Matrix Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.113, w: 0.076, h: 0.774 }, { x: 0.368, y: 0.113, w: 0.076, h: 0.774 }, { x: 0.145, y: 0.113, w: 0.063, h: 0.22 }, { x: 0.216, y: 0.113, w: 0.063, h: 0.22 },
          { x: 0.288, y: 0.113, w: 0.063, h: 0.22 }, { x: 0.145, y: 0.368, w: 0.101, h: 0.246 }, { x: 0.254, y: 0.368, w: 0.097, h: 0.246 }, { x: 0.145, y: 0.65, w: 0.063, h: 0.238 },
          { x: 0.216, y: 0.65, w: 0.063, h: 0.238 }, { x: 0.288, y: 0.65, w: 0.063, h: 0.238 }, { x: 0.557, y: 0.113, w: 0.151, h: 0.774 }, { x: 0.725, y: 0.113, w: 0.103, h: 0.229 },
          { x: 0.84, y: 0.113, w: 0.103, h: 0.229 }, { x: 0.725, y: 0.377, w: 0.067, h: 0.229 }, { x: 0.8, y: 0.377, w: 0.067, h: 0.229 }, { x: 0.876, y: 0.377, w: 0.067, h: 0.229 },
          { x: 0.725, y: 0.641, w: 0.103, h: 0.246 }, { x: 0.84, y: 0.641, w: 0.103, h: 0.246 }
        ]},
        { id: '18-tempnew-8asymmetric-10flanked', name: '8 Asymmetric Storyboard Left + 10 Flanked Gallery Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.113, w: 0.181, h: 0.475 }, { x: 0.254, y: 0.113, w: 0.189, h: 0.22 }, { x: 0.254, y: 0.359, w: 0.088, h: 0.229 }, { x: 0.355, y: 0.359, w: 0.088, h: 0.229 },
          { x: 0.057, y: 0.623, w: 0.084, h: 0.264 }, { x: 0.158, y: 0.623, w: 0.084, h: 0.264 }, { x: 0.254, y: 0.623, w: 0.084, h: 0.264 }, { x: 0.355, y: 0.623, w: 0.088, h: 0.264 },
          { x: 0.557, y: 0.113, w: 0.076, h: 0.774 }, { x: 0.868, y: 0.113, w: 0.076, h: 0.774 }, { x: 0.645, y: 0.113, w: 0.063, h: 0.22 }, { x: 0.716, y: 0.113, w: 0.063, h: 0.22 },
          { x: 0.788, y: 0.113, w: 0.063, h: 0.22 }, { x: 0.645, y: 0.368, w: 0.101, h: 0.246 }, { x: 0.754, y: 0.368, w: 0.097, h: 0.246 }, { x: 0.645, y: 0.65, w: 0.063, h: 0.238 },
          { x: 0.716, y: 0.65, w: 0.063, h: 0.238 }, { x: 0.788, y: 0.65, w: 0.063, h: 0.238 }
        ]},
        { id: '18-tempnew-10flanked-8asymmetric', name: '10 Flanked Gallery Left + 8 Asymmetric Storyboard Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.113, w: 0.076, h: 0.774 }, { x: 0.368, y: 0.113, w: 0.076, h: 0.774 }, { x: 0.145, y: 0.113, w: 0.063, h: 0.22 }, { x: 0.216, y: 0.113, w: 0.063, h: 0.22 },
          { x: 0.288, y: 0.113, w: 0.063, h: 0.22 }, { x: 0.145, y: 0.368, w: 0.101, h: 0.246 }, { x: 0.254, y: 0.368, w: 0.097, h: 0.246 }, { x: 0.145, y: 0.65, w: 0.063, h: 0.238 },
          { x: 0.216, y: 0.65, w: 0.063, h: 0.238 }, { x: 0.288, y: 0.65, w: 0.063, h: 0.238 }, { x: 0.557, y: 0.113, w: 0.181, h: 0.475 }, { x: 0.754, y: 0.113, w: 0.189, h: 0.22 },
          { x: 0.754, y: 0.359, w: 0.088, h: 0.229 }, { x: 0.855, y: 0.359, w: 0.088, h: 0.229 }, { x: 0.557, y: 0.623, w: 0.084, h: 0.264 }, { x: 0.658, y: 0.623, w: 0.084, h: 0.264 },
          { x: 0.754, y: 0.623, w: 0.084, h: 0.264 }, { x: 0.855, y: 0.623, w: 0.088, h: 0.264 }
        ]}
      ],

      // 19 Photos (temp new single page designs & pairings)
      19: [
        { id: '19-tempnew-7panorama-12anchor', name: '7 Panoramic Insets Left + 12 Dual Anchor Mosaic Wall Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.113, w: 0.122, h: 0.202 }, { x: 0.189, y: 0.113, w: 0.122, h: 0.202 }, { x: 0.321, y: 0.113, w: 0.122, h: 0.202 }, { x: 0.057, y: 0.35, w: 0.386, h: 0.299 },
          { x: 0.057, y: 0.685, w: 0.122, h: 0.202 }, { x: 0.189, y: 0.685, w: 0.122, h: 0.202 }, { x: 0.321, y: 0.685, w: 0.122, h: 0.202 }, { x: 0.557, y: 0.104, w: 0.084, h: 0.158 },
          { x: 0.658, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.758, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.859, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.557, y: 0.298, w: 0.143, h: 0.387 },
          { x: 0.712, y: 0.298, w: 0.05, h: 0.387 }, { x: 0.775, y: 0.298, w: 0.05, h: 0.387 }, { x: 0.838, y: 0.298, w: 0.105, h: 0.387 }, { x: 0.557, y: 0.72, w: 0.084, h: 0.176 },
          { x: 0.658, y: 0.72, w: 0.084, h: 0.176 }, { x: 0.758, y: 0.72, w: 0.084, h: 0.176 }, { x: 0.859, y: 0.72, w: 0.084, h: 0.176 }
        ]},
        { id: '19-tempnew-12anchor-7panorama', name: '12 Dual Anchor Mosaic Wall Left + 7 Panoramic Insets Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.158, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.258, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.359, y: 0.104, w: 0.084, h: 0.158 },
          { x: 0.057, y: 0.298, w: 0.143, h: 0.387 }, { x: 0.212, y: 0.298, w: 0.05, h: 0.387 }, { x: 0.275, y: 0.298, w: 0.05, h: 0.387 }, { x: 0.338, y: 0.298, w: 0.105, h: 0.387 },
          { x: 0.057, y: 0.72, w: 0.084, h: 0.176 }, { x: 0.158, y: 0.72, w: 0.084, h: 0.176 }, { x: 0.258, y: 0.72, w: 0.084, h: 0.176 }, { x: 0.359, y: 0.72, w: 0.084, h: 0.176 },
          { x: 0.557, y: 0.113, w: 0.122, h: 0.202 }, { x: 0.689, y: 0.113, w: 0.122, h: 0.202 }, { x: 0.821, y: 0.113, w: 0.122, h: 0.202 }, { x: 0.557, y: 0.35, w: 0.386, h: 0.299 },
          { x: 0.557, y: 0.685, w: 0.122, h: 0.202 }, { x: 0.689, y: 0.685, w: 0.122, h: 0.202 }, { x: 0.821, y: 0.685, w: 0.122, h: 0.202 }
        ]},
        { id: '19-tempnew-8editorial-11mosaic', name: '8 Editorial Hero & Matrix Left + 11 Mosaic Matrix with Strip Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.113, w: 0.151, h: 0.774 }, { x: 0.225, y: 0.113, w: 0.103, h: 0.229 }, { x: 0.34, y: 0.113, w: 0.103, h: 0.229 }, { x: 0.225, y: 0.377, w: 0.067, h: 0.229 },
          { x: 0.3, y: 0.377, w: 0.067, h: 0.229 }, { x: 0.376, y: 0.377, w: 0.067, h: 0.229 }, { x: 0.225, y: 0.641, w: 0.103, h: 0.246 }, { x: 0.34, y: 0.641, w: 0.103, h: 0.246 },
          { x: 0.557, y: 0.104, w: 0.122, h: 0.238 }, { x: 0.691, y: 0.104, w: 0.122, h: 0.238 }, { x: 0.821, y: 0.104, w: 0.122, h: 0.238 }, { x: 0.557, y: 0.377, w: 0.189, h: 0.299 },
          { x: 0.758, y: 0.377, w: 0.185, h: 0.136 }, { x: 0.758, y: 0.54, w: 0.185, h: 0.136 }, { x: 0.557, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.637, y: 0.711, w: 0.067, h: 0.185 },
          { x: 0.716, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.796, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.876, y: 0.711, w: 0.067, h: 0.185 }
        ]},
        { id: '19-tempnew-11mosaic-8editorial', name: '11 Mosaic Matrix with Strip Left + 8 Editorial Hero & Matrix Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.104, w: 0.122, h: 0.238 }, { x: 0.191, y: 0.104, w: 0.122, h: 0.238 }, { x: 0.321, y: 0.104, w: 0.122, h: 0.238 }, { x: 0.057, y: 0.377, w: 0.189, h: 0.299 },
          { x: 0.258, y: 0.377, w: 0.185, h: 0.136 }, { x: 0.258, y: 0.54, w: 0.185, h: 0.136 }, { x: 0.057, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.137, y: 0.711, w: 0.067, h: 0.185 },
          { x: 0.216, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.296, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.376, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.557, y: 0.113, w: 0.151, h: 0.774 },
          { x: 0.725, y: 0.113, w: 0.103, h: 0.229 }, { x: 0.84, y: 0.113, w: 0.103, h: 0.229 }, { x: 0.725, y: 0.377, w: 0.067, h: 0.229 }, { x: 0.8, y: 0.377, w: 0.067, h: 0.229 },
          { x: 0.876, y: 0.377, w: 0.067, h: 0.229 }, { x: 0.725, y: 0.641, w: 0.103, h: 0.246 }, { x: 0.84, y: 0.641, w: 0.103, h: 0.246 }
        ]},
        { id: '19-tempnew-8asymmetric-11mosaic', name: '8 Asymmetric Storyboard Left + 11 Mosaic Matrix with Strip Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.113, w: 0.181, h: 0.475 }, { x: 0.254, y: 0.113, w: 0.189, h: 0.22 }, { x: 0.254, y: 0.359, w: 0.088, h: 0.229 }, { x: 0.355, y: 0.359, w: 0.088, h: 0.229 },
          { x: 0.057, y: 0.623, w: 0.084, h: 0.264 }, { x: 0.158, y: 0.623, w: 0.084, h: 0.264 }, { x: 0.254, y: 0.623, w: 0.084, h: 0.264 }, { x: 0.355, y: 0.623, w: 0.088, h: 0.264 },
          { x: 0.557, y: 0.104, w: 0.122, h: 0.238 }, { x: 0.691, y: 0.104, w: 0.122, h: 0.238 }, { x: 0.821, y: 0.104, w: 0.122, h: 0.238 }, { x: 0.557, y: 0.377, w: 0.189, h: 0.299 },
          { x: 0.758, y: 0.377, w: 0.185, h: 0.136 }, { x: 0.758, y: 0.54, w: 0.185, h: 0.136 }, { x: 0.557, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.637, y: 0.711, w: 0.067, h: 0.185 },
          { x: 0.716, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.796, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.876, y: 0.711, w: 0.067, h: 0.185 }
        ]},
        { id: '19-tempnew-11mosaic-8asymmetric', name: '11 Mosaic Matrix with Strip Left + 8 Asymmetric Storyboard Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.104, w: 0.122, h: 0.238 }, { x: 0.191, y: 0.104, w: 0.122, h: 0.238 }, { x: 0.321, y: 0.104, w: 0.122, h: 0.238 }, { x: 0.057, y: 0.377, w: 0.189, h: 0.299 },
          { x: 0.258, y: 0.377, w: 0.185, h: 0.136 }, { x: 0.258, y: 0.54, w: 0.185, h: 0.136 }, { x: 0.057, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.137, y: 0.711, w: 0.067, h: 0.185 },
          { x: 0.216, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.296, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.376, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.557, y: 0.113, w: 0.181, h: 0.475 },
          { x: 0.754, y: 0.113, w: 0.189, h: 0.22 }, { x: 0.754, y: 0.359, w: 0.088, h: 0.229 }, { x: 0.855, y: 0.359, w: 0.088, h: 0.229 }, { x: 0.557, y: 0.623, w: 0.084, h: 0.264 },
          { x: 0.658, y: 0.623, w: 0.084, h: 0.264 }, { x: 0.754, y: 0.623, w: 0.084, h: 0.264 }, { x: 0.855, y: 0.623, w: 0.088, h: 0.264 }
        ]}
      ],

      // 20 Photos (temp new single page designs & pairings)
      20: [
        { id: '20-tempnew-7panorama-13hero', name: '7 Panoramic Insets Left + 13 Master Storyboard Collage Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.113, w: 0.122, h: 0.202 }, { x: 0.189, y: 0.113, w: 0.122, h: 0.202 }, { x: 0.321, y: 0.113, w: 0.122, h: 0.202 }, { x: 0.057, y: 0.35, w: 0.386, h: 0.299 },
          { x: 0.057, y: 0.685, w: 0.122, h: 0.202 }, { x: 0.189, y: 0.685, w: 0.122, h: 0.202 }, { x: 0.321, y: 0.685, w: 0.122, h: 0.202 }, { x: 0.632, y: 0.289, w: 0.235, h: 0.422 },
          { x: 0.557, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.658, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.758, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.859, y: 0.104, w: 0.084, h: 0.15 },
          { x: 0.557, y: 0.289, w: 0.063, h: 0.194 }, { x: 0.557, y: 0.518, w: 0.063, h: 0.194 }, { x: 0.88, y: 0.289, w: 0.063, h: 0.194 }, { x: 0.88, y: 0.518, w: 0.063, h: 0.194 },
          { x: 0.557, y: 0.746, w: 0.084, h: 0.15 }, { x: 0.658, y: 0.746, w: 0.084, h: 0.15 }, { x: 0.758, y: 0.746, w: 0.084, h: 0.15 }, { x: 0.859, y: 0.746, w: 0.084, h: 0.15 }
        ]},
        { id: '20-tempnew-13hero-7panorama', name: '13 Master Storyboard Collage Left + 7 Panoramic Insets Right (Single Pages Combined)', rects: [
          { x: 0.132, y: 0.289, w: 0.235, h: 0.422 }, { x: 0.057, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.158, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.258, y: 0.104, w: 0.084, h: 0.15 },
          { x: 0.359, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.057, y: 0.289, w: 0.063, h: 0.194 }, { x: 0.057, y: 0.518, w: 0.063, h: 0.194 }, { x: 0.38, y: 0.289, w: 0.063, h: 0.194 },
          { x: 0.38, y: 0.518, w: 0.063, h: 0.194 }, { x: 0.057, y: 0.746, w: 0.084, h: 0.15 }, { x: 0.158, y: 0.746, w: 0.084, h: 0.15 }, { x: 0.258, y: 0.746, w: 0.084, h: 0.15 },
          { x: 0.359, y: 0.746, w: 0.084, h: 0.15 }, { x: 0.557, y: 0.113, w: 0.122, h: 0.202 }, { x: 0.689, y: 0.113, w: 0.122, h: 0.202 }, { x: 0.821, y: 0.113, w: 0.122, h: 0.202 },
          { x: 0.557, y: 0.35, w: 0.386, h: 0.299 }, { x: 0.557, y: 0.685, w: 0.122, h: 0.202 }, { x: 0.689, y: 0.685, w: 0.122, h: 0.202 }, { x: 0.821, y: 0.685, w: 0.122, h: 0.202 }
        ]},
        { id: '20-tempnew-8editorial-12anchor', name: '8 Editorial Hero & Matrix Left + 12 Dual Anchor Mosaic Wall Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.113, w: 0.151, h: 0.774 }, { x: 0.225, y: 0.113, w: 0.103, h: 0.229 }, { x: 0.34, y: 0.113, w: 0.103, h: 0.229 }, { x: 0.225, y: 0.377, w: 0.067, h: 0.229 },
          { x: 0.3, y: 0.377, w: 0.067, h: 0.229 }, { x: 0.376, y: 0.377, w: 0.067, h: 0.229 }, { x: 0.225, y: 0.641, w: 0.103, h: 0.246 }, { x: 0.34, y: 0.641, w: 0.103, h: 0.246 },
          { x: 0.557, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.658, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.758, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.859, y: 0.104, w: 0.084, h: 0.158 },
          { x: 0.557, y: 0.298, w: 0.143, h: 0.387 }, { x: 0.712, y: 0.298, w: 0.05, h: 0.387 }, { x: 0.775, y: 0.298, w: 0.05, h: 0.387 }, { x: 0.838, y: 0.298, w: 0.105, h: 0.387 },
          { x: 0.557, y: 0.72, w: 0.084, h: 0.176 }, { x: 0.658, y: 0.72, w: 0.084, h: 0.176 }, { x: 0.758, y: 0.72, w: 0.084, h: 0.176 }, { x: 0.859, y: 0.72, w: 0.084, h: 0.176 }
        ]},
        { id: '20-tempnew-12anchor-8editorial', name: '12 Dual Anchor Mosaic Wall Left + 8 Editorial Hero & Matrix Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.158, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.258, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.359, y: 0.104, w: 0.084, h: 0.158 },
          { x: 0.057, y: 0.298, w: 0.143, h: 0.387 }, { x: 0.212, y: 0.298, w: 0.05, h: 0.387 }, { x: 0.275, y: 0.298, w: 0.05, h: 0.387 }, { x: 0.338, y: 0.298, w: 0.105, h: 0.387 },
          { x: 0.057, y: 0.72, w: 0.084, h: 0.176 }, { x: 0.158, y: 0.72, w: 0.084, h: 0.176 }, { x: 0.258, y: 0.72, w: 0.084, h: 0.176 }, { x: 0.359, y: 0.72, w: 0.084, h: 0.176 },
          { x: 0.557, y: 0.113, w: 0.151, h: 0.774 }, { x: 0.725, y: 0.113, w: 0.103, h: 0.229 }, { x: 0.84, y: 0.113, w: 0.103, h: 0.229 }, { x: 0.725, y: 0.377, w: 0.067, h: 0.229 },
          { x: 0.8, y: 0.377, w: 0.067, h: 0.229 }, { x: 0.876, y: 0.377, w: 0.067, h: 0.229 }, { x: 0.725, y: 0.641, w: 0.103, h: 0.246 }, { x: 0.84, y: 0.641, w: 0.103, h: 0.246 }
        ]},
        { id: '20-tempnew-8asymmetric-12anchor', name: '8 Asymmetric Storyboard Left + 12 Dual Anchor Mosaic Wall Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.113, w: 0.181, h: 0.475 }, { x: 0.254, y: 0.113, w: 0.189, h: 0.22 }, { x: 0.254, y: 0.359, w: 0.088, h: 0.229 }, { x: 0.355, y: 0.359, w: 0.088, h: 0.229 },
          { x: 0.057, y: 0.623, w: 0.084, h: 0.264 }, { x: 0.158, y: 0.623, w: 0.084, h: 0.264 }, { x: 0.254, y: 0.623, w: 0.084, h: 0.264 }, { x: 0.355, y: 0.623, w: 0.088, h: 0.264 },
          { x: 0.557, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.658, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.758, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.859, y: 0.104, w: 0.084, h: 0.158 },
          { x: 0.557, y: 0.298, w: 0.143, h: 0.387 }, { x: 0.712, y: 0.298, w: 0.05, h: 0.387 }, { x: 0.775, y: 0.298, w: 0.05, h: 0.387 }, { x: 0.838, y: 0.298, w: 0.105, h: 0.387 },
          { x: 0.557, y: 0.72, w: 0.084, h: 0.176 }, { x: 0.658, y: 0.72, w: 0.084, h: 0.176 }, { x: 0.758, y: 0.72, w: 0.084, h: 0.176 }, { x: 0.859, y: 0.72, w: 0.084, h: 0.176 }
        ]},
        { id: '20-tempnew-12anchor-8asymmetric', name: '12 Dual Anchor Mosaic Wall Left + 8 Asymmetric Storyboard Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.158, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.258, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.359, y: 0.104, w: 0.084, h: 0.158 },
          { x: 0.057, y: 0.298, w: 0.143, h: 0.387 }, { x: 0.212, y: 0.298, w: 0.05, h: 0.387 }, { x: 0.275, y: 0.298, w: 0.05, h: 0.387 }, { x: 0.338, y: 0.298, w: 0.105, h: 0.387 },
          { x: 0.057, y: 0.72, w: 0.084, h: 0.176 }, { x: 0.158, y: 0.72, w: 0.084, h: 0.176 }, { x: 0.258, y: 0.72, w: 0.084, h: 0.176 }, { x: 0.359, y: 0.72, w: 0.084, h: 0.176 },
          { x: 0.557, y: 0.113, w: 0.181, h: 0.475 }, { x: 0.754, y: 0.113, w: 0.189, h: 0.22 }, { x: 0.754, y: 0.359, w: 0.088, h: 0.229 }, { x: 0.855, y: 0.359, w: 0.088, h: 0.229 },
          { x: 0.557, y: 0.623, w: 0.084, h: 0.264 }, { x: 0.658, y: 0.623, w: 0.084, h: 0.264 }, { x: 0.754, y: 0.623, w: 0.084, h: 0.264 }, { x: 0.855, y: 0.623, w: 0.088, h: 0.264 }
        ]},
        { id: '20-tempnew-10flanked-10flanked', name: '10 Flanked Gallery Left + 10 Flanked Gallery Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.113, w: 0.076, h: 0.774 }, { x: 0.368, y: 0.113, w: 0.076, h: 0.774 }, { x: 0.145, y: 0.113, w: 0.063, h: 0.22 }, { x: 0.216, y: 0.113, w: 0.063, h: 0.22 },
          { x: 0.288, y: 0.113, w: 0.063, h: 0.22 }, { x: 0.145, y: 0.368, w: 0.101, h: 0.246 }, { x: 0.254, y: 0.368, w: 0.097, h: 0.246 }, { x: 0.145, y: 0.65, w: 0.063, h: 0.238 },
          { x: 0.216, y: 0.65, w: 0.063, h: 0.238 }, { x: 0.288, y: 0.65, w: 0.063, h: 0.238 }, { x: 0.557, y: 0.113, w: 0.076, h: 0.774 }, { x: 0.868, y: 0.113, w: 0.076, h: 0.774 },
          { x: 0.645, y: 0.113, w: 0.063, h: 0.22 }, { x: 0.716, y: 0.113, w: 0.063, h: 0.22 }, { x: 0.788, y: 0.113, w: 0.063, h: 0.22 }, { x: 0.645, y: 0.368, w: 0.101, h: 0.246 },
          { x: 0.754, y: 0.368, w: 0.097, h: 0.246 }, { x: 0.645, y: 0.65, w: 0.063, h: 0.238 }, { x: 0.716, y: 0.65, w: 0.063, h: 0.238 }, { x: 0.788, y: 0.65, w: 0.063, h: 0.238 }
        ]}
      ],

      // 21 Photos (temp new single page designs & pairings)
      21: [
        { id: '21-tempnew-8editorial-13hero', name: '8 Editorial Hero & Matrix Left + 13 Master Storyboard Collage Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.113, w: 0.151, h: 0.774 }, { x: 0.225, y: 0.113, w: 0.103, h: 0.229 }, { x: 0.34, y: 0.113, w: 0.103, h: 0.229 }, { x: 0.225, y: 0.377, w: 0.067, h: 0.229 },
          { x: 0.3, y: 0.377, w: 0.067, h: 0.229 }, { x: 0.376, y: 0.377, w: 0.067, h: 0.229 }, { x: 0.225, y: 0.641, w: 0.103, h: 0.246 }, { x: 0.34, y: 0.641, w: 0.103, h: 0.246 },
          { x: 0.632, y: 0.289, w: 0.235, h: 0.422 }, { x: 0.557, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.658, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.758, y: 0.104, w: 0.084, h: 0.15 },
          { x: 0.859, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.557, y: 0.289, w: 0.063, h: 0.194 }, { x: 0.557, y: 0.518, w: 0.063, h: 0.194 }, { x: 0.88, y: 0.289, w: 0.063, h: 0.194 },
          { x: 0.88, y: 0.518, w: 0.063, h: 0.194 }, { x: 0.557, y: 0.746, w: 0.084, h: 0.15 }, { x: 0.658, y: 0.746, w: 0.084, h: 0.15 }, { x: 0.758, y: 0.746, w: 0.084, h: 0.15 },
          { x: 0.859, y: 0.746, w: 0.084, h: 0.15 }
        ]},
        { id: '21-tempnew-13hero-8editorial', name: '13 Master Storyboard Collage Left + 8 Editorial Hero & Matrix Right (Single Pages Combined)', rects: [
          { x: 0.132, y: 0.289, w: 0.235, h: 0.422 }, { x: 0.057, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.158, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.258, y: 0.104, w: 0.084, h: 0.15 },
          { x: 0.359, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.057, y: 0.289, w: 0.063, h: 0.194 }, { x: 0.057, y: 0.518, w: 0.063, h: 0.194 }, { x: 0.38, y: 0.289, w: 0.063, h: 0.194 },
          { x: 0.38, y: 0.518, w: 0.063, h: 0.194 }, { x: 0.057, y: 0.746, w: 0.084, h: 0.15 }, { x: 0.158, y: 0.746, w: 0.084, h: 0.15 }, { x: 0.258, y: 0.746, w: 0.084, h: 0.15 },
          { x: 0.359, y: 0.746, w: 0.084, h: 0.15 }, { x: 0.557, y: 0.113, w: 0.151, h: 0.774 }, { x: 0.725, y: 0.113, w: 0.103, h: 0.229 }, { x: 0.84, y: 0.113, w: 0.103, h: 0.229 },
          { x: 0.725, y: 0.377, w: 0.067, h: 0.229 }, { x: 0.8, y: 0.377, w: 0.067, h: 0.229 }, { x: 0.876, y: 0.377, w: 0.067, h: 0.229 }, { x: 0.725, y: 0.641, w: 0.103, h: 0.246 },
          { x: 0.84, y: 0.641, w: 0.103, h: 0.246 }
        ]},
        { id: '21-tempnew-8asymmetric-13hero', name: '8 Asymmetric Storyboard Left + 13 Master Storyboard Collage Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.113, w: 0.181, h: 0.475 }, { x: 0.254, y: 0.113, w: 0.189, h: 0.22 }, { x: 0.254, y: 0.359, w: 0.088, h: 0.229 }, { x: 0.355, y: 0.359, w: 0.088, h: 0.229 },
          { x: 0.057, y: 0.623, w: 0.084, h: 0.264 }, { x: 0.158, y: 0.623, w: 0.084, h: 0.264 }, { x: 0.254, y: 0.623, w: 0.084, h: 0.264 }, { x: 0.355, y: 0.623, w: 0.088, h: 0.264 },
          { x: 0.632, y: 0.289, w: 0.235, h: 0.422 }, { x: 0.557, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.658, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.758, y: 0.104, w: 0.084, h: 0.15 },
          { x: 0.859, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.557, y: 0.289, w: 0.063, h: 0.194 }, { x: 0.557, y: 0.518, w: 0.063, h: 0.194 }, { x: 0.88, y: 0.289, w: 0.063, h: 0.194 },
          { x: 0.88, y: 0.518, w: 0.063, h: 0.194 }, { x: 0.557, y: 0.746, w: 0.084, h: 0.15 }, { x: 0.658, y: 0.746, w: 0.084, h: 0.15 }, { x: 0.758, y: 0.746, w: 0.084, h: 0.15 },
          { x: 0.859, y: 0.746, w: 0.084, h: 0.15 }
        ]},
        { id: '21-tempnew-13hero-8asymmetric', name: '13 Master Storyboard Collage Left + 8 Asymmetric Storyboard Right (Single Pages Combined)', rects: [
          { x: 0.132, y: 0.289, w: 0.235, h: 0.422 }, { x: 0.057, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.158, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.258, y: 0.104, w: 0.084, h: 0.15 },
          { x: 0.359, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.057, y: 0.289, w: 0.063, h: 0.194 }, { x: 0.057, y: 0.518, w: 0.063, h: 0.194 }, { x: 0.38, y: 0.289, w: 0.063, h: 0.194 },
          { x: 0.38, y: 0.518, w: 0.063, h: 0.194 }, { x: 0.057, y: 0.746, w: 0.084, h: 0.15 }, { x: 0.158, y: 0.746, w: 0.084, h: 0.15 }, { x: 0.258, y: 0.746, w: 0.084, h: 0.15 },
          { x: 0.359, y: 0.746, w: 0.084, h: 0.15 }, { x: 0.557, y: 0.113, w: 0.181, h: 0.475 }, { x: 0.754, y: 0.113, w: 0.189, h: 0.22 }, { x: 0.754, y: 0.359, w: 0.088, h: 0.229 },
          { x: 0.855, y: 0.359, w: 0.088, h: 0.229 }, { x: 0.557, y: 0.623, w: 0.084, h: 0.264 }, { x: 0.658, y: 0.623, w: 0.084, h: 0.264 }, { x: 0.754, y: 0.623, w: 0.084, h: 0.264 },
          { x: 0.855, y: 0.623, w: 0.088, h: 0.264 }
        ]},
        { id: '21-tempnew-10flanked-11mosaic', name: '10 Flanked Gallery Left + 11 Mosaic Matrix with Strip Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.113, w: 0.076, h: 0.774 }, { x: 0.368, y: 0.113, w: 0.076, h: 0.774 }, { x: 0.145, y: 0.113, w: 0.063, h: 0.22 }, { x: 0.216, y: 0.113, w: 0.063, h: 0.22 },
          { x: 0.288, y: 0.113, w: 0.063, h: 0.22 }, { x: 0.145, y: 0.368, w: 0.101, h: 0.246 }, { x: 0.254, y: 0.368, w: 0.097, h: 0.246 }, { x: 0.145, y: 0.65, w: 0.063, h: 0.238 },
          { x: 0.216, y: 0.65, w: 0.063, h: 0.238 }, { x: 0.288, y: 0.65, w: 0.063, h: 0.238 }, { x: 0.557, y: 0.104, w: 0.122, h: 0.238 }, { x: 0.691, y: 0.104, w: 0.122, h: 0.238 },
          { x: 0.821, y: 0.104, w: 0.122, h: 0.238 }, { x: 0.557, y: 0.377, w: 0.189, h: 0.299 }, { x: 0.758, y: 0.377, w: 0.185, h: 0.136 }, { x: 0.758, y: 0.54, w: 0.185, h: 0.136 },
          { x: 0.557, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.637, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.716, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.796, y: 0.711, w: 0.067, h: 0.185 },
          { x: 0.876, y: 0.711, w: 0.067, h: 0.185 }
        ]},
        { id: '21-tempnew-11mosaic-10flanked', name: '11 Mosaic Matrix with Strip Left + 10 Flanked Gallery Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.104, w: 0.122, h: 0.238 }, { x: 0.191, y: 0.104, w: 0.122, h: 0.238 }, { x: 0.321, y: 0.104, w: 0.122, h: 0.238 }, { x: 0.057, y: 0.377, w: 0.189, h: 0.299 },
          { x: 0.258, y: 0.377, w: 0.185, h: 0.136 }, { x: 0.258, y: 0.54, w: 0.185, h: 0.136 }, { x: 0.057, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.137, y: 0.711, w: 0.067, h: 0.185 },
          { x: 0.216, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.296, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.376, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.557, y: 0.113, w: 0.076, h: 0.774 },
          { x: 0.868, y: 0.113, w: 0.076, h: 0.774 }, { x: 0.645, y: 0.113, w: 0.063, h: 0.22 }, { x: 0.716, y: 0.113, w: 0.063, h: 0.22 }, { x: 0.788, y: 0.113, w: 0.063, h: 0.22 },
          { x: 0.645, y: 0.368, w: 0.101, h: 0.246 }, { x: 0.754, y: 0.368, w: 0.097, h: 0.246 }, { x: 0.645, y: 0.65, w: 0.063, h: 0.238 }, { x: 0.716, y: 0.65, w: 0.063, h: 0.238 },
          { x: 0.788, y: 0.65, w: 0.063, h: 0.238 }
        ]}
      ],

      // 22 Photos (temp new single page designs & pairings)
      22: [
        { id: '22-tempnew-10flanked-12anchor', name: '10 Flanked Gallery Left + 12 Dual Anchor Mosaic Wall Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.113, w: 0.076, h: 0.774 }, { x: 0.368, y: 0.113, w: 0.076, h: 0.774 }, { x: 0.145, y: 0.113, w: 0.063, h: 0.22 }, { x: 0.216, y: 0.113, w: 0.063, h: 0.22 },
          { x: 0.288, y: 0.113, w: 0.063, h: 0.22 }, { x: 0.145, y: 0.368, w: 0.101, h: 0.246 }, { x: 0.254, y: 0.368, w: 0.097, h: 0.246 }, { x: 0.145, y: 0.65, w: 0.063, h: 0.238 },
          { x: 0.216, y: 0.65, w: 0.063, h: 0.238 }, { x: 0.288, y: 0.65, w: 0.063, h: 0.238 }, { x: 0.557, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.658, y: 0.104, w: 0.084, h: 0.158 },
          { x: 0.758, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.859, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.557, y: 0.298, w: 0.143, h: 0.387 }, { x: 0.712, y: 0.298, w: 0.05, h: 0.387 },
          { x: 0.775, y: 0.298, w: 0.05, h: 0.387 }, { x: 0.838, y: 0.298, w: 0.105, h: 0.387 }, { x: 0.557, y: 0.72, w: 0.084, h: 0.176 }, { x: 0.658, y: 0.72, w: 0.084, h: 0.176 },
          { x: 0.758, y: 0.72, w: 0.084, h: 0.176 }, { x: 0.859, y: 0.72, w: 0.084, h: 0.176 }
        ]},
        { id: '22-tempnew-12anchor-10flanked', name: '12 Dual Anchor Mosaic Wall Left + 10 Flanked Gallery Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.158, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.258, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.359, y: 0.104, w: 0.084, h: 0.158 },
          { x: 0.057, y: 0.298, w: 0.143, h: 0.387 }, { x: 0.212, y: 0.298, w: 0.05, h: 0.387 }, { x: 0.275, y: 0.298, w: 0.05, h: 0.387 }, { x: 0.338, y: 0.298, w: 0.105, h: 0.387 },
          { x: 0.057, y: 0.72, w: 0.084, h: 0.176 }, { x: 0.158, y: 0.72, w: 0.084, h: 0.176 }, { x: 0.258, y: 0.72, w: 0.084, h: 0.176 }, { x: 0.359, y: 0.72, w: 0.084, h: 0.176 },
          { x: 0.557, y: 0.113, w: 0.076, h: 0.774 }, { x: 0.868, y: 0.113, w: 0.076, h: 0.774 }, { x: 0.645, y: 0.113, w: 0.063, h: 0.22 }, { x: 0.716, y: 0.113, w: 0.063, h: 0.22 },
          { x: 0.788, y: 0.113, w: 0.063, h: 0.22 }, { x: 0.645, y: 0.368, w: 0.101, h: 0.246 }, { x: 0.754, y: 0.368, w: 0.097, h: 0.246 }, { x: 0.645, y: 0.65, w: 0.063, h: 0.238 },
          { x: 0.716, y: 0.65, w: 0.063, h: 0.238 }, { x: 0.788, y: 0.65, w: 0.063, h: 0.238 }
        ]},
        { id: '22-tempnew-11mosaic-11mosaic', name: '11 Mosaic Matrix with Strip Left + 11 Mosaic Matrix with Strip Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.104, w: 0.122, h: 0.238 }, { x: 0.191, y: 0.104, w: 0.122, h: 0.238 }, { x: 0.321, y: 0.104, w: 0.122, h: 0.238 }, { x: 0.057, y: 0.377, w: 0.189, h: 0.299 },
          { x: 0.258, y: 0.377, w: 0.185, h: 0.136 }, { x: 0.258, y: 0.54, w: 0.185, h: 0.136 }, { x: 0.057, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.137, y: 0.711, w: 0.067, h: 0.185 },
          { x: 0.216, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.296, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.376, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.557, y: 0.104, w: 0.122, h: 0.238 },
          { x: 0.691, y: 0.104, w: 0.122, h: 0.238 }, { x: 0.821, y: 0.104, w: 0.122, h: 0.238 }, { x: 0.557, y: 0.377, w: 0.189, h: 0.299 }, { x: 0.758, y: 0.377, w: 0.185, h: 0.136 },
          { x: 0.758, y: 0.54, w: 0.185, h: 0.136 }, { x: 0.557, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.637, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.716, y: 0.711, w: 0.067, h: 0.185 },
          { x: 0.796, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.876, y: 0.711, w: 0.067, h: 0.185 }
        ]}
      ],

      // 23 Photos (temp new single page designs & pairings)
      23: [
        { id: '23-tempnew-10flanked-13hero', name: '10 Flanked Gallery Left + 13 Master Storyboard Collage Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.113, w: 0.076, h: 0.774 }, { x: 0.368, y: 0.113, w: 0.076, h: 0.774 }, { x: 0.145, y: 0.113, w: 0.063, h: 0.22 }, { x: 0.216, y: 0.113, w: 0.063, h: 0.22 },
          { x: 0.288, y: 0.113, w: 0.063, h: 0.22 }, { x: 0.145, y: 0.368, w: 0.101, h: 0.246 }, { x: 0.254, y: 0.368, w: 0.097, h: 0.246 }, { x: 0.145, y: 0.65, w: 0.063, h: 0.238 },
          { x: 0.216, y: 0.65, w: 0.063, h: 0.238 }, { x: 0.288, y: 0.65, w: 0.063, h: 0.238 }, { x: 0.632, y: 0.289, w: 0.235, h: 0.422 }, { x: 0.557, y: 0.104, w: 0.084, h: 0.15 },
          { x: 0.658, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.758, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.859, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.557, y: 0.289, w: 0.063, h: 0.194 },
          { x: 0.557, y: 0.518, w: 0.063, h: 0.194 }, { x: 0.88, y: 0.289, w: 0.063, h: 0.194 }, { x: 0.88, y: 0.518, w: 0.063, h: 0.194 }, { x: 0.557, y: 0.746, w: 0.084, h: 0.15 },
          { x: 0.658, y: 0.746, w: 0.084, h: 0.15 }, { x: 0.758, y: 0.746, w: 0.084, h: 0.15 }, { x: 0.859, y: 0.746, w: 0.084, h: 0.15 }
        ]},
        { id: '23-tempnew-13hero-10flanked', name: '13 Master Storyboard Collage Left + 10 Flanked Gallery Right (Single Pages Combined)', rects: [
          { x: 0.132, y: 0.289, w: 0.235, h: 0.422 }, { x: 0.057, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.158, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.258, y: 0.104, w: 0.084, h: 0.15 },
          { x: 0.359, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.057, y: 0.289, w: 0.063, h: 0.194 }, { x: 0.057, y: 0.518, w: 0.063, h: 0.194 }, { x: 0.38, y: 0.289, w: 0.063, h: 0.194 },
          { x: 0.38, y: 0.518, w: 0.063, h: 0.194 }, { x: 0.057, y: 0.746, w: 0.084, h: 0.15 }, { x: 0.158, y: 0.746, w: 0.084, h: 0.15 }, { x: 0.258, y: 0.746, w: 0.084, h: 0.15 },
          { x: 0.359, y: 0.746, w: 0.084, h: 0.15 }, { x: 0.557, y: 0.113, w: 0.076, h: 0.774 }, { x: 0.868, y: 0.113, w: 0.076, h: 0.774 }, { x: 0.645, y: 0.113, w: 0.063, h: 0.22 },
          { x: 0.716, y: 0.113, w: 0.063, h: 0.22 }, { x: 0.788, y: 0.113, w: 0.063, h: 0.22 }, { x: 0.645, y: 0.368, w: 0.101, h: 0.246 }, { x: 0.754, y: 0.368, w: 0.097, h: 0.246 },
          { x: 0.645, y: 0.65, w: 0.063, h: 0.238 }, { x: 0.716, y: 0.65, w: 0.063, h: 0.238 }, { x: 0.788, y: 0.65, w: 0.063, h: 0.238 }
        ]},
        { id: '23-tempnew-11mosaic-12anchor', name: '11 Mosaic Matrix with Strip Left + 12 Dual Anchor Mosaic Wall Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.104, w: 0.122, h: 0.238 }, { x: 0.191, y: 0.104, w: 0.122, h: 0.238 }, { x: 0.321, y: 0.104, w: 0.122, h: 0.238 }, { x: 0.057, y: 0.377, w: 0.189, h: 0.299 },
          { x: 0.258, y: 0.377, w: 0.185, h: 0.136 }, { x: 0.258, y: 0.54, w: 0.185, h: 0.136 }, { x: 0.057, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.137, y: 0.711, w: 0.067, h: 0.185 },
          { x: 0.216, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.296, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.376, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.557, y: 0.104, w: 0.084, h: 0.158 },
          { x: 0.658, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.758, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.859, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.557, y: 0.298, w: 0.143, h: 0.387 },
          { x: 0.712, y: 0.298, w: 0.05, h: 0.387 }, { x: 0.775, y: 0.298, w: 0.05, h: 0.387 }, { x: 0.838, y: 0.298, w: 0.105, h: 0.387 }, { x: 0.557, y: 0.72, w: 0.084, h: 0.176 },
          { x: 0.658, y: 0.72, w: 0.084, h: 0.176 }, { x: 0.758, y: 0.72, w: 0.084, h: 0.176 }, { x: 0.859, y: 0.72, w: 0.084, h: 0.176 }
        ]},
        { id: '23-tempnew-12anchor-11mosaic', name: '12 Dual Anchor Mosaic Wall Left + 11 Mosaic Matrix with Strip Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.158, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.258, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.359, y: 0.104, w: 0.084, h: 0.158 },
          { x: 0.057, y: 0.298, w: 0.143, h: 0.387 }, { x: 0.212, y: 0.298, w: 0.05, h: 0.387 }, { x: 0.275, y: 0.298, w: 0.05, h: 0.387 }, { x: 0.338, y: 0.298, w: 0.105, h: 0.387 },
          { x: 0.057, y: 0.72, w: 0.084, h: 0.176 }, { x: 0.158, y: 0.72, w: 0.084, h: 0.176 }, { x: 0.258, y: 0.72, w: 0.084, h: 0.176 }, { x: 0.359, y: 0.72, w: 0.084, h: 0.176 },
          { x: 0.557, y: 0.104, w: 0.122, h: 0.238 }, { x: 0.691, y: 0.104, w: 0.122, h: 0.238 }, { x: 0.821, y: 0.104, w: 0.122, h: 0.238 }, { x: 0.557, y: 0.377, w: 0.189, h: 0.299 },
          { x: 0.758, y: 0.377, w: 0.185, h: 0.136 }, { x: 0.758, y: 0.54, w: 0.185, h: 0.136 }, { x: 0.557, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.637, y: 0.711, w: 0.067, h: 0.185 },
          { x: 0.716, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.796, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.876, y: 0.711, w: 0.067, h: 0.185 }
        ]}
      ],

      // 24 Photos (temp new single page designs & pairings)
      24: [
        { id: '24-tempnew-11mosaic-13hero', name: '11 Mosaic Matrix with Strip Left + 13 Master Storyboard Collage Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.104, w: 0.122, h: 0.238 }, { x: 0.191, y: 0.104, w: 0.122, h: 0.238 }, { x: 0.321, y: 0.104, w: 0.122, h: 0.238 }, { x: 0.057, y: 0.377, w: 0.189, h: 0.299 },
          { x: 0.258, y: 0.377, w: 0.185, h: 0.136 }, { x: 0.258, y: 0.54, w: 0.185, h: 0.136 }, { x: 0.057, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.137, y: 0.711, w: 0.067, h: 0.185 },
          { x: 0.216, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.296, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.376, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.632, y: 0.289, w: 0.235, h: 0.422 },
          { x: 0.557, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.658, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.758, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.859, y: 0.104, w: 0.084, h: 0.15 },
          { x: 0.557, y: 0.289, w: 0.063, h: 0.194 }, { x: 0.557, y: 0.518, w: 0.063, h: 0.194 }, { x: 0.88, y: 0.289, w: 0.063, h: 0.194 }, { x: 0.88, y: 0.518, w: 0.063, h: 0.194 },
          { x: 0.557, y: 0.746, w: 0.084, h: 0.15 }, { x: 0.658, y: 0.746, w: 0.084, h: 0.15 }, { x: 0.758, y: 0.746, w: 0.084, h: 0.15 }, { x: 0.859, y: 0.746, w: 0.084, h: 0.15 }
        ]},
        { id: '24-tempnew-13hero-11mosaic', name: '13 Master Storyboard Collage Left + 11 Mosaic Matrix with Strip Right (Single Pages Combined)', rects: [
          { x: 0.132, y: 0.289, w: 0.235, h: 0.422 }, { x: 0.057, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.158, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.258, y: 0.104, w: 0.084, h: 0.15 },
          { x: 0.359, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.057, y: 0.289, w: 0.063, h: 0.194 }, { x: 0.057, y: 0.518, w: 0.063, h: 0.194 }, { x: 0.38, y: 0.289, w: 0.063, h: 0.194 },
          { x: 0.38, y: 0.518, w: 0.063, h: 0.194 }, { x: 0.057, y: 0.746, w: 0.084, h: 0.15 }, { x: 0.158, y: 0.746, w: 0.084, h: 0.15 }, { x: 0.258, y: 0.746, w: 0.084, h: 0.15 },
          { x: 0.359, y: 0.746, w: 0.084, h: 0.15 }, { x: 0.557, y: 0.104, w: 0.122, h: 0.238 }, { x: 0.691, y: 0.104, w: 0.122, h: 0.238 }, { x: 0.821, y: 0.104, w: 0.122, h: 0.238 },
          { x: 0.557, y: 0.377, w: 0.189, h: 0.299 }, { x: 0.758, y: 0.377, w: 0.185, h: 0.136 }, { x: 0.758, y: 0.54, w: 0.185, h: 0.136 }, { x: 0.557, y: 0.711, w: 0.067, h: 0.185 },
          { x: 0.637, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.716, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.796, y: 0.711, w: 0.067, h: 0.185 }, { x: 0.876, y: 0.711, w: 0.067, h: 0.185 }
        ]},
        { id: '24-tempnew-12anchor-12anchor', name: '12 Dual Anchor Mosaic Wall Left + 12 Dual Anchor Mosaic Wall Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.158, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.258, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.359, y: 0.104, w: 0.084, h: 0.158 },
          { x: 0.057, y: 0.298, w: 0.143, h: 0.387 }, { x: 0.212, y: 0.298, w: 0.05, h: 0.387 }, { x: 0.275, y: 0.298, w: 0.05, h: 0.387 }, { x: 0.338, y: 0.298, w: 0.105, h: 0.387 },
          { x: 0.057, y: 0.72, w: 0.084, h: 0.176 }, { x: 0.158, y: 0.72, w: 0.084, h: 0.176 }, { x: 0.258, y: 0.72, w: 0.084, h: 0.176 }, { x: 0.359, y: 0.72, w: 0.084, h: 0.176 },
          { x: 0.557, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.658, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.758, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.859, y: 0.104, w: 0.084, h: 0.158 },
          { x: 0.557, y: 0.298, w: 0.143, h: 0.387 }, { x: 0.712, y: 0.298, w: 0.05, h: 0.387 }, { x: 0.775, y: 0.298, w: 0.05, h: 0.387 }, { x: 0.838, y: 0.298, w: 0.105, h: 0.387 },
          { x: 0.557, y: 0.72, w: 0.084, h: 0.176 }, { x: 0.658, y: 0.72, w: 0.084, h: 0.176 }, { x: 0.758, y: 0.72, w: 0.084, h: 0.176 }, { x: 0.859, y: 0.72, w: 0.084, h: 0.176 }
        ]}
      ],

      // 25 Photos (temp new single page designs & pairings)
      25: [
        { id: '25-tempnew-12anchor-13hero', name: '12 Dual Anchor Mosaic Wall Left + 13 Master Storyboard Collage Right (Single Pages Combined)', rects: [
          { x: 0.057, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.158, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.258, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.359, y: 0.104, w: 0.084, h: 0.158 },
          { x: 0.057, y: 0.298, w: 0.143, h: 0.387 }, { x: 0.212, y: 0.298, w: 0.05, h: 0.387 }, { x: 0.275, y: 0.298, w: 0.05, h: 0.387 }, { x: 0.338, y: 0.298, w: 0.105, h: 0.387 },
          { x: 0.057, y: 0.72, w: 0.084, h: 0.176 }, { x: 0.158, y: 0.72, w: 0.084, h: 0.176 }, { x: 0.258, y: 0.72, w: 0.084, h: 0.176 }, { x: 0.359, y: 0.72, w: 0.084, h: 0.176 },
          { x: 0.632, y: 0.289, w: 0.235, h: 0.422 }, { x: 0.557, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.658, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.758, y: 0.104, w: 0.084, h: 0.15 },
          { x: 0.859, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.557, y: 0.289, w: 0.063, h: 0.194 }, { x: 0.557, y: 0.518, w: 0.063, h: 0.194 }, { x: 0.88, y: 0.289, w: 0.063, h: 0.194 },
          { x: 0.88, y: 0.518, w: 0.063, h: 0.194 }, { x: 0.557, y: 0.746, w: 0.084, h: 0.15 }, { x: 0.658, y: 0.746, w: 0.084, h: 0.15 }, { x: 0.758, y: 0.746, w: 0.084, h: 0.15 },
          { x: 0.859, y: 0.746, w: 0.084, h: 0.15 }
        ]},
        { id: '25-tempnew-13hero-12anchor', name: '13 Master Storyboard Collage Left + 12 Dual Anchor Mosaic Wall Right (Single Pages Combined)', rects: [
          { x: 0.132, y: 0.289, w: 0.235, h: 0.422 }, { x: 0.057, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.158, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.258, y: 0.104, w: 0.084, h: 0.15 },
          { x: 0.359, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.057, y: 0.289, w: 0.063, h: 0.194 }, { x: 0.057, y: 0.518, w: 0.063, h: 0.194 }, { x: 0.38, y: 0.289, w: 0.063, h: 0.194 },
          { x: 0.38, y: 0.518, w: 0.063, h: 0.194 }, { x: 0.057, y: 0.746, w: 0.084, h: 0.15 }, { x: 0.158, y: 0.746, w: 0.084, h: 0.15 }, { x: 0.258, y: 0.746, w: 0.084, h: 0.15 },
          { x: 0.359, y: 0.746, w: 0.084, h: 0.15 }, { x: 0.557, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.658, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.758, y: 0.104, w: 0.084, h: 0.158 },
          { x: 0.859, y: 0.104, w: 0.084, h: 0.158 }, { x: 0.557, y: 0.298, w: 0.143, h: 0.387 }, { x: 0.712, y: 0.298, w: 0.05, h: 0.387 }, { x: 0.775, y: 0.298, w: 0.05, h: 0.387 },
          { x: 0.838, y: 0.298, w: 0.105, h: 0.387 }, { x: 0.557, y: 0.72, w: 0.084, h: 0.176 }, { x: 0.658, y: 0.72, w: 0.084, h: 0.176 }, { x: 0.758, y: 0.72, w: 0.084, h: 0.176 },
          { x: 0.859, y: 0.72, w: 0.084, h: 0.176 }
        ]}
      ],

      // 26 Photos (temp new single page designs & pairings)
      26: [
        { id: '26-tempnew-13hero-13hero', name: '13 Master Storyboard Collage Left + 13 Master Storyboard Collage Right (Single Pages Combined)', rects: [
          { x: 0.132, y: 0.289, w: 0.235, h: 0.422 }, { x: 0.057, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.158, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.258, y: 0.104, w: 0.084, h: 0.15 },
          { x: 0.359, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.057, y: 0.289, w: 0.063, h: 0.194 }, { x: 0.057, y: 0.518, w: 0.063, h: 0.194 }, { x: 0.38, y: 0.289, w: 0.063, h: 0.194 },
          { x: 0.38, y: 0.518, w: 0.063, h: 0.194 }, { x: 0.057, y: 0.746, w: 0.084, h: 0.15 }, { x: 0.158, y: 0.746, w: 0.084, h: 0.15 }, { x: 0.258, y: 0.746, w: 0.084, h: 0.15 },
          { x: 0.359, y: 0.746, w: 0.084, h: 0.15 }, { x: 0.632, y: 0.289, w: 0.235, h: 0.422 }, { x: 0.557, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.658, y: 0.104, w: 0.084, h: 0.15 },
          { x: 0.758, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.859, y: 0.104, w: 0.084, h: 0.15 }, { x: 0.557, y: 0.289, w: 0.063, h: 0.194 }, { x: 0.557, y: 0.518, w: 0.063, h: 0.194 },
          { x: 0.88, y: 0.289, w: 0.063, h: 0.194 }, { x: 0.88, y: 0.518, w: 0.063, h: 0.194 }, { x: 0.557, y: 0.746, w: 0.084, h: 0.15 }, { x: 0.658, y: 0.746, w: 0.084, h: 0.15 },
          { x: 0.758, y: 0.746, w: 0.084, h: 0.15 }, { x: 0.859, y: 0.746, w: 0.084, h: 0.15 }
        ]}
      ]
    };
  }

  /**
   * Artistic single page designs & pairings extracted from:
   * temp new/artistic (Circles, Arch Domes, Diamonds, Watercolor Splash, Brush Strokes, Flared Triptychs)
   */
  _getTempNewArtisticTemplates() {
    return {
      // 1 Photos (Artistic Circles, Arches, Diamonds & Brush Layouts)
      1: [
        { id: '1-art-1torn_paper-left', name: '★ Torn Paper Artistic Reveal Left', rects: [
          { x: 0.057, y: 0.113, w: 0.386, h: 0.774, shape: 'brush' }
        ]},
        { id: '1-art-1torn_paper-right', name: '★ Torn Paper Artistic Reveal Right', rects: [
          { x: 0.557, y: 0.113, w: 0.386, h: 0.774, shape: 'brush' }
        ]},
        { id: '1-art-1grunge_filmstrip-left', name: '★ Grunge Filmstrip Frame Left', rects: [
          { x: 0.09, y: 0.113, w: 0.319, h: 0.774, shape: 'brush' }
        ]},
        { id: '1-art-1grunge_filmstrip-right', name: '★ Grunge Filmstrip Frame Right', rects: [
          { x: 0.59, y: 0.113, w: 0.319, h: 0.774, shape: 'brush' }
        ]}
      ],

      // 2 Photos (Artistic Circles, Arches, Diamonds & Brush Layouts)
      2: [
        { id: '2-art-2brush_circle-left', name: '★ Artistic Brush Stroke & Circle Accent Left', rects: [
          { x: 0.09, y: 0.113, w: 0.319, h: 0.774, shape: 'brush' }, { x: 0.25, y: 0.57, w: 0.134, h: 0.282, shape: 'circle' }
        ]},
        { id: '2-art-2brush_circle-right', name: '★ Artistic Brush Stroke & Circle Accent Right', rects: [
          { x: 0.59, y: 0.113, w: 0.319, h: 0.774, shape: 'brush' }, { x: 0.75, y: 0.57, w: 0.134, h: 0.282, shape: 'circle' }
        ]},
        { id: '2-art-dual-torn-paper', name: '★ Dual Torn Paper Artistic Reveals (2 Photos Spread)', rects: [
          { x: 0.057, y: 0.113, w: 0.386, h: 0.774, shape: 'brush' }, { x: 0.557, y: 0.113, w: 0.386, h: 0.774, shape: 'brush' }
        ]},
        { id: '2-art-dual-grunge-filmstrip', name: '★ Dual Grunge Filmstrip Frames (2 Photos Spread)', rects: [
          { x: 0.09, y: 0.113, w: 0.319, h: 0.774, shape: 'brush' }, { x: 0.59, y: 0.113, w: 0.319, h: 0.774, shape: 'brush' }
        ]}
      ],

      // 3 Photos (Artistic Circles, Arches, Diamonds & Brush Layouts)
      3: [
        { id: '3-art-3flared_triptych-left', name: '★ 3 Flared Dynamic Triptych Left', rects: [
          { x: 0.057, y: 0.113, w: 0.101, h: 0.774, shape: 'skew' }, { x: 0.158, y: 0.113, w: 0.185, h: 0.774 },
          { x: 0.342, y: 0.113, w: 0.101, h: 0.774, shape: 'skew' }
        ]},
        { id: '3-art-3flared_triptych-right', name: '★ 3 Flared Dynamic Triptych Right', rects: [
          { x: 0.557, y: 0.113, w: 0.101, h: 0.774, shape: 'skew' }, { x: 0.658, y: 0.113, w: 0.185, h: 0.774 },
          { x: 0.842, y: 0.113, w: 0.101, h: 0.774, shape: 'skew' }
        ]},
        { id: '3-art-3perspective_triptych-left', name: '★ 3-D Perspective Gallery Triptych Left', rects: [
          { x: 0.065, y: 0.148, w: 0.101, h: 0.704, shape: 'skew' }, { x: 0.191, y: 0.192, w: 0.118, h: 0.616 },
          { x: 0.334, y: 0.148, w: 0.101, h: 0.704, shape: 'skew' }
        ]},
        { id: '3-art-3perspective_triptych-right', name: '★ 3-D Perspective Gallery Triptych Right', rects: [
          { x: 0.565, y: 0.148, w: 0.101, h: 0.704, shape: 'skew' }, { x: 0.691, y: 0.192, w: 0.118, h: 0.616 },
          { x: 0.834, y: 0.148, w: 0.101, h: 0.704, shape: 'skew' }
        ]},
        { id: '3-art-2brush-hero-circle-right', name: '★ Brush Stroke Left + Hero Circle Right (Artistic Spread)', rects: [
          { x: 0.09, y: 0.113, w: 0.319, h: 0.774, shape: 'brush' }, { x: 0.25, y: 0.57, w: 0.134, h: 0.282, shape: 'circle' },
          { x: 0.58, y: 0.12, w: 0.34, h: 0.76, shape: 'circle' }
        ]},
        { id: '3-art-hero-circle-left-2brush', name: '★ Hero Circle Left + Brush Stroke Right (Artistic Spread)', rects: [
          { x: 0.08, y: 0.12, w: 0.34, h: 0.76, shape: 'circle' }, { x: 0.59, y: 0.113, w: 0.319, h: 0.774, shape: 'brush' },
          { x: 0.75, y: 0.57, w: 0.134, h: 0.282, shape: 'circle' }
        ]}
      ],

      // 4 Photos (Artistic Circles, Arches, Diamonds & Brush Layouts)
      4: [
        { id: '4-art-4watercolor_3stack-left', name: '★ Watercolor Splash & 3-Triptych Stack Left', rects: [
          { x: 0.065, y: 0.13, w: 0.202, h: 0.739, shape: 'brush' }, { x: 0.284, y: 0.13, w: 0.151, h: 0.22 },
          { x: 0.284, y: 0.386, w: 0.151, h: 0.22 }, { x: 0.284, y: 0.65, w: 0.151, h: 0.22 }
        ]},
        { id: '4-art-4watercolor_3stack-right', name: '★ Watercolor Splash & 3-Triptych Stack Right', rects: [
          { x: 0.565, y: 0.13, w: 0.202, h: 0.739, shape: 'brush' }, { x: 0.784, y: 0.13, w: 0.151, h: 0.22 },
          { x: 0.784, y: 0.386, w: 0.151, h: 0.22 }, { x: 0.784, y: 0.65, w: 0.151, h: 0.22 }
        ]},
        { id: '4-art-4curved_filmstrip-left', name: '★ Curved Wave Filmstrip Splatter Left', rects: [
          { x: 0.057, y: 0.394, w: 0.088, h: 0.229, shape: 'brush' }, { x: 0.153, y: 0.359, w: 0.088, h: 0.22, shape: 'brush' },
          { x: 0.25, y: 0.386, w: 0.088, h: 0.22, shape: 'brush' }, { x: 0.347, y: 0.447, w: 0.088, h: 0.229, shape: 'brush' }
        ]},
        { id: '4-art-4curved_filmstrip-right', name: '★ Curved Wave Filmstrip Splatter Right', rects: [
          { x: 0.557, y: 0.394, w: 0.088, h: 0.229, shape: 'brush' }, { x: 0.653, y: 0.359, w: 0.088, h: 0.22, shape: 'brush' },
          { x: 0.75, y: 0.386, w: 0.088, h: 0.22, shape: 'brush' }, { x: 0.847, y: 0.447, w: 0.088, h: 0.229, shape: 'brush' }
        ]},
        { id: '4-art-4staggered_panels-left', name: '★ 4 Staggered Layered Panels Left', rects: [
          { x: 0.065, y: 0.148, w: 0.088, h: 0.669 }, { x: 0.158, y: 0.113, w: 0.088, h: 0.669 },
          { x: 0.25, y: 0.174, w: 0.088, h: 0.669 }, { x: 0.342, y: 0.139, w: 0.088, h: 0.669 }
        ]},
        { id: '4-art-4staggered_panels-right', name: '★ 4 Staggered Layered Panels Right', rects: [
          { x: 0.565, y: 0.148, w: 0.088, h: 0.669 }, { x: 0.658, y: 0.113, w: 0.088, h: 0.669 },
          { x: 0.75, y: 0.174, w: 0.088, h: 0.669 }, { x: 0.842, y: 0.139, w: 0.088, h: 0.669 }
        ]},
        { id: '4-art-4hanging_frames-left', name: '★ 4 Suspended Hanging Squares Left', rects: [
          { x: 0.132, y: 0.095, w: 0.092, h: 0.194 }, { x: 0.082, y: 0.298, w: 0.092, h: 0.194 },
          { x: 0.149, y: 0.518, w: 0.092, h: 0.194 }, { x: 0.103, y: 0.729, w: 0.092, h: 0.194 }
        ]},
        { id: '4-art-4hanging_frames-right', name: '★ 4 Suspended Hanging Squares Right', rects: [
          { x: 0.632, y: 0.095, w: 0.092, h: 0.194 }, { x: 0.582, y: 0.298, w: 0.092, h: 0.194 },
          { x: 0.649, y: 0.518, w: 0.092, h: 0.194 }, { x: 0.603, y: 0.729, w: 0.092, h: 0.194 }
        ]},
        { id: '4-art-4curved_quad-left', name: '★ Organic Curved Corner Quad Left', rects: [
          { x: 0.09, y: 0.148, w: 0.176, h: 0.343, shape: 'rounded', borderRadius: 28 }, { x: 0.279, y: 0.183, w: 0.13, h: 0.273 },
          { x: 0.103, y: 0.526, w: 0.13, h: 0.273 }, { x: 0.208, y: 0.474, w: 0.202, h: 0.37, shape: 'rounded', borderRadius: 28 }
        ]},
        { id: '4-art-4curved_quad-right', name: '★ Organic Curved Corner Quad Right', rects: [
          { x: 0.59, y: 0.148, w: 0.176, h: 0.343, shape: 'rounded', borderRadius: 28 }, { x: 0.779, y: 0.183, w: 0.13, h: 0.273 },
          { x: 0.603, y: 0.526, w: 0.13, h: 0.273 }, { x: 0.708, y: 0.474, w: 0.202, h: 0.37, shape: 'rounded', borderRadius: 28 }
        ]},
        { id: '4-art-4parallelogram-left', name: '★ 4 Slanted Parallelograms Left', rects: [
          { x: 0.057, y: 0.13, w: 0.097, h: 0.739, shape: 'skew' }, { x: 0.158, y: 0.13, w: 0.097, h: 0.739, shape: 'skew' },
          { x: 0.258, y: 0.13, w: 0.097, h: 0.739, shape: 'skew' }, { x: 0.351, y: 0.13, w: 0.097, h: 0.739, shape: 'skew' }
        ]},
        { id: '4-art-4parallelogram-right', name: '★ 4 Slanted Parallelograms Right', rects: [
          { x: 0.557, y: 0.13, w: 0.097, h: 0.739, shape: 'skew' }, { x: 0.658, y: 0.13, w: 0.097, h: 0.739, shape: 'skew' },
          { x: 0.758, y: 0.13, w: 0.097, h: 0.739, shape: 'skew' }, { x: 0.851, y: 0.13, w: 0.097, h: 0.739, shape: 'skew' }
        ]},
        { id: '4-art-dual-2brush-circle', name: '★ Dual Brush Stroke & Circle Accents (4 Photos Artistic Spread)', rects: [
          { x: 0.09, y: 0.113, w: 0.319, h: 0.774, shape: 'brush' }, { x: 0.25, y: 0.57, w: 0.134, h: 0.282, shape: 'circle' },
          { x: 0.59, y: 0.113, w: 0.319, h: 0.774, shape: 'brush' }, { x: 0.75, y: 0.57, w: 0.134, h: 0.282, shape: 'circle' }
        ]}
      ],

      // 5 Photos (Artistic Circles, Arches, Diamonds & Brush Layouts)
      5: [
        { id: '5-art-5circles-left', name: '★ Artistic 5-Circle Cloud Gallery Left', rects: [
          { x: 0.187, y: 0.359, w: 0.147, h: 0.308, shape: 'circle' }, { x: 0.174, y: 0.236, w: 0.097, h: 0.202, shape: 'circle' },
          { x: 0.116, y: 0.333, w: 0.097, h: 0.202, shape: 'circle' }, { x: 0.246, y: 0.28, w: 0.067, h: 0.141, shape: 'circle' },
          { x: 0.292, y: 0.306, w: 0.092, h: 0.194, shape: 'circle' }
        ]},
        { id: '5-art-5circles-right', name: '★ Artistic 5-Circle Cloud Gallery Right', rects: [
          { x: 0.687, y: 0.359, w: 0.147, h: 0.308, shape: 'circle' }, { x: 0.674, y: 0.236, w: 0.097, h: 0.202, shape: 'circle' },
          { x: 0.616, y: 0.333, w: 0.097, h: 0.202, shape: 'circle' }, { x: 0.746, y: 0.28, w: 0.067, h: 0.141, shape: 'circle' },
          { x: 0.792, y: 0.306, w: 0.092, h: 0.194, shape: 'circle' }
        ]},
        { id: '5-art-5arch_grid-left', name: '★ Artistic Arch Dome & 4-Grid Left', rects: [
          { x: 0.174, y: 0.13, w: 0.151, h: 0.704, shape: 'arch' }, { x: 0.065, y: 0.13, w: 0.097, h: 0.334 },
          { x: 0.065, y: 0.5, w: 0.097, h: 0.334 }, { x: 0.338, y: 0.13, w: 0.097, h: 0.334 },
          { x: 0.338, y: 0.5, w: 0.097, h: 0.334 }
        ]},
        { id: '5-art-5arch_grid-right', name: '★ Artistic Arch Dome & 4-Grid Right', rects: [
          { x: 0.674, y: 0.13, w: 0.151, h: 0.704, shape: 'arch' }, { x: 0.565, y: 0.13, w: 0.097, h: 0.334 },
          { x: 0.565, y: 0.5, w: 0.097, h: 0.334 }, { x: 0.838, y: 0.13, w: 0.097, h: 0.334 },
          { x: 0.838, y: 0.5, w: 0.097, h: 0.334 }
        ]},
        { id: '5-art-5diamond_mosaic-left', name: '★ Diamond Rhombus Mosaic Story Left', rects: [
          { x: 0.174, y: 0.183, w: 0.151, h: 0.598, shape: 'diamond' }, { x: 0.099, y: 0.183, w: 0.092, h: 0.282, shape: 'diamond' },
          { x: 0.099, y: 0.5, w: 0.092, h: 0.282, shape: 'diamond' }, { x: 0.309, y: 0.183, w: 0.092, h: 0.282, shape: 'diamond' },
          { x: 0.309, y: 0.5, w: 0.092, h: 0.282, shape: 'diamond' }
        ]},
        { id: '5-art-5diamond_mosaic-right', name: '★ Diamond Rhombus Mosaic Story Right', rects: [
          { x: 0.674, y: 0.183, w: 0.151, h: 0.598, shape: 'diamond' }, { x: 0.599, y: 0.183, w: 0.092, h: 0.282, shape: 'diamond' },
          { x: 0.599, y: 0.5, w: 0.092, h: 0.282, shape: 'diamond' }, { x: 0.809, y: 0.183, w: 0.092, h: 0.282, shape: 'diamond' },
          { x: 0.809, y: 0.5, w: 0.092, h: 0.282, shape: 'diamond' }
        ]},
        { id: '5-art-5editorial_slices-left', name: '★ 5 Editorial Magazine Slices Left', rects: [
          { x: 0.061, y: 0.236, w: 0.076, h: 0.528 }, { x: 0.137, y: 0.236, w: 0.076, h: 0.528 },
          { x: 0.212, y: 0.236, w: 0.076, h: 0.528 }, { x: 0.288, y: 0.236, w: 0.076, h: 0.528 },
          { x: 0.363, y: 0.236, w: 0.076, h: 0.528 }
        ]},
        { id: '5-art-5editorial_slices-right', name: '★ 5 Editorial Magazine Slices Right', rects: [
          { x: 0.561, y: 0.236, w: 0.076, h: 0.528 }, { x: 0.637, y: 0.236, w: 0.076, h: 0.528 },
          { x: 0.712, y: 0.236, w: 0.076, h: 0.528 }, { x: 0.788, y: 0.236, w: 0.076, h: 0.528 },
          { x: 0.863, y: 0.236, w: 0.076, h: 0.528 }
        ]},
        { id: '5-art-5diamond_quadrant-left', name: '★ Center Diamond Quadrant Left', rects: [
          { x: 0.166, y: 0.324, w: 0.168, h: 0.352, shape: 'diamond' }, { x: 0.065, y: 0.113, w: 0.176, h: 0.37 },
          { x: 0.258, y: 0.113, w: 0.176, h: 0.37 }, { x: 0.065, y: 0.518, w: 0.176, h: 0.37 },
          { x: 0.258, y: 0.518, w: 0.176, h: 0.37 }
        ]},
        { id: '5-art-5diamond_quadrant-right', name: '★ Center Diamond Quadrant Right', rects: [
          { x: 0.666, y: 0.324, w: 0.168, h: 0.352, shape: 'diamond' }, { x: 0.565, y: 0.113, w: 0.176, h: 0.37 },
          { x: 0.758, y: 0.113, w: 0.176, h: 0.37 }, { x: 0.565, y: 0.518, w: 0.176, h: 0.37 },
          { x: 0.758, y: 0.518, w: 0.176, h: 0.37 }
        ]},
        { id: '5-art-watercolor-hero-circle-right', name: '★ Watercolor Splash Left + Hero Circle Right (Artistic Spread)', rects: [
          { x: 0.065, y: 0.13, w: 0.202, h: 0.739, shape: 'brush' }, { x: 0.284, y: 0.13, w: 0.151, h: 0.22 },
          { x: 0.284, y: 0.386, w: 0.151, h: 0.22 }, { x: 0.284, y: 0.65, w: 0.151, h: 0.22 },
          { x: 0.58, y: 0.12, w: 0.34, h: 0.76, shape: 'circle' }
        ]}
      ],

      // 6 Photos (Artistic Circles, Arches, Diamonds & Brush Layouts)
      6: [
        { id: '6-art-5circles-hero-circle-right', name: '★ 5 Circles Left + Hero Circle Right (Artistic Spread)', rects: [
          { x: 0.187, y: 0.359, w: 0.147, h: 0.308, shape: 'circle' }, { x: 0.174, y: 0.236, w: 0.097, h: 0.202, shape: 'circle' },
          { x: 0.116, y: 0.333, w: 0.097, h: 0.202, shape: 'circle' }, { x: 0.246, y: 0.28, w: 0.067, h: 0.141, shape: 'circle' },
          { x: 0.292, y: 0.306, w: 0.092, h: 0.194, shape: 'circle' }, { x: 0.58, y: 0.12, w: 0.34, h: 0.76, shape: 'circle' }
        ]},
        { id: '6-art-hero-circle-left-5circles', name: '★ Hero Circle Left + 5 Circles Right (Artistic Spread)', rects: [
          { x: 0.08, y: 0.12, w: 0.34, h: 0.76, shape: 'circle' }, { x: 0.687, y: 0.359, w: 0.147, h: 0.308, shape: 'circle' },
          { x: 0.674, y: 0.236, w: 0.097, h: 0.202, shape: 'circle' }, { x: 0.616, y: 0.333, w: 0.097, h: 0.202, shape: 'circle' },
          { x: 0.746, y: 0.28, w: 0.067, h: 0.141, shape: 'circle' }, { x: 0.792, y: 0.306, w: 0.092, h: 0.194, shape: 'circle' }
        ]},
        { id: '6-art-5arch-hero-arch-right', name: '★ Arch Dome Left + Hero Arch Right (Artistic Spread)', rects: [
          { x: 0.174, y: 0.13, w: 0.151, h: 0.704, shape: 'arch' }, { x: 0.065, y: 0.13, w: 0.097, h: 0.334 },
          { x: 0.065, y: 0.5, w: 0.097, h: 0.334 }, { x: 0.338, y: 0.13, w: 0.097, h: 0.334 },
          { x: 0.338, y: 0.5, w: 0.097, h: 0.334 }, { x: 0.56, y: 0.08, w: 0.38, h: 0.84, shape: 'arch' }
        ]},
        { id: '6-art-5diamond-hero-diamond-right', name: '★ Diamond Mosaic Left + Hero Diamond Right (Artistic Spread)', rects: [
          { x: 0.174, y: 0.183, w: 0.151, h: 0.598, shape: 'diamond' }, { x: 0.099, y: 0.183, w: 0.092, h: 0.282, shape: 'diamond' },
          { x: 0.099, y: 0.5, w: 0.092, h: 0.282, shape: 'diamond' }, { x: 0.309, y: 0.183, w: 0.092, h: 0.282, shape: 'diamond' },
          { x: 0.309, y: 0.5, w: 0.092, h: 0.282, shape: 'diamond' }, { x: 0.56, y: 0.08, w: 0.38, h: 0.84, shape: 'diamond' }
        ]},
        { id: '6-art-dual-3flared-triptych', name: '★ Dual 3-Flared Dynamic Triptychs (6 Photos Spread)', rects: [
          { x: 0.057, y: 0.113, w: 0.101, h: 0.774, shape: 'skew' }, { x: 0.158, y: 0.113, w: 0.185, h: 0.774 },
          { x: 0.342, y: 0.113, w: 0.101, h: 0.774, shape: 'skew' }, { x: 0.557, y: 0.113, w: 0.101, h: 0.774, shape: 'skew' },
          { x: 0.658, y: 0.113, w: 0.185, h: 0.774 }, { x: 0.842, y: 0.113, w: 0.101, h: 0.774, shape: 'skew' }
        ]},
        { id: '6-art-dual-3perspective-triptych', name: '★ Dual 3-D Perspective Triptychs (6 Photos Spread)', rects: [
          { x: 0.065, y: 0.148, w: 0.101, h: 0.704, shape: 'skew' }, { x: 0.191, y: 0.192, w: 0.118, h: 0.616 },
          { x: 0.334, y: 0.148, w: 0.101, h: 0.704, shape: 'skew' }, { x: 0.565, y: 0.148, w: 0.101, h: 0.704, shape: 'skew' },
          { x: 0.691, y: 0.192, w: 0.118, h: 0.616 }, { x: 0.834, y: 0.148, w: 0.101, h: 0.704, shape: 'skew' }
        ]}
      ],

      // 7 Photos (Artistic Circles, Arches, Diamonds & Brush Layouts)
      7: [
        { id: '7-art-5circles-2brush', name: '★ 5 Circles Left + Brush Stroke & Circle Right (Artistic Spread)', rects: [
          { x: 0.187, y: 0.359, w: 0.147, h: 0.308, shape: 'circle' }, { x: 0.174, y: 0.236, w: 0.097, h: 0.202, shape: 'circle' },
          { x: 0.116, y: 0.333, w: 0.097, h: 0.202, shape: 'circle' }, { x: 0.246, y: 0.28, w: 0.067, h: 0.141, shape: 'circle' },
          { x: 0.292, y: 0.306, w: 0.092, h: 0.194, shape: 'circle' }, { x: 0.59, y: 0.113, w: 0.319, h: 0.774, shape: 'brush' },
          { x: 0.75, y: 0.57, w: 0.134, h: 0.282, shape: 'circle' }
        ]},
        { id: '7-art-2brush-5circles', name: '★ Brush Stroke & Circle Left + 5 Circles Right (Artistic Spread)', rects: [
          { x: 0.09, y: 0.113, w: 0.319, h: 0.774, shape: 'brush' }, { x: 0.25, y: 0.57, w: 0.134, h: 0.282, shape: 'circle' },
          { x: 0.687, y: 0.359, w: 0.147, h: 0.308, shape: 'circle' }, { x: 0.674, y: 0.236, w: 0.097, h: 0.202, shape: 'circle' },
          { x: 0.616, y: 0.333, w: 0.097, h: 0.202, shape: 'circle' }, { x: 0.746, y: 0.28, w: 0.067, h: 0.141, shape: 'circle' },
          { x: 0.792, y: 0.306, w: 0.092, h: 0.194, shape: 'circle' }
        ]}
      ],

      // 8 Photos (Artistic Circles, Arches, Diamonds & Brush Layouts)
      8: [
        { id: '8-art-dual-4watercolor', name: '★ Dual Watercolor Splash & Triptychs (8 Photos Artistic Spread)', rects: [
          { x: 0.065, y: 0.13, w: 0.202, h: 0.739, shape: 'brush' }, { x: 0.284, y: 0.13, w: 0.151, h: 0.22 },
          { x: 0.284, y: 0.386, w: 0.151, h: 0.22 }, { x: 0.284, y: 0.65, w: 0.151, h: 0.22 },
          { x: 0.565, y: 0.13, w: 0.202, h: 0.739, shape: 'brush' }, { x: 0.784, y: 0.13, w: 0.151, h: 0.22 },
          { x: 0.784, y: 0.386, w: 0.151, h: 0.22 }, { x: 0.784, y: 0.65, w: 0.151, h: 0.22 }
        ]},
        { id: '8-art-dual-4curved-filmstrip', name: '★ Dual Curved Wave Filmstrip Splatters (8 Photos Artistic Spread)', rects: [
          { x: 0.057, y: 0.394, w: 0.088, h: 0.229, shape: 'brush' }, { x: 0.153, y: 0.359, w: 0.088, h: 0.22, shape: 'brush' },
          { x: 0.25, y: 0.386, w: 0.088, h: 0.22, shape: 'brush' }, { x: 0.347, y: 0.447, w: 0.088, h: 0.229, shape: 'brush' },
          { x: 0.557, y: 0.394, w: 0.088, h: 0.229, shape: 'brush' }, { x: 0.653, y: 0.359, w: 0.088, h: 0.22, shape: 'brush' },
          { x: 0.75, y: 0.386, w: 0.088, h: 0.22, shape: 'brush' }, { x: 0.847, y: 0.447, w: 0.088, h: 0.229, shape: 'brush' }
        ]},
        { id: '8-art-dual-4staggered', name: '★ Dual 4-Staggered Layered Panels (8 Photos Spread)', rects: [
          { x: 0.065, y: 0.148, w: 0.088, h: 0.669 }, { x: 0.158, y: 0.113, w: 0.088, h: 0.669 },
          { x: 0.25, y: 0.174, w: 0.088, h: 0.669 }, { x: 0.342, y: 0.139, w: 0.088, h: 0.669 },
          { x: 0.565, y: 0.148, w: 0.088, h: 0.669 }, { x: 0.658, y: 0.113, w: 0.088, h: 0.669 },
          { x: 0.75, y: 0.174, w: 0.088, h: 0.669 }, { x: 0.842, y: 0.139, w: 0.088, h: 0.669 }
        ]},
        { id: '8-art-dual-4hanging', name: '★ Dual Suspended Hanging Squares (8 Photos Spread)', rects: [
          { x: 0.132, y: 0.095, w: 0.092, h: 0.194 }, { x: 0.082, y: 0.298, w: 0.092, h: 0.194 },
          { x: 0.149, y: 0.518, w: 0.092, h: 0.194 }, { x: 0.103, y: 0.729, w: 0.092, h: 0.194 },
          { x: 0.632, y: 0.095, w: 0.092, h: 0.194 }, { x: 0.582, y: 0.298, w: 0.092, h: 0.194 },
          { x: 0.649, y: 0.518, w: 0.092, h: 0.194 }, { x: 0.603, y: 0.729, w: 0.092, h: 0.194 }
        ]},
        { id: '8-art-dual-4curved-quad', name: '★ Dual Organic Curved Corner Quads (8 Photos Spread)', rects: [
          { x: 0.09, y: 0.148, w: 0.176, h: 0.343, shape: 'rounded', borderRadius: 28 }, { x: 0.279, y: 0.183, w: 0.13, h: 0.273 },
          { x: 0.103, y: 0.526, w: 0.13, h: 0.273 }, { x: 0.208, y: 0.474, w: 0.202, h: 0.37, shape: 'rounded', borderRadius: 28 },
          { x: 0.59, y: 0.148, w: 0.176, h: 0.343, shape: 'rounded', borderRadius: 28 }, { x: 0.779, y: 0.183, w: 0.13, h: 0.273 },
          { x: 0.603, y: 0.526, w: 0.13, h: 0.273 }, { x: 0.708, y: 0.474, w: 0.202, h: 0.37, shape: 'rounded', borderRadius: 28 }
        ]},
        { id: '8-art-dual-4parallelogram', name: '★ Dual 4-Slanted Parallelograms (8 Photos Spread)', rects: [
          { x: 0.057, y: 0.13, w: 0.097, h: 0.739, shape: 'skew' }, { x: 0.158, y: 0.13, w: 0.097, h: 0.739, shape: 'skew' },
          { x: 0.258, y: 0.13, w: 0.097, h: 0.739, shape: 'skew' }, { x: 0.351, y: 0.13, w: 0.097, h: 0.739, shape: 'skew' },
          { x: 0.557, y: 0.13, w: 0.097, h: 0.739, shape: 'skew' }, { x: 0.658, y: 0.13, w: 0.097, h: 0.739, shape: 'skew' },
          { x: 0.758, y: 0.13, w: 0.097, h: 0.739, shape: 'skew' }, { x: 0.851, y: 0.13, w: 0.097, h: 0.739, shape: 'skew' }
        ]}
      ],

      // 9 Photos (Artistic Circles, Arches, Diamonds & Brush Layouts)
      9: [
        { id: '9-art-5circles-4watercolor', name: '★ 5 Circles Left + Watercolor Splash Right (Artistic Spread)', rects: [
          { x: 0.187, y: 0.359, w: 0.147, h: 0.308, shape: 'circle' }, { x: 0.174, y: 0.236, w: 0.097, h: 0.202, shape: 'circle' },
          { x: 0.116, y: 0.333, w: 0.097, h: 0.202, shape: 'circle' }, { x: 0.246, y: 0.28, w: 0.067, h: 0.141, shape: 'circle' },
          { x: 0.292, y: 0.306, w: 0.092, h: 0.194, shape: 'circle' }, { x: 0.565, y: 0.13, w: 0.202, h: 0.739, shape: 'brush' },
          { x: 0.784, y: 0.13, w: 0.151, h: 0.22 }, { x: 0.784, y: 0.386, w: 0.151, h: 0.22 },
          { x: 0.784, y: 0.65, w: 0.151, h: 0.22 }
        ]},
        { id: '9-art-4watercolor-5circles', name: '★ Watercolor Splash Left + 5 Circles Right (Artistic Spread)', rects: [
          { x: 0.065, y: 0.13, w: 0.202, h: 0.739, shape: 'brush' }, { x: 0.284, y: 0.13, w: 0.151, h: 0.22 },
          { x: 0.284, y: 0.386, w: 0.151, h: 0.22 }, { x: 0.284, y: 0.65, w: 0.151, h: 0.22 },
          { x: 0.687, y: 0.359, w: 0.147, h: 0.308, shape: 'circle' }, { x: 0.674, y: 0.236, w: 0.097, h: 0.202, shape: 'circle' },
          { x: 0.616, y: 0.333, w: 0.097, h: 0.202, shape: 'circle' }, { x: 0.746, y: 0.28, w: 0.067, h: 0.141, shape: 'circle' },
          { x: 0.792, y: 0.306, w: 0.092, h: 0.194, shape: 'circle' }
        ]}
      ],

      // 10 Photos (Artistic Circles, Arches, Diamonds & Brush Layouts)
      10: [
        { id: '10-art-dual-5circles', name: '★ Dual 5-Circle Cloud Gallery (10 Circular Photos Spread)', rects: [
          { x: 0.187, y: 0.359, w: 0.147, h: 0.308, shape: 'circle' }, { x: 0.174, y: 0.236, w: 0.097, h: 0.202, shape: 'circle' },
          { x: 0.116, y: 0.333, w: 0.097, h: 0.202, shape: 'circle' }, { x: 0.246, y: 0.28, w: 0.067, h: 0.141, shape: 'circle' },
          { x: 0.292, y: 0.306, w: 0.092, h: 0.194, shape: 'circle' }, { x: 0.687, y: 0.359, w: 0.147, h: 0.308, shape: 'circle' },
          { x: 0.674, y: 0.236, w: 0.097, h: 0.202, shape: 'circle' }, { x: 0.616, y: 0.333, w: 0.097, h: 0.202, shape: 'circle' },
          { x: 0.746, y: 0.28, w: 0.067, h: 0.141, shape: 'circle' }, { x: 0.792, y: 0.306, w: 0.092, h: 0.194, shape: 'circle' }
        ]},
        { id: '10-art-5circles-5arch', name: '★ 5 Circles Left + Arch Dome 4-Grid Right (Artistic Spread)', rects: [
          { x: 0.187, y: 0.359, w: 0.147, h: 0.308, shape: 'circle' }, { x: 0.174, y: 0.236, w: 0.097, h: 0.202, shape: 'circle' },
          { x: 0.116, y: 0.333, w: 0.097, h: 0.202, shape: 'circle' }, { x: 0.246, y: 0.28, w: 0.067, h: 0.141, shape: 'circle' },
          { x: 0.292, y: 0.306, w: 0.092, h: 0.194, shape: 'circle' }, { x: 0.674, y: 0.13, w: 0.151, h: 0.704, shape: 'arch' },
          { x: 0.565, y: 0.13, w: 0.097, h: 0.334 }, { x: 0.565, y: 0.5, w: 0.097, h: 0.334 },
          { x: 0.838, y: 0.13, w: 0.097, h: 0.334 }, { x: 0.838, y: 0.5, w: 0.097, h: 0.334 }
        ]},
        { id: '10-art-5arch-5circles', name: '★ Arch Dome 4-Grid Left + 5 Circles Right (Artistic Spread)', rects: [
          { x: 0.174, y: 0.13, w: 0.151, h: 0.704, shape: 'arch' }, { x: 0.065, y: 0.13, w: 0.097, h: 0.334 },
          { x: 0.065, y: 0.5, w: 0.097, h: 0.334 }, { x: 0.338, y: 0.13, w: 0.097, h: 0.334 },
          { x: 0.338, y: 0.5, w: 0.097, h: 0.334 }, { x: 0.687, y: 0.359, w: 0.147, h: 0.308, shape: 'circle' },
          { x: 0.674, y: 0.236, w: 0.097, h: 0.202, shape: 'circle' }, { x: 0.616, y: 0.333, w: 0.097, h: 0.202, shape: 'circle' },
          { x: 0.746, y: 0.28, w: 0.067, h: 0.141, shape: 'circle' }, { x: 0.792, y: 0.306, w: 0.092, h: 0.194, shape: 'circle' }
        ]},
        { id: '10-art-5circles-5diamond', name: '★ 5 Circles Left + Diamond Mosaic Right (Artistic Spread)', rects: [
          { x: 0.187, y: 0.359, w: 0.147, h: 0.308, shape: 'circle' }, { x: 0.174, y: 0.236, w: 0.097, h: 0.202, shape: 'circle' },
          { x: 0.116, y: 0.333, w: 0.097, h: 0.202, shape: 'circle' }, { x: 0.246, y: 0.28, w: 0.067, h: 0.141, shape: 'circle' },
          { x: 0.292, y: 0.306, w: 0.092, h: 0.194, shape: 'circle' }, { x: 0.674, y: 0.183, w: 0.151, h: 0.598, shape: 'diamond' },
          { x: 0.599, y: 0.183, w: 0.092, h: 0.282, shape: 'diamond' }, { x: 0.599, y: 0.5, w: 0.092, h: 0.282, shape: 'diamond' },
          { x: 0.809, y: 0.183, w: 0.092, h: 0.282, shape: 'diamond' }, { x: 0.809, y: 0.5, w: 0.092, h: 0.282, shape: 'diamond' }
        ]},
        { id: '10-art-dual-5arch', name: '★ Dual Arch Dome & 4-Grid (10 Photos Artistic Spread)', rects: [
          { x: 0.174, y: 0.13, w: 0.151, h: 0.704, shape: 'arch' }, { x: 0.065, y: 0.13, w: 0.097, h: 0.334 },
          { x: 0.065, y: 0.5, w: 0.097, h: 0.334 }, { x: 0.338, y: 0.13, w: 0.097, h: 0.334 },
          { x: 0.338, y: 0.5, w: 0.097, h: 0.334 }, { x: 0.674, y: 0.13, w: 0.151, h: 0.704, shape: 'arch' },
          { x: 0.565, y: 0.13, w: 0.097, h: 0.334 }, { x: 0.565, y: 0.5, w: 0.097, h: 0.334 },
          { x: 0.838, y: 0.13, w: 0.097, h: 0.334 }, { x: 0.838, y: 0.5, w: 0.097, h: 0.334 }
        ]},
        { id: '10-art-dual-5diamond', name: '★ Dual Diamond Rhombus Mosaic (10 Diamond Photos Spread)', rects: [
          { x: 0.174, y: 0.183, w: 0.151, h: 0.598, shape: 'diamond' }, { x: 0.099, y: 0.183, w: 0.092, h: 0.282, shape: 'diamond' },
          { x: 0.099, y: 0.5, w: 0.092, h: 0.282, shape: 'diamond' }, { x: 0.309, y: 0.183, w: 0.092, h: 0.282, shape: 'diamond' },
          { x: 0.309, y: 0.5, w: 0.092, h: 0.282, shape: 'diamond' }, { x: 0.674, y: 0.183, w: 0.151, h: 0.598, shape: 'diamond' },
          { x: 0.599, y: 0.183, w: 0.092, h: 0.282, shape: 'diamond' }, { x: 0.599, y: 0.5, w: 0.092, h: 0.282, shape: 'diamond' },
          { x: 0.809, y: 0.183, w: 0.092, h: 0.282, shape: 'diamond' }, { x: 0.809, y: 0.5, w: 0.092, h: 0.282, shape: 'diamond' }
        ]},
        { id: '10-art-dual-5editorial-slices', name: '★ Dual 5-Editorial Slices (10 Photos Magazine Spread)', rects: [
          { x: 0.061, y: 0.236, w: 0.076, h: 0.528 }, { x: 0.137, y: 0.236, w: 0.076, h: 0.528 },
          { x: 0.212, y: 0.236, w: 0.076, h: 0.528 }, { x: 0.288, y: 0.236, w: 0.076, h: 0.528 },
          { x: 0.363, y: 0.236, w: 0.076, h: 0.528 }, { x: 0.561, y: 0.236, w: 0.076, h: 0.528 },
          { x: 0.637, y: 0.236, w: 0.076, h: 0.528 }, { x: 0.712, y: 0.236, w: 0.076, h: 0.528 },
          { x: 0.788, y: 0.236, w: 0.076, h: 0.528 }, { x: 0.863, y: 0.236, w: 0.076, h: 0.528 }
        ]}
      ]
    };
  }

  /**
   * Horizontally mirrors a layout (Left page becomes right page).
   */
  flipLayoutHorizontal(layout) {
    const flippedRects = layout.rects.map(r => ({
      ...r,
      x: Number((1.0 - (r.x + r.w)).toFixed(4)),
      y: r.y,
      w: r.w,
      h: r.h,
      shape: r.shape || 'rectangle'
    }));
    return {
      id: `${layout.id}-flip-h`,
      name: `${layout.name} (Flipped H)`,
      isCustom: Boolean(layout.isCustom),
      rects: flippedRects
    };
  }

  /**
   * Vertically mirrors a layout (Top becomes bottom).
   */
  flipLayoutVertical(layout) {
    const flippedRects = layout.rects.map(r => ({
      x: r.x,
      y: Number((1.0 - (r.y + r.h)).toFixed(4)),
      w: r.w,
      h: r.h
    }));
    return {
      id: `${layout.id}-flip-v`,
      name: `${layout.name} (Flipped V)`,
      rects: flippedRects
    };
  }

  /**
   * Analyzes an array of photos and returns an orientation profile:
   * landscape (wide), portrait (tall), square counts, and dominant style.
   */
  getPhotoOrientationProfile(photos) {
    if (!photos || photos.length === 0) {
      return { landscape: 0, portrait: 0, square: 0, total: 0, dominant: 'all' };
    }
    let landscape = 0, portrait = 0, square = 0;
    photos.forEach(p => {
      const asp = p.aspect || (p.width && p.height ? p.width / p.height : 1.33);
      if (asp > 1.15) landscape++;
      else if (asp < 0.85) portrait++;
      else square++;
    });
    let dominant = 'all';
    if (landscape > portrait && landscape > square) dominant = 'landscape';
    else if (portrait > landscape && portrait > square) dominant = 'portrait';
    return { landscape, portrait, square, total: photos.length, dominant };
  }

  /**
   * Analyzes a layout template and returns its slot orientation profile.
   */
  getLayoutOrientationProfile(template, spreadAspect = 2.0) {
    if (!template || !template.rects || template.rects.length === 0) {
      return { landscape: 0, portrait: 0, square: 0, dominant: 'all' };
    }
    let landscape = 0, portrait = 0, square = 0;
    template.rects.forEach(r => {
      const slotAspect = (r.w * spreadAspect) / Math.max(0.001, r.h);
      if (slotAspect > 1.15) landscape++;
      else if (slotAspect < 0.85) portrait++;
      else square++;
    });
    let dominant = 'all';
    if (landscape > portrait) dominant = 'landscape';
    else if (portrait > landscape) dominant = 'portrait';
    return { landscape, portrait, square, dominant };
  }

  /**
   * Evaluates whether a layout template is predominantly composed of
   * Landscape (wide) rectangles or Portrait (tall) rectangles.
   */
  getTemplateDominantOrientation(template) {
    return this.getLayoutOrientationProfile(template).dominant;
  }

  /**
   * Returns a rich catalog of realistic, aesthetically proportioned single-page
   * layout recipes for K photos (0 <= K <= 12).
   * Rectangles are normalized [0..1] within that single page.
   */
  _createBalancedGridTemplate(count, spreadAspect = 2.0) {
    if (count <= 0) return null;
    const leftCount = Math.ceil(count / 2);
    const rightCount = count - leftCount;

    const generateSheetGrid = (numPhotos, isRightSheet) => {
      if (numPhotos <= 0) return [];
      const cols = numPhotos <= 2 ? numPhotos : (numPhotos <= 6 ? 2 : (numPhotos <= 12 ? 3 : 4));
      const rows = Math.ceil(numPhotos / cols);

      const sheetStartX = isRightSheet ? 0.52 : 0.04;
      const sheetWidth = 0.44;
      const sheetStartY = 0.06;
      const sheetHeight = 0.88;
      const gapX = 0.015;
      const gapY = 0.02;

      const cellW = (sheetWidth - (cols - 1) * gapX) / cols;
      const cellH = (sheetHeight - (rows - 1) * gapY) / rows;

      const rects = [];
      for (let i = 0; i < numPhotos; i++) {
        const c = i % cols;
        const r = Math.floor(i / cols);
        const x = Number((sheetStartX + c * (cellW + gapX)).toFixed(4));
        const y = Number((sheetStartY + r * (cellH + gapY)).toFixed(4));
        const w = Number(cellW.toFixed(4));
        const h = Number(cellH.toFixed(4));
        rects.push({ x, y, w, h, width: w, height: h });
      }
      return rects;
    };

    const leftRects = generateSheetGrid(leftCount, false);
    const rightRects = generateSheetGrid(rightCount, true);
    const allRects = [...leftRects, ...rightRects];

    return {
      id: `auto-grid-${count}`,
      name: `Auto Grid (${count} Photos)`,
      rects: allRects,
      dominantOrientation: 'all',
      orientationProfile: { landscape: Math.ceil(count / 2), portrait: Math.floor(count / 2), square: 0, dominant: 'all' }
    };
  }

  /**
   * Generates layout library for the given photo count strictly from authentic
   * user-uploaded layout designs (from temps and temps 2 folders) plus horizontal mirrors.
   */
  _generateRealisticLayoutLibrary(count, spreadAspect = 2.0) {
    if (this._fullLibraryCache[count]) {
      return this._fullLibraryCache[count];
    }

    const pool = [];
    const seenSignatures = new Set();

    const addLayout = (t, dominantOverride = null) => {
      if (!t || !t.rects || t.rects.length !== count) return false;

      // Validate rects: ensure realistic photobook proportions and STRICT NO-MIDDLE-LINE rule
      const valid = t.rects.every(r => {
        const wVal = r.w !== undefined ? r.w : r.width;
        const hVal = r.h !== undefined ? r.h : r.height;
        if (wVal <= 0.01 || hVal <= 0.01) return false;
        // Strict Sheet Separation: No picture is allowed to cross or span the middle line!
        const spansMiddleLine = (r.x < 0.495 && (r.x + wVal) > 0.505);
        if (spansMiddleLine) return false;
        return true;
      });
      if (!valid) return false;

      const normRects = t.rects.map(r => {
        const wVal = r.w !== undefined ? r.w : (r.width !== undefined ? r.width : 0.4);
        const hVal = r.h !== undefined ? r.h : (r.height !== undefined ? r.height : 0.4);
        const normW = Math.max(0.01, Math.min(1.0, Number(Number(wVal).toFixed(4))));
        const normH = Math.max(0.01, Math.min(1.0, Number(Number(hVal).toFixed(4))));
        return {
          ...r,
          x: Math.max(0, Math.min(0.995, Number((r.x || 0).toFixed(4)))),
          y: Math.max(0, Math.min(0.995, Number((r.y || 0).toFixed(4)))),
          w: normW,
          h: normH,
          width: normW,
          height: normH,
          shape: r.shape || 'rectangle'
        };
      });

      // Deduplication signature
      const sig = normRects.map(r => [Math.round(r.x * 300), Math.round(r.y * 300), Math.round(r.w * 300), Math.round(r.h * 300)].join(',')).join(';');
      if (seenSignatures.has(sig)) return false;
      seenSignatures.add(sig);

      const orientationProfile = this.getLayoutOrientationProfile(t, spreadAspect);
      const dominant = dominantOverride || orientationProfile.dominant;

      pool.push({
        id: t.id || ('uploaded-layout-' + count + '-' + (pool.length + 1)),
        name: t.name || ('Uploaded Layout #' + (pool.length + 1)),
        rects: normRects,
        dominantOrientation: dominant,
        orientationProfile: orientationProfile
      });
      return true;
    };

    // 1. Add authentic hand-curated templates copied from uploaded images (temps & temps 2)
    if (this.templates[count] && this.templates[count].length > 0) {
      this.templates[count].forEach(t => addLayout(t));
    }

    // 2. Add horizontal mirrors for all asymmetrical uploaded layouts in pool
    const poolSnapshot = [...pool];
    poolSnapshot.forEach(layout => {
      const flipped = this.flipLayoutHorizontal(layout);
      addLayout(flipped);
    });

    // 3. Fallback: if pool is empty for this photo count, generate a balanced grid template
    if (pool.length === 0 && count > 0) {
      const fallback = this._createBalancedGridTemplate(count, spreadAspect);
      if (fallback) pool.push(fallback);
    }

    this._fullLibraryCache[count] = pool;
    return pool;
  }

  /**
   * Retrieves available templates for a specific photo count (1 to 12).
   * Strictly returns authentic uploaded template designs.
   * Dynamically evaluates, scores, and sorts layouts according to the
   * orientation style of the provided photos (Landscape vs Portrait).
   */
  getTemplatesForCount(count, orientationFilter = 'all', photos = null, spreadAspect = 2.0) {
    const rawTemplates = this._generateRealisticLayoutLibrary(count, spreadAspect);

    // If photos are provided, dynamically rank templates to match photos' orientations
    let processed = rawTemplates;
    if (photos && photos.length > 0) {
      const photoProfile = this.getPhotoOrientationProfile(photos);

      const scored = rawTemplates.map(layout => {
        const match = this.matchPhotosToLayout(photos, layout, spreadAspect);
        const slotProfile = layout.orientationProfile || this.getLayoutOrientationProfile(layout, spreadAspect);

        // Orientation mismatch penalty
        const orientMismatch = Math.abs(photoProfile.landscape - slotProfile.landscape) +
                               Math.abs(photoProfile.portrait - slotProfile.portrait);

        // Combined penalty score (lower is better fit)
        const totalScore = match.score + (orientMismatch * 0.7);
        const matchPercent = Math.max(50, Math.min(100, Math.round(100 - totalScore * 14)));
        const isOrientationMatch = (orientMismatch === 0);

        return {
          ...layout,
          matchScore: Number(totalScore.toFixed(3)),
          matchPercent: matchPercent,
          isOrientationMatch: isOrientationMatch,
          assignment: match.assignment
        };
      });

      // Sort: Exact orientation matches first, then lowest aspect ratio penalty
      scored.sort((a, b) => {
        if (a.isOrientationMatch && !b.isOrientationMatch) return -1;
        if (!a.isOrientationMatch && b.isOrientationMatch) return 1;
        return a.matchScore - b.matchScore;
      });

      processed = scored;
    }

    // Filter by requested orientation mode
    if (orientationFilter === 'best-match') {
      const best = processed.filter(t => t.matchPercent >= 75 || t.isOrientationMatch);
      return best.length >= 1 ? best : processed;
    }

    if (orientationFilter === 'landscape') {
      const wide = processed.filter(t => t.dominantOrientation === 'landscape' || (t.orientationProfile && t.orientationProfile.landscape >= t.orientationProfile.portrait));
      return wide.length >= 1 ? wide : processed;
    }

    if (orientationFilter === 'portrait') {
      const tall = processed.filter(t => t.dominantOrientation === 'portrait' || (t.orientationProfile && t.orientationProfile.portrait >= t.orientationProfile.landscape));
      return tall.length >= 1 ? tall : processed;
    }

    return processed;
  }

  /**
   * Random layout selection from the authentic uploaded template pool.
   * Cycles to a different variation on every press while maintaining layout fidelity.
   */
  generateRandomLayout(count, currentId = null) {
    const list = this._generateRealisticLayoutLibrary(count);
    if (!list || list.length === 0) {
      return { id: 'default-' + count, name: 'Layout (' + count + ' photos)', rects: [] };
    }
    const pool = currentId ? list.filter(l => l.id !== currentId) : list;
    const candidates = pool.length > 0 ? pool : list;
    const idx = Math.floor(Math.random() * candidates.length);
    return candidates[idx];
  }


  rankLayoutsForPhotos(photos, candidateLayouts, spreadAspect = 2.0) {
    const scored = candidateLayouts.map(layout => {
      const match = this.matchPhotosToLayout(photos, layout, spreadAspect);
      return {
        layout: layout,
        assignment: match.assignment,
        score: match.score
      };
    });

    scored.sort((a, b) => a.score - b.score);
    return scored;
  }

  /**
   * Optimal assignment of photos to rectangle slots in a layout.
   * When preserveOrder is true, photos are assigned strictly 1:1 in provided chronological order (Photo 1 -> Slot 1).
   * When preserveOrder is false, matches photos to slots by minimizing aspect ratio cropping.
   */
  matchPhotosToLayout(photos, layout, spreadAspect = 2.0, preserveOrder = true) {
    const n = Math.min(photos.length, layout.rects.length);
    const rects = layout.rects.slice(0, n);

    if (preserveOrder) {
      // Order rectangles by natural visual reading order:
      // Left page (x < 0.5) first, Right page (x >= 0.5) second;
      // Within each page: top-to-bottom, then left-to-right.
      const orderedRectIndices = rects.map((r, idx) => ({ r, idx })).sort((a, b) => {
        const pageA = (a.r.x + a.r.w / 2) < 0.5 ? 0 : 1;
        const pageB = (b.r.x + b.r.w / 2) < 0.5 ? 0 : 1;
        if (pageA !== pageB) return pageA - pageB;

        const rowA = Math.floor((a.r.y + 0.01) * 8);
        const rowB = Math.floor((b.r.y + 0.01) * 8);
        if (rowA !== rowB) return a.r.y - b.r.y;

        return a.r.x - b.r.x;
      }).map(item => item.idx);

      const assignment = [];
      let totalPenalty = 0;
      for (let i = 0; i < n; i++) {
        const slotIdx = orderedRectIndices[i];
        const rect = rects[slotIdx];
        const slotAspect = (rect.w * spreadAspect) / (rect.h || 0.001);
        const p = photos[i];
        const photoAspect = p ? (p.aspect || (p.width && p.height ? p.width / p.height : 1.33)) : 1.33;
        const penalty = Math.abs(Math.log(photoAspect / slotAspect));
        totalPenalty += penalty;
        assignment.push({
          photoIndex: i,
          slotIndex: slotIdx,
          rect: rect,
          penalty: penalty
        });
      }
      return { assignment, score: totalPenalty };
    }

    const slotAspects = rects.map(r => (r.w * spreadAspect) / (r.h || 0.001));
    const photoAspects = photos.slice(0, n).map(p => {
      if (p.aspect) return p.aspect;
      if (p.width && p.height) return p.width / p.height;
      return 1.33; // default landscape 4:3
    });

    const unassignedPhotos = photoAspects.map((aspect, idx) => ({ aspect, idx }));
    const assignment = new Array(n).fill(null);
    let totalScore = 0;

    for (let slotIdx = 0; slotIdx < n; slotIdx++) {
      const slotAspect = slotAspects[slotIdx];
      let bestPhotoPos = 0;
      let minPenalty = Infinity;

      for (let pPos = 0; pPos < unassignedPhotos.length; pPos++) {
        const photo = unassignedPhotos[pPos];
        const penalty = Math.abs(Math.log(photo.aspect / slotAspect));
        if (penalty < minPenalty) {
          minPenalty = penalty;
          bestPhotoPos = pPos;
        }
      }

      const chosen = unassignedPhotos.splice(bestPhotoPos, 1)[0];
      assignment[slotIdx] = {
        photoIndex: chosen.idx,
        slotIndex: slotIdx,
        rect: rects[slotIdx],
        penalty: minPenalty
      };
      totalScore += minPenalty;
    }

    return { assignment, score: totalScore };
  }

  /**
   * Normalizes layout rectangles to seamless continuous grid partitions (0..1),
   * removing any baked-in template gaps so that 0px gap produces 100% touching frames.
   */
  _getTempNewCroppedSpreadsTemplates() {
    return {
      // 1 Photos (Cropped Spread Layouts)
      1: [
        { id: 'cropped-spread-006', name: '📖 Spread Layout Img 3814 06', rects: [ { x: 0.0087, y: 0.0259, w: 0.9913, h: 0.9655 } ] },
        { id: 'cropped-spread-013', name: '📖 Spread Layout Img 3814 13', rects: [ { x: 0.0391, y: 0.0517, w: 0.9261, h: 0.931 } ] },
        { id: 'cropped-spread-043', name: '📖 Spread Layout Img 3821 01', rects: [ { x: 0.0, y: 0.0, w: 1.0, h: 1.0 } ] },
        { id: 'cropped-spread-044', name: '📖 Spread Layout Img 3821 02', rects: [ { x: 0.0, y: 0.0, w: 1.0, h: 1.0 } ] },
        { id: 'cropped-spread-045', name: '📖 Spread Layout Img 3821 03', rects: [ { x: 0.0141, y: 0.0379, w: 0.9789, h: 0.9526 } ] },
        { id: 'cropped-spread-047', name: '📖 Spread Layout Img 3821 05', rects: [ { x: 0.0, y: 0.0, w: 1.0, h: 1.0 } ] },
        { id: 'cropped-spread-048', name: '📖 Spread Layout Img 3821 06', rects: [ { x: 0.0, y: 0.0, w: 1.0, h: 1.0 } ] },
        { id: 'cropped-spread-051', name: '📖 Spread Layout Img 3821 09', rects: [ { x: 0.0, y: 0.0, w: 1.0, h: 1.0 } ] },
        { id: 'cropped-spread-052', name: '📖 Spread Layout Img 3821 10', rects: [ { x: 0.0, y: 0.0, w: 1.0, h: 1.0 } ] },
        { id: 'cropped-spread-070', name: '📖 Spread Layout Img 3823 03', rects: [ { x: 0.0, y: 0.1528, w: 0.9796, h: 0.6806 } ] },
        { id: 'cropped-spread-073', name: '📖 Spread Layout Img 3823 12', rects: [ { x: 0.0544, y: 0.0, w: 0.9252, h: 0.9861 } ] },
        { id: 'cropped-spread-075', name: '📖 Spread Layout Img 3823 14', rects: [ { x: 0.0544, y: 0.0417, w: 0.8707, h: 0.9028 } ] },
        { id: 'cropped-spread-080', name: '📖 Spread Layout Img 3824 08', rects: [ { x: 0.0, y: 0.1014, w: 1.0, h: 0.8261 } ] },
        { id: 'cropped-spread-082', name: '📖 Spread Layout Img 3824 10', rects: [ { x: 0.0, y: 0.0435, w: 1.0, h: 0.942 } ] },
        { id: 'cropped-spread-083', name: '📖 Spread Layout Img 3824 11', rects: [ { x: 0.0432, y: 0.1594, w: 0.9137, h: 0.6667 } ] },
        { id: 'cropped-spread-085', name: '📖 Spread Layout Img 3824 13', rects: [ { x: 0.0, y: 0.0435, w: 1.0, h: 0.8986 } ] },
        { id: 'cropped-spread-087', name: '📖 Spread Layout Img 3824 15', rects: [ { x: 0.0719, y: 0.058, w: 0.8705, h: 0.8696 } ] },
        { id: 'cropped-spread-098', name: '📖 Spread Layout Img 3825 11', rects: [ { x: 0.0208, y: 0.117, w: 0.9792, h: 0.766 } ] },
        { id: 'cropped-spread-108', name: '📖 Spread Layout Img 3858 01', rects: [ { x: 0.0294, y: 0.0625, w: 0.9412, h: 0.8713 } ] },
        { id: 'cropped-spread-109', name: '📖 Spread Layout Img 3859 01', rects: [ { x: 0.0, y: 0.0, w: 1.0, h: 1.0 } ] },
        { id: 'cropped-spread-110', name: '📖 Spread Layout Img 3859 02', rects: [ { x: 0.0, y: 0.0, w: 1.0, h: 1.0 } ] },
        { id: 'cropped-spread-111', name: '📖 Spread Layout Img 3859 03', rects: [ { x: 0.0, y: 0.0, w: 1.0, h: 1.0 } ] },
        { id: 'cropped-spread-112', name: '📖 Spread Layout Img 3859 04', rects: [ { x: 0.0, y: 0.0, w: 1.0, h: 1.0 } ] },
        { id: 'cropped-spread-113', name: '📖 Spread Layout Img 3859 05', rects: [ { x: 0.0, y: 0.0, w: 1.0, h: 1.0 } ] },
        { id: 'cropped-spread-114', name: '📖 Spread Layout Img 3859 06', rects: [ { x: 0.0, y: 0.0, w: 1.0, h: 1.0 } ] },
        { id: 'cropped-spread-115', name: '📖 Spread Layout Img 3859 07', rects: [ { x: 0.0, y: 0.0, w: 1.0, h: 1.0 } ] },
        { id: 'cropped-spread-116', name: '📖 Spread Layout Img 3859 08', rects: [ { x: 0.0, y: 0.0, w: 1.0, h: 1.0 } ] },
        { id: 'cropped-spread-117', name: '📖 Spread Layout Img 3859 09', rects: [ { x: 0.0, y: 0.0, w: 1.0, h: 1.0 } ] },
        { id: 'cropped-spread-118', name: '📖 Spread Layout Img 3859 10', rects: [ { x: 0.0, y: 0.0, w: 1.0, h: 1.0 } ] }
      ],
      // 2 Photos (Cropped Spread Layouts)
      2: [
        { id: 'cropped-spread-001', name: '📖 Spread Layout Img 3814 01', rects: [ { x: 0.513, y: 0.0431, w: 0.4739, h: 0.9224 }, { x: 0.0043, y: 0.0776, w: 0.4913, h: 0.8448 } ] },
        { id: 'cropped-spread-002', name: '📖 Spread Layout Img 3814 02', rects: [ { x: 0.0174, y: 0.0345, w: 0.4739, h: 0.9397 }, { x: 0.513, y: 0.0345, w: 0.4696, h: 0.931 } ] },
        { id: 'cropped-spread-003', name: '📖 Spread Layout Img 3814 03', rects: [ { x: 0.513, y: 0.0517, w: 0.4783, h: 0.9138 }, { x: 0.0217, y: 0.1466, w: 0.4696, h: 0.7155 } ] },
        { id: 'cropped-spread-004', name: '📖 Spread Layout Img 3814 04', rects: [ { x: 0.513, y: 0.0345, w: 0.4739, h: 0.9397 }, { x: 0.0043, y: 0.181, w: 0.5043, h: 0.6121 } ] },
        { id: 'cropped-spread-005', name: '📖 Spread Layout Img 3814 05', rects: [ { x: 0.0913, y: 0.0603, w: 0.3348, h: 0.8966 }, { x: 0.5087, y: 0.0603, w: 0.487, h: 0.8879 } ] },
        { id: 'cropped-spread-007', name: '📖 Spread Layout Img 3814 07', rects: [ { x: 0.5826, y: 0.0259, w: 0.3348, h: 0.9741 }, { x: 0.0087, y: 0.0603, w: 0.4957, h: 0.8966 } ] },
        { id: 'cropped-spread-008', name: '📖 Spread Layout Img 3814 08', rects: [ { x: 0.0043, y: 0.0172, w: 0.487, h: 0.9828 }, { x: 0.5043, y: 0.2672, w: 0.487, h: 0.4828 } ] },
        { id: 'cropped-spread-009', name: '📖 Spread Layout Img 3814 09', rects: [ { x: 0.5913, y: 0.0172, w: 0.3304, h: 0.9828 }, { x: 0.0609, y: 0.1293, w: 0.387, h: 0.7586 } ] },
        { id: 'cropped-spread-010', name: '📖 Spread Layout Img 3814 10', rects: [ { x: 0.0957, y: 0.0431, w: 0.3304, h: 0.931 }, { x: 0.4957, y: 0.25, w: 0.5043, h: 0.5086 } ] },
        { id: 'cropped-spread-011', name: '📖 Spread Layout Img 3814 11', rects: [ { x: 0.0304, y: 0.0431, w: 0.313, h: 0.931 }, { x: 0.3478, y: 0.0431, w: 0.6304, h: 0.9397 } ] },
        { id: 'cropped-spread-012', name: '📖 Spread Layout Img 3814 12', rects: [ { x: 0.0174, y: 0.0431, w: 0.4739, h: 0.9397 }, { x: 0.513, y: 0.1552, w: 0.4696, h: 0.7069 } ] },
        { id: 'cropped-spread-014', name: '📖 Spread Layout Img 3814 14', rects: [ { x: 0.0217, y: 0.0517, w: 0.4739, h: 0.931 }, { x: 0.513, y: 0.0517, w: 0.4739, h: 0.931 } ] },
        { id: 'cropped-spread-018', name: '📖 Spread Layout Img 3815 05', rects: [ { x: 0.0407, y: 0.1744, w: 0.436, h: 0.6512 }, { x: 0.4797, y: 0.1686, w: 0.4855, h: 0.657 } ] },
        { id: 'cropped-spread-019', name: '📖 Spread Layout Img 3815 06', rects: [ { x: 0.0523, y: 0.1105, w: 0.6105, h: 0.7733 }, { x: 0.6628, y: 0.1105, w: 0.282, h: 0.7733 } ] },
        { id: 'cropped-spread-022', name: '📖 Spread Layout Img 3815 09', rects: [ { x: 0.0523, y: 0.1105, w: 0.3953, h: 0.7733 }, { x: 0.5523, y: 0.1105, w: 0.3983, h: 0.7733 } ] },
        { id: 'cropped-spread-046', name: '📖 Spread Layout Img 3821 04', rects: [ { x: 0.0, y: 0.0047, w: 1.0, h: 0.9953 }, { x: 0.7083, y: 0.0095, w: 0.2917, h: 0.8009 } ] },
        { id: 'cropped-spread-050', name: '📖 Spread Layout Img 3821 08', rects: [ { x: 0.0, y: 0.0, w: 1.0, h: 1.0 }, { x: 0.4095, y: 0.0332, w: 0.1951, h: 0.4502 } ] },
        { id: 'cropped-spread-054', name: '📖 Spread Layout Img 3821 12', rects: [ { x: 0.0, y: 0.0, w: 1.0, h: 1.0 }, { x: 0.2127, y: 0.5118, w: 0.1845, h: 0.455 } ] },
        { id: 'cropped-spread-060', name: '📖 Spread Layout Img 3822 06', rects: [ { x: 0.0, y: 0.0, w: 1.0, h: 1.0 }, { x: 0.1304, y: 0.0, w: 0.8304, h: 0.9828 } ] },
        { id: 'cropped-spread-064', name: '📖 Spread Layout Img 3822 11', rects: [ { x: 0.0, y: 0.0, w: 1.0, h: 1.0 }, { x: 0.0609, y: 0.0431, w: 0.9391, h: 0.9224 } ] },
        { id: 'cropped-spread-065', name: '📖 Spread Layout Img 3822 12', rects: [ { x: 0.0, y: 0.0, w: 1.0, h: 1.0 }, { x: 0.0696, y: 0.1552, w: 0.9304, h: 0.7155 } ] },
        { id: 'cropped-spread-067', name: '📖 Spread Layout Img 3822 14', rects: [ { x: 0.0, y: 0.0, w: 1.0, h: 1.0 }, { x: 0.0565, y: 0.1897, w: 0.9435, h: 0.6466 } ] },
        { id: 'cropped-spread-068', name: '📖 Spread Layout Img 3822 15', rects: [ { x: 0.0, y: 0.0, w: 1.0, h: 1.0 }, { x: 0.1087, y: 0.0776, w: 0.8696, h: 0.8707 } ] },
        { id: 'cropped-spread-069', name: '📖 Spread Layout Img 3823 01', rects: [ { x: 0.5034, y: 0.0, w: 0.4966, h: 1.0 }, { x: 0.0952, y: 0.2222, w: 0.2857, h: 0.5556 } ] },
        { id: 'cropped-spread-071', name: '📖 Spread Layout Img 3823 05', rects: [ { x: 0.0136, y: 0.0, w: 0.483, h: 0.9722 }, { x: 0.6463, y: 0.0972, w: 0.2041, h: 0.7917 } ] },
        { id: 'cropped-spread-072', name: '📖 Spread Layout Img 3823 09', rects: [ { x: 0.0, y: 0.0, w: 0.4898, h: 1.0 }, { x: 0.619, y: 0.2222, w: 0.2721, h: 0.5556 } ] },
        { id: 'cropped-spread-074', name: '📖 Spread Layout Img 3823 13', rects: [ { x: 0.0068, y: 0.0278, w: 0.4694, h: 0.9583 }, { x: 0.5034, y: 0.0278, w: 0.4694, h: 0.9583 } ] },
        { id: 'cropped-spread-077', name: '📖 Spread Layout Img 3824 05', rects: [ { x: 0.5036, y: 0.0, w: 0.4964, h: 1.0 }, { x: 0.1007, y: 0.1014, w: 0.295, h: 0.7971 } ] },
        { id: 'cropped-spread-078', name: '📖 Spread Layout Img 3824 06', rects: [ { x: 0.036, y: 0.1739, w: 0.4317, h: 0.6377 }, { x: 0.5468, y: 0.1739, w: 0.4317, h: 0.6377 } ] },
        { id: 'cropped-spread-079', name: '📖 Spread Layout Img 3824 07', rects: [ { x: 0.0576, y: 0.0, w: 0.3741, h: 1.0 }, { x: 0.5683, y: 0.0, w: 0.3741, h: 1.0 } ] },
        { id: 'cropped-spread-081', name: '📖 Spread Layout Img 3824 09', rects: [ { x: 0.036, y: 0.058, w: 0.4964, h: 0.8696 }, { x: 0.5612, y: 0.058, w: 0.4173, h: 0.8696 } ] },
        { id: 'cropped-spread-084', name: '📖 Spread Layout Img 3824 12', rects: [ { x: 0.036, y: 0.0725, w: 0.4317, h: 0.8696 }, { x: 0.5683, y: 0.0725, w: 0.3813, h: 0.8696 } ] },
        { id: 'cropped-spread-086', name: '📖 Spread Layout Img 3824 14', rects: [ { x: 0.0863, y: 0.0435, w: 0.3237, h: 0.8841 }, { x: 0.5468, y: 0.058, w: 0.4173, h: 0.8696 } ] },
        { id: 'cropped-spread-101', name: '📖 Spread Layout Img 3825 14', rects: [ { x: 0.7333, y: 0.0106, w: 0.2625, h: 0.9894 }, { x: 0.0708, y: 0.1489, w: 0.6125, h: 0.7128 } ] }
      ],
      // 3 Photos (Cropped Spread Layouts)
      3: [
        { id: 'cropped-spread-021', name: '📖 Spread Layout Img 3815 08', rects: [ { x: 0.064, y: 0.1337, w: 0.3663, h: 0.7151 }, { x: 0.5669, y: 0.1337, w: 0.3663, h: 0.3547 }, { x: 0.5669, y: 0.4942, w: 0.3663, h: 0.3547 } ] },
        { id: 'cropped-spread-024', name: '📖 Spread Layout Img 3815 11', rects: [ { x: 0.0, y: 0.1628, w: 1.0, h: 0.6686 }, { x: 0.5029, y: 0.5, w: 0.2442, h: 0.3314 }, { x: 0.75, y: 0.5, w: 0.25, h: 0.3314 } ] },
        { id: 'cropped-spread-026', name: '📖 Spread Layout Img 3816 01', rects: [ { x: 0.0899, y: 0.0672, w: 0.3221, h: 0.8955 }, { x: 0.5318, y: 0.2164, w: 0.2172, h: 0.5821 }, { x: 0.7603, y: 0.2164, w: 0.2135, h: 0.5896 } ] },
        { id: 'cropped-spread-029', name: '📖 Spread Layout Img 3816 04', rects: [ { x: 0.0225, y: 0.0597, w: 0.4532, h: 0.806 }, { x: 0.5993, y: 0.0597, w: 0.2996, h: 0.3955 }, { x: 0.5993, y: 0.4701, w: 0.2996, h: 0.3881 } ] },
        { id: 'cropped-spread-032', name: '📖 Spread Layout Img 3816 07', rects: [ { x: 0.0262, y: 0.0746, w: 0.4532, h: 0.806 }, { x: 0.5281, y: 0.2761, w: 0.1723, h: 0.3955 }, { x: 0.7116, y: 0.2761, w: 0.2697, h: 0.3881 } ] },
        { id: 'cropped-spread-055', name: '📖 Spread Layout Img 3822 01', rects: [ { x: 0.0, y: 0.0, w: 0.0609, h: 1.0 }, { x: 0.5522, y: 0.1379, w: 0.4478, h: 0.7414 }, { x: 0.0652, y: 0.1466, w: 0.4826, h: 0.7241 } ] },
        { id: 'cropped-spread-056', name: '📖 Spread Layout Img 3822 02', rects: [ { x: 0.0, y: 0.0, w: 0.0435, h: 1.0 }, { x: 0.6696, y: 0.0259, w: 0.3304, h: 0.9741 }, { x: 0.0565, y: 0.1466, w: 0.4826, h: 0.7241 } ] },
        { id: 'cropped-spread-057', name: '📖 Spread Layout Img 3822 03', rects: [ { x: 0.0, y: 0.0, w: 0.0435, h: 1.0 }, { x: 0.0522, y: 0.181, w: 0.3261, h: 0.6552 }, { x: 0.3826, y: 0.181, w: 0.6174, h: 0.6552 } ] },
        { id: 'cropped-spread-058', name: '📖 Spread Layout Img 3822 04', rects: [ { x: 0.0, y: 0.0, w: 1.0, h: 1.0 }, { x: 0.5609, y: 0.0345, w: 0.4391, h: 0.9138 }, { x: 0.1, y: 0.1983, w: 0.4, h: 0.5862 } ] },
        { id: 'cropped-spread-059', name: '📖 Spread Layout Img 3822 05', rects: [ { x: 0.0, y: 0.0, w: 1.0, h: 1.0 }, { x: 0.0913, y: 0.1034, w: 0.4, h: 0.7759 }, { x: 0.5913, y: 0.1034, w: 0.3913, h: 0.7759 } ] },
        { id: 'cropped-spread-061', name: '📖 Spread Layout Img 3822 07', rects: [ { x: 0.0, y: 0.0, w: 0.0478, h: 1.0 }, { x: 0.0652, y: 0.1552, w: 0.4783, h: 0.6983 }, { x: 0.5609, y: 0.1552, w: 0.4391, h: 0.6983 } ] },
        { id: 'cropped-spread-062', name: '📖 Spread Layout Img 3822 09', rects: [ { x: 0.0, y: 0.0, w: 0.0435, h: 1.0 }, { x: 0.1217, y: 0.1552, w: 0.3522, h: 0.6897 }, { x: 0.6217, y: 0.1638, w: 0.3435, h: 0.681 } ] },
        { id: 'cropped-spread-063', name: '📖 Spread Layout Img 3822 10', rects: [ { x: 0.0, y: 0.0, w: 1.0, h: 1.0 }, { x: 0.0565, y: 0.1466, w: 0.4913, h: 0.7328 }, { x: 0.5522, y: 0.2672, w: 0.4478, h: 0.4914 } ] },
        { id: 'cropped-spread-066', name: '📖 Spread Layout Img 3822 13', rects: [ { x: 0.0, y: 0.0, w: 1.0, h: 1.0 }, { x: 0.0652, y: 0.0862, w: 0.4739, h: 0.8534 }, { x: 0.5609, y: 0.0862, w: 0.4391, h: 0.8534 } ] },
        { id: 'cropped-spread-076', name: '📖 Spread Layout Img 3823 15', rects: [ { x: 0.0, y: 0.0, w: 0.0408, h: 1.0 }, { x: 0.0272, y: 0.0139, w: 0.4762, h: 0.9722 }, { x: 0.7143, y: 0.3889, w: 0.2857, h: 0.5972 } ] },
        { id: 'cropped-spread-092', name: '📖 Spread Layout Img 3825 05', rects: [ { x: 0.0167, y: 0.0, w: 0.725, h: 0.9894 }, { x: 0.7792, y: 0.0851, w: 0.1792, h: 0.4043 }, { x: 0.7792, y: 0.5106, w: 0.1792, h: 0.3936 } ] },
        { id: 'cropped-spread-095', name: '📖 Spread Layout Img 3825 08', rects: [ { x: 0.0167, y: 0.0106, w: 0.4917, h: 0.9894 }, { x: 0.5917, y: 0.2128, w: 0.1583, h: 0.5851 }, { x: 0.7583, y: 0.2128, w: 0.1583, h: 0.5851 } ] },
        { id: 'cropped-spread-099', name: '📖 Spread Layout Img 3825 12', rects: [ { x: 0.0292, y: 0.0106, w: 0.3292, h: 0.9894 }, { x: 0.3625, y: 0.0106, w: 0.3208, h: 0.9894 }, { x: 0.6875, y: 0.0106, w: 0.3125, h: 0.9894 } ] },
        { id: 'cropped-spread-100', name: '📖 Spread Layout Img 3825 13', rects: [ { x: 0.0, y: 0.1596, w: 0.1917, h: 0.6915 }, { x: 0.1958, y: 0.1596, w: 0.5875, h: 0.6915 }, { x: 0.7875, y: 0.1596, w: 0.1917, h: 0.6915 } ] },
        { id: 'cropped-spread-105', name: '📖 Spread Layout Img 3825 18', rects: [ { x: 0.0167, y: 0.0106, w: 0.4917, h: 0.9894 }, { x: 0.5125, y: 0.0106, w: 0.2375, h: 0.9894 }, { x: 0.7542, y: 0.0106, w: 0.2417, h: 0.9894 } ] }
      ],
      // 4 Photos (Cropped Spread Layouts)
      4: [
        { id: 'cropped-spread-016', name: '📖 Spread Layout Img 3815 03', rects: [ { x: 0.2238, y: 0.1047, w: 0.5727, h: 0.7849 }, { x: 0.8023, y: 0.1105, w: 0.1744, h: 0.3372 }, { x: 0.6221, y: 0.4535, w: 0.3547, h: 0.4302 }, { x: 0.0988, y: 0.7907, w: 0.0843, h: 0.0988 } ] },
        { id: 'cropped-spread-017', name: '📖 Spread Layout Img 3815 04', rects: [ { x: 0.0233, y: 0.1512, w: 0.2297, h: 0.6919 }, { x: 0.2558, y: 0.1512, w: 0.2297, h: 0.6919 }, { x: 0.5116, y: 0.1512, w: 0.2297, h: 0.6919 }, { x: 0.7442, y: 0.1512, w: 0.2297, h: 0.6919 } ] },
        { id: 'cropped-spread-023', name: '📖 Spread Layout Img 3815 10', rects: [ { x: 0.0785, y: 0.1163, w: 0.1948, h: 0.2558 }, { x: 0.2762, y: 0.1163, w: 0.6424, h: 0.7733 }, { x: 0.0814, y: 0.3779, w: 0.1919, h: 0.25 }, { x: 0.0785, y: 0.6337, w: 0.1948, h: 0.2558 } ] },
        { id: 'cropped-spread-027', name: '📖 Spread Layout Img 3816 02', rects: [ { x: 0.1348, y: 0.209, w: 0.3596, h: 0.597 }, { x: 0.0075, y: 0.3209, w: 0.1236, h: 0.3806 }, { x: 0.5019, y: 0.3209, w: 0.1798, h: 0.3806 }, { x: 0.6929, y: 0.3209, w: 0.2959, h: 0.3806 } ] },
        { id: 'cropped-spread-030', name: '📖 Spread Layout Img 3816 05', rects: [ { x: 0.0225, y: 0.0373, w: 0.6816, h: 0.806 }, { x: 0.7266, y: 0.1045, w: 0.2472, h: 0.3284 }, { x: 0.7266, y: 0.4552, w: 0.2472, h: 0.3284 }, { x: 0.0, y: 0.9403, w: 1.0, h: 0.0597 } ] },
        { id: 'cropped-spread-036', name: '📖 Spread Layout Img 3816 11', rects: [ { x: 0.5281, y: 0.1269, w: 0.4532, h: 0.806 }, { x: 0.0487, y: 0.1716, w: 0.1648, h: 0.3507 }, { x: 0.2172, y: 0.1716, w: 0.236, h: 0.3507 }, { x: 0.0487, y: 0.5373, w: 0.4045, h: 0.3582 } ] },
        { id: 'cropped-spread-037', name: '📖 Spread Layout Img 3816 12', rects: [ { x: 0.0861, y: 0.1269, w: 0.3221, h: 0.403 }, { x: 0.5243, y: 0.1269, w: 0.4532, h: 0.806 }, { x: 0.0861, y: 0.5373, w: 0.1573, h: 0.3955 }, { x: 0.2509, y: 0.5373, w: 0.1573, h: 0.3955 } ] },
        { id: 'cropped-spread-049', name: '📖 Spread Layout Img 3821 07', rects: [ { x: 0.0, y: 0.0, w: 1.0, h: 1.0 }, { x: 0.0141, y: 0.0332, w: 0.3814, h: 0.9336 }, { x: 0.406, y: 0.0332, w: 0.58, h: 0.455 }, { x: 0.4077, y: 0.5118, w: 0.5852, h: 0.455 } ] },
        { id: 'cropped-spread-088', name: '📖 Spread Layout Img 3825 01', rects: [ { x: 0.825, y: 0.1915, w: 0.1625, h: 0.5319 }, { x: 0.4958, y: 0.2021, w: 0.1583, h: 0.5213 }, { x: 0.6625, y: 0.2021, w: 0.1583, h: 0.5213 }, { x: 0.7708, y: 0.766, w: 0.1167, h: 0.0745 } ] },
        { id: 'cropped-spread-091', name: '📖 Spread Layout Img 3825 04', rects: [ { x: 0.0, y: 0.1383, w: 0.325, h: 0.7234 }, { x: 0.3292, y: 0.1489, w: 0.3208, h: 0.3404 }, { x: 0.6583, y: 0.1489, w: 0.3208, h: 0.7128 }, { x: 0.3292, y: 0.5106, w: 0.325, h: 0.3404 } ] },
        { id: 'cropped-spread-093', name: '📖 Spread Layout Img 3825 06', rects: [ { x: 0.0167, y: 0.0, w: 0.2292, h: 0.9894 }, { x: 0.2667, y: 0.0, w: 0.2292, h: 0.9894 }, { x: 0.5167, y: 0.0, w: 0.2292, h: 0.9894 }, { x: 0.7667, y: 0.0, w: 0.2292, h: 0.9894 } ] },
        { id: 'cropped-spread-096', name: '📖 Spread Layout Img 3825 09', rects: [ { x: 0.0167, y: 0.0106, w: 0.2417, h: 0.9894 }, { x: 0.5042, y: 0.0106, w: 0.4917, h: 0.9894 }, { x: 0.2833, y: 0.3298, w: 0.0958, h: 0.3511 }, { x: 0.3875, y: 0.3298, w: 0.0917, h: 0.3511 } ] },
        { id: 'cropped-spread-102', name: '📖 Spread Layout Img 3825 15', rects: [ { x: 0.0458, y: 0.2234, w: 0.175, h: 0.5638 }, { x: 0.225, y: 0.2234, w: 0.2833, h: 0.5638 }, { x: 0.5125, y: 0.2234, w: 0.1708, h: 0.5638 }, { x: 0.6875, y: 0.2234, w: 0.2792, h: 0.5638 } ] }
      ],
      // 5 Photos (Cropped Spread Layouts)
      5: [
        { id: 'cropped-spread-015', name: '📖 Spread Layout Img 3815 02', rects: [ { x: 0.0262, y: 0.1163, w: 0.3517, h: 0.4302 }, { x: 0.3808, y: 0.1163, w: 0.3983, h: 0.7791 }, { x: 0.0262, y: 0.5523, w: 0.1744, h: 0.343 }, { x: 0.2035, y: 0.5523, w: 0.1744, h: 0.343 }, { x: 0.8198, y: 0.8081, w: 0.0756, h: 0.064 } ] },
        { id: 'cropped-spread-020', name: '📖 Spread Layout Img 3815 07', rects: [ { x: 0.0, y: 0.0, w: 1.0, h: 1.0 }, { x: 0.5727, y: 0.1453, w: 0.1773, h: 0.343 }, { x: 0.7529, y: 0.1453, w: 0.1802, h: 0.343 }, { x: 0.5756, y: 0.4942, w: 0.1744, h: 0.343 }, { x: 0.7558, y: 0.4942, w: 0.1744, h: 0.343 } ] },
        { id: 'cropped-spread-025', name: '📖 Spread Layout Img 3815 12', rects: [ { x: 0.0, y: 0.1628, w: 0.2384, h: 0.6686 }, { x: 0.2413, y: 0.1628, w: 0.2558, h: 0.3314 }, { x: 0.5, y: 0.1628, w: 0.5, h: 0.6686 }, { x: 0.2413, y: 0.5, w: 0.2558, h: 0.3314 }, { x: 0.5, y: 0.5, w: 0.2587, h: 0.3314 } ] },
        { id: 'cropped-spread-028', name: '📖 Spread Layout Img 3816 03', rects: [ { x: 0.0075, y: 0.2761, w: 0.1273, h: 0.3806 }, { x: 0.1386, y: 0.2761, w: 0.2172, h: 0.3806 }, { x: 0.3596, y: 0.2761, w: 0.1386, h: 0.3806 }, { x: 0.5056, y: 0.2761, w: 0.1348, h: 0.3806 }, { x: 0.6517, y: 0.2761, w: 0.3446, h: 0.3806 } ] },
        { id: 'cropped-spread-034', name: '📖 Spread Layout Img 3816 09', rects: [ { x: 0.0, y: 0.0, w: 0.5056, h: 1.0 }, { x: 0.7566, y: 0.0522, w: 0.1835, h: 0.4478 }, { x: 0.5206, y: 0.1493, w: 0.2247, h: 0.3507 }, { x: 0.5693, y: 0.5149, w: 0.1798, h: 0.4403 }, { x: 0.7566, y: 0.5149, w: 0.2322, h: 0.3507 } ] },
        { id: 'cropped-spread-035', name: '📖 Spread Layout Img 3816 10', rects: [ { x: 0.0187, y: 0.097, w: 0.4607, h: 0.806 }, { x: 0.603, y: 0.097, w: 0.1423, h: 0.3955 }, { x: 0.7528, y: 0.1045, w: 0.1498, h: 0.3955 }, { x: 0.603, y: 0.5075, w: 0.1461, h: 0.3881 }, { x: 0.7528, y: 0.5075, w: 0.1461, h: 0.3881 } ] },
        { id: 'cropped-spread-038', name: '📖 Spread Layout Img 3816 13', rects: [ { x: 0.0, y: 0.0, w: 1.0, h: 0.0672 }, { x: 0.0637, y: 0.1642, w: 0.3708, h: 0.806 }, { x: 0.5318, y: 0.1642, w: 0.236, h: 0.806 }, { x: 0.7753, y: 0.1642, w: 0.1985, h: 0.3955 }, { x: 0.7753, y: 0.5746, w: 0.1985, h: 0.3955 } ] },
        { id: 'cropped-spread-039', name: '📖 Spread Layout Img 3816 14', rects: [ { x: 0.0, y: 0.0, w: 1.0, h: 1.0 }, { x: 0.5506, y: 0.1642, w: 0.1948, h: 0.3955 }, { x: 0.7566, y: 0.1642, w: 0.1948, h: 0.3955 }, { x: 0.5506, y: 0.5746, w: 0.1985, h: 0.3955 }, { x: 0.7528, y: 0.5746, w: 0.1985, h: 0.3955 } ] },
        { id: 'cropped-spread-040', name: '📖 Spread Layout Img 3816 15', rects: [ { x: 0.0, y: 0.0, w: 1.0, h: 0.0896 }, { x: 0.0524, y: 0.2985, w: 0.2172, h: 0.5896 }, { x: 0.2809, y: 0.2985, w: 0.2135, h: 0.5896 }, { x: 0.5056, y: 0.2985, w: 0.2172, h: 0.5896 }, { x: 0.7341, y: 0.2985, w: 0.2135, h: 0.5896 } ] },
        { id: 'cropped-spread-041', name: '📖 Spread Layout Img 3816 16', rects: [ { x: 0.0, y: 0.0, w: 1.0, h: 1.0 }, { x: 0.7678, y: 0.1791, w: 0.1798, h: 0.3433 }, { x: 0.0599, y: 0.1866, w: 0.4045, h: 0.8134 }, { x: 0.5843, y: 0.1866, w: 0.1798, h: 0.806 }, { x: 0.7678, y: 0.5373, w: 0.1798, h: 0.4627 } ] },
        { id: 'cropped-spread-053', name: '📖 Spread Layout Img 3821 11', rects: [ { x: 0.0, y: 0.0, w: 1.0, h: 1.0 }, { x: 0.0141, y: 0.0, w: 0.1845, h: 0.5024 }, { x: 0.2109, y: 0.0, w: 0.1845, h: 0.5071 }, { x: 0.406, y: 0.0, w: 0.587, h: 0.9668 }, { x: 0.0141, y: 0.5118, w: 0.3814, h: 0.455 } ] },
        { id: 'cropped-spread-089', name: '📖 Spread Layout Img 3825 02', rects: [ { x: 0.5083, y: 0.0, w: 0.4875, h: 0.9894 }, { x: 0.1167, y: 0.1064, w: 0.1458, h: 0.383 }, { x: 0.2667, y: 0.117, w: 0.15, h: 0.3723 }, { x: 0.1167, y: 0.5, w: 0.15, h: 0.3723 }, { x: 0.2708, y: 0.5, w: 0.1458, h: 0.3723 } ] },
        { id: 'cropped-spread-097', name: '📖 Spread Layout Img 3825 10', rects: [ { x: 0.6833, y: 0.0106, w: 0.25, h: 0.9894 }, { x: 0.0417, y: 0.117, w: 0.4417, h: 0.766 }, { x: 0.4958, y: 0.117, w: 0.15, h: 0.2553 }, { x: 0.4958, y: 0.383, w: 0.15, h: 0.2447 }, { x: 0.4958, y: 0.6383, w: 0.15, h: 0.2447 } ] },
        { id: 'cropped-spread-106', name: '📖 Spread Layout Img 3825 19', rects: [ { x: 0.0, y: 0.0, w: 0.9958, h: 1.0 }, { x: 0.3708, y: 0.0312, w: 0.3458, h: 0.9688 }, { x: 0.725, y: 0.0312, w: 0.2542, h: 0.9688 }, { x: 0.0458, y: 0.1979, w: 0.2833, h: 0.3125 }, { x: 0.0458, y: 0.5312, w: 0.2833, h: 0.3125 } ] }
      ],
      // 6 Photos (Cropped Spread Layouts)
      6: [
        { id: 'cropped-spread-031', name: '📖 Spread Layout Img 3816 06', rects: [ { x: 0.0375, y: 0.0448, w: 0.2097, h: 0.3955 }, { x: 0.2509, y: 0.0448, w: 0.2097, h: 0.3955 }, { x: 0.5468, y: 0.0448, w: 0.4082, h: 0.806 }, { x: 0.0375, y: 0.4478, w: 0.2097, h: 0.3955 }, { x: 0.2509, y: 0.4478, w: 0.2097, h: 0.3955 }, { x: 0.0, y: 0.9403, w: 1.0, h: 0.0597 } ] },
        { id: 'cropped-spread-103', name: '📖 Spread Layout Img 3825 16', rects: [ { x: 0.4875, y: 0.0106, w: 0.3292, h: 0.4894 }, { x: 0.8167, y: 0.0106, w: 0.1625, h: 0.4894 }, { x: 0.0458, y: 0.117, w: 0.4, h: 0.7766 }, { x: 0.4875, y: 0.5106, w: 0.1625, h: 0.4894 }, { x: 0.6542, y: 0.5106, w: 0.1625, h: 0.4894 }, { x: 0.8208, y: 0.5106, w: 0.1583, h: 0.4894 } ] },
        { id: 'cropped-spread-120', name: '📖 Spread Layout Img 3870 02', rects: [ { x: 0.5178, y: 0.0506, w: 0.2556, h: 0.9051 }, { x: 0.0178, y: 0.0633, w: 0.4622, h: 0.8734 }, { x: 0.7778, y: 0.1266, w: 0.0667, h: 0.0886 }, { x: 0.7778, y: 0.2468, w: 0.0644, h: 0.0633 }, { x: 0.7778, y: 0.3101, w: 0.0667, h: 0.0823 }, { x: 0.7756, y: 0.4684, w: 0.0689, h: 0.1139 } ] }
      ],
      // 7 Photos (Cropped Spread Layouts)
      7: [
        { id: 'cropped-spread-094', name: '📖 Spread Layout Img 3825 07', rects: [ { x: 0.0333, y: 0.0851, w: 0.175, h: 0.2766 }, { x: 0.2167, y: 0.0851, w: 0.55, h: 0.8298 }, { x: 0.7708, y: 0.0851, w: 0.175, h: 0.2766 }, { x: 0.0333, y: 0.3723, w: 0.175, h: 0.266 }, { x: 0.7708, y: 0.3723, w: 0.175, h: 0.266 }, { x: 0.0333, y: 0.6489, w: 0.175, h: 0.2766 }, { x: 0.7708, y: 0.6489, w: 0.175, h: 0.266 } ] }
      ],
      // 10 Photos (Cropped Spread Layouts)
      10: [
        { id: 'cropped-spread-090', name: '📖 Spread Layout Img 3825 03', rects: [ { x: 0.0458, y: 0.0532, w: 0.1125, h: 0.4362 }, { x: 0.1625, y: 0.0532, w: 0.2208, h: 0.883 }, { x: 0.5083, y: 0.0532, w: 0.1167, h: 0.4362 }, { x: 0.6292, y: 0.0532, w: 0.2208, h: 0.883 }, { x: 0.8542, y: 0.0532, w: 0.1167, h: 0.4362 }, { x: 0.3875, y: 0.0638, w: 0.1167, h: 0.4255 }, { x: 0.0458, y: 0.5, w: 0.1125, h: 0.4362 }, { x: 0.3875, y: 0.5, w: 0.1167, h: 0.4362 }, { x: 0.5083, y: 0.5, w: 0.1167, h: 0.4362 }, { x: 0.8542, y: 0.5, w: 0.1167, h: 0.4362 } ] },
        { id: 'cropped-spread-123', name: '📖 Spread Layout Img 3870 05', rects: [ { x: 0.0178, y: 0.0506, w: 0.1533, h: 0.8861 }, { x: 0.1733, y: 0.0506, w: 0.3044, h: 0.4494 }, { x: 0.5178, y: 0.0506, w: 0.1556, h: 0.4494 }, { x: 0.6733, y: 0.0506, w: 0.3067, h: 0.4494 }, { x: 0.52, y: 0.5, w: 0.46, h: 0.4494 }, { x: 0.4044, y: 0.6519, w: 0.0689, h: 0.1139 }, { x: 0.1733, y: 0.6772, w: 0.0667, h: 0.0886 }, { x: 0.3267, y: 0.6772, w: 0.0689, h: 0.0823 }, { x: 0.4044, y: 0.8354, w: 0.0689, h: 0.0949 }, { x: 0.1733, y: 0.8608, w: 0.0667, h: 0.0696 } ] },
        { id: 'cropped-spread-125', name: '📖 Spread Layout Img 3870 07', rects: [ { x: 0.0178, y: 0.0443, w: 0.2289, h: 0.8924 }, { x: 0.2489, y: 0.0506, w: 0.2289, h: 0.8861 }, { x: 0.8267, y: 0.0506, w: 0.1533, h: 0.443 }, { x: 0.7489, y: 0.0949, w: 0.0711, h: 0.1139 }, { x: 0.52, y: 0.1203, w: 0.0667, h: 0.0886 }, { x: 0.5178, y: 0.2722, w: 0.0689, h: 0.1266 }, { x: 0.6711, y: 0.2785, w: 0.0711, h: 0.1203 }, { x: 0.7489, y: 0.2848, w: 0.0689, h: 0.1139 }, { x: 0.5178, y: 0.5063, w: 0.1533, h: 0.443 }, { x: 0.6733, y: 0.5063, w: 0.3067, h: 0.443 } ] }
      ],
      // 11 Photos (Cropped Spread Layouts)
      11: [
        { id: 'cropped-spread-121', name: '📖 Spread Layout Img 3870 03', rects: [ { x: 0.0311, y: 0.0, w: 0.4756, h: 1.0 }, { x: 0.1711, y: 0.0443, w: 0.1533, h: 0.8924 }, { x: 0.5178, y: 0.0443, w: 0.3067, h: 0.8924 }, { x: 0.0178, y: 0.0506, w: 0.1511, h: 0.8861 }, { x: 0.8267, y: 0.0506, w: 0.1533, h: 0.443 }, { x: 0.3267, y: 0.0886, w: 0.0689, h: 0.1203 }, { x: 0.3244, y: 0.3101, w: 0.0711, h: 0.0823 }, { x: 0.4044, y: 0.4873, w: 0.0689, h: 0.0696 }, { x: 0.8289, y: 0.5, w: 0.1511, h: 0.4494 }, { x: 0.4044, y: 0.6456, w: 0.0689, h: 0.1203 }, { x: 0.4044, y: 0.8291, w: 0.0689, h: 0.1076 } ] }
      ],
      // 12 Photos (Cropped Spread Layouts)
      12: [
        { id: 'cropped-spread-033', name: '📖 Spread Layout Img 3816 08', rects: [ { x: 0.0037, y: 0.2164, w: 0.1273, h: 0.2612 }, { x: 0.1348, y: 0.2164, w: 0.2172, h: 0.2612 }, { x: 0.3596, y: 0.2164, w: 0.1348, h: 0.2612 }, { x: 0.5019, y: 0.2164, w: 0.1386, h: 0.2612 }, { x: 0.6442, y: 0.2164, w: 0.2172, h: 0.2687 }, { x: 0.8689, y: 0.2164, w: 0.1236, h: 0.2687 }, { x: 0.0037, y: 0.4925, w: 0.1273, h: 0.2537 }, { x: 0.1348, y: 0.4925, w: 0.2172, h: 0.2537 }, { x: 0.3596, y: 0.4925, w: 0.1348, h: 0.2537 }, { x: 0.5019, y: 0.4925, w: 0.1386, h: 0.2537 }, { x: 0.6479, y: 0.4925, w: 0.2135, h: 0.2537 }, { x: 0.8689, y: 0.4851, w: 0.1236, h: 0.2612 } ] },
        { id: 'cropped-spread-042', name: '📖 Spread Layout Img 3820 10', rects: [ { x: 0.0, y: 0.0, w: 0.1702, h: 0.2591 }, { x: 0.182, y: 0.0, w: 0.1253, h: 0.2591 }, { x: 0.3191, y: 0.0, w: 0.1962, h: 0.3782 }, { x: 0.5272, y: 0.0, w: 0.2388, h: 0.5337 }, { x: 0.7778, y: 0.0, w: 0.2222, h: 0.2539 }, { x: 0.0, y: 0.285, w: 0.3073, h: 0.3886 }, { x: 0.7778, y: 0.2798, w: 0.2222, h: 0.2539 }, { x: 0.3191, y: 0.4041, w: 0.1962, h: 0.5959 }, { x: 0.5272, y: 0.5596, w: 0.3215, h: 0.4404 }, { x: 0.8605, y: 0.5596, w: 0.1395, h: 0.4404 }, { x: 0.0, y: 0.6995, w: 0.1111, h: 0.3005 }, { x: 0.1229, y: 0.6995, w: 0.1844, h: 0.3005 } ] }
      ],
      // 16 Photos (Cropped Spread Layouts)
      16: [
        { id: 'cropped-spread-104', name: '📖 Spread Layout Img 3825 17', rects: [ { x: 0.0583, y: 0.0851, w: 0.1583, h: 0.2766 }, { x: 0.2208, y: 0.0851, w: 0.1125, h: 0.4149 }, { x: 0.3333, y: 0.0851, w: 0.1625, h: 0.2766 }, { x: 0.5292, y: 0.0851, w: 0.1625, h: 0.2766 }, { x: 0.6958, y: 0.0851, w: 0.1083, h: 0.4149 }, { x: 0.8083, y: 0.0851, w: 0.1583, h: 0.2766 }, { x: 0.0583, y: 0.3723, w: 0.1583, h: 0.266 }, { x: 0.3375, y: 0.3723, w: 0.1583, h: 0.2553 }, { x: 0.5292, y: 0.3723, w: 0.1583, h: 0.266 }, { x: 0.8083, y: 0.3723, w: 0.1625, h: 0.266 }, { x: 0.2208, y: 0.5106, w: 0.1083, h: 0.4043 }, { x: 0.6958, y: 0.5106, w: 0.1083, h: 0.4043 }, { x: 0.0583, y: 0.6489, w: 0.1583, h: 0.266 }, { x: 0.3333, y: 0.6489, w: 0.1625, h: 0.266 }, { x: 0.5292, y: 0.6489, w: 0.1625, h: 0.266 }, { x: 0.8083, y: 0.6489, w: 0.1625, h: 0.266 } ] },
        { id: 'cropped-spread-122', name: '📖 Spread Layout Img 3870 04', rects: [ { x: 0.0222, y: 0.0, w: 0.4889, h: 1.0 }, { x: 0.0178, y: 0.0443, w: 0.1511, h: 0.8861 }, { x: 0.52, y: 0.0443, w: 0.1511, h: 0.4557 }, { x: 0.8267, y: 0.0443, w: 0.1533, h: 0.4494 }, { x: 0.1733, y: 0.0506, w: 0.1489, h: 0.443 }, { x: 0.52, y: 0.0506, w: 0.3044, h: 0.8987 }, { x: 0.3267, y: 0.0949, w: 0.0689, h: 0.1139 }, { x: 0.4044, y: 0.0949, w: 0.0689, h: 0.1139 }, { x: 0.4044, y: 0.2785, w: 0.0689, h: 0.1139 }, { x: 0.3267, y: 0.462, w: 0.0689, h: 0.1139 }, { x: 0.4044, y: 0.4937, w: 0.0667, h: 0.0823 }, { x: 0.1733, y: 0.5063, w: 0.1511, h: 0.443 }, { x: 0.8267, y: 0.5063, w: 0.1533, h: 0.443 }, { x: 0.3267, y: 0.6519, w: 0.0689, h: 0.1139 }, { x: 0.4044, y: 0.6456, w: 0.0689, h: 0.1203 }, { x: 0.4044, y: 0.8608, w: 0.0667, h: 0.0696 } ] },
        { id: 'cropped-spread-124', name: '📖 Spread Layout Img 3870 06', rects: [ { x: 0.0, y: 0.0, w: 1.0, h: 1.0 }, { x: 0.0178, y: 0.0443, w: 0.46, h: 0.4494 }, { x: 0.52, y: 0.0443, w: 0.1511, h: 0.4494 }, { x: 0.6733, y: 0.038, w: 0.1511, h: 0.4557 }, { x: 0.9067, y: 0.057, w: 0.0644, h: 0.0633 }, { x: 0.8267, y: 0.0886, w: 0.0711, h: 0.1203 }, { x: 0.9067, y: 0.1203, w: 0.0667, h: 0.0886 }, { x: 0.8289, y: 0.3038, w: 0.0667, h: 0.0759 }, { x: 0.9044, y: 0.3038, w: 0.0689, h: 0.0759 }, { x: 0.0178, y: 0.5, w: 0.1511, h: 0.4494 }, { x: 0.1733, y: 0.5, w: 0.1511, h: 0.4494 }, { x: 0.3267, y: 0.5, w: 0.1511, h: 0.4494 }, { x: 0.52, y: 0.5, w: 0.3044, h: 0.4494 }, { x: 0.9067, y: 0.6709, w: 0.0667, h: 0.0886 }, { x: 0.8267, y: 0.8354, w: 0.0689, h: 0.0949 }, { x: 0.9044, y: 0.8354, w: 0.0689, h: 0.0949 } ] }
      ],
      // 17 Photos (Cropped Spread Layouts)
      17: [
        { id: 'cropped-spread-119', name: '📖 Spread Layout Img 3870 01', rects: [ { x: 0.5467, y: 0.0, w: 0.4533, h: 1.0 }, { x: 0.0178, y: 0.0443, w: 0.1511, h: 0.4494 }, { x: 0.1733, y: 0.0443, w: 0.1511, h: 0.4494 }, { x: 0.3267, y: 0.0443, w: 0.1533, h: 0.4494 }, { x: 0.5178, y: 0.0443, w: 0.1533, h: 0.8924 }, { x: 0.6733, y: 0.0506, w: 0.1533, h: 0.443 }, { x: 0.8267, y: 0.0506, w: 0.1533, h: 0.443 }, { x: 0.6733, y: 0.5, w: 0.1533, h: 0.4494 }, { x: 0.8289, y: 0.5063, w: 0.1511, h: 0.443 }, { x: 0.0933, y: 0.6456, w: 0.0711, h: 0.1139 }, { x: 0.4044, y: 0.6709, w: 0.0689, h: 0.0949 }, { x: 0.0178, y: 0.6772, w: 0.0689, h: 0.0823 }, { x: 0.2489, y: 0.6772, w: 0.0689, h: 0.0823 }, { x: 0.3267, y: 0.6772, w: 0.0689, h: 0.0886 }, { x: 0.4044, y: 0.8291, w: 0.0689, h: 0.1013 }, { x: 0.0156, y: 0.8354, w: 0.0689, h: 0.1013 }, { x: 0.3267, y: 0.8608, w: 0.0689, h: 0.0759 } ] }
      ],
      // 22 Photos (Cropped Spread Layouts)
      22: [
        { id: 'cropped-spread-107', name: '📖 Spread Layout Img 3825 20', rects: [ { x: 0.0, y: 0.0, w: 1.0, h: 1.0 }, { x: 0.1625, y: 0.125, w: 0.1, h: 0.2604 }, { x: 0.475, y: 0.125, w: 0.1708, h: 0.7812 }, { x: 0.7542, y: 0.125, w: 0.1, h: 0.2604 }, { x: 0.0583, y: 0.1354, w: 0.1, h: 0.25 }, { x: 0.2667, y: 0.1354, w: 0.1, h: 0.25 }, { x: 0.3708, y: 0.1354, w: 0.1042, h: 0.25 }, { x: 0.65, y: 0.1354, w: 0.1, h: 0.25 }, { x: 0.8583, y: 0.1354, w: 0.1, h: 0.25 }, { x: 0.0583, y: 0.3958, w: 0.1, h: 0.5104 }, { x: 0.1625, y: 0.3958, w: 0.1, h: 0.25 }, { x: 0.2667, y: 0.3958, w: 0.1, h: 0.25 }, { x: 0.3708, y: 0.3958, w: 0.1, h: 0.2396 }, { x: 0.65, y: 0.3958, w: 0.1, h: 0.25 }, { x: 0.7542, y: 0.3958, w: 0.1, h: 0.25 }, { x: 0.8583, y: 0.3958, w: 0.1, h: 0.25 }, { x: 0.1625, y: 0.6562, w: 0.1, h: 0.25 }, { x: 0.2667, y: 0.6562, w: 0.1, h: 0.25 }, { x: 0.3708, y: 0.6562, w: 0.1, h: 0.25 }, { x: 0.65, y: 0.6562, w: 0.1, h: 0.25 }, { x: 0.7542, y: 0.6562, w: 0.1, h: 0.25 }, { x: 0.8583, y: 0.6562, w: 0.1, h: 0.25 } ] }
      ],
    };
  }

  _continuousNormalizeRects(rects) {
    if (!rects || rects.length === 0) return [];
    if (rects.length === 1) return [{ x: 0, y: 0, w: 1, h: 1 }];

    const list = rects.map(r => ({ x: r.x, y: r.y, w: r.w, h: r.h }));

    // Find bounding box
    let minX = 1, minY = 1, maxX = 0, maxY = 0;
    list.forEach(r => {
      minX = Math.min(minX, r.x);
      minY = Math.min(minY, r.y);
      maxX = Math.max(maxX, r.x + r.w);
      maxY = Math.max(maxY, r.y + r.h);
    });

    const spanX = Math.max(0.01, maxX - minX);
    const spanY = Math.max(0.01, maxY - minY);

    list.forEach(r => {
      r.x = (r.x - minX) / spanX;
      r.y = (r.y - minY) / spanY;
      r.w = r.w / spanX;
      r.h = r.h / spanY;
    });

    // Snap vertical adjacent gaps
    for (let i = 0; i < list.length; i++) {
      for (let j = 0; j < list.length; j++) {
        if (i === j) continue;
        const r1 = list[i];
        const r2 = list[j];
        const r1Right = r1.x + r1.w;
        const r2Left = r2.x;
        if (r2Left > r1Right && (r2Left - r1Right) <= 0.15) {
          const vOverlap = Math.min(r1.y + r1.h, r2.y + r2.h) - Math.max(r1.y, r2.y);
          if (vOverlap > 0.05) {
            const mid = (r1Right + r2Left) / 2;
            r1.w = Math.max(0.01, mid - r1.x);
            const r2Right = r2.x + r2.w;
            r2.x = mid;
            r2.w = Math.max(0.01, r2Right - mid);
          }
        }
      }
    }

    // Snap horizontal adjacent gaps
    for (let i = 0; i < list.length; i++) {
      for (let j = 0; j < list.length; j++) {
        if (i === j) continue;
        const r1 = list[i];
        const r2 = list[j];
        const r1Bottom = r1.y + r1.h;
        const r2Top = r2.y;
        if (r2Top > r1Bottom && (r2Top - r1Bottom) <= 0.15) {
          const hOverlap = Math.min(r1.x + r1.w, r2.x + r2.w) - Math.max(r1.x, r2.x);
          if (hOverlap > 0.05) {
            const mid = (r1Bottom + r2Top) / 2;
            r1.h = Math.max(0.01, mid - r1.y);
            const r2Bottom = r2.y + r2.h;
            r2.y = mid;
            r2.h = Math.max(0.01, r2Bottom - mid);
          }
        }
      }
    }

    // Clamp outer edges to [0..1]
    list.forEach(r => {
      if (r.x < 0.015) { r.w += r.x; r.x = 0; }
      if (r.y < 0.015) { r.h += r.y; r.y = 0; }
      if (r.x + r.w > 0.985) { r.w = 1.0 - r.x; }
      if (r.y + r.h > 0.985) { r.h = 1.0 - r.y; }
      r.x = Math.max(0, Math.min(1, r.x));
      r.y = Math.max(0, Math.min(1, r.y));
      r.w = Math.max(0.01, Math.min(1, r.w));
      r.h = Math.max(0.01, Math.min(1, r.h));
    });

    return list;
  }

  /**
   * Converts normalized layout rectangles to real pixel coordinates on canvas,
   * applying outer margins, inner gaps, safe zones, and gutter crease line.
   * When gapPx is 0, adjacent frames touch with 0px space.
   */
  computePixelRectangles(layout, canvasWidth, canvasHeight, options = {}) {
    if (!layout || !layout.rects) return [];

    const marginRatio = options.marginPercent !== undefined ? options.marginPercent / 100 : 0.02;
    const middleMarginRatio = options.middleMarginPercent !== undefined ? options.middleMarginPercent / 100 : 0.0;
    const gap = options.gapPx !== undefined ? Math.max(0, options.gapPx) : 8;
    const isFullBleed = options.fullBleed || false;
    const isSpread = options.pageMode !== 'single';

    const marginY = isFullBleed ? 0 : Math.round(canvasHeight * marginRatio);
    const marginX = isFullBleed ? 0 : Math.round(canvasWidth * marginRatio);
    const innerW = Math.max(1, canvasWidth - marginX * 2);
    const innerH = Math.max(1, canvasHeight - marginY * 2);

    const centerX = canvasWidth / 2;
    const middleMarginPx = (isSpread && !isFullBleed) ? Math.round(canvasWidth * middleMarginRatio) : 0;
    const halfMiddle = Math.round(middleMarginPx / 2);

    const isCustomLayout = Boolean(layout.isCustom || options.isCustom);

    if (isCustomLayout) {
      // Independent free-form placement: each frame renders at its exact coordinates in all directions past safe zones
      return layout.rects.map((r, slotIndex) => {
        const pxX = r.x * canvasWidth;
        const pxY = r.y * canvasHeight;
        const pxW = r.w * canvasWidth;
        const pxH = r.h * canvasHeight;
        return {
          slotIndex,
          x: Math.round(pxX),
          y: Math.round(pxY),
          width: Math.max(8, Math.round(pxW)),
          height: Math.max(8, Math.round(pxH)),
          shape: r.shape || 'rectangle',
          borderRadius: r.borderRadius || 0,
          rotation: r.rotation || 0
        };
      });
    }

    // Standard preset layout template handling
    const normRects = this._continuousNormalizeRects(layout.rects);

    const computed = normRects.map((r, slotIndex) => {
      let pxX, pxY, pxW, pxH;

      // Detect if rect spans across the center fold
      const spansCenter = isSpread && (r.w >= 0.70 || (r.x < 0.46 && (r.x + r.w) > 0.54));

      if (spansCenter || !isSpread || middleMarginPx === 0) {
        pxX = marginX + r.x * innerW;
        pxY = marginY + r.y * innerH;
        pxW = r.w * innerW;
        pxH = r.h * innerH;
      } else {
        const isLeftPage = (r.x + r.w) <= 0.505;
        if (isLeftPage) {
          const leftMaxX = centerX - halfMiddle;
          const leftAvailW = Math.max(1, leftMaxX - marginX);
          pxX = marginX + (r.x / 0.50) * leftAvailW;
          pxW = (r.w / 0.50) * leftAvailW;
          pxY = marginY + r.y * innerH;
          pxH = r.h * innerH;
        } else {
          const rightMinX = centerX + halfMiddle;
          const rightAvailW = Math.max(1, (canvasWidth - marginX) - rightMinX);
          const normX = Math.max(0, (r.x - 0.50) / 0.50);
          pxX = rightMinX + normX * rightAvailW;
          pxW = (r.w / 0.50) * rightAvailW;
          pxY = marginY + r.y * innerH;
          pxH = r.h * innerH;
        }
      }

      // Precise gap application:
      // Subtract half gap from internal edges only, keeping outer margin exact!
      if (gap > 0 && normRects.length > 1) {
        const halfGap = gap / 2;
        if (r.x > 0.008) {
          pxX += halfGap;
          pxW -= halfGap;
        }
        if (r.x + r.w < 0.992) {
          pxW -= halfGap;
        }
        if (r.y > 0.008) {
          pxY += halfGap;
          pxH -= halfGap;
        }
        if (r.y + r.h < 0.992) {
          pxH -= halfGap;
        }
      }

      return {
        slotIndex,
        x: Math.round(pxX),
        y: Math.round(pxY),
        width: Math.max(8, Math.round(pxW)),
        height: Math.max(8, Math.round(pxH)),
        shape: r.shape || 'rectangle',
        borderRadius: r.borderRadius || 0,
        rotation: r.rotation || 0
      };
    });

    return computed;
  }

  pixelRectToNormalized(pixelRect, canvasWidth, canvasHeight, options = {}) {
    const isCustom = Boolean(options.isCustom || options.directCanvas);
    if (isCustom) {
      const normX = pixelRect.x / canvasWidth;
      const normY = pixelRect.y / canvasHeight;
      const normW = pixelRect.width / canvasWidth;
      const normH = pixelRect.height / canvasHeight;

      const nW = Math.max(0.005, Math.min(1.0, Number(normW.toFixed(4))));
      const nH = Math.max(0.005, Math.min(1.0, Number(normH.toFixed(4))));

      const res = {
        x: Math.max(0, Math.min(0.995, Number(normX.toFixed(4)))),
        y: Math.max(0, Math.min(0.995, Number(normY.toFixed(4)))),
        w: nW,
        h: nH,
        width: nW,
        height: nH
      };
      if (pixelRect.shape) res.shape = pixelRect.shape;
      if (pixelRect.borderRadius) res.borderRadius = pixelRect.borderRadius;
      if (pixelRect.rotation) res.rotation = pixelRect.rotation;
      if (pixelRect.customPath) res.customPath = pixelRect.customPath;
      return res;
    }

    const marginRatio = options.marginPercent !== undefined ? options.marginPercent / 100 : 0.02;
    const isFullBleed = options.fullBleed || false;

    const marginY = isFullBleed ? 0 : Math.round(canvasHeight * marginRatio);
    const marginX = isFullBleed ? 0 : Math.round(canvasWidth * marginRatio);
    const innerW = Math.max(1, canvasWidth - marginX * 2);
    const innerH = Math.max(1, canvasHeight - marginY * 2);

    const normX = (pixelRect.x - marginX) / innerW;
    const normY = (pixelRect.y - marginY) / innerH;
    const normW = pixelRect.width / innerW;
    const normH = pixelRect.height / innerH;

    const res = {
      x: Math.max(0, Math.min(0.98, Number(normX.toFixed(4)))),
      y: Math.max(0, Math.min(0.98, Number(normY.toFixed(4)))),
      w: Math.max(0.02, Math.min(1.0, Number(normW.toFixed(4)))),
      h: Math.max(0.02, Math.min(1.0, Number(normH.toFixed(4))))
    };
    if (pixelRect.shape) res.shape = pixelRect.shape;
    if (pixelRect.borderRadius) res.borderRadius = pixelRect.borderRadius;
    if (pixelRect.rotation) res.rotation = pixelRect.rotation;
    if (pixelRect.customPath) res.customPath = pixelRect.customPath;
    return res;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = LayoutEngine;
} else {
  window.LayoutEngine = LayoutEngine;
}
