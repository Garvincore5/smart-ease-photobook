import re

with open('cropped_spreads_method.js', 'r', encoding='utf-8') as f:
    method_code = f.read()

with open('js/layout-engine.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add merging loop in getBuiltInTemplates
old_merge = """    const artisticTemplates = this._getTempNewArtisticTemplates();
    for (const count in artisticTemplates) {
      if (!templates[count]) templates[count] = [];
      templates[count].unshift(...artisticTemplates[count]);
    }"""

new_merge = """    const artisticTemplates = this._getTempNewArtisticTemplates();
    for (const count in artisticTemplates) {
      if (!templates[count]) templates[count] = [];
      templates[count].unshift(...artisticTemplates[count]);
    }

    // Merge authentic cropped spread designs from "temp new/spreads/cropped/spreads"
    const croppedSpreadTemplates = this._getTempNewCroppedSpreadsTemplates();
    for (const count in croppedSpreadTemplates) {
      if (!templates[count]) templates[count] = [];
      templates[count].unshift(...croppedSpreadTemplates[count]);
    }"""

if old_merge in content:
    content = content.replace(old_merge, new_merge)
    print("Replaced merge loop successfully.")
else:
    print("WARNING: old_merge string not found.")

# 2. Append _getTempNewCroppedSpreadsTemplates method right before the end of the class
insert_marker = "\n  _continuousNormalizeRects(rects) {"
if insert_marker in content:
    content = content.replace(insert_marker, "\n" + method_code + "\n" + insert_marker)
    print("Appended _getTempNewCroppedSpreadsTemplates method successfully.")
else:
    print("WARNING: insert_marker not found.")

with open('js/layout-engine.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated js/layout-engine.js successfully.")
