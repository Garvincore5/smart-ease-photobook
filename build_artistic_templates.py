import json

# Definitions of the 16 artistic single page designs from "temp new/artistic"
artistic_single_pages = [
    {
        'id_key': '5circles',
        'name': 'Artistic 5-Circle Cloud Gallery',
        'count': 5,
        'rects': [
            {'x': 0.35, 'y': 0.34, 'w': 0.35, 'h': 0.35, 'shape': 'circle'},
            {'x': 0.32, 'y': 0.20, 'w': 0.23, 'h': 0.23, 'shape': 'circle'},
            {'x': 0.18, 'y': 0.31, 'w': 0.23, 'h': 0.23, 'shape': 'circle'},
            {'x': 0.49, 'y': 0.25, 'w': 0.16, 'h': 0.16, 'shape': 'circle'},
            {'x': 0.60, 'y': 0.28, 'w': 0.22, 'h': 0.22, 'shape': 'circle'}
        ]
    },
    {
        'id_key': '2brush_circle',
        'name': 'Artistic Brush Stroke & Circle Accent',
        'count': 2,
        'rects': [
            {'x': 0.12, 'y': 0.06, 'w': 0.76, 'h': 0.88, 'shape': 'brush'},
            {'x': 0.50, 'y': 0.58, 'w': 0.32, 'h': 0.32, 'shape': 'circle'}
        ]
    },
    {
        'id_key': '5arch_grid',
        'name': 'Artistic Arch Dome & 4-Grid',
        'count': 5,
        'rects': [
            {'x': 0.32, 'y': 0.08, 'w': 0.36, 'h': 0.80, 'shape': 'arch'},
            {'x': 0.06, 'y': 0.08, 'w': 0.23, 'h': 0.38, 'shape': 'rectangle'},
            {'x': 0.06, 'y': 0.50, 'w': 0.23, 'h': 0.38, 'shape': 'rectangle'},
            {'x': 0.71, 'y': 0.08, 'w': 0.23, 'h': 0.38, 'shape': 'rectangle'},
            {'x': 0.71, 'y': 0.50, 'w': 0.23, 'h': 0.38, 'shape': 'rectangle'}
        ]
    },
    {
        'id_key': '4watercolor_3stack',
        'name': 'Watercolor Splash & 3-Triptych Stack',
        'count': 4,
        'rects': [
            {'x': 0.06, 'y': 0.08, 'w': 0.48, 'h': 0.84, 'shape': 'brush'},
            {'x': 0.58, 'y': 0.08, 'w': 0.36, 'h': 0.25, 'shape': 'rectangle'},
            {'x': 0.58, 'y': 0.37, 'w': 0.36, 'h': 0.25, 'shape': 'rectangle'},
            {'x': 0.58, 'y': 0.67, 'w': 0.36, 'h': 0.25, 'shape': 'rectangle'}
        ]
    },
    {
        'id_key': '5diamond_mosaic',
        'name': 'Diamond Rhombus Mosaic Story',
        'count': 5,
        'rects': [
            {'x': 0.32, 'y': 0.14, 'w': 0.36, 'h': 0.68, 'shape': 'diamond'},
            {'x': 0.14, 'y': 0.14, 'w': 0.22, 'h': 0.32, 'shape': 'diamond'},
            {'x': 0.14, 'y': 0.50, 'w': 0.22, 'h': 0.32, 'shape': 'diamond'},
            {'x': 0.64, 'y': 0.14, 'w': 0.22, 'h': 0.32, 'shape': 'diamond'},
            {'x': 0.64, 'y': 0.50, 'w': 0.22, 'h': 0.32, 'shape': 'diamond'}
        ]
    },
    {
        'id_key': '4curved_filmstrip',
        'name': 'Curved Wave Filmstrip Splatter',
        'count': 4,
        'rects': [
            {'x': 0.04, 'y': 0.38, 'w': 0.21, 'h': 0.26, 'shape': 'brush'},
            {'x': 0.27, 'y': 0.34, 'w': 0.21, 'h': 0.25, 'shape': 'brush'},
            {'x': 0.50, 'y': 0.37, 'w': 0.21, 'h': 0.25, 'shape': 'brush'},
            {'x': 0.73, 'y': 0.44, 'w': 0.21, 'h': 0.26, 'shape': 'brush'}
        ]
    },
    {
        'id_key': '1torn_paper',
        'name': 'Torn Paper Artistic Reveal',
        'count': 1,
        'rects': [
            {'x': 0.04, 'y': 0.06, 'w': 0.92, 'h': 0.88, 'shape': 'brush'}
        ]
    },
    {
        'id_key': '1grunge_filmstrip',
        'name': 'Grunge Filmstrip Frame',
        'count': 1,
        'rects': [
            {'x': 0.12, 'y': 0.06, 'w': 0.76, 'h': 0.88, 'shape': 'brush'}
        ]
    },
    {
        'id_key': '4staggered_panels',
        'name': '4 Staggered Layered Panels',
        'count': 4,
        'rects': [
            {'x': 0.06, 'y': 0.10, 'w': 0.21, 'h': 0.76, 'shape': 'rectangle'},
            {'x': 0.28, 'y': 0.06, 'w': 0.21, 'h': 0.76, 'shape': 'rectangle'},
            {'x': 0.50, 'y': 0.13, 'w': 0.21, 'h': 0.76, 'shape': 'rectangle'},
            {'x': 0.72, 'y': 0.09, 'w': 0.21, 'h': 0.76, 'shape': 'rectangle'}
        ]
    },
    {
        'id_key': '4hanging_frames',
        'name': '4 Suspended Hanging Squares',
        'count': 4,
        'rects': [
            {'x': 0.22, 'y': 0.04, 'w': 0.22, 'h': 0.22, 'shape': 'rectangle'},
            {'x': 0.10, 'y': 0.27, 'w': 0.22, 'h': 0.22, 'shape': 'rectangle'},
            {'x': 0.26, 'y': 0.52, 'w': 0.22, 'h': 0.22, 'shape': 'rectangle'},
            {'x': 0.15, 'y': 0.76, 'w': 0.22, 'h': 0.22, 'shape': 'rectangle'}
        ]
    },
    {
        'id_key': '3flared_triptych',
        'name': '3 Flared Dynamic Triptych',
        'count': 3,
        'rects': [
            {'x': 0.04, 'y': 0.06, 'w': 0.24, 'h': 0.88, 'shape': 'skew'},
            {'x': 0.28, 'y': 0.06, 'w': 0.44, 'h': 0.88, 'shape': 'rectangle'},
            {'x': 0.72, 'y': 0.06, 'w': 0.24, 'h': 0.88, 'shape': 'skew'}
        ]
    },
    {
        'id_key': '5editorial_slices',
        'name': '5 Editorial Magazine Slices',
        'count': 5,
        'rects': [
            {'x': 0.05, 'y': 0.20, 'w': 0.18, 'h': 0.60, 'shape': 'rectangle'},
            {'x': 0.23, 'y': 0.20, 'w': 0.18, 'h': 0.60, 'shape': 'rectangle'},
            {'x': 0.41, 'y': 0.20, 'w': 0.18, 'h': 0.60, 'shape': 'rectangle'},
            {'x': 0.59, 'y': 0.20, 'w': 0.18, 'h': 0.60, 'shape': 'rectangle'},
            {'x': 0.77, 'y': 0.20, 'w': 0.18, 'h': 0.60, 'shape': 'rectangle'}
        ]
    },
    {
        'id_key': '5diamond_quadrant',
        'name': 'Center Diamond Quadrant',
        'count': 5,
        'rects': [
            {'x': 0.30, 'y': 0.30, 'w': 0.40, 'h': 0.40, 'shape': 'diamond'},
            {'x': 0.06, 'y': 0.06, 'w': 0.42, 'h': 0.42, 'shape': 'rectangle'},
            {'x': 0.52, 'y': 0.06, 'w': 0.42, 'h': 0.42, 'shape': 'rectangle'},
            {'x': 0.06, 'y': 0.52, 'w': 0.42, 'h': 0.42, 'shape': 'rectangle'},
            {'x': 0.52, 'y': 0.52, 'w': 0.42, 'h': 0.42, 'shape': 'rectangle'}
        ]
    },
    {
        'id_key': '4curved_quad',
        'name': 'Organic Curved Corner Quad',
        'count': 4,
        'rects': [
            {'x': 0.12, 'y': 0.10, 'w': 0.42, 'h': 0.39, 'shape': 'rounded', 'borderRadius': 28},
            {'x': 0.57, 'y': 0.14, 'w': 0.31, 'h': 0.31, 'shape': 'rectangle'},
            {'x': 0.15, 'y': 0.53, 'w': 0.31, 'h': 0.31, 'shape': 'rectangle'},
            {'x': 0.40, 'y': 0.47, 'w': 0.48, 'h': 0.42, 'shape': 'rounded', 'borderRadius': 28}
        ]
    },
    {
        'id_key': '4parallelogram',
        'name': '4 Slanted Parallelograms',
        'count': 4,
        'rects': [
            {'x': 0.04, 'y': 0.08, 'w': 0.23, 'h': 0.84, 'shape': 'skew'},
            {'x': 0.28, 'y': 0.08, 'w': 0.23, 'h': 0.84, 'shape': 'skew'},
            {'x': 0.52, 'y': 0.08, 'w': 0.23, 'h': 0.84, 'shape': 'skew'},
            {'x': 0.74, 'y': 0.08, 'w': 0.23, 'h': 0.84, 'shape': 'skew'}
        ]
    },
    {
        'id_key': '3perspective_triptych',
        'name': '3-D Perspective Gallery Triptych',
        'count': 3,
        'rects': [
            {'x': 0.06, 'y': 0.10, 'w': 0.24, 'h': 0.80, 'shape': 'skew'},
            {'x': 0.36, 'y': 0.15, 'w': 0.28, 'h': 0.70, 'shape': 'rectangle'},
            {'x': 0.70, 'y': 0.10, 'w': 0.24, 'h': 0.80, 'shape': 'skew'}
        ]
    }
]

def to_left(rects):
    res = []
    for r in rects:
        entry = {
            'x': round(0.04 + r['x'] * 0.42, 3),
            'y': round(0.06 + r['y'] * 0.88, 3),
            'w': round(r['w'] * 0.42, 3),
            'h': round(r['h'] * 0.88, 3),
            'shape': r.get('shape', 'rectangle')
        }
        if 'borderRadius' in r:
            entry['borderRadius'] = r['borderRadius']
        res.append(entry)
    return res

def to_right(rects):
    res = []
    for r in rects:
        entry = {
            'x': round(0.54 + r['x'] * 0.42, 3),
            'y': round(0.06 + r['y'] * 0.88, 3),
            'w': round(r['w'] * 0.42, 3),
            'h': round(r['h'] * 0.88, 3),
            'shape': r.get('shape', 'rectangle')
        }
        if 'borderRadius' in r:
            entry['borderRadius'] = r['borderRadius']
        res.append(entry)
    return res

hero_circle_right = [{'x': 0.58, 'y': 0.12, 'w': 0.34, 'h': 0.76, 'shape': 'circle'}]
hero_circle_left = [{'x': 0.08, 'y': 0.12, 'w': 0.34, 'h': 0.76, 'shape': 'circle'}]
hero_arch_right = [{'x': 0.56, 'y': 0.08, 'w': 0.38, 'h': 0.84, 'shape': 'arch'}]
hero_arch_left = [{'x': 0.06, 'y': 0.08, 'w': 0.38, 'h': 0.84, 'shape': 'arch'}]
hero_diamond_right = [{'x': 0.56, 'y': 0.08, 'w': 0.38, 'h': 0.84, 'shape': 'diamond'}]
hero_diamond_left = [{'x': 0.06, 'y': 0.08, 'w': 0.38, 'h': 0.84, 'shape': 'diamond'}]
hero_rect_right = [{'x': 0.56, 'y': 0.08, 'w': 0.38, 'h': 0.84, 'shape': 'rectangle'}]
hero_rect_left = [{'x': 0.06, 'y': 0.08, 'w': 0.38, 'h': 0.84, 'shape': 'rectangle'}]

artistic_templates_by_count = {}
def add_art(count, tpl):
    if count not in artistic_templates_by_count:
        artistic_templates_by_count[count] = []
    artistic_templates_by_count[count].append(tpl)

# 1. Standalone artistic single-page layouts (Left & Right)
for sp in artistic_single_pages:
    c = sp['count']
    add_art(c, {
        'id': f"{c}-art-{sp['id_key']}-left",
        'name': f"★ {sp['name']} Left",
        'rects': to_left(sp['rects'])
    })
    add_art(c, {
        'id': f"{c}-art-{sp['id_key']}-right",
        'name': f"★ {sp['name']} Right",
        'rects': to_right(sp['rects'])
    })

# 2. Key Artistic Single Page + Hero Inset Pairings
# 5-Circles Left + Hero Circle Right = 6 Photos!
add_art(6, {
    'id': '6-art-5circles-hero-circle-right',
    'name': '★ 5 Circles Left + Hero Circle Right (Artistic Spread)',
    'rects': to_left(artistic_single_pages[0]['rects']) + hero_circle_right
})
add_art(6, {
    'id': '6-art-hero-circle-left-5circles',
    'name': '★ Hero Circle Left + 5 Circles Right (Artistic Spread)',
    'rects': hero_circle_left + to_right(artistic_single_pages[0]['rects'])
})
# 5-Arch Left + Hero Arch Right = 6 Photos!
add_art(6, {
    'id': '6-art-5arch-hero-arch-right',
    'name': '★ Arch Dome Left + Hero Arch Right (Artistic Spread)',
    'rects': to_left(artistic_single_pages[2]['rects']) + hero_arch_right
})
# 5-Diamond Left + Hero Diamond Right = 6 Photos!
add_art(6, {
    'id': '6-art-5diamond-hero-diamond-right',
    'name': '★ Diamond Mosaic Left + Hero Diamond Right (Artistic Spread)',
    'rects': to_left(artistic_single_pages[4]['rects']) + hero_diamond_right
})
# 2-Brush Left + Hero Circle Right = 3 Photos!
add_art(3, {
    'id': '3-art-2brush-hero-circle-right',
    'name': '★ Brush Stroke Left + Hero Circle Right (Artistic Spread)',
    'rects': to_left(artistic_single_pages[1]['rects']) + hero_circle_right
})
add_art(3, {
    'id': '3-art-hero-circle-left-2brush',
    'name': '★ Hero Circle Left + Brush Stroke Right (Artistic Spread)',
    'rects': hero_circle_left + to_right(artistic_single_pages[1]['rects'])
})
# 4-Watercolor Left + Hero Circle Right = 5 Photos!
add_art(5, {
    'id': '5-art-watercolor-hero-circle-right',
    'name': '★ Watercolor Splash Left + Hero Circle Right (Artistic Spread)',
    'rects': to_left(artistic_single_pages[3]['rects']) + hero_circle_right
})

# 3. Two-by-Two Combinations of Artistic Single Pages!
# Select primary pairings:
# 5-Circles + 5-Circles = 10 Photos!
add_art(10, {
    'id': '10-art-dual-5circles',
    'name': '★ Dual 5-Circle Cloud Gallery (10 Circular Photos Spread)',
    'rects': to_left(artistic_single_pages[0]['rects']) + to_right(artistic_single_pages[0]['rects'])
})
# 5-Circles Left + 5-Arch Right = 10 Photos!
add_art(10, {
    'id': '10-art-5circles-5arch',
    'name': '★ 5 Circles Left + Arch Dome 4-Grid Right (Artistic Spread)',
    'rects': to_left(artistic_single_pages[0]['rects']) + to_right(artistic_single_pages[2]['rects'])
})
add_art(10, {
    'id': '10-art-5arch-5circles',
    'name': '★ Arch Dome 4-Grid Left + 5 Circles Right (Artistic Spread)',
    'rects': to_left(artistic_single_pages[2]['rects']) + to_right(artistic_single_pages[0]['rects'])
})
# 5-Circles Left + 5-Diamond Right = 10 Photos!
add_art(10, {
    'id': '10-art-5circles-5diamond',
    'name': '★ 5 Circles Left + Diamond Mosaic Right (Artistic Spread)',
    'rects': to_left(artistic_single_pages[0]['rects']) + to_right(artistic_single_pages[4]['rects'])
})
# Dual 5-Arch Dome = 10 Photos!
add_art(10, {
    'id': '10-art-dual-5arch',
    'name': '★ Dual Arch Dome & 4-Grid (10 Photos Artistic Spread)',
    'rects': to_left(artistic_single_pages[2]['rects']) + to_right(artistic_single_pages[2]['rects'])
})
# Dual 5-Diamond Mosaic = 10 Photos!
add_art(10, {
    'id': '10-art-dual-5diamond',
    'name': '★ Dual Diamond Rhombus Mosaic (10 Diamond Photos Spread)',
    'rects': to_left(artistic_single_pages[4]['rects']) + to_right(artistic_single_pages[4]['rects'])
})
# Dual 5-Editorial Slices = 10 Photos!
add_art(10, {
    'id': '10-art-dual-5editorial-slices',
    'name': '★ Dual 5-Editorial Slices (10 Photos Magazine Spread)',
    'rects': to_left(artistic_single_pages[11]['rects']) + to_right(artistic_single_pages[11]['rects'])
})
# Dual 2-Brush Stroke & Circle Accent = 4 Photos!
add_art(4, {
    'id': '4-art-dual-2brush-circle',
    'name': '★ Dual Brush Stroke & Circle Accents (4 Photos Artistic Spread)',
    'rects': to_left(artistic_single_pages[1]['rects']) + to_right(artistic_single_pages[1]['rects'])
})
# Dual 4-Watercolor Splash = 8 Photos!
add_art(8, {
    'id': '8-art-dual-4watercolor',
    'name': '★ Dual Watercolor Splash & Triptychs (8 Photos Artistic Spread)',
    'rects': to_left(artistic_single_pages[3]['rects']) + to_right(artistic_single_pages[3]['rects'])
})
# Dual 4-Curved Filmstrip = 8 Photos!
add_art(8, {
    'id': '8-art-dual-4curved-filmstrip',
    'name': '★ Dual Curved Wave Filmstrip Splatters (8 Photos Artistic Spread)',
    'rects': to_left(artistic_single_pages[5]['rects']) + to_right(artistic_single_pages[5]['rects'])
})
# Dual 4-Staggered Panels = 8 Photos!
add_art(8, {
    'id': '8-art-dual-4staggered',
    'name': '★ Dual 4-Staggered Layered Panels (8 Photos Spread)',
    'rects': to_left(artistic_single_pages[8]['rects']) + to_right(artistic_single_pages[8]['rects'])
})
# Dual 4-Hanging Frames = 8 Photos!
add_art(8, {
    'id': '8-art-dual-4hanging',
    'name': '★ Dual Suspended Hanging Squares (8 Photos Spread)',
    'rects': to_left(artistic_single_pages[9]['rects']) + to_right(artistic_single_pages[9]['rects'])
})
# Dual 4-Curved Corner Quads = 8 Photos!
add_art(8, {
    'id': '8-art-dual-4curved-quad',
    'name': '★ Dual Organic Curved Corner Quads (8 Photos Spread)',
    'rects': to_left(artistic_single_pages[13]['rects']) + to_right(artistic_single_pages[13]['rects'])
})
# Dual 4-Slanted Parallelograms = 8 Photos!
add_art(8, {
    'id': '8-art-dual-4parallelogram',
    'name': '★ Dual 4-Slanted Parallelograms (8 Photos Spread)',
    'rects': to_left(artistic_single_pages[14]['rects']) + to_right(artistic_single_pages[14]['rects'])
})
# Dual 3-Flared Triptychs = 6 Photos!
add_art(6, {
    'id': '6-art-dual-3flared-triptych',
    'name': '★ Dual 3-Flared Dynamic Triptychs (6 Photos Spread)',
    'rects': to_left(artistic_single_pages[10]['rects']) + to_right(artistic_single_pages[10]['rects'])
})
# Dual 3-D Perspective Triptychs = 6 Photos!
add_art(6, {
    'id': '6-art-dual-3perspective-triptych',
    'name': '★ Dual 3-D Perspective Triptychs (6 Photos Spread)',
    'rects': to_left(artistic_single_pages[15]['rects']) + to_right(artistic_single_pages[15]['rects'])
})
# 5-Circles Left + 2-Brush Right = 7 Photos!
add_art(7, {
    'id': '7-art-5circles-2brush',
    'name': '★ 5 Circles Left + Brush Stroke & Circle Right (Artistic Spread)',
    'rects': to_left(artistic_single_pages[0]['rects']) + to_right(artistic_single_pages[1]['rects'])
})
add_art(7, {
    'id': '7-art-2brush-5circles',
    'name': '★ Brush Stroke & Circle Left + 5 Circles Right (Artistic Spread)',
    'rects': to_left(artistic_single_pages[1]['rects']) + to_right(artistic_single_pages[0]['rects'])
})
# 5-Circles Left + 4-Watercolor Right = 9 Photos!
add_art(9, {
    'id': '9-art-5circles-4watercolor',
    'name': '★ 5 Circles Left + Watercolor Splash Right (Artistic Spread)',
    'rects': to_left(artistic_single_pages[0]['rects']) + to_right(artistic_single_pages[3]['rects'])
})
add_art(9, {
    'id': '9-art-4watercolor-5circles',
    'name': '★ Watercolor Splash Left + 5 Circles Right (Artistic Spread)',
    'rects': to_left(artistic_single_pages[3]['rects']) + to_right(artistic_single_pages[0]['rects'])
})
# Dual 1-Torn Paper = 2 Photos!
add_art(2, {
    'id': '2-art-dual-torn-paper',
    'name': '★ Dual Torn Paper Artistic Reveals (2 Photos Spread)',
    'rects': to_left(artistic_single_pages[6]['rects']) + to_right(artistic_single_pages[6]['rects'])
})
# Dual 1-Grunge Filmstrip = 2 Photos!
add_art(2, {
    'id': '2-art-dual-grunge-filmstrip',
    'name': '★ Dual Grunge Filmstrip Frames (2 Photos Spread)',
    'rects': to_left(artistic_single_pages[7]['rects']) + to_right(artistic_single_pages[7]['rects'])
})

print("Artistic templates summary:")
for c in sorted(artistic_templates_by_count.keys()):
    print(f"Count {c}: {len(artistic_templates_by_count[c])} artistic templates")

