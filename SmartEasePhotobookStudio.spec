# -*- mode: python ; coding: utf-8 -*-


a = Analysis(
    ['app_main.py'],
    pathex=[],
    binaries=[],
    datas=[('index.html', '.'), ('css', 'css'), ('js', 'js'), ('logo', 'logo'), ('temps', 'temps'), ('temps 2', 'temps 2'), ('temps 3', 'temps 3'), ('temp new', 'temp new')],
    hiddenimports=[],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='SmartEasePhotobookStudio',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=['logo/app_icon.ico'],
)
