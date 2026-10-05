# Smart Ease - Offline Photobook & Album Designer

A high-performance, **100% offline desktop application** inspired by **Pixellu SmartAlbums**, designed for photographers to automatically and interactively create luxury flush-mount albums and photobooks with dynamic, varying rectangular layouts.

---

## 🚀 Quick Start (One-Click Launch)

Simply double-click:
- **`Launch-SmartEase.bat`** in `d:\Antigravity\` or
- **`Launch-SmartEase.bat`** in `d:\Antigravity\photobook-smartalbums\`

This starts the embedded offline static server and launches the app in **Edge Desktop App Mode** (a frameless, native desktop window without browser bars).

Alternatively, you can open `index.html` directly in any web browser (Chrome, Edge, Firefox, Brave).

---

## ✨ Key Features

### 1. 🖼️ True PC-Style Multi-Selection (Shift + Ctrl)
- **`Shift + Click`**: Select a contiguous range of photos from anchor to target.
- **`Ctrl + Click`**: Toggle selection on individual photos (add or remove single photos).
- **`Ctrl + Shift + Click`**: Extend range selection without clearing existing selections.
- **`Ctrl + A`**: Select all photos in the current tray filter.
- **`Escape`**: Instantly clear selection.
- **Multi-Photo Placement**: Drag selected photos together onto the canvas or click **"Place on Spread"** to populate or append them immediately.

### 2. 🔍 Right-Side Frame Inspector & Preview Bar
- Positioned on the **right side of user view** when any photo on the spread is touched or selected.
- **Large Touched Image Preview**: Features a large high-fidelity preview at the top of the inspector with aspect ratio and slot identification.
- **Adjustments Below**:
  - **Rescale / Zoom**: Smooth slider with 100%, 125%, 150%, 200% quick presets and +/- buttons.
  - **Reposition / Pan**: Interactive D-pad nudge buttons and center alignment.
  - **Orientation & Actions**: 90° rotation and instant photo removal.
- All inspector adjustments immediately update the photo on the spread canvas in real-time.

### 3. 🪟 Over 100+ Layout Options (Floating Blueprint Bar)
- Provides **dozens of curated and procedural layout variations per photo count** (over 250+ total options across the app), ensuring photographers are never limited to just two or three choices.
- Transparent glassmorphic floating selector positioned directly above the canvas spread.
- **Hover Preview**: Hovering over any blueprint chip renders live transparent ghost guidelines on the canvas.
- **Landscape & Portrait Spread Orientation**: Switch between wide Landscape and tall Portrait spread aspect ratios with 1-click.
- **Layout Orientation Filters (All / Wide / Tall)**: Filter miniature layout chips to view only layouts with wide/landscape rectangles or tall/portrait rectangles.
- Click any chip to switch layout immediately with zero lag.

### 4. 📐 Double-Sized Full Sheet Designing & Symmetric Middle Margin
- **Landscape & Portrait Orientation Controls**: Available in both the secondary toolbar and floating spread bar, or via shortcut **`O`**.
- **Double Size in Spread Mode**: Selected size represents 1 page; in spread mode, the workspace is double the size representing a continuous side-by-side sheet (e.g. selecting A3 (12×16") creates a 24×16" double-page sheet in portrait or 32×12" in landscape).
- **Single Page Mode**: Displays 1× the selected size (e.g. 12×16" or 16×12") for single page prints.
- **Middle Margin / Gutter**: Dedicated slider to symmetrically separate left and right pages down the center crease line.

### 5. 🖨️ Pro Lab 300 DPI Export (Full Sheets or Split Single Pages)
- **Multi-Page Print-Ready PDF**: Compiles full-resolution PDF albums directly offline.
- **Export as Full Sheets**: Side-by-side double spreads on continuous sheets.
- **Export as Single Pages**: Automatically slices double spreads down the center seam into consecutive 1-up pages (`Page_01.jpg`, `Page_02.jpg`, etc., or individual PDF pages).
- **High-Res Spread JPEGs**: 300 DPI pro lab quality (e.g., 7200 × 3600 px for 24 × 12" spreads).
- **Offline Project Persistence**: Save your album project to `.smartease.json` and resume anytime.

### 5. ⚡ Dynamic Binary Space Partitioning (BSP) / Treemap Engine
- **200+ Smart Curated Layouts**: Balanced combinations for spreads with 1 to 12+ photos.
- **Intelligent Aspect-Ratio Matching**: Minimizes cropping by automatically placing portrait photos into vertical slots and landscape photos into panoramic slots.
- **Instant Layout Cycling**: Press **Spacebar** to cycle forward through layouts, **Shift+Space** to cycle back, or **R** to randomly vary rectangular proportions.
- **Horizontal Mirroring (Flip)**: Press **H** to mirror the layout between left and right pages.

### 6. 🖐️ Interactive Canvas Framing & Swapping
- **Pan & Crop**: Click and drag inside any frame to reposition the photo crop.
- **Zoom**: Scroll your mouse wheel over any photo to zoom in or out.
- **Drag & Drop Swapping**: Drag any photo frame onto another to swap positions instantly.
- **Photo Tray**: Drag any photo from the bottom pool directly onto the active spread or double-click to add it.
- **Spine Crease & Safe Zone Guides**: Realistic center fold line and print safe margins.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| **`Shift + Click`** | Select range of photos in tray |
| **`Ctrl + Click`** | Toggle individual photo selection (add/remove) |
| **`Ctrl + A`** | Select all photos in tray |
| **`Escape`** | Deselect photos / Clear selection |
| **`Space`** | Cycle to Next Layout |
| **`Shift + Space`** | Cycle to Previous Layout |
| **`R`** | Shuffle / Randomize Varying Rectangles |
| **`H`** | Flip / Mirror Pages Horizontally |
| **`O`** | Toggle Spread Orientation (Landscape / Portrait) |
| **`→` / `←`** | Navigate between spreads |
| **`Ctrl + Z`** | Undo |
| **`Ctrl + Y`** | Redo |
| **Mouse Wheel** | Zoom photo inside frame |
| **Click & Drag** | Pan photo framing within rectangle |

---

## 📁 File Structure

```
photobook-smartalbums/
├── index.html                   # Desktop application UI shell
├── Launch-SmartAlbums.bat       # Windows desktop double-click launcher
├── start-app.ps1                # Zero-dependency PowerShell server & Edge launcher
├── css/
│   └── styles.css               # Studio dark theme (Pixellu / Lightroom aesthetic)
└── js/
    ├── layout-engine.js         # Curated templates + BSP varying rectangles generator
    ├── album-state.js           # Photobook state, undo/redo, auto-build heuristics
    ├── canvas-renderer.js       # Retina canvas renderer, pan/zoom, drag & drop
    ├── pdf-export.js            # Standalone offline 300 DPI PDF & JPEG compiler
    ├── sample-loader.js         # Sample loader from local studio folder or synthetic cards
    └── app.js                   # Application controller & event bindings
```
