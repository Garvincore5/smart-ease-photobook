import os
import sys
import re

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_artistic_templates import artistic_templates_by_count

def format_tpl_js(t):
    rect_lines = []
    chunk = []
    for r in t['rects']:
        props = [f"x: {r['x']}", f"y: {r['y']}", f"w: {r['w']}", f"h: {r['h']}"]
        if r.get('shape') and r['shape'] != 'rectangle':
            props.append(f"shape: '{r['shape']}'")
        if 'borderRadius' in r:
            props.append(f"borderRadius: {r['borderRadius']}")
        if 'rotation' in r and r['rotation']:
            props.append(f"rotation: {r['rotation']}")
        chunk.append("{ " + ", ".join(props) + " }")
        if len(chunk) == 2:
            rect_lines.append("          " + ", ".join(chunk))
            chunk = []
    if chunk:
        rect_lines.append("          " + ", ".join(chunk))
    
    rects_body = ",\n".join(rect_lines)
    return f"""        {{ id: '{t['id']}', name: '{t['name']}', rects: [\n{rects_body}\n        ]}}"""

def generate_artistic_method_code():
    lines = []
    lines.append('  /**')
    lines.append('   * Artistic single page designs & pairings extracted from:')
    lines.append('   * temp new/artistic (Circles, Arch Domes, Diamonds, Watercolor Splash, Brush Strokes, Flared Triptychs)')
    lines.append('   */')
    lines.append('  _getTempNewArtisticTemplates() {')
    lines.append('    return {')

    count_blocks = []
    for count in sorted(artistic_templates_by_count.keys()):
        tpls = artistic_templates_by_count[count]
        formatted = ',\n'.join([format_tpl_js(t) for t in tpls])
        count_blocks.append(f'      // {count} Photos (Artistic Circles, Arches, Diamonds & Brush Layouts)\n      {count}: [\n{formatted}\n      ]')

    lines.append(',\n\n'.join(count_blocks))
    lines.append('    };')
    lines.append('  }')
    return '\n'.join(lines)

def update_layout_engine():
    target_path = r"D:\Antigravity\photobook\photobook-smartalbums\js\layout-engine.js"
    with open(target_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update _initTemplates() to unshift artistic templates at the top
    old_merge = """    // Merge authentic single-page designs and two-by-two spread pairings from "temp new/single page"
    const singlePageTemplates = this._getTempNewSinglePageTemplates();
    for (const count in singlePageTemplates) {
      if (!templates[count]) templates[count] = [];
      templates[count].push(...singlePageTemplates[count]);
    }

    return templates;"""

    new_merge = """    // Merge authentic single-page designs and two-by-two spread pairings from "temp new/single page"
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

    return templates;"""

    if old_merge in content:
        content = content.replace(old_merge, new_merge, 1)
        print("Updated _initTemplates() to merge artistic templates at top")
    else:
        print("WARNING: old_merge not found!")

    # 2. Append _getTempNewArtisticTemplates() after _getTempNewSinglePageTemplates()
    art_code = generate_artistic_method_code()
    
    # Locate end of _getTempNewSinglePageTemplates
    target_end_marker = "  _getTempNewSinglePageTemplates() {"
    idx = content.find(target_end_marker)
    if idx != -1:
        # find closing `  }` of this method
        close_idx = content.find("\n  }\n\n  /**\n   * Horizontally mirrors a layout", idx)
        if close_idx != -1:
            content = content[:close_idx + 4] + "\n\n" + art_code + content[close_idx + 4:]
            print("Appended _getTempNewArtisticTemplates() method")
        else:
            print("WARNING: Could not find closing of _getTempNewSinglePageTemplates")
    else:
        print("WARNING: Could not find _getTempNewSinglePageTemplates")

    # 3. Ensure normRects in _generateRealisticLayoutLibrary preserves shape
    old_norm_map = """        return {
          x: Math.max(0, Math.min(0.995, Number((r.x || 0).toFixed(4)))),
          y: Math.max(0, Math.min(0.995, Number((r.y || 0).toFixed(4)))),
          w: normW,
          h: normH,
          width: normW,
          height: normH
        };"""

    new_norm_map = """        return {
          ...r,
          x: Math.max(0, Math.min(0.995, Number((r.x || 0).toFixed(4)))),
          y: Math.max(0, Math.min(0.995, Number((r.y || 0).toFixed(4)))),
          w: normW,
          h: normH,
          width: normW,
          height: normH,
          shape: r.shape || 'rectangle'
        };"""

    if old_norm_map in content:
        content = content.replace(old_norm_map, new_norm_map, 1)
        print("Updated _generateRealisticLayoutLibrary to preserve shape")

    # 4. Ensure flipLayoutHorizontal preserves shape
    old_flip = """    const flippedRects = layout.rects.map(r => ({
      x: Number((1.0 - (r.x + r.w)).toFixed(4)),
      y: r.y,
      w: r.w,
      h: r.h
    }));"""

    new_flip = """    const flippedRects = layout.rects.map(r => ({
      ...r,
      x: Number((1.0 - (r.x + r.w)).toFixed(4)),
      y: r.y,
      w: r.w,
      h: r.h,
      shape: r.shape || 'rectangle'
    }));"""

    if old_flip in content:
        content = content.replace(old_flip, new_flip, 1)
        print("Updated flipLayoutHorizontal to preserve shape")

    # 5. Ensure computePixelRectangles returns shape
    old_compute_custom = """        return {
          slotIndex,
          x: Math.round(pxX),
          y: Math.round(pxY),
          width: Math.max(8, Math.round(pxW)),
          height: Math.max(8, Math.round(pxH))
        };"""

    new_compute_custom = """        return {
          slotIndex,
          x: Math.round(pxX),
          y: Math.round(pxY),
          width: Math.max(8, Math.round(pxW)),
          height: Math.max(8, Math.round(pxH)),
          shape: r.shape || 'rectangle',
          borderRadius: r.borderRadius || 0,
          rotation: r.rotation || 0
        };"""

    if old_compute_custom in content:
        content = content.replace(old_compute_custom, new_compute_custom, 1)
        print("Updated computePixelRectangles custom placement to return shape")

    old_compute_std = """      return {
        slotIndex,
        x: Math.round(pxX),
        y: Math.round(pxY),
        width: Math.max(8, Math.round(pxW)),
        height: Math.max(8, Math.round(pxH))
      };"""

    new_compute_std = """      return {
        slotIndex,
        x: Math.round(pxX),
        y: Math.round(pxY),
        width: Math.max(8, Math.round(pxW)),
        height: Math.max(8, Math.round(pxH)),
        shape: r.shape || 'rectangle',
        borderRadius: r.borderRadius || 0,
        rotation: r.rotation || 0
      };"""

    if old_compute_std in content:
        content = content.replace(old_compute_std, new_compute_std, 1)
        print("Updated computePixelRectangles standard placement to return shape")

    with open(target_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("SUCCESS: layout-engine.js updated with artistic templates!")

if __name__ == '__main__':
    update_layout_engine()
