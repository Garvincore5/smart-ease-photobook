/**
 * Pixellu SmartAlbums - Main Application Controller
 * Handles UI interactions, keyboard shortcuts, drag-and-drop,
 * filmstrip/tray rendering, and modal controllers.
 */

function initApp() {
  try {
    // Initialize Core Engines
    const layoutEngine = new LayoutEngine();
    const albumState = new AlbumState(layoutEngine);
    const canvasEl = document.getElementById('spreadCanvas');
    const canvasRenderer = new CanvasRenderer(canvasEl, albumState);
    const exporter = new PhotobookExporter(albumState, canvasRenderer);

    // Global handles for system-wide access
    window.layoutEngine = layoutEngine;
    window.albumState = albumState;
    window.canvasRenderer = canvasRenderer;

    // Filter state for photo tray
    let currentTrayFilter = 'all'; // 'all', 'unused', 'used'

  // DOM Elements Cache
  const els = {
    canvasWrapper: document.getElementById('canvasWrapper'),
    canvasStage: document.getElementById('canvasStage'),
    
    // HUD
    hudPageLabel: document.getElementById('hudPageLabel'),
    hudLayoutName: document.getElementById('hudLayoutName'),
    btnPrevSpread: document.getElementById('btnPrevSpread'),
    btnNextSpread: document.getElementById('btnNextSpread'),
    btnStagePrevSpread: document.getElementById('btnStagePrevSpread'),
    btnStageNextSpread: document.getElementById('btnStageNextSpread'),
    
    // Header controls
    albumSizeSelect: document.getElementById('albumSizeSelect'),
    btnNextLayout: document.getElementById('btnNextLayout'),
    btnPrevLayout: document.getElementById('btnPrevLayout'),
    btnHudNextLayout: document.getElementById('btnHudNextLayout'),
    btnHudPrevLayout: document.getElementById('btnHudPrevLayout'),
    btnRandomizeLayout: document.getElementById('btnRandomizeLayout'),
    btnFlipHorizontal: document.getElementById('btnFlipHorizontal'),
    btnOpenCatalog: document.getElementById('btnOpenCatalog'),
    btnNewProject: document.getElementById('btnNewProject'),
    btnOpenProjectHeader: document.getElementById('btnOpenProjectHeader'),
    btnTutorials: document.getElementById('btnTutorials'),
    btnActivate: document.getElementById('btnActivate'),
    btnAutoBuild: document.getElementById('btnAutoBuild'),
    btnUndo: document.getElementById('btnUndo'),
    btnRedo: document.getElementById('btnRedo'),
    btnSaveProject: document.getElementById('btnSaveProject'),
    btnReloadProject: document.getElementById('btnReloadProject'),
    btnOpenProject: document.getElementById('btnOpenProject'),
    fileProjectInput: document.getElementById('fileProjectInput'),
    btnExport: document.getElementById('btnExport'),
    
    // Toolbar controls
    btnModeSpread: document.getElementById('btnModeSpread'),
    btnModeSingle: document.getElementById('btnModeSingle'),
    btnSaveProjectToolbar: document.getElementById('btnSaveProjectToolbar'),
    btnSaveAsProjectToolbar: document.getElementById('btnSaveAsProjectToolbar'),
    btnOrientationLandscape: document.getElementById('btnOrientationLandscape'),
    btnOrientationPortrait: document.getElementById('btnOrientationPortrait'),
    marginSlider: document.getElementById('marginSlider'),
    marginVal: document.getElementById('marginVal'),
    gapSlider: document.getElementById('gapSlider'),
    gapVal: document.getElementById('gapVal'),
    middleMarginSlider: document.getElementById('middleMarginSlider'),
    middleMarginVal: document.getElementById('middleMarginVal'),
    middleMarginGroup: document.getElementById('middleMarginGroup'),
    btnScopeCurrentSpread: document.getElementById('btnScopeCurrentSpread'),
    btnScopeAllSpreads: document.getElementById('btnScopeAllSpreads'),
    labelSpacingTargetSpread: document.getElementById('labelSpacingTargetSpread'),
    toggleCrease: document.getElementById('toggleCrease'),
    toggleGuides: document.getElementById('toggleGuides'),
    toggleBleed: document.getElementById('toggleBleed'),
    bgColorPicker: document.getElementById('bgColorPicker'),

    // Floating Spread Top Dock & Buttons
    spreadTopDock: document.getElementById('spreadTopDock'),
    dockControlsContainer: document.getElementById('dockControlsContainer'),
    btnDockControls: document.getElementById('btnDockControls'),
    dockControlsPanel: document.getElementById('dockControlsPanel'),
    dockSpreadLayoutContainer: document.getElementById('dockSpreadLayoutContainer'),
    btnDockSpreadLayout: document.getElementById('btnDockSpreadLayout'),
    dockDesignLayoutContainer: document.getElementById('dockDesignLayoutContainer'),
    btnDockDesignLayout: document.getElementById('btnDockDesignLayout'),
    dockDrawFrameContainer: document.getElementById('dockDrawFrameContainer'),
    btnDrawFrame: document.getElementById('btnDrawFrame'),
    btnHudDrawFrame: document.getElementById('btnHudDrawFrame'),
    dockDrawShapesPanel: document.getElementById('dockDrawShapesPanel'),
    btnCloseDrawShapesPanel: document.getElementById('btnCloseDrawShapesPanel'),
    dockActiveShapeIndicator: document.getElementById('dockActiveShapeIndicator'),
    labelDrawFrameBtn: document.getElementById('labelDrawFrameBtn'),
    inputDrawShapeSearch: document.getElementById('inputDrawShapeSearch'),
    btnClearShapeSearch: document.getElementById('btnClearShapeSearch'),
    drawShapesCatTabs: document.getElementById('drawShapesCatTabs'),
    drawShapesGrid: document.getElementById('drawShapesGrid'),
    drawShapesFooterCurrent: document.getElementById('drawShapesFooterCurrent'),
    btnOpenShapeCombiner: document.getElementById('btnOpenShapeCombiner'),
    btnOpenCombinerTop: document.getElementById('btnOpenCombinerTop'),
    canvasDrawBanner: document.getElementById('canvasDrawBanner'),
    bannerActiveShapeName: document.getElementById('bannerActiveShapeName'),
    btnBannerOpenAllShapes: document.getElementById('btnBannerOpenAllShapes'),
    btnBannerCombineShapes: document.getElementById('btnBannerCombineShapes'),
    btnExitDrawMode: document.getElementById('btnExitDrawMode'),
    canvasTopNavBar: document.getElementById('canvasTopNavBar'),

    // Shape Combiner Modal
    modalShapeCombiner: document.getElementById('modalShapeCombiner'),
    btnCloseShapeCombiner: document.getElementById('btnCloseShapeCombiner'),
    btnCancelShapeCombiner: document.getElementById('btnCancelShapeCombiner'),
    btnApplyShapeCombiner: document.getElementById('btnApplyShapeCombiner'),
    combinerModeTabs: document.getElementById('combinerModeTabs'),
    selectCombinerShapeA: document.getElementById('selectCombinerShapeA'),
    selectCombinerShapeB: document.getElementById('selectCombinerShapeB'),
    rangeCombinerScaleB: document.getElementById('rangeCombinerScaleB'),
    lblCombinerScaleB: document.getElementById('lblCombinerScaleB'),
    rangeCombinerOffsetX: document.getElementById('rangeCombinerOffsetX'),
    lblCombinerOffsetX: document.getElementById('lblCombinerOffsetX'),
    rangeCombinerOffsetY: document.getElementById('rangeCombinerOffsetY'),
    lblCombinerOffsetY: document.getElementById('lblCombinerOffsetY'),
    inputCombinerSvg: document.getElementById('inputCombinerSvg'),
    inputCombinerCanvas: document.getElementById('inputCombinerCanvas'),
    inputCombinerPillow: document.getElementById('inputCombinerPillow'),
    inputCombinerCairo: document.getElementById('inputCombinerCairo'),
    combinerPreviewCanvas: document.getElementById('combinerPreviewCanvas'),
    btnPreviewTextureToggle: document.getElementById('btnPreviewTextureToggle'),
    btnRefreshCombinerPreview: document.getElementById('btnRefreshCombinerPreview'),
    btnTestRenderCombiner: document.getElementById('btnTestRenderCombiner'),
    combinerStatusMessage: document.getElementById('combinerStatusMessage'),

    // Floating Layouts Bar
    floatingLayoutsBar: document.getElementById('floatingLayoutsBar'),
    floatingLayoutsList: document.getElementById('floatingLayoutsList'),
    floatingLayoutsCount: document.getElementById('floatingLayoutsCount'),
    btnFloatingLandscape: document.getElementById('btnFloatingLandscape'),
    btnFloatingPortrait: document.getElementById('btnFloatingPortrait'),
    floatingFilterPills: document.getElementById('floatingFilterPills'),
    btnOpenTransparentLayouts: document.getElementById('btnOpenTransparentLayouts'),

    // Photo Frame Adjustment Preview Bar
    photoFramePreviewBar: document.getElementById('photoFramePreviewBar'),
    previewBarThumb: document.getElementById('previewBarThumb'),
    previewBarSlotName: document.getElementById('previewBarSlotName'),
    previewBarPhotoName: document.getElementById('previewBarPhotoName'),
    previewBarPhotoAspect: document.getElementById('previewBarPhotoAspect'),
    previewBarZoomSlider: document.getElementById('previewBarZoomSlider'),
    previewBarZoomVal: document.getElementById('previewBarZoomVal'),
    btnPreviewZoomOut: document.getElementById('btnPreviewZoomOut'),
    btnPreviewZoomIn: document.getElementById('btnPreviewZoomIn'),
    btnPreviewPanLeft: document.getElementById('btnPreviewPanLeft'),
    btnPreviewPanRight: document.getElementById('btnPreviewPanRight'),
    btnPreviewPanUp: document.getElementById('btnPreviewPanUp'),
    btnPreviewPanDown: document.getElementById('btnPreviewPanDown'),
    btnPreviewPanCenter: document.getElementById('btnPreviewPanCenter'),
    btnPreviewRotate: document.getElementById('btnPreviewRotate'),
    btnPreviewFlipH: document.getElementById('btnPreviewFlipH'),
    btnPreviewFlipV: document.getElementById('btnPreviewFlipV'),
    btnCropModeCover: document.getElementById('btnCropModeCover'),
    btnCropModeContain: document.getElementById('btnCropModeContain'),
    previewBarCropModeVal: document.getElementById('previewBarCropModeVal'),
    btnResetAdjustments: document.getElementById('btnResetAdjustments'),
    previewBarBrightness: document.getElementById('previewBarBrightness'),
    previewBarBrightnessVal: document.getElementById('previewBarBrightnessVal'),
    previewBarContrast: document.getElementById('previewBarContrast'),
    previewBarContrastVal: document.getElementById('previewBarContrastVal'),
    previewBarSaturation: document.getElementById('previewBarSaturation'),
    previewBarSaturationVal: document.getElementById('previewBarSaturationVal'),
    previewBarWarmth: document.getElementById('previewBarWarmth'),
    previewBarWarmthVal: document.getElementById('previewBarWarmthVal'),
    btnHudSwitchLeftRight: document.getElementById('btnHudSwitchLeftRight'),
    btnPreviewSwitchLeftRight: document.getElementById('btnPreviewSwitchLeftRight'),
    btnPreviewBringToFront: document.getElementById('btnPreviewBringToFront'),
    btnPreviewBringForward: document.getElementById('btnPreviewBringForward'),
    btnPreviewSendBackward: document.getElementById('btnPreviewSendBackward'),
    btnPreviewSendToBack: document.getElementById('btnPreviewSendToBack'),
    btnPreviewSwapPhoto: document.getElementById('btnPreviewSwapPhoto'),
    btnPreviewRemovePhoto: document.getElementById('btnPreviewRemovePhoto'),
    btnPreviewDeleteFrame: document.getElementById('btnPreviewDeleteFrame'),
    btnClosePreviewBar: document.getElementById('btnClosePreviewBar'),
    canvasDropOverlay: document.getElementById('canvasDropOverlay'),
    
    // Filmstrip
    filmstripList: document.getElementById('filmstripList'),
    btnAddSpread: document.getElementById('btnAddSpread'),
    
    // Photo Tray
    photoTraySection: document.getElementById('photoTraySection'),
    photoTrayList: document.getElementById('photoTrayList'),
    photoFileInput: document.getElementById('photoFileInput'),
    btnImportFolder: document.getElementById('btnImportFolder'),
    folderFileInput: document.getElementById('folderFileInput'),
    btnRelinkPhotos: document.getElementById('btnRelinkPhotos'),
    relinkFolderInput: document.getElementById('relinkFolderInput'),
    btnImportPhotos: document.getElementById('btnImportPhotos'),
    btnLoadSamples: document.getElementById('btnLoadSamples'),
    btnQuickAutoBuild: document.getElementById('btnQuickAutoBuild'),
    btnTrayStripView: document.getElementById('btnTrayStripView'),
    btnTrayGridView: document.getElementById('btnTrayGridView'),
    btnTrayExpand: document.getElementById('btnTrayExpand'),
    trayExpandLabel: document.getElementById('trayExpandLabel'),
    trayTabAll: document.getElementById('trayTabAll'),
    trayTabUnused: document.getElementById('trayTabUnused'),
    trayTabUsed: document.getElementById('trayTabUsed'),
    traySelectionIndicator: document.getElementById('traySelectionIndicator'),
    traySelectedCount: document.getElementById('traySelectedCount'),
    btnPlaceSelected: document.getElementById('btnPlaceSelected'),
    btnDeleteSelectedPhotos: document.getElementById('btnDeleteSelectedPhotos'),
    btnClearSelection: document.getElementById('btnClearSelection'),
    btnTogglePhotoOrder: document.getElementById('btnTogglePhotoOrder'),
    labelPhotoOrderMode: document.getElementById('labelPhotoOrderMode'),
    
    // Layouts Catalog Drawer
    layoutsDrawer: document.getElementById('layoutsDrawer'),
    btnCloseDrawer: document.getElementById('btnCloseDrawer'),
    catalogGrid: document.getElementById('catalogGrid'),
    drawerFilterBar: document.getElementById('drawerFilterBar'),
    drawerLayoutsCount: document.getElementById('drawerLayoutsCount'),
    
    // Auto-Build Modal
    modalAutoBuild: document.getElementById('modalAutoBuild'),
    btnCloseAutoBuild: document.getElementById('btnCloseAutoBuild'),
    btnCancelAutoBuild: document.getElementById('btnCancelAutoBuild'),
    btnRunAutoBuild: document.getElementById('btnRunAutoBuild'),
    autoBuildPhotoScope: document.getElementById('autoBuildPhotoScope'),
    autoBuildSpreadMode: document.getElementById('autoBuildSpreadMode'),
    autoBuildTargetSpreadCount: document.getElementById('autoBuildTargetSpreadCount'),
    containerAutoBuildTargetSpreads: document.getElementById('containerAutoBuildTargetSpreads'),
    containerAutoBuildDensitySettings: document.getElementById('containerAutoBuildDensitySettings'),
    autoBuildMinPhotos: document.getElementById('autoBuildMinPhotos'),
    autoBuildMaxPhotos: document.getElementById('autoBuildMaxPhotos'),
    
    // Export Modal
    modalExport: document.getElementById('modalExport'),
    btnCloseExport: document.getElementById('btnCloseExport'),
    btnCancelExport: document.getElementById('btnCancelExport'),
    btnStartExport: document.getElementById('btnStartExport'),
    exportFormatSelect: document.getElementById('exportFormatSelect'),
    exportLayoutModeSelect: document.getElementById('exportLayoutModeSelect'),
    exportDpiSelect: document.getElementById('exportDpiSelect'),
    exportSpreadDimensionsBadge: document.getElementById('exportSpreadDimensionsBadge'),
    exportResolutionDetail: document.getElementById('exportResolutionDetail'),
    exportProgressBox: document.getElementById('exportProgressBox'),
    exportProgressBar: document.getElementById('exportProgressBar'),
    exportProgressStatus: document.getElementById('exportProgressStatus'),
    btnBrowseExportDir: document.getElementById('btnBrowseExportDir'),
    exportDestinationPath: document.getElementById('exportDestinationPath'),
    chkExportCreateFolder: document.getElementById('chkExportCreateFolder'),
    exportSubfolderNamePreview: document.getElementById('exportSubfolderNamePreview'),
    exportDirStatusBadge: document.getElementById('exportDirStatusBadge'),
    chkPdfPageLabels: document.getElementById('chkPdfPageLabels'),
    exportPdfProjectName: document.getElementById('exportPdfProjectName'),
    exportSinglePageMarginGroup: document.getElementById('exportSinglePageMarginGroup'),

    // Canvas Context Menu
    canvasContextMenu: document.getElementById('canvasContextMenu'),
    ctxFrameHeaderTitle: document.getElementById('ctxFrameHeaderTitle'),
    ctxFrameSettings: document.getElementById('ctxFrameSettings'),
    ctxDuplicateRight: document.getElementById('ctxDuplicateRight'),
    ctxDuplicateLeft: document.getElementById('ctxDuplicateLeft'),
    ctxDuplicateRightLabel: document.getElementById('ctxDuplicateRightLabel'),
    ctxDuplicateLeftLabel: document.getElementById('ctxDuplicateLeftLabel'),
    ctxDeletePhoto: document.getElementById('ctxDeletePhoto'),
    ctxDeleteFrame: document.getElementById('ctxDeleteFrame'),
    ctxSwapPhoto: document.getElementById('ctxSwapPhoto'),
    ctxSwitchLeftRight: document.getElementById('ctxSwitchLeftRight'),
    ctxFlipH: document.getElementById('ctxFlipH'),
    ctxFlipV: document.getElementById('ctxFlipV'),
    ctxRotate: document.getElementById('ctxRotate'),
    ctxBringToFront: document.getElementById('ctxBringToFront'),
    ctxSendToBack: document.getElementById('ctxSendToBack'),

    // Spreads Timeline Context Menu
    filmstripContextMenu: document.getElementById('filmstripContextMenu'),
    ctxInsertSpreadBefore: document.getElementById('ctxInsertSpreadBefore'),
    ctxInsertSpreadAfter: document.getElementById('ctxInsertSpreadAfter'),
    ctxDeleteSpread: document.getElementById('ctxDeleteSpread'),

    // Controls & Formats Panel Layouts Section
    controlsLayoutsSection: document.getElementById('controlsLayoutsSection'),
    controlsLayoutsStrip: document.getElementById('controlsLayoutsStrip'),
    controlsLayoutsCountBadge: document.getElementById('controlsLayoutsCountBadge'),
    btnControlsPrevLayout: document.getElementById('btnControlsPrevLayout'),
    btnControlsNextLayout: document.getElementById('btnControlsNextLayout'),
    btnControlsOpenAllLayouts: document.getElementById('btnControlsOpenAllLayouts'),

    // Template Converter & Loader
    btnLoadTemplateImage: document.getElementById('btnLoadTemplateImage'),
    inputLoadTemplateImage: document.getElementById('inputLoadTemplateImage'),
    modalConvertTemplatePreview: document.getElementById('modalConvertTemplatePreview'),
    btnCloseConvertTemplate: document.getElementById('btnCloseConvertTemplate'),
    btnCancelConvertTemplate: document.getElementById('btnCancelConvertTemplate'),
    btnSaveTemplateOnly: document.getElementById('btnSaveTemplateOnly'),
    btnSaveAndApplyTemplate: document.getElementById('btnSaveAndApplyTemplate'),
    inputConvertedTemplateName: document.getElementById('inputConvertedTemplateName'),
    convertTemplateSourceImg: document.getElementById('convertTemplateSourceImg'),
    convertTemplateStageWrapper: document.getElementById('convertTemplateStageWrapper'),
    convertTemplateBoxesOverlay: document.getElementById('convertTemplateBoxesOverlay'),
    convertTemplateSmartGuides: document.getElementById('convertTemplateSmartGuides'),
    convertTemplateSpineLine: document.getElementById('convertTemplateSpineLine'),
    convertTemplateGhostBox: document.getElementById('convertTemplateGhostBox'),
    convertTemplateMarquee: document.getElementById('convertTemplateMarquee'),
    convertTemplateStatusBadge: document.getElementById('convertTemplateStatusBadge'),
    lblAutoCount: document.getElementById('lblAutoCount'),
    btnPresetAutoDetect: document.getElementById('btnPresetAutoDetect'),
    convertPresetButtons: document.getElementById('convertPresetButtons'),
    btnConvertSelectAll: document.getElementById('btnConvertSelectAll'),
    btnConvertDeselectAll: document.getElementById('btnConvertDeselectAll'),
    btnConvertDuplicateSelected: document.getElementById('btnConvertDuplicateSelected'),
    btnConvertDeleteSelected: document.getElementById('btnConvertDeleteSelected'),
    btnConvertClearFrames: document.getElementById('btnConvertClearFrames'),
    btnConvertRedetectFrames: document.getElementById('btnConvertRedetectFrames'),
    convertMultiAdjustBar: document.getElementById('convertMultiAdjustBar'),
    lblSelectedBoxesCount: document.getElementById('lblSelectedBoxesCount'),
    btnAlignLeft: document.getElementById('btnAlignLeft'),
    btnAlignCenterH: document.getElementById('btnAlignCenterH'),
    btnAlignRight: document.getElementById('btnAlignRight'),
    btnAlignTop: document.getElementById('btnAlignTop'),
    btnAlignMiddleV: document.getElementById('btnAlignMiddleV'),
    btnAlignBottom: document.getElementById('btnAlignBottom'),
    btnConvertAlignLeft: document.getElementById('btnConvertAlignLeft'),
    btnConvertAlignCenterH: document.getElementById('btnConvertAlignCenterH'),
    btnConvertAlignRight: document.getElementById('btnConvertAlignRight'),
    btnConvertAlignTop: document.getElementById('btnConvertAlignTop'),
    btnConvertAlignMiddleV: document.getElementById('btnConvertAlignMiddleV'),
    btnConvertAlignBottom: document.getElementById('btnConvertAlignBottom'),
    btnToolSelect: document.getElementById('btnToolSelect'),
    btnToolHand: document.getElementById('btnToolHand'),
    btnDistributeH: document.getElementById('btnDistributeH'),
    btnDistributeV: document.getElementById('btnDistributeV'),
    btnMakeSameWidth: document.getElementById('btnMakeSameWidth'),
    btnMakeSameHeight: document.getElementById('btnMakeSameHeight'),
    btnConvertAddText: document.getElementById('btnConvertAddText'),
    convertBatchNav: document.getElementById('convertBatchNav'),
    btnBatchPrev: document.getElementById('btnBatchPrev'),
    lblBatchProgress: document.getElementById('lblBatchProgress'),
    btnBatchNext: document.getElementById('btnBatchNext'),
    convertSingleActions: document.getElementById('convertSingleActions'),
    convertBatchActions: document.getElementById('convertBatchActions'),
    btnCancelBatchConvert: document.getElementById('btnCancelBatchConvert'),
    btnBatchSkip: document.getElementById('btnBatchSkip'),
    btnBatchConfirmNext: document.getElementById('btnBatchConfirmNext'),
    btnBatchConfirmAll: document.getElementById('btnBatchConfirmAll'),

    // Big View Template Library Modal
    modalBrowseAllTemplates: document.getElementById('modalBrowseAllTemplates'),
    btnCloseBrowseAllTemplates: document.getElementById('btnCloseBrowseAllTemplates'),
    btnDoneBrowseAllTemplates: document.getElementById('btnDoneBrowseAllTemplates'),
    btnBigViewSelectAll: document.getElementById('btnBigViewSelectAll'),
    btnBigViewDeselectAll: document.getElementById('btnBigViewDeselectAll'),
    btnBigViewDeleteSelected: document.getElementById('btnBigViewDeleteSelected'),
    lblBigViewSelectedCount: document.getElementById('lblBigViewSelectedCount'),
    bigViewMarquee: document.getElementById('bigViewMarquee'),
    lblBigViewRealTotal: document.getElementById('lblBigViewRealTotal'),
    bigViewFilterPills: document.getElementById('bigViewFilterPills'),
    selectBigViewOrientation: document.getElementById('selectBigViewOrientation'),
    inputBigViewSearch: document.getElementById('inputBigViewSearch'),
    bigViewTemplatesGrid: document.getElementById('bigViewTemplatesGrid'),
    lblBigViewFooterStatus: document.getElementById('lblBigViewFooterStatus'),
    btnBigViewOpenManager: document.getElementById('btnBigViewOpenManager'),
    btnOpenBigViewFromManager: document.getElementById('btnOpenBigViewFromManager'),
    btnDrawerOpenBigView: document.getElementById('btnDrawerOpenBigView'),

    // Tutorials Modal
    modalTutorials: document.getElementById('modalTutorials'),
    btnCloseTutorials: document.getElementById('btnCloseTutorials'),
    btnOkTutorials: document.getElementById('btnOkTutorials'),

    // Activation Modal
    modalActivate: document.getElementById('modalActivate'),
    btnCloseActivate: document.getElementById('btnCloseActivate'),
    btnCancelActivate: document.getElementById('btnCancelActivate'),
    btnSubmitActivate: document.getElementById('btnSubmitActivate'),
    activateKeyInput: document.getElementById('activateKeyInput'),
    activateStatusBadge: document.getElementById('activateStatusBadge'),

    // Profile Dropdown & Modals
    controlToolbar: document.getElementById('controlToolbar'),
    toolbarHoverTrigger: document.getElementById('toolbarHoverTrigger'),
    btnProfileMenu: document.getElementById('btnProfileMenu'),
    profileMenuContainer: document.getElementById('profileMenuContainer'),
    profileDropdownCard: document.getElementById('profileDropdownCard'),
    profileUserDisplay: document.getElementById('profileUserDisplay'),
    profileEmailDisplay: document.getElementById('profileEmailDisplay'),
    btnProfileSettings: document.getElementById('btnProfileSettings'),
    btnProfileGmail: document.getElementById('btnProfileGmail'),
    btnProfileSubscription: document.getElementById('btnProfileSubscription'),
    btnProfileLogin: document.getElementById('btnProfileLogin'),
    btnProfileLogout: document.getElementById('btnProfileLogout'),
    btnProfileAboutUs: document.getElementById('btnProfileAboutUs'),
    modalSettings: document.getElementById('modalSettings'),
    btnCloseSettings: document.getElementById('btnCloseSettings'),
    btnSaveSettings: document.getElementById('btnSaveSettings'),
    modalSubscription: document.getElementById('modalSubscription'),
    btnCloseSubscription: document.getElementById('btnCloseSubscription'),
    btnOkSubscription: document.getElementById('btnOkSubscription'),
    modalLogin: document.getElementById('modalLogin'),
    btnCloseLogin: document.getElementById('btnCloseLogin'),
    btnCancelLogin: document.getElementById('btnCancelLogin'),
    btnSubmitLogin: document.getElementById('btnSubmitLogin'),
    loginEmailInput: document.getElementById('loginEmailInput'),
    loginPasswordInput: document.getElementById('loginPasswordInput'),
    modalAboutUs: document.getElementById('modalAboutUs'),
    btnCloseAboutUs: document.getElementById('btnCloseAboutUs'),
    btnOkAboutUs: document.getElementById('btnOkAboutUs'),

    // Canvas Zoom HUD
    canvasZoomHud: document.getElementById('canvasZoomHud'),
    btnZoomIn: document.getElementById('btnZoomIn'),
    btnZoomOut: document.getElementById('btnZoomOut'),
    btnZoomReset: document.getElementById('btnZoomReset')
  };

  // --- Maximized Canvas Stage & Interactive Zoom State ---
  let canvasZoomLevel = 1.0;
  let canvasPanX = 0;
  let canvasPanY = 0;

  function applyCanvasZoom() {
    const wrapper = els.canvasWrapper || document.getElementById('canvasWrapper');
    if (!wrapper) return;
    wrapper.style.transform = `translate(${canvasPanX}px, ${canvasPanY}px) scale(${canvasZoomLevel})`;
    const zoomText = `${Math.round(canvasZoomLevel * 100)}%`;
    if (els.btnZoomReset) {
      els.btnZoomReset.textContent = zoomText;
    }
    const topbarZoomVal = document.getElementById('topbarZoomVal');
    if (topbarZoomVal) {
      topbarZoomVal.textContent = zoomText;
    }
  }

  function setCanvasZoom(newZoom) {
    canvasZoomLevel = Math.max(0.35, Math.min(3.5, Math.round(newZoom * 100) / 100));
    if (Math.abs(canvasZoomLevel - 1.0) < 0.01) {
      canvasZoomLevel = 1.0;
      canvasPanX = 0;
      canvasPanY = 0;
    }
    applyCanvasZoom();
  }

  window.panCanvasBy = (dx, dy) => {
    canvasPanX += dx;
    canvasPanY += dy;
    applyCanvasZoom();
  };

  function resizeCanvasStage() {
    const stage = els.canvasStage;
    if (!stage) return;

    // Use stage client dimensions, fallback to window dimensions if unmeasured yet
    const stageW = stage.clientWidth > 100 ? stage.clientWidth : (window.innerWidth - (document.querySelector('.studio-aside-panel.open') ? 400 : 0));
    const stageH = stage.clientHeight > 100 ? stage.clientHeight : (window.innerHeight - 250);

    // Padding accounts for: top toolbar dock (38px + margins), stage padding, and 22px rulers if visible
    const rulerOffset = (canvasRenderer && canvasRenderer.showRulers) ? 24 : 0;
    const paddingX = 40 + rulerOffset;
    const paddingY = 70 + rulerOffset;

    const availW = Math.max(360, stageW - paddingX);
    const availH = Math.max(200, stageH - paddingY);

    const aspect = albumState.getActiveAspect() || 2.0;

    let targetW = availW;
    let targetH = targetW / aspect;

    if (targetH > availH) {
      targetH = availH;
      targetW = targetH * aspect;
    }

    targetW = Math.floor(targetW);
    targetH = Math.floor(targetH);

    canvasRenderer.setCanvasDimensions(targetW, targetH);
    applyCanvasZoom();
  }

  // Automatically resize canvas stage whenever viewport or side panels change
  window.addEventListener('resize', resizeCanvasStage);
  if (typeof ResizeObserver !== 'undefined' && els.canvasStage) {
    const stageObserver = new ResizeObserver(() => {
      resizeCanvasStage();
    });
    stageObserver.observe(els.canvasStage);
  }
  window.resizeCanvasStage = resizeCanvasStage;

  // Animated Draw Banner Controller
  let drawBannerTimeout = null;
  function showDrawBannerToast() {
    if (!els.canvasDrawBanner) return;
    if (drawBannerTimeout) clearTimeout(drawBannerTimeout);
    els.canvasDrawBanner.style.display = 'flex';
    els.canvasDrawBanner.classList.remove('fade-out');
    els.canvasDrawBanner.classList.add('fade-in');
    drawBannerTimeout = setTimeout(() => {
      dismissDrawBannerToast();
    }, 1800);
  }

  function dismissDrawBannerToast() {
    if (!els.canvasDrawBanner) return;
    if (drawBannerTimeout) clearTimeout(drawBannerTimeout);
    els.canvasDrawBanner.classList.add('fade-out');
    setTimeout(() => {
      if (els.canvasDrawBanner && els.canvasDrawBanner.classList.contains('fade-out')) {
        els.canvasDrawBanner.style.display = 'none';
        els.canvasDrawBanner.classList.remove('fade-out');
      }
    }, 350);
  }
  window.showDrawBannerToast = showDrawBannerToast;
  window.dismissDrawBannerToast = dismissDrawBannerToast;

  // --- Dynamic Book/Project Title Sync for Header and Window Title Bar ---
  function updateAppBookTitle(title) {
    const bookTitle = title || albumState.project?.title || '';
    const headerBookName = document.getElementById('headerBookName');
    if (headerBookName) {
      headerBookName.textContent = bookTitle || 'No Project Open';
      headerBookName.title = bookTitle ? `Active Book: ${bookTitle}` : 'No book loaded';
    }
    const headerProjectStatus = document.getElementById('headerProjectStatus');
    if (headerProjectStatus) {
      headerProjectStatus.innerHTML = `<i></i>${bookTitle ? 'Project Ready' : 'No Project Open'}`;
    }
    const fullTitle = bookTitle
      ? `Smart Ease - Smart Photobook Designer — ${bookTitle}`
      : `Smart Ease - Smart Photobook Designer`;
    document.title = fullTitle;
    fetch('/api/set_window_title', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: fullTitle })
    }).catch(() => {});
  }
  window.updateAppBookTitle = updateAppBookTitle;

  let photoTrayDebounceTimer = null;
  function debouncedRenderPhotoTray() {
    if (photoTrayDebounceTimer) cancelAnimationFrame(photoTrayDebounceTimer);
    photoTrayDebounceTimer = requestAnimationFrame(() => {
      renderPhotoTray();
      photoTrayDebounceTimer = null;
    });
  }

  // --- Album State Subscription ---
  albumState.subscribe((eventType, detail) => {
    updateHUD();
    updateUndoRedoButtons();

    if (eventType === 'project-loaded' || eventType === 'project-renamed') {
      updateAppBookTitle(albumState.project?.title);
      if (canvasRenderer.preloadAllSpreadImages) {
        canvasRenderer.preloadAllSpreadImages();
      }
    }

    if (eventType === 'spread-activated') {
      updateFilmstripSelectionUI();
      renderFloatingLayoutsBar();
      canvasRenderer.requestRender();
      return;
    }

    const isLightweightEvent = (
      eventType === 'slot-pan-updated' ||
      eventType === 'slot-zoom-updated' ||
      eventType === 'slot-adjusted' ||
      eventType === 'slot-selected' ||
      eventType === 'slots-selected' ||
      eventType === 'slot-double-clicked' ||
      eventType === 'slot-deselected' ||
      eventType === 'draw-mode-changed' ||
      eventType === 'text-frame-added' ||
      eventType === 'text-frame-updated' ||
      eventType === 'text-slot-added' ||
      eventType === 'text-slot-updated'
    );

    if (!isLightweightEvent) {
      debouncedRenderFilmstrip();
      debouncedRenderPhotoTray();
      renderFloatingLayoutsBar();
    }

    if (eventType === 'draw-mode-changed') {
      const isDrawing = Boolean(detail);
      if (els.btnDrawFrame) els.btnDrawFrame.classList.toggle('active', isDrawing);
      if (els.btnHudDrawFrame) els.btnHudDrawFrame.classList.toggle('active', isDrawing);
      if (isDrawing) {
        if (window.showDrawBannerToast) window.showDrawBannerToast();
      } else {
        if (window.dismissDrawBannerToast) window.dismissDrawBannerToast();
      }
    } else if (eventType === 'frames-deleted') {
      canvasRenderer.selectedSlotIndex = null;
      if (canvasRenderer.selectedSlotIndices) canvasRenderer.selectedSlotIndices.clear();
      if (els.photoFramePreviewBar) els.photoFramePreviewBar.style.display = 'none';
    } else if (eventType === 'slots-selected') {
      // Synchronize multi-selected canvas frames with photo tray
      if (detail?.slotIndices && Array.isArray(detail.slotIndices)) {
        const spread = albumState.getActiveSpread();
        if (spread) {
          selectedPhotoIds.clear();
          detail.slotIndices.forEach(idx => {
            const slot = spread.slots.find(s => s.slotIndex === idx);
            if (slot?.photoId) {
              selectedPhotoIds.add(slot.photoId);
            }
          });
          updateTraySelectionUI();
        }
      }
    } else if (eventType === 'slot-double-clicked') {
      updatePreviewBarForSlot(detail.slotIndex);
    } else if (eventType === 'slot-selected') {
      const spread = albumState.getActiveSpread();
      const slot = spread?.slots?.find(s => s.slotIndex === detail.slotIndex);
      if (slot?.isText) {
        if (els.photoFramePreviewBar) els.photoFramePreviewBar.style.display = 'none';
        return;
      }
      // Synchronize single selected slot with photo tray and scroll to it
      if (slot?.photoId && (!detail.slotIndices || detail.slotIndices.length <= 1)) {
        selectedPhotoIds.clear();
        selectedPhotoIds.add(slot.photoId);
        updateTraySelectionUI();
        scrollToPhotoInTray(slot.photoId);
      }
      // If the right-side inspector panel is already open, update it for the newly selected slot
      if (els.photoFramePreviewBar && els.photoFramePreviewBar.style.display !== 'none') {
        updatePreviewBarForSlot(detail.slotIndex);
      }
    } else if (eventType === 'slots-swapped') {
      if (canvasRenderer.selectedSlotIndex !== null && els.photoFramePreviewBar && els.photoFramePreviewBar.style.display !== 'none') {
        updatePreviewBarForSlot(canvasRenderer.selectedSlotIndex);
      }
    } else if (eventType === 'slot-deselected' || eventType === 'spread-activated' || eventType === 'spread-added' || eventType === 'spread-removed') {
      if (eventType !== 'slot-selected' && eventType !== 'slot-double-clicked' && eventType !== 'slots-selected') {
        canvasRenderer.selectedSlotIndex = null;
        if (canvasRenderer.selectedSlotIndices) canvasRenderer.selectedSlotIndices.clear();
        if (els.photoFramePreviewBar) els.photoFramePreviewBar.style.display = 'none';
      }
    } else if (eventType === 'slot-zoom-updated' || eventType === 'slot-pan-updated' || eventType === 'slot-adjusted') {
      if (canvasRenderer.selectedSlotIndex !== null && els.photoFramePreviewBar && els.photoFramePreviewBar.style.display !== 'none') {
        updatePreviewBarValues(canvasRenderer.selectedSlotIndex);
      }
    }

    canvasRenderer.requestRender();
    if (typeof window.updateLiveTransformReadouts === 'function') {
      window.updateLiveTransformReadouts();
    }
  });

  function syncAlbumSizeSelectLabels() {
    if (!els.albumSizeSelect) return;
    const currentOrient = albumState.getSpreadOrientation();
    const isSpread = albumState.project.pageMode === 'spread';
    
    albumState.sizePresets.forEach(preset => {
      const opt = els.albumSizeSelect.querySelector(`option[value="${preset.id}"]`);
      if (opt) {
        const dims = albumState.getPresetSpreadDimensions(preset, currentOrient, albumState.project.pageMode);
        const modeLabel = isSpread ? 'Spread' : 'Page';
        const cleanName = preset.name.split('(')[0].trim();
        opt.textContent = `${cleanName} (${modeLabel}: ${dims.width} × ${dims.height}")`;
      }
    });
    if (albumState.project.selectedSize) {
      els.albumSizeSelect.value = albumState.project.selectedSize.id;
    }
  }
  window.syncAlbumSizeSelectLabels = syncAlbumSizeSelectLabels;

  function updateHUD() {
    const spread = albumState.getActiveSpread();
    const currIdx = albumState.activeSpreadIndex;
    const total = albumState.project.spreads.length;

    if (spread && els.hudPageLabel) {
      const p = currIdx * 2 + 1;
      const sheetW = albumState.getSheetWidthInches(currIdx);
      const sheetH = albumState.getSheetHeightInches(currIdx);
      const orient = albumState.getSpreadOrientation(currIdx);
      const orientLabel = orient.charAt(0).toUpperCase() + orient.slice(1);
      
      const label = albumState.project.pageMode === 'single'
        ? `PAGE ${currIdx + 1} OF ${total} • ${sheetW}" × ${sheetH}" (${orientLabel})`
        : `SPREAD ${currIdx + 1} OF ${total} • PAGES ${p} - ${p + 1} • ${sheetW}" × ${sheetH}" (${orientLabel})`;
      els.hudPageLabel.textContent = label;
      if (els.hudLayoutName) els.hudLayoutName.textContent = spread.layout?.name || 'Default';
    }

    if (els.btnPrevSpread) els.btnPrevSpread.disabled = currIdx <= 0;
    if (els.btnNextSpread) els.btnNextSpread.disabled = currIdx >= total - 1;
    if (els.btnStagePrevSpread) els.btnStagePrevSpread.style.display = currIdx > 0 ? 'flex' : 'none';
    if (els.btnStageNextSpread) els.btnStageNextSpread.style.display = currIdx < total - 1 ? 'flex' : 'none';

    syncSpacingControlsUI();
    syncAlbumSizeSelectLabels();
  }

  function updateUndoRedoButtons() {
    if (els.btnUndo) els.btnUndo.disabled = albumState.undoStack.length === 0;
    if (els.btnRedo) els.btnRedo.disabled = albumState.redoStack.length === 0;
    const btnDockUndo = document.getElementById('btnDockUndo');
    if (btnDockUndo) btnDockUndo.disabled = albumState.undoStack.length === 0;
    const btnDockRedo = document.getElementById('btnDockRedo');
    if (btnDockRedo) btnDockRedo.disabled = albumState.redoStack.length === 0;
  }

  // --- Ultra-Fast Photo Thumbnail Resolution ---
  function getPhotoThumbnailUrl(photo) {
    if (!photo) return '';
    // 0. Prefer active blob or data URIs directly
    if (typeof photo.thumbSrc === 'string' && (photo.thumbSrc.startsWith('blob:') || photo.thumbSrc.startsWith('data:'))) {
      return photo.thumbSrc;
    }
    if (typeof photo.src === 'string' && (photo.src.startsWith('blob:') || photo.src.startsWith('data:'))) {
      return photo.src;
    }
    if (photo.thumbSrc && !photo.thumbSrc.includes('/api/local_image?path=')) {
      return (typeof window.getApiUrl === 'function') ? window.getApiUrl(photo.thumbSrc) : photo.thumbSrc;
    }
    const rawPath = photo.filePath || (typeof photo.src === 'string' && photo.src.includes('path=') ? decodeURIComponent(photo.src.split('path=')[1]) : null);
    if (rawPath) {
      const ep = `/api/local_image?path=${encodeURIComponent(rawPath)}&thumb=1`;
      return (typeof window.getApiUrl === 'function') ? window.getApiUrl(ep) : ep;
    }
    if (photo.src && photo.src.includes('/api/local_image')) {
      const ep = photo.src.includes('thumb=') ? photo.src : (photo.src + '&thumb=1');
      return (typeof window.getApiUrl === 'function') ? window.getApiUrl(ep) : ep;
    }
    const fallback = photo.thumbSrc || photo.src || '';
    return (typeof window.getApiUrl === 'function') ? window.getApiUrl(fallback) : fallback;
  }
  window.getPhotoThumbnailUrl = getPhotoThumbnailUrl;

  // --- Filmstrip Debounce & Fragment Rendering ---
  let filmstripDebounceTimer = null;
  function debouncedRenderFilmstrip() {
    if (filmstripDebounceTimer) cancelAnimationFrame(filmstripDebounceTimer);
    filmstripDebounceTimer = requestAnimationFrame(() => {
      renderFilmstrip();
      filmstripDebounceTimer = null;
    });
  }

  // --- Spreads Timeline Fast Class Toggle (0ms sub-millisecond instant switching) ---
  function updateFilmstripSelectionUI() {
    const container = els.filmstripList;
    if (!container) return;
    const cards = container.querySelectorAll('.spread-card');
    const totalSpreads = albumState.project?.spreads?.length || 0;
    if (cards.length !== totalSpreads) {
      debouncedRenderFilmstrip();
      return;
    }

    if (!selectedSpreadIndices.has(albumState.activeSpreadIndex) && selectedSpreadIndices.size === 0) {
      selectedSpreadIndices.add(albumState.activeSpreadIndex);
    }

    cards.forEach((card, idx) => {
      const isActive = (idx === albumState.activeSpreadIndex);
      const isSelected = selectedSpreadIndices.has(idx);
      card.classList.toggle('active', isActive);
      card.classList.toggle('selected', isSelected);
      const selectTag = (selectedSpreadIndices.size > 1 && isSelected) ? `<span style="color: var(--accent-primary); font-weight: 700;">✓</span> ` : '';
      const count = albumState.project.spreads[idx]?.photoIds?.length || 0;
      const info = card.querySelector('.spread-card-info');
      if (info) {
        info.innerHTML = `<span>${selectTag}Spread ${idx + 1}</span><span>${count} photos</span>`;
      }
    });

    const metaSubtitle = document.getElementById('filmstripMetaSubtitle');
    if (metaSubtitle) {
      const isSingle = albumState.project?.settings?.pageMode === 'single';
      const pageUnit = isSingle ? 'Page' : 'Spread';
      const activeIdx = Math.min((albumState.activeSpreadIndex || 0) + 1, totalSpreads || 1);
      const selectedCount = selectedSpreadIndices.size;
      const selectSuffix = selectedCount > 1 ? ` • ${selectedCount} spreads selected` : '';
      metaSubtitle.textContent = `Active ${pageUnit} ${activeIdx} of ${totalSpreads}${selectSuffix} • Drag to reorder`;
    }

    const activeCard = container.querySelector('.spread-card.active');
    if (activeCard) {
      activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }
  window.updateFilmstripSelectionUI = updateFilmstripSelectionUI;

  // --- Spreads Timeline Multi-Selection State (Shift range, Ctrl toggle) ---
  const selectedSpreadIndices = new Set([0]);
  let lastSelectedSpreadIndex = 0;

  function insertSpreadAt(insertIndex, notifyLabel) {
    albumState.addSpread([], insertIndex);
    albumState.setActiveSpread(insertIndex);
    selectedSpreadIndices.clear();
    selectedSpreadIndices.add(insertIndex);
    lastSelectedSpreadIndex = insertIndex;
    renderFilmstrip();
    canvasRenderer.requestRender();
    if (notifyLabel) {
      showToastNotification(notifyLabel);
    }
  }

  function createInsertSpreadDivider(insertIndex, tooltip) {
    const divider = document.createElement('div');
    divider.className = 'spread-insert-divider';
    divider.title = tooltip;

    const btn = document.createElement('div');
    btn.className = 'btn-insert-between';
    btn.innerHTML = '+';
    divider.appendChild(btn);

    divider.addEventListener('click', (e) => {
      e.stopPropagation();
      insertSpreadAt(insertIndex, tooltip);
    });

    return divider;
  }

  function renderFilmstrip() {
    const container = els.filmstripList;
    if (!container) return;

    // Update Spreads Timeline Header Counters
    const countBadge = document.getElementById('filmstripSpreadCount');
    const metaSubtitle = document.getElementById('filmstripMetaSubtitle');
    const totalSpreads = albumState.project?.spreads?.length || 0;
    const isSingle = albumState.project?.settings?.pageMode === 'single';
    const totalPages = isSingle ? totalSpreads : (totalSpreads * 2);
    const pageUnit = isSingle ? 'Page' : 'Spread';

    // Keep active spread in selected list
    if (!selectedSpreadIndices.has(albumState.activeSpreadIndex) && selectedSpreadIndices.size === 0) {
      selectedSpreadIndices.add(albumState.activeSpreadIndex);
    }

    if (countBadge) {
      countBadge.textContent = isSingle
        ? `${totalSpreads} ${totalSpreads === 1 ? 'Page' : 'Pages'}`
        : `${totalSpreads} ${totalSpreads === 1 ? 'Spread' : 'Spreads'} (${totalPages} Pages)`;
    }
    if (metaSubtitle) {
      const activeIdx = Math.min((albumState.activeSpreadIndex || 0) + 1, totalSpreads || 1);
      const selectedCount = selectedSpreadIndices.size;
      const selectSuffix = selectedCount > 1 ? ` • ${selectedCount} spreads selected` : '';
      metaSubtitle.textContent = `Active ${pageUnit} ${activeIdx} of ${totalSpreads}${selectSuffix} • Drag to reorder`;
    }

    container.innerHTML = '';

    const fragment = document.createDocumentFragment();

    albumState.project.spreads.forEach((spread, idx) => {
      const isPortrait = albumState.getSpreadOrientation(idx) === 'portrait';
      const isActive = (idx === albumState.activeSpreadIndex);
      const isSelected = selectedSpreadIndices.has(idx);

      // Insertion divider before the first spread (Spread 1)
      if (idx === 0) {
        fragment.appendChild(createInsertSpreadDivider(0, '➕ Insert spread before Spread 1'));
      }

      const card = document.createElement('div');
      card.className = `spread-card ${isActive ? 'active' : ''} ${isSelected ? 'selected' : ''} ${isPortrait ? 'portrait-spread' : ''}`;
      card.draggable = true;

      // Miniature Spread Preview
      const preview = document.createElement('div');
      preview.className = 'spread-card-preview';

      // Spine crease
      const miniCrease = document.createElement('div');
      miniCrease.className = 'mini-crease';
      preview.appendChild(miniCrease);

      // Render miniature slots
      if (spread.layout?.rects) {
        spread.layout.rects.forEach((r, slotIdx) => {
          const miniSlot = document.createElement('div');
          miniSlot.className = 'mini-slot';
          miniSlot.style.left = (r.x * 100) + '%';
          miniSlot.style.top = (r.y * 100) + '%';
          miniSlot.style.width = (r.w * 100) + '%';
          miniSlot.style.height = (r.h * 100) + '%';

          const slotData = spread.slots?.find(s => s.slotIndex === slotIdx);
          if (slotData?.photoId) {
            const photo = albumState.getPhotoById(slotData.photoId);
            if (photo) {
              miniSlot.style.backgroundImage = `url("${getPhotoThumbnailUrl(photo)}")`;
            }
          }
          preview.appendChild(miniSlot);
        });
      }

      // Spread Info Bar
      const info = document.createElement('div');
      info.className = 'spread-card-info';
      const selectTag = (selectedSpreadIndices.size > 1 && isSelected) ? `<span style="color: var(--accent-primary); font-weight: 700;">✓</span> ` : '';
      info.innerHTML = `<span>${selectTag}Spread ${idx + 1}</span><span>${spread.photoIds.length} photos</span>`;

      // Delete Button
      if (albumState.project.spreads.length > 1) {
        const delBtn = document.createElement('div');
        delBtn.className = 'spread-card-delete';
        delBtn.innerHTML = '&times;';
        delBtn.title = 'Delete Spread';
        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          selectedSpreadIndices.delete(idx);
          albumState.removeSpread(idx);
        });
        card.appendChild(delBtn);
      }

      card.appendChild(preview);
      card.appendChild(info);

      // Selection handling: Shift for range, Ctrl/Cmd for multi-toggle, standard click for single
      card.addEventListener('click', (e) => {
        if (e.ctrlKey || e.metaKey) {
          if (selectedSpreadIndices.has(idx) && selectedSpreadIndices.size > 1) {
            selectedSpreadIndices.delete(idx);
          } else {
            selectedSpreadIndices.add(idx);
          }
          lastSelectedSpreadIndex = idx;
          albumState.setActiveSpread(idx);
        } else if (e.shiftKey) {
          const start = Math.min(lastSelectedSpreadIndex, idx);
          const end = Math.max(lastSelectedSpreadIndex, idx);
          selectedSpreadIndices.clear();
          for (let s = start; s <= end; s++) {
            selectedSpreadIndices.add(s);
          }
          albumState.setActiveSpread(idx);
        } else {
          selectedSpreadIndices.clear();
          selectedSpreadIndices.add(idx);
          lastSelectedSpreadIndex = idx;
          albumState.setActiveSpread(idx);
        }
        updateFilmstripSelectionUI();
      });

      // Right-click on spread timeline: provide only one option to delete selected spread
      card.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        hideCanvasContextMenu();

        selectedSpreadIndices.clear();
        selectedSpreadIndices.add(idx);
        lastSelectedSpreadIndex = idx;
        albumState.setActiveSpread(idx);
        updateFilmstripSelectionUI();

        showFilmstripContextMenu(e.clientX, e.clientY, idx);
      });

      // Drag to reorder spreads
      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/spreadIndex', idx);
      });
      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        card.style.borderColor = 'var(--accent-primary)';
      });
      card.addEventListener('dragleave', () => {
        if (idx !== albumState.activeSpreadIndex && !selectedSpreadIndices.has(idx)) {
          card.style.borderColor = 'transparent';
        }
      });
      card.addEventListener('drop', (e) => {
        e.preventDefault();
        const fromIdx = parseInt(e.dataTransfer.getData('text/spreadIndex'), 10);
        if (!isNaN(fromIdx) && fromIdx !== idx) {
          albumState.reorderSpreads(fromIdx, idx);
        }
      });

      fragment.appendChild(card);

      // Insertion divider after this card (between Spread idx+1 and idx+2, or after the last spread)
      const isLast = (idx === albumState.project.spreads.length - 1);
      const tip = isLast
        ? `➕ Insert spread after Spread ${idx + 1}`
        : `➕ Insert spread between Spread ${idx + 1} and Spread ${idx + 2}`;
      fragment.appendChild(createInsertSpreadDivider(idx + 1, tip));
    });

    container.appendChild(fragment);

    // Ensure active card is visible in scroll
    const activeCard = container.querySelector('.spread-card.active');
    if (activeCard) {
      activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  // --- Spreads Timeline Mouse Roll Ball / Wheel Horizontal Scrolling ---
  const filmstripScrollContainer = document.querySelector('.filmstrip-scroll-area');
  if (filmstripScrollContainer) {
    filmstripScrollContainer.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX) || e.deltaY !== 0) {
        e.preventDefault();
        filmstripScrollContainer.scrollLeft += (e.deltaY || e.deltaX) * 1.5;
      }
    }, { passive: false });
  }

  // --- Photo Tray Selection State (PC standard: Shift range, Ctrl toggle) ---
  const selectedPhotoIds = new Set();
  let lastSelectedPhotoIndex = -1;

  function updateTraySelectionUI() {
    const count = selectedPhotoIds.size;
    if (count > 0) {
      if (els.traySelectionIndicator) {
        els.traySelectionIndicator.style.display = 'flex';
        els.traySelectedCount.textContent = `${count} selected`;
      }
    } else {
      if (els.traySelectionIndicator) {
        els.traySelectionIndicator.style.display = 'none';
      }
    }

    const thumbs = els.photoTrayList.querySelectorAll('.photo-thumb');
    thumbs.forEach(thumb => {
      const pid = thumb.dataset.photoId;
      if (selectedPhotoIds.has(pid)) {
        thumb.classList.add('selected');
        if (!thumb.querySelector('.photo-check-badge')) {
          const badge = document.createElement('span');
          badge.className = 'photo-check-badge';
          badge.innerHTML = '&#10003;';
          thumb.appendChild(badge);
        }
      } else {
        thumb.classList.remove('selected');
        const badge = thumb.querySelector('.photo-check-badge');
        if (badge) badge.remove();
      }
    });
  }

  // ==================== Photo Tray Marquee / Rubber-Band Drag Selection ====================
  let isTrayMarqueeActive = false;
  let isTrackingTrayDrag = false;
  let trayDragStartPos = { x: 0, y: 0 };
  let trayMarqueeEl = document.getElementById('trayMarqueeBox');
  if (!trayMarqueeEl) {
    trayMarqueeEl = document.createElement('div');
    trayMarqueeEl.id = 'trayMarqueeBox';
    trayMarqueeEl.className = 'tray-marquee-box';
    trayMarqueeEl.style.display = 'none';
    document.body.appendChild(trayMarqueeEl);
  }

  const trayContainer = els.photoTraySection;
  if (trayContainer) {
    trayContainer.addEventListener('mousedown', (e) => {
      // Only primary left button
      if (e.button !== 0) return;

      // Ignore interactive controls, delete buttons, tabs, toggles, add button
      if (e.target.closest('button, input, select, .photo-thumb-delete, .tray-tab, .tray-toggle-btn, .tray-add-card')) {
        return;
      }

      const clickedThumb = e.target.closest('.photo-thumb');
      const isAlreadySelected = clickedThumb && selectedPhotoIds.has(clickedThumb.dataset.photoId);

      // If user clicks on an already selected photo, allow HTML5 dragging to canvas
      if (isAlreadySelected) {
        return;
      }

      // If clicked unselected thumb, temporarily disable native HTML5 drag so mousemove can detect drag-select
      if (clickedThumb) {
        clickedThumb.draggable = false;
      }

      isTrackingTrayDrag = true;
      trayDragStartPos = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mousemove', (e) => {
      if (!isTrackingTrayDrag) return;

      const dx = e.clientX - trayDragStartPos.x;
      const dy = e.clientY - trayDragStartPos.y;
      const dist = Math.hypot(dx, dy);

      // Start marquee selection once moved at least 6px
      if (dist > 6) {
        if (!isTrayMarqueeActive) {
          isTrayMarqueeActive = true;
          trayMarqueeEl.style.display = 'block';
          if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
            selectedPhotoIds.clear();
          }
        }

        const left = Math.min(trayDragStartPos.x, e.clientX);
        const top = Math.min(trayDragStartPos.y, e.clientY);
        const width = Math.abs(dx);
        const height = Math.abs(dy);

        trayMarqueeEl.style.left = left + 'px';
        trayMarqueeEl.style.top = top + 'px';
        trayMarqueeEl.style.width = width + 'px';
        trayMarqueeEl.style.height = height + 'px';

        const boxRect = {
          left: left,
          top: top,
          right: left + width,
          bottom: top + height
        };

        const thumbs = els.photoTrayList ? els.photoTrayList.querySelectorAll('.photo-thumb') : [];
        thumbs.forEach(thumb => {
          const pid = thumb.dataset.photoId;
          if (!pid) return;
          const rect = thumb.getBoundingClientRect();
          const intersects = !(
            boxRect.right < rect.left ||
            boxRect.left > rect.right ||
            boxRect.bottom < rect.top ||
            boxRect.top > rect.bottom
          );

          if (intersects) {
            selectedPhotoIds.add(pid);
          } else if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
            selectedPhotoIds.delete(pid);
          }
        });

        updateTraySelectionUI();
      }
    });

    window.addEventListener('mouseup', () => {
      if (isTrackingTrayDrag) {
        if (isTrayMarqueeActive) {
          isTrayMarqueeActive = false;
          trayMarqueeEl.style.display = 'none';
        }
        isTrackingTrayDrag = false;
        // Re-enable draggable on all thumbs
        if (els.photoTrayList) {
          els.photoTrayList.querySelectorAll('.photo-thumb').forEach(t => {
            t.draggable = true;
          });
        }
      }
    });
  }

  // Smoothly scrolls the uploaded photo tray to the photo that was touched/selected on canvas
  function scrollToPhotoInTray(photoId) {
    if (!photoId || !els.photoTrayList) return;
    
    // If the photo is not visible in current filter (e.g. if user is in 'unused' filter but photo is 'used'), switch to 'all' filter so the user can see it!
    const photo = albumState.getPhotoById(photoId);
    if (photo && currentTrayFilter === 'unused' && (photo.usageCount || 0) > 0) {
      currentTrayFilter = 'all';
      if (els.trayTabAll) els.trayTabAll.classList.add('active');
      if (els.trayTabUnused) els.trayTabUnused.classList.remove('active');
      if (els.trayTabUsed) els.trayTabUsed.classList.remove('active');
      renderPhotoTray();
    }

    // Find thumbnail element
    const thumb = els.photoTrayList.querySelector(`.photo-thumb[data-photo-id="${photoId}"]`);
    if (thumb) {
      thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      thumb.classList.add('flash-highlight');
      setTimeout(() => thumb.classList.remove('flash-highlight'), 1400);
    }
  }

  // Layout orientation filter for floating bar ('best-match', 'all', 'landscape', 'portrait')
  let currentLayoutOrientFilter = 'best-match';

  function createSvgShapeElement(shape, x, y, w, h, isCurrent) {
    const fill = isCurrent ? 'rgba(56, 189, 248, 0.40)' : 'rgba(56, 189, 248, 0.14)';
    const stroke = '#38bdf8';
    const s = String(shape || 'rectangle').toLowerCase().trim();
    const cx = x + w / 2;
    const cy = y + h / 2;
    const rx = w / 2;
    const ry = h / 2;

    const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    el.setAttribute('fill', fill);
    el.setAttribute('stroke', stroke);
    el.setAttribute('stroke-width', '1.5');

    if (s === 'circle') {
      const circleEl = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circleEl.setAttribute('cx', cx.toString());
      circleEl.setAttribute('cy', cy.toString());
      circleEl.setAttribute('r', Math.min(rx, ry).toString());
      circleEl.setAttribute('fill', fill);
      circleEl.setAttribute('stroke', stroke);
      circleEl.setAttribute('stroke-width', '1.5');
      return circleEl;
    } else if (s === 'ellipse') {
      const ellipseEl = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
      ellipseEl.setAttribute('cx', cx.toString());
      ellipseEl.setAttribute('cy', cy.toString());
      ellipseEl.setAttribute('rx', rx.toString());
      ellipseEl.setAttribute('ry', ry.toString());
      ellipseEl.setAttribute('fill', fill);
      ellipseEl.setAttribute('stroke', stroke);
      ellipseEl.setAttribute('stroke-width', '1.5');
      return ellipseEl;
    } else if (s === 'square') {
      const side = Math.min(w, h);
      const rectEl = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rectEl.setAttribute('x', (x + (w - side) / 2).toString());
      rectEl.setAttribute('y', (y + (h - side) / 2).toString());
      rectEl.setAttribute('width', side.toString());
      rectEl.setAttribute('height', side.toString());
      rectEl.setAttribute('fill', fill);
      rectEl.setAttribute('stroke', stroke);
      rectEl.setAttribute('stroke-width', '1.5');
      return rectEl;
    } else if (s === 'rounded' || s === 'rounded-rectangle' || s === 'rounded_rectangle') {
      const rectEl = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rectEl.setAttribute('x', x.toString());
      rectEl.setAttribute('y', y.toString());
      rectEl.setAttribute('width', w.toString());
      rectEl.setAttribute('height', h.toString());
      rectEl.setAttribute('rx', (Math.min(w, h) * 0.18).toString());
      rectEl.setAttribute('fill', fill);
      rectEl.setAttribute('stroke', stroke);
      rectEl.setAttribute('stroke-width', '1.5');
      return rectEl;
    } else if (s === 'triangle') {
      el.setAttribute('d', `M ${cx} ${y} L ${x + w} ${y + h} L ${x} ${y + h} Z`);
      return el;
    } else if (s === 'line') {
      const lineH = Math.max(3, h * 0.15);
      const rectEl = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rectEl.setAttribute('x', x.toString());
      rectEl.setAttribute('y', (cy - lineH / 2).toString());
      rectEl.setAttribute('width', w.toString());
      rectEl.setAttribute('height', lineH.toString());
      rectEl.setAttribute('rx', (lineH / 2).toString());
      rectEl.setAttribute('fill', fill);
      rectEl.setAttribute('stroke', stroke);
      rectEl.setAttribute('stroke-width', '1.5');
      return rectEl;
    } else if (s === 'arch' || s === 'arc') {
      const r = Math.min(rx, ry);
      el.setAttribute('d', `M ${x} ${y + h} L ${x} ${y + r} A ${rx} ${r} 0 0 1 ${x + w} ${y + r} L ${x + w} ${y + h} Z`);
      return el;
    } else if (s === 'ring' || s === 'donut') {
      const rOut = Math.min(rx, ry);
      const rIn = rOut * 0.52;
      el.setAttribute('d', `M ${cx} ${cy - rOut} A ${rOut} ${rOut} 0 1 0 ${cx} ${cy + rOut} A ${rOut} ${rOut} 0 1 0 ${cx} ${cy - rOut} Z M ${cx} ${cy - rIn} A ${rIn} ${rIn} 0 1 1 ${cx} ${cy + rIn} A ${rIn} ${rIn} 0 1 1 ${cx} ${cy - rIn} Z`);
      el.setAttribute('fill-rule', 'evenodd');
      return el;
    } else if (s === 'semi-circle' || s === 'semicircle') {
      el.setAttribute('d', `M ${x} ${y + h} A ${rx} ${ry} 0 0 1 ${x + w} ${y + h} Z`);
      return el;
    } else if (s === 'crescent') {
      const crR = Math.min(rx, ry);
      el.setAttribute('d', `M ${cx} ${cy - crR} A ${crR} ${crR} 0 0 1 ${cx + crR * 0.8} ${cy + crR * 0.8} C ${cx + crR * 0.2} ${cy + crR * 0.6} ${cx + crR * 0.2} ${cy - crR * 0.6} ${cx} ${cy - crR} Z`);
      return el;
    } else if (s === 'diamond') {
      el.setAttribute('d', `M ${cx} ${y} L ${x + w} ${cy} L ${cx} ${y + h} L ${x} ${cy} Z`);
      return el;
    } else if (s === 'star') {
      const pts = [];
      for (let i = 0; i < 10; i++) {
        const rDistX = (i % 2 === 0) ? rx : rx * 0.42;
        const rDistY = (i % 2 === 0) ? ry : ry * 0.42;
        const a = -Math.PI / 2 + i * (Math.PI / 5);
        pts.push(`${(cx + rDistX * Math.cos(a)).toFixed(1)},${(cy + rDistY * Math.sin(a)).toFixed(1)}`);
      }
      el.setAttribute('d', `M ${pts.join(' L ')} Z`);
      return el;
    } else if (s === 'hexagon') {
      const pts = [];
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 + i * (Math.PI / 3);
        pts.push(`${(cx + rx * Math.cos(a)).toFixed(1)},${(cy + ry * Math.sin(a)).toFixed(1)}`);
      }
      el.setAttribute('d', `M ${pts.join(' L ')} Z`);
      return el;
    } else if (s === 'octagon') {
      const pts = [];
      for (let i = 0; i < 8; i++) {
        const a = -Math.PI / 2 + Math.PI / 8 + i * (Math.PI / 4);
        pts.push(`${(cx + rx * Math.cos(a)).toFixed(1)},${(cy + ry * Math.sin(a)).toFixed(1)}`);
      }
      el.setAttribute('d', `M ${pts.join(' L ')} Z`);
      return el;
    } else if (s === 'pentagon') {
      const pts = [];
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + i * (2 * Math.PI / 5);
        pts.push(`${(cx + rx * Math.cos(a)).toFixed(1)},${(cy + ry * Math.sin(a)).toFixed(1)}`);
      }
      el.setAttribute('d', `M ${pts.join(' L ')} Z`);
      return el;
    } else if (s === 'trapezoid') {
      el.setAttribute('d', `M ${x + w * 0.20} ${y} L ${x + w * 0.80} ${y} L ${x + w} ${y + h} L ${x} ${y + h} Z`);
      return el;
    } else if (s === 'parallelogram' || s === 'skew') {
      const slant = Math.min(w * 0.22, 20);
      el.setAttribute('d', `M ${x + slant} ${y} L ${x + w} ${y} L ${x + w - slant} ${y + h} L ${x} ${y + h} Z`);
      return el;
    } else if (s === 'heart') {
      el.setAttribute('d', `M ${cx} ${y + h * 0.28} C ${cx} ${y + h * 0.08} ${x} ${y} ${x} ${y + h * 0.38} C ${x} ${y + h * 0.68} ${cx} ${y + h * 0.86} ${cx} ${y + h} C ${cx} ${y + h * 0.86} ${x + w} ${y + h * 0.68} ${x + w} ${y + h * 0.38} C ${x + w} ${y} ${cx} ${y + h * 0.08} ${cx} ${y + h * 0.28} Z`);
      return el;
    } else if (s === 'arrow') {
      el.setAttribute('d', `M ${x} ${y + h * 0.32} L ${x + w * 0.58} ${y + h * 0.32} L ${x + w * 0.58} ${y + h * 0.12} L ${x + w} ${cy} L ${x + w * 0.58} ${y + h * 0.88} L ${x + w * 0.58} ${y + h * 0.68} L ${x} ${y + h * 0.68} Z`);
      return el;
    } else if (s === 'speech-bubble' || s === 'speech_bubble' || s === 'bubble') {
      el.setAttribute('d', `M ${x + 6} ${y} L ${x + w - 6} ${y} Q ${x + w} ${y} ${x + w} ${y + 6} L ${x + w} ${y + h * 0.8} Q ${x + w} ${y + h * 0.84} ${x + w - 6} ${y + h * 0.84} L ${x + w * 0.4} ${y + h * 0.84} L ${x + w * 0.2} ${y + h} L ${x + w * 0.26} ${y + h * 0.84} L ${x + 6} ${y + h * 0.84} Q ${x} ${y + h * 0.84} ${x} ${y + h * 0.8} L ${x} ${y + 6} Q ${x} ${y} ${x + 6} ${y} Z`);
      return el;
    } else if (s === 'cloud') {
      el.setAttribute('d', `M ${x + w * 0.22} ${y + h * 0.72} C ${x + w * 0.04} ${y + h * 0.72} ${x} ${y + h * 0.54} ${x + w * 0.06} ${y + h * 0.42} C ${x} ${y + h * 0.28} ${x + w * 0.14} ${y + h * 0.14} ${x + w * 0.30} ${y + h * 0.20} C ${x + w * 0.38} ${y + h * 0.04} ${x + w * 0.62} ${y + h * 0.04} ${x + w * 0.70} ${y + h * 0.20} C ${x + w * 0.86} ${y + h * 0.14} ${x + w} ${y + h * 0.28} ${x + w * 0.94} ${y + h * 0.42} C ${x + w} ${y + h * 0.54} ${x + w * 0.96} ${y + h * 0.72} ${x + w * 0.78} ${y + h * 0.72} Z`);
      return el;
    } else if (s === 'cross') {
      const aw = w * 0.28, bh = h * 0.24, by = y + h * 0.25;
      el.setAttribute('d', `M ${cx - aw/2} ${y} L ${cx + aw/2} ${y} L ${cx + aw/2} ${by} L ${x + w} ${by} L ${x + w} ${by + bh} L ${cx + aw/2} ${by + bh} L ${cx + aw/2} ${y + h} L ${cx - aw/2} ${y + h} L ${cx - aw/2} ${by + bh} L ${x} ${by + bh} L ${x} ${by} L ${cx - aw/2} ${by} Z`);
      return el;
    } else if (s === 'plus-shape' || s === 'plus') {
      const pw = w * 0.30, ph = h * 0.30;
      el.setAttribute('d', `M ${cx - pw/2} ${y} L ${cx + pw/2} ${y} L ${cx + pw/2} ${cy - ph/2} L ${x + w} ${cy - ph/2} L ${x + w} ${cy + ph/2} L ${cx + pw/2} ${cy + ph/2} L ${cx + pw/2} ${y + h} L ${cx - pw/2} ${y + h} L ${cx - pw/2} ${cy + ph/2} L ${x} ${cy + ph/2} L ${x} ${cy - ph/2} L ${cx - pw/2} ${cy - ph/2} Z`);
      return el;
    } else if (s === 'teardrop') {
      el.setAttribute('d', `M ${cx} ${y} C ${x + w * 0.85} ${y + h * 0.35} ${x + w} ${y + h * 0.65} ${cx} ${y + h} C ${x} ${y + h * 0.65} ${x + w * 0.15} ${y + h * 0.35} ${cx} ${y} Z`);
      return el;
    } else if (s === 'leaf') {
      el.setAttribute('d', `M ${x} ${y + h} C ${x + w * 0.08} ${y + h * 0.35} ${x + w * 0.45} ${y} ${x + w} ${y} C ${x + w * 0.92} ${y + h * 0.65} ${x + w * 0.55} ${y + h} ${x} ${y + h} Z`);
      return el;
    } else if (s === 'grid') {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      const pad = Math.min(w, h) * 0.06;
      const hw = (w - pad) / 2, hh = (h - pad) / 2;
      const r1 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      r1.setAttribute('x', x.toString()); r1.setAttribute('y', y.toString()); r1.setAttribute('width', hw.toString()); r1.setAttribute('height', hh.toString());
      r1.setAttribute('fill', fill); r1.setAttribute('stroke', stroke); r1.setAttribute('stroke-width', '1.2');
      const r2 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      r2.setAttribute('x', (x + hw + pad).toString()); r2.setAttribute('y', y.toString()); r2.setAttribute('width', hw.toString()); r2.setAttribute('height', hh.toString());
      r2.setAttribute('fill', fill); r2.setAttribute('stroke', stroke); r2.setAttribute('stroke-width', '1.2');
      const r3 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      r3.setAttribute('x', x.toString()); r3.setAttribute('y', (y + hh + pad).toString()); r3.setAttribute('width', hw.toString()); r3.setAttribute('height', hh.toString());
      r3.setAttribute('fill', fill); r3.setAttribute('stroke', stroke); r3.setAttribute('stroke-width', '1.2');
      const r4 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      r4.setAttribute('x', (x + hw + pad).toString()); r4.setAttribute('y', (y + hh + pad).toString()); r4.setAttribute('width', hw.toString()); r4.setAttribute('height', hh.toString());
      r4.setAttribute('fill', fill); r4.setAttribute('stroke', stroke); r4.setAttribute('stroke-width', '1.2');
      g.appendChild(r1); g.appendChild(r2); g.appendChild(r3); g.appendChild(r4);
      return g;
    } else {
      const rectEl = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rectEl.setAttribute('x', x.toString());
      rectEl.setAttribute('y', y.toString());
      rectEl.setAttribute('width', w.toString());
      rectEl.setAttribute('height', h.toString());
      rectEl.setAttribute('fill', fill);
      rectEl.setAttribute('stroke', stroke);
      rectEl.setAttribute('stroke-width', '1.5');
      rectEl.setAttribute('rx', '1');
      return rectEl;
    }
  }

  // --- Floating Layouts Bar Above Spread ---
  function renderFloatingLayoutsBar() {
    if (!els.floatingLayoutsBar) return;
    const spread = albumState.getActiveSpread();
    if (!spread) {
      els.floatingLayoutsBar.style.display = 'none';
      return;
    }
    els.floatingLayoutsBar.style.display = '';

    // Synchronize Spread Orientation Toggles (both toolbar and floating bar)
    const orient = albumState.getSpreadOrientation();
    if (els.btnFloatingLandscape) els.btnFloatingLandscape.classList.toggle('active', orient === 'landscape');
    if (els.btnFloatingPortrait) els.btnFloatingPortrait.classList.toggle('active', orient === 'portrait');
    if (els.btnOrientationLandscape) els.btnOrientationLandscape.classList.toggle('active', orient === 'landscape');
    if (els.btnOrientationPortrait) els.btnOrientationPortrait.classList.toggle('active', orient === 'portrait');

    // Synchronize Filter Pills
    if (els.floatingFilterPills) {
      els.floatingFilterPills.querySelectorAll('.floating-filter-pill').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === currentLayoutOrientFilter);
      });
    }

    const count = spread.photoIds.length;
    const currIdx = albumState.activeSpreadIndex;
    const total = albumState.project.spreads.length;
    const p = currIdx * 2 + 1;
    const orientTag = orient === 'portrait' ? 'PORTRAIT' : 'LANDSCAPE';
    const label = albumState.project.pageMode === 'single'
      ? `PAGE ${currIdx + 1} OF ${total} • ${orientTag}`
      : `SPREAD ${currIdx + 1} OF ${total} • PAGES ${p} - ${p + 1} • ${orientTag}`;
    if (els.hudPageLabel) els.hudPageLabel.textContent = label;

    if (count === 0) {
      els.floatingLayoutsCount.textContent = '0 Layouts';
      els.floatingLayoutsList.innerHTML = `<span style="font-size: 11px; color: var(--text-dim); padding: 0 10px; display: flex; align-items: center;">Empty spread — click or drag photos from tray below, or click ⚡ Auto-Build</span>`;
      return;
    }

    const photos = spread.photoIds.map(id => albumState.getPhotoById(id)).filter(Boolean);
    const activeAspect = albumState.getActiveAspect();
    const templates = layoutEngine.getTemplatesForCount(count, currentLayoutOrientFilter, photos, activeAspect);

    const grandTotal = layoutEngine.getTotalTemplateCount ? layoutEngine.getTotalTemplateCount() : 384;
    const totalForCategory = (layoutEngine.templates && layoutEngine.templates[count]) ? layoutEngine.templates[count].length : templates.length;

    if (currentLayoutOrientFilter === 'best-match') {
      els.floatingLayoutsCount.textContent = `${templates.length} Matches (${count} ${count === 1 ? 'Pic' : 'Pics'})`;
    } else {
      els.floatingLayoutsCount.textContent = `${templates.length} of ${totalForCategory} Layouts (${count} ${count === 1 ? 'Pic' : 'Pics'})`;
    }
    els.floatingLayoutsList.innerHTML = '';

    templates.forEach(t => {
      const chip = document.createElement('div');
      chip.className = `floating-layout-chip ${spread.layoutId === t.id ? 'active' : ''}`;
      const matchText = t.matchPercent ? ` • ${t.matchPercent}% Photo Match` : '';
      chip.title = `${t.name}${matchText} (Hover to preview blueprint, click to apply)`;

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 100 60');

      if (albumState.project.pageMode === 'spread') {
        const crease = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        crease.setAttribute('x1', '50');
        crease.setAttribute('y1', '0');
        crease.setAttribute('x2', '50');
        crease.setAttribute('y2', '60');
        crease.setAttribute('stroke', 'rgba(255, 255, 255, 0.25)');
        crease.setAttribute('stroke-dasharray', '2,2');
        svg.appendChild(crease);
      }

      t.rects.forEach(r => {
        const isCurrent = spread.layoutId === t.id;
        const rectEl = createSvgShapeElement(r.shape, r.x * 96 + 2, r.y * 56 + 2, r.w * 96, r.h * 56, isCurrent);
        svg.appendChild(rectEl);
      });

      chip.appendChild(svg);

      // Match badge on chip
      if (t.matchPercent && t.matchPercent >= 80) {
        const badge = document.createElement('span');
        badge.className = 'chip-match-badge';
        badge.textContent = `${t.matchPercent}%`;
        chip.appendChild(badge);
      }

      // Live hover transparent blueprint ghost box preview on canvas!
      chip.addEventListener('mouseenter', () => {
        canvasRenderer.setHoverLayoutPreview(t);
      });
      chip.addEventListener('mouseleave', () => {
        canvasRenderer.setHoverLayoutPreview(null);
      });

      chip.addEventListener('click', () => {
        canvasRenderer.setHoverLayoutPreview(null);
        albumState.setLayoutForSpread(albumState.activeSpreadIndex, t);
      });

      els.floatingLayoutsList.appendChild(chip);
    });

    const activeChip = els.floatingLayoutsList.querySelector('.floating-layout-chip.active');
    if (activeChip) {
      activeChip.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }

    // Also populate Controls & Formats Panel Layouts Section
    if (els.controlsLayoutsCountBadge) {
      els.controlsLayoutsCountBadge.textContent = `${templates.length} Layouts (${count} ${count === 1 ? 'Pic' : 'Pics'})`;
    }
    if (els.controlsLayoutsStrip) {
      els.controlsLayoutsStrip.innerHTML = '';
      if (templates.length === 0) {
        els.controlsLayoutsStrip.innerHTML = '<span style="font-size: 11px; color: var(--text-dim); padding: 4px;">No layouts for 0 photos</span>';
      } else {
        templates.forEach(t => {
          const chip = document.createElement('div');
          chip.className = `controls-layout-chip ${spread.layoutId === t.id ? 'active' : ''}`;
          chip.title = `${t.name} (Click to apply, or roll mouse wheel)`;

          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svg.setAttribute('viewBox', '0 0 100 60');

          if (albumState.project.pageMode === 'spread') {
            const crease = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            crease.setAttribute('x1', '50'); crease.setAttribute('y1', '0');
            crease.setAttribute('x2', '50'); crease.setAttribute('y2', '60');
            crease.setAttribute('stroke', 'rgba(255, 255, 255, 0.25)');
            crease.setAttribute('stroke-dasharray', '2,2');
            svg.appendChild(crease);
          }

          t.rects.forEach(r => {
            const isCurrent = spread.layoutId === t.id;
            const rectEl = createSvgShapeElement(r.shape, r.x * 96 + 2, r.y * 56 + 2, r.w * 96, r.h * 56, isCurrent);
            svg.appendChild(rectEl);
          });

          chip.appendChild(svg);
          chip.addEventListener('mouseenter', () => canvasRenderer.setHoverLayoutPreview(t));
          chip.addEventListener('mouseleave', () => canvasRenderer.setHoverLayoutPreview(null));
          chip.addEventListener('click', () => {
            canvasRenderer.setHoverLayoutPreview(null);
            albumState.setLayoutForSpread(albumState.activeSpreadIndex, t);
            renderFloatingLayoutsBar();
          });
          els.controlsLayoutsStrip.appendChild(chip);
        });

        const activeControlsChip = els.controlsLayoutsStrip.querySelector('.controls-layout-chip.active');
        if (activeControlsChip) {
          activeControlsChip.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      }
    }
  }

  // --- Photo Tray Rendering ---
  function renderPhotoTray() {
    const container = els.photoTrayList;
    container.innerHTML = '';

    let photos = albumState.project.photos;

    // Filter
    if (currentTrayFilter === 'unused') {
      photos = photos.filter(p => (p.usageCount || 0) === 0);
    } else if (currentTrayFilter === 'used') {
      photos = photos.filter(p => (p.usageCount || 0) > 0);
    }

    // Update Tab Badges
    const allCount = albumState.project.photos.length;
    const unusedCount = albumState.project.photos.filter(p => (p.usageCount || 0) === 0).length;
    const usedCount = allCount - unusedCount;

    els.trayTabAll.textContent = `All (${allCount})`;
    els.trayTabUnused.textContent = `Unused (${unusedCount})`;
    els.trayTabUsed.textContent = `Placed (${usedCount})`;
    if (typeof updateRelinkButtonVisibility === 'function') updateRelinkButtonVisibility();

    if (photos.length === 0) {
      const notice = document.createElement('div');
      notice.className = 'empty-tray-notice';
      if (allCount === 0) {
        notice.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 18px 10px; color: var(--text-muted); text-align: center;">
            <span style="font-size: 13px; font-weight: 500; color: var(--text-main, #f1f5f9);">No photos imported yet</span>
            <div style="display: flex; gap: 8px; align-items: center; margin-top: 2px;">
              <button type="button" class="btn-pill" id="btnEmptyImportFolder" style="background: rgba(14, 165, 233, 0.18); border: 1px solid rgba(56, 189, 248, 0.45); color: #38bdf8; font-size: 11px; padding: 5px 14px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
                📁 Import Photo Folder
              </button>
              <button type="button" class="btn-pill primary" id="btnEmptyAddPhotos" style="font-size: 11px; padding: 5px 14px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
                + Add Photos
              </button>
            </div>
            <span style="font-size: 11px; opacity: 0.7;">or drag and drop photo files / folders directly into tray</span>
          </div>
        `;
        const bFolder = notice.querySelector('#btnEmptyImportFolder');
        if (bFolder) bFolder.addEventListener('click', () => handleImportFolder());
        const bPhotos = notice.querySelector('#btnEmptyAddPhotos');
        if (bPhotos) bPhotos.addEventListener('click', () => els.photoFileInput?.click());
      } else {
        notice.innerHTML = `<span>No photos in this filter.</span>`;
      }
      container.appendChild(notice);
      updateTraySelectionUI();
      return;
    }

    const fragment = document.createDocumentFragment();

    photos.forEach((photo, idx) => {
      const thumb = document.createElement('div');
      thumb.className = `photo-thumb ${selectedPhotoIds.has(photo.id) ? 'selected' : ''}`;
      if (photo.needsRelink || photo.filePathVerified === false) {
        thumb.classList.add('photo-thumb-missing');
      }
      thumb.dataset.photoId = photo.id;
      thumb.dataset.index = idx;
      thumb.draggable = true;
      thumb.title = `${photo.name}\nAspect: ${photo.aspect < 0.9 ? 'Portrait' : photo.aspect > 1.1 ? 'Landscape' : 'Square'}\nClick to select (Shift: range, Ctrl: toggle)\nDrag to reorder or place`;

      const img = document.createElement('img');
      img.src = getPhotoThumbnailUrl(photo);
      img.alt = photo.name;
      img.loading = 'lazy';
      img.addEventListener('error', () => {
        if (img.dataset.missingPreviewShown) return;
        img.dataset.missingPreviewShown = '1';
        photo.needsRelink = true;
        photo.filePathVerified = false;
        thumb.classList.add('photo-thumb-missing');
        const label = String(photo.fileName || photo.name || 'Missing photo').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[ch]));
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="220" viewBox="0 0 320 220"><rect width="320" height="220" fill="#202633"/><rect x="1" y="1" width="318" height="218" rx="10" fill="none" stroke="#f59e0b"/><path d="M130 68h60v48h-60z M130 68l24 22 12-12 24 26" fill="none" stroke="#fbbf24" stroke-width="5"/><text x="160" y="150" fill="#f8fafc" font-family="Arial,sans-serif" font-size="16" text-anchor="middle">Photo needs relinking</text><text x="160" y="178" fill="#cbd5e1" font-family="Arial,sans-serif" font-size="13" text-anchor="middle">${label}</text></svg>`;
        img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
        updateRelinkButtonVisibility();
        canvasRenderer.requestRender();
      }, { once: true });
      thumb.appendChild(img);

      // Usage badge
      if (photo.usageCount > 0) {
        const badge = document.createElement('span');
        badge.className = 'photo-badge-usage';
        badge.textContent = `${photo.usageCount}x`;
        thumb.appendChild(badge);
      }

      // Aspect label badge
      const aspectBadge = document.createElement('span');
      aspectBadge.className = 'photo-badge-aspect';
      aspectBadge.textContent = photo.aspect < 0.9 ? 'Tall' : photo.aspect > 1.1 ? 'Wide' : 'Sq';
      thumb.appendChild(aspectBadge);

      // Delete Button (× on top-right)
      const delBtn = document.createElement('span');
      delBtn.className = 'photo-thumb-delete';
      delBtn.innerHTML = '&times;';
      delBtn.title = `Delete "${photo.name}" from uploaded pictures`;
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        albumState.removePhoto(photo.id);
        selectedPhotoIds.delete(photo.id);
        renderPhotoTray();
        renderFilmstrip();
        canvasRenderer.render();
        showToastNotification(`🗑️ Removed "${photo.name}" from project`);
      });
      thumb.appendChild(delBtn);

      // Selection Checkmark Badge
      if (selectedPhotoIds.has(photo.id)) {
        const checkBadge = document.createElement('span');
        checkBadge.className = 'photo-check-badge';
        checkBadge.innerHTML = '&#10003;';
        thumb.appendChild(checkBadge);
      }

      // PC Multi-Select Click Handler (Shift range, Ctrl toggle)
      thumb.addEventListener('click', (e) => {
        if (e.target.closest('.photo-thumb-delete')) return;
        const currentIdx = idx;

        if (e.shiftKey && e.ctrlKey) {
          const anchor = lastSelectedPhotoIndex >= 0 ? lastSelectedPhotoIndex : currentIdx;
          const start = Math.min(anchor, currentIdx);
          const end = Math.max(anchor, currentIdx);
          for (let i = start; i <= end; i++) {
            if (photos[i]) selectedPhotoIds.add(photos[i].id);
          }
          lastSelectedPhotoIndex = currentIdx;
        } else if (e.shiftKey) {
          const anchor = lastSelectedPhotoIndex >= 0 ? lastSelectedPhotoIndex : currentIdx;
          const start = Math.min(anchor, currentIdx);
          const end = Math.max(anchor, currentIdx);
          selectedPhotoIds.clear();
          for (let i = start; i <= end; i++) {
            if (photos[i]) selectedPhotoIds.add(photos[i].id);
          }
        } else if (e.ctrlKey) {
          if (selectedPhotoIds.has(photo.id)) {
            selectedPhotoIds.delete(photo.id);
          } else {
            selectedPhotoIds.add(photo.id);
          }
          lastSelectedPhotoIndex = currentIdx;
        } else {
          selectedPhotoIds.clear();
          selectedPhotoIds.add(photo.id);
          lastSelectedPhotoIndex = currentIdx;
        }

        updateTraySelectionUI();
      });

      // Drag photo(s) to canvas OR reorder inside tray
      thumb.addEventListener('dragstart', (e) => {
        if (!selectedPhotoIds.has(photo.id)) {
          selectedPhotoIds.clear();
          selectedPhotoIds.add(photo.id);
          lastSelectedPhotoIndex = idx;
          updateTraySelectionUI();
        }

        const idsToDrag = Array.from(selectedPhotoIds);
        e.dataTransfer.setData('text/photoId', photo.id);
        e.dataTransfer.setData('application/json', JSON.stringify({ photoIds: idsToDrag }));
        e.dataTransfer.setData('text/trayPhotoIndex', String(idx));
        e.dataTransfer.setData('text/sourceSlot', '');
      });

      thumb.addEventListener('dragover', (e) => {
        if (e.dataTransfer.types.includes('text/trayphotoindex')) {
          e.preventDefault();
          thumb.style.transform = 'scale(0.95)';
          thumb.style.borderColor = 'var(--accent-primary)';
        }
      });

      thumb.addEventListener('dragleave', () => {
        thumb.style.transform = '';
        thumb.style.borderColor = '';
      });

      thumb.addEventListener('drop', (e) => {
        thumb.style.transform = '';
        thumb.style.borderColor = '';
        const fromIdxStr = e.dataTransfer.getData('text/trayPhotoIndex');
        if (fromIdxStr !== '') {
          e.preventDefault();
          e.stopPropagation();
          const fromIdx = parseInt(fromIdxStr, 10);
          if (!isNaN(fromIdx) && fromIdx !== idx) {
            albumState.reorderPhoto(fromIdx, idx);
            renderPhotoTray();
            showToastNotification(`↔️ Picture reordered in manual sequence`);
          }
        }
      });

      thumb.addEventListener('dragend', () => {
        thumb.style.transform = '';
        thumb.style.borderColor = '';
        selectedPhotoIds.clear();
        lastSelectedPhotoIndex = -1;
        updateTraySelectionUI();
      });

      // Double-click to instantly append to active spread
      thumb.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        if (selectedPhotoIds.size > 1 && selectedPhotoIds.has(photo.id)) {
          albumState.addPhotosToActiveSpread(Array.from(selectedPhotoIds));
        } else {
          albumState.addPhotoToActiveSpread(photo.id);
        }
      });

      fragment.appendChild(thumb);
    });

    // Add "+ Add Photos" button card at the end of the tray
    const addCard = document.createElement('div');
    addCard.className = 'tray-add-card';
    addCard.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
      <span>+ Add</span>
    `;
    addCard.title = 'Click to add more photos to the media pool';
    addCard.addEventListener('click', () => {
      if (els.photoFileInput) {
        els.photoFileInput.value = '';
        els.photoFileInput.click();
      }
    });
    fragment.appendChild(addCard);

    container.appendChild(fragment);
    updateTraySelectionUI();
  }

  // --- Layouts Catalog Drawer ---
  function openLayoutsCatalog() {
    const spread = albumState.getActiveSpread();
    let count = (spread && spread.photoIds && spread.photoIds.length > 0)
      ? spread.photoIds.length
      : (spread && spread.slots && spread.slots.length > 0 ? spread.slots.length : 2);

    const photos = (spread && spread.photoIds) ? spread.photoIds.map(id => albumState.getPhotoById(id)).filter(Boolean) : [];
    const activeAspect = albumState.getActiveAspect();
    let templates = layoutEngine.getTemplatesForCount(count, currentLayoutOrientFilter, photos, activeAspect);
    if (!templates || templates.length === 0) {
      templates = layoutEngine.getAllTemplates();
    }

    if (els.drawerLayoutsCount) {
      els.drawerLayoutsCount.textContent = `Available Layouts (${templates.length} Options)`;
    }

    // Synchronize drawer filter tabs
    if (els.drawerFilterBar) {
      els.drawerFilterBar.querySelectorAll('.drawer-filter-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === currentLayoutOrientFilter);
      });
    }

    els.catalogGrid.innerHTML = '';

    templates.forEach(t => {
      const card = document.createElement('div');
      card.className = `layout-preview-card ${spread.layoutId === t.id ? 'active' : ''}`;
      const matchText = t.matchPercent ? ` • ${t.matchPercent}% Match` : '';
      card.title = `${t.name}${matchText} (Hover to preview on spread, click to choose)`;

      // Generate SVG transparent blueprint thumbnail
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 200 100');
      svg.setAttribute('class', 'layout-preview-svg');

      // Center fold line
      if (albumState.project.pageMode === 'spread') {
        const crease = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        crease.setAttribute('x1', '100');
        crease.setAttribute('y1', '0');
        crease.setAttribute('x2', '100');
        crease.setAttribute('y2', '100');
        crease.setAttribute('stroke', 'rgba(255, 255, 255, 0.25)');
        crease.setAttribute('stroke-dasharray', '3,3');
        svg.appendChild(crease);
      }

      // Transparent blueprint rectangles
      t.rects.forEach(r => {
        const isCurrent = spread.layoutId === t.id;
        const rectEl = createSvgShapeElement(r.shape, r.x * 190 + 5, r.y * 90 + 5, r.w * 190, r.h * 90, isCurrent);
        svg.appendChild(rectEl);
      });

      const title = document.createElement('div');
      title.className = 'layout-preview-title';
      title.textContent = t.name;

      // Meta and orientation badge
      const meta = document.createElement('div');
      meta.className = 'layout-preview-meta';
      
      const orientProfile = t.orientationProfile || layoutEngine.getLayoutOrientationProfile(t, activeAspect);
      const badge = document.createElement('span');
      badge.className = `layout-preview-badge ${t.isOrientationMatch ? 'best-match' : ''}`;
      if (t.matchPercent) {
        badge.textContent = `${t.matchPercent}% Match`;
      } else {
        badge.textContent = `${orientProfile.landscape}W • ${orientProfile.portrait}T`;
      }

      const domLabel = document.createElement('span');
      domLabel.style.fontSize = '9px';
      domLabel.style.color = 'var(--text-dim)';
      domLabel.textContent = `${orientProfile.landscape} Wide, ${orientProfile.portrait} Tall`;

      meta.appendChild(badge);
      meta.appendChild(domLabel);

      card.appendChild(svg);
      card.appendChild(title);
      card.appendChild(meta);

      // Live hover blueprint box overlay on canvas
      card.addEventListener('mouseenter', () => {
        canvasRenderer.setHoverLayoutPreview(t);
      });
      card.addEventListener('mouseleave', () => {
        canvasRenderer.setHoverLayoutPreview(null);
      });

      card.addEventListener('click', () => {
        canvasRenderer.setHoverLayoutPreview(null);
        albumState.setLayoutForSpread(albumState.activeSpreadIndex, t);
        els.layoutsDrawer.classList.remove('open');
        els.btnDockSpreadLayout?.classList.remove('active');
      });

      els.catalogGrid.appendChild(card);
    });

    els.layoutsDrawer.classList.add('open');
  }

  // ==================== Direct Slot Photo Import Controller ====================
  let pendingImportSlotTarget = null;

  function createSlotFileInput() {
    let input = document.getElementById('photoFileInputForSlot');
    if (!input) {
      input = document.createElement('input');
      input.type = 'file';
      input.id = 'photoFileInputForSlot';
      input.accept = 'image/*,.jpg,.jpeg,.png,.webp,.avif,.bmp,.tif,.tiff,.heic';
      input.multiple = true;
      input.style.display = 'none';
      document.body.appendChild(input);

      input.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          const files = Array.from(e.target.files);
          if (pendingImportSlotTarget) {
            importAndAssignPhotoToSlot(files[0], pendingImportSlotTarget.spreadIndex, pendingImportSlotTarget.slotIndex);
            if (files.length > 1) {
              importPhotoFiles(files.slice(1));
            }
          } else {
            importPhotoFiles(files);
          }
          pendingImportSlotTarget = null;
        }
      });
    }
    return input;
  }

  function promptImportPhotoForSlot(spreadIndex, slotIndex) {
    pendingImportSlotTarget = { spreadIndex, slotIndex };
    const input = document.getElementById('photoFileInputForSlot') || createSlotFileInput();
    input.value = '';
    input.click();
  }

  function importAndAssignPhotoToSlot(file, spreadIndex, slotIndex) {
    if (!file) return;
    const timestamp = Date.now();
    const id = 'photo-' + timestamp + '-0-' + Math.random().toString(36).substr(2, 6);
    const name = (file.name || 'Photo').replace(/\.[^/.]+$/, '');
    const blobUrl = URL.createObjectURL(file);

    const fileName = file.name || (name + '.jpg');
    const filePath = file.path || '';

    const photoObj = {
      id: id,
      name: name,
      fileName: fileName,
      filePath: filePath,
      fileHash: null,
      fileSize: typeof file.size === 'number' ? file.size : 0,
      lastModified: file.lastModified || null,
      src: blobUrl,
      thumbSrc: blobUrl,
      originalSrc: blobUrl,
      originalFile: file,
      width: 1200,
      height: 800,
      aspect: 1.5,
      usageCount: 1
    };

    if (window.crypto && window.crypto.subtle) {
      computeFileSha256(file).then(hash => {
        if (hash) photoObj.fileHash = hash;
      }).catch(() => {});
    }

    albumState.addPhoto(photoObj);

    if (albumState.imagePipeline) {
      albumState.imagePipeline.cache.set(id, {
        data: photoObj,
        displayImg: null,
        originalImg: null
      });
    }

    const spread = albumState.project.spreads[spreadIndex];
    if (spread) {
      let slot = spread.slots?.find(s => s.slotIndex === slotIndex);
      if (!slot) {
        if (!spread.slots) spread.slots = [];
        slot = {
          slotIndex: slotIndex,
          photoId: id,
          panX: 0, panY: 0, zoom: 1.0, rotation: 0,
          flipH: false, flipV: false, cropMode: 'cover',
          brightness: 100, contrast: 100, saturation: 100, warmth: 0
        };
        spread.slots.push(slot);
      } else {
        slot.photoId = id;
        slot.panX = 0; slot.panY = 0; slot.zoom = 1.0; slot.rotation = 0;
        slot.flipH = false; slot.flipV = false; slot.cropMode = 'cover';
      }

      if (!spread.photoIds.includes(id)) {
        spread.photoIds.push(id);
      }

      albumState._recomputeUsageCounts();
      albumState.notify('photo-assigned', spread);
    }

    renderPhotoTray();
    renderFilmstrip();
    renderFloatingLayoutsBar();
    canvasRenderer.requestRender();

    showToastNotification(`📸 Photo "${photoObj.name}" loaded & placed into Frame ${slotIndex + 1}!`);

    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) {
        photoObj.width = img.naturalWidth;
        photoObj.height = img.naturalHeight;
        photoObj.aspect = Number((img.naturalWidth / img.naturalHeight).toFixed(3)) || 1.5;
        if (albumState.imagePipeline) {
          const cached = albumState.imagePipeline.cache.get(photoObj.id);
          if (cached) {
            cached.displayImg = img;
            cached.originalImg = img;
          }
        }
        canvasRenderer.requestRender();
      }
    };
    img.src = photoObj.src;
  }

  window.promptImportPhotoForSlot = promptImportPhotoForSlot;
  window.importAndAssignPhotoToSlot = importAndAssignPhotoToSlot;

  // ==================== Canvas Clipboard Controller (Ctrl+C & Ctrl+V) ====================
  let clipboardFrames = null;
  let clipboardPhotos = null;
  let pasteCount = 0;

  function copySelectedElements() {
    const spread = albumState.getActiveSpread();
    const hasCanvasSelection = (canvasRenderer.selectedSlotIndices && canvasRenderer.selectedSlotIndices.size > 0) ||
      (canvasRenderer.selectedSlotIndex !== null && canvasRenderer.selectedSlotIndex !== undefined);

    if (hasCanvasSelection && spread && spread.slots && spread.layout?.rects) {
      const selectedIndices = (canvasRenderer.selectedSlotIndices && canvasRenderer.selectedSlotIndices.size > 0)
        ? Array.from(canvasRenderer.selectedSlotIndices)
        : [canvasRenderer.selectedSlotIndex];

      const framesToCopy = [];
      selectedIndices.forEach(idx => {
        const slot = spread.slots.find(s => s.slotIndex === idx);
        const rect = spread.layout.rects[idx] || (canvasRenderer.cachedRectangles ? canvasRenderer.cachedRectangles.find(cr => cr.slotIndex === idx) : null);
        if (rect) {
          framesToCopy.push({
            normRect: { ...rect },
            slotData: slot ? { ...slot } : null
          });
        }
      });

      if (framesToCopy.length > 0) {
        clipboardFrames = framesToCopy;
        clipboardPhotos = null;
        pasteCount = 0;
        const count = framesToCopy.length;
        showToastNotification(`📋 Copied ${count} frame${count > 1 ? 's' : ''} to clipboard`);
        return true;
      }
    }

    if (selectedPhotoIds && selectedPhotoIds.size > 0) {
      clipboardPhotos = Array.from(selectedPhotoIds);
      clipboardFrames = null;
      const count = clipboardPhotos.length;
      showToastNotification(`📋 Copied ${count} photo${count > 1 ? 's' : ''} to clipboard`);
      return true;
    }

    return false;
  }

  function pasteClipboardElements() {
    const spread = albumState.getActiveSpread();
    if (!spread) return false;

    if (clipboardFrames && clipboardFrames.length > 0) {
      pasteCount++;
      albumState.recordSnapshot();

      const offsetPx = (pasteCount % 8) * 18;
      const cw = canvasRenderer.displayWidth || 800;
      const ch = canvasRenderer.displayHeight || 500;
      const newSlotIndices = [];

      clipboardFrames.forEach(item => {
        let pxRect;
        if (item.normRect.w !== undefined) {
          pxRect = {
            x: item.normRect.x * cw + offsetPx,
            y: item.normRect.y * ch + offsetPx,
            width: item.normRect.w * cw,
            height: item.normRect.h * ch
          };
        } else {
          pxRect = {
            x: item.normRect.x + offsetPx,
            y: item.normRect.y + offsetPx,
            width: item.normRect.width,
            height: item.normRect.height
          };
        }

        pxRect.x = Math.max(0, Math.min(cw - pxRect.width, pxRect.x));
        pxRect.y = Math.max(0, Math.min(ch - pxRect.height, pxRect.y));

        const photoIdToAssign = item.slotData?.photoId || null;
        const newIdx = albumState.addCustomFrame(
          albumState.activeSpreadIndex,
          pxRect,
          cw,
          ch,
          photoIdToAssign
        );

        if (newIdx !== null && newIdx !== undefined) {
          newSlotIndices.push(newIdx);
          if (item.slotData) {
            const newSlot = spread.slots.find(s => s.slotIndex === newIdx);
            if (newSlot) {
              newSlot.zoom = item.slotData.zoom || 1.0;
              newSlot.panX = item.slotData.panX || 0;
              newSlot.panY = item.slotData.panY || 0;
              newSlot.rotation = item.slotData.rotation || 0;
              newSlot.flipH = Boolean(item.slotData.flipH);
              newSlot.flipV = Boolean(item.slotData.flipV);
              newSlot.cropMode = item.slotData.cropMode || 'cover';
              newSlot.brightness = item.slotData.brightness !== undefined ? item.slotData.brightness : 100;
              newSlot.contrast = item.slotData.contrast !== undefined ? item.slotData.contrast : 100;
              newSlot.saturation = item.slotData.saturation !== undefined ? item.slotData.saturation : 100;
              newSlot.warmth = item.slotData.warmth || 0;
            }
          }
        }
      });

      if (newSlotIndices.length > 0) {
        canvasRenderer.selectedSlotIndex = newSlotIndices[0];
        canvasRenderer.selectedSlotIndices = new Set(newSlotIndices);
        canvasRenderer.requestRender();
        renderFilmstrip();
        const count = newSlotIndices.length;
        showToastNotification(`📋 Pasted ${count} frame${count > 1 ? 's' : ''} on spread layout!`);
        return true;
      }
    } else if (clipboardPhotos && clipboardPhotos.length > 0) {
      albumState.addPhotosToActiveSpread(clipboardPhotos);
      const count = clipboardPhotos.length;
      showToastNotification(`📋 Pasted ${count} photo${count > 1 ? 's' : ''} onto spread!`);
      return true;
    }

    return false;
  }

  // Nudge selected canvas frame(s) or photo inside frame with keyboard arrow keys
  function nudgeSelectedCanvasFrames(dx, dy, isAlt = false) {
    const spread = albumState.getActiveSpread();
    if (!spread || !canvasRenderer.cachedRectangles) return;

    const selectedIndices = (canvasRenderer.selectedSlotIndices && canvasRenderer.selectedSlotIndices.size > 0)
      ? Array.from(canvasRenderer.selectedSlotIndices)
      : (canvasRenderer.selectedSlotIndex !== null && canvasRenderer.selectedSlotIndex !== undefined ? [canvasRenderer.selectedSlotIndex] : []);

    if (selectedIndices.length === 0) return;

    if (isAlt) {
      // Alt + Arrow keys: Nudge photo position inside frame!
      selectedIndices.forEach(slotIdx => {
        const slot = spread.slots.find(s => s.slotIndex === slotIdx);
        if (slot && slot.photoId) {
          slot.panX = Math.round((slot.panX || 0) + dx * 2);
          slot.panY = Math.round((slot.panY || 0) + dy * 2);
          albumState.notify('slot-pan-updated', { slotIndex: slotIdx, panX: slot.panX, panY: slot.panY });
        }
      });
      albumState.recordSnapshot();
      canvasRenderer.requestRender();
      debouncedRenderFilmstrip();
      return;
    }

    const cw = canvasRenderer.displayWidth || 800;
    const ch = canvasRenderer.displayHeight || 500;

    selectedIndices.forEach(slotIdx => {
      const rect = canvasRenderer.cachedRectangles.find(r => r.slotIndex === slotIdx);
      if (!rect) return;

      const newX = Math.max(0, Math.min(cw - rect.width, rect.x + dx));
      const newY = Math.max(0, Math.min(ch - rect.height, rect.y + dy));

      albumState.updateSlotPixelRect(
        albumState.activeSpreadIndex,
        slotIdx,
        { x: Math.round(newX), y: Math.round(newY), width: rect.width, height: rect.height },
        cw,
        ch
      );
    });

    albumState.recordSnapshot();
    canvasRenderer.requestRender();
    debouncedRenderFilmstrip();
  }

  // --- Keyboard Shortcuts ---
  window.addEventListener('keydown', (e) => {
    // If typing in input or select, skip
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;

    if (e.code === 'Escape') {
      if (els.layoutsDrawer && els.layoutsDrawer.classList.contains('open')) {
        els.layoutsDrawer.classList.remove('open');
        els.btnDockSpreadLayout?.classList.remove('active');
        if (canvasRenderer && typeof canvasRenderer.setHoverLayoutPreview === 'function') {
          canvasRenderer.setHoverLayoutPreview(null);
        }
      }
      if (canvasRenderer.drawNewFrameMode) {
        canvasRenderer.toggleDrawNewFrameMode(false);
      }
      if (selectedPhotoIds.size > 0) {
        selectedPhotoIds.clear();
        lastSelectedPhotoIndex = -1;
        updateTraySelectionUI();
      }
      return;
    }

    // Ctrl + C / Cmd + C -> Copy selected frame(s) or photo(s)
    if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyC' || e.key === 'c' || e.key === 'C')) {
      if (copySelectedElements()) {
        e.preventDefault();
      }
      return;
    }

    // Ctrl + V / Cmd + V -> Paste copied frame(s) or photo(s)
    if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyV' || e.key === 'v' || e.key === 'V')) {
      if (pasteClipboardElements()) {
        e.preventDefault();
      }
      return;
    }

    // Ctrl + J / Cmd + J -> Duplicate / Copy and Paste selected frame(s) or photo(s)
    if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyJ' || e.key === 'j' || e.key === 'J')) {
      e.preventDefault();
      const hasFrameSelected = (canvasRenderer.selectedSlotIndices && canvasRenderer.selectedSlotIndices.size > 0) ||
        (canvasRenderer.selectedSlotIndex !== null && canvasRenderer.selectedSlotIndex !== undefined);
      const hasPhotoSelected = selectedPhotoIds && selectedPhotoIds.size > 0;

      if (hasFrameSelected) {
        const cw = canvasRenderer.displayWidth || 1200;
        const ch = canvasRenderer.displayHeight || 600;
        const targetSlot = (canvasRenderer.selectedSlotIndices && canvasRenderer.selectedSlotIndices.size > 0)
          ? Array.from(canvasRenderer.selectedSlotIndices)[0]
          : canvasRenderer.selectedSlotIndex;
        const newSlotIdx = albumState.duplicateSlot(albumState.activeSpreadIndex, targetSlot, 'offset', cw, ch);
        if (newSlotIdx !== null && newSlotIdx !== undefined) {
          canvasRenderer.selectedSlotIndex = newSlotIdx;
          if (canvasRenderer.selectedSlotIndices) canvasRenderer.selectedSlotIndices = new Set([newSlotIdx]);
          canvasRenderer.requestRender();
          updatePreviewBarForSlot(newSlotIdx);
          debouncedRenderFilmstrip();
          showToastNotification('⧉ Duplicated frame / picture (Ctrl+J)');
        }
      } else if (hasPhotoSelected) {
        if (copySelectedElements()) {
          pasteClipboardElements();
        }
      } else if (clipboardFrames || clipboardPhotos) {
        pasteClipboardElements();
      }
      return;
    }

    if (e.ctrlKey && (e.code === 'KeyA' || e.key === 'a' || e.key === 'A')) {
      e.preventDefault();
      let photos = albumState.project.photos;
      if (currentTrayFilter === 'unused') photos = photos.filter(p => (p.usageCount || 0) === 0);
      else if (currentTrayFilter === 'used') photos = photos.filter(p => (p.usageCount || 0) > 0);
      photos.forEach(p => selectedPhotoIds.add(p.id));
      updateTraySelectionUI();
      return;
    }

    if (e.code === 'Space') {
      e.preventDefault();
      if (e.shiftKey) {
        albumState.prevLayout();
      } else {
        albumState.nextLayout();
      }
    } else if (e.code === 'KeyD' && !e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
      canvasRenderer.toggleDrawNewFrameMode();
    } else if (e.code === 'KeyR') {
      e.preventDefault();
      albumState.randomizeLayout();
      showToastNotification('🎲 Varied layout rectangles (photo order maintained)');
    } else if (e.code === 'KeyH' && !e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
      const hasCanvasSelection = (canvasRenderer.selectedSlotIndices && canvasRenderer.selectedSlotIndices.size > 0) ||
        (canvasRenderer.selectedSlotIndex !== null && canvasRenderer.selectedSlotIndex !== undefined);
      if (hasCanvasSelection) {
        albumState.switchFramesLeftRight(albumState.activeSpreadIndex, canvasRenderer.selectedSlotIndices?.size > 0 ? canvasRenderer.selectedSlotIndices : canvasRenderer.selectedSlotIndex);
        canvasRenderer.requestRender();
        showToastNotification('⇄ Switched selected frame(s) Left ↔ Right');
      } else {
        albumState.flipLayoutHorizontal();
        showToastNotification('⇄ Flipped spread layout horizontally');
      }
    } else if ((e.ctrlKey || e.metaKey) && (e.code === 'BracketRight' || e.key === ']')) {
      if (canvasRenderer.selectedSlotIndex !== null) {
        e.preventDefault();
        const newIdx = e.shiftKey
          ? albumState.bringToFront(albumState.activeSpreadIndex, canvasRenderer.selectedSlotIndex)
          : albumState.bringForward(albumState.activeSpreadIndex, canvasRenderer.selectedSlotIndex);
        if (newIdx !== null) canvasRenderer.selectedSlotIndex = newIdx;
        canvasRenderer.requestRender();
        showToastNotification(e.shiftKey ? '⤉ Brought frame to front' : '⤒ Brought frame forward');
      }
    } else if ((e.ctrlKey || e.metaKey) && (e.code === 'BracketLeft' || e.key === '[')) {
      if (canvasRenderer.selectedSlotIndex !== null) {
        e.preventDefault();
        const newIdx = e.shiftKey
          ? albumState.sendToBack(albumState.activeSpreadIndex, canvasRenderer.selectedSlotIndex)
          : albumState.sendBackward(albumState.activeSpreadIndex, canvasRenderer.selectedSlotIndex);
        if (newIdx !== null) canvasRenderer.selectedSlotIndex = newIdx;
        canvasRenderer.requestRender();
        showToastNotification(e.shiftKey ? '⤈ Sent frame to back' : '⤓ Sent frame backward');
      }
    } else if (e.code === 'KeyO') {
      e.preventDefault();
      const currentOrient = albumState.getSpreadOrientation();
      const nextOrient = currentOrient === 'landscape' ? 'portrait' : 'landscape';
      albumState.setOrientation(nextOrient);
      resizeCanvasStage();
    } else if (e.code === 'ArrowRight' && !e.ctrlKey) {
      const hasCanvasSelection = (canvasRenderer.selectedSlotIndices && canvasRenderer.selectedSlotIndices.size > 0) ||
        (canvasRenderer.selectedSlotIndex !== null && canvasRenderer.selectedSlotIndex !== undefined);
      if (hasCanvasSelection) {
        e.preventDefault();
        nudgeSelectedCanvasFrames(e.shiftKey ? 10 : 2, 0, e.altKey);
      } else if (albumState.activeSpreadIndex < albumState.project.spreads.length - 1) {
        albumState.setActiveSpread(albumState.activeSpreadIndex + 1);
      }
    } else if (e.code === 'ArrowLeft' && !e.ctrlKey) {
      const hasCanvasSelection = (canvasRenderer.selectedSlotIndices && canvasRenderer.selectedSlotIndices.size > 0) ||
        (canvasRenderer.selectedSlotIndex !== null && canvasRenderer.selectedSlotIndex !== undefined);
      if (hasCanvasSelection) {
        e.preventDefault();
        nudgeSelectedCanvasFrames(e.shiftKey ? -10 : -2, 0, e.altKey);
      } else if (albumState.activeSpreadIndex > 0) {
        albumState.setActiveSpread(albumState.activeSpreadIndex - 1);
      }
    } else if (e.code === 'ArrowUp' && !e.ctrlKey) {
      const hasCanvasSelection = (canvasRenderer.selectedSlotIndices && canvasRenderer.selectedSlotIndices.size > 0) ||
        (canvasRenderer.selectedSlotIndex !== null && canvasRenderer.selectedSlotIndex !== undefined);
      if (hasCanvasSelection) {
        e.preventDefault();
        nudgeSelectedCanvasFrames(0, e.shiftKey ? -10 : -2, e.altKey);
      }
    } else if (e.code === 'ArrowDown' && !e.ctrlKey) {
      const hasCanvasSelection = (canvasRenderer.selectedSlotIndices && canvasRenderer.selectedSlotIndices.size > 0) ||
        (canvasRenderer.selectedSlotIndex !== null && canvasRenderer.selectedSlotIndex !== undefined);
      if (hasCanvasSelection) {
        e.preventDefault();
        nudgeSelectedCanvasFrames(0, e.shiftKey ? 10 : 2, e.altKey);
      }
    } else if (e.code === 'Home' || e.key === 'Home') {
      if (albumState.project && albumState.project.spreads && albumState.project.spreads.length > 0) {
        e.preventDefault();
        albumState.setActiveSpread(0);
      }
    } else if (e.code === 'End' || e.key === 'End') {
      if (albumState.project && albumState.project.spreads && albumState.project.spreads.length > 0) {
        e.preventDefault();
        albumState.setActiveSpread(albumState.project.spreads.length - 1);
      }
    } else if (e.ctrlKey && e.code === 'KeyZ') {
      e.preventDefault();
      if (e.shiftKey) {
        albumState.redo();
      } else {
        albumState.undo();
      }
    } else if (e.ctrlKey && e.code === 'KeyY') {
      e.preventDefault();
      albumState.redo();
    }
  });

  // --- Event Listeners Wiring ---

  // Draw Frame Tool
  // Note: els.btnDrawFrame click is managed by dockContainers to toggle shapes popover or exit draw mode
  if (els.btnHudDrawFrame) {
    els.btnHudDrawFrame.addEventListener('click', (e) => {
      e.stopPropagation();
      canvasRenderer.toggleDrawNewFrameMode();
    });
  }
  if (els.btnExitDrawMode) {
    els.btnExitDrawMode.addEventListener('click', (e) => {
      e.stopPropagation();
      canvasRenderer.toggleDrawNewFrameMode(false);
    });
  }

  // Layout cycling
  if (els.btnNextLayout) els.btnNextLayout.addEventListener('click', () => albumState.nextLayout());
  if (els.btnPrevLayout) els.btnPrevLayout.addEventListener('click', () => albumState.prevLayout());
  if (els.btnHudNextLayout) els.btnHudNextLayout.addEventListener('click', () => albumState.nextLayout());
  if (els.btnHudPrevLayout) els.btnHudPrevLayout.addEventListener('click', () => albumState.prevLayout());
  if (els.btnRandomizeLayout) els.btnRandomizeLayout.addEventListener('click', () => albumState.randomizeLayout());
  if (els.btnFlipHorizontal) els.btnFlipHorizontal.addEventListener('click', () => albumState.flipLayoutHorizontal());
  if (els.btnHudSwitchLeftRight) {
    els.btnHudSwitchLeftRight.addEventListener('click', () => {
      const hasCanvasSelection = (canvasRenderer.selectedSlotIndices && canvasRenderer.selectedSlotIndices.size > 0) ||
        (canvasRenderer.selectedSlotIndex !== null && canvasRenderer.selectedSlotIndex !== undefined);
      if (hasCanvasSelection) {
        albumState.switchFramesLeftRight(albumState.activeSpreadIndex, canvasRenderer.selectedSlotIndices?.size > 0 ? canvasRenderer.selectedSlotIndices : canvasRenderer.selectedSlotIndex);
        canvasRenderer.requestRender();
        showToastNotification('⇄ Switched selected frame(s) Left ↔ Right');
      } else {
        albumState.flipLayoutHorizontal();
        showToastNotification('⇄ Flipped spread layout horizontally');
      }
    });
  }
  if (els.btnOpenCatalog) els.btnOpenCatalog.addEventListener('click', openLayoutsCatalog);
  if (els.btnCloseDrawer) {
    els.btnCloseDrawer.addEventListener('click', () => {
      canvasRenderer.setHoverLayoutPreview(null);
      els.layoutsDrawer?.classList.remove('open');
      els.btnDockSpreadLayout?.classList.remove('active');
    });
  }

  // Spread navigation
  if (els.btnPrevSpread) {
    els.btnPrevSpread.addEventListener('click', () => {
      if (albumState.activeSpreadIndex > 0) albumState.setActiveSpread(albumState.activeSpreadIndex - 1);
    });
  }
  if (els.btnNextSpread) {
    els.btnNextSpread.addEventListener('click', () => {
      if (albumState.activeSpreadIndex < albumState.project.spreads.length - 1) {
        albumState.setActiveSpread(albumState.activeSpreadIndex + 1);
      }
    });
  }
  if (els.btnStagePrevSpread) {
    els.btnStagePrevSpread.addEventListener('click', () => {
      if (albumState.activeSpreadIndex > 0) albumState.setActiveSpread(albumState.activeSpreadIndex - 1);
    });
  }
  if (els.btnStageNextSpread) {
    els.btnStageNextSpread.addEventListener('click', () => {
      if (albumState.activeSpreadIndex < albumState.project.spreads.length - 1) {
        albumState.setActiveSpread(albumState.activeSpreadIndex + 1);
      }
    });
  }

  // Spread addition
  if (els.btnAddSpread) els.btnAddSpread.addEventListener('click', () => albumState.addSpread());

  // Undo / Redo
  if (els.btnUndo) els.btnUndo.addEventListener('click', () => albumState.undo());
  if (els.btnRedo) els.btnRedo.addEventListener('click', () => albumState.redo());

  // Album Size Selection
  if (els.albumSizeSelect) {
    els.albumSizeSelect.addEventListener('change', (e) => {
      albumState.setAlbumSize(e.target.value);
      resizeCanvasStage();
    });
  }

  // ==================== Margins, Gaps & Spacing Scope Controls ====================
  let spacingScopeMode = 'current'; // 'current' (single spread) or 'all' (all spreads)

  function syncSpacingControlsUI() {
    const currIdx = albumState.activeSpreadIndex;
    if (els.labelSpacingTargetSpread) {
      els.labelSpacingTargetSpread.textContent = spacingScopeMode === 'current' ? `Spread ${currIdx + 1}` : 'All Spreads';
    }
    const currentGap = albumState.getSpreadGapPx(currIdx);
    const currentMargin = albumState.getSpreadMarginPercent(currIdx);
    const currentMiddle = albumState.getSpreadMiddleMarginPercent(currIdx);

    if (els.gapSlider) els.gapSlider.value = currentGap;
    if (els.gapVal) els.gapVal.textContent = currentGap + 'px';
    if (els.marginSlider) els.marginSlider.value = currentMargin;
    if (els.marginVal) els.marginVal.textContent = currentMargin + '%';
    if (els.middleMarginSlider) els.middleMarginSlider.value = currentMiddle;
    if (els.middleMarginVal) els.middleMarginVal.textContent = currentMiddle + '%';
  }
  window.syncSpacingControlsUI = syncSpacingControlsUI;

  if (els.btnScopeCurrentSpread && els.btnScopeAllSpreads) {
    els.btnScopeCurrentSpread.addEventListener('click', () => {
      spacingScopeMode = 'current';
      els.btnScopeCurrentSpread.classList.add('active');
      els.btnScopeAllSpreads.classList.remove('active');
      syncSpacingControlsUI();
    });

    els.btnScopeAllSpreads.addEventListener('click', () => {
      spacingScopeMode = 'all';
      els.btnScopeAllSpreads.classList.add('active');
      els.btnScopeCurrentSpread.classList.remove('active');
      syncSpacingControlsUI();
    });
  }

  // Spacing & Margin Sliders (Single Spread vs All Spreads)
  if (els.marginSlider) {
    els.marginSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (els.marginVal) els.marginVal.textContent = val + '%';
      const isAll = spacingScopeMode === 'all';
      albumState.setSpreadMarginPercent(albumState.activeSpreadIndex, val, isAll);
      canvasRenderer.requestRender();
      debouncedRenderFilmstrip();
    });
  }

  if (els.gapSlider) {
    els.gapSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      if (els.gapVal) els.gapVal.textContent = val + 'px';
      const isAll = spacingScopeMode === 'all';
      albumState.setSpreadGapPx(albumState.activeSpreadIndex, val, isAll);
      canvasRenderer.requestRender();
      debouncedRenderFilmstrip();
    });
  }

  if (els.middleMarginSlider) {
    els.middleMarginSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (els.middleMarginVal) els.middleMarginVal.textContent = val + '%';
      const isAll = spacingScopeMode === 'all';
      albumState.setSpreadMiddleMarginPercent(albumState.activeSpreadIndex, val, isAll);
      canvasRenderer.requestRender();
      debouncedRenderFilmstrip();
    });
  }

  // Open Transparent Layout Options / Big View
  if (els.btnOpenTransparentLayouts) {
    els.btnOpenTransparentLayouts.addEventListener('click', () => openBigViewModal('all'));
  }



  // --- Photo Frame Adjustment Preview Bar Controller ---
  function applyThumbVisualStyles(slot) {
    if (!els.previewBarThumb || !slot) return;
    const b = slot.brightness !== undefined ? slot.brightness : 100;
    const c = slot.contrast !== undefined ? slot.contrast : 100;
    const s = slot.saturation !== undefined ? slot.saturation : 100;
    const w = slot.warmth || 0;
    const flipH = Boolean(slot.flipH);
    const flipV = Boolean(slot.flipV);
    const rot = slot.rotation || 0;

    const filters = [];
    if (b !== 100) filters.push(`brightness(${b}%)`);
    if (c !== 100) filters.push(`contrast(${c}%)`);
    if (s !== 100) filters.push(`saturate(${s}%)`);
    if (w > 0) {
      filters.push(`sepia(${w * 0.45}%)`);
      filters.push(`hue-rotate(${w * -0.15}deg)`);
    } else if (w < 0) {
      filters.push(`hue-rotate(${w * 0.35}deg)`);
    }
    els.previewBarThumb.style.filter = filters.length > 0 ? filters.join(' ') : 'none';
    els.previewBarThumb.style.transform = `scale(${flipH ? -1 : 1}, ${flipV ? -1 : 1}) rotate(${rot}deg)`;
  }

  function updatePreviewBarForSlot(slotIndex) {
    if (!els.photoFramePreviewBar) return;
    const spread = albumState.getActiveSpread();
    if (!spread || slotIndex === null || slotIndex === undefined) {
      els.photoFramePreviewBar.style.display = 'none';
      return;
    }
    const slot = spread.slots.find(s => s.slotIndex === slotIndex);
    if (!slot) {
      els.photoFramePreviewBar.style.display = 'none';
      return;
    }
    if (!slot.photoId) {
      // Empty Frame without photo
      els.photoFramePreviewBar.style.display = 'flex';
      if (els.previewBarThumb) {
        els.previewBarThumb.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='1.5'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2' stroke-dasharray='3 3'/%3E%3Cpath d='M12 8v8M8 12h8'/%3E%3C/svg%3E";
      }
      if (els.previewBarSlotName) els.previewBarSlotName.textContent = `Frame ${slot.slotIndex + 1}`;
      if (els.previewBarPhotoName) els.previewBarPhotoName.textContent = 'Empty Frame (Custom)';
      if (els.previewBarPhotoAspect) els.previewBarPhotoAspect.textContent = `${slot.shape || 'Frame'}`;
      return;
    }
    const photo = albumState.getPhotoById(slot.photoId);
    if (!photo) {
      els.photoFramePreviewBar.style.display = 'none';
      return;
    }

    els.photoFramePreviewBar.style.display = 'flex';
    if (els.previewBarThumb) els.previewBarThumb.src = photo.thumbSrc || photo.src;
    if (els.previewBarSlotName) els.previewBarSlotName.textContent = `Frame ${slot.slotIndex + 1}`;
    if (els.previewBarPhotoName) els.previewBarPhotoName.textContent = photo.name || 'Photo';

    if (els.previewBarPhotoAspect) {
      const asp = photo.aspect || (photo.width && photo.height ? photo.width / photo.height : 1.0);
      const label = asp > 1.25 ? 'Landscape' : (asp < 0.8 ? 'Portrait' : 'Square');
      els.previewBarPhotoAspect.textContent = `${label} (${asp.toFixed(2)})`;
    }

    // Zoom
    const zoom = slot.zoom || 1.0;
    if (els.previewBarZoomSlider) els.previewBarZoomSlider.value = zoom;
    if (els.previewBarZoomVal) els.previewBarZoomVal.textContent = Math.round(zoom * 100) + '%';

    // Crop / Framing Mode
    const cropMode = slot.cropMode || 'cover';
    if (els.previewBarCropModeVal) {
      els.previewBarCropModeVal.textContent = cropMode === 'contain' ? 'Fit Whole' : 'Fill Frame';
    }
    if (els.btnCropModeCover) els.btnCropModeCover.classList.toggle('active', cropMode !== 'contain');
    if (els.btnCropModeContain) els.btnCropModeContain.classList.toggle('active', cropMode === 'contain');

    // Light & Color adjustments
    const brightness = slot.brightness !== undefined ? slot.brightness : 100;
    const contrast = slot.contrast !== undefined ? slot.contrast : 100;
    const saturation = slot.saturation !== undefined ? slot.saturation : 100;
    const warmth = slot.warmth || 0;

    if (els.previewBarBrightness) els.previewBarBrightness.value = brightness;
    if (els.previewBarBrightnessVal) els.previewBarBrightnessVal.textContent = brightness + '%';

    if (els.previewBarContrast) els.previewBarContrast.value = contrast;
    if (els.previewBarContrastVal) els.previewBarContrastVal.textContent = contrast + '%';

    if (els.previewBarSaturation) els.previewBarSaturation.value = saturation;
    if (els.previewBarSaturationVal) els.previewBarSaturationVal.textContent = saturation + '%';

    if (els.previewBarWarmth) els.previewBarWarmth.value = warmth;
    if (els.previewBarWarmthVal) els.previewBarWarmthVal.textContent = (warmth > 0 ? '+' : '') + warmth;

    // Preset chips active highlighting
    document.querySelectorAll('.inspector-preset-chip').forEach(chip => {
      const p = chip.dataset.preset;
      let isMatch = false;
      if (p === 'original' && brightness === 100 && contrast === 100 && saturation === 100 && warmth === 0) isMatch = true;
      else if (p === 'bw' && saturation === 0) isMatch = true;
      else if (p === 'warm' && warmth > 15) isMatch = true;
      else if (p === 'vibrant' && saturation > 120) isMatch = true;
      else if (p === 'matte' && contrast < 95) isMatch = true;
      chip.classList.toggle('active', isMatch);
    });

    applyThumbVisualStyles(slot);
  }

  function updatePreviewBarValues(slotIndex) {
    updatePreviewBarForSlot(slotIndex);
  }

  function getSelectedSlot() {
    const spread = albumState.getActiveSpread();
    if (!spread || canvasRenderer.selectedSlotIndex === null) return null;
    return spread.slots.find(s => s.slotIndex === canvasRenderer.selectedSlotIndex) || null;
  }

  // Preview Bar Rescaling (Zoom Slider & Buttons)
  if (els.previewBarZoomSlider) {
    els.previewBarZoomSlider.addEventListener('input', (e) => {
      const slot = getSelectedSlot();
      if (!slot) return;
      slot.zoom = parseFloat(e.target.value);
      if (els.previewBarZoomVal) els.previewBarZoomVal.textContent = Math.round(slot.zoom * 100) + '%';
      canvasRenderer.requestRender();
    });
  }

  if (els.btnPreviewZoomIn) {
    els.btnPreviewZoomIn.addEventListener('click', () => {
      const slot = getSelectedSlot();
      if (!slot) return;
      slot.zoom = Math.min(3.0, Math.round(((slot.zoom || 1.0) + 0.1) * 20) / 20);
      if (els.previewBarZoomSlider) els.previewBarZoomSlider.value = slot.zoom;
      if (els.previewBarZoomVal) els.previewBarZoomVal.textContent = Math.round(slot.zoom * 100) + '%';
      canvasRenderer.requestRender();
    });
  }

  if (els.btnPreviewZoomOut) {
    els.btnPreviewZoomOut.addEventListener('click', () => {
      const slot = getSelectedSlot();
      if (!slot) return;
      slot.zoom = Math.max(1.0, Math.round(((slot.zoom || 1.0) - 0.1) * 20) / 20);
      if (els.previewBarZoomSlider) els.previewBarZoomSlider.value = slot.zoom;
      if (els.previewBarZoomVal) els.previewBarZoomVal.textContent = Math.round(slot.zoom * 100) + '%';
      canvasRenderer.requestRender();
    });
  }

  // Preset Zoom Buttons
  document.querySelectorAll('.inspector-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const slot = getSelectedSlot();
      if (!slot) return;
      slot.zoom = parseFloat(btn.dataset.zoom);
      if (els.previewBarZoomSlider) els.previewBarZoomSlider.value = slot.zoom;
      if (els.previewBarZoomVal) els.previewBarZoomVal.textContent = Math.round(slot.zoom * 100) + '%';
      canvasRenderer.requestRender();
    });
  });

  // Preview Bar Repositioning (Nudge & Center)
  function nudgeSelectedSlot(dx, dy) {
    const slot = getSelectedSlot();
    if (!slot) return;
    slot.panX = (slot.panX || 0) + dx;
    slot.panY = (slot.panY || 0) + dy;
    canvasRenderer.requestRender();
  }

  if (els.btnPreviewPanLeft) els.btnPreviewPanLeft.addEventListener('click', () => nudgeSelectedSlot(-15, 0));
  if (els.btnPreviewPanRight) els.btnPreviewPanRight.addEventListener('click', () => nudgeSelectedSlot(15, 0));
  if (els.btnPreviewPanUp) els.btnPreviewPanUp.addEventListener('click', () => nudgeSelectedSlot(0, -15));
  if (els.btnPreviewPanDown) els.btnPreviewPanDown.addEventListener('click', () => nudgeSelectedSlot(0, 15));

  if (els.btnPreviewPanCenter) {
    els.btnPreviewPanCenter.addEventListener('click', () => {
      const slot = getSelectedSlot();
      if (!slot) return;
      slot.panX = 0;
      slot.panY = 0;
      canvasRenderer.requestRender();
    });
  }

  // Preview Bar Mirror & Flips & Rotation
  if (els.btnPreviewFlipH) {
    els.btnPreviewFlipH.addEventListener('click', () => {
      const slot = getSelectedSlot();
      if (!slot) return;
      slot.flipH = !slot.flipH;
      applyThumbVisualStyles(slot);
      canvasRenderer.requestRender();
    });
  }

  if (els.btnPreviewFlipV) {
    els.btnPreviewFlipV.addEventListener('click', () => {
      const slot = getSelectedSlot();
      if (!slot) return;
      slot.flipV = !slot.flipV;
      applyThumbVisualStyles(slot);
      canvasRenderer.requestRender();
    });
  }

  if (els.btnPreviewRotate) {
    els.btnPreviewRotate.addEventListener('click', () => {
      const slot = getSelectedSlot();
      if (!slot) return;
      slot.rotation = ((slot.rotation || 0) + 90) % 360;
      applyThumbVisualStyles(slot);
      canvasRenderer.requestRender();
    });
  }

  // Crop & Framing Modes (Cover vs Contain)
  if (els.btnCropModeCover) {
    els.btnCropModeCover.addEventListener('click', () => {
      const slot = getSelectedSlot();
      if (!slot) return;
      slot.cropMode = 'cover';
      updatePreviewBarForSlot(slot.slotIndex);
      canvasRenderer.requestRender();
    });
  }

  if (els.btnCropModeContain) {
    els.btnCropModeContain.addEventListener('click', () => {
      const slot = getSelectedSlot();
      if (!slot) return;
      slot.cropMode = 'contain';
      updatePreviewBarForSlot(slot.slotIndex);
      canvasRenderer.requestRender();
    });
  }

  // Light & Color Adjustments (Sliders, Presets, Reset)
  if (els.btnResetAdjustments) {
    els.btnResetAdjustments.addEventListener('click', () => {
      const slot = getSelectedSlot();
      if (!slot) return;
      slot.brightness = 100;
      slot.contrast = 100;
      slot.saturation = 100;
      slot.warmth = 0;
      slot.flipH = false;
      slot.flipV = false;
      slot.rotation = 0;
      updatePreviewBarForSlot(slot.slotIndex);
      canvasRenderer.requestRender();
    });
  }

  if (els.previewBarBrightness) {
    els.previewBarBrightness.addEventListener('input', (e) => {
      const slot = getSelectedSlot();
      if (!slot) return;
      slot.brightness = parseInt(e.target.value, 10);
      if (els.previewBarBrightnessVal) els.previewBarBrightnessVal.textContent = slot.brightness + '%';
      applyThumbVisualStyles(slot);
      canvasRenderer.requestRender();
    });
  }

  if (els.previewBarContrast) {
    els.previewBarContrast.addEventListener('input', (e) => {
      const slot = getSelectedSlot();
      if (!slot) return;
      slot.contrast = parseInt(e.target.value, 10);
      if (els.previewBarContrastVal) els.previewBarContrastVal.textContent = slot.contrast + '%';
      applyThumbVisualStyles(slot);
      canvasRenderer.requestRender();
    });
  }

  if (els.previewBarSaturation) {
    els.previewBarSaturation.addEventListener('input', (e) => {
      const slot = getSelectedSlot();
      if (!slot) return;
      slot.saturation = parseInt(e.target.value, 10);
      if (els.previewBarSaturationVal) els.previewBarSaturationVal.textContent = slot.saturation + '%';
      applyThumbVisualStyles(slot);
      canvasRenderer.requestRender();
    });
  }

  if (els.previewBarWarmth) {
    els.previewBarWarmth.addEventListener('input', (e) => {
      const slot = getSelectedSlot();
      if (!slot) return;
      slot.warmth = parseInt(e.target.value, 10);
      if (els.previewBarWarmthVal) els.previewBarWarmthVal.textContent = (slot.warmth > 0 ? '+' : '') + slot.warmth;
      applyThumbVisualStyles(slot);
      canvasRenderer.requestRender();
    });
  }

  // Preset Chips
  document.querySelectorAll('.inspector-preset-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const slot = getSelectedSlot();
      if (!slot) return;
      const preset = chip.dataset.preset;
      if (preset === 'original') {
        slot.brightness = 100; slot.contrast = 100; slot.saturation = 100; slot.warmth = 0;
      } else if (preset === 'bw') {
        slot.saturation = 0; slot.contrast = 115; slot.brightness = 100; slot.warmth = 0;
      } else if (preset === 'warm') {
        slot.warmth = 25; slot.saturation = 110; slot.brightness = 105; slot.contrast = 100;
      } else if (preset === 'vibrant') {
        slot.saturation = 135; slot.contrast = 112; slot.brightness = 100; slot.warmth = 0;
      } else if (preset === 'matte') {
        slot.contrast = 90; slot.brightness = 108; slot.saturation = 95; slot.warmth = 5;
      }
      updatePreviewBarForSlot(slot.slotIndex);
      canvasRenderer.requestRender();
    });
  });

  // Switch Selected Frame(s) Left <-> Right
  if (els.btnPreviewSwitchLeftRight) {
    els.btnPreviewSwitchLeftRight.addEventListener('click', () => {
      const hasCanvasSelection = (canvasRenderer.selectedSlotIndices && canvasRenderer.selectedSlotIndices.size > 0) ||
        (canvasRenderer.selectedSlotIndex !== null && canvasRenderer.selectedSlotIndex !== undefined);
      if (hasCanvasSelection) {
        albumState.switchFramesLeftRight(albumState.activeSpreadIndex, canvasRenderer.selectedSlotIndices?.size > 0 ? canvasRenderer.selectedSlotIndices : canvasRenderer.selectedSlotIndex);
        canvasRenderer.requestRender();
        showToastNotification('⇄ Switched selected frame(s) Left ↔ Right');
      }
    });
  }

  // Layer Arrange: Bring to Front
  if (els.btnPreviewBringToFront) {
    els.btnPreviewBringToFront.addEventListener('click', () => {
      if (canvasRenderer.selectedSlotIndex !== null) {
        const newIdx = albumState.bringToFront(albumState.activeSpreadIndex, canvasRenderer.selectedSlotIndex);
        if (newIdx !== null) {
          canvasRenderer.selectedSlotIndex = newIdx;
          updatePreviewBarForSlot(newIdx);
        }
        canvasRenderer.requestRender();
        showToastNotification('⤉ Brought frame to front (topmost layer)');
      }
    });
  }

  // Layer Arrange: Bring Forward
  if (els.btnPreviewBringForward) {
    els.btnPreviewBringForward.addEventListener('click', () => {
      if (canvasRenderer.selectedSlotIndex !== null) {
        const newIdx = albumState.bringForward(albumState.activeSpreadIndex, canvasRenderer.selectedSlotIndex);
        if (newIdx !== null) {
          canvasRenderer.selectedSlotIndex = newIdx;
          updatePreviewBarForSlot(newIdx);
        }
        canvasRenderer.requestRender();
        showToastNotification('⤒ Brought frame forward 1 layer');
      }
    });
  }

  // Layer Arrange: Send Backward
  if (els.btnPreviewSendBackward) {
    els.btnPreviewSendBackward.addEventListener('click', () => {
      if (canvasRenderer.selectedSlotIndex !== null) {
        const newIdx = albumState.sendBackward(albumState.activeSpreadIndex, canvasRenderer.selectedSlotIndex);
        if (newIdx !== null) {
          canvasRenderer.selectedSlotIndex = newIdx;
          updatePreviewBarForSlot(newIdx);
        }
        canvasRenderer.requestRender();
        showToastNotification('⤓ Sent frame backward 1 layer');
      }
    });
  }

  // Layer Arrange: Send to Back
  if (els.btnPreviewSendToBack) {
    els.btnPreviewSendToBack.addEventListener('click', () => {
      if (canvasRenderer.selectedSlotIndex !== null) {
        const newIdx = albumState.sendToBack(albumState.activeSpreadIndex, canvasRenderer.selectedSlotIndex);
        if (newIdx !== null) {
          canvasRenderer.selectedSlotIndex = newIdx;
          updatePreviewBarForSlot(newIdx);
        }
        canvasRenderer.requestRender();
        showToastNotification('⤈ Sent frame to back (bottommost layer)');
      }
    });
  }

  // Preview Bar Swap / Interchange Photo
  if (els.btnPreviewSwapPhoto) {
    els.btnPreviewSwapPhoto.addEventListener('click', () => {
      const spread = albumState.getActiveSpread();
      if (!spread || canvasRenderer.selectedSlotIndex === null) return;
      const currSlot = canvasRenderer.selectedSlotIndex;
      const otherSlots = spread.slots.filter(s => s.slotIndex !== currSlot);
      if (otherSlots.length === 0) return;
      const targetSlot = otherSlots.length === 1 ? otherSlots[0].slotIndex : (currSlot + 1) % spread.slots.length;
      albumState.swapSlots(albumState.activeSpreadIndex, currSlot, targetSlot);
      canvasRenderer.selectedSlotIndex = targetSlot;
      updatePreviewBarForSlot(targetSlot);
      canvasRenderer.requestRender();
      showToastNotification(`⇄ Photos interchanged between Frame ${currSlot + 1} and Frame ${targetSlot + 1}`);
    });
  }

  // Preview Bar Remove Photo
  if (els.btnPreviewRemovePhoto) {
    els.btnPreviewRemovePhoto.addEventListener('click', () => {
      const spread = albumState.getActiveSpread();
      const slot = getSelectedSlot();
      if (!spread || !slot || !slot.photoId) return;
      const photoId = slot.photoId;
      albumState.recordSnapshot();
      slot.photoId = null;
      slot.panX = 0;
      slot.panY = 0;
      slot.zoom = 1.0;
      slot.rotation = 0;
      slot.flipH = false;
      slot.flipV = false;
      slot.cropMode = 'cover';
      slot.brightness = 100;
      slot.contrast = 100;
      slot.saturation = 100;
      slot.warmth = 0;
      spread.photoIds = spread.photoIds.filter(id => id !== photoId);
      albumState._recomputeUsageCounts();
      canvasRenderer.selectedSlotIndex = null;
      if (els.photoFramePreviewBar) els.photoFramePreviewBar.style.display = 'none';
      albumState.notify('photo-removed', spread);
      canvasRenderer.requestRender();
    });
  }

  // Preview Bar Delete Frame
  if (els.btnPreviewDeleteFrame) {
    els.btnPreviewDeleteFrame.addEventListener('click', () => {
      const spread = albumState.getActiveSpread();
      const slot = getSelectedSlot();
      if (!spread || !slot) return;
      const slotIdx = slot.slotIndex;
      canvasRenderer.selectedSlotIndex = null;
      if (canvasRenderer.selectedSlotIndices) canvasRenderer.selectedSlotIndices.clear();
      if (els.photoFramePreviewBar) els.photoFramePreviewBar.style.display = 'none';
      albumState.deleteFrame(albumState.activeSpreadIndex, slotIdx);
      canvasRenderer.requestRender();
      showToastNotification('🗑️ Frame deleted (Photo returned to Unused Photos pool)');
    });
  }

  // Preview Bar Close
  if (els.btnClosePreviewBar) {
    els.btnClosePreviewBar.addEventListener('click', () => {
      canvasRenderer.selectedSlotIndex = null;
      if (els.photoFramePreviewBar) els.photoFramePreviewBar.style.display = 'none';
      canvasRenderer.requestRender();
    });
  }

  // --- Stage & Canvas Drag-and-Drop for Selected Photos ---
  if (els.canvasStage) {
    els.canvasStage.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (els.canvasDropOverlay) {
        els.canvasDropOverlay.style.display = 'none';
      }
    });

    els.canvasStage.addEventListener('dragleave', (e) => {
      if (els.canvasDropOverlay) els.canvasDropOverlay.style.display = 'none';
    });

    els.canvasStage.addEventListener('drop', (e) => {
      if (els.canvasDropOverlay) els.canvasDropOverlay.style.display = 'none';
      if (e.defaultPrevented) return;
      e.preventDefault();

      // Check if external image files were dropped from Windows
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        importPhotoFiles(e.dataTransfer.files, { targetSpreadIndex: albumState.activeSpreadIndex, autoLayout: true });
        return;
      }

      let photoIds = [];
      try {
        const json = e.dataTransfer.getData('application/json');
        if (json) {
          const parsed = JSON.parse(json);
          if (Array.isArray(parsed.photoIds)) photoIds = parsed.photoIds;
        }
      } catch (err) {}

      const singleId = e.dataTransfer.getData('text/photoId');
      if (photoIds.length === 0 && singleId) photoIds = [singleId];

      if (photoIds.length > 0) {
        // When photos are dragged to canvas, reorder from template according to suitable design depending on number of pics
        albumState.addPhotosToSpreadWithAutoLayout(albumState.activeSpreadIndex, photoIds);
      }

      // Clear tray selection so blue highlighting does not stay after dropping
      selectedPhotoIds.clear();
      lastSelectedPhotoIndex = -1;
      updateTraySelectionUI();
    });
  }

  // Toggles
  if (els.toggleCrease) {
    els.toggleCrease.addEventListener('click', () => {
      els.toggleCrease.classList.toggle('active');
      canvasRenderer.toggleCrease(els.toggleCrease.classList.contains('active'));
    });
  }

  if (els.toggleGuides) {
    els.toggleGuides.addEventListener('click', () => {
      els.toggleGuides.classList.toggle('active');
      canvasRenderer.toggleGuides(els.toggleGuides.classList.contains('active'));
    });
  }

  if (els.toggleBleed) {
    els.toggleBleed.addEventListener('click', () => {
      els.toggleBleed.classList.toggle('active');
      albumState.setFullBleed(els.toggleBleed.classList.contains('active'));
    });
  }

  if (els.bgColorPicker) {
    els.bgColorPicker.addEventListener('input', (e) => {
      albumState.setBackgroundColor(e.target.value);
    });
  }

  // Photo Tray Filters
  if (els.trayTabAll) {
    els.trayTabAll.addEventListener('click', () => {
      currentTrayFilter = 'all';
      [els.trayTabAll, els.trayTabUnused, els.trayTabUsed].forEach(t => t?.classList.remove('active'));
      els.trayTabAll.classList.add('active');
      renderPhotoTray();
    });
  }

  if (els.trayTabUnused) {
    els.trayTabUnused.addEventListener('click', () => {
      currentTrayFilter = 'unused';
      [els.trayTabAll, els.trayTabUnused, els.trayTabUsed].forEach(t => t?.classList.remove('active'));
      els.trayTabUnused.classList.add('active');
      renderPhotoTray();
    });
  }

  if (els.trayTabUsed) {
    els.trayTabUsed.addEventListener('click', () => {
      currentTrayFilter = 'used';
      [els.trayTabAll, els.trayTabUnused, els.trayTabUsed].forEach(t => t?.classList.remove('active'));
      els.trayTabUsed.classList.add('active');
      renderPhotoTray();
    });
  }

  // Photo Tray Multi-Selection Actions
  if (els.btnPlaceSelected) {
    els.btnPlaceSelected.addEventListener('click', () => {
      if (selectedPhotoIds.size === 0) return;
      const ids = Array.from(selectedPhotoIds);
      const spread = albumState.getActiveSpread();
      if (spread && spread.photoIds.length === 0) {
        albumState.assignPhotosToSpread(albumState.activeSpreadIndex, ids);
      } else {
        albumState.addPhotosToActiveSpread(ids);
      }
    });
  }

  // Delete Selected Photos from Uploaded Pool
  if (els.btnDeleteSelectedPhotos) {
    els.btnDeleteSelectedPhotos.addEventListener('click', () => {
      if (selectedPhotoIds.size === 0) return;
      const count = selectedPhotoIds.size;
      const ok = confirm(`Are you sure you want to remove ${count} selected photo${count > 1 ? 's' : ''} from the media pool? (If placed on spreads, they will be unassigned).`);
      if (!ok) return;

      const ids = Array.from(selectedPhotoIds);
      albumState.removePhotos(ids);
      selectedPhotoIds.clear();
      lastSelectedPhotoIndex = -1;
      renderPhotoTray();
      renderFilmstrip();
      renderFloatingLayoutsBar();
      canvasRenderer.render();
      showToastNotification(`🗑️ Removed ${count} photo${count > 1 ? 's' : ''} from media pool`);
    });
  }

  if (els.btnClearSelection) {
    els.btnClearSelection.addEventListener('click', () => {
      selectedPhotoIds.clear();
      lastSelectedPhotoIndex = -1;
      updateTraySelectionUI();
    });
  }

  // Photo Order Mode Controller: Sequential (1, 2, 3...) vs Smart Fit
  function updatePhotoOrderUI() {
    const mode = albumState.project.photoOrderMode || 'sequential';
    if (els.labelPhotoOrderMode) {
      els.labelPhotoOrderMode.textContent = mode === 'sequential' ? '🔒 Sequential Order' : '✨ Smart Fit';
    }
    if (els.btnTogglePhotoOrder) {
      els.btnTogglePhotoOrder.title = mode === 'sequential'
        ? 'Current mode: Strict Sequential Order (Photos placed in exact 1,2,3... order). Click to toggle Smart Orientation Matching.'
        : 'Current mode: Smart Orientation Matching. Click to toggle Strict Sequential Order.';
    }
  }

  if (els.btnTogglePhotoOrder) {
    els.btnTogglePhotoOrder.addEventListener('click', () => {
      const currentMode = albumState.project.photoOrderMode || 'sequential';
      const newMode = currentMode === 'sequential' ? 'aspect_match' : 'sequential';
      albumState.setPhotoOrderMode(newMode);
      updatePhotoOrderUI();
      canvasRenderer.render();
      renderFilmstrip();
      renderFloatingLayoutsBar();
      showToastNotification(newMode === 'sequential'
        ? '🔒 Sequential Order: Photos are strictly placed in original 1, 2, 3... sequence'
        : '✨ Smart Fit: Photos are intelligently paired with frames by aspect ratio'
      );
    });
  }

  // Keyboard shortcut to delete selected frames on canvas OR selected photos in tray
  window.addEventListener('keydown', (e) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
      // 1. Delete selected frame(s) on canvas spread
      const hasMultiCanvasSlots = canvasRenderer.selectedSlotIndices && canvasRenderer.selectedSlotIndices.size > 0;
      const hasSingleCanvasSlot = canvasRenderer.selectedSlotIndex !== null && canvasRenderer.selectedSlotIndex !== undefined;

      if (hasMultiCanvasSlots || hasSingleCanvasSlot) {
        e.preventDefault();
        const slotsToDelete = hasMultiCanvasSlots
          ? Array.from(canvasRenderer.selectedSlotIndices)
          : [canvasRenderer.selectedSlotIndex];

        canvasRenderer.selectedSlotIndex = null;
        if (canvasRenderer.selectedSlotIndices) canvasRenderer.selectedSlotIndices.clear();
        if (els.photoFramePreviewBar) els.photoFramePreviewBar.style.display = 'none';

        albumState.deleteFrames(albumState.activeSpreadIndex, slotsToDelete);
        canvasRenderer.requestRender();
        showToastNotification(`🗑️ Deleted ${slotsToDelete.length} frame${slotsToDelete.length > 1 ? 's' : ''} (Photo${slotsToDelete.length > 1 ? 's' : ''} returned to Unused Photos)`);
        return;
      }

      // 2. Delete selected photos in media pool tray
      if (selectedPhotoIds.size > 0) {
        e.preventDefault();
        const count = selectedPhotoIds.size;
        const ok = confirm(`Delete ${count} selected photo${count > 1 ? 's' : ''} from the media pool?`);
        if (ok) {
          albumState.removePhotos(Array.from(selectedPhotoIds));
          selectedPhotoIds.clear();
          lastSelectedPhotoIndex = -1;
          renderPhotoTray();
          renderFilmstrip();
          renderFloatingLayoutsBar();
          canvasRenderer.render();
          showToastNotification(`🗑️ Deleted ${count} photo${count > 1 ? 's' : ''}`);
        }
      }
    }
  });

  // Page Mode (Spread vs Single Page Print)
  if (els.btnModeSpread) {
    els.btnModeSpread.addEventListener('click', () => {
      els.btnModeSpread.classList.add('active');
      els.btnModeSingle?.classList.remove('active');
      if (els.middleMarginGroup) {
        els.middleMarginGroup.style.opacity = '1';
        els.middleMarginGroup.style.pointerEvents = 'auto';
      }
      albumState.setPageMode('spread');
      resizeCanvasStage();
    });
  }

  if (els.btnModeSingle) {
    els.btnModeSingle.addEventListener('click', () => {
      els.btnModeSingle.classList.add('active');
      els.btnModeSpread?.classList.remove('active');
      if (els.middleMarginGroup) {
        els.middleMarginGroup.style.opacity = '0.35';
        els.middleMarginGroup.style.pointerEvents = 'none';
      }
      albumState.setPageMode('single');
      resizeCanvasStage();
    });
  }

  // Orientation Toggles (Toolbar & Floating Spread Bar)
  function handleSetOrientation(orient) {
    albumState.setOrientation(orient);
    resizeCanvasStage();
  }

  if (els.btnOrientationLandscape) {
    els.btnOrientationLandscape.addEventListener('click', () => handleSetOrientation('landscape'));
  }
  if (els.btnOrientationPortrait) {
    els.btnOrientationPortrait.addEventListener('click', () => handleSetOrientation('portrait'));
  }
  if (els.btnFloatingLandscape) {
    els.btnFloatingLandscape.addEventListener('click', () => handleSetOrientation('landscape'));
  }
  if (els.btnFloatingPortrait) {
    els.btnFloatingPortrait.addEventListener('click', () => handleSetOrientation('portrait'));
  }

  // Floating Filter Pills (All / Wide / Tall)
  if (els.floatingFilterPills) {
    els.floatingFilterPills.addEventListener('click', (e) => {
      const pill = e.target.closest('.floating-filter-pill');
      if (!pill) return;
      currentLayoutOrientFilter = pill.dataset.filter || 'all';
      renderFloatingLayoutsBar();
    });
  }

  // ==================== SHA-256 Byte Verification & Advanced Comparison ====================
  async function computeFileSha256(fileOrBlob) {
    try {
      if (!window.crypto || !window.crypto.subtle) return null;
      const arrayBuffer = await fileOrBlob.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      return null;
    }
  }
  window.computeFileSha256 = computeFileSha256;

  // ==================== Instant High-Performance Photo Import ====================
  function importPhotoFiles(filesList, options = {}) {
    if (!filesList || filesList.length === 0) return;
    
    // Accept all valid images including uppercase extensions and mobile camera formats
    const files = Array.from(filesList).filter(file => {
      if (!file) return false;
      if (file.type && file.type.startsWith('image/')) return true;
      const ext = (file.name || '').split('.').pop()?.toLowerCase();
      return ['jpg', 'jpeg', 'png', 'webp', 'avif', 'bmp', 'tif', 'tiff', 'svg', 'gif', 'heic', 'heif'].includes(ext);
    });

    if (files.length === 0) {
      alert('No valid image files found. Please select JPEG, PNG, WEBP, or standard camera image files.');
      return;
    }

    // Naturally sort files by filename (e.g. 1, 2, 10, IMG_001, IMG_002) to strictly maintain folder order
    files.sort((a, b) => {
      const nameA = a.webkitRelativePath || a.name || '';
      const nameB = b.webkitRelativePath || b.name || '';
      return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
    });

    const importedPhotos = [];
    const timestamp = Date.now();

    // Instant synchronous photo creation - 0ms delay!
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const id = 'photo-' + timestamp + '-' + i + '-' + Math.random().toString(36).substr(2, 6);
      const name = (file.name || 'Photo').replace(/\.[^/.]+$/, '');
      const fileName = file.name || (name + '.jpg');
      const filePath = file.path || '';
      const folderName = file.webkitRelativePath ? file.webkitRelativePath.split('/')[0] : '';
      const sourceFolder = filePath ? filePath.substring(0, Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'))) : '';
      if (sourceFolder && !albumState.project.sourceFolderPath) {
        albumState.project.sourceFolderPath = sourceFolder;
        albumState.project.photosFolder = sourceFolder;
      } else if (folderName && !albumState.project.photosFolder) {
        albumState.project.photosFolder = folderName;
      }
      const blobUrl = URL.createObjectURL(file);

      const photoObj = {
        id: id,
        name: name,
        fileName: fileName,
        filePath: filePath,
        fileHash: null,
        fileSize: typeof file.size === 'number' ? file.size : 0,
        lastModified: file.lastModified || null,
        folderName: folderName,
        sourceFolder: sourceFolder || albumState.project.photosFolder || albumState.project.sourceFolderPath || folderName || '',
        src: blobUrl,
        thumbSrc: blobUrl,
        originalSrc: blobUrl,
        originalFile: file,
        width: 1200,
        height: 800,
        aspect: 1.5,
        usageCount: 0
      };

      if (window.crypto && window.crypto.subtle) {
        computeFileSha256(file).then(hash => {
          if (hash) {
            photoObj.fileHash = hash;
          }
        }).catch(() => {});
      }

      importedPhotos.push(photoObj);

      // Register in imagePipeline cache if available
      if (albumState.imagePipeline) {
        albumState.imagePipeline.cache.set(id, {
          data: photoObj,
          displayImg: null,
          originalImg: null
        });
      }
    }

    // Add all imported photos in one single atomic state batch update
    albumState.addPhotos(importedPhotos);

    // Reset filter to 'all' so all newly imported photos are immediately visible
    currentTrayFilter = 'all';
    if (els.trayTabAll) {
      [els.trayTabAll, els.trayTabUnused, els.trayTabUsed].forEach(t => t?.classList.remove('active'));
      els.trayTabAll.classList.add('active');
    }

    // If target spread specified (e.g. dropped directly onto spread canvas), arrange them with auto-layout template
    if (options && options.targetSpreadIndex !== undefined && options.autoLayout && importedPhotos.length > 0) {
      albumState.addPhotosToSpreadWithAutoLayout(options.targetSpreadIndex, importedPhotos.map(p => p.id));
    }

    // Immediate UI and canvas update
    renderPhotoTray();
    renderFilmstrip();
    renderFloatingLayoutsBar();
    canvasRenderer.render();

    showToastNotification(`📸 Loaded ${importedPhotos.length} photo${importedPhotos.length > 1 ? 's' : ''} into studio program media pool!`);

    // Reset file input value so re-importing the same files works reliably
    if (els.photoFileInput) {
      els.photoFileInput.value = '';
    }

    // Asynchronously resolve true naturalWidth, naturalHeight & aspect, and queue fast downsampled thumbnail proxies
    let processedPhotos = 0;
    const totalPhotos = importedPhotos.length;
    setTimelineBackgroundProgress(10, `Loading ${totalPhotos} photo${totalPhotos === 1 ? '' : 's'}...`);

    importedPhotos.forEach(photo => {
      if (albumState.imagePipeline) {
        albumState.imagePipeline.queueThumbnail(photo, (p, thumbSrc) => {
          const thumbImg = document.querySelector(`.photo-thumb[data-photo-id="${p.id}"] img`);
          if (thumbImg && thumbSrc) thumbImg.src = thumbSrc;
        }, canvasRenderer._getImage(photo.src));
      }

      const img = new Image();
      const onPhotoResolved = () => {
        processedPhotos++;
        const pct = Math.min(99, Math.round(10 + (processedPhotos / totalPhotos) * 90));
        setTimelineBackgroundProgress(pct, `Loading photo ${processedPhotos} of ${totalPhotos}...`);
        if (processedPhotos >= totalPhotos) {
          setTimelineBackgroundProgress(100, `Loaded ${totalPhotos} photo${totalPhotos === 1 ? '' : 's'}!`);
        }
      };

      img.onload = () => {
        if (img.naturalWidth && img.naturalHeight) {
          photo.width = img.naturalWidth;
          photo.height = img.naturalHeight;
          photo.aspect = Number((img.naturalWidth / img.naturalHeight).toFixed(3)) || 1.5;
          if (albumState.imagePipeline) {
            const cached = albumState.imagePipeline.cache.get(photo.id);
            if (cached) {
              cached.displayImg = img;
              cached.originalImg = img;
            }
          }
          // Update the aspect badge on the thumbnail in the tray if present
          const thumbBadge = document.querySelector(`.photo-thumb[data-photo-id="${photo.id}"] .photo-badge-aspect`);
          if (thumbBadge) {
            thumbBadge.textContent = photo.aspect < 0.9 ? 'Tall' : photo.aspect > 1.1 ? 'Wide' : 'Sq';
          }
        }
        onPhotoResolved();
      };
      img.onerror = onPhotoResolved;
      img.src = photo.src;
    });
  }

  // Expose globally for instant native file input binding
  window.importPhotoFiles = importPhotoFiles;

  // ==================== Native High-Res Folder Import ====================
  function importFolderPhotosFromBackend(folder, photoList) {
    if (!photoList || photoList.length === 0) return;
    setTimelineBackgroundProgress(20, `Importing ${photoList.length} photos...`);

    albumState.recordSnapshot();
    albumState.project.photosFolder = folder;
    albumState.project.sourceFolderPath = folder;

    const timestamp = Date.now();
    const importedPhotos = photoList.map((p, idx) => {
      const id = 'photo-' + timestamp + '-' + idx + '-' + Math.random().toString(36).substr(2, 6);
      const localUrl = `/api/local_image?path=${encodeURIComponent(p.filePath)}`;
      return {
        id: id,
        name: p.name || p.fileName.replace(/\.[^/.]+$/, ''),
        fileName: p.fileName,
        filePath: p.filePath,
        sourceFolder: folder,
        src: localUrl,
        thumbSrc: localUrl,
        originalSrc: localUrl,
        originalFile: null,
        width: p.width || 1200,
        height: p.height || 800,
        aspect: (p.width && p.height) ? Number((p.width / p.height).toFixed(3)) : 1.5,
        usageCount: 0,
        needsRelink: false,
        filePathVerified: true
      };
    });

    albumState.addPhotos(importedPhotos);

    currentTrayFilter = 'all';
    if (els.trayTabAll) {
      [els.trayTabAll, els.trayTabUnused, els.trayTabUsed].forEach(t => t?.classList.remove('active'));
      els.trayTabAll.classList.add('active');
    }

    renderPhotoTray();
    renderFilmstrip();
    renderFloatingLayoutsBar();
    canvasRenderer.render();

    const folderName = folder.split(/[\\/]/).pop() || folder;
    showToastNotification(`📁 Imported ${importedPhotos.length} photos from "${folderName}" with permanent file paths!`);
    setTimelineBackgroundProgress(100, `Imported ${importedPhotos.length} photos!`);

    // Asynchronously measure naturalWidth, naturalHeight & aspect
    importedPhotos.forEach(photo => {
      const img = new Image();
      img.onload = () => {
        if (img.naturalWidth && img.naturalHeight) {
          photo.width = img.naturalWidth;
          photo.height = img.naturalHeight;
          photo.aspect = Number((img.naturalWidth / img.naturalHeight).toFixed(3)) || 1.5;
          const thumbBadge = document.querySelector(`.photo-thumb[data-photo-id="${photo.id}"] .photo-badge-aspect`);
          if (thumbBadge) {
            thumbBadge.textContent = photo.aspect < 0.9 ? 'Tall' : photo.aspect > 1.1 ? 'Wide' : 'Sq';
          }
        }
      };
      img.src = photo.src;
    });
  }

  async function handleImportFolder() {
    setTimelineBackgroundProgress(10, 'Opening folder picker...');
    // 1. Try native desktop backend API (/api/import_folder)
    try {
      const resp = await fetch('/api/import_folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanPhotos: true })
      });
      if (resp.ok) {
        const res = await resp.json();
        if (res && res.success && res.folder) {
          if (res.photos && res.photos.length > 0) {
            importFolderPhotosFromBackend(res.folder, res.photos);
          } else {
            hideTimelineBackgroundProgress();
            const folderName = res.folder.split(/[\\/]/).pop() || res.folder;
            showToastNotification(`No supported images found in "${folderName}".`);
          }
          return;
        } else if (res && res.cancelled) {
          hideTimelineBackgroundProgress();
          return;
        }
      }
    } catch (err) {
      console.warn('Native folder API unavailable, falling back to browser folder picker:', err);
    }

    // 2. Fallback for browser mode: webkitdirectory folder input
    hideTimelineBackgroundProgress();
    const folderInput = els.folderFileInput || document.getElementById('folderFileInput');
    if (folderInput) {
      folderInput.value = '';
      folderInput.click();
    }
  }

  window.handleImportFolder = handleImportFolder;
  window.importFolderPhotosFromBackend = importFolderPhotosFromBackend;

  // Import Folder Button click
  if (els.btnImportFolder) {
    els.btnImportFolder.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleImportFolder();
    });
  }

  // Folder input change handler (browser fallback)
  const folderInputEl = els.folderFileInput || document.getElementById('folderFileInput');
  if (folderInputEl) {
    folderInputEl.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        importPhotoFiles(e.target.files);
      }
    });
  }

  // Import Photos Button click triggers file input reliably
  if (els.btnImportPhotos) {
    els.btnImportPhotos.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const input = els.photoFileInput || document.getElementById('photoFileInput');
      if (input) {
        input.value = ''; // Reset first to ensure change event fires even on identical file selection
        input.click();
      }
    });
  }

  // File input change handler
  const inputEl = els.photoFileInput || document.getElementById('photoFileInput');
  if (inputEl) {
    inputEl.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        importPhotoFiles(e.target.files);
      }
    });
  }

  // Drag and drop image files from Windows directly onto Photo Tray
  const trayDropZone = els.photoTraySection || document.getElementById('photoTraySection');
  if (trayDropZone) {
    trayDropZone.addEventListener('dragover', (e) => {
      if (e.dataTransfer && e.dataTransfer.types && e.dataTransfer.types.includes('Files')) {
        e.preventDefault();
        trayDropZone.classList.add('tray-drag-over');
      }
    });
    trayDropZone.addEventListener('dragleave', (e) => {
      trayDropZone.classList.remove('tray-drag-over');
    });
    trayDropZone.addEventListener('drop', (e) => {
      trayDropZone.classList.remove('tray-drag-over');
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        e.preventDefault();
        importPhotoFiles(e.dataTransfer.files);
      }
    });
  }

  // Global window drag-and-drop file protection: prevent browser from opening dropped images as new pages
  window.addEventListener('dragover', (e) => {
    if (e.dataTransfer && e.dataTransfer.types && e.dataTransfer.types.includes('Files')) {
      e.preventDefault();
    }
  });
  window.addEventListener('drop', (e) => {
    if (e.dataTransfer && e.dataTransfer.types && e.dataTransfer.types.includes('Files')) {
      e.preventDefault();
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        importPhotoFiles(e.dataTransfer.files);
      }
    }
  });

  // Sample Photos Loader
  async function loadDemoPhotos() {
    setTimelineBackgroundProgress(25);
    if (els.btnLoadSamples) {
      els.btnLoadSamples.disabled = true;
      els.btnLoadSamples.textContent = 'Loading...';
    }
    setTimelineBackgroundProgress(60);
    await SampleLoader.loadStudioSamples(albumState);
    setTimelineBackgroundProgress(100);
    if (els.btnLoadSamples) {
      els.btnLoadSamples.disabled = false;
      els.btnLoadSamples.textContent = 'Load Samples';
    }
  }

  if (els.btnLoadSamples) {
    els.btnLoadSamples.addEventListener('click', loadDemoPhotos);
  }

  // Drawer Filter Tabs
  if (els.drawerFilterBar) {
    els.drawerFilterBar.addEventListener('click', (e) => {
      const tab = e.target.closest('.drawer-filter-tab');
      if (!tab) return;
      currentLayoutOrientFilter = tab.dataset.filter || 'all';
      renderFloatingLayoutsBar();
      openLayoutsCatalog();
    });
  }

  // --- Photo Tray View Modes & Vertical Scroll Down ---
  let isTrayGridView = false;
  let isTrayExpanded = false;

  function setTrayViewMode(isGrid) {
    isTrayGridView = isGrid;
    if (els.photoTrayList) els.photoTrayList.classList.toggle('grid-view', isGrid);
    if (els.photoTraySection) els.photoTraySection.classList.toggle('grid-mode', isGrid);
    if (els.btnTrayStripView) els.btnTrayStripView.classList.toggle('active', !isGrid);
    if (els.btnTrayGridView) els.btnTrayGridView.classList.toggle('active', isGrid);
    resizeCanvasStage();
  }

  if (els.btnTrayStripView) {
    els.btnTrayStripView.addEventListener('click', () => setTrayViewMode(false));
  }
  if (els.btnTrayGridView) {
    els.btnTrayGridView.addEventListener('click', () => setTrayViewMode(true));
  }

  if (els.btnTrayExpand) {
    els.btnTrayExpand.addEventListener('click', () => {
      isTrayExpanded = !isTrayExpanded;
      if (els.photoTraySection) els.photoTraySection.classList.toggle('expanded', isTrayExpanded);
      if (els.trayExpandLabel) els.trayExpandLabel.textContent = isTrayExpanded ? 'Collapse' : 'Expand';
      if (els.btnTrayExpand) els.btnTrayExpand.classList.toggle('active', isTrayExpanded);
      resizeCanvasStage();
      setTimeout(resizeCanvasStage, 260); // After CSS transition finishes
    });
  }

  // Intercept mouse wheel on photo tray list:
  // In strip view: translate vertical mouse wheel down into horizontal scroll
  // In grid view: smooth native vertical scrolling down through rows of photos!
  if (els.photoTrayList) {
    els.photoTrayList.addEventListener('wheel', (e) => {
      if (!isTrayGridView) {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          e.preventDefault();
          els.photoTrayList.scrollLeft += e.deltaY * 1.5;
        }
      }
    }, { passive: false });
  }

  // Toast Notification Overlay
  function showToastNotification(message) {
    let toast = document.getElementById('smartToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'smartToast';
      toast.style.cssText = `
        position: fixed;
        top: 85px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(15, 23, 42, 0.95);
        color: #ffffff;
        padding: 10px 22px;
        border-radius: 20px;
        font-size: 13px;
        font-weight: 600;
        border: 1px solid rgba(56, 189, 248, 0.45);
        box-shadow: 0 10px 28px rgba(0, 0, 0, 0.55);
        z-index: 9999;
        pointer-events: none;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: opacity 0.3s ease, transform 0.3s ease;
      `;
      document.body.appendChild(toast);
    }
    toast.innerHTML = message;
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(-10px)';
    }, 3500);
  }
  window.showToastNotification = showToastNotification;

  // --- Auto-Build Photobook Workflow ---
  async function runAutoBuildWorkflow(customOptions = {}) {
    if (albumState.project.photos.length === 0) {
      const load = confirm('No photos imported yet. Would you like to load the Rafia Studio sample photos and auto-build your album now?');
      if (load) {
        await loadDemoPhotos();
      } else {
        if (els.photoFileInput) els.photoFileInput.click();
        return;
      }
    }

    const mode = customOptions.mode || (els.autoBuildSpreadMode ? els.autoBuildSpreadMode.value : 'auto_density');
    let targetSpreadCount = undefined;

    const scope = customOptions.scope || (els.autoBuildPhotoScope ? els.autoBuildPhotoScope.value : 'all');
    let selectedIds = null;
    if (scope === 'selected' && selectedPhotoIds.size > 0) {
      selectedIds = Array.from(selectedPhotoIds);
    }
    const totalPhotosCount = selectedIds ? selectedIds.length : albumState.project.photos.length;

    if (customOptions.targetSpreadCount) {
      targetSpreadCount = customOptions.targetSpreadCount;
    } else if (mode === 'current_spreads') {
      const currentCount = albumState.project.spreads.length || 1;
      // If current spreads is 1 (blank canvas) or would overload spreads (> 8 photos/spread):
      if (currentCount <= 1 || (totalPhotosCount / currentCount) > 8) {
        targetSpreadCount = Math.max(1, Math.ceil(totalPhotosCount / 4));
      } else {
        targetSpreadCount = currentCount;
      }
    } else if (mode === 'custom_spreads') {
      targetSpreadCount = els.autoBuildTargetSpreadCount ? parseInt(els.autoBuildTargetSpreadCount.value, 10) || 20 : 20;
    } else if (mode === 'auto_density') {
      targetSpreadCount = undefined;
    }

    const minP = customOptions.minPhotosPerSpread !== undefined
      ? customOptions.minPhotosPerSpread
      : (els.autoBuildMinPhotos ? parseInt(els.autoBuildMinPhotos.value, 10) || 2 : 2);
    const maxP = customOptions.maxPhotosPerSpread !== undefined
      ? customOptions.maxPhotosPerSpread
      : (els.autoBuildMaxPhotos ? parseInt(els.autoBuildMaxPhotos.value, 10) || 8 : 8);

    const timelineBadge = document.getElementById('timelineAutoBuildBadge');
    const timelineText = document.getElementById('timelineAutoBuildText');
    if (timelineBadge) {
      timelineBadge.style.display = 'inline-flex';
      if (timelineText) timelineText.textContent = 'Auto-building: 0%';
    }

    const count = albumState.autoBuildPhotobook({
      targetSpreadCount: targetSpreadCount,
      minPhotosPerSpread: minP,
      maxPhotosPerSpread: maxP,
      selectedPhotoIds: selectedIds
    }, (curr, total, pct) => {
      setTimelineBackgroundProgress(pct);
      if (timelineText) {
        timelineText.textContent = `Auto-building: ${pct}% (Spread ${curr}/${total})`;
      }
    });

    if (els.modalAutoBuild) els.modalAutoBuild.classList.remove('open');

    if (count > 0) {
      setTimelineBackgroundProgress(100);
      if (timelineText) timelineText.textContent = 'Auto-build Complete: 100%';
      setTimeout(() => {
        if (timelineBadge) timelineBadge.style.display = 'none';
      }, 1500);
      const totalPhotosUsed = selectedIds ? selectedIds.length : albumState.project.photos.length;
      showToastNotification(`⚡ Auto-built photobook: ${count} spreads created with ${totalPhotosUsed} photos across rich multi-image layouts!`);
      albumState.setActiveSpread(0);
      resizeCanvasStage();
      renderPhotoTray();
      renderFilmstrip();
      renderFloatingLayoutsBar();
      updateHUD();
      canvasRenderer.requestRender();
    } else {
      if (timelineBadge) timelineBadge.style.display = 'none';
      alert('Could not auto-build album. Please ensure photos are available.');
    }
  }

  // Auto-Build Modal
  if (els.btnAutoBuild) {
    els.btnAutoBuild.addEventListener('click', () => {
      if (els.modalAutoBuild) {
        if (els.autoBuildSpreadMode && els.autoBuildSpreadMode.value === 'current_spreads') {
          const currentCount = albumState.project.spreads.length || 10;
          const opt = els.autoBuildSpreadMode.querySelector('option[value="current_spreads"]');
          if (opt) opt.textContent = `Fit all photos into current project spreads (${currentCount} Spreads)`;
        }
        els.modalAutoBuild.classList.add('open');
      }
    });
  }

  if (els.autoBuildSpreadMode) {
    els.autoBuildSpreadMode.addEventListener('change', () => {
      const val = els.autoBuildSpreadMode.value;
      if (els.containerAutoBuildTargetSpreads) {
        els.containerAutoBuildTargetSpreads.style.display = val === 'custom_spreads' ? 'block' : 'none';
      }
      if (els.containerAutoBuildDensitySettings) {
        els.containerAutoBuildDensitySettings.style.display = val === 'auto_density' ? 'block' : 'none';
      }
    });
  }

  if (els.btnCloseAutoBuild) els.btnCloseAutoBuild.addEventListener('click', () => els.modalAutoBuild?.classList.remove('open'));
  if (els.btnCancelAutoBuild) els.btnCancelAutoBuild.addEventListener('click', () => els.modalAutoBuild?.classList.remove('open'));
  if (els.btnRunAutoBuild) els.btnRunAutoBuild.addEventListener('click', () => runAutoBuildWorkflow());

  // Quick 1-Click Auto-Build Button (in Photo Tray Header)
  if (els.btnQuickAutoBuild) {
    els.btnQuickAutoBuild.addEventListener('click', () => runAutoBuildWorkflow());
  }

  // ==================== Create New Project Modal & Setup Flow ====================
  const modalNewProject = document.getElementById('modalNewProject');
  const btnCloseNewProject = document.getElementById('btnCloseNewProject');
  const btnCancelNewProject = document.getElementById('btnCancelNewProject');
  const btnConfirmCreateProject = document.getElementById('btnConfirmCreateProject');
  const btnSplashCreateNow = document.getElementById('btnSplashCreateNow');
  const btnNewProjectToolbar = document.getElementById('btnNewProjectToolbar');
  const inputNewProjectName = document.getElementById('inputNewProjectName');
  const inputNewProjectSavePath = document.getElementById('inputNewProjectSavePath');
  const btnBrowseNewProjectSave = document.getElementById('btnBrowseNewProjectSave');
  const selectNewProjectSize = document.getElementById('selectNewProjectSize');
  const inputNewProjectSpreadCount = document.getElementById('inputNewProjectSpreadCount');
  const labelNewProjectSpreadsInfo = document.getElementById('labelNewProjectSpreadsInfo');
  const cardModeSpread = document.getElementById('cardModeSpread');
  const cardModeSingle = document.getElementById('cardModeSingle');
  const newProjectSaveHint = document.getElementById('newProjectSaveHint');

  let selectedSaveFileHandle = null;

  // Auto-sync filename when project title changes
  if (inputNewProjectName && inputNewProjectSavePath) {
    inputNewProjectName.addEventListener('input', () => {
      if (!selectedSaveFileHandle) {
        const cleanName = inputNewProjectName.value.trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '_') || 'My_Photobook';
        inputNewProjectSavePath.value = `${cleanName}.smartease.json`;
      }
    });
  }

  // Browse save location (native file picker if available)
  if (btnBrowseNewProjectSave) {
    btnBrowseNewProjectSave.addEventListener('click', async () => {
      const currentName = inputNewProjectName?.value.trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '_') || 'My_Photobook';
      const defaultFilename = `${currentName}.smartease.json`;
      if (window.showSaveFilePicker) {
        try {
          const handle = await window.showSaveFilePicker({
            suggestedName: defaultFilename,
            types: [{
              description: 'Smart Ease Photobook Project (*.smartease.json)',
              accept: { 'application/json': ['.json', '.smartease.json'] }
            }]
          });
          selectedSaveFileHandle = handle;
          if (inputNewProjectSavePath) inputNewProjectSavePath.value = handle.name;
          if (newProjectSaveHint) {
            newProjectSaveHint.innerHTML = `<span style="color: #10b981; font-weight: 600;">✓ Save target linked to: ${handle.name}</span>`;
          }
        } catch (err) {
          if (err.name !== 'AbortError') console.warn('File picker error:', err);
        }
      } else {
        const chosen = prompt('Enter save filename or destination path for project:', inputNewProjectSavePath?.value || defaultFilename);
        if (chosen && chosen.trim() && inputNewProjectSavePath) {
          inputNewProjectSavePath.value = chosen.trim();
        }
      }
    });
  }

  function updateSpreadsInfo() {
    const count = Math.max(1, parseInt(inputNewProjectSpreadCount?.value) || 10);
    const mode = document.querySelector('input[name="newProjectPageMode"]:checked')?.value || 'spread';
    if (labelNewProjectSpreadsInfo) {
      if (mode === 'spread') {
        labelNewProjectSpreadsInfo.textContent = `${count} Spreads (${count * 2} Pages)`;
      } else {
        labelNewProjectSpreadsInfo.textContent = `${count} Single Pages`;
      }
    }
    // Update active preset buttons
    document.querySelectorAll('.spreads-preset-bar .btn-spread-preset').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.count) === count);
    });
  }

  function adjustNewProjectSpreadCount(delta) {
    if (!inputNewProjectSpreadCount) return;
    const current = parseInt(inputNewProjectSpreadCount.value, 10) || 10;
    const updated = Math.max(1, Math.min(100, current + delta));
    inputNewProjectSpreadCount.value = updated;
    updateSpreadsInfo();
  }

  const btnSpreadCountMinus10 = document.getElementById('btnSpreadCountMinus10');
  const btnSpreadCountMinus1 = document.getElementById('btnSpreadCountMinus1');
  const btnSpreadCountPlus1 = document.getElementById('btnSpreadCountPlus1');
  const btnSpreadCountPlus10 = document.getElementById('btnSpreadCountPlus10');

  if (btnSpreadCountMinus10) btnSpreadCountMinus10.addEventListener('click', () => adjustNewProjectSpreadCount(-10));
  if (btnSpreadCountMinus1) btnSpreadCountMinus1.addEventListener('click', () => adjustNewProjectSpreadCount(-1));
  if (btnSpreadCountPlus1) btnSpreadCountPlus1.addEventListener('click', () => adjustNewProjectSpreadCount(1));
  if (btnSpreadCountPlus10) btnSpreadCountPlus10.addEventListener('click', () => adjustNewProjectSpreadCount(10));

  function adjustAutoBuildSpreadCount(delta) {
    const input = document.getElementById('autoBuildTargetSpreadCount');
    if (!input) return;
    const current = parseInt(input.value, 10) || 20;
    input.value = Math.max(1, Math.min(100, current + delta));
  }

  const btnAutoBuildMinus10 = document.getElementById('btnAutoBuildMinus10');
  const btnAutoBuildMinus1 = document.getElementById('btnAutoBuildMinus1');
  const btnAutoBuildPlus1 = document.getElementById('btnAutoBuildPlus1');
  const btnAutoBuildPlus10 = document.getElementById('btnAutoBuildPlus10');

  if (btnAutoBuildMinus10) btnAutoBuildMinus10.addEventListener('click', () => adjustAutoBuildSpreadCount(-10));
  if (btnAutoBuildMinus1) btnAutoBuildMinus1.addEventListener('click', () => adjustAutoBuildSpreadCount(-1));
  if (btnAutoBuildPlus1) btnAutoBuildPlus1.addEventListener('click', () => adjustAutoBuildSpreadCount(1));
  if (btnAutoBuildPlus10) btnAutoBuildPlus10.addEventListener('click', () => adjustAutoBuildSpreadCount(10));

  if (inputNewProjectSpreadCount) {
    inputNewProjectSpreadCount.addEventListener('input', updateSpreadsInfo);
  }

  document.querySelectorAll('.spreads-preset-bar .btn-spread-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      const count = parseInt(btn.dataset.count) || 10;
      if (inputNewProjectSpreadCount) {
        inputNewProjectSpreadCount.value = count;
        updateSpreadsInfo();
      }
    });
  });

  // Page mode radio cards
  if (cardModeSpread && cardModeSingle) {
    cardModeSpread.addEventListener('click', () => {
      cardModeSpread.classList.add('active');
      cardModeSingle.classList.remove('active');
      const radio = cardModeSpread.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
      updateSpreadsInfo();
    });

    cardModeSingle.addEventListener('click', () => {
      cardModeSingle.classList.add('active');
      cardModeSpread.classList.remove('active');
      const radio = cardModeSingle.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
      updateSpreadsInfo();
    });
  }

  const btnChooseProjectFolder = document.getElementById('btnChooseProjectFolder');
  const inputNewProjectFolderPath = document.getElementById('inputNewProjectFolderPath');
  const inputNewProjectFolderHidden = document.getElementById('inputNewProjectFolderHidden');
  const inputNewProjectFilesHidden = document.getElementById('inputNewProjectFilesHidden');
  const newProjectFolderPreviewStrip = document.getElementById('newProjectFolderPreviewStrip');
  const chkAutoDistributePhotos = document.getElementById('chkAutoDistributePhotos');
  const containerAutoDistribute = document.getElementById('containerAutoDistribute');
  const labelNewProjectFolderBadge = document.getElementById('labelNewProjectFolderBadge');

  let stagedFolderFiles = [];
  let stagedFolderName = '';

  function handleFolderSelected(folderName, files) {
    const imageFiles = Array.from(files).filter(file =>
      file.type.startsWith('image/') || /\.(jpe?g|png|webp|avif|bmp|tiff?|heic)$/i.test(file.name)
    );

    if (imageFiles.length === 0) {
      alert('No image files found in the selected folder. Please choose a folder containing JPG, PNG, or other image files.');
      return;
    }

    stagedFolderFiles = imageFiles;
    stagedFolderName = folderName || 'Selected Folder';

    if (inputNewProjectFolderPath) {
      inputNewProjectFolderPath.value = `${stagedFolderName} (${imageFiles.length} photos)`;
    }

    if (labelNewProjectFolderBadge) {
      labelNewProjectFolderBadge.innerHTML = `<span style="color: #10b981; font-weight: 700;">✓ ${imageFiles.length} photos ready</span>`;
    }

    // Auto-update project name if it was default
    if (inputNewProjectName && (!inputNewProjectName.value || inputNewProjectName.value === 'Wedding Album' || inputNewProjectName.value === 'Smart Ease Photobook')) {
      const cleanFolderName = stagedFolderName.replace(/[_\-]+/g, ' ').trim();
      if (cleanFolderName && cleanFolderName !== 'Selected Folder') {
        inputNewProjectName.value = cleanFolderName;
        if (inputNewProjectSavePath && !selectedSaveFileHandle) {
          inputNewProjectSavePath.value = `${cleanFolderName.replace(/\s+/g, '_')}.smartease.json`;
        }
      }
    }

    // Recommend optimal spread count based on photos (approx 3-4 photos per spread)
    const suggestedSpreads = Math.max(5, Math.min(50, Math.ceil(imageFiles.length / 3)));
    if (inputNewProjectSpreadCount) {
      inputNewProjectSpreadCount.value = suggestedSpreads;
      updateSpreadsInfo();
    }

    // Render mini preview thumbnails (up to 8)
    if (newProjectFolderPreviewStrip) {
      newProjectFolderPreviewStrip.innerHTML = '';
      newProjectFolderPreviewStrip.style.display = 'flex';
      const sampleSlice = imageFiles.slice(0, 8);
      sampleSlice.forEach(file => {
        const url = URL.createObjectURL(file);
        const img = document.createElement('img');
        img.src = url;
        img.style.width = '44px';
        img.style.height = '44px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '4px';
        img.style.border = '1px solid rgba(255, 255, 255, 0.2)';
        newProjectFolderPreviewStrip.appendChild(img);
      });
      if (imageFiles.length > 8) {
        const moreBadge = document.createElement('div');
        moreBadge.style.width = '44px';
        moreBadge.style.height = '44px';
        moreBadge.style.borderRadius = '4px';
        moreBadge.style.background = 'rgba(255, 255, 255, 0.1)';
        moreBadge.style.display = 'flex';
        moreBadge.style.alignItems = 'center';
        moreBadge.style.justifyContent = 'center';
        moreBadge.style.fontSize = '11px';
        moreBadge.style.fontWeight = '700';
        moreBadge.style.color = '#38bdf8';
        moreBadge.textContent = `+${imageFiles.length - 8}`;
        newProjectFolderPreviewStrip.appendChild(moreBadge);
      }
    }

    // Show auto-distribute checkbox
    if (containerAutoDistribute) {
      containerAutoDistribute.style.display = 'flex';
    }
  }

  async function triggerFolderPicker() {
    if (window.showDirectoryPicker) {
      try {
        const dirHandle = await window.showDirectoryPicker();
        const imageFiles = [];
        for await (const entry of dirHandle.values()) {
          if (entry.kind === 'file') {
            const file = await entry.getFile();
            if (file.type.startsWith('image/') || /\.(jpe?g|png|webp|avif|bmp|tiff?|heic)$/i.test(file.name)) {
              imageFiles.push(file);
            }
          }
        }
        handleFolderSelected(dirHandle.name, imageFiles);
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.warn('showDirectoryPicker failed, falling back to input:', err);
      }
    }
    // Fallback to file input
    if (inputNewProjectFolderHidden) {
      inputNewProjectFolderHidden.value = '';
      inputNewProjectFolderHidden.click();
    }
  }

  if (btnChooseProjectFolder) {
    btnChooseProjectFolder.addEventListener('click', triggerFolderPicker);
  }
  if (inputNewProjectFolderPath) {
    inputNewProjectFolderPath.addEventListener('click', triggerFolderPicker);
  }
  if (inputNewProjectFolderHidden) {
    inputNewProjectFolderHidden.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        const files = Array.from(e.target.files);
        const folderName = files[0]?.webkitRelativePath ? files[0].webkitRelativePath.split('/')[0] : 'Selected Folder';
        handleFolderSelected(folderName, files);
      }
    });
  }

  // ==================== Unsaved Changes Confirmation Modal ====================
  const modalUnsavedPrompt = document.getElementById('modalUnsavedPrompt');
  const btnCloseUnsavedPrompt = document.getElementById('btnCloseUnsavedPrompt');
  const btnPromptCancel = document.getElementById('btnPromptCancel');
  const btnPromptDontSave = document.getElementById('btnPromptDontSave');
  const btnPromptSave = document.getElementById('btnPromptSave');
  const unsavedProjectTitle = document.getElementById('unsavedProjectTitle');

  function showUnsavedPrompt() {
    if (unsavedProjectTitle) {
      unsavedProjectTitle.textContent = `"${albumState.project.title || 'Current Project'}"`;
    }
    if (modalUnsavedPrompt) {
      modalUnsavedPrompt.classList.add('open', 'active');
    }
  }

  function closeUnsavedPrompt() {
    if (modalUnsavedPrompt) {
      modalUnsavedPrompt.classList.remove('open', 'active');
    }
  }

  if (btnPromptCancel) {
    btnPromptCancel.addEventListener('click', closeUnsavedPrompt);
  }
  if (btnCloseUnsavedPrompt) {
    btnCloseUnsavedPrompt.addEventListener('click', closeUnsavedPrompt);
  }
  if (modalUnsavedPrompt) {
    modalUnsavedPrompt.addEventListener('click', (e) => {
      if (e.target === modalUnsavedPrompt) closeUnsavedPrompt();
    });
  }

  if (btnPromptDontSave) {
    btnPromptDontSave.addEventListener('click', () => {
      closeUnsavedPrompt();
      openNewProjectModal();
    });
  }

  if (btnPromptSave) {
    btnPromptSave.addEventListener('click', async () => {
      closeUnsavedPrompt();
      await saveCurrentProject(false);
      openNewProjectModal();
    });
  }

  // ==================== Application Close / Exit Confirmation Modal ====================
  const modalCloseAppPrompt = document.getElementById('modalCloseAppPrompt');
  const btnCloseCloseAppModal = document.getElementById('btnCloseCloseAppModal');
  const btnCloseAppCancel = document.getElementById('btnCloseAppCancel');
  const btnCloseAppDontSave = document.getElementById('btnCloseAppDontSave');
  const btnCloseAppSave = document.getElementById('btnCloseAppSave');
  const btnCloseAppSaveAs = document.getElementById('btnCloseAppSaveAs');
  const closeAppModalTitle = document.getElementById('closeAppModalTitle');
  const closeAppPromptHeading = document.getElementById('closeAppPromptHeading');
  const closeAppPromptMessage = document.getElementById('closeAppPromptMessage');
  const btnProfileExitApp = document.getElementById('btnProfileExitApp');

  window._isForceExiting = false;

  async function exitApplication() {
    window._isForceExiting = true;
    try {
      if (typeof window.stopHardDiskConnectionWatcher === 'function') {
        window.stopHardDiskConnectionWatcher();
      }
      if (window.autoRelinkWatcherInterval) {
        clearInterval(window.autoRelinkWatcherInterval);
        window.autoRelinkWatcherInterval = null;
      }
      if (window.relinkAbortController) {
        window.relinkAbortController.abort();
      }
    } catch (e) {}
    try {
      navigator.sendBeacon('/api/exit_app', '{}');
    } catch (e) {}
    try {
      await fetch('/api/exit_app', { method: 'POST' });
    } catch (e) {}
    try {
      window.close();
    } catch (e) {}
  }

  function promptAppCloseSaveDialog() {
    const hasPhotos = albumState.project.photos && albumState.project.photos.length > 0;
    const hasSpreads = albumState.project.spreads && albumState.project.spreads.length > 1;
    const hasDrawFrames = albumState.project.spreads?.some(s => s.slots?.length > 0 || (s.layout?.rects?.length > 0 && s.layout.id !== 'empty'));
    const isDirty = albumState.isDirty || (albumState.undoStack && albumState.undoStack.length > 0);

    // If untouched blank canvas, exit immediately
    if (!hasPhotos && !hasSpreads && !hasDrawFrames && !isDirty) {
      exitApplication();
      return;
    }

    const hasBeenSaved = Boolean(albumState.project.hasBeenSaved || albumState.project.saveFileHandle || albumState.project.savePath);
    const projTitle = albumState.project.title || 'Photobook Project';

    if (hasBeenSaved) {
      // Case 1: Project HAD been saved already -> ask to UPDATE
      if (closeAppModalTitle) closeAppModalTitle.textContent = 'Update Project Before Closing?';
      if (closeAppPromptHeading) closeAppPromptHeading.innerHTML = `Do you want to update and save changes to <span style="color: #38bdf8;">"${projTitle}"</span>?`;
      if (closeAppPromptMessage) closeAppPromptMessage.textContent = `Your project was previously saved. Clicking "Save & Update" will update your project file in-place so all recent changes are preserved.`;
      if (btnCloseAppSave) {
        btnCloseAppSave.textContent = 'Save & Update';
        btnCloseAppSave.title = 'Save changes to current project file and exit';
      }
      if (btnCloseAppSaveAs) {
        btnCloseAppSaveAs.style.display = 'inline-flex';
        btnCloseAppSaveAs.textContent = 'Save As New...';
      }
    } else {
      // Case 2: Project had NOT been saved yet -> ask to SAVE AS
      if (closeAppModalTitle) closeAppModalTitle.textContent = 'Save Project Before Closing?';
      if (closeAppPromptHeading) closeAppPromptHeading.innerHTML = `You have not saved <span style="color: #38bdf8;">"${projTitle}"</span> yet.`;
      if (closeAppPromptMessage) closeAppPromptMessage.textContent = `Do you want to save this photobook project to your computer before closing? If you exit now, your layouts and photos will be lost.`;
      if (btnCloseAppSave) {
        btnCloseAppSave.textContent = 'Save Project As...';
        btnCloseAppSave.title = 'Choose where to save your new project file and exit';
      }
      if (btnCloseAppSaveAs) {
        btnCloseAppSaveAs.style.display = 'none';
      }
    }

    if (modalCloseAppPrompt) {
      modalCloseAppPrompt.classList.add('open', 'active');
    }
  }

  window.promptAppCloseSaveDialog = promptAppCloseSaveDialog;

  function closeCloseAppModal() {
    if (modalCloseAppPrompt) {
      modalCloseAppPrompt.classList.remove('open', 'active');
    }
  }

  if (btnCloseCloseAppModal) btnCloseCloseAppModal.addEventListener('click', closeCloseAppModal);
  if (btnCloseAppCancel) btnCloseAppCancel.addEventListener('click', closeCloseAppModal);

  if (btnCloseAppDontSave) {
    btnCloseAppDontSave.addEventListener('click', () => {
      closeCloseAppModal();
      exitApplication();
    });
  }

  if (btnCloseAppSave) {
    btnCloseAppSave.addEventListener('click', async () => {
      const hasBeenSaved = Boolean(albumState.project.hasBeenSaved || albumState.project.saveFileHandle || albumState.project.savePath);
      closeCloseAppModal();
      const saved = await saveCurrentProject(!hasBeenSaved);
      if (saved) {
        exitApplication();
      }
    });
  }

  if (btnCloseAppSaveAs) {
    btnCloseAppSaveAs.addEventListener('click', async () => {
      closeCloseAppModal();
      const saved = await saveCurrentProject(true);
      if (saved) {
        exitApplication();
      }
    });
  }

  if (btnProfileExitApp) {
    btnProfileExitApp.addEventListener('click', () => {
      const dropdown = document.getElementById('profileDropdownCard');
      if (dropdown) dropdown.classList.remove('open');
      promptAppCloseSaveDialog();
    });
  }

  window.addEventListener('beforeunload', () => {
    try {
      if (typeof window.stopHardDiskConnectionWatcher === 'function') {
        window.stopHardDiskConnectionWatcher();
      }
      if (window.autoRelinkWatcherInterval) {
        clearInterval(window.autoRelinkWatcherInterval);
      }
      if (window.relinkAbortController) {
        window.relinkAbortController.abort();
      }
    } catch (err) {}
    try {
      navigator.sendBeacon('/api/exit_app', '{}');
    } catch (err) {}
  });

  function handleNewProjectRequest() {
    const hasContent = (albumState.project.photos && albumState.project.photos.length > 0) ||
      (albumState.project.spreads && albumState.project.spreads.length > 1) ||
      (albumState.undoStack && albumState.undoStack.length > 0);

    if (hasContent) {
      showUnsavedPrompt();
    } else {
      openNewProjectModal();
    }
  }

  function openNewProjectModal() {
    if (!modalNewProject) return;
    if (typeof dismissSplashScreen === 'function') dismissSplashScreen();
    dockContainers.forEach(d => d.container?.classList.remove('open'));

    // Populate current defaults
    if (inputNewProjectName) inputNewProjectName.value = 'Wedding Album';
    if (inputNewProjectSavePath) inputNewProjectSavePath.value = 'Wedding_Album.smartease.json';
    if (inputNewProjectSpreadCount) inputNewProjectSpreadCount.value = 10;
    if (selectNewProjectSize) selectNewProjectSize.value = '12x12';
    if (cardModeSpread) cardModeSpread.click();
    selectedSaveFileHandle = null;

    // Reset folder states
    stagedFolderFiles = [];
    stagedFolderName = '';
    if (inputNewProjectFolderPath) inputNewProjectFolderPath.value = '';
    if (labelNewProjectFolderBadge) labelNewProjectFolderBadge.textContent = 'Optional (Can also import later)';
    if (newProjectFolderPreviewStrip) {
      newProjectFolderPreviewStrip.innerHTML = '';
      newProjectFolderPreviewStrip.style.display = 'none';
    }
    if (containerAutoDistribute) containerAutoDistribute.style.display = 'none';

    if (newProjectSaveHint) {
      newProjectSaveHint.innerHTML = '<span>Project file will be saved and linked directly to this location.</span>';
    }
    updateSpreadsInfo();
    modalNewProject.classList.add('open', 'active');
    setTimeout(() => inputNewProjectName?.focus(), 50);
  }

  window.openNewProjectModalFromSplash = function() {
    if (typeof dismissSplashScreen === 'function') dismissSplashScreen();
    handleNewProjectRequest();
  };

  function closeNewProjectModal() {
    if (modalNewProject) modalNewProject.classList.remove('open', 'active');
  }

  if (btnCloseNewProject) btnCloseNewProject.addEventListener('click', closeNewProjectModal);
  if (btnCancelNewProject) btnCancelNewProject.addEventListener('click', closeNewProjectModal);
  if (modalNewProject) {
    modalNewProject.addEventListener('click', (e) => {
      if (e.target === modalNewProject) closeNewProjectModal();
    });
  }

  // Trigger buttons (Create Project & New Project both do the exact same thing)
  if (els.btnNewProject) {
    els.btnNewProject.addEventListener('click', handleNewProjectRequest);
  }
  const btnCreateProject = document.getElementById('btnCreateProject');
  if (btnCreateProject) {
    btnCreateProject.addEventListener('click', handleNewProjectRequest);
  }
  if (btnSplashCreateNow) {
    btnSplashCreateNow.addEventListener('click', handleNewProjectRequest);
  }
  if (btnNewProjectToolbar) {
    btnNewProjectToolbar.addEventListener('click', handleNewProjectRequest);
  }

  // Confirm and Create
  if (btnConfirmCreateProject) {
    btnConfirmCreateProject.addEventListener('click', async () => {
      const projTitle = (inputNewProjectName?.value || 'Smart Ease Photobook').trim();
      const savePath = (inputNewProjectSavePath?.value || `${projTitle.replace(/\s+/g, '_')}.smartease.json`).trim();
      const sizeId = selectNewProjectSize?.value || '12x12';
      const spreadCount = Math.max(1, Math.min(100, parseInt(inputNewProjectSpreadCount?.value) || 10));
      const pageMode = document.querySelector('input[name="newProjectPageMode"]:checked')?.value || 'spread';

      albumState.newProject({
        title: projTitle,
        sizeId: sizeId,
        pageMode: pageMode,
        spreadCount: spreadCount,
        savePath: savePath,
        saveFileHandle: selectedSaveFileHandle
      });

      // Synchronize toolbar controls
      if (els.albumSizeSelect) els.albumSizeSelect.value = sizeId;
      if (pageMode === 'spread') {
        els.btnModeSpread?.classList.add('active');
        els.btnModeSingle?.classList.remove('active');
      } else {
        els.btnModeSingle?.classList.add('active');
        els.btnModeSpread?.classList.remove('active');
      }

      selectedPhotoIds.clear();
      lastSelectedPhotoIndex = -1;

      // Import photos if folder was chosen
      if (stagedFolderFiles && stagedFolderFiles.length > 0) {
        importPhotoFiles(stagedFolderFiles);

        // Auto-distribute across spreads if checked
        const autoDistribute = chkAutoDistributePhotos ? chkAutoDistributePhotos.checked : true;
        if (autoDistribute) {
          albumState.autoBuildPhotobook({
            targetSpreadCount: spreadCount,
            scope: 'all'
          });
        }
      }

      resizeCanvasStage();
      updateHUD();
      updateAppBookTitle(projTitle);
      renderFilmstrip();
      renderPhotoTray();
      renderFloatingLayoutsBar();
      updateUndoRedoButtons();

      closeNewProjectModal();

      // If user selected a file handle via Browse..., immediately save initial project
      if (selectedSaveFileHandle && window.showSaveFilePicker) {
        try {
          const json = albumState.exportProject();
          const writable = await selectedSaveFileHandle.createWritable();
          await writable.write(json);
          await writable.close();
        } catch (e) {
          console.warn('Initial project write error:', e);
        }
      }

      const photoMsg = stagedFolderFiles.length > 0 ? ` and ${stagedFolderFiles.length} photos loaded` : '';
      showToastNotification(`✨ Created "${projTitle}" with ${spreadCount} spreads${photoMsg} ready to design!`);
    });
  }

  // Project Save & Save As Handlers (Ctrl + S updates in-place limitlessly without creating other copies, just like Photoshop)
  async function saveCurrentProject(asNew = false, interactive = true) {
    if (asNew) {
      const currentTitle = albumState.project.title || 'Smart Ease Album';
      const newTitle = prompt('Save Project As - Enter a new name for your photobook project:', currentTitle);
      if (!newTitle || !newTitle.trim()) return false;
      albumState.project.title = newTitle.trim();
      albumState.project.saveFileHandle = null;
      albumState.project.savePath = '';
      updateHUD();
    }

    albumState.project.lastActiveSpreadIndex = albumState.activeSpreadIndex;
    const json = albumState.exportProject();
    try {
      localStorage.setItem('smartEase_lastSavedProject', json);
      if (albumState.project.id) {
        localStorage.setItem(`smartEase_proj_${albumState.project.id}`, json);
      }
    } catch (e) {}

    // When asNew is false (e.g. Ctrl + S, Save button, background auto-save):
    // Like in Photoshop, ALWAYS update the saved file in-place! Never prompt or save a new file!
    if (!asNew) {
      let targetPath = albumState.project.savePath;
      if (!targetPath || targetPath.includes('blob:')) {
        const safeTitle = (albumState.project.title || 'SmartEase_Project')
          .replace(/[^\w\s-]/g, '')
          .trim()
          .replace(/\s+/g, '_') || 'SmartEase_Project';
        targetPath = `${safeTitle}.smartease.json`;
      }

      try {
        const resp = await fetch('/api/save_project', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filePath: targetPath, content: json })
        });
        const res = await resp.json();
        if (res && res.success) {
          if (res.filePath) albumState.project.savePath = res.filePath;
          if (res.pathsFile) albumState.project.pathsFile = res.pathsFile;
          albumState.project.hasBeenSaved = true;
          albumState.isDirty = false;
          if (interactive) showToastNotification(`✓ Saved "${albumState.project.title}" & paths registry in-place!`);
          return true;
        }
      } catch (err) {}

      // Fallback for browser file handle
      if (albumState.project.saveFileHandle && window.showSaveFilePicker) {
        try {
          const writable = await albumState.project.saveFileHandle.createWritable();
          await writable.write(json);
          await writable.close();
          albumState.project.hasBeenSaved = true;
          albumState.isDirty = false;
          if (interactive) showToastNotification(`✓ Updated "${albumState.project.title}" in-place!`);
          return true;
        } catch (err) {}
      }

      if (!interactive) return false;
    }

    // Desktop Native Save File Dialog ONLY for explicit Save As (asNew = true)
    try {
      const defaultFilename = `${albumState.project.title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_')}.smartease.json`;
      const resp = await fetch('/api/save_project_dialog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestedName: defaultFilename, content: json })
      });
      const res = await resp.json();
      if (res && res.success && res.filePath) {
        albumState.project.savePath = res.filePath;
        if (res.pathsFile) albumState.project.pathsFile = res.pathsFile;
        albumState.project.hasBeenSaved = true;
        albumState.isDirty = false;
        showToastNotification(`💾 Saved "${albumState.project.title}" & paths registry (Ctrl+S updates in place)`);
        return true;
      }
    } catch (err) {}

    // 4. Browser File System Access API
    if (window.showSaveFilePicker) {
      try {
        const defaultFilename = `${albumState.project.title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_')}.smartease.json`;
        const handle = await window.showSaveFilePicker({
          suggestedName: defaultFilename,
          types: [{
            description: 'Smart Ease Photobook Project (*.smartease.json)',
            accept: { 'application/json': ['.json', '.smartease.json'] }
          }]
        });
        albumState.project.saveFileHandle = handle;
        albumState.project.savePath = handle.name;
        const writable = await handle.createWritable();
        await writable.write(json);
        await writable.close();
        albumState.project.hasBeenSaved = true;
        albumState.isDirty = false;
        showToastNotification(`💾 Saved "${albumState.project.title}" (Ctrl+S will now update directly in place)`);
        return true;
      } catch (err) {
        if (err.name === 'AbortError') return false; // user cancelled dialog
        console.warn('File picker save failed, falling back to download:', err);
      }
    }

    // 5. Fallback for older browsers without File System Access API
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = albumState.project.savePath || `${albumState.project.title.replace(/\s+/g, '_')}.smartease.json`;
    a.download = filename.endsWith('.json') ? filename : `${filename}.smartease.json`;
    a.click();
    URL.revokeObjectURL(url);
    albumState.project.hasBeenSaved = true;
    albumState.isDirty = false;
    showToastNotification(`💾 Saved "${albumState.project.title}" successfully!`);
    return true;
  }
  window.saveCurrentProject = saveCurrentProject;

  if (els.btnSaveProject) {
    els.btnSaveProject.addEventListener('click', () => saveCurrentProject(false));
  }
  if (els.btnSaveProjectToolbar) {
    els.btnSaveProjectToolbar.addEventListener('click', () => saveCurrentProject(false));
  }
  if (els.btnSaveAsProjectToolbar) {
    els.btnSaveAsProjectToolbar.addEventListener('click', () => saveCurrentProject(true));
  }

  // Fast Keyboard Shortcut Ctrl + S for Save (Updates in-place)
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      saveCurrentProject(false);
    }
  });

  // Open Project Handlers (Header & Toolbar with File System Access API and Native Dialog support)
  async function handleOpenProject() {
    setTimelineBackgroundProgress(10, 'Opening project...');
    // 1. Native Desktop File Dialog
    try {
      const resp = await fetch('/api/open_project_dialog', { method: 'POST' });
      if (resp.ok) {
        const res = await resp.json();
        if (res && res.success && res.content) {
          setTimelineBackgroundProgress(30, 'Reading project file...');
          canvasRenderer.imageCache?.clear();
          if (albumState.imagePipeline) {
            albumState.imagePipeline.cache?.clear();
          }
          const ok = albumState.importProject(res.content, res.filePath);
          if (ok) {
            if (res.filePath) {
              albumState.project.savePath = res.filePath;
              albumState.project.hasBeenSaved = true;
            }
            albumState.project.pathsFile = res.pathsFile || null;
            setTimelineBackgroundProgress(50, 'Setting up spreads & layouts...');
            reloadAndSyncProject(`📂 Opened "${albumState.project.title}" (${res.filePath || 'Project'})`);
            return;
          }
        }
      }
    } catch (err) {}
    hideTimelineBackgroundProgress();

    // 2. Browser File System Access API
    if (window.showOpenFilePicker) {
      try {
        const [handle] = await window.showOpenFilePicker({
          types: [{
            description: 'Smart Ease Photobook Project (*.json, *.smartease.json)',
            accept: { 'application/json': ['.json', '.smartease.json'] }
          }],
          multiple: false
        });
        setTimelineBackgroundProgress(20, 'Opening project file...');
        const file = await handle.getFile();
        const text = await file.text();
        setTimelineBackgroundProgress(40, 'Parsing spreads & photos...');
        const ok = albumState.importProject(text, handle.name);
        if (ok) {
          albumState.project.saveFileHandle = handle;
          albumState.project.savePath = handle.name;
          setTimelineBackgroundProgress(50, 'Setting up workspace...');
          reloadAndSyncProject(`📂 Opened "${albumState.project.title}" (${handle.name})`);
        } else {
          hideTimelineBackgroundProgress();
          alert('Could not open project file. Make sure it is a valid project JSON.');
        }
        return;
      } catch (err) {
        hideTimelineBackgroundProgress();
        if (err.name === 'AbortError') return;
        console.warn('showOpenFilePicker failed, falling back to file input:', err);
      }
    }
    if (els.fileProjectInput) els.fileProjectInput.click();
  }

  if (els.btnOpenProject) {
    els.btnOpenProject.addEventListener('click', handleOpenProject);
  }
  if (els.btnOpenProjectHeader) {
    els.btnOpenProjectHeader.addEventListener('click', handleOpenProject);
  }

  if (els.fileProjectInput) {
    els.fileProjectInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const fullPath = file.path || file.name;
      setTimelineBackgroundProgress(15, 'Reading project file...');
      const reader = new FileReader();
      reader.onload = async (event) => {
        setTimelineBackgroundProgress(40, 'Parsing spreads & photos...');
        const ok = albumState.importProject(event.target.result, fullPath);
        if (!ok) {
          hideTimelineBackgroundProgress();
          alert('Could not open project file. Make sure it is a valid .json project.');
        } else {
          albumState.project.savePath = fullPath;
          albumState.project.hasBeenSaved = true;
          albumState.project.pathsFile = null;
          try {
            const chkResp = await fetch('/api/get_project_paths', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ filePath: fullPath })
            });
            if (chkResp.ok) {
              const chkRes = await chkResp.json();
              if (chkRes.pathsFile) albumState.project.pathsFile = chkRes.pathsFile;
            }
          } catch (e) {}
          setTimelineBackgroundProgress(55, 'Setting up workspace...');
          reloadAndSyncProject(`📂 Opened "${albumState.project.title}" (${file.name})`);
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    });
  }

  // Verify saved project paths directly; the companion registry is for recovery only.
  async function verifyProjectPhotoPaths() {
    const photos = albumState.project?.photos || [];
    if (!photos.length) return;
    try {
      const resp = await fetch('/api/verify_photo_paths', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectPath: albumState.project.savePath || '',
          photos: photos.map(p => ({ id: p.id, filePath: p.filePath }))
        })
      });
      if (!resp.ok) return;
      const result = await resp.json();
      if (!result?.success || !Array.isArray(result.missingPhotoIds)) return;
      const resolvedPaths = result.resolvedPaths || {};
      photos.forEach(photo => {
        const resolvedPath = resolvedPaths[photo.id];
        if (resolvedPath) {
          // Rebuild each preview URL from the verified project JSON path so
          // stale/portable URLs do not leave valid photos broken on reload.
          photo.filePath = resolvedPath;
          const imageUrl = window.getApiUrl(`/api/local_image?path=${encodeURIComponent(resolvedPath)}`);
          photo.src = imageUrl;
          photo.originalSrc = imageUrl;
          photo.thumbSrc = `${imageUrl}&thumb=1`;
          photo.filePathVerified = true;
          photo.needsRelink = false;
        } else {
          photo.filePathVerified = false;
          photo.needsRelink = true;
        }
      });
    } catch (err) { console.warn('Could not verify saved photo paths:', err); }
  }

  window.markPhotoNeedsRelink = (photoId) => {
    const photo = albumState.project?.photos?.find(p => p.id === photoId);
    if (!photo || (photo.needsRelink && photo.filePathVerified === false)) return;
    photo.needsRelink = true;
    photo.filePathVerified = false;
    updateRelinkButtonVisibility();
    renderPhotoTray();
  };

  // Easy Reload / Re-sync Project
  async function reloadAndSyncProject(customMsg) {
    await verifyProjectPhotoPaths();
    canvasRenderer.imageCache?.clear();
    if (albumState.imagePipeline?.cache?.clear) albumState.imagePipeline.cache.clear();
    updateAppBookTitle(albumState.project?.title);
    albumState._recomputeUsageCounts();
    syncAlbumSizeSelectLabels();
    if (typeof syncSpacingControlsUI === 'function') {
      syncSpacingControlsUI();
    }
    const currentOrient = albumState.getSpreadOrientation();
    if (els.btnOrientationLandscape) els.btnOrientationLandscape.classList.toggle('active', currentOrient === 'landscape');
    if (els.btnOrientationPortrait) els.btnOrientationPortrait.classList.toggle('active', currentOrient === 'portrait');
    if (els.btnModeSpread) els.btnModeSpread.classList.toggle('active', albumState.project.pageMode !== 'single');
    if (canvasRenderer.preloadAllSpreadImages) {
      canvasRenderer.preloadAllSpreadImages();
    }
    updateRelinkButtonVisibility();
    resizeCanvasStage();
    updateHUD();
    renderFilmstrip();
    renderPhotoTray();
    renderFloatingLayoutsBar();
    canvasRenderer.render();
    showToastNotification(customMsg || '↻ Project reloaded & workspace refreshed!');

    // Smooth and quick background auto-relink on project open:
    isRelinkingActive = false;
    userPostponedDriveConnection = false;
    hasScannedDrivesForProject = false;

    // Check if any photos need linking
    const photosNeedingRelink = (albumState.project?.photos || []).filter(
      p => p.needsRelink || p.filePathVerified === false || !p.filePath || !p.src || p.src.startsWith('blob:')
    );

    const hasPathsFile = Boolean(albumState.project?.pathsFile);

    // A companion registry is only needed to search for missing photos.
    // Valid paths stored in the project JSON have already been verified and
    // reconnected above, so do not interrupt projects whose files are present.
    if (photosNeedingRelink.length === 0) {
      hideTimelineBackgroundProgress();
      updateRelinkButtonVisibility();
      return;
    }

    if (!hasPathsFile) {
      hideTimelineBackgroundProgress();
      showRelinkOptionsDialog(
        photosNeedingRelink.length,
        'Photo Folder Required',
        `Smart Ease reconnected photos whose saved paths are available. ${photosNeedingRelink.length} photo${photosNeedingRelink.length === 1 ? ' is' : 's are'} still missing. Select the photo folder now, or choose “I'll Choose Later” to keep working and relink later.`
      );
      return;
    }

    // Search safely using the exact companion registry when missing paths remain.
    autoRelinkProjectPhotos(false);
  }

  // --- Timely Progress Notification Countdown & Spreads Timeline Counter ---
  const timelineProgressBadge = document.getElementById('timelineProgressBadge');
  const timelineProgressPercent = document.getElementById('timelineProgressPercent');
  let currentTimelineProgress = 0;
  let targetTimelineProgress = 0;
  let timelineProgressTimer = null;
  let timelineTickerInterval = null;
  let currentWorkingTaskLabel = 'Working...';
  let activeWorkingToastTimer = null;

  function showWorkingProgressNotification(title, percent) {
    let toast = document.getElementById('smartWorkingToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'smartWorkingToast';
      toast.style.cssText = `
        position: fixed;
        top: 75px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(15, 23, 42, 0.94);
        color: #ffffff;
        padding: 9px 20px;
        border-radius: 999px;
        font-size: 13px;
        font-weight: 600;
        border: 1px solid rgba(56, 189, 248, 0.5);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
        z-index: 10001;
        pointer-events: none;
        display: flex;
        align-items: center;
        gap: 10px;
        backdrop-filter: blur(8px);
        transition: opacity 0.25s ease, transform 0.25s ease;
      `;
      document.body.appendChild(toast);
    }
    if (activeWorkingToastTimer) {
      clearTimeout(activeWorkingToastTimer);
      activeWorkingToastTimer = null;
    }

    const pct = Math.max(1, Math.min(100, Math.round(percent)));
    if (pct < 100) {
      toast.innerHTML = `
        <span style="display: inline-block; width: 13px; height: 13px; border: 2px solid rgba(56, 189, 248, 0.3); border-top-color: #38bdf8; border-radius: 50%; animation: relinkSpin 0.8s linear infinite;"></span>
        <span style="letter-spacing: 0.2px;">${title}</span>
        <span style="background: rgba(56, 189, 248, 0.22); color: #38bdf8; padding: 2px 9px; border-radius: 12px; font-size: 12px; font-weight: 700; font-family: monospace;">${pct}%</span>
      `;
      toast.style.display = 'flex';
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    } else {
      toast.innerHTML = `
        <span style="color: #4ade80; font-weight: 800;">✓</span>
        <span style="letter-spacing: 0.2px;">${title.replace(/\.{3,}$/, '')} complete!</span>
        <span style="background: rgba(74, 222, 128, 0.22); color: #4ade80; padding: 2px 9px; border-radius: 12px; font-size: 12px; font-weight: 700; font-family: monospace;">100%</span>
      `;
      toast.style.display = 'flex';
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
      activeWorkingToastTimer = setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(-8px)';
        setTimeout(() => { toast.style.display = 'none'; }, 300);
      }, 1200);
    }
  }

  function hideWorkingProgressNotification() {
    const toast = document.getElementById('smartWorkingToast');
    if (toast) {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(-8px)';
      setTimeout(() => { toast.style.display = 'none'; }, 300);
    }
  }

  function setTimelineBackgroundProgress(targetPct, taskLabel = '') {
    if (taskLabel) currentWorkingTaskLabel = taskLabel;
    if (timelineProgressTimer) {
      clearTimeout(timelineProgressTimer);
      timelineProgressTimer = null;
    }
    if (timelineProgressBadge) timelineProgressBadge.style.display = 'inline-flex';
    targetTimelineProgress = Math.max(1, Math.min(100, Math.round(targetPct)));

    // Ensure we start counting immediately from at least 1% so it is never stuck on 0 or blank
    if (currentTimelineProgress === 0) {
      currentTimelineProgress = 1;
      if (timelineProgressPercent) timelineProgressPercent.textContent = '1%';
    }

    showWorkingProgressNotification(currentWorkingTaskLabel, currentTimelineProgress);

    if (!timelineTickerInterval) {
      startTimelineTicker();
    }
  }

  function startTimelineTicker() {
    if (timelineTickerInterval) clearInterval(timelineTickerInterval);
    timelineTickerInterval = setInterval(() => {
      if (currentTimelineProgress < targetTimelineProgress) {
        // Smoothly and realistically step towards target
        const diff = targetTimelineProgress - currentTimelineProgress;
        const step = diff > 30 ? 4 : (diff > 15 ? 2 : 1);
        currentTimelineProgress = Math.min(targetTimelineProgress, currentTimelineProgress + step);
      } else if (targetTimelineProgress < 95 && currentTimelineProgress >= targetTimelineProgress) {
        // While still working in background, realistically tick forward so it never freezes on one number!
        currentTimelineProgress = Math.min(95, currentTimelineProgress + 1);
      }

      if (timelineProgressPercent) {
        timelineProgressPercent.textContent = `${Math.round(currentTimelineProgress)}%`;
      }
      showWorkingProgressNotification(currentWorkingTaskLabel, currentTimelineProgress);

      if (currentTimelineProgress >= 100) {
        if (timelineProgressPercent) timelineProgressPercent.textContent = '100%';
        showWorkingProgressNotification(currentWorkingTaskLabel, 100);
        clearInterval(timelineTickerInterval);
        timelineTickerInterval = null;
        timelineProgressTimer = setTimeout(() => {
          if (timelineProgressBadge) {
            timelineProgressBadge.style.display = 'none';
          }
          currentTimelineProgress = 0;
          targetTimelineProgress = 0;
        }, 700);
      }
    }, 45);
  }

  function hideTimelineBackgroundProgress() {
    if (timelineTickerInterval) {
      clearInterval(timelineTickerInterval);
      timelineTickerInterval = null;
    }
    if (timelineProgressTimer) {
      clearTimeout(timelineProgressTimer);
      timelineProgressTimer = null;
    }
    if (timelineProgressBadge) {
      timelineProgressBadge.style.display = 'none';
    }
    hideWorkingProgressNotification();
    currentTimelineProgress = 0;
    targetTimelineProgress = 0;
  }
  window.setTimelineBackgroundProgress = setTimelineBackgroundProgress;
  window.hideTimelineBackgroundProgress = hideTimelineBackgroundProgress;

  // --- Automatic Photo Re-linking with Logo Progress Circle & Communication ---
  const relinkProgressOverlay = document.getElementById('relinkProgressOverlay');  // The relink dialog is authored inside a hidden template modal in the HTML.
  // Move it to the page root so it can actually cover the workspace when shown.
  if (relinkProgressOverlay && relinkProgressOverlay.parentElement !== document.body) {
    document.body.appendChild(relinkProgressOverlay);
  }
  const relinkProgressTitle = document.getElementById('relinkProgressTitle');
  const relinkProgressSubtitle = document.getElementById('relinkProgressSubtitle');
  const relinkProgressBarFill = document.getElementById('relinkProgressBarFill');
  const relinkProgressStatus = document.getElementById('relinkProgressStatus');
  const relinkProgressActions = document.getElementById('relinkProgressActions');
  const btnDismissRelinkProgress = document.getElementById('btnDismissRelinkProgress');
  const btnBrowseManualRelink = document.getElementById('btnBrowseManualRelink');

  function updateRelinkButtonVisibility() {
    if (!els.btnRelinkPhotos) return;
    const remainingMissing = albumState.project?.photos?.filter(p => p.needsRelink || p.filePathVerified === false).length || 0;
    if (remainingMissing > 0) {
      const label = els.btnRelinkPhotos.querySelector('span');
      if (label) label.textContent = `🔗 Re-link Photos (${remainingMissing})`;
      els.btnRelinkPhotos.style.display = 'inline-flex';
      els.btnRelinkPhotos.style.background = 'rgba(239, 68, 68, 0.18)';
      els.btnRelinkPhotos.style.borderColor = 'rgba(239, 68, 68, 0.5)';
      els.btnRelinkPhotos.style.color = '#f87171';
      els.btnRelinkPhotos.title = `${remainingMissing} photo${remainingMissing === 1 ? '' : 's'} need relinking. Click to locate folder or connect drive.`;
    } else {
      els.btnRelinkPhotos.style.display = 'none';
    }
  }

  function showRelinkProgress(title, subtitle, status, showActions = false) {
    if (!relinkProgressOverlay) return;
    if (relinkProgressTitle) relinkProgressTitle.textContent = title;
    if (relinkProgressSubtitle) relinkProgressSubtitle.textContent = subtitle;
    if (relinkProgressStatus) relinkProgressStatus.textContent = status;
    if (relinkProgressActions) relinkProgressActions.style.display = showActions ? 'flex' : 'none';
    if (relinkProgressBarFill) {
      relinkProgressBarFill.style.width = showActions ? '0%' : '50%';
      relinkProgressBarFill.style.animation = showActions ? 'none' : 'relinkIndeterminate 1.6s ease-in-out infinite';
    }
    relinkProgressOverlay.style.display = 'flex';
    relinkProgressOverlay.style.opacity = '1';
  }

  function showRelinkOptionsDialog(missingCount, customTitle, customSubtitle) {
    hideTimelineBackgroundProgress();
    showRelinkProgress(
      customTitle || 'Locate Missing Photos',
      customSubtitle || `Smart Ease has scanned all drives, but ${missingCount} photo${missingCount === 1 ? ' was' : 's were'} not located. You can locate the folder manually or connect your drive later:`,
      `${missingCount} photo${missingCount === 1 ? '' : 's'} unlinked`,
      true
    );
  }

  function hideRelinkProgress(delayMs = 0) {
    if (!relinkProgressOverlay) return;
    if (delayMs > 0) {
      setTimeout(() => {
        relinkProgressOverlay.style.opacity = '0';
        setTimeout(() => { relinkProgressOverlay.style.display = 'none'; }, 80);
      }, delayMs);
    } else {
      relinkProgressOverlay.style.opacity = '0';
      relinkProgressOverlay.style.display = 'none';
    }
  }

  let userPostponedDriveConnection = false;
  let relinkAbortController = null;
  let isRelinkingActive = false;
  let hasScannedDrivesForProject = false;
  let knownConnectedDrives = new Set();
  let isDriveWatcherChecking = false;
  let autoRelinkWatcherInterval = null;

  function dismissRelinkOverlayAndStopScan() {
    userPostponedDriveConnection = true;
    if (relinkAbortController) {
      try { relinkAbortController.abort(); } catch(e) {}
      relinkAbortController = null;
    }
    isRelinkingActive = false;
    hideRelinkProgress(0);
    hideTimelineBackgroundProgress();
    updateRelinkButtonVisibility();
  }

  if (relinkProgressOverlay) {
    relinkProgressOverlay.addEventListener('click', (e) => {
      if (e.target === relinkProgressOverlay) {
        dismissRelinkOverlayAndStopScan();
      }
    });
  }
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && relinkProgressOverlay && relinkProgressOverlay.style.display !== 'none') {
      dismissRelinkOverlayAndStopScan();
    }
  });

  if (btnDismissRelinkProgress) {
    btnDismissRelinkProgress.addEventListener('click', () => {
      dismissRelinkOverlayAndStopScan();
    });
  }
  if (btnBrowseManualRelink) {
    btnBrowseManualRelink.addEventListener('click', async () => {
      userPostponedDriveConnection = false;
      hideRelinkProgress(0);
      try {
        const resp = await fetch('/api/select_folder', { method: 'POST' });
        if (resp.ok) {
          const res = await resp.json();
          if (res && res.success && res.folder) {
            albumState.project.photosFolder = res.folder;
            albumState.project.sourceFolderPath = res.folder;
            const folderName = res.folder.split(/[\\/]/).pop() || res.folder;
            showToastNotification(`📁 Connecting photos from "${folderName}"...`);
            
            const folderPhotos = Array.isArray(res.photos) ? res.photos : [];
            const claimedPaths = new Set();
            let matchedCount = 0;

            albumState.project.photos.forEach(p => {
              if (!p.needsRelink && p.filePathVerified && p.filePath) return;
              const pName = (p.name || '').toLowerCase();
              const pFile = (p.fileName || '').toLowerCase();

              // 1. Try exact SHA-256 match
              let match = null;
              if (p.fileHash) {
                match = folderPhotos.find(fp => !claimedPaths.has(fp.path) && fp.fileHash && fp.fileHash.toLowerCase() === p.fileHash.toLowerCase());
              }
              // 2. Try exact filename + size match
              if (!match && p.fileSize) {
                match = folderPhotos.find(fp => !claimedPaths.has(fp.path) && fp.fileSize === p.fileSize && (fp.name.toLowerCase() === pFile || fp.name.toLowerCase() === pName));
              }
              // 3. Exact filename match
              if (!match) {
                match = folderPhotos.find(fp => !claimedPaths.has(fp.path) && (fp.name.toLowerCase() === pFile || fp.name.toLowerCase() === pName));
              }

              if (match) {
                claimedPaths.add(match.path);
                p.filePath = match.path;
                p.src = `/api/local_image?path=${encodeURIComponent(match.path)}`;
                p.originalSrc = p.src;
                p.thumbSrc = p.src + '&thumb=1';
                p.sourceFolder = res.folder;
                p.needsRelink = false;
                p.filePathVerified = true;
                if (match.fileHash) p.fileHash = match.fileHash;
                if (match.fileSize) p.fileSize = match.fileSize;
                if (match.width && match.height) {
                  p.width = match.width;
                  p.height = match.height;
                  p.aspect = match.aspect || Number((match.width / match.height).toFixed(3));
                }
                albumState.imagePipeline?.cache?.delete(p.id);
                matchedCount++;
              }
            });

            // Automatically create and save companion .paths.json next to the project file
            if (albumState.project.savePath || albumState.project.hasBeenSaved) {
              const exportContent = albumState.exportProject();
              try {
                const sResp = await fetch('/api/save_project', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ filePath: albumState.project.savePath, content: exportContent })
                });
                if (sResp.ok) {
                  const sRes = await sResp.json();
                  if (sRes.pathsFile) {
                    albumState.project.pathsFile = sRes.pathsFile;
                  }
                }
              } catch (se) {}
            }

            if (canvasRenderer.preloadAllSpreadImages) {
              canvasRenderer.preloadAllSpreadImages();
            }
            canvasRenderer.requestRender();
            renderFilmstrip();
            renderPhotoTray();
            updateFilmstripSelectionUI();
            updateRelinkButtonVisibility();
            showToastNotification(`✓ Connected ${matchedCount} photos and created companion paths file!`);
            return;
          }
        }
      } catch (err) {}
      if (els.relinkFolderInput) els.relinkFolderInput.click();
    });
  }

  async function autoRelinkProjectPhotos(interactive = false, isBackgroundDriveCheck = false, forceScan = false) {
    if (!albumState.project || !albumState.project.photos) return;
    // STRICT RULE: If companion paths file (.paths.json) is missing, NEVER auto-relink!
    if (!albumState.project.pathsFile) {
      if (interactive) {
        const missingCount = albumState.project.photos.filter(p => p.needsRelink || p.filePathVerified === false || !p.filePath).length;
        showRelinkOptionsDialog(
          missingCount,
          'Photo Folder Required',
          `Photos with valid saved paths are already connected. Select the photo folder to locate the remaining ${missingCount} missing photo${missingCount === 1 ? '' : 's'}:`
        );
      }
      return;
    }
    if (interactive) {
      userPostponedDriveConnection = false;
    } else if (userPostponedDriveConnection && !isBackgroundDriveCheck) {
      // User postponed drive connection: do not scan until another drive is connected
      return;
    }
    if (isRelinkingActive) return;

    const allPhotos = albumState.project.photos;
    if (allPhotos.length === 0) {
      hideRelinkProgress(0);
      hideTimelineBackgroundProgress();
      updateRelinkButtonVisibility();
      if (interactive) {
        showToastNotification('No photos in current project to relink.');
      }
      return;
    }

    const photosToRelink = interactive
      ? allPhotos
      : allPhotos.filter(p => p.needsRelink || !p.filePathVerified || !p.src || p.src.startsWith('blob:') || p.src.startsWith('data:') || !p.filePath);

    if (photosToRelink.length === 0) {
      hideRelinkProgress(0);
      hideTimelineBackgroundProgress();
      updateRelinkButtonVisibility();
      const anyMissing = allPhotos.some(p => p.needsRelink);
      if (!anyMissing && interactive) {
        showToastNotification('✓ All photos are already connected!');
      }
      return;
    }

    // If drives have already been scanned for this project, and user triggered interactive relink
    // without an explicit forceScan, present the options modal immediately so the user can choose:
    if (interactive && !forceScan && hasScannedDrivesForProject) {
      const missingCount = allPhotos.filter(p => p.needsRelink).length || photosToRelink.length;
      showRelinkOptionsDialog(missingCount);
      return;
    }

    if (!isBackgroundDriveCheck) {
      setTimelineBackgroundProgress(25, 'Connecting photos...');
    }

    if (interactive) {
      showRelinkProgress(
        'Searching for Photo Folder...',
        'Checking connected drives and USBs for original project photos...',
        'Scanning drives...',
        true
      );
    }

    // Collect candidate folder paths
    const candidateFolders = new Set();
    if (albumState.project.photosFolder) {
      candidateFolders.add(albumState.project.photosFolder);
    }
    if (albumState.project.sourceFolderPath) {
      candidateFolders.add(albumState.project.sourceFolderPath);
    }
    if (albumState.project.savePath && (albumState.project.savePath.includes('/') || albumState.project.savePath.includes('\\'))) {
      const pDir = albumState.project.savePath.substring(0, Math.max(albumState.project.savePath.lastIndexOf('/'), albumState.project.savePath.lastIndexOf('\\')));
      if (pDir) {
        candidateFolders.add(pDir);
        ['photos', 'images', 'pics', 'raw', 'export', 'jpg', 'pictures', 'selection', 'shoot', 'dcim', 'album'].forEach(sub => {
          candidateFolders.add(pDir + '/' + sub);
          candidateFolders.add(pDir + '\\' + sub);
        });
      }
    }
    photosToRelink.forEach(p => {
      if (p.sourceFolder) candidateFolders.add(p.sourceFolder);
      let fp = p.filePath || '';
      if (!fp && typeof p.src === 'string' && p.src.includes('path=')) {
        try { fp = decodeURIComponent(p.src.split('path=')[1]); } catch(e) {}
      }
      if (!fp && typeof p.originalSrc === 'string' && p.originalSrc.includes('path=')) {
        try { fp = decodeURIComponent(p.originalSrc.split('path=')[1]); } catch(e) {}
      }
      if (fp && (fp.includes('/') || fp.includes('\\'))) {
        const pDir = fp.substring(0, Math.max(fp.lastIndexOf('/'), fp.lastIndexOf('\\')));
        if (pDir) {
          candidateFolders.add(pDir);
          ['photos', 'images', 'pics', 'raw', 'export', 'jpg', 'pictures', 'selection', 'shoot', 'dcim', 'album'].forEach(sub => {
            candidateFolders.add(pDir + '/' + sub);
            candidateFolders.add(pDir + '\\' + sub);
          });
        }
      }
    });

    isRelinkingActive = true;
    if (relinkAbortController) {
      try { relinkAbortController.abort(); } catch(e) {}
    }
    relinkAbortController = new AbortController();
    const abortSignal = relinkAbortController.signal;

    try {
      if (!isBackgroundDriveCheck) {
        setTimelineBackgroundProgress(45, 'Scanning drives & folders...');
      }
      const resp = await fetch('/api/find_photos', {
        method: 'POST',
        signal: abortSignal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectPath: albumState.project.savePath || '',
          pathsFile: albumState.project.pathsFile || '',
          folder: albumState.project.photosFolder || albumState.project.sourceFolderPath || '',
          folders: Array.from(candidateFolders),
          photos: photosToRelink.map(p => {
            let fp = p.filePath || '';
            if (!fp && typeof p.src === 'string' && p.src.includes('path=')) {
              try { fp = decodeURIComponent(p.src.split('path=')[1]); } catch(e) {}
            }
            if (!fp && typeof p.originalSrc === 'string' && p.originalSrc.includes('path=')) {
              try { fp = decodeURIComponent(p.originalSrc.split('path=')[1]); } catch(e) {}
            }
            return {
              id: p.id,
              name: p.name || '',
              fileName: p.fileName || p.name || '',
              filePath: fp,
              fileHash: p.fileHash || null,
              fileSize: typeof p.fileSize === 'number' ? p.fileSize : null,
              width: p.width || null,
              height: p.height || null,
              lastModified: p.lastModified || null,
              dateTaken: p.dateTaken || null
            };
          })
        })
      });

      if (abortSignal.aborted || (userPostponedDriveConnection && !isBackgroundDriveCheck && !interactive)) {
        hideTimelineBackgroundProgress();
        return;
      }

      if (resp.ok) {
        const res = await resp.json();
        if (res && res.success) {
          const matches = res.matches || {};
          let relinkedCount = 0;
          let discoveredFolder = res.folder || '';
          if (res.pathsFile) albumState.project.pathsFile = res.pathsFile;
          if (Array.isArray(res.activeDrives)) {
            res.activeDrives.forEach(d => knownConnectedDrives.add(d.toUpperCase()));
          }

          if (!isBackgroundDriveCheck) {
            setTimelineBackgroundProgress(70, 'Linking photos to spreads...');
          }

          photosToRelink.forEach(photo => {
            const match = matches[photo.id];
            if (match && match.path) {
              const localUrl = `/api/local_image?path=${encodeURIComponent(match.path)}`;
              photo.src = localUrl;
              photo.originalSrc = localUrl;
              photo.thumbSrc = localUrl + '&thumb=1';
              photo.filePath = match.path;
              if (match.fileHash) photo.fileHash = match.fileHash;
              if (match.fileSize) photo.fileSize = match.fileSize;
              if (match.dateTaken) photo.dateTaken = match.dateTaken;
              if (match.lastModified) photo.lastModified = match.lastModified;
              if (match.cameraModel) photo.cameraModel = match.cameraModel;
              photo.needsRelink = false;
              photo.filePathVerified = true;
              if (match.width && match.height) {
                photo.width = match.width;
                photo.height = match.height;
                photo.aspect = Number((match.width / match.height).toFixed(3)) || photo.aspect;
              }
              albumState.imagePipeline?.cache?.delete(photo.id);
              relinkedCount++;

              if (!discoveredFolder) {
                const norm = match.path.replace(/\\/g, '/');
                const lastSlash = norm.lastIndexOf('/');
                if (lastSlash !== -1) {
                  discoveredFolder = match.path.substring(0, lastSlash);
                }
              }
            } else {
              photo.needsRelink = true;
              photo.filePathVerified = false;
            }
          });

          if (discoveredFolder) {
            albumState.project.photosFolder = discoveredFolder;
            albumState.project.sourceFolderPath = discoveredFolder;
            albumState.project.photos.forEach(p => {
              if (p.filePath) {
                const norm = p.filePath.replace(/\\/g, '/');
                const lastSlash = norm.lastIndexOf('/');
                if (lastSlash !== -1) {
                  p.sourceFolder = p.filePath.substring(0, lastSlash);
                } else {
                  p.sourceFolder = discoveredFolder;
                }
              } else if (!p.needsRelink) {
                p.sourceFolder = discoveredFolder;
              }
            });
          }

          if (relinkedCount > 0 && !isBackgroundDriveCheck) {
            setTimelineBackgroundProgress(85, 'Saving updated paths...');
          }

          // Save project in-place whenever any photos were relinked
          if (relinkedCount > 0 && (albumState.project.savePath || albumState.project.hasBeenSaved)) {
            try {
              const json = albumState.exportProject();
              const resp2 = await fetch('/api/save_project', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filePath: albumState.project.savePath, content: json })
              });
              const res2 = await resp2.json();
              if (res2 && res2.success && res2.filePath) {
                albumState.project.savePath = res2.filePath;
                albumState.project.hasBeenSaved = true;
              }
            } catch (saveErr) {
              console.warn('Auto-relink save failed:', saveErr);
            }
          }

          if (relinkedCount > 0) {
            if (canvasRenderer.preloadAllSpreadImages) {
              canvasRenderer.preloadAllSpreadImages();
            }
            canvasRenderer.requestRender();
            renderFilmstrip();
            renderPhotoTray();
          }

          hideTimelineBackgroundProgress();

          const missingCount = albumState.project.photos.filter(p => p.needsRelink).length;
          hasScannedDrivesForProject = true;
          updateRelinkButtonVisibility();

          if (relinkedCount > 0) {
            hideRelinkProgress(0);
            if (missingCount === 0) {
              userPostponedDriveConnection = false;
              hasScannedDrivesForProject = false;
            }
            if (isBackgroundDriveCheck) {
              // Exact user requested popup message
              showToastNotification(relinkedCount === 1 ? '✓ Found the missing image!' : `✓ Found ${relinkedCount} missing images!`);
            } else {
              const viaPathsMsg = res.pathsFile ? ' via companion paths registry' : '';
              showToastNotification(`🔗 Re-linked ${relinkedCount} photo${relinkedCount === 1 ? '' : 's'}${viaPathsMsg}!`);
            }
          } else if (missingCount === 0) {
            hideRelinkProgress(0);
            userPostponedDriveConnection = false;
            hasScannedDrivesForProject = false;
            if (interactive) {
              showToastNotification('✓ All photos successfully connected!');
            }
          } else {
            // Photos missing:
            if (isBackgroundDriveCheck) {
              // "if the image is still not there is should just stop" - stay silent
            } else if (userPostponedDriveConnection && !interactive) {
              // User chose "I'll Connect Drive Later" - stay silent and hidden
              hideRelinkProgress(0);
            } else {
              // Initial load or interactive - display options dialog allowing user to choose
              showRelinkOptionsDialog(missingCount);
            }
          }
        }
      }
    } catch (err) {
      hideTimelineBackgroundProgress();
      if (err.name === 'AbortError' || abortSignal?.aborted) {
        return;
      }
      console.warn('Auto-relink error:', err);
      if (interactive) {
        showRelinkProgress(
          'Photo Folder Not Found Yet',
          'Could not find original photos folder. Please connect your external drive or select the folder manually.',
          'Ready to connect hard disk',
          true
        );
      }
    } finally {
      isRelinkingActive = false;
      relinkAbortController = null;
      updateRelinkButtonVisibility();
    }
  }
  window.autoRelinkProjectPhotos = autoRelinkProjectPhotos;

  // --- Background Drive Listener: Only checks when another drive is actually connected ---
  async function checkDriveChanges() {
    if (document.hidden || isDriveWatcherChecking || isRelinkingActive) return;
    const hasMissing = albumState.project?.photos?.some(p => p.needsRelink);
    if (!hasMissing || !albumState.project?.pathsFile) return; // Completely idle when photos are connected OR if companion paths file is missing!
    try {
      isDriveWatcherChecking = true;
      const resp = await fetch('/api/list_drives');
      if (!resp.ok) return;
      const data = await resp.json();
      const currentDrives = (data.drives || []).map(d => d.toUpperCase());
      
      if (knownConnectedDrives.size === 0) {
        currentDrives.forEach(d => knownConnectedDrives.add(d));
        return;
      }

      // Check if any NEW drive was plugged in
      const newDrives = currentDrives.filter(d => !knownConnectedDrives.has(d));
      // Update known drives to current drives
      knownConnectedDrives = new Set(currentDrives);

      if (newDrives.length > 0) {
        // Check in the background for the missing photo(s) on the new drive quietly
        autoRelinkProjectPhotos(false, true /* isBackgroundDriveCheck */);
      }
    } catch (e) {
      // Quietly ignore background poll error
    } finally {
      isDriveWatcherChecking = false;
    }
  }

  function startHardDiskConnectionWatcher() {
    if (autoRelinkWatcherInterval) clearInterval(autoRelinkWatcherInterval);
    autoRelinkWatcherInterval = setInterval(checkDriveChanges, 8000);
  }
  startHardDiskConnectionWatcher();

  window.addEventListener('focus', () => {
    checkDriveChanges();
  });

  if (els.btnReloadProject) {
    els.btnReloadProject.addEventListener('click', () => {
      reloadAndSyncProject();
    });
  }

  // --- Photo Re-linking Handler for Restoring Original High-Res Files in Older Projects ---
  if (els.btnRelinkPhotos) {
    els.btnRelinkPhotos.addEventListener('click', () => {
      const missingCount = albumState.project?.photos?.filter(p => p.needsRelink).length || 0;
      if (missingCount === 0) {
        showToastNotification('✓ All photos are already connected!');
        updateRelinkButtonVisibility();
        return;
      }

      // If the app has already scanned the drives for this project,
      // allow the user to choose their options immediately without forcing a redundant scan:
      if (hasScannedDrivesForProject) {
        showRelinkOptionsDialog(missingCount);
      } else {
        autoRelinkProjectPhotos(true, false, true /* forceScan */);
      }
    });
  }

  if (els.relinkFolderInput) {
    els.relinkFolderInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      let browsedFolder = '';
      for (const f of files) {
        if (f.path) {
          const fp = f.path.replace(/\\/g, '/');
          const lastSlash = fp.lastIndexOf('/');
          if (lastSlash !== -1) {
            browsedFolder = f.path.substring(0, lastSlash);
            break;
          }
        }
      }
      if (!browsedFolder && files[0]?.webkitRelativePath) {
        browsedFolder = files[0].webkitRelativePath.split('/')[0];
      }

      const claimedFiles = new Set();
      let relinkedCount = 0;
      albumState.project.photos.forEach(photo => {
        if (!photo.needsRelink) return;
        const photoFile = (photo.fileName || '').toLowerCase();
        const photoName = (photo.name || '').toLowerCase();

        // Strict 1-to-1 exact filename matching
        let matchingFile = null;
        for (const f of files) {
          if (claimedFiles.has(f)) continue;
          const fn = f.name.toLowerCase();
          if (photoFile && fn === photoFile) {
            matchingFile = f;
            break;
          }
          if (photoName && (fn === photoName || fn === (photoName + '.jpg') || fn === (photoName + '.jpeg') || fn === (photoName + '.png'))) {
            matchingFile = f;
            break;
          }
        }

        if (matchingFile) {
          // If fileSize is recorded, check for byte length match
          if (photo.fileSize && photo.fileSize > 0 && matchingFile.size && matchingFile.size !== photo.fileSize) {
            return; // Reject mismatch!
          }

          claimedFiles.add(matchingFile);
          const newUrl = URL.createObjectURL(matchingFile);
          photo.src = newUrl;
          photo.originalSrc = newUrl;
          photo.thumbSrc = newUrl;
          photo.originalFile = matchingFile;
          photo.fileSize = matchingFile.size || photo.fileSize;
          photo.lastModified = matchingFile.lastModified || photo.lastModified;
          photo.needsRelink = false;
          photo.filePathVerified = true;
          if (browsedFolder) {
            photo.sourceFolder = browsedFolder;
          }
          if (matchingFile.path) {
            photo.filePath = matchingFile.path;
          }
          
          if (window.crypto && window.crypto.subtle) {
            computeFileSha256(matchingFile).then(h => {
              if (h) photo.fileHash = h;
            }).catch(() => {});
          }

          // Clear any old thumbnail cache so full-resolution image displays immediately
          if (albumState.imagePipeline) {
            albumState.imagePipeline.cache?.set(photo.id, {
              data: photo,
              displayImg: null,
              originalImg: null,
              thumbReady: false
            });
            albumState.imagePipeline.queueThumbnail(photo, (updatedPhoto, thumbSrc) => {
              const thumbImg = document.querySelector(`.photo-thumb[data-photo-id="${updatedPhoto.id}"] img`);
              if (thumbImg && thumbSrc) thumbImg.src = thumbSrc;
              canvasRenderer.requestRender();
            }, canvasRenderer._getImage(newUrl));
          }

          relinkedCount++;
        }
      });

      if (relinkedCount > 0 || (browsedFolder && (albumState.project.savePath || albumState.project.hasBeenSaved))) {
        if (browsedFolder) {
          albumState.project.photosFolder = browsedFolder;
          albumState.project.sourceFolderPath = browsedFolder;
          albumState.project.photos.forEach(photo => {
            if (!photo.needsRelink) {
              photo.sourceFolder = browsedFolder;
            }
          });

          // Also resolve real filesystem paths via backend
          fetch('/api/find_photos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              folder: browsedFolder,
              folders: [browsedFolder],
              photos: albumState.project.photos.map(p => ({
                id: p.id,
                name: p.name,
                fileName: p.fileName,
                filePath: p.filePath,
                fileHash: p.fileHash || null,
                fileSize: p.fileSize || null
              }))
            })
          }).then(r => r.json()).then(res => {
            if (res && res.matches && Object.keys(res.matches).length > 0) {
              Object.entries(res.matches).forEach(([photoId, match]) => {
                const photo = albumState.project.photos.find(p => p.id === photoId);
                if (photo && match.path) {
                  photo.filePath = match.path;
                  photo.src = `/api/local_image?path=${encodeURIComponent(match.path)}`;
                  photo.originalSrc = photo.src;
                  photo.thumbSrc = photo.src + '&thumb=1';
                  if (match.fileHash) photo.fileHash = match.fileHash;
                  if (match.fileSize) photo.fileSize = match.fileSize;
                  if (match.dateTaken) photo.dateTaken = match.dateTaken;
                  if (match.lastModified) photo.lastModified = match.lastModified;
                  if (match.cameraModel) photo.cameraModel = match.cameraModel;
                  if (match.width && match.height) {
                    photo.width = match.width;
                    photo.height = match.height;
                    photo.aspect = Number((match.width / match.height).toFixed(3)) || photo.aspect;
                  }
                }
              });
              if (res.folder) {
                albumState.project.photosFolder = res.folder;
                albumState.project.sourceFolderPath = res.folder;
              }
              if (albumState.project.savePath || albumState.project.hasBeenSaved) {
                const json2 = albumState.exportProject();
                fetch('/api/save_project', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ filePath: albumState.project.savePath, content: json2 })
                }).then(r2 => r2.json()).then(res2 => {
                  if (res2 && res2.success && res2.filePath) {
                    albumState.project.savePath = res2.filePath;
                    albumState.project.hasBeenSaved = true;
                  }
                }).catch(() => {});
              }
            }
          }).catch(() => {});
        }

        // Keep existing decoded photos cached; relinked browser files use fresh
        // Blob URLs and receive their own decoded original plus generated thumb.
        if (canvasRenderer.preloadAllSpreadImages) {
          canvasRenderer.preloadAllSpreadImages();
        }
        canvasRenderer.requestRender();
        renderFilmstrip();
        renderPhotoTray();
        updateRelinkButtonVisibility();
        hideRelinkProgress(0);
        showToastNotification(relinkedCount > 0 ? `🔗 Re-linked ${relinkedCount} photos with high-resolution original files!` : `📁 Saved the photo-folder paths registry.`);

        // Automatically update the project file in place with that second folder path (non-interactive, no prompt, no copies!)
        if (albumState.project.savePath || albumState.project.hasBeenSaved) {
          const json3 = albumState.exportProject();
          fetch('/api/save_project', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filePath: albumState.project.savePath, content: json3 })
          }).then(r3 => r3.json()).then(res3 => {
            if (res3 && res3.success && res3.filePath) {
              albumState.project.savePath = res3.filePath;
              albumState.project.hasBeenSaved = true;
            }
          }).catch(() => {});
        }
      } else {
        alert('No matching photo filenames found in the selected folder.');
      }
      e.target.value = '';
    });
  }

  // Tutorials Modal Handlers
  if (els.btnCloseTutorials) {
    els.btnCloseTutorials.addEventListener('click', () => {
      if (els.modalTutorials) els.modalTutorials.classList.remove('open');
    });
  }
  if (els.btnOkTutorials) {
    els.btnOkTutorials.addEventListener('click', () => {
      if (els.modalTutorials) els.modalTutorials.classList.remove('open');
    });
  }

  // Activation Modal Handlers
  if (els.btnActivate) {
    els.btnActivate.addEventListener('click', () => {
      if (els.modalActivate) els.modalActivate.classList.add('open');
    });
  }
  if (els.btnCloseActivate) {
    els.btnCloseActivate.addEventListener('click', () => {
      if (els.modalActivate) els.modalActivate.classList.remove('open');
    });
  }
  if (els.btnCancelActivate) {
    els.btnCancelActivate.addEventListener('click', () => {
      if (els.modalActivate) els.modalActivate.classList.remove('open');
    });
  }
  if (els.btnSubmitActivate) {
    els.btnSubmitActivate.addEventListener('click', () => {
      const key = els.activateKeyInput ? els.activateKeyInput.value.trim() : '';
      if (!key) {
        alert('Please enter your license key to activate.');
        return;
      }
      showToastNotification('✨ Smart Ease Pro Lifetime Offline License is Active!');
      if (els.modalActivate) els.modalActivate.classList.remove('open');
    });
  }

  // Floating HUD Prev / Next Layout Buttons
  if (els.btnHudPrevLayout) {
    els.btnHudPrevLayout.addEventListener('click', () => albumState.prevLayout());
  }
  if (els.btnHudNextLayout) {
    els.btnHudNextLayout.addEventListener('click', () => albumState.nextLayout());
  }

  // ==================== Interactive Canvas Mouse Scroll Zoom & Pan ====================
  if (els.canvasStage) {
    els.canvasStage.addEventListener('wheel', (e) => {
      // Don't intercept when scrolling over popover panels, top dock, modals, right inspector, floating layout horizontal scroll, or drawer
      if (
        e.target.closest('.dock-popover-panel') ||
        e.target.closest('.controls-popover-card') ||
        e.target.closest('.spread-top-dock') ||
        e.target.closest('.modal-backdrop') ||
        e.target.closest('.modal-window') ||
        e.target.closest('.frame-inspector-right') ||
        e.target.closest('.floating-layouts-scroll') ||
        e.target.closest('.layouts-drawer') ||
        e.target.closest('.bottom-filmstrip-dock')
      ) {
        return;
      }
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      setCanvasZoom(canvasZoomLevel * zoomFactor);
    }, { passive: false });

    // Interactive Stage Panning (drag background, middle-click, or Spacebar drag)
    let isStagePanning = false;
    let stagePanStart = { x: 0, y: 0 };
    let stagePanInitial = { x: 0, y: 0 };

    let isSpacePressed = false;
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        isSpacePressed = true;
        if (els.canvasStage) els.canvasStage.style.cursor = 'grab';
      }
    });
    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        isSpacePressed = false;
        if (els.canvasStage) els.canvasStage.style.cursor = '';
      }
    });

    els.canvasStage.addEventListener('mousedown', (e) => {
      const isMiddle = e.button === 1;
      const isSpace = isSpacePressed;
      const isDirectStageClick = e.target === els.canvasStage || e.target === els.canvasWrapper;

      if (isMiddle || isSpace || isDirectStageClick) {
        isStagePanning = true;
        stagePanStart = { x: e.clientX, y: e.clientY };
        stagePanInitial = { x: canvasPanX, y: canvasPanY };
        if (els.canvasStage) els.canvasStage.style.cursor = 'grabbing';
        e.preventDefault();
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!isStagePanning) return;
      const dx = e.clientX - stagePanStart.x;
      const dy = e.clientY - stagePanStart.y;
      canvasPanX = stagePanInitial.x + dx;
      canvasPanY = stagePanInitial.y + dy;
      applyCanvasZoom();
    });

    window.addEventListener('mouseup', () => {
      if (isStagePanning) {
        isStagePanning = false;
        if (els.canvasStage) els.canvasStage.style.cursor = isSpacePressed ? 'grab' : '';
      }
    });
  }

  if (els.btnZoomIn) {
    els.btnZoomIn.addEventListener('click', () => setCanvasZoom(canvasZoomLevel + 0.15));
  }
  if (els.btnZoomOut) {
    els.btnZoomOut.addEventListener('click', () => setCanvasZoom(canvasZoomLevel - 0.15));
  }
  if (els.btnZoomReset) {
    els.btnZoomReset.addEventListener('click', () => {
      canvasZoomLevel = 1.0;
      canvasPanX = 0;
      canvasPanY = 0;
      applyCanvasZoom();
    });
  }

  // ==================== Auto-Revealing Secondary Control Toolbar ====================
  let toolbarHideTimer = null;
  function showControlToolbar() {
    if (toolbarHideTimer) clearTimeout(toolbarHideTimer);
    if (els.controlToolbar) els.controlToolbar.classList.add('revealed');
  }

  function scheduleHideControlToolbar() {
    if (toolbarHideTimer) clearTimeout(toolbarHideTimer);
    toolbarHideTimer = setTimeout(() => {
      // Don't hide if a select or input is focused inside toolbar
      if (document.activeElement && els.controlToolbar && els.controlToolbar.contains(document.activeElement)) return;
      if (els.controlToolbar) els.controlToolbar.classList.remove('revealed');
    }, 450);
  }

  if (els.toolbarHoverTrigger) {
    els.toolbarHoverTrigger.addEventListener('mouseenter', showControlToolbar);
    els.toolbarHoverTrigger.addEventListener('click', () => {
      els.controlToolbar?.classList.toggle('revealed');
    });
  }

  if (els.controlToolbar) {
    els.controlToolbar.addEventListener('mouseenter', showControlToolbar);
    els.controlToolbar.addEventListener('mouseleave', scheduleHideControlToolbar);
  }

  // Reveal when cursor moves near top 56px of workspace
  document.addEventListener('mousemove', (e) => {
    if (e.clientY <= 56) {
      showControlToolbar();
    } else if (e.clientY > 115) {
      scheduleHideControlToolbar();
    }
  });

  // ==================== Unified Studio Aside Panels Manager ====================
  const topAsidePanels = [
    { id: 'dockControlsPanel', btnId: 'btnDockControls', closeBtnId: 'btnCloseDockControls' },
    { id: 'layoutsDrawer', btnId: 'btnDockSpreadLayout', closeBtnId: 'btnCloseDrawer', onOpen: () => openLayoutsCatalog() },
    { id: 'designLayoutAside', btnId: 'btnDockDesignLayout', closeBtnId: 'btnCloseDesignLayout' },
    { id: 'dockDrawShapesPanel', btnId: 'btnDrawFrame', closeBtnId: 'btnCloseDrawShapesPanel' },
    { id: 'textCharacterPanel', btnId: 'btnAddTextCanvas', closeBtnId: 'btnCloseTextEditor' },
    { id: 'varyAside', btnId: 'btnDockVary', closeBtnId: 'btnCloseVaryAside' }
  ];

  function closeAllAsidePanels() {
    topAsidePanels.forEach(({ id, btnId }) => {
      const panel = document.getElementById(id);
      const btn = document.getElementById(btnId);
      if (panel) panel.classList.remove('open');
      if (btn) {
        if (btnId === 'btnDrawFrame' && canvasRenderer?.drawNewFrameMode) {
          btn.classList.add('active');
        } else if (btnId === 'btnAddTextCanvas' && canvasRenderer?.activeTool === 'text') {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      }
    });
    if (canvasRenderer && typeof canvasRenderer.setHoverLayoutPreview === 'function') {
      canvasRenderer.setHoverLayoutPreview(null);
    }
  }
  window.closeAllAsidePanels = closeAllAsidePanels;

  function openAsidePanel(targetPanelId) {
    topAsidePanels.forEach(({ id, btnId, onOpen }) => {
      const panel = document.getElementById(id);
      const btn = document.getElementById(btnId);
      if (id === targetPanelId) {
        if (panel) panel.classList.add('open');
        if (btn) btn.classList.add('active');
        if (typeof onOpen === 'function') onOpen();
      } else {
        if (panel) panel.classList.remove('open');
        if (btn) {
          if (btnId === 'btnDrawFrame' && canvasRenderer?.drawNewFrameMode) {
            btn.classList.add('active');
          } else if (btnId === 'btnAddTextCanvas' && canvasRenderer?.activeTool === 'text') {
            btn.classList.add('active');
          } else {
            btn.classList.remove('active');
          }
        }
      }
    });
  }
  window.openAsidePanel = openAsidePanel;

  function toggleAsidePanel(targetPanelId) {
    const panel = document.getElementById(targetPanelId);
    const isOpen = panel && panel.classList.contains('open');
    if (isOpen) {
      closeAllAsidePanels();
    } else {
      openAsidePanel(targetPanelId);
    }
  }
  window.toggleAsidePanel = toggleAsidePanel;

  // Wire top buttons to toggle corresponding aside panels
  topAsidePanels.forEach(({ id, btnId, closeBtnId }) => {
    const btn = document.getElementById(btnId);
    if (btn && btnId !== 'btnAddTextCanvas') {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (btnId === 'btnDrawFrame') {
          const panel = document.getElementById(id);
          const isOpen = panel && panel.classList.contains('open');
          if (canvasRenderer?.drawNewFrameMode && !isOpen) {
            canvasRenderer.toggleDrawNewFrameMode(false);
            return;
          }
          canvasRenderer?.toggleDrawNewFrameMode(true);
        }
        toggleAsidePanel(id);
      });
    }

    const closeBtn = document.getElementById(closeBtnId);
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeAllAsidePanels();
      });
    }

    const panel = document.getElementById(id);
    if (panel) {
      panel.addEventListener('click', (e) => {
        e.stopPropagation();
      });
      panel.addEventListener('wheel', (e) => {
        e.stopPropagation();
      }, { passive: true });
    }
  });

  // Hide aside panels if user clicks anything else on the page
  document.addEventListener('pointerdown', (e) => {
    const openItem = topAsidePanels.find(({ id }) => {
      const p = document.getElementById(id);
      return p && p.classList.contains('open');
    });
    if (!openItem) return;

    const panel = document.getElementById(openItem.id);
    const btn = document.getElementById(openItem.btnId);

    // If click inside open panel or its toggle button, do not close
    if ((panel && panel.contains(e.target)) || (btn && btn.contains(e.target))) {
      return;
    }

    // Ignore clicks inside modal overlays / dialogues / color pickers
    if (e.target.closest('.modal') || e.target.closest('.modal-overlay') || e.target.closest('.dialog') || e.target.closest('.sp-container')) {
      return;
    }

    closeAllAsidePanels();
  });

  // Escape key closes open aside panel
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.code === 'Escape') {
      const hasOpen = topAsidePanels.some(({ id }) => {
        const p = document.getElementById(id);
        return p && p.classList.contains('open');
      });
      if (hasOpen) {
        closeAllAsidePanels();
      }
    }
  });

  // Actions in Design Layout Aside Panel
  const btnDesignShufflePhotos = document.getElementById('btnDesignShufflePhotos');
  if (btnDesignShufflePhotos) {
    btnDesignShufflePhotos.addEventListener('click', (e) => {
      e.stopPropagation();
      shufflePhotosOnActiveSpread();
    });
  }

  const btnDesignOpenAllLayouts = document.getElementById('btnDesignOpenAllLayouts');
  if (btnDesignOpenAllLayouts) {
    btnDesignOpenAllLayouts.addEventListener('click', (e) => {
      e.stopPropagation();
      openAsidePanel('layoutsDrawer');
    });
  }

  // Actions in Vary Aside Panel
  const btnVaryAsideShuffle = document.getElementById('btnVaryAsideShuffle');
  if (btnVaryAsideShuffle) {
    btnVaryAsideShuffle.addEventListener('click', (e) => {
      e.stopPropagation();
      shufflePhotosOnActiveSpread();
    });
  }

  const varyGapPresets = document.getElementById('varyGapPresets');
  if (varyGapPresets) {
    varyGapPresets.querySelectorAll('.aside-preset-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        const gap = parseInt(chip.dataset.gap, 10);
        if (els.gapSlider) {
          els.gapSlider.value = gap;
          els.gapSlider.dispatchEvent(new Event('input', { bubbles: true }));
          els.gapSlider.dispatchEvent(new Event('change', { bubbles: true }));
        }
        varyGapPresets.querySelectorAll('.aside-preset-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        if (window.showToastNotification) window.showToastNotification(`Gap set to ${gap}px`);
      });
    });
  }

  const varyMarginPresets = document.getElementById('varyMarginPresets');
  if (varyMarginPresets) {
    varyMarginPresets.querySelectorAll('.aside-preset-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        const margin = parseFloat(chip.dataset.margin);
        if (els.marginSlider) {
          els.marginSlider.value = margin;
          els.marginSlider.dispatchEvent(new Event('input', { bubbles: true }));
          els.marginSlider.dispatchEvent(new Event('change', { bubbles: true }));
        }
        varyMarginPresets.querySelectorAll('.aside-preset-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        if (window.showToastNotification) window.showToastNotification(`Margin set to ${margin}%`);
      });
    });
  }

  function shufflePhotosOnActiveSpread() {
    const spread = albumState.getActiveSpread();
    if (!spread || !spread.slots || spread.slots.length < 2) {
      if (window.showToastNotification) window.showToastNotification('Need at least 2 photos on spread to shuffle');
      return;
    }
    albumState.recordSnapshot();
    const photos = spread.slots.map(s => s.photo);
    for (let i = photos.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [photos[i], photos[j]] = [photos[j], photos[i]];
    }
    spread.slots.forEach((s, idx) => {
      s.photo = photos[idx];
    });
    albumState.notify('update');
    if (window.showToastNotification) window.showToastNotification('🔀 Shuffled photos across frames');
  }

  // --- Top Bar Action Buttons & Popovers ---

  // Text Presets in Add Text Popover
  function handleAddTextPreset(options) {
    closeAllAsidePanels();
    if (els.photoFramePreviewBar) els.photoFramePreviewBar.style.display = 'none';

    const spreadIdx = albumState.activeSpreadIndex;
    const newSlotIdx = albumState.addTextFrame(
      spreadIdx,
      options,
      canvasRenderer.displayWidth,
      canvasRenderer.displayHeight
    );
    canvasRenderer.selectedSlotIndex = newSlotIdx;
    canvasRenderer.selectedSlotIndices = new Set([newSlotIdx]);
    canvasRenderer.requestRender();
    if (typeof openTextEditorModal === 'function') {
      openTextEditorModal(spreadIdx, newSlotIdx);
    }
    showToastNotification('🔤 Text layer added! Double-click to edit typography.');
  }

  const btnPresetTitleText = document.getElementById('btnPresetTitleText');
  if (btnPresetTitleText) {
    btnPresetTitleText.addEventListener('click', (e) => {
      e.stopPropagation();
      handleAddTextPreset({
        text: 'Heading Title',
        fontSize: 36,
        fontFamily: 'Playfair Display, Georgia, serif',
        textColor: '#1e293b',
        textAlign: 'center',
        fontWeight: 'bold',
        fontStyle: 'normal'
      });
    });
  }

  const btnPresetSubtitleText = document.getElementById('btnPresetSubtitleText');
  if (btnPresetSubtitleText) {
    btnPresetSubtitleText.addEventListener('click', (e) => {
      e.stopPropagation();
      handleAddTextPreset({
        text: 'Subtitle or Chapter',
        fontSize: 22,
        fontFamily: 'Inter, -apple-system, sans-serif',
        textColor: '#334155',
        textAlign: 'center',
        fontWeight: '600',
        fontStyle: 'normal'
      });
    });
  }

  const btnPresetCaptionText = document.getElementById('btnPresetCaptionText');
  if (btnPresetCaptionText) {
    btnPresetCaptionText.addEventListener('click', (e) => {
      e.stopPropagation();
      handleAddTextPreset({
        text: 'A memorable caption or story...',
        fontSize: 16,
        fontFamily: 'Playfair Display, Georgia, serif',
        textColor: '#475569',
        textAlign: 'center',
        fontWeight: 'normal',
        fontStyle: 'italic'
      });
    });
  }

  const btnPresetDateText = document.getElementById('btnPresetDateText');
  if (btnPresetDateText) {
    btnPresetDateText.addEventListener('click', (e) => {
      e.stopPropagation();
      handleAddTextPreset({
        text: 'OCTOBER 2026 • PARIS, FRANCE',
        fontSize: 13,
        fontFamily: 'Inter, -apple-system, sans-serif',
        textColor: '#64748b',
        textAlign: 'center',
        letterSpacing: '2px',
        fontWeight: 'bold',
        fontStyle: 'normal'
      });
    });
  }

  // Vary Popover Actions
  const btnDockVaryAction = document.getElementById('btnDockVaryAction');
  if (btnDockVaryAction) {
    btnDockVaryAction.addEventListener('click', (e) => {
      e.stopPropagation();
      albumState.randomizeLayout();
      document.getElementById('dockVaryContainer')?.classList.remove('open');
    });
  }
  const btnDockSwitchLRAction = document.getElementById('btnDockSwitchLRAction');
  if (btnDockSwitchLRAction) {
    btnDockSwitchLRAction.addEventListener('click', (e) => {
      e.stopPropagation();
      if (typeof albumState.switchLeftRight === 'function') {
        albumState.switchLeftRight();
      }
      canvasRenderer.render(albumState.getActiveSpread());
      document.getElementById('dockVaryContainer')?.classList.remove('open');
    });
  }
  const btnDockNextLayoutAction = document.getElementById('btnDockNextLayoutAction');
  if (btnDockNextLayoutAction) {
    btnDockNextLayoutAction.addEventListener('click', (e) => {
      e.stopPropagation();
      albumState.nextLayout();
    });
  }
  const btnDockPrevLayoutAction = document.getElementById('btnDockPrevLayoutAction');
  if (btnDockPrevLayoutAction) {
    btnDockPrevLayoutAction.addEventListener('click', (e) => {
      e.stopPropagation();
      albumState.prevLayout();
    });
  }

  // Rulers Toggle Button
  const btnDockRulers = document.getElementById('btnDockRulers');
  if (btnDockRulers) {
    if (canvasRenderer && canvasRenderer.showRulers !== undefined) {
      btnDockRulers.classList.toggle('active', !!canvasRenderer.showRulers);
    }
    btnDockRulers.addEventListener('click', (e) => {
      e.stopPropagation();
      const isActive = !btnDockRulers.classList.contains('active');
      btnDockRulers.classList.toggle('active', isActive);
      canvasRenderer.toggleRulers(isActive);
    });
  }

  // Pointer Tool (Cursor) & Hand Tool (Mouse Hand / Pan)
  const btnToolSelect = document.getElementById('btnToolSelect');
  if (btnToolSelect) {
    btnToolSelect.addEventListener('click', (e) => {
      e.stopPropagation();
      canvasRenderer.setTool('select');
    });
  }
  const btnToolHand = document.getElementById('btnToolHand');
  if (btnToolHand) {
    btnToolHand.addEventListener('click', (e) => {
      e.stopPropagation();
      canvasRenderer.setTool('hand');
    });
  }
  const btnAddTextTool = document.getElementById('btnAddTextCanvas');
  if (btnAddTextTool) {
    btnAddTextTool.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      canvasRenderer.setTool('text');
    });
  }

  // Keyboard Shortcuts for Tools: V = Select, H = Hand, T = Text, D = Draw Frame, Escape = Exit
  window.addEventListener('keydown', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) return;
    if (e.key === 'v' || e.key === 'V') {
      canvasRenderer?.setTool('select');
    } else if (e.key === 'h' || e.key === 'H') {
      canvasRenderer?.setTool('hand');
    } else if (e.key === 't' || e.key === 'T') {
      canvasRenderer?.setTool('text');
    } else if (e.key === 'd' || e.key === 'D') {
      // Toggle Draw Frame mode
      if (canvasRenderer?.drawNewFrameMode) {
        canvasRenderer.toggleDrawNewFrameMode(false);
        closeAllAsidePanels();
      } else {
        canvasRenderer?.toggleDrawNewFrameMode(true);
        openAsidePanel('dockDrawShapesPanel');
      }
    } else if (e.key === 'Escape') {
      canvasRenderer?.setTool('select');
      // Exit draw mode if active, otherwise deselect all frames, close panels
      if (canvasRenderer?.drawNewFrameMode) {
        canvasRenderer.toggleDrawNewFrameMode(false);
        closeAllAsidePanels();
      } else {
        // Close any open aside panel
        const openItem = topAsidePanels.find(({ id }) => {
          const p = document.getElementById(id);
          return p && p.classList.contains('open');
        });
        if (openItem) {
          closeAllAsidePanels();
        } else if (canvasRenderer?.selectedSlotIndex !== null) {
          // Deselect all frames
          canvasRenderer.selectedSlotIndex = null;
          canvasRenderer.selectedSlotIndices.clear();
          canvasRenderer.albumState.notify('slot-deselected');
          canvasRenderer.requestRender();
        }
      }
    } else if ((e.key === '[' || e.key === ']') && (e.ctrlKey || e.metaKey)) {
      // Ctrl+] / Ctrl+[ for layer ordering
      e.preventDefault();
      const idx = canvasRenderer?.selectedSlotIndex;
      if (idx === null || idx === undefined) return;
      const spread = albumState.getActiveSpread();
      if (!spread?.slots?.length) return;
      albumState.recordSnapshot();
      if (e.key === ']' && e.shiftKey) {
        // Ctrl+Shift+] = Bring to Front
        albumState.bringToFront(albumState.activeSpreadIndex, idx);
        showToastNotification('⤉ Frame brought to front');
      } else if (e.key === ']') {
        // Ctrl+] = Bring Forward
        albumState.bringForward(albumState.activeSpreadIndex, idx);
        showToastNotification('⤒ Frame brought forward');
      } else if (e.key === '[' && e.shiftKey) {
        // Ctrl+Shift+[ = Send to Back
        albumState.sendToBack(albumState.activeSpreadIndex, idx);
        showToastNotification('⤈ Frame sent to back');
      } else if (e.key === '[') {
        // Ctrl+[ = Send Backward
        albumState.sendBackward(albumState.activeSpreadIndex, idx);
        showToastNotification('⤓ Frame sent backward');
      }
      canvasRenderer?.requestRender();
    } else if ((e.key === 'a' || e.key === 'A') && (e.ctrlKey || e.metaKey)) {
      // Ctrl+A = Select all frames on current spread
      e.preventDefault();
      const spread = albumState.getActiveSpread();
      if (!spread?.slots?.length) return;
      canvasRenderer.selectedSlotIndices = new Set(spread.slots.map(s => s.slotIndex));
      canvasRenderer.selectedSlotIndex = spread.slots[0].slotIndex;
      canvasRenderer.albumState.notify('slots-selected', {
        spreadIndex: albumState.activeSpreadIndex,
        slotIndices: Array.from(canvasRenderer.selectedSlotIndices)
      });
      showToastNotification(`🎯 Selected all ${spread.slots.length} frames`);
      canvasRenderer.requestRender();
    }
  });

  // Undo Curved Arrow Button
  const btnDockUndo = document.getElementById('btnDockUndo');
  if (btnDockUndo) {
    btnDockUndo.disabled = albumState.undoStack.length === 0;
    btnDockUndo.addEventListener('click', (e) => {
      e.stopPropagation();
      albumState.undo();
      updateUndoRedoButtons();
      updateLiveTransformReadouts();
    });
  }

  // Redo Curved Arrow Button
  const btnDockRedo = document.getElementById('btnDockRedo');
  if (btnDockRedo) {
    btnDockRedo.disabled = albumState.redoStack.length === 0;
    btnDockRedo.addEventListener('click', (e) => {
      e.stopPropagation();
      albumState.redo();
      updateUndoRedoButtons();
      updateLiveTransformReadouts();
    });
  }

  // Alignment Controls in Topbar
  function alignCurrentSlot(type) {
    const spread = albumState?.getActiveSpread();
    if (!spread || !spread.slots || spread.slots.length === 0) return;

    let targetSlotIndices = [];
    if (canvasRenderer?.selectedSlotIndices && canvasRenderer.selectedSlotIndices.size > 0) {
      targetSlotIndices = Array.from(canvasRenderer.selectedSlotIndices);
    } else if (canvasRenderer?.selectedSlotIndex !== null && canvasRenderer?.selectedSlotIndex !== undefined) {
      targetSlotIndices = [canvasRenderer.selectedSlotIndex];
    }

    if (targetSlotIndices.length === 0) {
      showToastNotification('⚠️ Please click or drag to select frame(s) to align');
      return;
    }

    const rects = canvasRenderer.cachedRectangles;
    if (!rects || rects.length === 0) return;

    albumState.recordSnapshot();

    const selectedRects = targetSlotIndices.map(idx => rects.find(r => r.slotIndex === idx)).filter(Boolean);
    if (selectedRects.length === 0) return;

    const canvasW = canvasRenderer.displayWidth;
    const canvasH = canvasRenderer.displayHeight;

    if (selectedRects.length > 1) {
      // Multi-selection: align relative to group bounding box
      const minX = Math.min(...selectedRects.map(r => r.x));
      const maxX = Math.max(...selectedRects.map(r => r.x + r.width));
      const minY = Math.min(...selectedRects.map(r => r.y));
      const maxY = Math.max(...selectedRects.map(r => r.y + r.height));
      const groupCenterX = (minX + maxX) / 2;
      const groupCenterY = (minY + maxY) / 2;

      selectedRects.forEach(r => {
        let newX = r.x;
        let newY = r.y;
        if (type === 'left') newX = minX;
        else if (type === 'centerH') newX = groupCenterX - r.width / 2;
        else if (type === 'right') newX = maxX - r.width;
        else if (type === 'top') newY = minY;
        else if (type === 'middleV') newY = groupCenterY - r.height / 2;
        else if (type === 'bottom') newY = maxY - r.height;

        albumState.updateSlotPixelRect(albumState.activeSpreadIndex, r.slotIndex, {
          x: Math.round(newX),
          y: Math.round(newY),
          width: r.width,
          height: r.height,
          rotation: r.rotation || 0
        }, canvasW, canvasH);
      });
      showToastNotification(`✓ Aligned ${selectedRects.length} frames (${type})`);
    } else {
      // Single selection: align relative to page/spread bounds
      const r = selectedRects[0];
      const marginPx = Math.round(canvasW * 0.02);
      let newX = r.x;
      let newY = r.y;

      const isSpread = (albumState.project.pageMode !== 'single');
      const centerX = canvasW / 2;

      if (type === 'left') {
        if (isSpread && r.x >= centerX) newX = centerX + marginPx;
        else newX = marginPx;
      } else if (type === 'centerH') {
        if (isSpread) {
          if (r.x + r.width / 2 < centerX) newX = (centerX - r.width) / 2;
          else newX = centerX + (centerX - r.width) / 2;
        } else {
          newX = (canvasW - r.width) / 2;
        }
      } else if (type === 'right') {
        if (isSpread && r.x + r.width <= centerX) newX = centerX - marginPx - r.width;
        else newX = canvasW - marginPx - r.width;
      } else if (type === 'top') {
        newY = marginPx;
      } else if (type === 'middleV') {
        newY = (canvasH - r.height) / 2;
      } else if (type === 'bottom') {
        newY = canvasH - marginPx - r.height;
      }

      albumState.updateSlotPixelRect(albumState.activeSpreadIndex, r.slotIndex, {
        x: Math.round(newX),
        y: Math.round(newY),
        width: r.width,
        height: r.height,
        rotation: r.rotation || 0
      }, canvasW, canvasH);
      showToastNotification(`✓ Frame aligned (${type})`);
    }

    canvasRenderer?.requestRender();
    updateLiveTransformReadouts();
    if (typeof debouncedRenderFilmstrip === 'function') debouncedRenderFilmstrip();
  }

  document.getElementById('btnAlignLeft')?.addEventListener('click', (e) => {
    e.stopPropagation();
    alignCurrentSlot('left');
  });
  document.getElementById('btnAlignCenterH')?.addEventListener('click', (e) => {
    e.stopPropagation();
    alignCurrentSlot('centerH');
  });
  document.getElementById('btnAlignRight')?.addEventListener('click', (e) => {
    e.stopPropagation();
    alignCurrentSlot('right');
  });
  document.getElementById('btnAlignTop')?.addEventListener('click', (e) => {
    e.stopPropagation();
    alignCurrentSlot('top');
  });
  document.getElementById('btnAlignMiddleV')?.addEventListener('click', (e) => {
    e.stopPropagation();
    alignCurrentSlot('middleV');
  });
  document.getElementById('btnAlignBottom')?.addEventListener('click', (e) => {
    e.stopPropagation();
    alignCurrentSlot('bottom');
  });

  // Distribute Horizontally & Vertically (equal spacing between selected frames)
  function distributeFrames(axis) {
    const spread = albumState?.getActiveSpread();
    if (!spread || !spread.slots || spread.slots.length === 0) return;

    let targetSlotIndices = [];
    if (canvasRenderer?.selectedSlotIndices && canvasRenderer.selectedSlotIndices.size > 0) {
      targetSlotIndices = Array.from(canvasRenderer.selectedSlotIndices);
    } else if (canvasRenderer?.selectedSlotIndex !== null && canvasRenderer?.selectedSlotIndex !== undefined) {
      targetSlotIndices = [canvasRenderer.selectedSlotIndex];
    }

    if (targetSlotIndices.length < 3) {
      showToastNotification('⚠️ Select at least 3 frames to distribute evenly');
      return;
    }

    const rects = canvasRenderer.cachedRectangles;
    if (!rects || rects.length === 0) return;

    albumState.recordSnapshot();

    const selectedRects = targetSlotIndices.map(idx => rects.find(r => r.slotIndex === idx)).filter(Boolean);
    if (selectedRects.length < 3) return;

    const canvasW = canvasRenderer.displayWidth;
    const canvasH = canvasRenderer.displayHeight;

    if (axis === 'horizontal') {
      selectedRects.sort((a, b) => a.x - b.x);
      const first = selectedRects[0];
      const last = selectedRects[selectedRects.length - 1];
      const totalSpace = (last.x + last.width) - first.x;
      const totalWidths = selectedRects.reduce((sum, r) => sum + r.width, 0);
      const gap = (totalSpace - totalWidths) / (selectedRects.length - 1);
      let currentX = first.x;
      selectedRects.forEach((r, i) => {
        albumState.updateSlotPixelRect(albumState.activeSpreadIndex, r.slotIndex, {
          x: Math.round(currentX),
          y: r.y,
          width: r.width,
          height: r.height,
          rotation: r.rotation || 0
        }, canvasW, canvasH);
        currentX += r.width + gap;
      });
    } else {
      selectedRects.sort((a, b) => a.y - b.y);
      const first = selectedRects[0];
      const last = selectedRects[selectedRects.length - 1];
      const totalSpace = (last.y + last.height) - first.y;
      const totalHeights = selectedRects.reduce((sum, r) => sum + r.height, 0);
      const gap = (totalSpace - totalHeights) / (selectedRects.length - 1);
      let currentY = first.y;
      selectedRects.forEach((r, i) => {
        albumState.updateSlotPixelRect(albumState.activeSpreadIndex, r.slotIndex, {
          x: r.x,
          y: Math.round(currentY),
          width: r.width,
          height: r.height,
          rotation: r.rotation || 0
        }, canvasW, canvasH);
        currentY += r.height + gap;
      });
    }

    showToastNotification(`✓ ${selectedRects.length} frames distributed (${axis})`);
    canvasRenderer?.requestRender();
    updateLiveTransformReadouts();
    if (typeof debouncedRenderFilmstrip === 'function') debouncedRenderFilmstrip();
  }

  document.getElementById('btnDockDistributeH')?.addEventListener('click', (e) => {
    e.stopPropagation();
    distributeFrames('horizontal');
  });
  document.getElementById('btnDockDistributeV')?.addEventListener('click', (e) => {
    e.stopPropagation();
    distributeFrames('vertical');
  });

  // Live Transform Readouts
  function updateLiveTransformReadouts() {
    const lblX = document.getElementById('lblOptX');
    const lblY = document.getElementById('lblOptY');
    const lblW = document.getElementById('lblOptW');
    const lblH = document.getElementById('lblOptH');
    const lblRot = document.getElementById('lblOptRot');
    if (!lblX || !lblY || !lblW || !lblH || !lblRot) return;

    const spread = albumState?.getActiveSpread();
    const sIdx = canvasRenderer?.selectedSlotIndex;
    const baseW = 2400;
    const baseH = 1200;

    if (!spread || sIdx === null || sIdx === undefined || !spread.slots) {
      lblX.textContent = '0 px';
      lblY.textContent = '0 px';
      lblW.textContent = `${baseW} px`;
      lblH.textContent = `${baseH} px`;
      lblRot.textContent = '0°';
      return;
    }

    const slot = spread.slots.find(s => s.slotIndex === sIdx) || spread.slots[sIdx];
    if (!slot) {
      lblX.textContent = '0 px';
      lblY.textContent = '0 px';
      lblW.textContent = `${baseW} px`;
      lblH.textContent = `${baseH} px`;
      lblRot.textContent = '0°';
      return;
    }

    const pxX = Math.round((slot.x || 0) * baseW);
    const pxY = Math.round((slot.y || 0) * baseH);
    const pxW = Math.round((slot.width || 0.2) * baseW);
    const pxH = Math.round((slot.height || 0.3) * baseH);
    const rot = slot.rotation || 0;

    lblX.textContent = `${pxX} px`;
    lblY.textContent = `${pxY} px`;
    lblW.textContent = `${pxW} px`;
    lblH.textContent = `${pxH} px`;
    lblRot.textContent = `${rot}°`;
  }
  window.updateLiveTransformReadouts = updateLiveTransformReadouts;
  updateLiveTransformReadouts();

  // Foreground & Background Color Swatches
  const btnSwap = document.getElementById('btnSwapColors');
  const inFg = document.getElementById('inputFgColor');
  const inBg = document.getElementById('inputBgColor');
  const swFg = document.getElementById('swatchForeground');
  const swBg = document.getElementById('swatchBackground');

  if (btnSwap && inFg && inBg) {
    btnSwap.addEventListener('click', (e) => {
      e.stopPropagation();
      const tmp = inFg.value;
      inFg.value = inBg.value;
      inBg.value = tmp;
      if (swFg) swFg.style.backgroundColor = inFg.value;
      if (swBg) swBg.style.backgroundColor = inBg.value;
    });

    inFg.addEventListener('input', () => {
      if (swFg) swFg.style.backgroundColor = inFg.value;
      const spread = albumState?.getActiveSpread();
      const sIdx = canvasRenderer?.selectedSlotIndex;
      if (spread && sIdx !== null && spread.slots) {
        const slot = spread.slots.find(s => s.slotIndex === sIdx) || spread.slots[sIdx];
        if (slot) {
          if (slot.isText) slot.color = inFg.value;
          else slot.fillColor = inFg.value;
          canvasRenderer?.requestRender();
        }
      }
    });

    inBg.addEventListener('input', () => {
      if (swBg) swBg.style.backgroundColor = inBg.value;
      const spread = albumState?.getActiveSpread();
      const sIdx = canvasRenderer?.selectedSlotIndex;
      if (spread && sIdx !== null && spread.slots) {
        const slot = spread.slots.find(s => s.slotIndex === sIdx) || spread.slots[sIdx];
        if (slot) {
          slot.strokeColor = inBg.value;
          canvasRenderer?.requestRender();
          return;
        }
      }
      if (spread) {
        spread.backgroundColor = inBg.value;
        canvasRenderer?.requestRender();
      }
    });
  }

  // Zoom Popover Options
  const dockZoomPanel = document.getElementById('dockZoomPanel');
  if (dockZoomPanel) {
    dockZoomPanel.querySelectorAll('[data-topbar-zoom]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const val = btn.getAttribute('data-topbar-zoom');
        if (val === 'fit') {
          setCanvasZoom(1.0);
        } else {
          setCanvasZoom(parseFloat(val));
        }
        document.getElementById('dockZoomContainer')?.classList.remove('open');
      });
    });
  }

  // Settings Gear Button
  const btnDockSettings = document.getElementById('btnDockSettings');
  if (btnDockSettings) {
    btnDockSettings.addEventListener('click', (e) => {
      e.stopPropagation();
      if (els.modalSettings) {
        els.modalSettings.classList.add('open');
      }
    });
  }

  // When clicked, options stay open until the user clicks anywhere outside
  document.addEventListener('click', (e) => {
    dockContainers.forEach(d => {
      if (d.container && !d.container.contains(e.target)) {
        d.container.classList.remove('open');
      }
    });
  });

  // ==================== Profile Menu & Dropdown Modals ====================
  if (els.btnProfileMenu) {
    els.btnProfileMenu.addEventListener('click', (e) => {
      e.stopPropagation();
      els.profileMenuContainer?.classList.toggle('open');
    });
  }

  document.addEventListener('click', (e) => {
    if (els.profileMenuContainer && !els.profileMenuContainer.contains(e.target)) {
      els.profileMenuContainer.classList.remove('open');
    }
  });

  // Settings
  if (els.btnProfileSettings) {
    els.btnProfileSettings.addEventListener('click', () => {
      els.profileMenuContainer?.classList.remove('open');
      els.modalSettings?.classList.add('open');
    });
  }
  if (els.btnCloseSettings) els.btnCloseSettings.addEventListener('click', () => els.modalSettings?.classList.remove('open'));
  if (els.btnSaveSettings) {
    els.btnSaveSettings.addEventListener('click', () => {
      els.modalSettings?.classList.remove('open');
      showToastNotification('⚙️ Application preferences saved!');
    });
  }

  // Gmail / Email Support
  if (els.btnProfileGmail) {
    els.btnProfileGmail.addEventListener('click', () => {
      els.profileMenuContainer?.classList.remove('open');
      window.open('mailto:studio.pro@smartease.app?subject=Smart%20Ease%20Studio%20Support%20Request', '_blank');
      showToastNotification('📧 Opening Email Support: studio.pro@smartease.app');
    });
  }

  // Subscription
  if (els.btnProfileSubscription) {
    els.btnProfileSubscription.addEventListener('click', () => {
      els.profileMenuContainer?.classList.remove('open');
      els.modalSubscription?.classList.add('open');
    });
  }
  if (els.btnCloseSubscription) els.btnCloseSubscription.addEventListener('click', () => els.modalSubscription?.classList.remove('open'));
  if (els.btnOkSubscription) els.btnOkSubscription.addEventListener('click', () => els.modalSubscription?.classList.remove('open'));

  // Login / Switch Account
  if (els.btnProfileLogin) {
    els.btnProfileLogin.addEventListener('click', () => {
      els.profileMenuContainer?.classList.remove('open');
      els.modalLogin?.classList.add('open');
    });
  }
  if (els.btnCloseLogin) els.btnCloseLogin.addEventListener('click', () => els.modalLogin?.classList.remove('open'));
  if (els.btnCancelLogin) els.btnCancelLogin.addEventListener('click', () => els.modalLogin?.classList.remove('open'));
  if (els.btnSubmitLogin) {
    els.btnSubmitLogin.addEventListener('click', () => {
      const email = els.loginEmailInput ? els.loginEmailInput.value : 'studio.pro@smartease.app';
      if (els.profileEmailDisplay) els.profileEmailDisplay.textContent = email;
      if (els.profileUserDisplay) els.profileUserDisplay.textContent = email.split('@')[0];
      els.modalLogin?.classList.remove('open');
      showToastNotification(`👤 Signed in as ${email}`);
    });
  }

  // Logout
  if (els.btnProfileLogout) {
    els.btnProfileLogout.addEventListener('click', () => {
      els.profileMenuContainer?.classList.remove('open');
      if (confirm('Are you sure you want to sign out?')) {
        showToastNotification('👋 Signed out of Smart Ease');
      }
    });
  }

  // About Us
  if (els.btnProfileAboutUs) {
    els.btnProfileAboutUs.addEventListener('click', () => {
      els.profileMenuContainer?.classList.remove('open');
      els.modalAboutUs?.classList.add('open');
    });
  }
  if (els.btnCloseAboutUs) els.btnCloseAboutUs.addEventListener('click', () => els.modalAboutUs?.classList.remove('open'));
  if (els.btnOkAboutUs) els.btnOkAboutUs.addEventListener('click', () => els.modalAboutUs?.classList.remove('open'));

  // Export Modal
  function syncExportDimensionsBadge() {
    if (!els.exportSpreadDimensionsBadge) return;
    const sheetW = albumState.getSheetWidthInches();
    const sheetH = albumState.getSheetHeightInches();
    const dpi = parseInt(els.exportDpiSelect?.value, 10) || 300;
    const format = els.exportFormatSelect?.value || 'pdf';
    const layoutMode = els.exportLayoutModeSelect ? els.exportLayoutModeSelect.value : 'sheet';
    const isSingleSplit = layoutMode === 'single' && albumState.project.pageMode === 'spread';

    // Toggle Single-Page PDF Margin / Slug option container (only visible when PDF + Single Page are active)
    const showSlugOption = (format === 'pdf' && isSingleSplit);
    if (els.exportSinglePageMarginGroup) {
      els.exportSinglePageMarginGroup.style.display = showSlugOption ? 'block' : 'none';
    }

    const hasSlug = Boolean(showSlugOption && els.chkPdfPageLabels && els.chkPdfPageLabels.checked);
    const slugWidth = hasSlug ? 0.096 : 0;
    
    const outW = isSingleSplit ? ((sheetW / 2) + slugWidth) : sheetW;
    const outH = sheetH;
    const pxW = Math.round(outW * dpi);
    const pxH = Math.round(outH * dpi);
    let unitLabel = isSingleSplit ? 'Single Page' : 'Full Spread';
    if (hasSlug) unitLabel += ' (+0.096" Margin)';
    
    els.exportSpreadDimensionsBadge.textContent = `${outW.toFixed(2)}" × ${outH.toFixed(1)}" (${unitLabel})`;
    if (els.exportResolutionDetail) {
      els.exportResolutionDetail.textContent = hasSlug
        ? `${pxW.toLocaleString()} × ${pxH.toLocaleString()} px per single page @ ${dpi} DPI (including 0.096" outer margin)`
        : `${pxW.toLocaleString()} × ${pxH.toLocaleString()} px per ${unitLabel.toLowerCase()} @ ${dpi} DPI`;
    }
  }

  // Export Scope Controller (All / Current / Selected Section)
  let currentExportScope = 'all';
  const btnScopeAll = document.getElementById('btnScopeAll');
  const btnScopeCurrent = document.getElementById('btnScopeCurrent');
  const btnScopeSelected = document.getElementById('btnScopeSelected');
  const exportScopeSummaryText = document.getElementById('exportScopeSummaryText');
  const exportCustomRangeWrapper = document.getElementById('exportCustomRangeWrapper');
  const exportCustomRangeInput = document.getElementById('exportCustomRangeInput');

  function parseSpreadRangeInput(text, maxCount) {
    if (!text || !text.trim()) return [];
    const parts = text.split(/[,;\s]+/);
    const result = new Set();
    parts.forEach(part => {
      part = part.trim();
      if (!part) return;
      if (part.includes('-')) {
        const [startStr, endStr] = part.split('-');
        const s = parseInt(startStr, 10);
        const e = parseInt(endStr, 10);
        if (!isNaN(s) && !isNaN(e)) {
          for (let i = Math.min(s, e); i <= Math.max(s, e); i++) {
            if (i >= 1 && i <= maxCount) result.add(i - 1);
          }
        }
      } else {
        const num = parseInt(part, 10);
        if (!isNaN(num) && num >= 1 && num <= maxCount) {
          result.add(num - 1);
        }
      }
    });
    return Array.from(result).sort((a, b) => a - b);
  }

  function updateExportScopeUI() {
    const total = albumState.project?.spreads?.length || 0;
    btnScopeAll?.classList.toggle('active', currentExportScope === 'all');
    btnScopeCurrent?.classList.toggle('active', currentExportScope === 'current');
    btnScopeSelected?.classList.toggle('active', currentExportScope === 'selected');

    if (exportCustomRangeWrapper) {
      exportCustomRangeWrapper.style.display = (currentExportScope === 'selected') ? 'block' : 'none';
    }

    if (exportScopeSummaryText) {
      if (currentExportScope === 'all') {
        exportScopeSummaryText.textContent = `🌐 Exporting all ${total} spreads (Complete Album)`;
      } else if (currentExportScope === 'current') {
        const curr = (albumState.activeSpreadIndex || 0) + 1;
        exportScopeSummaryText.textContent = `📄 Exporting current spread ${curr} of ${total}`;
      } else if (currentExportScope === 'selected') {
        const selectedList = Array.from(selectedSpreadIndices).sort((a, b) => a - b);
        const humanList = selectedList.map(i => i + 1).join(', ');
        exportScopeSummaryText.textContent = `📑 Exporting ${selectedList.length} selected spread${selectedList.length > 1 ? 's' : ''} (${humanList ? 'Spread ' + humanList : 'None'})`;
        if (exportCustomRangeInput && document.activeElement !== exportCustomRangeInput) {
          exportCustomRangeInput.value = humanList;
        }
      }
    }
  }

  if (btnScopeAll) btnScopeAll.addEventListener('click', () => { currentExportScope = 'all'; updateExportScopeUI(); });
  if (btnScopeCurrent) btnScopeCurrent.addEventListener('click', () => { currentExportScope = 'current'; updateExportScopeUI(); });
  if (btnScopeSelected) btnScopeSelected.addEventListener('click', () => { currentExportScope = 'selected'; updateExportScopeUI(); });
  if (exportCustomRangeInput) {
    exportCustomRangeInput.addEventListener('input', () => {
      const parsed = parseSpreadRangeInput(exportCustomRangeInput.value, albumState.project?.spreads?.length || 0);
      if (exportScopeSummaryText) {
        exportScopeSummaryText.textContent = `📑 Exporting ${parsed.length} custom spread${parsed.length !== 1 ? 's' : ''} (${parsed.map(i => i + 1).join(', ') || 'None'})`;
      }
    });
  }

  let selectedExportDirHandle = null;
  let selectedExportDirPath = null;

  if (els.btnBrowseExportDir) {
    els.btnBrowseExportDir.addEventListener('click', async () => {
      // 1. First try native backend folder picker if available (desktop app)
      try {
        const resp = await fetch('/api/pick_folder');
        const data = await resp.json();
        if (data && data.folder) {
          selectedExportDirPath = data.folder;
          selectedExportDirHandle = null;
          if (els.exportDestinationPath) {
            els.exportDestinationPath.value = data.folder;
          }
          if (els.exportDirStatusBadge) {
            els.exportDirStatusBadge.textContent = '✓ Folder Linked';
          }
          showToastNotification(`📁 Export destination set to: "${data.folder}"`);
          return;
        }
      } catch (e) {}

      // 2. Fallback to browser showDirectoryPicker
      if (window.showDirectoryPicker) {
        try {
          const dirHandle = await window.showDirectoryPicker({
            mode: 'readwrite'
          });
          selectedExportDirHandle = dirHandle;
          selectedExportDirPath = null;
          if (els.exportDestinationPath) {
            els.exportDestinationPath.value = dirHandle.name;
          }
          if (els.exportDirStatusBadge) {
            els.exportDirStatusBadge.textContent = '✓ Folder Linked';
          }
          showToastNotification(`📁 Export destination set to folder: "${dirHandle.name}"`);
        } catch (err) {
          if (err.name === 'AbortError') return;
          console.warn('Directory picker failed:', err);
        }
      } else {
        alert('Your browser does not support folder picker. Exports will be saved to your browser downloads.');
      }
    });
  }

  if (els.exportDestinationPath) {
    els.exportDestinationPath.addEventListener('click', () => {
      els.btnBrowseExportDir?.click();
    });
  }

  if (els.btnExport) {
    els.btnExport.addEventListener('click', () => {
      syncExportDimensionsBadge();
      updateExportScopeUI();
      if (els.exportSubfolderNamePreview) {
        els.exportSubfolderNamePreview.textContent = `${albumState.project.title.replace(/\s+/g, '_')}_Exports`;
      }
      if (els.exportPdfProjectName) {
        els.exportPdfProjectName.value = albumState.project.title || '';
      }
      if (els.modalExport) els.modalExport.classList.add('open');
      if (els.exportProgressBox) els.exportProgressBox.style.display = 'none';
      if (els.exportProgressBar) els.exportProgressBar.style.width = '0%';
    });
  }
  if (els.exportFormatSelect) els.exportFormatSelect.addEventListener('change', syncExportDimensionsBadge);
  if (els.exportDpiSelect) els.exportDpiSelect.addEventListener('change', syncExportDimensionsBadge);
  if (els.exportLayoutModeSelect) els.exportLayoutModeSelect.addEventListener('change', syncExportDimensionsBadge);
  if (els.chkPdfPageLabels) els.chkPdfPageLabels.addEventListener('change', syncExportDimensionsBadge);
  if (els.btnCloseExport) els.btnCloseExport.addEventListener('click', () => els.modalExport?.classList.remove('open'));
  if (els.btnCancelExport) els.btnCancelExport.addEventListener('click', () => els.modalExport?.classList.remove('open'));

  if (els.btnStartExport) {
    els.btnStartExport.addEventListener('click', async () => {
      const format = els.exportFormatSelect.value;
      const layoutMode = els.exportLayoutModeSelect ? els.exportLayoutModeSelect.value : 'sheet';
      const dpi = parseInt(els.exportDpiSelect.value, 10) || 300;
      const totalSpreads = albumState.project?.spreads?.length || 0;

      let targetIndices = null;
      if (currentExportScope === 'current') {
        targetIndices = [albumState.activeSpreadIndex];
      } else if (currentExportScope === 'selected') {
        const customVal = exportCustomRangeInput?.value;
        const parsed = parseSpreadRangeInput(customVal, totalSpreads);
        if (parsed.length > 0) {
          targetIndices = parsed;
        } else {
          targetIndices = Array.from(selectedSpreadIndices);
        }
      }

      const destinationOptions = {
        dirHandle: selectedExportDirHandle,
        createSubfolder: Boolean(els.chkExportCreateFolder && els.chkExportCreateFolder.checked),
        subfolderName: `${albumState.project.title.replace(/\s+/g, '_')}_Exports`
      };

      els.btnStartExport.disabled = true;
      els.exportProgressBox.style.display = 'flex';
      els.exportProgressBar.style.width = '5%';
      els.exportProgressStatus.textContent = 'Preparing render engine...';

      const onProgress = (current, total, statusText = '') => {
        const pct = Math.round((current / total) * 100);
        els.exportProgressBar.style.width = pct + '%';
        els.exportProgressStatus.textContent = statusText || `Rendering spread ${current} of ${total}...`;
      };

      try {
        const isPng = (format === 'pngs');
        const imgMime = isPng ? 'image/png' : 'image/jpeg';

        if (format === 'pdf') {
          const addPageLabels = Boolean(layoutMode === 'single' && els.chkPdfPageLabels && els.chkPdfPageLabels.checked);
          const projectName = (els.exportPdfProjectName?.value || albumState.project.title || 'ALBUM').trim();
          await exporter.exportAlbumPDF(dpi, layoutMode, onProgress, targetIndices, destinationOptions, {
            addPageLabels,
            projectName
          });
        } else if (format === 'jpegs' || format === 'pngs') {
          if (targetIndices && targetIndices.length === 1 && currentExportScope === 'current') {
            await exporter.exportCurrentSpreadImage(imgMime, 0.95, dpi, layoutMode, destinationOptions);
          } else {
            await exporter.exportAllSpreadsImages(imgMime, 0.95, dpi, layoutMode, onProgress, targetIndices, destinationOptions);
          }
        }
        els.exportProgressStatus.textContent = (selectedExportDirPath || selectedExportDirHandle)
          ? `✓ Saved directly into folder: ${selectedExportDirPath || selectedExportDirHandle.name}`
          : 'Export completed successfully!';

        // Play export completion audio chime notification
        playExportCompleteSound();

        // Automatically open export folder in Windows Explorer once after export
        try {
          await fetch('/api/open_folder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ folder: selectedExportDirPath || '' })
          });
        } catch (e) {
          console.warn('Could not auto-open export folder:', e);
        }

        setTimeout(() => {
          els.modalExport?.classList.remove('open');
          els.btnStartExport.disabled = false;
        }, 1200);
      } catch (err) {
        console.error(err);
        alert('Error during export: ' + err.message);
        els.btnStartExport.disabled = false;
      }
    });
  }

  // ==================== Canvas & Filmstrip Context Menus ====================
  function hideCanvasContextMenu() {
    if (els.canvasContextMenu) {
      els.canvasContextMenu.style.display = 'none';
    }
  }

  let filmstripContextMenuTargetIndex = null;
  function hideFilmstripContextMenu() {
    if (els.filmstripContextMenu) {
      els.filmstripContextMenu.style.display = 'none';
    }
    filmstripContextMenuTargetIndex = null;
  }

  function showFilmstripContextMenu(clientX, clientY, spreadIdx) {
    filmstripContextMenuTargetIndex = spreadIdx;
    const menu = els.filmstripContextMenu;
    if (menu) {
      menu.style.display = 'flex';
      const menuW = 230;
      const menuH = 130;
      const posX = Math.min(window.innerWidth - menuW - 12, Math.max(10, clientX));
      const posY = Math.min(window.innerHeight - menuH - 12, Math.max(10, clientY - 95));
      menu.style.left = posX + 'px';
      menu.style.top = posY + 'px';
    }
  }

  window.addEventListener('click', (e) => {
    if (els.canvasContextMenu && !els.canvasContextMenu.contains(e.target)) {
      hideCanvasContextMenu();
    }
    if (els.filmstripContextMenu && !els.filmstripContextMenu.contains(e.target)) {
      hideFilmstripContextMenu();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideCanvasContextMenu();
      hideFilmstripContextMenu();
    }
  });

  if (canvasRenderer && canvasRenderer.canvas) {
    let lastRightClickTime = 0;
    let lastRightClickPos = { x: 0, y: 0 };

    function handleFrameContextMenu(e, isDblClick = false) {
      e.preventDefault();
      e.stopPropagation();
      hideFilmstripContextMenu();

      const pos = canvasRenderer._getCanvasCoords(e);
      const hit = canvasRenderer._getSlotAt(pos.x, pos.y, false);
      const spread = albumState.getActiveSpread();

      if (hit) {
        // Select right-clicked slot
        canvasRenderer.selectedSlotIndex = hit.slotIndex;
        if (canvasRenderer.selectedSlotIndices) {
          canvasRenderer.selectedSlotIndices = new Set([hit.slotIndex]);
        }
        canvasRenderer.requestRender();
        updatePreviewBarForSlot(hit.slotIndex);
      } else {
        // Canvas background clicked without hitting a slot directly:
        // If no slot was already selected, select first slot if available
        if (canvasRenderer.selectedSlotIndex === null && spread?.slots?.length > 0) {
          canvasRenderer.selectedSlotIndex = 0;
          if (canvasRenderer.selectedSlotIndices) {
            canvasRenderer.selectedSlotIndices = new Set([0]);
          }
          canvasRenderer.requestRender();
          updatePreviewBarForSlot(0);
        }
      }

      const currentSlotIdx = canvasRenderer.selectedSlotIndex;
      if (currentSlotIdx === null || currentSlotIdx === undefined || !spread?.slots?.length) {
        hideCanvasContextMenu();
        return;
      }

      const slot = spread.slots.find(s => s.slotIndex === currentSlotIdx);
      const hasPhoto = Boolean(slot && slot.photoId);

      if (els.ctxFrameHeaderTitle) {
        els.ctxFrameHeaderTitle.textContent = `Frame ${currentSlotIdx + 1} Settings`;
      }

      // Duplicate Labels: reflect whether an image (picture) or frame is selected
      if (els.ctxDuplicateRightLabel) {
        els.ctxDuplicateRightLabel.textContent = hasPhoto ? 'Duplicate Picture to Right' : 'Duplicate Frame to Right';
      }
      if (els.ctxDuplicateLeftLabel) {
        els.ctxDuplicateLeftLabel.textContent = hasPhoto ? 'Duplicate Picture to Left' : 'Duplicate Frame to Left';
      }

      // Enable / disable photo-specific items
      if (els.ctxDeletePhoto) els.ctxDeletePhoto.classList.toggle('disabled', !hasPhoto);
      if (els.ctxSwapPhoto) els.ctxSwapPhoto.classList.toggle('disabled', !hasPhoto);
      if (els.ctxFlipH) els.ctxFlipH.classList.toggle('disabled', !hasPhoto);
      if (els.ctxFlipV) els.ctxFlipV.classList.toggle('disabled', !hasPhoto);
      if (els.ctxRotate) els.ctxRotate.classList.toggle('disabled', !hasPhoto);

      // On double right-click, also make sure inspector/preview bar is open
      if (isDblClick && els.photoFramePreviewBar) {
        els.photoFramePreviewBar.style.display = 'flex';
      }

      // Position context menu nicely on screen
      const menu = els.canvasContextMenu;
      if (menu) {
        menu.style.display = 'flex';
        const menuW = 250;
        const menuH = 460;
        const posX = Math.min(window.innerWidth - menuW - 12, Math.max(10, e.clientX));
        const posY = Math.min(window.innerHeight - menuH - 12, Math.max(10, e.clientY));
        menu.style.left = posX + 'px';
        menu.style.top = posY + 'px';
      }
    }

    canvasRenderer.canvas.addEventListener('contextmenu', (e) => {
      if (canvasRenderer._justFinishedRightDrag) {
        e.preventDefault();
        e.stopPropagation();
        canvasRenderer._justFinishedRightDrag = false;
        return;
      }
      const now = Date.now();
      const isDbl = (now - lastRightClickTime < 500) && (Math.hypot(e.clientX - lastRightClickPos.x, e.clientY - lastRightClickPos.y) < 30);
      lastRightClickTime = now;
      lastRightClickPos = { x: e.clientX, y: e.clientY };
      handleFrameContextMenu(e, isDbl);
    });

    // Also support auxiliary mousedown (button === 2) rapid double click detection
    canvasRenderer.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 2) {
        const now = Date.now();
        const isDbl = (now - lastRightClickTime < 500) && (Math.hypot(e.clientX - lastRightClickPos.x, e.clientY - lastRightClickPos.y) < 30);
        if (isDbl) {
          handleFrameContextMenu(e, true);
        }
      }
    });
  }

  // Wire Context Menu Actions
  if (els.ctxFrameSettings) {
    els.ctxFrameSettings.addEventListener('click', () => {
      hideCanvasContextMenu();
      if (canvasRenderer.selectedSlotIndex !== null && canvasRenderer.selectedSlotIndex !== undefined) {
        updatePreviewBarForSlot(canvasRenderer.selectedSlotIndex);
        if (els.photoFramePreviewBar) {
          els.photoFramePreviewBar.style.display = 'flex';
        }
      }
    });
  }
  if (els.ctxDuplicateRight) {
    els.ctxDuplicateRight.addEventListener('click', () => {
      hideCanvasContextMenu();
      if (canvasRenderer.selectedSlotIndex === null) return;
      const cw = canvasRenderer.displayWidth || 1200;
      const ch = canvasRenderer.displayHeight || 600;
      const newIdx = albumState.duplicateSlot(albumState.activeSpreadIndex, canvasRenderer.selectedSlotIndex, 'right', cw, ch);
      if (newIdx !== null && newIdx !== undefined) {
        canvasRenderer.selectedSlotIndex = newIdx;
        if (canvasRenderer.selectedSlotIndices) canvasRenderer.selectedSlotIndices = new Set([newIdx]);
        canvasRenderer.requestRender();
        updatePreviewBarForSlot(newIdx);
        debouncedRenderFilmstrip();
        showToastNotification('⧉ Duplicated to Right');
      }
    });
  }

  if (els.ctxDuplicateLeft) {
    els.ctxDuplicateLeft.addEventListener('click', () => {
      hideCanvasContextMenu();
      if (canvasRenderer.selectedSlotIndex === null) return;
      const cw = canvasRenderer.displayWidth || 1200;
      const ch = canvasRenderer.displayHeight || 600;
      const newIdx = albumState.duplicateSlot(albumState.activeSpreadIndex, canvasRenderer.selectedSlotIndex, 'left', cw, ch);
      if (newIdx !== null && newIdx !== undefined) {
        canvasRenderer.selectedSlotIndex = newIdx;
        if (canvasRenderer.selectedSlotIndices) canvasRenderer.selectedSlotIndices = new Set([newIdx]);
        canvasRenderer.requestRender();
        updatePreviewBarForSlot(newIdx);
        debouncedRenderFilmstrip();
        showToastNotification('⧉ Duplicated to Left');
      }
    });
  }

  if (els.ctxInsertSpreadBefore) {
    els.ctxInsertSpreadBefore.addEventListener('click', () => {
      hideFilmstripContextMenu();
      const targetIdx = (filmstripContextMenuTargetIndex !== null)
        ? filmstripContextMenuTargetIndex
        : albumState.activeSpreadIndex;
      if (targetIdx !== null && targetIdx !== undefined && targetIdx >= 0) {
        insertSpreadAt(targetIdx, `➕ Inserted spread before Spread ${targetIdx + 1}`);
      }
    });
  }

  if (els.ctxInsertSpreadAfter) {
    els.ctxInsertSpreadAfter.addEventListener('click', () => {
      hideFilmstripContextMenu();
      const targetIdx = (filmstripContextMenuTargetIndex !== null)
        ? filmstripContextMenuTargetIndex
        : albumState.activeSpreadIndex;
      if (targetIdx !== null && targetIdx !== undefined && targetIdx >= 0) {
        const nextIdx = targetIdx + 1;
        const total = albumState.project?.spreads?.length || 0;
        const msg = nextIdx < total
          ? `➕ Inserted spread between Spread ${targetIdx + 1} and Spread ${targetIdx + 2}`
          : `➕ Inserted spread after Spread ${targetIdx + 1}`;
        insertSpreadAt(nextIdx, msg);
      }
    });
  }

  if (els.ctxDeleteSpread) {
    els.ctxDeleteSpread.addEventListener('click', () => {
      hideFilmstripContextMenu();
      const targetIdx = (filmstripContextMenuTargetIndex !== null)
        ? filmstripContextMenuTargetIndex
        : albumState.activeSpreadIndex;
      if (targetIdx !== null && targetIdx !== undefined) {
        selectedSpreadIndices.delete(targetIdx);
        albumState.removeSpread(targetIdx);
        debouncedRenderFilmstrip();
        canvasRenderer.requestRender();
        showToastNotification('🗑️ Deleted selected spread');
      }
    });
  }

  if (els.ctxDeletePhoto) {
    els.ctxDeletePhoto.addEventListener('click', () => {
      hideCanvasContextMenu();
      if (els.btnPreviewRemovePhoto) els.btnPreviewRemovePhoto.click();
    });
  }

  if (els.ctxDeleteFrame) {
    els.ctxDeleteFrame.addEventListener('click', () => {
      hideCanvasContextMenu();
      if (els.btnPreviewDeleteFrame) els.btnPreviewDeleteFrame.click();
    });
  }

  if (els.ctxSwapPhoto) {
    els.ctxSwapPhoto.addEventListener('click', () => {
      hideCanvasContextMenu();
      if (els.btnPreviewSwapPhoto) els.btnPreviewSwapPhoto.click();
    });
  }

  if (els.ctxSwitchLeftRight) {
    els.ctxSwitchLeftRight.addEventListener('click', () => {
      hideCanvasContextMenu();
      if (els.btnPreviewSwitchLeftRight) els.btnPreviewSwitchLeftRight.click();
    });
  }

  if (els.ctxFlipH) {
    els.ctxFlipH.addEventListener('click', () => {
      hideCanvasContextMenu();
      if (els.btnPreviewFlipH) els.btnPreviewFlipH.click();
    });
  }

  if (els.ctxFlipV) {
    els.ctxFlipV.addEventListener('click', () => {
      hideCanvasContextMenu();
      if (els.btnPreviewFlipV) els.btnPreviewFlipV.click();
    });
  }

  if (els.ctxRotate) {
    els.ctxRotate.addEventListener('click', () => {
      hideCanvasContextMenu();
      if (els.btnPreviewRotate) els.btnPreviewRotate.click();
    });
  }

  if (els.ctxBringToFront) {
    els.ctxBringToFront.addEventListener('click', () => {
      hideCanvasContextMenu();
      if (els.btnPreviewBringToFront) els.btnPreviewBringToFront.click();
    });
  }

  if (els.ctxSendToBack) {
    els.ctxSendToBack.addEventListener('click', () => {
      hideCanvasContextMenu();
      if (els.btnPreviewSendToBack) els.btnPreviewSendToBack.click();
    });
  }

  // ==================== Floating Left Template Tool Controller ====================
  const canvasLeftTemplateDock = document.getElementById('canvasLeftTemplateDock');
  const btnTemplateFloatingMenu = document.getElementById('btnTemplateFloatingMenu');
  const templateFloatingPopover = document.getElementById('templateFloatingPopover');
  const btnCloseTemplatePopover = document.getElementById('btnCloseTemplatePopover');

  const btnSaveAsNewTemplate = document.getElementById('btnSaveAsNewTemplate');
  const btnModifyExistingTemplate = document.getElementById('btnModifyExistingTemplate');
  const btnManageCustomTemplates = document.getElementById('btnManageCustomTemplates');
  const customTemplatesCountDesc = document.getElementById('customTemplatesCountDesc');

  // Modals for Template management
  const modalSaveNewTemplate = document.getElementById('modalSaveNewTemplate');
  const btnCloseSaveNewTemplate = document.getElementById('btnCloseSaveNewTemplate');
  const btnCancelSaveNewTemplate = document.getElementById('btnCancelSaveNewTemplate');
  const btnConfirmSaveNewTemplate = document.getElementById('btnConfirmSaveNewTemplate');
  const inputSaveTemplateName = document.getElementById('inputSaveTemplateName');
  const saveTemplatePreviewCanvasBox = document.getElementById('saveTemplatePreviewCanvasBox');
  const saveTemplateFrameCountLabel = document.getElementById('saveTemplateFrameCountLabel');

  const modalManageCustomTemplates = document.getElementById('modalManageCustomTemplates');
  const btnCloseManageCustomTemplates = document.getElementById('btnCloseManageCustomTemplates');
  const btnDoneManageCustomTemplates = document.getElementById('btnDoneManageCustomTemplates');
  const manageCustomTemplatesList = document.getElementById('manageCustomTemplatesList');
  const manageTemplatesSummaryLabel = document.getElementById('manageTemplatesSummaryLabel');

  function updateCustomTemplateCountBadge() {
    const list = layoutEngine.getCustomTemplates();
    if (customTemplatesCountDesc) {
      customTemplatesCountDesc.textContent = list.length + ' custom template' + (list.length === 1 ? '' : 's') + ' saved';
    }
  }

  function getSpreadNormalizedFrames(spread) {
    if (!spread) return [];
    if (spread.layout && Array.isArray(spread.layout.rects) && spread.layout.rects.length > 0) {
      return spread.layout.rects.map(r => ({
        x: Number(r.x || 0),
        y: Number(r.y || 0),
        w: Number(r.w !== undefined ? r.w : (r.width !== undefined ? r.width : 0.5)),
        h: Number(r.h !== undefined ? r.h : (r.height !== undefined ? r.height : 0.5)),
        width: Number(r.w !== undefined ? r.w : (r.width !== undefined ? r.width : 0.5)),
        height: Number(r.h !== undefined ? r.h : (r.height !== undefined ? r.height : 0.5)),
        shape: r.shape || 'rectangle',
        borderRadius: r.borderRadius,
        rotation: r.rotation
      }));
    }
    if (Array.isArray(spread.slots) && spread.slots.length > 0) {
      const slotRects = spread.slots.map(s => {
        const r = s.rect || s.box;
        if (r) {
          const w = Number(r.w !== undefined ? r.w : (r.width !== undefined ? r.width : 0.5));
          const h = Number(r.h !== undefined ? r.h : (r.height !== undefined ? r.height : 0.5));
          return {
            x: Number(r.x || 0),
            y: Number(r.y || 0),
            w: w,
            h: h,
            width: w,
            height: h,
            shape: r.shape || s.shape || 'rectangle',
            borderRadius: r.borderRadius,
            rotation: r.rotation
          };
        }
        return null;
      }).filter(Boolean);
      if (slotRects.length > 0) return slotRects;
    }
    if (canvasRenderer && typeof canvasRenderer.getComputedFrameRectsNormalized === 'function') {
      const compRects = canvasRenderer.getComputedFrameRectsNormalized();
      if (compRects && compRects.length > 0) {
        return compRects.map(r => ({
          x: Number(r.x || 0),
          y: Number(r.y || 0),
          w: Number(r.w !== undefined ? r.w : (r.width !== undefined ? r.width : 0.5)),
          h: Number(r.h !== undefined ? r.h : (r.height !== undefined ? r.height : 0.5)),
          width: Number(r.w !== undefined ? r.w : (r.width !== undefined ? r.width : 0.5)),
          height: Number(r.h !== undefined ? r.h : (r.height !== undefined ? r.height : 0.5)),
          shape: r.shape || 'rectangle',
          borderRadius: r.borderRadius,
          rotation: r.rotation
        }));
      }
    }
    return [];
  }

  function renderMiniTemplateBlueprint(container, rects) {
    if (!container) return;
    container.innerHTML = '';
    if (!rects || rects.length === 0) {
      container.innerHTML = '<div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 9px; color: var(--text-dim);">Empty</div>';
      return;
    }
    rects.forEach(r => {
      const box = document.createElement('div');
      const x = Number(r.x || 0);
      const y = Number(r.y || 0);
      const w = Number(r.w !== undefined ? r.w : (r.width !== undefined ? r.width : 0.2));
      const h = Number(r.h !== undefined ? r.h : (r.height !== undefined ? r.height : 0.2));
      const shape = r.shape || 'rectangle';
      box.style.position = 'absolute';
      box.style.left = (x * 100).toFixed(1) + '%';
      box.style.top = (y * 100).toFixed(1) + '%';
      box.style.width = (w * 100).toFixed(1) + '%';
      box.style.height = (h * 100).toFixed(1) + '%';
      box.style.background = 'rgba(56, 189, 248, 0.25)';
      box.style.border = '1px solid rgba(56, 189, 248, 0.7)';
      box.style.boxSizing = 'border-box';
      if (shape === 'circle') {
        box.style.borderRadius = '50%';
      } else if (shape === 'arch') {
        box.style.borderRadius = '50% 50% 0 0';
      } else if (shape === 'diamond') {
        box.style.clipPath = 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
      } else if (shape === 'skew') {
        box.style.transform = 'skewX(-15deg)';
      } else if (shape === 'brush') {
        box.style.borderRadius = '40% 60% 70% 30% / 40% 50% 60% 50%';
      } else if (shape === 'rounded' || r.borderRadius) {
        box.style.borderRadius = '5px';
      } else {
        box.style.borderRadius = '2px';
      }
      container.appendChild(box);
    });
  }

  // Toggle Left Floating Popover
  if (btnTemplateFloatingMenu && canvasLeftTemplateDock) {
    btnTemplateFloatingMenu.addEventListener('click', (e) => {
      e.stopPropagation();
      canvasLeftTemplateDock.classList.toggle('open');
      updateCustomTemplateCountBadge();
    });
  }

  if (btnCloseTemplatePopover && canvasLeftTemplateDock) {
    btnCloseTemplatePopover.addEventListener('click', (e) => {
      e.stopPropagation();
      canvasLeftTemplateDock.classList.remove('open');
    });
  }

  if (templateFloatingPopover) {
    templateFloatingPopover.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  document.addEventListener('click', (e) => {
    if (canvasLeftTemplateDock && !canvasLeftTemplateDock.contains(e.target)) {
      canvasLeftTemplateDock.classList.remove('open');
    }
  });

  // 1. SAVE AS NEW TEMPLATE
  if (btnSaveAsNewTemplate) {
    btnSaveAsNewTemplate.addEventListener('click', () => {
      canvasLeftTemplateDock?.classList.remove('open');
      const spread = albumState.project.spreads[albumState.activeSpreadIndex];
      if (!spread) return;

      const rects = getSpreadNormalizedFrames(spread);

      if (!rects || rects.length === 0) {
        showToastNotification('⚠️ Please add or draw photo frames on the spread before saving as template.');
        return;
      }

      const frameCount = rects.length;
      if (inputSaveTemplateName) {
        inputSaveTemplateName.value = 'My ' + frameCount + '-Photo Custom Spread';
      }
      if (saveTemplateFrameCountLabel) {
        saveTemplateFrameCountLabel.textContent = frameCount + ' Frame' + (frameCount === 1 ? '' : 's');
      }
      renderMiniTemplateBlueprint(saveTemplatePreviewCanvasBox, rects);

      modalSaveNewTemplate?.classList.add('open');
      setTimeout(() => inputSaveTemplateName?.select(), 100);
    });
  }

  if (btnCloseSaveNewTemplate) btnCloseSaveNewTemplate.addEventListener('click', () => modalSaveNewTemplate?.classList.remove('open'));
  if (btnCancelSaveNewTemplate) btnCancelSaveNewTemplate.addEventListener('click', () => modalSaveNewTemplate?.classList.remove('open'));

  if (btnConfirmSaveNewTemplate) {
    btnConfirmSaveNewTemplate.addEventListener('click', () => {
      const spread = albumState.project.spreads[albumState.activeSpreadIndex];
      if (!spread) return;

      const rects = getSpreadNormalizedFrames(spread);

      if (!rects || rects.length === 0) {
        showToastNotification('⚠️ Spread has no frames to save as a template.');
        return;
      }

      const name = (inputSaveTemplateName?.value || '').trim() || ('Custom ' + rects.length + '-Photo Layout');
      const savedTpl = layoutEngine.addCustomTemplate({
        name: name,
        rects: rects
      });

      if (savedTpl) {
        spread.layout = savedTpl;
        spread.layoutId = savedTpl.id;
        modalSaveNewTemplate?.classList.remove('open');
        updateCustomTemplateCountBadge();
        renderCustomTemplatesManagerList();
        renderFloatingLayoutsBar();
        renderFilmstrip();
        updateHUD();
        canvasRenderer.render();
        showToastNotification('✓ Saved New Template: "' + name + '"!');
      }
    });
  }

  // 2. MODIFY EXISTING TEMPLATE
  if (btnModifyExistingTemplate) {
    btnModifyExistingTemplate.addEventListener('click', () => {
      canvasLeftTemplateDock?.classList.remove('open');
      const spread = albumState.project.spreads[albumState.activeSpreadIndex];
      if (!spread) {
        showToastNotification('⚠️ No spread active.');
        return;
      }

      const rects = getSpreadNormalizedFrames(spread);
      if (!rects || rects.length === 0) {
        showToastNotification('⚠️ Current spread has no frames to update.');
        return;
      }

      // Check if current layout is already a custom template
      if (spread.layout && spread.layout.isCustom) {
        layoutEngine.updateCustomTemplate(spread.layout.id, { rects: rects });
        showToastNotification('✓ Updated Custom Template: "' + spread.layout.name + '" with adjusted frame positions!');
      } else {
        // Built-in template: save as modified version
        const modName = ((spread.layout && spread.layout.name) || 'Layout') + ' (Modified)';
        const newCustom = layoutEngine.addCustomTemplate({
          name: modName,
          rects: rects
        });
        spread.layout = newCustom;
        spread.layoutId = newCustom.id;
        showToastNotification('✓ Saved as modified template: "' + modName + '"!');
      }

      updateCustomTemplateCountBadge();
      renderCustomTemplatesManagerList();
      renderFloatingLayoutsBar();
      renderFilmstrip();
      canvasRenderer.render();
    });
  }

  // 3. MANAGE CUSTOM TEMPLATES MODAL
  function renderCustomTemplatesManagerList() {
    if (!manageCustomTemplatesList) return;
    const list = layoutEngine.getCustomTemplates();
    manageCustomTemplatesList.innerHTML = '';

    if (manageTemplatesSummaryLabel) {
      manageTemplatesSummaryLabel.textContent = list.length + ' custom template' + (list.length === 1 ? '' : 's');
    }

    if (list.length === 0) {
      manageCustomTemplatesList.innerHTML = '<div style="text-align: center; padding: 30px 20px; color: var(--text-dim); font-size: 13px;"><div style="font-size: 28px; margin-bottom: 8px;">📐</div><div>No custom templates saved yet.</div><div style="font-size: 11px; margin-top: 4px; color: var(--text-muted);">Click "Save as New Template" to save any spread frame arrangement.</div></div>';
      return;
    }

    list.forEach(tpl => {
      const card = document.createElement('div');
      card.className = 'custom-template-manage-card';

      const thumb = document.createElement('div');
      thumb.className = 'custom-template-preview-thumb';
      renderMiniTemplateBlueprint(thumb, tpl.rects);

      const info = document.createElement('div');
      info.className = 'custom-template-manage-info';
      const frameCount = tpl.rects ? tpl.rects.length : 0;
      info.innerHTML = '<div class="custom-template-manage-name">' + (tpl.name || 'Untitled Template') + '</div><div class="custom-template-manage-meta">' + frameCount + ' Photo Frame' + (frameCount === 1 ? '' : 's') + ' • Saved in library</div>';

      const actions = document.createElement('div');
      actions.className = 'custom-template-manage-actions';

      const btnApply = document.createElement('button');
      btnApply.className = 'btn-pill-sm';
      btnApply.style.padding = '3px 8px';
      btnApply.style.background = 'rgba(2, 132, 199, 0.2)';
      btnApply.style.borderColor = '#38bdf8';
      btnApply.style.color = '#38bdf8';
      btnApply.textContent = 'Apply';
      btnApply.title = 'Apply this template to current spread';
      btnApply.onclick = () => {
        const spread = albumState.project.spreads[albumState.activeSpreadIndex];
        if (spread) {
          albumState.recordSnapshot();
          spread.layout = tpl;
          spread.layoutId = tpl.id;
          albumState.notify('layout-changed', spread);
          modalManageCustomTemplates?.classList.remove('open');
          showToastNotification('✓ Applied template: "' + tpl.name + '"!');
        }
      };

      const btnRename = document.createElement('button');
      btnRename.className = 'btn-pill-sm';
      btnRename.style.padding = '3px 8px';
      btnRename.textContent = 'Rename';
      btnRename.onclick = () => {
        const newName = prompt('Enter new template name:', tpl.name);
        if (newName && newName.trim()) {
          layoutEngine.updateCustomTemplate(tpl.id, { name: newName.trim() });
          renderCustomTemplatesManagerList();
          renderFloatingLayoutsBar();
        }
      };

      const btnDel = document.createElement('button');
      btnDel.className = 'btn-pill-sm';
      btnDel.style.padding = '3px 8px';
      btnDel.style.color = '#ef4444';
      btnDel.textContent = 'Delete';
      btnDel.title = 'Delete custom template';
      btnDel.onclick = () => {
        if (confirm('Delete template "' + tpl.name + '"?')) {
          layoutEngine.deleteCustomTemplate(tpl.id);
          renderCustomTemplatesManagerList();
          renderFloatingLayoutsBar();
          updateCustomTemplateCountBadge();
          updateAllTemplateCountBadges();
          if (typeof renderBigViewGrid === 'function') {
            renderBigViewGrid();
          }
          showToastNotification('Template deleted.');
        }
      };

      actions.appendChild(btnApply);
      actions.appendChild(btnRename);
      actions.appendChild(btnDel);

      card.appendChild(thumb);
      card.appendChild(info);
      card.appendChild(actions);
      manageCustomTemplatesList.appendChild(card);
    });
  }

  if (btnManageCustomTemplates) {
    btnManageCustomTemplates.addEventListener('click', () => {
      canvasLeftTemplateDock?.classList.remove('open');
      renderCustomTemplatesManagerList();
      modalManageCustomTemplates?.classList.add('open');
    });
  }

  if (btnCloseManageCustomTemplates) btnCloseManageCustomTemplates.addEventListener('click', () => modalManageCustomTemplates?.classList.remove('open'));
  if (btnDoneManageCustomTemplates) btnDoneManageCustomTemplates.addEventListener('click', () => modalManageCustomTemplates?.classList.remove('open'));

  // ==================== Controls & Formats Panel Layouts Scrolling & Navigation ====================
  if (els.btnControlsPrevLayout) {
    els.btnControlsPrevLayout.addEventListener('click', () => {
      albumState.prevLayout();
      renderFloatingLayoutsBar();
    });
  }

  if (els.btnControlsNextLayout) {
    els.btnControlsNextLayout.addEventListener('click', () => {
      albumState.nextLayout();
      renderFloatingLayoutsBar();
    });
  }

  if (els.btnControlsOpenAllLayouts) {
    els.btnControlsOpenAllLayouts.addEventListener('click', () => {
      openBigViewModal('all');
    });
  }

  // Mouse wheel horizontal scrolling through layouts on controls panel
  if (els.controlsLayoutsStrip) {
    els.controlsLayoutsStrip.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX) || e.deltaY !== 0) {
        e.preventDefault();
        els.controlsLayoutsStrip.scrollLeft += (e.deltaY || e.deltaX) * 1.5;
      }
    }, { passive: false });
  }

  // Mouse wheel horizontal scrolling on top floating layouts list
  if (els.floatingLayoutsList) {
    els.floatingLayoutsList.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX) || e.deltaY !== 0) {
        e.preventDefault();
        els.floatingLayoutsList.scrollLeft += (e.deltaY || e.deltaX) * 1.5;
      }
    }, { passive: false });
  }

  // ==================== Offline Image Template Loader & Converter ====================
  let currentConvertingTemplate = {
    name: '',
    sourceImgData: '',
    autoRects: [],
    activeRects: []
  };

  /**
   * Fast, 100% offline computer vision detection of rectangular photo frames in an image.
   * Uses perimeter background sampling and Recursive XY-Cut projection on an offscreen HTML5 canvas.
   */
  function analyzeImageForFrames(img) {
    const canvas = document.createElement('canvas');
    const cw = 400;
    const aspect = (img.naturalWidth && img.naturalHeight) ? (img.naturalWidth / img.naturalHeight) : 2.0;
    const ch = Math.max(100, Math.round(cw / aspect));
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, cw, ch);
    const imgData = ctx.getImageData(0, 0, cw, ch);
    const data = imgData.data;

    // 1. Perimeter background luminance sampling
    let bgLumSum = 0;
    let bgSamples = 0;
    for (let x = 0; x < cw; x += 4) {
      const iTop = (0 * cw + x) * 4;
      const iBot = ((ch - 1) * cw + x) * 4;
      bgLumSum += 0.299 * data[iTop] + 0.587 * data[iTop + 1] + 0.114 * data[iTop + 2];
      bgLumSum += 0.299 * data[iBot] + 0.587 * data[iBot + 1] + 0.114 * data[iBot + 2];
      bgSamples += 2;
    }
    for (let y = 0; y < ch; y += 4) {
      const iL = (y * cw + 0) * 4;
      const iR = (y * cw + (cw - 1)) * 4;
      bgLumSum += 0.299 * data[iL] + 0.587 * data[iL + 1] + 0.114 * data[iL + 2];
      bgLumSum += 0.299 * data[iR] + 0.587 * data[iR + 1] + 0.114 * data[iR + 2];
      bgSamples += 2;
    }
    const bgLum = bgSamples > 0 ? (bgLumSum / bgSamples) : 240;

    // 2. Identify content pixels differing from background
    const threshold = 26;
    const isContent = new Uint8Array(cw * ch);
    for (let y = 0; y < ch; y++) {
      for (let x = 0; x < cw; x++) {
        const idx = (y * cw + x) * 4;
        const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
        if (Math.abs(lum - bgLum) > threshold) {
          isContent[y * cw + x] = 1;
        }
      }
    }

    // 3. XY Projection activity to detect column and row gutters
    const colActivity = new Float32Array(cw);
    for (let x = 0; x < cw; x++) {
      let c = 0;
      for (let y = 0; y < ch; y++) {
        if (isContent[y * cw + x]) c++;
      }
      colActivity[x] = c / ch;
    }

    const rowActivity = new Float32Array(ch);
    for (let y = 0; y < ch; y++) {
      let c = 0;
      for (let x = 0; x < cw; x++) {
        if (isContent[y * cw + x]) c++;
      }
      rowActivity[y] = c / cw;
    }

    const colSegments = [];
    let inCol = false, colStart = 0;
    const colThreshold = 0.07;
    for (let x = 0; x < cw; x++) {
      if (colActivity[x] > colThreshold && !inCol) {
        inCol = true;
        colStart = x;
      } else if (colActivity[x] <= colThreshold && inCol) {
        inCol = false;
        if (x - colStart > cw * 0.08) colSegments.push({ start: colStart, end: x });
      }
    }
    if (inCol && cw - colStart > cw * 0.08) colSegments.push({ start: colStart, end: cw });

    const rowSegments = [];
    let inRow = false, rowStart = 0;
    const rowThreshold = 0.07;
    for (let y = 0; y < ch; y++) {
      if (rowActivity[y] > rowThreshold && !inRow) {
        inRow = true;
        rowStart = y;
      } else if (rowActivity[y] <= rowThreshold && inRow) {
        inRow = false;
        if (y - rowStart > ch * 0.08) rowSegments.push({ start: rowStart, end: y });
      }
    }
    if (inRow && ch - rowStart > ch * 0.08) rowSegments.push({ start: rowStart, end: ch });

    const detected = [];
    colSegments.forEach(col => {
      rowSegments.forEach(row => {
        let count = 0;
        const total = (col.end - col.start) * (row.end - row.start);
        for (let y = row.start; y < row.end; y += 2) {
          for (let x = col.start; x < col.end; x += 2) {
            if (isContent[y * cw + x]) count++;
          }
        }
        if ((count * 4) / total > 0.12) {
          const normX = Math.round((col.start / cw) * 1000) / 1000;
          const normY = Math.round((row.start / ch) * 1000) / 1000;
          const normW = Math.round(((col.end - col.start) / cw) * 1000) / 1000;
          const normH = Math.round(((row.end - row.start) / ch) * 1000) / 1000;
          detected.push({
            x: Math.max(0.01, normX),
            y: Math.max(0.01, normY),
            width: Math.min(0.98, normW),
            height: Math.min(0.98, normH),
            w: Math.min(0.98, normW),
            h: Math.min(0.98, normH)
          });
        }
      });
    });

    if (detected.length === 0) {
      // Fallback connected content bounding box
      let minX = cw, maxX = 0, minY = ch, maxY = 0;
      let hasContent = false;
      for (let y = 0; y < ch; y++) {
        for (let x = 0; x < cw; x++) {
          if (isContent[y * cw + x]) {
            hasContent = true;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      if (hasContent && (maxX - minX) > cw * 0.12 && (maxY - minY) > ch * 0.12) {
        detected.push({
          x: Math.round((minX / cw) * 1000) / 1000,
          y: Math.round((minY / ch) * 1000) / 1000,
          width: Math.round(((maxX - minX) / cw) * 1000) / 1000,
          height: Math.round(((maxY - minY) / ch) * 1000) / 1000,
          w: Math.round(((maxX - minX) / cw) * 1000) / 1000,
          h: Math.round(((maxY - minY) / ch) * 1000) / 1000
        });
      }
    }

    if (detected.length === 0) {
      detected.push({ x: 0.04, y: 0.04, width: 0.92, height: 0.92, w: 0.92, h: 0.92 });
    }

    detected.sort((a, b) => {
      if (Math.abs(a.y - b.y) > 0.08) return a.y - b.y;
      return a.x - b.x;
    });

    return detected;
  }

  let batchTemplatesQueue = [];
  let batchCurrentIndex = 0;
  let isDrawingFrame = false;
  let isMarqueeSelecting = false;
  let drawStartPoint = { x: 0, y: 0, clientX: 0, clientY: 0 };
  let marqueeStartPoint = { x: 0, y: 0, isCtrl: false };
  let activeTemplateBoxAction = null;
  let selectedConvertBoxIndices = new Set();

  function updateConvertSelectionUI() {
    if (!currentConvertingTemplate || !Array.isArray(currentConvertingTemplate.activeRects)) {
      selectedConvertBoxIndices.clear();
    } else {
      const valid = new Set();
      selectedConvertBoxIndices.forEach(idx => {
        if (idx >= 0 && idx < currentConvertingTemplate.activeRects.length) valid.add(idx);
      });
      selectedConvertBoxIndices = valid;
    }

    const count = selectedConvertBoxIndices.size;
    if (els.lblSelectedBoxesCount) {
      els.lblSelectedBoxesCount.textContent = `${count} Selected`;
    }

    if (els.convertTemplateBoxesOverlay) {
      const boxEls = els.convertTemplateBoxesOverlay.querySelectorAll('.convert-frame-box');
      boxEls.forEach((boxEl, idx) => {
        if (selectedConvertBoxIndices.has(idx)) {
          boxEl.classList.add('selected');
        } else {
          boxEl.classList.remove('selected');
        }
      });
    }
  }

  function getSelectedBoxes() {
    if (!currentConvertingTemplate || !Array.isArray(currentConvertingTemplate.activeRects)) return [];
    return Array.from(selectedConvertBoxIndices)
      .map(idx => ({ idx, box: currentConvertingTemplate.activeRects[idx] }))
      .filter(item => item.box != null);
  }

  function alignSelectedBoxes(type) {
    const items = getSelectedBoxes();
    if (items.length === 0) {
      showToastNotification('Select frames to align.');
      return;
    }

    if (items.length === 1) {
      // Single frame: align to page / spread bounds
      const { box } = items[0];
      const w = box.width !== undefined ? box.width : box.w;
      const h = box.height !== undefined ? box.height : box.h;
      if (type === 'left') box.x = 0.04;
      else if (type === 'centerH') box.x = Math.round((0.5 - w / 2) * 1000) / 1000;
      else if (type === 'right') box.x = Math.round((0.96 - w) * 1000) / 1000;
      else if (type === 'top') box.y = 0.04;
      else if (type === 'middleV') box.y = Math.round((0.5 - h / 2) * 1000) / 1000;
      else if (type === 'bottom') box.y = Math.round((0.96 - h) * 1000) / 1000;
      renderConvertTemplateOverlay(currentConvertingTemplate.activeRects);
      return;
    }

    if (type === 'left') {
      const minX = Math.min(...items.map(it => it.box.x));
      items.forEach(it => { it.box.x = minX; });
    } else if (type === 'right') {
      const maxR = Math.max(...items.map(it => it.box.x + (it.box.width || it.box.w)));
      items.forEach(it => { it.box.x = Math.round((maxR - (it.box.width || it.box.w)) * 1000) / 1000; });
    } else if (type === 'centerH') {
      const minX = Math.min(...items.map(it => it.box.x));
      const maxR = Math.max(...items.map(it => it.box.x + (it.box.width || it.box.w)));
      const mid = (minX + maxR) / 2;
      items.forEach(it => {
        const w = it.box.width !== undefined ? it.box.width : it.box.w;
        it.box.x = Math.round((mid - w / 2) * 1000) / 1000;
      });
    } else if (type === 'top') {
      const minY = Math.min(...items.map(it => it.box.y));
      items.forEach(it => { it.box.y = minY; });
    } else if (type === 'bottom') {
      const maxB = Math.max(...items.map(it => it.box.y + (it.box.height || it.box.h)));
      items.forEach(it => { it.box.y = Math.round((maxB - (it.box.height || it.box.h)) * 1000) / 1000; });
    } else if (type === 'middleV') {
      const minY = Math.min(...items.map(it => it.box.y));
      const maxB = Math.max(...items.map(it => it.box.y + (it.box.height || it.box.h)));
      const mid = (minY + maxB) / 2;
      items.forEach(it => {
        const h = it.box.height !== undefined ? it.box.height : it.box.h;
        it.box.y = Math.round((mid - h / 2) * 1000) / 1000;
      });
    }

    renderConvertTemplateOverlay(currentConvertingTemplate.activeRects);
  }

  function distributeSelectedBoxes(direction) {
    const items = getSelectedBoxes();
    if (items.length < 3) {
      showToastNotification('Select 3 or more frames to distribute evenly.');
      return;
    }

    if (direction === 'h') {
      items.sort((a, b) => a.box.x - b.box.x);
      const first = items[0].box;
      const last = items[items.length - 1].box;
      const firstLeft = first.x;
      const lastRight = last.x + (last.width || last.w);
      const totalWidths = items.reduce((sum, it) => sum + (it.box.width || it.box.w), 0);
      const totalGapSpace = (lastRight - firstLeft) - totalWidths;
      const gap = totalGapSpace / (items.length - 1);

      let currentX = firstLeft;
      items.forEach((it, i) => {
        if (i === 0) {
          currentX += (it.box.width || it.box.w) + gap;
        } else if (i === items.length - 1) {
          it.box.x = Math.round((lastRight - (it.box.width || it.box.w)) * 1000) / 1000;
        } else {
          it.box.x = Math.round(currentX * 1000) / 1000;
          currentX += (it.box.width || it.box.w) + gap;
        }
      });
    } else if (direction === 'v') {
      items.sort((a, b) => a.box.y - b.box.y);
      const first = items[0].box;
      const last = items[items.length - 1].box;
      const firstTop = first.y;
      const lastBottom = last.y + (last.height || last.h);
      const totalHeights = items.reduce((sum, it) => sum + (it.box.height || it.box.h), 0);
      const totalGapSpace = (lastBottom - firstTop) - totalHeights;
      const gap = totalGapSpace / (items.length - 1);

      let currentY = firstTop;
      items.forEach((it, i) => {
        if (i === 0) {
          currentY += (it.box.height || it.box.h) + gap;
        } else if (i === items.length - 1) {
          it.box.y = Math.round((lastBottom - (it.box.height || it.box.h)) * 1000) / 1000;
        } else {
          it.box.y = Math.round(currentY * 1000) / 1000;
          currentY += (it.box.height || it.box.h) + gap;
        }
      });
    }

    renderConvertTemplateOverlay(currentConvertingTemplate.activeRects);
  }

  function makeSelectedSameDimension(dim) {
    const items = getSelectedBoxes();
    if (items.length < 2) {
      showToastNotification('Select 2 or more frames to match dimensions.');
      return;
    }
    const ref = items[0].box;
    if (dim === 'width') {
      const targetW = ref.width !== undefined ? ref.width : ref.w;
      items.slice(1).forEach(it => {
        it.box.w = targetW;
        it.box.width = targetW;
      });
    } else if (dim === 'height') {
      const targetH = ref.height !== undefined ? ref.height : ref.h;
      items.slice(1).forEach(it => {
        it.box.h = targetH;
        it.box.height = targetH;
      });
    }
    renderConvertTemplateOverlay(currentConvertingTemplate.activeRects);
  }

  function duplicateSelectedBoxes() {
    if (!currentConvertingTemplate || !Array.isArray(currentConvertingTemplate.activeRects)) return;
    const items = getSelectedBoxes();
    if (items.length === 0) {
      showToastNotification('Select frames to duplicate (or press Ctrl+J).');
      return;
    }

    const newIndices = [];
    const offset = 0.03;
    items.forEach(it => {
      const b = it.box;
      const w = b.width !== undefined ? b.width : b.w;
      const h = b.height !== undefined ? b.height : b.h;
      let newX = b.x + offset;
      let newY = b.y + offset;
      if (newX + w > 0.98) newX = Math.max(0.02, b.x - offset);
      if (newY + h > 0.98) newY = Math.max(0.02, b.y - offset);

      const dup = {
        x: Math.round(newX * 1000) / 1000,
        y: Math.round(newY * 1000) / 1000,
        w: w,
        h: h,
        width: w,
        height: h,
        shape: b.shape || 'rectangle'
      };
      if (b.text !== undefined) dup.text = b.text;
      if (b.isText) dup.isText = true;
      currentConvertingTemplate.activeRects.push(dup);
      newIndices.push(currentConvertingTemplate.activeRects.length - 1);
    });

    selectedConvertBoxIndices.clear();
    newIndices.forEach(i => selectedConvertBoxIndices.add(i));
    renderConvertTemplateOverlay(currentConvertingTemplate.activeRects);
    showToastNotification(`✓ Duplicated ${newIndices.length} frame${newIndices.length === 1 ? '' : 's'}.`);
  }

  function deleteSelectedBoxes() {
    if (!currentConvertingTemplate || !Array.isArray(currentConvertingTemplate.activeRects)) return;
    const count = selectedConvertBoxIndices.size;
    if (count === 0) {
      showToastNotification('No frames selected to delete.');
      return;
    }
    const sorted = Array.from(selectedConvertBoxIndices).sort((a, b) => b - a);
    sorted.forEach(idx => {
      if (idx >= 0 && idx < currentConvertingTemplate.activeRects.length) {
        currentConvertingTemplate.activeRects.splice(idx, 1);
      }
    });
    selectedConvertBoxIndices.clear();
    renderConvertTemplateOverlay(currentConvertingTemplate.activeRects);
    showToastNotification(`Deleted ${count} frame${count === 1 ? '' : 's'}.`);
  }

  function nudgeSelectedBoxes(dx, dy) {
    if (!currentConvertingTemplate || !Array.isArray(currentConvertingTemplate.activeRects)) return;
    const items = getSelectedBoxes();
    if (items.length === 0) return;
    items.forEach(it => {
      const b = it.box;
      const w = b.width !== undefined ? b.width : b.w;
      const h = b.height !== undefined ? b.height : b.h;
      b.x = Math.max(0, Math.min(1 - w, Math.round((b.x + dx) * 1000) / 1000));
      b.y = Math.max(0, Math.min(1 - h, Math.round((b.y + dy) * 1000) / 1000));
    });
    renderConvertTemplateOverlay(currentConvertingTemplate.activeRects);
  }

  function renderSmartGuides(guides) {
    if (!els.convertTemplateSmartGuides) return;
    els.convertTemplateSmartGuides.innerHTML = '';
    if (!guides) return;

    (guides.x || []).forEach(gx => {
      const vLine = document.createElement('div');
      vLine.className = 'template-smart-guide vertical';
      vLine.style.left = (gx * 100) + '%';
      els.convertTemplateSmartGuides.appendChild(vLine);
    });

    (guides.y || []).forEach(gy => {
      const hLine = document.createElement('div');
      hLine.className = 'template-smart-guide horizontal';
      hLine.style.top = (gy * 100) + '%';
      els.convertTemplateSmartGuides.appendChild(hLine);
    });
  }

  function clearSmartGuides() {
    if (els.convertTemplateSmartGuides) {
      els.convertTemplateSmartGuides.innerHTML = '';
    }
  }

  function calculateSmartGuidesAndSnap(proposedRect, boxIndex, isMove, resizeDir) {
    const snapThreshold = 0.012;
    const guides = { x: [], y: [] };
    let { x, y, w, h } = proposedRect;

    const xTargets = [0.50, 0.04, 0.96];
    const yTargets = [0.04, 0.96];

    const allRects = currentConvertingTemplate?.activeRects || [];
    allRects.forEach((other, oIdx) => {
      if (oIdx === boxIndex) return;
      const oX = other.x;
      const oW = other.width !== undefined ? other.width : other.w;
      const oY = other.y;
      const oH = other.height !== undefined ? other.height : other.h;

      xTargets.push(oX, oX + oW / 2, oX + oW);
      yTargets.push(oY, oY + oH / 2, oY + oH);
    });

    if (isMove) {
      const xPoints = [
        { val: x, type: 'left' },
        { val: x + w / 2, type: 'center' },
        { val: x + w, type: 'right' }
      ];

      let bestDiffX = Infinity;
      let snapDeltaX = 0;
      let snapTargetX = null;

      for (const p of xPoints) {
        for (const target of xTargets) {
          const diff = Math.abs(p.val - target);
          if (diff < snapThreshold && diff < bestDiffX) {
            bestDiffX = diff;
            snapDeltaX = target - p.val;
            snapTargetX = target;
          }
        }
      }

      if (snapTargetX !== null) {
        x += snapDeltaX;
        guides.x.push(snapTargetX);
      }

      const yPoints = [
        { val: y, type: 'top' },
        { val: y + h / 2, type: 'center' },
        { val: y + h, type: 'bottom' }
      ];

      let bestDiffY = Infinity;
      let snapDeltaY = 0;
      let snapTargetY = null;

      for (const p of yPoints) {
        for (const target of yTargets) {
          const diff = Math.abs(p.val - target);
          if (diff < snapThreshold && diff < bestDiffY) {
            bestDiffY = diff;
            snapDeltaY = target - p.val;
            snapTargetY = target;
          }
        }
      }

      if (snapTargetY !== null) {
        y += snapDeltaY;
        guides.y.push(snapTargetY);
      }

      x = Math.max(0, Math.min(1 - w, x));
      y = Math.max(0, Math.min(1 - h, y));

    } else if (resizeDir) {
      if (resizeDir.includes('w')) {
        let bestDiff = Infinity;
        let snapTarget = null;
        for (const target of xTargets) {
          const diff = Math.abs(x - target);
          if (diff < snapThreshold && diff < bestDiff) {
            bestDiff = diff;
            snapTarget = target;
          }
        }
        if (snapTarget !== null && snapTarget < x + w - 0.02) {
          w = (x + w) - snapTarget;
          x = snapTarget;
          guides.x.push(snapTarget);
        }
      } else if (resizeDir.includes('e')) {
        const rightEdge = x + w;
        let bestDiff = Infinity;
        let snapTarget = null;
        for (const target of xTargets) {
          const diff = Math.abs(rightEdge - target);
          if (diff < snapThreshold && diff < bestDiff) {
            bestDiff = diff;
            snapTarget = target;
          }
        }
        if (snapTarget !== null && snapTarget > x + 0.02) {
          w = snapTarget - x;
          guides.x.push(snapTarget);
        }
      }

      if (resizeDir.includes('n')) {
        let bestDiff = Infinity;
        let snapTarget = null;
        for (const target of yTargets) {
          const diff = Math.abs(y - target);
          if (diff < snapThreshold && diff < bestDiff) {
            bestDiff = diff;
            snapTarget = target;
          }
        }
        if (snapTarget !== null && snapTarget < y + h - 0.02) {
          h = (y + h) - snapTarget;
          y = snapTarget;
          guides.y.push(snapTarget);
        }
      } else if (resizeDir.includes('s')) {
        const bottomEdge = y + h;
        let bestDiff = Infinity;
        let snapTarget = null;
        for (const target of yTargets) {
          const diff = Math.abs(bottomEdge - target);
          if (diff < snapThreshold && diff < bestDiff) {
            bestDiff = diff;
            snapTarget = target;
          }
        }
        if (snapTarget !== null && snapTarget > y + 0.02) {
          h = snapTarget - y;
          guides.y.push(snapTarget);
        }
      }

      w = Math.max(0.02, w);
      h = Math.max(0.02, h);
      x = Math.max(0, Math.min(1 - w, x));
      y = Math.max(0, Math.min(1 - h, y));
    }

    return {
      rect: { x, y, w, h },
      guides: guides
    };
  }

  function startTemplateBoxAction(e, type, boxIndex, dir) {
    if (!currentConvertingTemplate || !Array.isArray(currentConvertingTemplate.activeRects)) return;
    const r = currentConvertingTemplate.activeRects[boxIndex];
    if (!r) return;

    const overlayRect = els.convertTemplateBoxesOverlay.getBoundingClientRect();
    if (!overlayRect.width || !overlayRect.height) return;

    const boxEl = els.convertTemplateBoxesOverlay.querySelectorAll('.convert-frame-box')[boxIndex];
    if (boxEl) boxEl.classList.add('dragging');

    const origRects = new Map();
    if (type === 'move') {
      const movingIndices = selectedConvertBoxIndices.has(boxIndex)
        ? Array.from(selectedConvertBoxIndices)
        : [boxIndex];
      movingIndices.forEach(i => {
        const b = currentConvertingTemplate.activeRects[i];
        if (b) {
          const w = b.width !== undefined ? b.width : b.w;
          const h = b.height !== undefined ? b.height : b.h;
          origRects.set(i, { x: b.x, y: b.y, w, h });
          const el = els.convertTemplateBoxesOverlay.querySelectorAll('.convert-frame-box')[i];
          if (el) el.classList.add('dragging');
        }
      });
    }

    const origW = r.width !== undefined ? r.width : r.w;
    const origH = r.height !== undefined ? r.height : r.h;

    activeTemplateBoxAction = {
      type: type,
      boxIndex: boxIndex,
      dir: dir,
      startClientX: e.clientX,
      startClientY: e.clientY,
      origRect: {
        x: r.x,
        y: r.y,
        w: origW,
        h: origH
      },
      aspectRatio: origH > 0 ? (origW / origH) : 1,
      latestRect: {
        x: r.x,
        y: r.y,
        w: origW,
        h: origH
      },
      origRects: origRects,
      latestRects: new Map(origRects),
      overlayRect: overlayRect,
      boxEl: boxEl
    };

    try {
      e.target.setPointerCapture?.(e.pointerId);
    } catch (_) {}
  }

  function renderConvertTemplateOverlay(rects) {
    if (!els.convertTemplateBoxesOverlay) return;
    els.convertTemplateBoxesOverlay.innerHTML = '';
    const safeRects = Array.isArray(rects) ? rects : [];

    safeRects.forEach((r, idx) => {
      const box = document.createElement('div');
      box.className = 'convert-frame-box' + (selectedConvertBoxIndices.has(idx) ? ' selected' : '');
      box.style.left = (r.x * 100) + '%';
      box.style.top = (r.y * 100) + '%';
      box.style.width = ((r.width || r.w) * 100) + '%';
      box.style.height = ((r.height || r.h) * 100) + '%';

      const shape = r.shape || 'rectangle';
      if (shape === 'circle') {
        box.style.borderRadius = '50%';
      } else if (shape === 'arch') {
        box.style.borderRadius = '50% 50% 0 0';
      } else if (shape === 'diamond') {
        box.style.clipPath = 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
      } else if (shape === 'skew') {
        box.style.transform = 'skewX(-15deg)';
      } else if (shape === 'brush') {
        box.style.borderRadius = '40% 60% 70% 30% / 40% 50% 60% 50%';
      } else if (shape === 'rounded' || r.borderRadius) {
        box.style.borderRadius = '8px';
      }

      // Drag to move listener on the box (with Shift / Ctrl multi-select support)
      box.addEventListener('pointerdown', (e) => {
        if (e.target.closest('.convert-handle') || e.target.closest('.convert-frame-del') || e.target.closest('.convert-frame-shape-badge')) return;
        e.stopPropagation();
        e.preventDefault();

        const isModifier = e.shiftKey || e.ctrlKey || e.metaKey;
        if (isModifier) {
          if (selectedConvertBoxIndices.has(idx)) {
            selectedConvertBoxIndices.delete(idx);
          } else {
            selectedConvertBoxIndices.add(idx);
          }
          updateConvertSelectionUI();
          if (!selectedConvertBoxIndices.has(idx)) return;
        } else {
          if (!selectedConvertBoxIndices.has(idx)) {
            selectedConvertBoxIndices.clear();
            selectedConvertBoxIndices.add(idx);
            updateConvertSelectionUI();
          }
        }

        startTemplateBoxAction(e, 'move', idx, null);
      });

      // 8 Resize handles for all directions (touch and drag to adjust size)
      const handleDirections = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
      handleDirections.forEach(dir => {
        const handle = document.createElement('div');
        handle.className = `convert-handle handle-${dir}`;
        handle.dataset.dir = dir;
        handle.dataset.boxIndex = idx;
        handle.title = `Drag to resize frame (${dir.toUpperCase()}) • Shift for proportional aspect ratio`;
        
        handle.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          e.preventDefault();
          if (!selectedConvertBoxIndices.has(idx)) {
            selectedConvertBoxIndices.clear();
            selectedConvertBoxIndices.add(idx);
            updateConvertSelectionUI();
          }
          startTemplateBoxAction(e, 'resize', idx, dir);
        });
        box.appendChild(handle);
      });

      // Index label tag
      const tag = document.createElement('span');
      tag.className = 'convert-frame-tag';
      tag.textContent = r.text ? `Text: ${r.text}` : `Photo #${idx + 1}`;
      box.appendChild(tag);

      // Shape switcher badge
      const shapeBadge = document.createElement('span');
      shapeBadge.className = 'convert-frame-shape-badge';
      shapeBadge.style.cssText = 'position: absolute; bottom: 3px; right: 3px; font-size: 10px; background: rgba(15,23,42,0.88); color: #38bdf8; border: 1px solid rgba(56,189,248,0.6); border-radius: 4px; padding: 1px 5px; cursor: pointer; pointer-events: auto; user-select: none; z-index: 2;';
      const shapeIcons = { rectangle: '▭ Rect', circle: '◯ Circle', arch: '⌓ Arch', diamond: '◇ Diamond', brush: '🖌️ Brush', rounded: '▢ Rounded', skew: '▱ Slant' };
      shapeBadge.textContent = shapeIcons[shape] || shape;
      shapeBadge.title = 'Click to switch shape: Rect -> Circle -> Arch -> Diamond -> Brush -> Rounded -> Slant';
      shapeBadge.addEventListener('pointerdown', (e) => e.stopPropagation());
      shapeBadge.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const shapes = ['rectangle', 'circle', 'arch', 'diamond', 'brush', 'rounded', 'skew'];
        const currIdx = shapes.indexOf(r.shape || 'rectangle');
        const nextShape = shapes[(currIdx + 1) % shapes.length];
        if (selectedConvertBoxIndices.has(idx) && selectedConvertBoxIndices.size > 1) {
          selectedConvertBoxIndices.forEach(sIdx => {
            if (currentConvertingTemplate.activeRects[sIdx]) currentConvertingTemplate.activeRects[sIdx].shape = nextShape;
          });
        } else {
          r.shape = nextShape;
        }
        renderConvertTemplateOverlay(currentConvertingTemplate.activeRects);
      });
      box.appendChild(shapeBadge);

      // Close / Delete button
      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'convert-frame-del';
      delBtn.title = 'Delete this frame box';
      delBtn.innerHTML = '&times;';
      delBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (currentConvertingTemplate && Array.isArray(currentConvertingTemplate.activeRects)) {
          selectedConvertBoxIndices.delete(idx);
          currentConvertingTemplate.activeRects.splice(idx, 1);
          renderConvertTemplateOverlay(currentConvertingTemplate.activeRects);
        }
      });
      box.appendChild(delBtn);

      els.convertTemplateBoxesOverlay.appendChild(box);
    });

    updateConvertSelectionUI();

    if (els.convertTemplateStatusBadge) {
      els.convertTemplateStatusBadge.textContent = safeRects.length > 0
        ? `✓ ${safeRects.length} Photo Frame${safeRects.length === 1 ? '' : 's'} Ready`
        : '⚠️ No Frames (Click & Drag on image to draw)';
      els.convertTemplateStatusBadge.style.color = safeRects.length > 0 ? '#10b981' : '#f59e0b';
    }
  }

  // Global window listeners for box move and resize actions
  window.addEventListener('pointermove', (e) => {
    if (!activeTemplateBoxAction) return;
    const action = activeTemplateBoxAction;
    let deltaNormX = (e.clientX - action.startClientX) / action.overlayRect.width;
    let deltaNormY = (e.clientY - action.startClientY) / action.overlayRect.height;

    // Shift Key Axis Lock for Move: Photoshop style straight horizontal or vertical
    if (action.type === 'move' && e.shiftKey) {
      if (Math.abs(deltaNormX) >= Math.abs(deltaNormY)) {
        deltaNormY = 0;
      } else {
        deltaNormX = 0;
      }
    }

    if (action.type === 'move') {
      let proposedPrimary = {
        x: action.origRect.x + deltaNormX,
        y: action.origRect.y + deltaNormY,
        w: action.origRect.w,
        h: action.origRect.h
      };
      const snapResult = calculateSmartGuidesAndSnap(proposedPrimary, action.boxIndex, true, null);
      action.latestRect = snapResult.rect;
      renderSmartGuides(snapResult.guides);

      const effectiveDeltaX = snapResult.rect.x - action.origRect.x;
      const effectiveDeltaY = snapResult.rect.y - action.origRect.y;

      const allBoxEls = els.convertTemplateBoxesOverlay.querySelectorAll('.convert-frame-box');
      action.origRects.forEach((orig, idx) => {
        let newX = Math.max(0, Math.min(1 - orig.w, orig.x + effectiveDeltaX));
        let newY = Math.max(0, Math.min(1 - orig.h, orig.y + effectiveDeltaY));
        action.latestRects.set(idx, { x: newX, y: newY, w: orig.w, h: orig.h });

        const el = allBoxEls[idx];
        if (el) {
          el.style.left = (newX * 100) + '%';
          el.style.top = (newY * 100) + '%';
          el.style.width = (orig.w * 100) + '%';
          el.style.height = (orig.h * 100) + '%';
        }
      });

    } else if (action.type === 'resize') {
      let proposed = { ...action.origRect };
      const dir = action.dir;
      const isCenterResize = e.altKey || e.ctrlKey;

      if (dir.includes('e')) {
        proposed.w = action.origRect.w + deltaNormX * (isCenterResize ? 2 : 1);
        if (isCenterResize) proposed.x = action.origRect.x - deltaNormX;
      }
      if (dir.includes('w')) {
        proposed.x = action.origRect.x + deltaNormX;
        proposed.w = action.origRect.w - deltaNormX * (isCenterResize ? 2 : 1);
      }
      if (dir.includes('s')) {
        proposed.h = action.origRect.h + deltaNormY * (isCenterResize ? 2 : 1);
        if (isCenterResize) proposed.y = action.origRect.y - deltaNormY;
      }
      if (dir.includes('n')) {
        proposed.y = action.origRect.y + deltaNormY;
        proposed.h = action.origRect.h - deltaNormY * (isCenterResize ? 2 : 1);
      }

      // Proportional aspect ratio lock when Shift is held (Photoshop style)
      if (e.shiftKey && action.aspectRatio) {
        const overlayRatio = action.overlayRect.width / action.overlayRect.height;
        const normRatio = action.aspectRatio / overlayRatio;
        if (dir === 'e' || dir === 'w') {
          proposed.h = proposed.w / normRatio;
        } else if (dir === 'n' || dir === 's') {
          proposed.w = proposed.h * normRatio;
        } else {
          const calcH = proposed.w / normRatio;
          if (dir.includes('n')) {
            proposed.y = (action.origRect.y + action.origRect.h) - calcH;
          }
          proposed.h = calcH;
        }
      }

      const snapResult = calculateSmartGuidesAndSnap(proposed, action.boxIndex, false, dir);
      action.latestRect = snapResult.rect;
      renderSmartGuides(snapResult.guides);

      if (action.boxEl && action.latestRect) {
        action.boxEl.style.left = (action.latestRect.x * 100) + '%';
        action.boxEl.style.top = (action.latestRect.y * 100) + '%';
        action.boxEl.style.width = (action.latestRect.w * 100) + '%';
        action.boxEl.style.height = (action.latestRect.h * 100) + '%';
      }
    }
  });

  const finishTemplateBoxAction = () => {
    if (!activeTemplateBoxAction) return;
    const action = activeTemplateBoxAction;
    activeTemplateBoxAction = null;
    clearSmartGuides();

    if (els.convertTemplateBoxesOverlay) {
      els.convertTemplateBoxesOverlay.querySelectorAll('.convert-frame-box.dragging').forEach(el => {
        el.classList.remove('dragging');
      });
    }

    if (currentConvertingTemplate && Array.isArray(currentConvertingTemplate.activeRects)) {
      if (action.type === 'move' && action.latestRects && action.latestRects.size > 0) {
        action.latestRects.forEach((rect, idx) => {
          const target = currentConvertingTemplate.activeRects[idx];
          if (target) {
            target.x = Math.round(rect.x * 1000) / 1000;
            target.y = Math.round(rect.y * 1000) / 1000;
            target.w = Math.round(rect.w * 1000) / 1000;
            target.h = Math.round(rect.h * 1000) / 1000;
            target.width = target.w;
            target.height = target.h;
          }
        });
      } else if (action.type === 'resize' && action.latestRect) {
        const targetBox = currentConvertingTemplate.activeRects[action.boxIndex];
        if (targetBox) {
          targetBox.x = Math.round(action.latestRect.x * 1000) / 1000;
          targetBox.y = Math.round(action.latestRect.y * 1000) / 1000;
          targetBox.w = Math.round(action.latestRect.w * 1000) / 1000;
          targetBox.h = Math.round(action.latestRect.h * 1000) / 1000;
          targetBox.width = targetBox.w;
          targetBox.height = targetBox.h;
        }
      }
      renderConvertTemplateOverlay(currentConvertingTemplate.activeRects);
    }
  };

  window.addEventListener('pointerup', finishTemplateBoxAction);
  window.addEventListener('pointercancel', finishTemplateBoxAction);

  // Active shape selector for template drawing & mass assignment
  let currentConvertDrawShape = 'rectangle';
  const convertShapeSelector = document.getElementById('convertShapeSelector');
  if (convertShapeSelector) {
    convertShapeSelector.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-shape]');
      if (!btn) return;
      convertShapeSelector.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentConvertDrawShape = btn.dataset.shape || 'rectangle';

      if (selectedConvertBoxIndices.size > 0 && currentConvertingTemplate && Array.isArray(currentConvertingTemplate.activeRects)) {
        selectedConvertBoxIndices.forEach(idx => {
          const b = currentConvertingTemplate.activeRects[idx];
          if (b) b.shape = currentConvertDrawShape;
        });
        renderConvertTemplateOverlay(currentConvertingTemplate.activeRects);
        showToastNotification(`✓ Set ${selectedConvertBoxIndices.size} frame(s) to ${currentConvertDrawShape}`);
      }
    });
  }

  const mainCanvasDrawShapeButtons = document.getElementById('mainCanvasDrawShapeButtons');
  if (mainCanvasDrawShapeButtons) {
    mainCanvasDrawShapeButtons.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-shape]');
      if (!btn) return;
      mainCanvasDrawShapeButtons.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const shape = btn.dataset.shape || 'rectangle';
      if (canvasRenderer) {
        canvasRenderer.setDrawShape(shape);
        canvasRenderer.toggleDrawNewFrameMode(true, shape);
      }
    });
  }

  // Bind interactive mouse drawing onto convertTemplateBoxesOverlay
  if (els.convertTemplateBoxesOverlay) {
    els.convertTemplateBoxesOverlay.addEventListener('pointerdown', (e) => {
      if (activeTemplateBoxAction) return;
      if (e.target !== els.convertTemplateBoxesOverlay) return;
      const rect = els.convertTemplateBoxesOverlay.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const isModifier = e.shiftKey || e.ctrlKey || e.metaKey;
      const startX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const startY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

      if (isModifier) {
        // Shift or Ctrl Drag on Canvas: Marquee Rubber-Band Selection!
        isMarqueeSelecting = true;
        isDrawingFrame = false;
        marqueeStartPoint = {
          x: startX,
          y: startY,
          clientX: e.clientX,
          clientY: e.clientY,
          isCtrl: e.ctrlKey || e.metaKey
        };
        if (els.convertTemplateMarquee) {
          els.convertTemplateMarquee.style.left = (startX * 100) + '%';
          els.convertTemplateMarquee.style.top = (startY * 100) + '%';
          els.convertTemplateMarquee.style.width = '0px';
          els.convertTemplateMarquee.style.height = '0px';
          els.convertTemplateMarquee.style.display = 'block';
        }
      } else {
        // Normal Drag: Draw New Photo Frame Box
        isDrawingFrame = true;
        isMarqueeSelecting = false;
        drawStartPoint = {
          x: startX,
          y: startY,
          clientX: e.clientX,
          clientY: e.clientY
        };
        if (els.convertTemplateGhostBox) {
          els.convertTemplateGhostBox.style.left = (startX * 100) + '%';
          els.convertTemplateGhostBox.style.top = (startY * 100) + '%';
          els.convertTemplateGhostBox.style.width = '0px';
          els.convertTemplateGhostBox.style.height = '0px';
          els.convertTemplateGhostBox.style.display = 'none';
          if (currentConvertDrawShape === 'circle') {
            els.convertTemplateGhostBox.style.borderRadius = '50%';
          } else if (currentConvertDrawShape === 'arch') {
            els.convertTemplateGhostBox.style.borderRadius = '50% 50% 0 0';
          } else if (currentConvertDrawShape === 'diamond') {
            els.convertTemplateGhostBox.style.clipPath = 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
          } else if (currentConvertDrawShape === 'skew') {
            els.convertTemplateGhostBox.style.transform = 'skewX(-15deg)';
          } else if (currentConvertDrawShape === 'brush') {
            els.convertTemplateGhostBox.style.borderRadius = '40% 60% 70% 30% / 40% 50% 60% 50%';
          } else {
            els.convertTemplateGhostBox.style.borderRadius = '4px';
            els.convertTemplateGhostBox.style.clipPath = '';
            els.convertTemplateGhostBox.style.transform = '';
          }
        }
      }

      try { els.convertTemplateBoxesOverlay.setPointerCapture?.(e.pointerId); } catch (_) {}
    });

    els.convertTemplateBoxesOverlay.addEventListener('pointermove', (e) => {
      const rect = els.convertTemplateBoxesOverlay.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      if (isMarqueeSelecting) {
        let currX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        let currY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
        const mLeft = Math.min(marqueeStartPoint.x, currX);
        const mTop = Math.min(marqueeStartPoint.y, currY);
        const mW = Math.abs(currX - marqueeStartPoint.x);
        const mH = Math.abs(currY - marqueeStartPoint.y);

        if (els.convertTemplateMarquee) {
          els.convertTemplateMarquee.style.left = (mLeft * 100) + '%';
          els.convertTemplateMarquee.style.top = (mTop * 100) + '%';
          els.convertTemplateMarquee.style.width = (mW * 100) + '%';
          els.convertTemplateMarquee.style.height = (mH * 100) + '%';
          els.convertTemplateMarquee.style.display = 'block';
        }
        return;
      }

      if (isDrawingFrame) {
        const moveDist = Math.hypot(e.clientX - drawStartPoint.clientX, e.clientY - drawStartPoint.clientY);
        if (moveDist > 3 && els.convertTemplateGhostBox) {
          els.convertTemplateGhostBox.style.display = 'block';
        }

        let currX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        let currY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

        const snapResult = calculateSmartGuidesAndSnap({
          x: Math.min(drawStartPoint.x, currX),
          y: Math.min(drawStartPoint.y, currY),
          w: Math.abs(currX - drawStartPoint.x),
          h: Math.abs(currY - drawStartPoint.y)
        }, -1, false, currX >= drawStartPoint.x ? (currY >= drawStartPoint.y ? 'se' : 'ne') : (currY >= drawStartPoint.y ? 'sw' : 'nw'));

        renderSmartGuides(snapResult.guides);

        if (els.convertTemplateGhostBox) {
          els.convertTemplateGhostBox.style.left = (snapResult.rect.x * 100) + '%';
          els.convertTemplateGhostBox.style.top = (snapResult.rect.y * 100) + '%';
          els.convertTemplateGhostBox.style.width = (snapResult.rect.w * 100) + '%';
          els.convertTemplateGhostBox.style.height = (snapResult.rect.h * 100) + '%';
        }
      }
    });

    const finishOverlayAction = (e) => {
      if (isMarqueeSelecting) {
        isMarqueeSelecting = false;
        if (els.convertTemplateMarquee) els.convertTemplateMarquee.style.display = 'none';
        try { els.convertTemplateBoxesOverlay.releasePointerCapture?.(e.pointerId); } catch (_) {}

        const rect = els.convertTemplateBoxesOverlay.getBoundingClientRect();
        if (rect.width && rect.height) {
          let currX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          let currY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
          const mLeft = Math.min(marqueeStartPoint.x, currX);
          const mTop = Math.min(marqueeStartPoint.y, currY);
          const mW = Math.abs(currX - marqueeStartPoint.x);
          const mH = Math.abs(currY - marqueeStartPoint.y);

          if (mW > 0.01 && mH > 0.01 && currentConvertingTemplate && Array.isArray(currentConvertingTemplate.activeRects)) {
            const isCtrl = marqueeStartPoint.isCtrl;
            currentConvertingTemplate.activeRects.forEach((b, idx) => {
              const bw = b.width !== undefined ? b.width : b.w;
              const bh = b.height !== undefined ? b.height : b.h;
              const intersects = (b.x < mLeft + mW && b.x + bw > mLeft && b.y < mTop + mH && b.y + bh > mTop);
              if (intersects) {
                if (isCtrl) {
                  if (selectedConvertBoxIndices.has(idx)) selectedConvertBoxIndices.delete(idx);
                  else selectedConvertBoxIndices.add(idx);
                } else {
                  selectedConvertBoxIndices.add(idx);
                }
              }
            });
            updateConvertSelectionUI();
          }
        }
        return;
      }

      if (isDrawingFrame) {
        isDrawingFrame = false;
        clearSmartGuides();
        if (els.convertTemplateGhostBox) els.convertTemplateGhostBox.style.display = 'none';
        try { els.convertTemplateBoxesOverlay.releasePointerCapture?.(e.pointerId); } catch (_) {}

        const moveDist = Math.hypot(e.clientX - drawStartPoint.clientX, e.clientY - drawStartPoint.clientY);
        if (moveDist <= 4) {
          // Click on empty canvas without dragging: Deselect all frames
          selectedConvertBoxIndices.clear();
          updateConvertSelectionUI();
          return;
        }

        const rect = els.convertTemplateBoxesOverlay.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        let currX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        let currY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

        const snapResult = calculateSmartGuidesAndSnap({
          x: Math.min(drawStartPoint.x, currX),
          y: Math.min(drawStartPoint.y, currY),
          w: Math.abs(currX - drawStartPoint.x),
          h: Math.abs(currY - drawStartPoint.y)
        }, -1, false, currX >= drawStartPoint.x ? (currY >= drawStartPoint.y ? 'se' : 'ne') : (currY >= drawStartPoint.y ? 'sw' : 'nw'));

        const left = snapResult.rect.x;
        const top = snapResult.rect.y;
        const w = snapResult.rect.w;
        const h = snapResult.rect.h;

        // Require minimum 2.5% width and height to qualify as an intentional frame box
        if (w >= 0.025 && h >= 0.025 && currentConvertingTemplate) {
          const activeShape = currentConvertDrawShape || 'rectangle';
          const newBox = {
            x: Math.round(left * 1000) / 1000,
            y: Math.round(top * 1000) / 1000,
            width: Math.round(w * 1000) / 1000,
            height: Math.round(h * 1000) / 1000,
            w: Math.round(w * 1000) / 1000,
            h: Math.round(h * 1000) / 1000,
            shape: activeShape
          };
          if (!Array.isArray(currentConvertingTemplate.activeRects)) {
            currentConvertingTemplate.activeRects = [];
          }
          currentConvertingTemplate.activeRects.push(newBox);
          currentConvertingTemplate.activeRects.sort((a, b) => {
            if (Math.abs(a.y - b.y) > 0.08) return a.y - b.y;
            return a.x - b.x;
          });
          const newIdx = currentConvertingTemplate.activeRects.indexOf(newBox);
          selectedConvertBoxIndices.clear();
          if (newIdx !== -1) selectedConvertBoxIndices.add(newIdx);
          renderConvertTemplateOverlay(currentConvertingTemplate.activeRects);
        }
      }
    };

    els.convertTemplateBoxesOverlay.addEventListener('pointerup', finishOverlayAction);
    els.convertTemplateBoxesOverlay.addEventListener('pointercancel', finishOverlayAction);
  }

  // Multi-Selection and Frame Toolbar Buttons
  if (els.btnConvertSelectAll) {
    els.btnConvertSelectAll.addEventListener('click', () => {
      if (currentConvertingTemplate && Array.isArray(currentConvertingTemplate.activeRects)) {
        selectedConvertBoxIndices = new Set(currentConvertingTemplate.activeRects.map((_, i) => i));
        updateConvertSelectionUI();
      }
    });
  }

  if (els.btnConvertDeselectAll) {
    els.btnConvertDeselectAll.addEventListener('click', () => {
      selectedConvertBoxIndices.clear();
      updateConvertSelectionUI();
    });
  }

  if (els.btnConvertDuplicateSelected) {
    els.btnConvertDuplicateSelected.addEventListener('click', () => {
      duplicateSelectedBoxes();
    });
  }

  if (els.btnConvertDeleteSelected) {
    els.btnConvertDeleteSelected.addEventListener('click', () => {
      deleteSelectedBoxes();
    });
  }

  if (els.btnConvertAlignLeft) els.btnConvertAlignLeft.addEventListener('click', () => alignSelectedBoxes('left'));
  if (els.btnConvertAlignCenterH) els.btnConvertAlignCenterH.addEventListener('click', () => alignSelectedBoxes('centerH'));
  if (els.btnConvertAlignRight) els.btnConvertAlignRight.addEventListener('click', () => alignSelectedBoxes('right'));
  if (els.btnConvertAlignTop) els.btnConvertAlignTop.addEventListener('click', () => alignSelectedBoxes('top'));
  if (els.btnConvertAlignMiddleV) els.btnConvertAlignMiddleV.addEventListener('click', () => alignSelectedBoxes('middleV'));
  if (els.btnConvertAlignBottom) els.btnConvertAlignBottom.addEventListener('click', () => alignSelectedBoxes('bottom'));

  if (els.btnDistributeH) els.btnDistributeH.addEventListener('click', () => distributeSelectedBoxes('h'));
  if (els.btnDistributeV) els.btnDistributeV.addEventListener('click', () => distributeSelectedBoxes('v'));

  if (els.btnMakeSameWidth) els.btnMakeSameWidth.addEventListener('click', () => makeSelectedSameDimension('width'));
  if (els.btnMakeSameHeight) els.btnMakeSameHeight.addEventListener('click', () => makeSelectedSameDimension('height'));

  if (els.btnConvertAddText) {
    els.btnConvertAddText.addEventListener('click', () => {
      if (!currentConvertingTemplate) return;
      if (!Array.isArray(currentConvertingTemplate.activeRects)) {
        currentConvertingTemplate.activeRects = [];
      }
      const newTextBox = {
        x: 0.35,
        y: 0.45,
        width: 0.30,
        height: 0.10,
        w: 0.30,
        h: 0.10,
        shape: 'rectangle',
        isText: true,
        text: 'Add Title Here'
      };
      currentConvertingTemplate.activeRects.push(newTextBox);
      const newIdx = currentConvertingTemplate.activeRects.length - 1;
      selectedConvertBoxIndices.clear();
      selectedConvertBoxIndices.add(newIdx);
      renderConvertTemplateOverlay(currentConvertingTemplate.activeRects);
      showToastNotification('✓ Added text box to template.');
    });
  }

  // Clear All Frames Handler (Allows user to cleanly draw all boxes from scratch)
  if (els.btnConvertClearFrames) {
    els.btnConvertClearFrames.addEventListener('click', () => {
      if (!currentConvertingTemplate) return;
      selectedConvertBoxIndices.clear();
      currentConvertingTemplate.activeRects = [];
      renderConvertTemplateOverlay([]);
      showToastNotification('Cleared frames! Click & drag anywhere on the image to draw your custom frames.');
    });
  }

  // Auto Re-Detect Frames Handler
  if (els.btnConvertRedetectFrames) {
    els.btnConvertRedetectFrames.addEventListener('click', () => {
      if (!currentConvertingTemplate || !currentConvertingTemplate.sourceImg) return;
      selectedConvertBoxIndices.clear();
      const reDetected = analyzeImageForFrames(currentConvertingTemplate.sourceImg);
      currentConvertingTemplate.autoRects = reDetected;
      currentConvertingTemplate.activeRects = [...reDetected];
      if (els.lblAutoCount) els.lblAutoCount.textContent = reDetected.length.toString();
      renderConvertTemplateOverlay(reDetected);
      showToastNotification(`✓ Re-detected ${reDetected.length} frames.`);
    });
  }

  // Window Keydown Shortcuts for Template Designer Modal
  window.addEventListener('keydown', (e) => {
    if (!els.modalConvertTemplatePreview || !els.modalConvertTemplatePreview.classList.contains('open')) return;
    const activeEl = document.activeElement;
    const isTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
    const isCtrlOrCmd = e.ctrlKey || e.metaKey;

    if (isCtrlOrCmd && (e.key === 'a' || e.key === 'A')) {
      if (isTyping) return;
      e.preventDefault();
      if (currentConvertingTemplate && Array.isArray(currentConvertingTemplate.activeRects)) {
        selectedConvertBoxIndices = new Set(currentConvertingTemplate.activeRects.map((_, i) => i));
        updateConvertSelectionUI();
      }
      return;
    }

    if (isCtrlOrCmd && (e.key === 'j' || e.key === 'J')) {
      e.preventDefault();
      duplicateSelectedBoxes();
      return;
    }

    if ((isCtrlOrCmd && (e.key === 'd' || e.key === 'D')) || e.key === 'Escape') {
      if (selectedConvertBoxIndices.size > 0) {
        e.preventDefault();
        selectedConvertBoxIndices.clear();
        updateConvertSelectionUI();
        return;
      }
    }

    if ((e.key === 'Delete' || e.key === 'Backspace') && !isTyping) {
      if (selectedConvertBoxIndices.size > 0) {
        e.preventDefault();
        deleteSelectedBoxes();
      }
      return;
    }

    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) && !isTyping) {
      if (selectedConvertBoxIndices.size > 0) {
        e.preventDefault();
        const step = e.shiftKey ? 0.02 : 0.005;
        let dx = 0;
        let dy = 0;
        if (e.key === 'ArrowLeft') dx = -step;
        if (e.key === 'ArrowRight') dx = step;
        if (e.key === 'ArrowUp') dy = -step;
        if (e.key === 'ArrowDown') dy = step;
        nudgeSelectedBoxes(dx, dy);
      }
      return;
    }
  });

  function displayBatchItem(index) {
    if (!batchTemplatesQueue || index < 0 || index >= batchTemplatesQueue.length) return;
    batchCurrentIndex = index;
    const item = batchTemplatesQueue[index];
    currentConvertingTemplate = item;

    if (els.inputConvertedTemplateName) {
      els.inputConvertedTemplateName.value = item.name;
    }
    if (els.convertTemplateSourceImg) {
      els.convertTemplateSourceImg.src = item.sourceImgData;
    }
    if (els.lblBatchProgress) {
      els.lblBatchProgress.textContent = `Template ${index + 1} of ${batchTemplatesQueue.length}: ${item.fileName}`;
    }
    if (els.btnBatchPrev) {
      els.btnBatchPrev.disabled = (index === 0);
    }
    if (els.btnBatchNext) {
      els.btnBatchNext.disabled = (index === batchTemplatesQueue.length - 1);
    }
    if (els.lblAutoCount) {
      els.lblAutoCount.textContent = (item.autoRects?.length || 0).toString();
    }

    if (els.convertPresetButtons) {
      els.convertPresetButtons.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      if (els.btnPresetAutoDetect) els.btnPresetAutoDetect.classList.add('active');
    }

    renderConvertTemplateOverlay(item.activeRects || item.autoRects);
  }

  function finishAndSaveBatchTemplates() {
    let savedCount = 0;
    (batchTemplatesQueue || []).forEach(item => {
      const rects = (item.activeRects && item.activeRects.length > 0) ? item.activeRects : item.autoRects;
      if (rects && rects.length > 0) {
        layoutEngine.addCustomTemplate({
          name: item.name || item.fileName || 'Batch Template',
          rects: rects,
          sourceImage: item.sourceImgData || null
        });
        savedCount++;
      }
    });

    els.modalConvertTemplatePreview?.classList.remove('open');
    renderCustomTemplatesManagerList();
    renderFloatingLayoutsBar();
    updateCustomTemplateCountBadge();
    showToastNotification(`✓ Successfully converted & saved ${savedCount} custom templates to library!`);
    batchTemplatesQueue = [];
  }

  if (els.btnBatchPrev) {
    els.btnBatchPrev.addEventListener('click', () => {
      if (currentConvertingTemplate && els.inputConvertedTemplateName) {
        currentConvertingTemplate.name = els.inputConvertedTemplateName.value.trim() || currentConvertingTemplate.name;
      }
      displayBatchItem(batchCurrentIndex - 1);
    });
  }

  if (els.btnBatchNext) {
    els.btnBatchNext.addEventListener('click', () => {
      if (currentConvertingTemplate && els.inputConvertedTemplateName) {
        currentConvertingTemplate.name = els.inputConvertedTemplateName.value.trim() || currentConvertingTemplate.name;
      }
      displayBatchItem(batchCurrentIndex + 1);
    });
  }

  if (els.btnBatchSkip) {
    els.btnBatchSkip.addEventListener('click', () => {
      if (batchCurrentIndex < batchTemplatesQueue.length - 1) {
        displayBatchItem(batchCurrentIndex + 1);
      } else {
        finishAndSaveBatchTemplates();
      }
    });
  }

  if (els.btnBatchConfirmNext) {
    els.btnBatchConfirmNext.addEventListener('click', () => {
      if (currentConvertingTemplate) {
        if (els.inputConvertedTemplateName) {
          currentConvertingTemplate.name = els.inputConvertedTemplateName.value.trim() || currentConvertingTemplate.name;
        }
        currentConvertingTemplate.confirmed = true;
      }
      if (batchCurrentIndex < batchTemplatesQueue.length - 1) {
        displayBatchItem(batchCurrentIndex + 1);
      } else {
        finishAndSaveBatchTemplates();
      }
    });
  }

  if (els.btnBatchConfirmAll) {
    els.btnBatchConfirmAll.addEventListener('click', () => {
      if (currentConvertingTemplate && els.inputConvertedTemplateName) {
        currentConvertingTemplate.name = els.inputConvertedTemplateName.value.trim() || currentConvertingTemplate.name;
      }
      finishAndSaveBatchTemplates();
    });
  }

  if (els.btnCancelBatchConvert) {
    els.btnCancelBatchConvert.addEventListener('click', () => {
      els.modalConvertTemplatePreview?.classList.remove('open');
      batchTemplatesQueue = [];
    });
  }

  if (els.btnLoadTemplateImage && els.inputLoadTemplateImage) {
    els.btnLoadTemplateImage.addEventListener('click', (e) => {
      e.preventDefault();
      els.inputLoadTemplateImage.value = '';
      els.inputLoadTemplateImage.click();
    });

    els.inputLoadTemplateImage.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      const jsonFiles = files.filter(f => f.name.endsWith('.json'));
      const imageFiles = files.filter(f => !f.name.endsWith('.json'));

      // 1. Process any JSON template files directly
      jsonFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (evt) => {
          try {
            const parsed = JSON.parse(evt.target.result);
            if (parsed && Array.isArray(parsed.rects)) {
              const name = parsed.name || file.name.replace(/\.[^/.]+$/, '');
              layoutEngine.addCustomTemplate({ name, rects: parsed.rects });
              renderCustomTemplatesManagerList();
              renderFloatingLayoutsBar();
              updateCustomTemplateCountBadge();
              showToastNotification(`✓ Imported custom template: "${name}"`);
            }
          } catch (_) {}
        };
        reader.readAsText(file);
      });

      if (imageFiles.length === 0) return;

      // 2. Process Image files in batch
      showToastNotification(`Analyzing ${imageFiles.length} template image${imageFiles.length === 1 ? '' : 's'} offline...`);
      batchTemplatesQueue = [];

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        await new Promise((res) => {
          const reader = new FileReader();
          reader.onload = (evt) => {
            const dataUrl = evt.target.result;
            const img = new Image();
            img.onload = () => {
              const detectedRects = analyzeImageForFrames(img);
              const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
              const formattedName = baseName.charAt(0).toUpperCase() + baseName.slice(1);

              batchTemplatesQueue.push({
                file: file,
                fileName: file.name,
                name: formattedName + ` (${detectedRects.length}-Photo Layout)`,
                sourceImg: img,
                sourceImgData: dataUrl,
                autoRects: detectedRects,
                activeRects: [...detectedRects],
                confirmed: false
              });
              res();
            };
            img.onerror = () => res();
            img.src = dataUrl;
          };
          reader.onerror = () => res();
          reader.readAsDataURL(file);
        });
      }

      if (batchTemplatesQueue.length === 0) return;

      const isBatch = batchTemplatesQueue.length > 1;
      if (els.convertBatchNav) els.convertBatchNav.style.display = isBatch ? 'flex' : 'none';
      if (els.convertSingleActions) els.convertSingleActions.style.display = isBatch ? 'none' : 'flex';
      if (els.convertBatchActions) els.convertBatchActions.style.display = isBatch ? 'flex' : 'none';

      displayBatchItem(0);
      els.modalConvertTemplatePreview?.classList.add('open');
    });
  }

  // Handle Preset Frame buttons in Convert Modal
  if (els.convertPresetButtons) {
    els.convertPresetButtons.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-preset]');
      if (!btn || !currentConvertingTemplate) return;
      els.convertPresetButtons.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const preset = btn.dataset.preset;

      let rects = [];
      if (preset === 'auto') {
        rects = currentConvertingTemplate.autoRects;
      } else if (preset === '1') {
        rects = [{ x: 0.04, y: 0.04, width: 0.92, height: 0.92, w: 0.92, h: 0.92 }];
      } else if (preset === '2h') {
        rects = [
          { x: 0.03, y: 0.04, width: 0.455, height: 0.92, w: 0.455, h: 0.92 },
          { x: 0.515, y: 0.04, width: 0.455, height: 0.92, w: 0.455, h: 0.92 }
        ];
      } else if (preset === '3') {
        rects = [
          { x: 0.03, y: 0.04, width: 0.46, height: 0.92, w: 0.46, h: 0.92 },
          { x: 0.51, y: 0.04, width: 0.46, height: 0.445, w: 0.46, h: 0.445 },
          { x: 0.51, y: 0.515, width: 0.46, height: 0.445, w: 0.46, h: 0.445 }
        ];
      } else if (preset === '4') {
        rects = [
          { x: 0.04, y: 0.04, width: 0.44, height: 0.44, w: 0.44, h: 0.44 },
          { x: 0.52, y: 0.04, width: 0.44, height: 0.44, w: 0.44, h: 0.44 },
          { x: 0.04, y: 0.52, width: 0.44, height: 0.44, w: 0.44, h: 0.44 },
          { x: 0.52, y: 0.52, width: 0.44, height: 0.44, w: 0.44, h: 0.44 }
        ];
      } else if (preset === '6') {
        rects = [
          { x: 0.03, y: 0.04, width: 0.29, height: 0.44, w: 0.29, h: 0.44 },
          { x: 0.355, y: 0.04, width: 0.29, height: 0.44, w: 0.29, h: 0.44 },
          { x: 0.68, y: 0.04, width: 0.29, height: 0.44, w: 0.29, h: 0.44 },
          { x: 0.03, y: 0.52, width: 0.29, height: 0.44, w: 0.29, h: 0.44 },
          { x: 0.355, y: 0.52, width: 0.29, height: 0.44, w: 0.29, h: 0.44 },
          { x: 0.68, y: 0.52, width: 0.29, height: 0.44, w: 0.29, h: 0.44 }
        ];
      }

      currentConvertingTemplate.activeRects = rects;
      renderConvertTemplateOverlay(rects);
    });
  }

  // Close / Cancel Convert Modal
  if (els.btnCloseConvertTemplate) {
    els.btnCloseConvertTemplate.addEventListener('click', () => {
      els.modalConvertTemplatePreview?.classList.remove('open');
      batchTemplatesQueue = [];
    });
  }
  if (els.btnCancelConvertTemplate) {
    els.btnCancelConvertTemplate.addEventListener('click', () => {
      els.modalConvertTemplatePreview?.classList.remove('open');
      batchTemplatesQueue = [];
    });
  }

  // Save to Library Only (Single Mode)
  if (els.btnSaveTemplateOnly) {
    els.btnSaveTemplateOnly.addEventListener('click', () => {
      const name = (els.inputConvertedTemplateName?.value || '').trim() || 'Custom Template';
      const rects = currentConvertingTemplate?.activeRects || currentConvertingTemplate?.autoRects;
      if (!rects || rects.length === 0) return;

      const templateData = {
        name: name,
        rects: rects,
        sourceImage: currentConvertingTemplate?.sourceImgData || null
      };
      if (currentConvertingTemplate?.id) {
        templateData.id = currentConvertingTemplate.id;
      }

      const saved = currentConvertingTemplate?.id
        ? layoutEngine.saveOrUpdateTemplate(templateData)
        : layoutEngine.addCustomTemplate(templateData);

      if (saved) {
        els.modalConvertTemplatePreview?.classList.remove('open');
        renderCustomTemplatesManagerList();
        renderFloatingLayoutsBar();
        updateCustomTemplateCountBadge();
        updateAllTemplateCountBadges();
        if (typeof renderBigViewGrid === 'function') {
          renderBigViewGrid();
        }
        showToastNotification(`✓ Saved template "${name}" to library!`);
      }
    });
  }

  // Save and Apply to Spread (Single Mode)
  if (els.btnSaveAndApplyTemplate) {
    els.btnSaveAndApplyTemplate.addEventListener('click', () => {
      const name = (els.inputConvertedTemplateName?.value || '').trim() || 'Custom Template';
      const rects = currentConvertingTemplate?.activeRects || currentConvertingTemplate?.autoRects;
      if (!rects || rects.length === 0) return;

      const templateData = {
        name: name,
        rects: rects,
        sourceImage: currentConvertingTemplate?.sourceImgData || null
      };
      if (currentConvertingTemplate?.id) {
        templateData.id = currentConvertingTemplate.id;
      }

      const saved = currentConvertingTemplate?.id
        ? layoutEngine.saveOrUpdateTemplate(templateData)
        : layoutEngine.addCustomTemplate(templateData);

      if (saved) {
        applyTemplateFromBigView(saved);
        els.modalConvertTemplatePreview?.classList.remove('open');
        els.modalManageCustomTemplates?.classList.remove('open');
        renderCustomTemplatesManagerList();
        renderFloatingLayoutsBar();
        updateCustomTemplateCountBadge();
        updateAllTemplateCountBadges();
        if (typeof renderBigViewGrid === 'function') {
          renderBigViewGrid();
        }
        showToastNotification(`✓ Saved & applied "${name}" directly to spread!`);
      }
    });
  }

  // ==================== Audio Notification on Export Complete ====================
  function playExportCompleteSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      // Tone 1: C5 (523.25 Hz) -> G5 (783.99 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now);
      osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.18);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Tone 2: E6 (1318.51 Hz) crystal chime
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1046.50, now + 0.18);
      osc2.frequency.exponentialRampToValueAtTime(1318.51, now + 0.35);
      gain2.gain.setValueAtTime(0.001, now);
      gain2.gain.setValueAtTime(0.35, now + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.75);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.18);
      osc2.stop(now + 0.75);
    } catch (e) {
      console.warn('Audio chime notification notice:', e);
    }
  }

  window.playExportCompleteSound = playExportCompleteSound;



  // ==================== Add Text in Custom Template Manager ====================
  const btnConvertAddText = document.getElementById('btnConvertAddText');
  if (btnConvertAddText) {
    btnConvertAddText.addEventListener('click', () => {
      if (!currentConvertingTemplate) return;
      if (!Array.isArray(currentConvertingTemplate.activeRects)) {
        currentConvertingTemplate.activeRects = [];
      }
      const newTextBox = {
        x: 0.3,
        y: 0.42,
        width: 0.4,
        height: 0.16,
        w: 0.4,
        h: 0.16,
        shape: 'rectangle',
        isText: true,
        text: 'Title / Caption Here',
        fontSize: 28,
        fontFamily: 'Playfair Display, Georgia, serif',
        textColor: '#1e293b',
        textAlign: 'center',
        fontWeight: 'bold',
        fontStyle: 'normal'
      };
      currentConvertingTemplate.activeRects.push(newTextBox);
      renderConvertTemplateOverlay(currentConvertingTemplate.activeRects);
      showToastNotification('🔤 Added text frame to template!');
    });
  }


  // ==================== Adobe Photoshop Style Character Side Panel Logic ====================
  let activeTextEditorTarget = null; // { spreadIndex, slotIndex }
  const textCharacterPanel = document.getElementById('textCharacterPanel');
  const btnCloseTextEditor = document.getElementById('btnCloseTextEditor');
  const btnApplyTextEditor = document.getElementById('btnApplyTextEditor');
  const btnDeleteTextLayer = document.getElementById('btnDeleteTextLayer');
  const inputTextEditorContent = document.getElementById('inputTextEditorContent');
  const selectTextFontFamily = document.getElementById('selectTextFontFamily');
  const selectTextFontStyle = document.getElementById('selectTextFontStyle');
  const numTextFontSize = document.getElementById('numTextFontSize');
  const rangeTextFontSize = document.getElementById('rangeTextFontSize');
  const btnFontSizeUp = document.getElementById('btnFontSizeUp');
  const btnFontSizeDown = document.getElementById('btnFontSizeDown');
  const pickerTextColor = document.getElementById('pickerTextColor');
  const inputTextHexColor = document.getElementById('inputTextHexColor');
  const psColorBoxPreview = document.getElementById('psColorBoxPreview');
  const textColorSwatches = document.getElementById('textColorSwatches');
  const btnTextWeightBold = document.getElementById('btnTextWeightBold');
  const btnTextStyleItalic = document.getElementById('btnTextStyleItalic');
  const btnTextAllCaps = document.getElementById('btnTextAllCaps');
  const btnTextUnderline = document.getElementById('btnTextUnderline');
  const btnTextAlignLeft = document.getElementById('btnTextAlignLeft');
  const btnTextAlignCenter = document.getElementById('btnTextAlignCenter');
  const btnTextAlignRight = document.getElementById('btnTextAlignRight');
  const tabCharacter = document.getElementById('tabCharacter');
  const tabParagraph = document.getElementById('tabParagraph');

  let currentTextAlign = 'center';
  let currentTextWeight = 'bold';
  let currentTextStyle = 'normal';
  let currentAllCaps = false;
  let currentUnderline = false;

  function updateTextLive(propUpdates = {}) {
    if (!activeTextEditorTarget) return;
    const { spreadIndex, slotIndex } = activeTextEditorTarget;
    const spread = albumState.project?.spreads?.[spreadIndex];
    if (!spread || !spread.slots) return;
    const slot = spread.slots.find(s => s.slotIndex === slotIndex);
    if (!slot) return;

    Object.assign(slot, propUpdates);
    canvasRenderer.requestRender();
  }

  function updateCharacterButtonsUI() {
    if (btnTextWeightBold) btnTextWeightBold.classList.toggle('active', currentTextWeight === 'bold');
    if (btnTextStyleItalic) btnTextStyleItalic.classList.toggle('active', currentTextStyle === 'italic');
    if (btnTextAllCaps) btnTextAllCaps.classList.toggle('active', Boolean(currentAllCaps));
    if (btnTextUnderline) btnTextUnderline.classList.toggle('active', Boolean(currentUnderline));

    if (selectTextFontStyle) {
      if (currentTextWeight === 'bold' && currentTextStyle === 'italic') {
        selectTextFontStyle.value = 'bold-italic';
      } else if (currentTextWeight === 'bold') {
        selectTextFontStyle.value = 'bold';
      } else if (currentTextStyle === 'italic') {
        selectTextFontStyle.value = 'italic';
      } else {
        selectTextFontStyle.value = 'regular';
      }
    }
  }

  function updateTextAlignButtonsUI() {
    if (btnTextAlignLeft) btnTextAlignLeft.classList.toggle('active', currentTextAlign === 'left');
    if (btnTextAlignCenter) btnTextAlignCenter.classList.toggle('active', currentTextAlign === 'center');
    if (btnTextAlignRight) btnTextAlignRight.classList.toggle('active', currentTextAlign === 'right');
  }

  function updateColorUI(color) {
    if (!color) return;
    if (pickerTextColor) pickerTextColor.value = color;
    if (inputTextHexColor) inputTextHexColor.value = color;
    if (psColorBoxPreview) psColorBoxPreview.style.backgroundColor = color;

    if (textColorSwatches) {
      const chips = textColorSwatches.querySelectorAll('.ps-swatch-chip');
      chips.forEach(chip => {
        const cVal = chip.dataset.color?.toLowerCase();
        chip.classList.toggle('active', cVal === color.toLowerCase());
      });
    }
  }

  function openTextEditorModal(spreadIndex, slotIndex) {
    const spread = albumState.project?.spreads?.[spreadIndex];
    if (!spread || !spread.slots) return;
    const slot = spread.slots.find(s => s.slotIndex === slotIndex);
    if (!slot) return;

    // Ensure text character panel opens strictly alone (dismiss unsummoned drawers, popovers, or inspector bars)
    if (els.layoutsDrawer) els.layoutsDrawer.classList.remove('open');
    if (els.photoFramePreviewBar) els.photoFramePreviewBar.style.display = 'none';
    if (Array.isArray(dockContainers)) {
      dockContainers.forEach(d => d.container?.classList.remove('open'));
    }
    const openPopovers = document.querySelectorAll('.dock-pill-container.open, .dock-popover-panel.open');
    openPopovers.forEach(el => el.classList.remove('open'));
    if (els.profileMenuContainer) els.profileMenuContainer.classList.remove('open');

    activeTextEditorTarget = { spreadIndex, slotIndex };

    if (inputTextEditorContent) inputTextEditorContent.value = slot.text !== undefined ? slot.text : '';
    if (selectTextFontFamily) selectTextFontFamily.value = slot.fontFamily || 'Playfair Display, Georgia, serif';

    const sz = slot.fontSize || 28;
    if (numTextFontSize) numTextFontSize.value = sz;
    if (rangeTextFontSize) rangeTextFontSize.value = sz;

    currentTextAlign = slot.textAlign || 'center';
    currentTextWeight = slot.fontWeight || 'bold';
    currentTextStyle = slot.fontStyle || 'normal';
    currentAllCaps = Boolean(slot.allCaps);
    currentUnderline = Boolean(slot.underline);

    updateCharacterButtonsUI();
    updateTextAlignButtonsUI();
    updateColorUI(slot.textColor || '#1e293b');

    // Dock Photoshop Character Panel on the side (no modal overlay blocking canvas)
    if (textCharacterPanel) {
      if (typeof closeAllAsidePanels === 'function') {
        closeAllAsidePanels();
      }
      textCharacterPanel.classList.add('open');
      document.getElementById('btnAddTextCanvas')?.classList.add('active');
    }
    setTimeout(() => inputTextEditorContent?.focus(), 60);
  }

  window.openTextEditorModal = openTextEditorModal;

  function closeTextEditorModal() {
    if (textCharacterPanel) {
      textCharacterPanel.classList.remove('open');
      if (canvasRenderer?.activeTool !== 'text') {
        document.getElementById('btnAddTextCanvas')?.classList.remove('active');
      }
    }
    activeTextEditorTarget = null;
  }

  window.closeTextEditorModal = closeTextEditorModal;

  // Tabs for Character & Paragraph
  if (tabCharacter && tabParagraph) {
    tabCharacter.addEventListener('click', () => {
      tabCharacter.classList.add('active');
      tabParagraph.classList.remove('active');
    });
    tabParagraph.addEventListener('click', () => {
      tabParagraph.classList.add('active');
      tabCharacter.classList.remove('active');
    });
  }

  // Live Text Typing
  if (inputTextEditorContent) {
    inputTextEditorContent.addEventListener('input', (e) => {
      updateTextLive({ text: e.target.value });
    });
  }

  // Live Font Family
  if (selectTextFontFamily) {
    selectTextFontFamily.addEventListener('change', (e) => {
      updateTextLive({ fontFamily: e.target.value });
    });
  }

  // Live Font Style Dropdown
  if (selectTextFontStyle) {
    selectTextFontStyle.addEventListener('change', (e) => {
      const v = e.target.value;
      if (v === 'bold-italic') {
        currentTextWeight = 'bold';
        currentTextStyle = 'italic';
      } else if (v === 'bold') {
        currentTextWeight = 'bold';
        currentTextStyle = 'normal';
      } else if (v === 'italic') {
        currentTextWeight = 'normal';
        currentTextStyle = 'italic';
      } else {
        currentTextWeight = 'normal';
        currentTextStyle = 'normal';
      }
      updateCharacterButtonsUI();
      updateTextLive({ fontWeight: currentTextWeight, fontStyle: currentTextStyle });
    });
  }

  // Live Font Size Controls (Number + Range + Steppers)
  function applyFontSize(newSize) {
    const clamped = Math.max(8, Math.min(250, parseInt(newSize, 10) || 28));
    if (numTextFontSize) numTextFontSize.value = clamped;
    if (rangeTextFontSize) rangeTextFontSize.value = clamped;
    updateTextLive({ fontSize: clamped });
  }

  if (numTextFontSize) {
    numTextFontSize.addEventListener('input', (e) => applyFontSize(e.target.value));
  }
  if (rangeTextFontSize) {
    rangeTextFontSize.addEventListener('input', (e) => applyFontSize(e.target.value));
  }
  if (btnFontSizeUp) {
    btnFontSizeUp.addEventListener('click', () => {
      const cur = parseInt(numTextFontSize?.value, 10) || 28;
      applyFontSize(cur + 2);
    });
  }
  if (btnFontSizeDown) {
    btnFontSizeDown.addEventListener('click', () => {
      const cur = parseInt(numTextFontSize?.value, 10) || 28;
      applyFontSize(cur - 2);
    });
  }

  // Live Color Picker & Hex Input
  if (pickerTextColor) {
    pickerTextColor.addEventListener('input', (e) => {
      const col = e.target.value;
      updateColorUI(col);
      updateTextLive({ textColor: col });
    });
  }

  if (inputTextHexColor) {
    inputTextHexColor.addEventListener('input', (e) => {
      let col = e.target.value.trim();
      if (!col.startsWith('#')) col = '#' + col;
      if (/^#[0-9A-Fa-f]{6}$/.test(col)) {
        updateColorUI(col);
        updateTextLive({ textColor: col });
      }
    });
  }

  // Live Preset Swatches
  if (textColorSwatches) {
    textColorSwatches.addEventListener('click', (e) => {
      const chip = e.target.closest('.ps-swatch-chip');
      if (!chip) return;
      const col = chip.dataset.color;
      if (col) {
        updateColorUI(col);
        updateTextLive({ textColor: col });
      }
    });
  }

  // Photoshop Character Toggle Buttons
  if (btnTextWeightBold) {
    btnTextWeightBold.addEventListener('click', () => {
      currentTextWeight = (currentTextWeight === 'bold' ? 'normal' : 'bold');
      updateCharacterButtonsUI();
      updateTextLive({ fontWeight: currentTextWeight });
    });
  }

  if (btnTextStyleItalic) {
    btnTextStyleItalic.addEventListener('click', () => {
      currentTextStyle = (currentTextStyle === 'italic' ? 'normal' : 'italic');
      updateCharacterButtonsUI();
      updateTextLive({ fontStyle: currentTextStyle });
    });
  }

  if (btnTextAllCaps) {
    btnTextAllCaps.addEventListener('click', () => {
      currentAllCaps = !currentAllCaps;
      updateCharacterButtonsUI();
      updateTextLive({ allCaps: currentAllCaps });
    });
  }

  if (btnTextUnderline) {
    btnTextUnderline.addEventListener('click', () => {
      currentUnderline = !currentUnderline;
      updateCharacterButtonsUI();
      updateTextLive({ underline: currentUnderline });
    });
  }

  // Alignment Buttons
  if (btnTextAlignLeft) {
    btnTextAlignLeft.addEventListener('click', () => {
      currentTextAlign = 'left';
      updateTextAlignButtonsUI();
      updateTextLive({ textAlign: currentTextAlign });
    });
  }
  if (btnTextAlignCenter) {
    btnTextAlignCenter.addEventListener('click', () => {
      currentTextAlign = 'center';
      updateTextAlignButtonsUI();
      updateTextLive({ textAlign: currentTextAlign });
    });
  }
  if (btnTextAlignRight) {
    btnTextAlignRight.addEventListener('click', () => {
      currentTextAlign = 'right';
      updateTextAlignButtonsUI();
      updateTextLive({ textAlign: currentTextAlign });
    });
  }

  // Delete Text Layer
  if (btnDeleteTextLayer) {
    btnDeleteTextLayer.addEventListener('click', () => {
      if (!activeTextEditorTarget) return;
      const { spreadIndex, slotIndex } = activeTextEditorTarget;
      albumState.deleteFrame(spreadIndex, slotIndex);
      canvasRenderer.selectedSlotIndex = null;
      if (canvasRenderer.selectedSlotIndices) canvasRenderer.selectedSlotIndices.clear();
      canvasRenderer.requestRender();
      closeTextEditorModal();
      showToastNotification('🗑️ Text layer deleted.');
    });
  }

  // Close & Apply Actions
  if (btnCloseTextEditor) btnCloseTextEditor.addEventListener('click', closeTextEditorModal);
  if (btnApplyTextEditor) btnApplyTextEditor.addEventListener('click', closeTextEditorModal);

  // Keyboard shortcut: Esc closes side panel
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && textCharacterPanel && textCharacterPanel.classList.contains('open')) {
      closeTextEditorModal();
    }
  });

  // Automatically sync/open side character panel when a text frame is selected on canvas
  albumState.on('slot-selected', (e) => {
    const sIdx = e?.spreadIndex !== undefined ? e.spreadIndex : albumState.activeSpreadIndex;
    const spread = albumState.project?.spreads?.[sIdx];
    const slot = spread?.slots?.find(s => s.slotIndex === e?.slotIndex);
    if (slot && slot.isText) {
      openTextEditorModal(sIdx, e.slotIndex);
    }
  });

  albumState.on('slot-deselected', () => {
    if (textCharacterPanel && textCharacterPanel.classList.contains('open')) {
      closeTextEditorModal();
    }
  });

  // Splash Screen Dismiss Controller (Proceeds and opens app when Open Studio Workspace is clicked)
  const appSplashScreen = document.getElementById('appSplashScreen');
  const btnCloseSplash = document.getElementById('btnCloseSplash');

  if (btnCloseSplash) {
    btnCloseSplash.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (typeof window.dismissSplashScreen === 'function') {
        window.dismissSplashScreen();
      } else if (appSplashScreen) {
        appSplashScreen.classList.add('fade-out');
        appSplashScreen.style.opacity = '0';
        appSplashScreen.style.pointerEvents = 'none';
        setTimeout(() => {
          appSplashScreen.style.display = 'none';
          resizeCanvasStage();
          if (canvasRenderer) canvasRenderer.render();
        }, 400);
      }
    });
  }

  // On startup: Ensure the app opens with an empty page with no photos, ready for designing
  // (User requirement: "when app opens it should be an empty page not photos")
  try {
    if (albumState && albumState.project) {
      if (!Array.isArray(albumState.project.spreads) || albumState.project.spreads.length === 0) {
        albumState.addSpread();
      }
      const initialSpread = albumState.project.spreads[0];
      if (initialSpread) {
        initialSpread.photoIds = [];
        initialSpread.slots = [];
      }
      albumState.activeSpreadIndex = 0;
    }
  } catch (e) {
    console.warn('Startup initialization notice:', e);
  }

  // ==================== Big View Template Library Modal Controller ====================
  function updateAllTemplateCountBadges() {
    const total = layoutEngine.getTotalTemplateCount ? layoutEngine.getTotalTemplateCount() : 384;
    document.querySelectorAll('.real-template-total').forEach(el => {
      el.textContent = total.toString();
    });
    if (els.lblBigViewRealTotal) {
      els.lblBigViewRealTotal.textContent = `${total} Templates`;
    }
    if (els.drawerLayoutsCount) {
      const spread = albumState.getActiveSpread ? albumState.getActiveSpread() : null;
      if (spread && spread.photoIds && spread.photoIds.length > 0) {
        const activeAspect = albumState.getActiveAspect();
        const photos = spread.photoIds.map(id => albumState.getPhotoById(id)).filter(Boolean);
        const templates = layoutEngine.getTemplatesForCount(spread.photoIds.length, currentLayoutOrientFilter, photos, activeAspect);
        els.drawerLayoutsCount.textContent = `Available Layouts (${templates.length} Options of ${total})`;
      } else {
        els.drawerLayoutsCount.textContent = `Available Layouts (${total} Options)`;
      }
    }
  }

  function openTemplateInDesigner(template) {
    if (!template) return;
    batchTemplatesQueue = [];
    currentConvertingTemplate = {
      id: template.id,
      name: template.name || 'Custom Template',
      fileName: template.name || 'Template',
      sourceImg: null,
      sourceImgData: template.sourceImage || null,
      autoRects: JSON.parse(JSON.stringify(template.rects || [])),
      activeRects: JSON.parse(JSON.stringify(template.rects || [])),
      confirmed: false
    };

    if (els.inputConvertedTemplateName) {
      els.inputConvertedTemplateName.value = currentConvertingTemplate.name;
    }
    if (els.convertTemplateSourceImg && els.convertTemplateStageWrapper) {
      if (template.sourceImage) {
        els.convertTemplateSourceImg.src = template.sourceImage;
        els.convertTemplateSourceImg.style.display = 'block';
        els.convertTemplateStageWrapper.style.width = '';
        els.convertTemplateStageWrapper.style.height = '';
        els.convertTemplateStageWrapper.style.aspectRatio = '';
        els.convertTemplateStageWrapper.style.background = '';
      } else {
        els.convertTemplateSourceImg.src = '';
        els.convertTemplateSourceImg.style.display = 'none';
        els.convertTemplateStageWrapper.style.width = '640px';
        els.convertTemplateStageWrapper.style.height = '320px';
        els.convertTemplateStageWrapper.style.maxWidth = '100%';
        els.convertTemplateStageWrapper.style.aspectRatio = '2 / 1';
        els.convertTemplateStageWrapper.style.background = '#0a0e17';
      }
    }
    if (els.lblBatchProgress) {
      els.lblBatchProgress.textContent = `Editing: ${template.name}`;
    }
    if (els.lblAutoCount) {
      els.lblAutoCount.textContent = (template.rects?.length || 0).toString();
    }

    if (els.convertBatchNav) els.convertBatchNav.style.display = 'none';
    if (els.convertSingleActions) els.convertSingleActions.style.display = 'flex';
    if (els.convertBatchActions) els.convertBatchActions.style.display = 'none';

    selectedConvertBoxIndices.clear();
    renderConvertTemplateOverlay(currentConvertingTemplate.activeRects);
    els.modalConvertTemplatePreview?.classList.add('open');
  }

  function applyTemplateFromBigView(tpl) {
    if (!tpl) return;
    const spread = albumState.getActiveSpread();
    if (!spread) return;

    albumState.recordSnapshot();
    spread.layout = tpl;
    spread.layoutId = tpl.id;

    const slotCount = tpl.rects ? tpl.rects.length : (tpl.photoCount || 1);
    const activeAspect = albumState.getActiveAspect();
    const canvasW = canvasRenderer?.displayWidth || 1200;
    const canvasH = canvasRenderer?.displayHeight || 600;

    const computedRects = layoutEngine.computeLayout(
      tpl,
      canvasW,
      canvasH,
      albumState.getSpreadMarginPercent(spread.id),
      albumState.getSpreadGap(spread.id),
      albumState.getSpreadMiddleSpace(spread.id),
      {
        fullBleed: spread.fullBleed,
        pageMode: albumState.project.pageMode,
        singlePageSide: spread.singlePageSide,
        aspectRatio: activeAspect
      }
    );

    spread.slots = computedRects.map((r, i) => ({
      id: `slot-${spread.id}-${i}`,
      photoId: (spread.photoIds && spread.photoIds[i]) ? spread.photoIds[i] : null,
      rect: { x: r.x, y: r.y, width: r.width, height: r.height },
      shape: r.shape || 'rectangle',
      borderRadius: r.borderRadius || 0,
      rotation: r.rotation || 0
    }));

    albumState.notify('layout-changed', spread);
    if (canvasRenderer) canvasRenderer.render();
    renderFilmstrip();
    renderFloatingLayoutsBar();
    showToastNotification(`✓ Applied layout: "${tpl.name}"`);
  }

  let currentBigViewFilter = 'all';
  let currentBigViewSearch = '';
  let currentBigViewOrientation = 'all';
  let selectedBigViewTemplateIds = new Set();
  let lastClickedBigViewIndex = -1;
  let currentVisibleBigViewTemplates = [];

  function updateBigViewSelectionUI() {
    const grid = els.bigViewTemplatesGrid;
    if (!grid) return;
    const cards = grid.querySelectorAll('.big-view-card');
    cards.forEach(card => {
      const id = card.dataset.templateId;
      const isSelected = selectedBigViewTemplateIds.has(id);
      card.classList.toggle('selected', isSelected);
      const cb = card.querySelector('.big-view-card-checkbox');
      if (cb) {
        cb.textContent = isSelected ? '✓' : '';
      }
    });

    const count = selectedBigViewTemplateIds.size;
    if (els.btnBigViewDeleteSelected) {
      els.btnBigViewDeleteSelected.disabled = count === 0;
      els.btnBigViewDeleteSelected.style.opacity = count > 0 ? '1' : '0.5';
      els.btnBigViewDeleteSelected.style.cursor = count > 0 ? 'pointer' : 'default';
    }
    if (els.lblBigViewSelectedCount) {
      els.lblBigViewSelectedCount.textContent = count;
      els.lblBigViewSelectedCount.style.display = count > 0 ? 'inline-block' : 'none';
    }

    const grandTotal = layoutEngine.getTotalTemplateCount ? layoutEngine.getTotalTemplateCount() : 384;
    if (els.lblBigViewFooterStatus) {
      let txt = `Showing ${currentVisibleBigViewTemplates.length} of ${grandTotal} templates`;
      if (currentBigViewSearch) txt += ` matching "${currentBigViewSearch}"`;
      if (count > 0) txt += ` • ${count} selected`;
      els.lblBigViewFooterStatus.textContent = txt;
    }
  }

  function deleteSelectedBigViewTemplates() {
    if (selectedBigViewTemplateIds.size === 0) return;
    const count = selectedBigViewTemplateIds.size;
    const confirmMsg = count === 1
      ? `Are you sure you want to permanently delete this template?`
      : `Are you sure you want to permanently delete all ${count} selected templates?`;

    if (!confirm(confirmMsg)) return;

    const idsToDelete = Array.from(selectedBigViewTemplateIds);
    let deletedCount = 0;
    idsToDelete.forEach(id => {
      if (layoutEngine.deleteTemplate(id)) {
        deletedCount++;
      }
    });

    selectedBigViewTemplateIds.clear();
    lastClickedBigViewIndex = -1;

    renderBigViewGrid(currentBigViewFilter, currentBigViewSearch, currentBigViewOrientation);
    renderCustomTemplatesManagerList();
    updateAllTemplateCountBadges();
    renderFloatingLayoutsBar();
    showToastNotification(`✓ Deleted ${deletedCount} template${deletedCount === 1 ? '' : 's'}.`);
  }

  function renderBigViewGrid(filterCount = currentBigViewFilter, search = currentBigViewSearch, orient = currentBigViewOrientation) {
    const grid = els.bigViewTemplatesGrid;
    const footerStatus = els.lblBigViewFooterStatus;
    if (!grid) return;

    currentBigViewFilter = filterCount;
    currentBigViewSearch = search;
    currentBigViewOrientation = orient;

    const templates = layoutEngine.getAllTemplates({
      count: filterCount,
      search: search,
      orientation: orient
    });
    currentVisibleBigViewTemplates = templates;

    grid.innerHTML = '';
    if (templates.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-dim);">
          <div style="font-size: 32px; margin-bottom: 10px;">🔍</div>
          <div style="font-size: 15px; font-weight: 600; color: #fff;">No templates found</div>
          <div style="font-size: 12px; margin-top: 4px;">Try selecting another photo count or clearing your search.</div>
        </div>
      `;
      updateBigViewSelectionUI();
      return;
    }

    const activeSpread = albumState.getActiveSpread ? albumState.getActiveSpread() : null;
    const activeLayoutId = activeSpread ? activeSpread.layoutId : null;

    templates.forEach((tpl, idx) => {
      const card = document.createElement('div');
      card.className = `big-view-card ${activeLayoutId === tpl.id ? 'active' : ''}`;
      card.dataset.templateId = tpl.id;
      card.dataset.index = idx;

      // Selection Checkbox (PC folder style)
      const checkbox = document.createElement('div');
      checkbox.className = 'big-view-card-checkbox';
      checkbox.title = 'Select template';
      checkbox.innerHTML = selectedBigViewTemplateIds.has(tpl.id) ? '✓' : '';
      checkbox.onclick = (e) => {
        e.stopPropagation();
        if (selectedBigViewTemplateIds.has(tpl.id)) {
          selectedBigViewTemplateIds.delete(tpl.id);
        } else {
          selectedBigViewTemplateIds.add(tpl.id);
        }
        lastClickedBigViewIndex = idx;
        updateBigViewSelectionUI();
      };
      card.appendChild(checkbox);

      // Card Click Handler (supports Normal, Shift+Click, Ctrl+Click)
      card.onclick = (e) => {
        if (e.target.closest('.big-view-card-actions') || e.target.closest('.big-view-card-checkbox')) return;
        const isCtrl = e.ctrlKey || e.metaKey;
        const isShift = e.shiftKey;

        if (isCtrl) {
          if (selectedBigViewTemplateIds.has(tpl.id)) {
            selectedBigViewTemplateIds.delete(tpl.id);
          } else {
            selectedBigViewTemplateIds.add(tpl.id);
          }
          lastClickedBigViewIndex = idx;
        } else if (isShift && lastClickedBigViewIndex >= 0) {
          const start = Math.min(lastClickedBigViewIndex, idx);
          const end = Math.max(lastClickedBigViewIndex, idx);
          selectedBigViewTemplateIds.clear();
          for (let i = start; i <= end; i++) {
            if (currentVisibleBigViewTemplates[i]) {
              selectedBigViewTemplateIds.add(currentVisibleBigViewTemplates[i].id);
            }
          }
        } else {
          selectedBigViewTemplateIds.clear();
          selectedBigViewTemplateIds.add(tpl.id);
          lastClickedBigViewIndex = idx;
        }
        updateBigViewSelectionUI();
      };

      // Double-click to apply directly
      card.ondblclick = (e) => {
        if (e.target.closest('.big-view-card-actions')) return;
        applyTemplateFromBigView(tpl);
      };

      // Thumbnail
      const thumbWrap = document.createElement('div');
      thumbWrap.className = 'big-view-card-thumb-wrap';
      thumbWrap.title = 'Double-click to apply, or click to select';

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 200 100');
      svg.setAttribute('class', 'big-view-card-svg');

      if (albumState.project.pageMode === 'spread') {
        const crease = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        crease.setAttribute('x1', '100');
        crease.setAttribute('y1', '0');
        crease.setAttribute('x2', '100');
        crease.setAttribute('y2', '100');
        crease.setAttribute('stroke', 'rgba(255, 255, 255, 0.25)');
        crease.setAttribute('stroke-dasharray', '3,3');
        svg.appendChild(crease);
      }

      (tpl.rects || []).forEach(r => {
        const isCurrent = activeLayoutId === tpl.id;
        const rx = (r.x || 0) * 190 + 5;
        const ry = (r.y || 0) * 90 + 5;
        const rw = (r.w || r.width || 0.1) * 190;
        const rh = (r.h || r.height || 0.1) * 90;
        const shapeEl = createSvgShapeElement(r.shape, rx, ry, rw, rh, isCurrent);
        svg.appendChild(shapeEl);
      });
      thumbWrap.appendChild(svg);

      // Info
      const info = document.createElement('div');
      info.className = 'big-view-card-info';

      const title = document.createElement('div');
      title.className = 'big-view-card-title';
      title.textContent = tpl.name || 'Untitled Layout';
      title.title = tpl.name || 'Untitled Layout';

      const meta = document.createElement('div');
      meta.className = 'big-view-card-meta';
      const pCount = tpl.photoCount || (tpl.rects ? tpl.rects.length : 0);
      const shapesInTpl = (tpl.rects || []).filter(r => r.shape && r.shape !== 'rect' && r.shape !== 'rectangle').map(r => r.shape);
      const shapeLabel = shapesInTpl.length > 0 ? ` • ${[...new Set(shapesInTpl)].join(', ')}` : '';
      meta.innerHTML = `<span>${pCount} Photo${pCount === 1 ? '' : 's'}${shapeLabel}</span><span style="color: #38bdf8; font-family: monospace; font-size: 10px;">${tpl.id || ''}</span>`;

      info.appendChild(title);
      info.appendChild(meta);

      // Actions
      const actions = document.createElement('div');
      actions.className = 'big-view-card-actions';

      const btnApply = document.createElement('button');
      btnApply.type = 'button';
      btnApply.className = 'btn-apply';
      btnApply.textContent = 'Apply';
      btnApply.title = 'Apply to active spread';
      btnApply.onclick = (e) => {
        e.stopPropagation();
        applyTemplateFromBigView(tpl);
      };

      const btnEdit = document.createElement('button');
      btnEdit.type = 'button';
      btnEdit.className = 'btn-edit';
      btnEdit.innerHTML = '✏️ Edit';
      btnEdit.title = 'Edit frames & shapes in Template Designer';
      btnEdit.onclick = (e) => {
        e.stopPropagation();
        openTemplateInDesigner(tpl);
      };

      const btnDel = document.createElement('button');
      btnDel.type = 'button';
      btnDel.className = 'btn-del';
      btnDel.innerHTML = '&times;';
      btnDel.title = 'Delete this template permanently';
      btnDel.onclick = (e) => {
        e.stopPropagation();
        if (confirm(`Are you sure you want to delete template "${tpl.name}"?`)) {
          layoutEngine.deleteTemplate(tpl.id);
          selectedBigViewTemplateIds.delete(tpl.id);
          renderBigViewGrid(currentBigViewFilter, currentBigViewSearch, currentBigViewOrientation);
          renderCustomTemplatesManagerList();
          updateAllTemplateCountBadges();
          renderFloatingLayoutsBar();
          showToastNotification(`Template "${tpl.name}" deleted.`);
        }
      };

      actions.appendChild(btnApply);
      actions.appendChild(btnEdit);
      actions.appendChild(btnDel);

      card.appendChild(thumbWrap);
      card.appendChild(info);
      card.appendChild(actions);
      grid.appendChild(card);
    });

    updateBigViewSelectionUI();
  }

  function openBigViewModal(filterCount = 'all') {
    if (!els.modalBrowseAllTemplates) return;
    currentBigViewFilter = filterCount;
    currentBigViewSearch = '';
    currentBigViewOrientation = 'all';
    selectedBigViewTemplateIds.clear();
    lastClickedBigViewIndex = -1;

    if (els.inputBigViewSearch) els.inputBigViewSearch.value = '';
    if (els.selectBigViewOrientation) els.selectBigViewOrientation.value = 'all';

    if (els.bigViewFilterPills) {
      els.bigViewFilterPills.querySelectorAll('.big-view-pill').forEach(p => {
        p.classList.toggle('active', p.dataset.filter === filterCount);
      });
    }

    renderBigViewGrid(filterCount, '', 'all');
    els.modalBrowseAllTemplates.classList.add('open');
  }

  function closeBigViewModal() {
    if (els.modalBrowseAllTemplates) {
      els.modalBrowseAllTemplates.classList.remove('open');
    }
  }

  // Hook up Big View event listeners
  if (els.btnCloseBrowseAllTemplates) els.btnCloseBrowseAllTemplates.addEventListener('click', closeBigViewModal);
  if (els.btnDoneBrowseAllTemplates) els.btnDoneBrowseAllTemplates.addEventListener('click', closeBigViewModal);

  if (els.btnBigViewSelectAll) {
    els.btnBigViewSelectAll.addEventListener('click', () => {
      currentVisibleBigViewTemplates.forEach(t => selectedBigViewTemplateIds.add(t.id));
      updateBigViewSelectionUI();
    });
  }

  if (els.btnBigViewDeselectAll) {
    els.btnBigViewDeselectAll.addEventListener('click', () => {
      selectedBigViewTemplateIds.clear();
      lastClickedBigViewIndex = -1;
      updateBigViewSelectionUI();
    });
  }

  if (els.btnBigViewDeleteSelected) {
    els.btnBigViewDeleteSelected.addEventListener('click', deleteSelectedBigViewTemplates);
  }

  // Rubber-band marquee selection for Big View
  let isBigViewMarqueeDragging = false;
  let marqueeStartX = 0;
  let marqueeStartY = 0;
  const bigViewBody = document.querySelector('.big-view-body');

  if (bigViewBody && els.bigViewMarquee) {
    bigViewBody.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      if (e.target.closest('.big-view-card') || e.target.closest('button') || e.target.closest('input') || e.target.closest('select')) {
        return;
      }

      isBigViewMarqueeDragging = true;
      const bodyRect = bigViewBody.getBoundingClientRect();
      marqueeStartX = e.clientX - bodyRect.left + bigViewBody.scrollLeft;
      marqueeStartY = e.clientY - bodyRect.top + bigViewBody.scrollTop;

      els.bigViewMarquee.style.left = `${marqueeStartX}px`;
      els.bigViewMarquee.style.top = `${marqueeStartY}px`;
      els.bigViewMarquee.style.width = '0px';
      els.bigViewMarquee.style.height = '0px';
      els.bigViewMarquee.style.display = 'block';

      if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
        selectedBigViewTemplateIds.clear();
        updateBigViewSelectionUI();
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!isBigViewMarqueeDragging || !els.modalBrowseAllTemplates?.classList.contains('open')) return;
      const bodyRect = bigViewBody.getBoundingClientRect();
      const currentX = e.clientX - bodyRect.left + bigViewBody.scrollLeft;
      const currentY = e.clientY - bodyRect.top + bigViewBody.scrollTop;

      const left = Math.min(marqueeStartX, currentX);
      const top = Math.min(marqueeStartY, currentY);
      const width = Math.abs(currentX - marqueeStartX);
      const height = Math.abs(currentY - marqueeStartY);

      els.bigViewMarquee.style.left = `${left}px`;
      els.bigViewMarquee.style.top = `${top}px`;
      els.bigViewMarquee.style.width = `${width}px`;
      els.bigViewMarquee.style.height = `${height}px`;

      const marqBox = {
        left: Math.min(e.clientX, marqueeStartX + bodyRect.left - bigViewBody.scrollLeft),
        top: Math.min(e.clientY, marqueeStartY + bodyRect.top - bigViewBody.scrollTop),
        right: Math.max(e.clientX, marqueeStartX + bodyRect.left - bigViewBody.scrollLeft),
        bottom: Math.max(e.clientY, marqueeStartY + bodyRect.top - bigViewBody.scrollTop)
      };

      const cards = bigViewBody.querySelectorAll('.big-view-card');
      cards.forEach(card => {
        const cr = card.getBoundingClientRect();
        const intersects = !(cr.right < marqBox.left || cr.left > marqBox.right || cr.bottom < marqBox.top || cr.top > marqBox.bottom);
        const id = card.dataset.templateId;
        if (intersects && id) {
          selectedBigViewTemplateIds.add(id);
        }
      });
      updateBigViewSelectionUI();
    });

    window.addEventListener('mouseup', () => {
      if (isBigViewMarqueeDragging) {
        isBigViewMarqueeDragging = false;
        if (els.bigViewMarquee) els.bigViewMarquee.style.display = 'none';
      }
    });
  }

  // Windows Explorer-style Keyboard Shortcuts for Big View Library
  window.addEventListener('keydown', (e) => {
    if (!els.modalBrowseAllTemplates || !els.modalBrowseAllTemplates.classList.contains('open')) return;
    const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);

    if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
      if (isTyping) return;
      e.preventDefault();
      currentVisibleBigViewTemplates.forEach(t => selectedBigViewTemplateIds.add(t.id));
      updateBigViewSelectionUI();
      return;
    }

    if (e.key === 'Escape') {
      if (selectedBigViewTemplateIds.size > 0) {
        e.preventDefault();
        selectedBigViewTemplateIds.clear();
        lastClickedBigViewIndex = -1;
        updateBigViewSelectionUI();
      } else {
        closeBigViewModal();
      }
      return;
    }

    if ((e.key === 'Delete' || e.key === 'Backspace') && !isTyping) {
      if (selectedBigViewTemplateIds.size > 0) {
        e.preventDefault();
        deleteSelectedBigViewTemplates();
      }
      return;
    }

    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) && !isTyping) {
      if (currentVisibleBigViewTemplates.length === 0) return;
      e.preventDefault();

      const grid = els.bigViewTemplatesGrid;
      const cards = grid ? Array.from(grid.querySelectorAll('.big-view-card')) : [];
      let cols = 1;
      if (cards.length >= 2) {
        const firstTop = cards[0].offsetTop;
        cols = cards.findIndex((c, i) => i > 0 && c.offsetTop > firstTop);
        if (cols <= 0) cols = cards.length;
      }

      let targetIdx = lastClickedBigViewIndex;
      if (targetIdx < 0) {
        targetIdx = 0;
      } else {
        if (e.key === 'ArrowRight') targetIdx = Math.min(currentVisibleBigViewTemplates.length - 1, targetIdx + 1);
        if (e.key === 'ArrowLeft') targetIdx = Math.max(0, targetIdx - 1);
        if (e.key === 'ArrowDown') targetIdx = Math.min(currentVisibleBigViewTemplates.length - 1, targetIdx + cols);
        if (e.key === 'ArrowUp') targetIdx = Math.max(0, targetIdx - cols);
      }

      if (e.shiftKey) {
        const start = Math.min(lastClickedBigViewIndex >= 0 ? lastClickedBigViewIndex : 0, targetIdx);
        const end = Math.max(lastClickedBigViewIndex >= 0 ? lastClickedBigViewIndex : 0, targetIdx);
        selectedBigViewTemplateIds.clear();
        for (let i = start; i <= end; i++) {
          if (currentVisibleBigViewTemplates[i]) {
            selectedBigViewTemplateIds.add(currentVisibleBigViewTemplates[i].id);
          }
        }
      } else {
        selectedBigViewTemplateIds.clear();
        if (currentVisibleBigViewTemplates[targetIdx]) {
          selectedBigViewTemplateIds.add(currentVisibleBigViewTemplates[targetIdx].id);
        }
        lastClickedBigViewIndex = targetIdx;
      }

      updateBigViewSelectionUI();

      if (cards[targetIdx]) {
        cards[targetIdx].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  });

  if (els.bigViewFilterPills) {
    els.bigViewFilterPills.addEventListener('click', (e) => {
      const pill = e.target.closest('.big-view-pill');
      if (!pill) return;
      els.bigViewFilterPills.querySelectorAll('.big-view-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      renderBigViewGrid(pill.dataset.filter, currentBigViewSearch, currentBigViewOrientation);
    });
  }

  if (els.selectBigViewOrientation) {
    els.selectBigViewOrientation.addEventListener('change', () => {
      renderBigViewGrid(currentBigViewFilter, currentBigViewSearch, els.selectBigViewOrientation.value);
    });
  }

  if (els.inputBigViewSearch) {
    els.inputBigViewSearch.addEventListener('input', () => {
      renderBigViewGrid(currentBigViewFilter, els.inputBigViewSearch.value, currentBigViewOrientation);
    });
  }

  if (els.btnBigViewOpenManager) {
    els.btnBigViewOpenManager.addEventListener('click', () => {
      closeBigViewModal();
      renderCustomTemplatesManagerList();
      modalManageCustomTemplates?.classList.add('open');
    });
  }

  if (els.btnOpenBigViewFromManager) {
    els.btnOpenBigViewFromManager.addEventListener('click', () => {
      modalManageCustomTemplates?.classList.remove('open');
      openBigViewModal('all');
    });
  }

  if (els.btnDrawerOpenBigView) {
    els.btnDrawerOpenBigView.addEventListener('click', () => {
      els.layoutsDrawer?.classList.remove('open');
      openBigViewModal('all');
    });
  }

  window.openBigViewModal = openBigViewModal;
  window.closeBigViewModal = closeBigViewModal;
  window.renderBigViewGrid = renderBigViewGrid;
  window.updateAllTemplateCountBadges = updateAllTemplateCountBadges;
  window.openTemplateInDesigner = openTemplateInDesigner;
  window.calculateSmartGuidesAndSnap = calculateSmartGuidesAndSnap;
  window.renderSmartGuides = renderSmartGuides;
  window.clearSmartGuides = clearSmartGuides;

  // =========================================================================
  // --- 41 SHAPES LIBRARY & ADVANCED SHAPE COMBINER (SVG, Canvas, Python, Cairo, JS) ---
  // =========================================================================
  function initDrawShapesLibraryAndCombiner() {
    const SHAPES_LIBRARY = [
      // 1. Geometric (11)
      { id: 'circle', name: 'Circle', cat: 'geometric', icon: '◯' },
      { id: 'ellipse', name: 'Ellipse', cat: 'geometric', icon: '⬭' },
      { id: 'square', name: 'Square', cat: 'geometric', icon: '□' },
      { id: 'rectangle', name: 'Rectangle', cat: 'geometric', icon: '▭' },
      { id: 'rounded-rectangle', name: 'Rounded rectangle', cat: 'geometric', icon: '▢' },
      { id: 'triangle', name: 'Triangle', cat: 'geometric', icon: '△' },
      { id: 'line', name: 'Line', cat: 'geometric', icon: '―' },
      { id: 'arc', name: 'Arc', cat: 'geometric', icon: '⌒' },
      { id: 'ring', name: 'Ring / donut', cat: 'geometric', icon: '◎' },
      { id: 'semi-circle', name: 'Semi-circle', cat: 'geometric', icon: '◖' },
      { id: 'crescent', name: 'Crescent', cat: 'geometric', icon: '☽' },

      // 2. Polygons (8)
      { id: 'polygon', name: 'Polygon', cat: 'polygons', icon: '⬡' },
      { id: 'star', name: 'Star', cat: 'polygons', icon: '★' },
      { id: 'hexagon', name: 'Hexagon', cat: 'polygons', icon: '⬢' },
      { id: 'octagon', name: 'Octagon', cat: 'polygons', icon: '🛑' },
      { id: 'pentagon', name: 'Pentagon', cat: 'polygons', icon: '⬠' },
      { id: 'diamond', name: 'Diamond', cat: 'polygons', icon: '◇' },
      { id: 'trapezoid', name: 'Trapezoid', cat: 'polygons', icon: '⏢' },
      { id: 'parallelogram', name: 'Parallelogram', cat: 'polygons', icon: '▱' },

      // 3. Creative (10)
      { id: 'heart', name: 'Heart', cat: 'creative', icon: '♥' },
      { id: 'arrow', name: 'Arrow', cat: 'creative', icon: '➔' },
      { id: 'speech-bubble', name: 'Speech bubble', cat: 'creative', icon: '💬' },
      { id: 'cloud', name: 'Cloud', cat: 'creative', icon: '☁' },
      { id: 'cross', name: 'Cross', cat: 'creative', icon: '✚' },
      { id: 'plus-shape', name: 'Plus shape', cat: 'creative', icon: '➕' },
      { id: 'gear', name: 'Gear', cat: 'creative', icon: '⚙' },
      { id: 'burst', name: 'Burst / sun', cat: 'creative', icon: '✹' },
      { id: 'teardrop', name: 'Teardrop', cat: 'creative', icon: '💧' },
      { id: 'leaf', name: 'Leaf', cat: 'creative', icon: '🍃' },

      // 4. Curves & 3D (12)
      { id: 'spiral', name: 'Spiral', cat: 'curves3d', icon: '🌀' },
      { id: 'wave', name: 'Wave', cat: 'curves3d', icon: '〰' },
      { id: 'bezier-curve', name: 'Bezier curve', cat: 'curves3d', icon: '∿' },
      { id: 'spline', name: 'Spline', cat: 'curves3d', icon: '⤳' },
      { id: 'custom-path', name: 'Custom path', cat: 'curves3d', icon: '✏' },
      { id: 'cylinder', name: 'Cylinder', cat: 'curves3d', icon: '🛢' },
      { id: 'cone', name: 'Cone', cat: 'curves3d', icon: '▲' },
      { id: 'cube', name: 'Cube / 3D box', cat: 'curves3d', icon: '🧊' },
      { id: 'pyramid', name: 'Pyramid', cat: 'curves3d', icon: '▲' },
      { id: 'sphere', name: 'Sphere', cat: 'curves3d', icon: '🔮' },
      { id: 'grid', name: 'Grid', cat: 'curves3d', icon: '田' },
      { id: 'mesh', name: 'Mesh', cat: 'curves3d', icon: '🕸' }
    ];

    let currentSelectedDrawShape = 'rectangle';
    let currentCustomDrawPath = null;
    let activeCombinerTab = 'boolean';
    let isPreviewPhotoTexture = false;

    // Helper: Select active drawing shape and sync UI
    function selectDrawShape(shapeId, customPath = null) {
      currentSelectedDrawShape = shapeId || 'rectangle';
      currentCustomDrawPath = customPath || null;

      if (canvasRenderer) {
        canvasRenderer.setDrawShape(currentSelectedDrawShape, currentCustomDrawPath);
      }

      const item = SHAPES_LIBRARY.find(s => s.id === currentSelectedDrawShape);
      const displayName = item ? item.name : (shapeId === 'custom' ? 'Combined Custom Shape' : shapeId);
      const iconStr = item ? item.icon : (shapeId === 'custom' ? '⚡' : '▭');

      if (els.dockActiveShapeIndicator) els.dockActiveShapeIndicator.textContent = iconStr;
      if (els.bannerActiveShapeName) els.bannerActiveShapeName.textContent = displayName;
      if (els.drawShapesFooterCurrent) els.drawShapesFooterCurrent.textContent = displayName;

      // Update grid chips highlight
      if (els.drawShapesGrid) {
        els.drawShapesGrid.querySelectorAll('.draw-shape-chip').forEach(c => {
          c.classList.toggle('active', c.dataset.shape === currentSelectedDrawShape);
        });
      }

      // Update banner quick buttons highlight
      if (els.canvasDrawBanner) {
        els.canvasDrawBanner.querySelectorAll('#mainCanvasDrawShapeButtons button[data-shape]').forEach(btn => {
          const match = (btn.dataset.shape === currentSelectedDrawShape);
          btn.classList.toggle('active', match);
          btn.style.background = match ? '#0284c7' : 'rgba(255,255,255,0.08)';
          btn.style.borderColor = match ? '#38bdf8' : 'rgba(255,255,255,0.15)';
          btn.style.color = match ? '#ffffff' : '#cbd5e1';
        });
      }
    }

    // 1. Render all 41 Shapes into the Grid
    if (els.drawShapesGrid) {
      els.drawShapesGrid.innerHTML = '';
      SHAPES_LIBRARY.forEach(shape => {
        const chip = document.createElement('div');
        chip.className = `draw-shape-chip ${shape.id === currentSelectedDrawShape ? 'active' : ''}`;
        chip.dataset.shape = shape.id;
        chip.dataset.cat = shape.cat;

        const iconWrap = document.createElement('div');
        iconWrap.className = 'draw-shape-chip-icon';
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 32 32');
        svg.setAttribute('width', '24');
        svg.setAttribute('height', '24');
        const shapeEl = createSvgShapeElement(shape.id, 2, 2, 28, 28, false);
        svg.appendChild(shapeEl);
        iconWrap.appendChild(svg);

        const label = document.createElement('div');
        label.className = 'draw-shape-chip-label';
        label.textContent = shape.name;
        label.title = shape.name;

        chip.appendChild(iconWrap);
        chip.appendChild(label);

        chip.addEventListener('click', () => {
          selectDrawShape(shape.id);
          if (typeof closeAllAsidePanels === 'function') closeAllAsidePanels();
          els.dockDrawFrameContainer?.classList.remove('open');
          canvasRenderer?.toggleDrawNewFrameMode(true, shape.id);
          window.showToastNotification?.(`✏️ Drawing Frame: ${shape.name} • Drag on spread`);
        });

        els.drawShapesGrid.appendChild(chip);
      });
    }

    // 2. Populate Combiner Shape A & Shape B Dropdowns
    function populateCombinerSelects() {
      if (!els.selectCombinerShapeA || !els.selectCombinerShapeB) return;
      els.selectCombinerShapeA.innerHTML = '';
      els.selectCombinerShapeB.innerHTML = '';
      SHAPES_LIBRARY.forEach(shape => {
        const optA = document.createElement('option');
        optA.value = shape.id;
        optA.textContent = `${shape.icon} ${shape.name}`;
        if (shape.id === 'rectangle') optA.selected = true;
        els.selectCombinerShapeA.appendChild(optA);

        const optB = document.createElement('option');
        optB.value = shape.id;
        optB.textContent = `${shape.icon} ${shape.name}`;
        if (shape.id === 'circle') optB.selected = true;
        els.selectCombinerShapeB.appendChild(optB);
      });
    }
    populateCombinerSelects();

    // 3. Category Filter Tabs
    if (els.drawShapesCatTabs) {
      els.drawShapesCatTabs.addEventListener('click', (e) => {
        const pill = e.target.closest('.draw-cat-pill');
        if (!pill) return;
        els.drawShapesCatTabs.querySelectorAll('.draw-cat-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        applySearchAndCatFilter();
      });
    }

    // 4. Search Filter
    function applySearchAndCatFilter() {
      if (!els.drawShapesGrid) return;
      const query = (els.inputDrawShapeSearch?.value || '').trim().toLowerCase();
      const activeCatPill = els.drawShapesCatTabs?.querySelector('.draw-cat-pill.active');
      const cat = activeCatPill ? activeCatPill.dataset.cat : 'all';

      if (els.btnClearShapeSearch) {
        els.btnClearShapeSearch.style.display = query.length > 0 ? 'inline-block' : 'none';
      }

      els.drawShapesGrid.querySelectorAll('.draw-shape-chip').forEach(chip => {
        const shapeId = chip.dataset.shape;
        const shapeCat = chip.dataset.cat;
        const item = SHAPES_LIBRARY.find(s => s.id === shapeId);
        const nameMatch = !query || shapeId.includes(query) || (item && item.name.toLowerCase().includes(query));
        const catMatch = (cat === 'all' || shapeCat === cat);
        chip.style.display = (nameMatch && catMatch) ? 'flex' : 'none';
      });
    }

    if (els.inputDrawShapeSearch) {
      els.inputDrawShapeSearch.addEventListener('input', applySearchAndCatFilter);
    }
    if (els.btnClearShapeSearch) {
      els.btnClearShapeSearch.addEventListener('click', () => {
        if (els.inputDrawShapeSearch) els.inputDrawShapeSearch.value = '';
        applySearchAndCatFilter();
      });
    }

    // 5. Canvas Banner Buttons Wiring
    if (els.canvasDrawBanner) {
      els.canvasDrawBanner.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        if (btn.dataset.shape) {
          selectDrawShape(btn.dataset.shape);
          if (canvasRenderer && !canvasRenderer.drawNewFrameMode) {
            canvasRenderer.toggleDrawNewFrameMode(true, btn.dataset.shape);
          }
        }
      });
    }

    if (els.btnBannerOpenAllShapes) {
      els.btnBannerOpenAllShapes.addEventListener('click', (e) => {
        e.stopPropagation();
        els.dockDrawFrameContainer?.classList.toggle('open');
      });
    }

    // Open Shape Combiner Modal buttons
    function openShapeCombinerModal() {
      if (typeof closeAllAsidePanels === 'function') closeAllAsidePanels();
      els.dockDrawFrameContainer?.classList.remove('open');
      if (els.modalShapeCombiner) {
        els.modalShapeCombiner.style.display = 'flex';
        updateCombinerLivePreview();
      }
    }

    function closeShapeCombinerModal() {
      if (els.modalShapeCombiner) {
        els.modalShapeCombiner.style.display = 'none';
      }
    }

    if (els.btnOpenShapeCombiner) els.btnOpenShapeCombiner.addEventListener('click', openShapeCombinerModal);
    if (els.btnOpenCombinerTop) els.btnOpenCombinerTop.addEventListener('click', openShapeCombinerModal);
    if (els.btnBannerCombineShapes) els.btnBannerCombineShapes.addEventListener('click', openShapeCombinerModal);
    if (els.btnCloseShapeCombiner) els.btnCloseShapeCombiner.addEventListener('click', closeShapeCombinerModal);
    if (els.btnCancelShapeCombiner) els.btnCancelShapeCombiner.addEventListener('click', closeShapeCombinerModal);

    // 6. Shape Combiner Tabs & Input Controls
    if (els.combinerModeTabs) {
      els.combinerModeTabs.addEventListener('click', (e) => {
        const tabBtn = e.target.closest('.combiner-tab-btn');
        if (!tabBtn) return;
        els.combinerModeTabs.querySelectorAll('.combiner-tab-btn').forEach(b => b.classList.remove('active'));
        tabBtn.classList.add('active');
        activeCombinerTab = tabBtn.dataset.tab;

        // Show corresponding tab content
        const tabIds = {
          boolean: 'tabContentBoolean',
          svg: 'tabContentSvg',
          canvas: 'tabContentCanvas',
          pillow: 'tabContentPillow',
          cairo: 'tabContentCairo'
        };
        Object.entries(tabIds).forEach(([key, id]) => {
          const contentEl = document.getElementById(id);
          if (contentEl) contentEl.style.display = (key === activeCombinerTab) ? 'block' : 'none';
        });

        updateCombinerLivePreview();
      });
    }

    // Sliders for Boolean combine
    if (els.rangeCombinerScaleB) {
      els.rangeCombinerScaleB.addEventListener('input', () => {
        if (els.lblCombinerScaleB) els.lblCombinerScaleB.textContent = `${els.rangeCombinerScaleB.value}%`;
        updateCombinerLivePreview();
      });
    }
    if (els.rangeCombinerOffsetX) {
      els.rangeCombinerOffsetX.addEventListener('input', () => {
        if (els.lblCombinerOffsetX) els.lblCombinerOffsetX.textContent = `${els.rangeCombinerOffsetX.value}%`;
        updateCombinerLivePreview();
      });
    }
    if (els.rangeCombinerOffsetY) {
      els.rangeCombinerOffsetY.addEventListener('input', () => {
        if (els.lblCombinerOffsetY) els.lblCombinerOffsetY.textContent = `${els.rangeCombinerOffsetY.value}%`;
        updateCombinerLivePreview();
      });
    }
    if (els.selectCombinerShapeA) els.selectCombinerShapeA.addEventListener('change', updateCombinerLivePreview);
    if (els.selectCombinerShapeB) els.selectCombinerShapeB.addEventListener('change', updateCombinerLivePreview);

    // Preset Data for all Engines
    const SVG_PRESETS = {
      starburst: "M 50,2 L 61,35 L 98,35 L 68,57 L 79,91 L 50,70 L 21,91 L 32,57 L 2,35 L 39,35 Z",
      shield: "M 10,10 L 90,10 L 90,52 C 90,78 50,96 50,96 C 50,96 10,78 10,52 Z",
      badge: "M 50,0 C 70,0 80,10 90,20 C 100,30 100,50 100,50 C 100,70 90,80 80,90 C 70,100 50,100 50,100 C 30,100 20,90 10,80 C 0,70 0,50 0,50 C 0,30 10,20 20,10 C 30,0 50,0 50,0 Z",
      clover: "M 50,50 C 50,20 30,5 15,20 C 0,35 20,50 50,50 C 20,50 5,70 20,85 C 35,100 50,80 50,50 C 50,80 70,100 85,85 C 100,70 80,50 50,50 C 80,50 100,35 85,20 C 70,5 50,20 50,50 Z",
      crown: "M 10,85 L 90,85 L 95,30 L 72,55 L 50,15 L 28,55 L 5,30 Z"
    };

    const CANVAS_PRESETS = {
      'double-ring': `// Interlocking Double Oval Rings\nconst cx = w / 2, cy = h / 2;\nctx.ellipse(cx - w * 0.14, cy, w * 0.32, h * 0.44, 0, 0, Math.PI * 2);\nctx.ellipse(cx + w * 0.14, cy, w * 0.32, h * 0.44, 0, 0, Math.PI * 2);`,
      'star-flower': `// 6-Petal Geometric Floral Rosette\nconst cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.42;\nfor (let i = 0; i < 6; i++) {\n  const a = (i * Math.PI) / 3;\n  ctx.ellipse(cx + r * 0.35 * Math.cos(a), cy + r * 0.35 * Math.sin(a), r * 0.45, r * 0.22, a, 0, Math.PI * 2);\n}`,
      'scallop': `// Scalloped Postage Stamp Border\nconst pad = 8;\nctx.rect(pad, pad, w - pad * 2, h - pad * 2);\nconst notchesX = 6, notchesY = 5;\nfor (let i = 1; i < notchesX; i++) {\n  const nx = pad + (i * (w - pad * 2)) / notchesX;\n  ctx.arc(nx, pad, 4, 0, Math.PI, false);\n  ctx.arc(nx, h - pad, 4, Math.PI, 0, false);\n}`
    };

    const PILLOW_PRESETS = {
      'pillow-star': `# Python Pillow (PIL.ImageDraw)\n# 10-vertex Star Polygon coordinates\ndraw.polygon([\n    (50, 5), (62, 38), (98, 38), (68, 60), (80, 95),\n    (50, 72), (20, 95), (32, 60), (2, 38), (38, 38)\n])`,
      'pillow-octagon': `# Python Pillow Regular Octagon Badge\ndraw.polygon([\n    (28, 5), (72, 5), (95, 28), (95, 72),\n    (72, 95), (28, 95), (5, 72), (5, 28)\n])`,
      'pillow-portal': `# Python Pillow Portal Arch Frame\ndraw.polygon([\n    (10, 95), (90, 95), (90, 45),\n    (75, 18), (50, 5), (25, 18), (10, 45)\n])`
    };

    const CAIRO_PRESETS = {
      'cairo-infinity': `# Pycairo Infinity Figure-8 Curve\ncr.move_to(0.5, 0.5)\ncr.curve_to(0.7, 0.2, 0.95, 0.2, 0.95, 0.5)\ncr.curve_to(0.95, 0.8, 0.7, 0.8, 0.5, 0.5)\ncr.curve_to(0.3, 0.2, 0.05, 0.2, 0.05, 0.5)\ncr.curve_to(0.05, 0.8, 0.3, 0.8, 0.5, 0.5)\ncr.close_path()`,
      'cairo-teardrop': `# Pycairo Organic Teardrop Frame\ncr.move_to(0.5, 0.05)\ncr.curve_to(0.85, 0.35, 0.95, 0.65, 0.5, 0.95)\ncr.curve_to(0.05, 0.65, 0.15, 0.35, 0.5, 0.05)\ncr.close_path()`,
      'cairo-capsule': `# Pycairo Smooth Capsule Frame\ncr.move_to(0.3, 0.15)\ncr.line_to(0.7, 0.15)\ncr.curve_to(0.95, 0.15, 0.95, 0.85, 0.7, 0.85)\ncr.line_to(0.3, 0.85)\ncr.curve_to(0.05, 0.85, 0.05, 0.15, 0.3, 0.15)\ncr.close_path()`
    };

    // Default initialization of textareas
    if (els.inputCombinerSvg) els.inputCombinerSvg.value = SVG_PRESETS.shield;
    if (els.inputCombinerCanvas) els.inputCombinerCanvas.value = CANVAS_PRESETS['double-ring'];
    if (els.inputCombinerPillow) els.inputCombinerPillow.value = PILLOW_PRESETS['pillow-star'];
    if (els.inputCombinerCairo) els.inputCombinerCairo.value = CAIRO_PRESETS['cairo-infinity'];

    // Bind Presets buttons
    function bindPresetButtons(containerId, presetsObj, textareaEl) {
      const container = document.getElementById(containerId);
      if (!container || !textareaEl) return;
      container.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-preset]');
        if (!btn) return;
        const key = btn.dataset.preset;
        if (presetsObj[key]) {
          textareaEl.value = presetsObj[key];
          updateCombinerLivePreview();
        }
      });
    }

    bindPresetButtons('svgPresetsWrap', SVG_PRESETS, els.inputCombinerSvg);
    bindPresetButtons('canvasPresetsWrap', CANVAS_PRESETS, els.inputCombinerCanvas);
    bindPresetButtons('pillowPresetsWrap', PILLOW_PRESETS, els.inputCombinerPillow);
    bindPresetButtons('cairoPresetsWrap', CAIRO_PRESETS, els.inputCombinerCairo);

    // Real-time input updates
    [els.inputCombinerSvg, els.inputCombinerCanvas, els.inputCombinerPillow, els.inputCombinerCairo].forEach(input => {
      if (input) input.addEventListener('input', () => updateCombinerLivePreview());
    });

    if (els.btnRefreshCombinerPreview) els.btnRefreshCombinerPreview.addEventListener('click', updateCombinerLivePreview);
    if (els.btnTestRenderCombiner) els.btnTestRenderCombiner.addEventListener('click', updateCombinerLivePreview);
    if (els.btnPreviewTextureToggle) {
      els.btnPreviewTextureToggle.addEventListener('click', () => {
        isPreviewPhotoTexture = !isPreviewPhotoTexture;
        updateCombinerLivePreview();
      });
    }

    // Helper: Parse Python Pillow ImageDraw code to SVG path
    function parsePillowCodeToSvg(code) {
      if (!code) return '';
      // 1. Check for draw.polygon([(x1, y1), ...])
      const polyMatch = code.match(/draw\.polygon\s*\(\s*\[?([\s\S]*?)\]?\s*\)/);
      if (polyMatch) {
        const coordRegex = /(?:\(|\b|\s)([0-9.]+)\s*,\s*([0-9.]+)(?:\)|\b|\s)/g;
        const pts = [];
        let m;
        while ((m = coordRegex.exec(polyMatch[1])) !== null) {
          pts.push({ x: parseFloat(m[1]), y: parseFloat(m[2]) });
        }
        if (pts.length >= 3) {
          return `M ${pts.map(p => `${p.x},${p.y}`).join(' L ')} Z`;
        }
      }
      // 2. Check for draw.ellipse([x0, y0, x1, y1])
      const elMatch = code.match(/draw\.ellipse\s*\(\s*\[\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)\s*\]/);
      if (elMatch) {
        const x0 = parseFloat(elMatch[1]), y0 = parseFloat(elMatch[2]), x1 = parseFloat(elMatch[3]), y1 = parseFloat(elMatch[4]);
        const w = x1 - x0, h = y1 - y0, cx = x0 + w / 2, cy = y0 + h / 2, rx = w / 2, ry = h / 2;
        return `M ${cx},${y0} A ${rx} ${ry} 0 1 0 ${cx},${y1} A ${rx} ${ry} 0 1 0 ${cx},${y0} Z`;
      }
      return '';
    }

    // Helper: Parse Cairo Context code to SVG path
    function parseCairoCodeToSvg(code) {
      if (!code) return '';
      const lines = code.split('\n');
      const cmds = [];
      lines.forEach(raw => {
        const l = raw.trim();
        const mMove = l.match(/cr\.move_to\s*\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*\)/);
        if (mMove) cmds.push(`M ${parseFloat(mMove[1]) * 100},${parseFloat(mMove[2]) * 100}`);
        const mLine = l.match(/cr\.line_to\s*\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*\)/);
        if (mLine) cmds.push(`L ${parseFloat(mLine[1]) * 100},${parseFloat(mLine[2]) * 100}`);
        const mCurve = l.match(/cr\.curve_to\s*\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)\s*\)/);
        if (mCurve) cmds.push(`C ${parseFloat(mCurve[1])*100},${parseFloat(mCurve[2])*100} ${parseFloat(mCurve[3])*100},${parseFloat(mCurve[4])*100} ${parseFloat(mCurve[5])*100},${parseFloat(mCurve[6])*100}`);
        if (l.includes('cr.close_path')) cmds.push('Z');
      });
      return cmds.join(' ');
    }

    // Real-time Preview Render Function
    function updateCombinerLivePreview() {
      if (!els.combinerPreviewCanvas) return;
      const canvas = els.combinerPreviewCanvas;
      const ctx = canvas.getContext('2d');
      const cw = canvas.width;
      const ch = canvas.height;

      ctx.clearRect(0, 0, cw, ch);

      // 1. Subtle dark checkerboard background
      const sq = 10;
      for (let py = 0; py < ch; py += sq) {
        for (let px = 0; px < cw; px += sq) {
          ctx.fillStyle = ((px / sq + py / sq) % 2 === 0) ? '#0f172a' : '#1e293b';
          ctx.fillRect(px, py, sq, sq);
        }
      }

      const rect = { x: 14, y: 14, width: cw - 28, height: ch - 28 };
      let customObj = null;

      try {
        ctx.save();

        if (activeCombinerTab === 'boolean') {
          const shapeA = els.selectCombinerShapeA?.value || 'rectangle';
          const shapeB = els.selectCombinerShapeB?.value || 'circle';
          const scaleB = (parseInt(els.rangeCombinerScaleB?.value || '60', 10)) / 100;
          const offX = (parseInt(els.rangeCombinerOffsetX?.value || '0', 10)) / 100;
          const offY = (parseInt(els.rangeCombinerOffsetY?.value || '0', 10)) / 100;

          customObj = { shapeA, shapeB, scaleB, offsetX: offX, offsetY: offY };
          canvasRenderer._renderCustomPathOnCtx(ctx, rect, customObj);

        } else if (activeCombinerTab === 'svg') {
          const rawSvg = (els.inputCombinerSvg?.value || '').trim();
          customObj = { svgPath: rawSvg };
          canvasRenderer._parseSvgPathToCanvas(ctx, rawSvg, rect.x, rect.y, rect.width, rect.height);

        } else if (activeCombinerTab === 'canvas') {
          const jsCode = els.inputCombinerCanvas?.value || '';
          customObj = { jsCode };
          const fn = new Function('ctx', 'w', 'h', 'x', 'y', jsCode);
          ctx.save();
          ctx.translate(rect.x, rect.y);
          fn(ctx, rect.width, rect.height, 0, 0);
          ctx.restore();

        } else if (activeCombinerTab === 'pillow') {
          const pillowCode = els.inputCombinerPillow?.value || '';
          const svgFromPillow = parsePillowCodeToSvg(pillowCode);
          customObj = { svgPath: svgFromPillow || SVG_PRESETS.shield };
          canvasRenderer._parseSvgPathToCanvas(ctx, customObj.svgPath, rect.x, rect.y, rect.width, rect.height);

        } else if (activeCombinerTab === 'cairo') {
          const cairoCode = els.inputCombinerCairo?.value || '';
          const svgFromCairo = parseCairoCodeToSvg(cairoCode);
          customObj = { svgPath: svgFromCairo || SVG_PRESETS.shield };
          canvasRenderer._parseSvgPathToCanvas(ctx, customObj.svgPath, rect.x, rect.y, rect.width, rect.height);
        }

        // Clip to shape
        ctx.clip();

        // Render Fill (Sample Photo or Rich Gradient)
        if (isPreviewPhotoTexture) {
          const firstPhoto = albumState.project?.photos?.[0];
          let img = firstPhoto ? (canvasRenderer._getImage(firstPhoto.src || firstPhoto.thumbSrc)) : null;
          if (img && img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, rect.x, rect.y, rect.width, rect.height);
          } else {
            const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.width, rect.y + rect.height);
            grad.addColorStop(0, '#0284c7');
            grad.addColorStop(0.5, '#6366f1');
            grad.addColorStop(1, '#a855f7');
            ctx.fillStyle = grad;
            ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
          }
        } else {
          const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.width, rect.y + rect.height);
          grad.addColorStop(0, '#0284c7');
          grad.addColorStop(0.5, '#3b82f6');
          grad.addColorStop(1, '#8b5cf6');
          ctx.fillStyle = grad;
          ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.lineWidth = 1;
          for (let gy = rect.y; gy < rect.y + rect.height; gy += 20) {
            ctx.beginPath(); ctx.moveTo(rect.x, gy); ctx.lineTo(rect.x + rect.width, gy); ctx.stroke();
          }
        }

        ctx.restore();

        // 2. Stroke Glowing Cyan Outline
        ctx.save();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = 'rgba(56, 189, 248, 0.6)';
        ctx.shadowBlur = 8;

        if (activeCombinerTab === 'boolean') {
          canvasRenderer._renderCustomPathOnCtx(ctx, rect, customObj);
        } else if (activeCombinerTab === 'svg') {
          canvasRenderer._parseSvgPathToCanvas(ctx, customObj.svgPath, rect.x, rect.y, rect.width, rect.height);
        } else if (activeCombinerTab === 'canvas') {
          const fn = new Function('ctx', 'w', 'h', 'x', 'y', customObj.jsCode);
          ctx.save();
          ctx.translate(rect.x, rect.y);
          fn(ctx, rect.width, rect.height, 0, 0);
          ctx.restore();
        } else if (activeCombinerTab === 'pillow' || activeCombinerTab === 'cairo') {
          canvasRenderer._parseSvgPathToCanvas(ctx, customObj.svgPath, rect.x, rect.y, rect.width, rect.height);
        }
        ctx.stroke();
        ctx.restore();

        if (els.combinerStatusMessage) {
          els.combinerStatusMessage.style.color = '#38bdf8';
          els.combinerStatusMessage.textContent = '✓ Live preview rendered successfully';
        }
      } catch (err) {
        ctx.restore();
        if (els.combinerStatusMessage) {
          els.combinerStatusMessage.style.color = '#f43f5e';
          els.combinerStatusMessage.textContent = `⚠️ Syntax: ${err.message}`;
        }
      }
    }

    // 7. "Apply / Draw With This Combined Shape"
    if (els.btnApplyShapeCombiner) {
      els.btnApplyShapeCombiner.addEventListener('click', () => {
        let customData = null;

        if (activeCombinerTab === 'boolean') {
          const shapeA = els.selectCombinerShapeA?.value || 'rectangle';
          const shapeB = els.selectCombinerShapeB?.value || 'circle';
          const scaleB = (parseInt(els.rangeCombinerScaleB?.value || '60', 10)) / 100;
          const offX = (parseInt(els.rangeCombinerOffsetX?.value || '0', 10)) / 100;
          const offY = (parseInt(els.rangeCombinerOffsetY?.value || '0', 10)) / 100;
          customData = { shapeA, shapeB, scaleB, offsetX: offX, offsetY: offY };

        } else if (activeCombinerTab === 'svg') {
          customData = { svgPath: (els.inputCombinerSvg?.value || '').trim() };

        } else if (activeCombinerTab === 'canvas') {
          customData = { jsCode: els.inputCombinerCanvas?.value || '' };

        } else if (activeCombinerTab === 'pillow') {
          const svgP = parsePillowCodeToSvg(els.inputCombinerPillow?.value || '');
          customData = { svgPath: svgP || SVG_PRESETS.shield };

        } else if (activeCombinerTab === 'cairo') {
          const svgC = parseCairoCodeToSvg(els.inputCombinerCairo?.value || '');
          customData = { svgPath: svgC || SVG_PRESETS.shield };
        }

        selectDrawShape('custom', customData);
        closeShapeCombinerModal();
        canvasRenderer?.toggleDrawNewFrameMode(true, 'custom', customData);
        window.showToastNotification?.('⚡ Combined Shape Ready • Click & drag on spread to draw frame!');
      });
    }

    // Default select
    selectDrawShape('rectangle');
  }

  resizeCanvasStage();
  requestAnimationFrame(() => {
    resizeCanvasStage();
    setTimeout(resizeCanvasStage, 100);
    setTimeout(resizeCanvasStage, 300);
  });
  updateHUD();
  updateAppBookTitle(albumState.project?.title);
  renderFilmstrip();
  renderPhotoTray();
  renderFloatingLayoutsBar();
  initDrawShapesLibraryAndCombiner();
  updateUndoRedoButtons();
  updateAllTemplateCountBadges();
  if (canvasRenderer) canvasRenderer.render();
  } catch (err) {
    console.error("FATAL ERROR IN INITAPP:", err);
    window.__initError = (err && err.stack) ? err.stack : String(err);
  }
}

// Robust execution whether DOM is loading or already parsed
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
