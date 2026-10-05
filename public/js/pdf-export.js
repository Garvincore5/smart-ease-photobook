/**
 * Ease smart Books - PDF & Print Exporter
 * 100% Offline, standalone print-ready PDF & high-resolution JPEG/PNG generator.
 * Supports:
 * - Full Sheet (Double Spread / Open Album) Export
 * - Split Single Page (1-up) Export
 * - Multi-page PDF Compilation (zero external libraries!)
 * - High-Res 300 DPI Lab-Quality Output
 */

class PhotobookExporter {
  constructor(albumState, canvasRenderer) {
    this.albumState = albumState;
    this.canvasRenderer = canvasRenderer;
  }

  /**
   * Slices a double spread canvas down the middle into two separate page canvases.
   */
  splitSpreadCanvasToPages(spreadCanvas) {
    const w = spreadCanvas.width;
    const h = spreadCanvas.height;
    const halfW = Math.round(w / 2);

    const leftCanvas = document.createElement('canvas');
    leftCanvas.width = halfW;
    leftCanvas.height = h;
    const lctx = leftCanvas.getContext('2d');
    lctx.drawImage(spreadCanvas, 0, 0, halfW, h, 0, 0, halfW, h);

    const rightCanvas = document.createElement('canvas');
    rightCanvas.width = w - halfW;
    rightCanvas.height = h;
    const rctx = rightCanvas.getContext('2d');
    rctx.drawImage(spreadCanvas, halfW, 0, w - halfW, h, 0, 0, w - halfW, h);

    return { left: leftCanvas, right: rightCanvas };
  }

  /**
   * Helper to write output blob either directly to a selected directory / subfolder handle or fallback to download.
   */
  async _saveOutputBlob(blob, filename, destinationOptions = null) {
    if (destinationOptions && destinationOptions.dirHandle) {
      try {
        let targetDir = destinationOptions.dirHandle;
        if (destinationOptions.createSubfolder && destinationOptions.subfolderName) {
          targetDir = await destinationOptions.dirHandle.getDirectoryHandle(destinationOptions.subfolderName, { create: true });
        }
        const fileHandle = await targetDir.getFileHandle(filename, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        return true;
      } catch (err) {
        console.warn('Directory handle write error, falling back to browser download:', err);
      }
    }
    const url = URL.createObjectURL(blob);
    this._downloadUrl(url, filename);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    return false;
  }

  /**
   * Exports the active spread as high-resolution images (sheet or single pages).
   */
  async exportCurrentSpreadImage(format = 'image/jpeg', quality = 0.95, dpi = 300, layoutMode = 'sheet', destinationOptions = null) {
    const spread = this.albumState.getActiveSpread();
    if (!spread) return;
    const canvas = await this.canvasRenderer.renderHighResSpreadCanvas(spread, dpi);
    const ext = format === 'image/png' ? 'png' : 'jpg';
    const baseTitle = this.albumState.project.title.replace(/\s+/g, '_');

    if (layoutMode === 'single' && this.albumState.project.pageMode === 'spread') {
      const { left, right } = this.splitSpreadCanvasToPages(canvas);
      const currIdx = this.albumState.activeSpreadIndex;
      const pLeft = currIdx * 2 + 1;
      const pRight = currIdx * 2 + 2;

      const leftBlob = await new Promise(res => left.toBlob(res, format, quality));
      const rightBlob = await new Promise(res => right.toBlob(res, format, quality));

      await this._saveOutputBlob(leftBlob, `${baseTitle}_Page_${String(pLeft).padStart(2, '0')}.${ext}`, destinationOptions);
      await this._saveOutputBlob(rightBlob, `${baseTitle}_Page_${String(pRight).padStart(2, '0')}.${ext}`, destinationOptions);
    } else {
      const blob = await new Promise(res => canvas.toBlob(res, format, quality));
      const filename = `${baseTitle}_${spread.pageLabel.replace(/\s+/g, '')}_Sheet.${ext}`;
      await this._saveOutputBlob(blob, filename, destinationOptions);
    }
  }

  /**
   * Exports all or selected spreads sequentially as high-resolution images (sheet or single pages).
   */
  async exportAllSpreadsImages(format = 'image/jpeg', quality = 0.95, dpi = 300, layoutMode = 'sheet', onProgress = null, targetSpreadIndices = null, destinationOptions = null) {
    const allSpreads = this.albumState.project.spreads;
    const indicesToExport = (targetSpreadIndices && targetSpreadIndices.length > 0)
      ? targetSpreadIndices.filter(idx => idx >= 0 && idx < allSpreads.length)
      : allSpreads.map((_, i) => i);

    const ext = format === 'image/png' ? 'png' : 'jpg';
    const baseTitle = this.albumState.project.title.replace(/\s+/g, '_');
    const isSpreadMode = this.albumState.project.pageMode === 'spread';

    for (let step = 0; step < indicesToExport.length; step++) {
      const i = indicesToExport[step];
      if (onProgress) onProgress(step + 1, indicesToExport.length, `Rendering spread ${i + 1} (${step + 1} of ${indicesToExport.length})...`);
      const spread = allSpreads[i];
      const canvas = await this.canvasRenderer.renderHighResSpreadCanvas(spread, dpi);

      if (layoutMode === 'single' && isSpreadMode) {
        // Split spread into Left and Right pages
        const { left, right } = this.splitSpreadCanvasToPages(canvas);
        const pLeft = (i * 2) + 1;
        const pRight = (i * 2) + 2;

        const leftBlob = await new Promise(res => left.toBlob(res, format, quality));
        const rightBlob = await new Promise(res => right.toBlob(res, format, quality));

        await this._saveOutputBlob(leftBlob, `${baseTitle}_Page_${String(pLeft).padStart(2, '0')}.${ext}`, destinationOptions);
        await this._saveOutputBlob(rightBlob, `${baseTitle}_Page_${String(pRight).padStart(2, '0')}.${ext}`, destinationOptions);
      } else {
        const blob = await new Promise(res => canvas.toBlob(res, format, quality));
        const padNum = String(i + 1).padStart(2, '0');
        const filename = `${baseTitle}_Sheet_${padNum}_${spread.pageLabel.replace(/\s+/g, '')}.${ext}`;
        await this._saveOutputBlob(blob, filename, destinationOptions);
      }
    }
  }

  /**
   * Generates a multi-page print-ready PDF file offline as full sheets or single pages.
   */
  async exportAlbumPDF(dpi = 300, layoutMode = 'sheet', onProgress = null, targetSpreadIndices = null, destinationOptions = null, pdfOptions = {}) {
    const allSpreads = this.albumState.project.spreads;
    const indicesToExport = (targetSpreadIndices && targetSpreadIndices.length > 0)
      ? targetSpreadIndices.filter(idx => idx >= 0 && idx < allSpreads.length)
      : allSpreads.map((_, i) => i);

    const isSpreadMode = this.albumState.project.pageMode === 'spread';
    const isSingleSplit = layoutMode === 'single' && isSpreadMode;
    const addPageLabels = Boolean(isSingleSplit && pdfOptions && pdfOptions.addPageLabels);
    const projectName = (pdfOptions && pdfOptions.projectName) ? String(pdfOptions.projectName).trim() : (this.albumState.project.title || 'ALBUM');
    const slugPt = addPageLabels ? 36 : 0; // 0.5 inch * 72 pt/in = 36 pt

    const sheetWInches = this.albumState.getSheetWidthInches();
    const sheetHInches = this.albumState.getSheetHeightInches();

    // Base PDF page dimensions in points (72 points per inch)
    const basePageWidthPt = (isSingleSplit ? sheetWInches / 2 : sheetWInches) * 72;
    const pdfPageWidth = basePageWidthPt + slugPt;
    const pdfPageHeight = sheetHInches * 72;

    const jpegBlobs = [];

    for (let step = 0; step < indicesToExport.length; step++) {
      const i = indicesToExport[step];
      if (onProgress) onProgress(step + 1, indicesToExport.length, `Rendering spread ${i + 1} (${step + 1} of ${indicesToExport.length}) at ${dpi} DPI...`);
      const spread = allSpreads[i];
      const canvas = await this.canvasRenderer.renderHighResSpreadCanvas(spread, dpi);
      const sheetWInches = this.albumState.getSheetWidthInches(i);
      const sheetHInches = this.albumState.getSheetHeightInches(i);

      if (isSingleSplit) {
        const { left, right } = this.splitSpreadCanvasToPages(canvas);
        const origPageWidthPt = (sheetWInches / 2) * 72;
        const pageHeightPt = sheetHInches * 72;
        const pLeft = (i * 2) + 1;
        const pRight = (i * 2) + 2;

        const leftBlob = await new Promise(res => left.toBlob(res, 'image/jpeg', 0.94));
        const leftBuffer = await leftBlob.arrayBuffer();
        jpegBlobs.push({
          width: left.width,
          height: left.height,
          imgWidthPt: origPageWidthPt,
          widthPt: origPageWidthPt + slugPt,
          heightPt: pageHeightPt,
          imgXPt: addPageLabels ? slugPt : 0, // Photo placed after 0.5" left margin on left page
          slugSide: addPageLabels ? 'left' : null,
          slugPt: slugPt,
          labelText: addPageLabels ? `${pLeft}  ${projectName}` : '',
          bytes: new Uint8Array(leftBuffer)
        });

        const rightBlob = await new Promise(res => right.toBlob(res, 'image/jpeg', 0.94));
        const rightBuffer = await rightBlob.arrayBuffer();
        jpegBlobs.push({
          width: right.width,
          height: right.height,
          imgWidthPt: origPageWidthPt,
          widthPt: origPageWidthPt + slugPt,
          heightPt: pageHeightPt,
          imgXPt: 0, // Photo placed from 0 on right page
          slugSide: addPageLabels ? 'right' : null,
          slugPt: slugPt,
          labelText: addPageLabels ? `${pRight}  ${projectName}` : '',
          bytes: new Uint8Array(rightBuffer)
        });
      } else {
        const pageWidthPt = sheetWInches * 72;
        const pageHeightPt = sheetHInches * 72;
        const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.94));
        const arrayBuffer = await blob.arrayBuffer();
        jpegBlobs.push({
          width: canvas.width,
          height: canvas.height,
          imgWidthPt: pageWidthPt,
          widthPt: pageWidthPt,
          heightPt: pageHeightPt,
          imgXPt: 0,
          slugSide: null,
          slugPt: 0,
          labelText: '',
          bytes: new Uint8Array(arrayBuffer)
        });
      }
    }

    if (onProgress) onProgress(indicesToExport.length, indicesToExport.length, 'Compiling print-ready PDF document...');

    // 2. Build PDF Document Byte Stream
    const pdfBytes = this._compilePdfDocument(jpegBlobs, pdfPageWidth, pdfPageHeight);
    const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });

    const modeTag = isSingleSplit ? 'SinglePages' : 'Sheets';
    const scopeTag = (targetSpreadIndices && targetSpreadIndices.length < allSpreads.length) ? '_Selected' : '';
    const filename = `${this.albumState.project.title.replace(/\s+/g, '_')}_${modeTag}${scopeTag}_Album.pdf`;
    await this._saveOutputBlob(pdfBlob, filename, destinationOptions);
  }

  /**
   * Compiles an array of raw JPEG byte buffers into a standard PDF 1.4 document.
   */
  _compilePdfDocument(pagesData, pageWidthPt, pageHeightPt) {
    const chunks = [];
    const xrefOffsets = [];
    let currentBytePos = 0;

    const write = (str) => {
      const encoder = new TextEncoder();
      const bytes = encoder.encode(str);
      chunks.push(bytes);
      currentBytePos += bytes.length;
    };

    const writeBinary = (bytes) => {
      chunks.push(bytes);
      currentBytePos += bytes.length;
    };

    // Header
    write('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');

    const totalPages = pagesData.length;
    let nextObjNum = 3; // Obj 1 is Catalog, Obj 2 is Pages root

    const hasLabels = pagesData.some(p => p.labelText && p.labelText.trim().length > 0);
    const fontObjNum = hasLabels ? nextObjNum++ : null;

    const pageObjNums = [];
    const imageObjNums = [];
    const contentObjNums = [];

    for (let i = 0; i < totalPages; i++) {
      pageObjNums.push(nextObjNum++);
      imageObjNums.push(nextObjNum++);
      contentObjNums.push(nextObjNum++);
    }

    // 1. Catalog Object (Obj 1)
    xrefOffsets[1] = currentBytePos;
    write(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`);

    // 2. Pages Root Object (Obj 2)
    xrefOffsets[2] = currentBytePos;
    const kidsStr = pageObjNums.map(n => `${n} 0 R`).join(' ');
    write(`2 0 obj\n<< /Type /Pages /Kids [ ${kidsStr} ] /Count ${totalPages} >>\nendobj\n`);

    // 3. Optional Font Object (Standard Built-in Type 1 Helvetica-Bold for readable, bold print lab slug info)
    if (hasLabels && fontObjNum) {
      xrefOffsets[fontObjNum] = currentBytePos;
      write(`${fontObjNum} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n`);
    }

    // 4. For each page, write Page, Image XObject, and Content Stream
    for (let i = 0; i < totalPages; i++) {
      const pData = pagesData[i];
      const pObj = pageObjNums[i];
      const imgObj = imageObjNums[i];
      const cntObj = contentObjNums[i];

      // Page Object
      const pWidthPt = pData.widthPt || pageWidthPt;
      const pHeightPt = pData.heightPt || pageHeightPt;
      const fontResource = hasLabels ? `/Font << /F1 ${fontObjNum} 0 R >> ` : '';
      xrefOffsets[pObj] = currentBytePos;
      write(`${pObj} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [ 0 0 ${pWidthPt} ${pHeightPt} ] /Contents ${cntObj} 0 R /Resources << ${fontResource}/XObject << /Im${i} ${imgObj} 0 R >> >> >>\nendobj\n`);

      // Image XObject (Raw JPEG stream)
      xrefOffsets[imgObj] = currentBytePos;
      const imgHeader = `${imgObj} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${pData.width} /Height ${pData.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${pData.bytes.length} >>\nstream\n`;
      write(imgHeader);
      writeBinary(pData.bytes);
      write('\nendstream\nendobj\n');

      // Content Stream
      let streamContent;
      if (pData.slugSide) {
        const imgX = pData.imgXPt || 0;
        const imgW = pData.imgWidthPt || (pWidthPt - (pData.slugPt || 36));
        const imgH = pHeightPt;
        const slug = pData.slugPt || 36;
        const fontSize = 11;
        const mainText = (pData.labelText || '').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
        const brandingText = '   Designed with Smart Ease Album Studio';

        // Estimate character lengths for vertical centering
        const calcTextLen = (str, sz) => {
          let est = 0;
          for (let c = 0; c < str.length; c++) {
            const ch = str[c];
            if (ch === ' ') est += 0.25;
            else if (/[ijl\.,;:'!]/.test(ch)) est += 0.28;
            else if (/[frt]/.test(ch)) est += 0.35;
            else if (/[WMQ@]/.test(ch)) est += 0.95;
            else if (/[A-Z0-9&]/.test(ch)) est += 0.72;
            else est += 0.55;
          }
          return est * sz;
        };

        const totalLenPt = calcTextLen(mainText, fontSize) + calcTextLen(brandingText, fontSize);
        const textY = Math.round(((pHeightPt / 2) + (totalLenPt / 2)) * 100) / 100;

        let textX = 0;
        let slugRectX = 0;
        // Position label inwards towards the photo on both left and right pages to protect from edge cutting
        const marginGapFromPhoto = 3.5;
        if (pData.slugSide === 'left') {
          slugRectX = 0;
          // Left page: text is on left margin, inwards towards photo (photo starts at slug)
          textX = Math.round((slug - (fontSize * 0.8) - marginGapFromPhoto) * 100) / 100;
        } else {
          slugRectX = imgW;
          // Right page: text is on right margin, inwards towards photo (photo ends at imgW)
          textX = Math.round((imgW + marginGapFromPhoto) * 100) / 100;
        }

        streamContent =
          `q\n` +
          `1 1 1 rg 0 0 ${pWidthPt} ${pHeightPt} re f\n` +
          `Q\n` +
          `q ${imgW} 0 0 ${imgH} ${imgX} 0 cm /Im${i} Do Q\n` +
          `q\n` +
          `1 1 1 rg ${slugRectX} 0 ${slug} ${pHeightPt} re f\n` +
          `BT\n` +
          `/F1 1 Tf\n` +
          `0 0 0 1 k\n` +
          `0 -${fontSize} ${fontSize} 0 ${textX} ${textY} Tm\n` +
          `(${mainText}) Tj\n` +
          `0.85 0.1 0.1 rg\n` +
          `(${brandingText}) Tj\n` +
          `ET\n` +
          `Q\n`;
      } else {
        // Standard Content Stream (Draws image scaled to full page)
        streamContent = `q ${pWidthPt} 0 0 ${pHeightPt} 0 0 cm /Im${i} Do Q\n`;
      }

      const streamLen = new TextEncoder().encode(streamContent).length;
      xrefOffsets[cntObj] = currentBytePos;
      write(`${cntObj} 0 obj\n<< /Length ${streamLen} >>\nstream\n${streamContent}endstream\nendobj\n`);
    }

    // XRef Table
    const startXref = currentBytePos;
    const totalObjects = nextObjNum;
    write(`xref\n0 ${totalObjects}\n`);
    write(`0000000000 65535 f \n`);
    for (let i = 1; i < totalObjects; i++) {
      const offset = xrefOffsets[i] || 0;
      write(String(offset).padStart(10, '0') + ' 00000 n \n');
    }

    // Trailer
    write(`trailer\n<< /Size ${totalObjects} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`);

    // Merge chunks
    const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    return result;
  }

  _downloadDataUrl(dataUrl, filename) {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  _downloadUrl(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PhotobookExporter;
} else {
  window.PhotobookExporter = PhotobookExporter;
}
