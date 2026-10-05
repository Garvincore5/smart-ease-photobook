"""
Smart Ease Photobook Studio - Setup Wizard & Installer
Ultra-reliable, non-blocking installer with direct COM shortcut creation and robust polling.
"""

import os
import sys
import shutil
import subprocess
import threading
import time
import json
import winreg
import webview
import win32com.client

APP_NAME = "Smart Ease Photobook Studio"
DEFAULT_INSTALL_DIR = os.path.join(os.environ.get("ProgramFiles", r"C:\Program Files"), "SmartEase Photobook Studio")
EXE_NAME = "SmartEasePhotobookStudio.exe"
UNINSTALL_EXE_NAME = "Uninstall_SmartEase_Photobook_Studio.exe"
ICON_NAME = "app_icon.ico"
REG_KEY_PATH = r"Software\Microsoft\Windows\CurrentVersion\Uninstall\SmartEasePhotobookStudio"

def get_bundle_dir():
    if hasattr(sys, '_MEIPASS'):
        return sys._MEIPASS
    return os.path.dirname(os.path.abspath(__file__))

def create_windows_shortcut(target_exe, shortcut_path, icon_path, description=APP_NAME):
    """Creates a Windows .lnk shortcut using native COM Dispatch."""
    try:
        shell = win32com.client.Dispatch("WScript.Shell")
        shortcut = shell.CreateShortCut(shortcut_path)
        shortcut.TargetPath = target_exe
        shortcut.WorkingDirectory = os.path.dirname(target_exe)
        shortcut.Description = description
        if icon_path and os.path.exists(icon_path):
            shortcut.IconLocation = f"{icon_path},0"
        shortcut.Save()
        return True
    except Exception as e:
        print(f"Error creating shortcut {shortcut_path}: {e}")
        return False

def get_desktop_dir():
    user_desktop = os.path.join(os.path.expanduser("~"), "Desktop")
    if os.path.exists(user_desktop):
        return user_desktop
    onedrive_desktop = os.path.join(os.path.expanduser("~"), "OneDrive", "Desktop")
    if os.path.exists(onedrive_desktop):
        return onedrive_desktop
    return user_desktop

def get_start_menu_dir():
    appdata = os.environ.get("APPDATA", os.path.expanduser("~"))
    return os.path.join(appdata, "Microsoft", "Windows", "Start Menu", "Programs", APP_NAME)

def register_windows_uninstall(install_dir, dest_exe, uninst_exe, icon_path):
    try:
        with winreg.CreateKey(winreg.HKEY_CURRENT_USER, REG_KEY_PATH) as key:
            winreg.SetValueEx(key, "DisplayName", 0, winreg.REG_SZ, APP_NAME)
            winreg.SetValueEx(key, "DisplayIcon", 0, winreg.REG_SZ, f"{icon_path},0" if os.path.exists(icon_path) else f"{dest_exe},0")
            winreg.SetValueEx(key, "DisplayVersion", 0, winreg.REG_SZ, "1.0.0")
            winreg.SetValueEx(key, "Publisher", 0, winreg.REG_SZ, "Smart Ease")
            winreg.SetValueEx(key, "InstallLocation", 0, winreg.REG_SZ, install_dir)
            winreg.SetValueEx(key, "UninstallString", 0, winreg.REG_SZ, f'"{uninst_exe}"')
            winreg.SetValueEx(key, "NoModify", 0, winreg.REG_DWORD, 1)
            winreg.SetValueEx(key, "NoRepair", 0, winreg.REG_DWORD, 1)
    except Exception as e:
        print(f"Registry registration error: {e}")

class InstallerApi:
    def __init__(self):
        self.window = None
        self.installed_exe = None
        self.progress = {
            "percent": 0,
            "status": "Ready to install.",
            "done": False,
            "error": None
        }

    def set_window(self, window):
        self.window = window

    def getDefaultDir(self):
        return DEFAULT_INSTALL_DIR

    def browseDirectory(self, current_dir):
        if not self.window:
            return current_dir
        result = self.window.create_file_dialog(
            webview.FOLDER_DIALOG,
            directory=current_dir or DEFAULT_INSTALL_DIR
        )
        if result and len(result) > 0:
            return result[0]
        return current_dir

    def getProgress(self):
        return self.progress

    def startInstall(self, config):
        install_dir = config.get("installDir", DEFAULT_INSTALL_DIR).strip()
        make_desktop = config.get("desktopShortcut", True)
        make_startmenu = config.get("startMenuShortcut", True)
        launch_after = config.get("launchAfter", True)

        self.progress = {
            "percent": 5,
            "status": "Preparing installation...",
            "done": False,
            "error": None
        }

        def worker():
            try:
                bundle_dir = get_bundle_dir()

                self.progress["percent"] = 15
                self.progress["status"] = f"Creating folder: {install_dir}"
                os.makedirs(install_dir, exist_ok=True)
                time.sleep(0.2)

                # Locate the embedded EXEs
                src_exe = os.path.join(bundle_dir, EXE_NAME)
                if not os.path.exists(src_exe):
                    src_exe = os.path.join(os.path.dirname(bundle_dir), EXE_NAME)

                dest_exe = os.path.join(install_dir, EXE_NAME)
                self.progress["percent"] = 35
                self.progress["status"] = "Installing Smart Ease Photobook Studio..."

                if os.path.exists(src_exe):
                    shutil.copy2(src_exe, dest_exe)
                else:
                    raise FileNotFoundError(f"Could not locate {EXE_NAME} in package.")

                time.sleep(0.2)
                self.progress["percent"] = 55
                self.progress["status"] = "Installing app icon and uninstaller..."

                # Copy icon
                src_icon = os.path.join(bundle_dir, "logo", ICON_NAME)
                if not os.path.exists(src_icon):
                    src_icon = os.path.join(bundle_dir, ICON_NAME)
                dest_icon = os.path.join(install_dir, ICON_NAME)
                if os.path.exists(src_icon):
                    shutil.copy2(src_icon, dest_icon)

                # Copy Uninstaller
                src_uninst = os.path.join(bundle_dir, UNINSTALL_EXE_NAME)
                if not os.path.exists(src_uninst):
                    src_uninst = os.path.join(os.path.dirname(bundle_dir), UNINSTALL_EXE_NAME)
                dest_uninst = os.path.join(install_dir, UNINSTALL_EXE_NAME)
                if os.path.exists(src_uninst):
                    shutil.copy2(src_uninst, dest_uninst)

                time.sleep(0.2)
                self.progress["percent"] = 75
                self.progress["status"] = "Creating desktop and Start Menu shortcuts..."

                # Create Desktop Shortcut
                if make_desktop:
                    desktop_dir = get_desktop_dir()
                    shortcut_path = os.path.join(desktop_dir, f"{APP_NAME}.lnk")
                    create_windows_shortcut(dest_exe, shortcut_path, dest_icon if os.path.exists(dest_icon) else dest_exe)

                # Create Start Menu Shortcut
                if make_startmenu:
                    sm_dir = get_start_menu_dir()
                    os.makedirs(sm_dir, exist_ok=True)
                    sm_shortcut = os.path.join(sm_dir, f"{APP_NAME}.lnk")
                    create_windows_shortcut(dest_exe, sm_shortcut, dest_icon if os.path.exists(dest_icon) else dest_exe)

                    if os.path.exists(dest_uninst):
                        sm_uninst_shortcut = os.path.join(sm_dir, f"Uninstall {APP_NAME}.lnk")
                        create_windows_shortcut(dest_uninst, sm_uninst_shortcut, dest_icon if os.path.exists(dest_icon) else dest_uninst, description=f"Uninstall {APP_NAME}")

                # Register in Windows
                register_windows_uninstall(install_dir, dest_exe, dest_uninst if os.path.exists(dest_uninst) else dest_exe, dest_icon)

                self.installed_exe = dest_exe
                self.progress["percent"] = 100
                self.progress["status"] = "Installation completed successfully!"
                self.progress["done"] = True

                if launch_after:
                    time.sleep(0.6)
                    subprocess.Popen([dest_exe], cwd=install_dir)
                    time.sleep(0.4)
                    if self.window:
                        self.window.destroy()

            except Exception as e:
                self.progress["error"] = str(e)
                self.progress["status"] = f"Error: {e}"

        threading.Thread(target=worker, daemon=True).start()
        return True

    def launchAndExit(self):
        if self.installed_exe and os.path.exists(self.installed_exe):
            subprocess.Popen([self.installed_exe], cwd=os.path.dirname(self.installed_exe))
        if self.window:
            self.window.destroy()

    def exitInstaller(self):
        if self.window:
            self.window.destroy()


HTML_CONTENT = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Smart Ease Photobook Studio Setup</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      overflow: hidden;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .header {
      background: linear-gradient(135deg, #1e293b, #0f172a);
      padding: 18px 24px;
      display: flex;
      align-items: center;
      gap: 16px;
      border-bottom: 1px solid #334155;
    }
    .header img {
      width: 54px;
      height: 54px;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      object-fit: cover;
    }
    .header-text h1 {
      font-size: 19px;
      font-weight: 700;
      letter-spacing: -0.3px;
      color: #ffffff;
    }
    .header-text p {
      font-size: 13px;
      color: #94a3b8;
      margin-top: 2px;
    }
    .content {
      flex: 1;
      padding: 24px 28px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .welcome-text {
      font-size: 13.5px;
      line-height: 1.5;
      color: #cbd5e1;
    }
    .section-title {
      font-size: 13px;
      font-weight: 600;
      color: #e2e8f0;
      margin-bottom: 6px;
    }
    .dir-input-group {
      display: flex;
      gap: 8px;
    }
    .dir-input {
      flex: 1;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 13px;
      color: #f8fafc;
      outline: none;
      transition: border-color 0.2s;
    }
    .dir-input:focus {
      border-color: #3b82f6;
    }
    .btn-secondary {
      background: #334155;
      color: #f8fafc;
      border: none;
      border-radius: 6px;
      padding: 8px 14px;
      font-size: 13px;
      cursor: pointer;
      font-weight: 500;
      transition: background 0.2s;
    }
    .btn-secondary:hover {
      background: #475569;
    }
    .options-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
      background: rgba(30, 41, 59, 0.5);
      border: 1px solid #1e293b;
      padding: 12px 14px;
      border-radius: 8px;
    }
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      color: #e2e8f0;
      cursor: pointer;
    }
    .checkbox-label input {
      accent-color: #2563eb;
      width: 16px;
      height: 16px;
      cursor: pointer;
    }
    .progress-container {
      margin-top: 4px;
    }
    .progress-label {
      font-size: 12.5px;
      color: #94a3b8;
      margin-bottom: 6px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .progress-bar-bg {
      width: 100%;
      height: 8px;
      background: #1e293b;
      border-radius: 999px;
      overflow: hidden;
    }
    .progress-bar-fill {
      height: 100%;
      width: 0%;
      background: linear-gradient(90deg, #3b82f6, #60a5fa);
      transition: width 0.25s ease;
    }
    .footer {
      background: #1e293b;
      border-top: 1px solid #334155;
      padding: 14px 24px;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
    .btn-primary {
      background: #2563eb;
      color: #ffffff;
      border: none;
      border-radius: 6px;
      padding: 8px 20px;
      font-size: 13.5px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 2px 8px rgba(37,99,235,0.4);
    }
    .btn-primary:hover {
      background: #1d4ed8;
    }
    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      box-shadow: none;
    }
    .btn-success {
      background: #16a34a !important;
      box-shadow: 0 2px 8px rgba(22,163,74,0.4) !important;
    }
  </style>
</head>
<body>

  <div class="header">
    <img id="logoImg" src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEBLAEsAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAGGA2cDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9U6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiikJxQAtFcB48+Pvw3+GKv/wlPjfQ9FlTrb3N8nnfhECXP4Cvnvxr/wAFSvg34cMkeirrvi6Zfutp9gYYSf8AfnKce4BrSNOctkZupCO7PsOkr8vfHX/BWzxhqSyReEPA+k6EhGFuNWuXvZB7hEEag/UtXm3hj/gph8btE8Sw6jquqad4i0wSAz6PJp8UCOmeVSRAGVsdCSR6g1usLUauYvE007H7GUVznw68dab8TfAmg+K9Idn0zWLOK9g3jDBXUHaw7EZwfcGujrlas7HSnfUKKKKQwooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKTNYnijxz4c8EWhuvEWv6ZoVsBnzdSu47dfzcimlfYTaW5uUV8zeN/wDgox8CvBnmRxeK5PEl0nHkaDaSXOT7SYEf/j9fP/jj/grtEPMi8G/DuaTn5LrXr5Y/xMUQbP8A32K1jRqS2RlKtCO7P0YqK6vILG3ee5njt4EGXklcKqj1JPSvxs8b/wDBR745eMvNjttfsfC1s/HlaHYIrAf9dJfMYfUEV4F4v8f+KfiBObjxR4l1jxFJnOdVv5J1H0VmIH4CumOEk/iZzyxUVsj9rfHX7ZnwW+HZkj1b4haPLcpnNrpspvpc+m2EOQfrivn3xt/wVo8CaYXj8K+ENd8QyDIE160dhCfcEl3x9UFfmP4Z8Lax4uu1svDujahrlyTgW+lWclw35Ipr3jwR/wAE/vjn43Ecg8Hf2BbO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iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP/9k=" alt="Logo" onerror="this.src='logo/app_icon.ico'">
    <div class="header-text">
      <h1>Smart Ease Photobook Studio</h1>
      <p>Setup Wizard &bull; Standalone Desktop Installation</p>
    </div>
  </div>

  <div class="content" id="mainContent">
    <p class="welcome-text">
      Welcome to the <strong>Smart Ease Photobook Studio</strong> setup wizard. This will install the complete application to your computer and configure desktop shortcuts.
    </p>

    <div>
      <div class="section-title">Installation Directory</div>
      <div class="dir-input-group">
        <input type="text" id="installDirInput" class="dir-input" value="C:\\Program Files\\SmartEase Photobook Studio">
        <button class="btn-secondary" onclick="browseFolder()">Browse...</button>
      </div>
    </div>

    <div class="options-group">
      <label class="checkbox-label">
        <input type="checkbox" id="cbDesktop" checked>
        <span>Create Desktop Shortcut (with Smart Ease App Logo)</span>
      </label>
      <label class="checkbox-label">
        <input type="checkbox" id="cbStartMenu" checked>
        <span>Add to Windows Start Menu Programs</span>
      </label>
      <label class="checkbox-label">
        <input type="checkbox" id="cbLaunch" checked>
        <span>Launch Smart Ease Photobook Studio when finished</span>
      </label>
    </div>

    <div class="progress-container" id="progBox" style="display: none;">
      <div class="progress-label" id="statusLabel">Installing...</div>
      <div class="progress-bar-bg">
        <div class="progress-bar-fill" id="progFill"></div>
      </div>
    </div>
  </div>

  <div class="footer">
    <button class="btn-secondary" id="btnCancel" onclick="cancelSetup()">Cancel</button>
    <button class="btn-primary" id="btnInstall" onclick="startInstall()">Install Now</button>
  </div>

  <script>
    var pollTimer = null;

    window.addEventListener('pywebviewready', function () {
      if (window.pywebview && window.pywebview.api) {
        window.pywebview.api.getDefaultDir().then(function(d) {
          if (d) document.getElementById('installDirInput').value = d;
        });
      }
    });

    function browseFolder() {
      var cur = document.getElementById('installDirInput').value;
      if (window.pywebview && window.pywebview.api) {
        window.pywebview.api.browseDirectory(cur).then(function(res) {
          if (res) document.getElementById('installDirInput').value = res;
        });
      }
    }

    function startInstall() {
      var dir = document.getElementById('installDirInput').value;
      var desk = document.getElementById('cbDesktop').checked;
      var sm = document.getElementById('cbStartMenu').checked;
      var launch = document.getElementById('cbLaunch').checked;

      document.getElementById('btnInstall').disabled = true;
      document.getElementById('btnInstall').innerText = "Installing...";
      document.getElementById('btnCancel').disabled = true;
      document.getElementById('progBox').style.display = "block";

      if (window.pywebview && window.pywebview.api) {
        window.pywebview.api.startInstall({
          installDir: dir,
          desktopShortcut: desk,
          startMenuShortcut: sm,
          launchAfter: launch
        }).then(function() {
          pollTimer = setInterval(checkProgress, 200);
        });
      }
    }

    function checkProgress() {
      if (!window.pywebview || !window.pywebview.api) return;
      window.pywebview.api.getProgress().then(function(p) {
        if (!p) return;
        document.getElementById('progFill').style.width = p.percent + '%';
        document.getElementById('statusLabel').innerText = p.status;

        if (p.error) {
          clearInterval(pollTimer);
          document.getElementById('btnInstall').disabled = false;
          document.getElementById('btnInstall').innerText = "Retry";
          document.getElementById('btnCancel').disabled = false;
          document.getElementById('statusLabel').style.color = "#f87171";
        } else if (p.done) {
          clearInterval(pollTimer);
          var btn = document.getElementById('btnInstall');
          btn.disabled = false;
          btn.innerText = "Finish & Launch";
          btn.classList.add('btn-success');
          btn.onclick = function() {
            window.pywebview.api.launchAndExit();
          };
          document.getElementById('statusLabel').style.color = "#4ade80";
        }
      });
    }

    function cancelSetup() {
      if (window.pywebview && window.pywebview.api) {
        window.pywebview.api.exitInstaller();
      }
    }
  </script>
</body>
</html>
"""

def main():
    bundle_dir = get_bundle_dir()
    os.chdir(bundle_dir)

    api = InstallerApi()
    window = webview.create_window(
        title=f"{APP_NAME} - Setup Wizard",
        html=HTML_CONTENT,
        js_api=api,
        width=620,
        height=480,
        resizable=False,
        background_color='#0f172a',
        confirm_close=False
    )
    api.set_window(window)

    webview.start(debug=False)

if __name__ == '__main__':
    main()
