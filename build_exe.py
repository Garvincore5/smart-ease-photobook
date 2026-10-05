"""
Build Script for Smart Ease Photobook Studio
Compiles the application into a single standalone Windows .exe using PyInstaller
"""

import os
import sys
import subprocess
import shutil

def build():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(root_dir)

    print("==================================================")
    print("Building Smart Ease Photobook Studio Single .EXE")
    print("==================================================")

    cmd = [
        sys.executable,
        "-m",
        "PyInstaller",
        "--noconfirm",
        "--onefile",
        "--windowed",
        "--name=SmartEasePhotobookStudio",
        "--icon=logo/app_icon.ico",
        "--clean",
        "--add-data=index.html;.",
        "--add-data=css;css",
        "--add-data=js;js",
        "--add-data=logo;logo",
        "--add-data=temps;temps",
        "--add-data=temps 2;temps 2",
        "--add-data=temps 3;temps 3",
        "--add-data=temp new;temp new",
        "app_main.py"
    ]

    print("Running PyInstaller command:")
    print(" ".join(cmd))
    print()

    result = subprocess.run(cmd)

    if result.returncode == 0:
        dist_exe = os.path.join(root_dir, "dist", "SmartEasePhotobookStudio.exe")
        target_exe = os.path.join(root_dir, "SmartEasePhotobookStudio.exe")
        if os.path.exists(dist_exe):
            shutil.copy2(dist_exe, target_exe)
            studio_exe = os.path.join(root_dir, "SmartEaseStudio.exe")
            shutil.copy2(dist_exe, studio_exe)
            print()
            print("==================================================")
            print("SUCCESS: Standalone executable created successfully!")
            print(f"Executable Location: {target_exe}")
            print(f"Studio Executable Location: {studio_exe}")
            print(f"File Size: {os.path.getsize(target_exe) / (1024 * 1024):.2f} MB")
            print("==================================================")
    else:
        print(f"ERROR: PyInstaller build failed with return code {result.returncode}")

if __name__ == '__main__':
    build()
