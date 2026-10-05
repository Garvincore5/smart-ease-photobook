import json

with open('temp_cropped_spreads.json', 'r', encoding='utf-8') as f:
    items = json.load(f)

by_count = {}
for it in items:
    cnt = it['count']
    by_count.setdefault(cnt, []).append(it)

lines = []
lines.append('  _getTempNewCroppedSpreadsTemplates() {')
lines.append('    return {')

for cnt in sorted(by_count.keys()):
    lines.append(f'      // {cnt} Photos (Cropped Spread Layouts)')
    lines.append(f'      {cnt}: [')
    tpl_entries = []
    for tpl in by_count[cnt]:
        rects_js = []
        for r in tpl['rects']:
            rects_js.append(f"{{ x: {r['x']}, y: {r['y']}, w: {r['w']}, h: {r['h']} }}")
        rects_str = ', '.join(rects_js)
        entry = f"        {{ id: '{tpl['id']}', name: '📖 {tpl['name']}', rects: [ {rects_str} ] }}"
        tpl_entries.append(entry)
    lines.append(',\n'.join(tpl_entries))
    lines.append('      ],')
lines.append('    };')
lines.append('  }')

js_method = '\n'.join(lines)

with open('cropped_spreads_method.js', 'w', encoding='utf-8') as out:
    out.write(js_method)

print('Generated cropped_spreads_method.js with length:', len(js_method))
