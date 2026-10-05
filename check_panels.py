for label, path in [
    ("VERSION ZERO", r"E:\code\simon\version zero\photobook-smartalbums\index.html"),
    ("REFERENCE", r"E:\code\simon\photobook\photobook-smartalbums\index.html")
]:
    print("=" * 20, label, "=" * 20)
    with open(path, encoding="utf-8") as f:
        html = f.read()
    
    import re
    tags = re.findall(r'<([a-zA-Z0-9]+)\s+([^>]+)>', html)
    for tag, attrs in tags:
        if 'id=' in attrs and ('panel' in attrs.lower() or 'drawer' in attrs.lower() or tag == 'aside' or 'dock-popover' in attrs.lower()):
            id_m = re.search(r'id=["\']([^"\']+)["\']', attrs)
            class_m = re.search(r'class=["\']([^"\']+)["\']', attrs)
            id_val = id_m.group(1) if id_m else ''
            class_val = class_m.group(1) if class_m else ''
            if id_val or 'panel' in class_val or 'drawer' in class_val:
                print(f"<{tag} id='{id_val}' class='{class_val}'>")
