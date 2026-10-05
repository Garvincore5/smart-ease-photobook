"""
Build Script for Smart Ease Photobook Studio Uninstaller
Compiles the uninstaller wizard into a standalone executable using PyInstaller
"""

import os
import sys
import subprocess
import shutil

def build_uninstaller():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(root_dir)

    print("==================================================")
    print("Building Smart Ease Photobook Studio Uninstaller")
    print("==================================================")

    pyinstaller_exe = os.path.join(root_dir, "..", "python_env", "Scripts", "pyinstaller.exe")
    if not os.path.exists(pyinstaller_exe):
        pyinstaller_exe = "pyinstaller"

    cmd = [
        pyinstaller_exe,
        "--onefile",
        "--windowed",
        "--uac-admin",
        "--name=Uninstall_SmartEase_Photobook_Studio",
        "--icon=logo/app_icon.ico",
        "--clean",
        "uninstaller_wizard.py"
    ]

    print("Running PyInstaller Uninstaller build command:")
    print(" ".join(cmd))
    print()

    result = subprocess.run(cmd)

    if result.returncode == 0:
        dist_uninst = os.path.join(root_dir, "dist", "Uninstall_SmartEase_Photobook_Studio.exe")
        target_uninst = os.path.join(root_dir, "Uninstall_SmartEase_Photobook_Studio.exe")
        if os.path.exists(dist_uninst):
            shutil.copy2(dist_uninst, target_uninst)
            print()
            print("==================================================")
            print("SUCCESS: Uninstaller executable created successfully!")
            print(f"Uninstaller Location: {target_uninst}")
            print(f"File Size: {os.path.getsize(target_uninst) / (1024 * 1024):.2f} MB")
            print("==================================================")
    else:
        print(f"ERROR: Uninstaller build failed with return code {result.returncode}")

if __name__ == '__main__':
    build_uninstaller()
