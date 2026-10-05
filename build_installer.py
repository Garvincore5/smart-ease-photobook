"""
Build Script for Smart Ease Photobook Studio Installer
Compiles the installer wizard into a standalone Setup executable using PyInstaller
"""

import os
import sys
import subprocess
import shutil

def build_installer():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(root_dir)

    print("==================================================")
    print("Building Smart Ease Photobook Studio Setup Installer")
    print("==================================================")

    main_app_exe = os.path.join(root_dir, "SmartEasePhotobookStudio.exe")
    uninst_exe = os.path.join(root_dir, "Uninstall_SmartEase_Photobook_Studio.exe")
    if not os.path.exists(main_app_exe):
        print(f"ERROR: {main_app_exe} does not exist. Build the main app first.")
        return

    cmd = [
        sys.executable,
        "-m",
        "PyInstaller",
        "--noconfirm",
        "--onefile",
        "--windowed",
        "--uac-admin",
        "--name=SmartEase_Photobook_Studio_Setup",
        "--icon=logo/app_icon.ico",
        "--clean",
        f"--add-data={main_app_exe};.",
        f"--add-data={uninst_exe};.",
        "--add-data=logo;logo",
        "installer_wizard.py"
    ]

    print("Running PyInstaller Setup build command:")
    print(" ".join(cmd))
    print()

    result = subprocess.run(cmd)

    if result.returncode == 0:
        dist_setup = os.path.join(root_dir, "dist", "SmartEase_Photobook_Studio_Setup.exe")
        target_setup = os.path.join(root_dir, "SmartEase_Photobook_Studio_Setup.exe")
        if os.path.exists(dist_setup):
            shutil.copy2(dist_setup, target_setup)
            print()
            print("==================================================")
            print("SUCCESS: Installer Setup executable created successfully!")
            print(f"Setup Installer Location: {target_setup}")
            print(f"File Size: {os.path.getsize(target_setup) / (1024 * 1024):.2f} MB")
            print("==================================================")
    else:
        print(f"ERROR: Installer build failed with return code {result.returncode}")

if __name__ == '__main__':
    build_installer()
