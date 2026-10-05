"""
Smart Ease Photobook Studio - Uninstaller Wizard
Ultra-reliable, non-blocking uninstaller with direct COM & registry cleanup.
"""

import os
import sys
import shutil
import subprocess
import threading
import time
import json
import base64
import winreg
import webview

APP_NAME = "Smart Ease Photobook Studio"
REG_KEY_PATH = r"Software\Microsoft\Windows\CurrentVersion\Uninstall\SmartEasePhotobookStudio"

def get_bundle_dir():
    if hasattr(sys, '_MEIPASS'):
        return sys._MEIPASS
    return os.path.dirname(os.path.abspath(__file__))

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

def get_install_dir():
    # If running from inside the install directory
    current_dir = os.path.dirname(os.path.abspath(sys.argv[0]))
    if os.path.exists(os.path.join(current_dir, "SmartEasePhotobookStudio.exe")):
        return current_dir
    
    # Try reading from registry
    try:
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, REG_KEY_PATH, 0, winreg.KEY_READ) as key:
            loc, _ = winreg.QueryValueEx(key, "InstallLocation")
            if loc and os.path.exists(loc):
                return loc
    except Exception:
        pass

    default_dir = os.path.join(os.environ.get("ProgramFiles", r"C:\Program Files"), "SmartEase Photobook Studio")
    return default_dir

def remove_registry_entry():
    try:
        winreg.DeleteKey(winreg.HKEY_CURRENT_USER, REG_KEY_PATH)
    except Exception:
        pass

HTML_CONTENT = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Uninstall Smart Ease Photobook Studio</title>
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
    .header-icon {
      font-size: 32px;
      line-height: 1;
    }
    .header-text h1 {
      font-size: 18px;
      font-weight: 700;
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
      gap: 16px;
    }
    .warning-box {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      padding: 14px 16px;
      border-radius: 8px;
      color: #fca5a5;
      font-size: 13px;
      line-height: 1.5;
    }
    .info-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: 13px;
      color: #cbd5e1;
      margin-top: 4px;
    }
    .info-list li {
      margin-left: 20px;
    }
    .progress-container {
      margin-top: auto;
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
      background: linear-gradient(90deg, #ef4444, #f87171);
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
    .btn-secondary {
      background: #334155;
      color: #f8fafc;
      border: none;
      border-radius: 6px;
      padding: 8px 16px;
      font-size: 13px;
      cursor: pointer;
      font-weight: 500;
      transition: background 0.2s;
    }
    .btn-secondary:hover {
      background: #475569;
    }
    .btn-danger {
      background: #dc2626;
      color: #ffffff;
      border: none;
      border-radius: 6px;
      padding: 8px 20px;
      font-size: 13.5px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 2px 8px rgba(220,38,38,0.4);
    }
    .btn-danger:hover {
      background: #b91c1c;
    }
    .btn-danger:disabled {
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
    <div class="header-icon">🗑️</div>
    <div class="header-text">
      <h1>Uninstall Smart Ease Photobook Studio</h1>
      <p>Remove application and shortcuts from this computer</p>
    </div>
  </div>

  <div class="content" id="mainContent">
    <div class="warning-box">
      <strong>Are you sure you want to completely uninstall Smart Ease Photobook Studio?</strong>
      <div style="margin-top: 4px;">This will remove the program files and shortcuts from your system. (Your saved project albums will not be deleted).</div>
    </div>

    <div class="info-list">
      <p><strong>This action will remove:</strong></p>
      <ul>
        <li>Application files from <span id="installPathLabel">C:\\Program Files\\SmartEase Photobook Studio</span></li>
        <li>Desktop shortcut (Smart Ease Photobook Studio.lnk)</li>
        <li>Start Menu program shortcuts</li>
        <li>Windows registry uninstall entry</li>
      </ul>
    </div>

    <div class="progress-container" id="progBox" style="display: none;">
      <div class="progress-label" id="statusLabel">Uninstalling...</div>
      <div class="progress-bar-bg">
        <div class="progress-bar-fill" id="progFill"></div>
      </div>
    </div>
  </div>

  <div class="footer">
    <button class="btn-secondary" id="btnCancel" onclick="cancelUninstall()">Cancel</button>
    <button class="btn-danger" id="btnUninstall" onclick="startUninstall()">Uninstall</button>
  </div>

  <script>
    var pollTimer = null;

    window.addEventListener('pywebviewready', function () {
      if (window.pywebview && window.pywebview.api) {
        window.pywebview.api.getInstallPath().then(function(p) {
          if (p) document.getElementById('installPathLabel').innerText = p;
        });
      }
    });

    function startUninstall() {
      document.getElementById('btnUninstall').disabled = true;
      document.getElementById('btnUninstall').innerText = "Uninstalling...";
      document.getElementById('btnCancel').disabled = true;
      document.getElementById('progBox').style.display = "block";

      if (window.pywebview && window.pywebview.api) {
        window.pywebview.api.startUninstall().then(function() {
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
          document.getElementById('btnUninstall').disabled = false;
          document.getElementById('btnUninstall').innerText = "Retry";
          document.getElementById('btnCancel').disabled = false;
          document.getElementById('statusLabel').style.color = "#f87171";
        } else if (p.done) {
          clearInterval(pollTimer);
          var btn = document.getElementById('btnUninstall');
          btn.disabled = false;
          btn.innerText = "Close";
          btn.classList.remove('btn-danger');
          btn.classList.add('btn-success');
          btn.onclick = function() {
            window.pywebview.api.finishAndExit();
          };
          document.getElementById('statusLabel').style.color = "#4ade80";
        }
      });
    }

    function cancelUninstall() {
      if (window.pywebview && window.pywebview.api) {
        window.pywebview.api.exitUninstaller();
      }
    }
  </script>
</body>
</html>
"""

class UninstallerApi:
    def __init__(self):
        self.window = None
        self.install_dir = get_install_dir()
        self.progress = {
            "percent": 0,
            "status": "Ready to uninstall.",
            "done": False,
            "error": None
        }

    def set_window(self, window):
        self.window = window

    def getInstallPath(self):
        return self.install_dir

    def getProgress(self):
        return self.progress

    def startUninstall(self):
        self.progress = {
            "percent": 10,
            "status": "Closing running application instances...",
            "done": False,
            "error": None
        }

        def worker():
            try:
                # 1. Close any running instances of the app
                subprocess.run(
                    ["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command",
                     "Get-Process | Where-Object { $_.Path -like '*SmartEase*' } | Stop-Process -Force -ErrorAction SilentlyContinue"],
                    creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
                )
                time.sleep(0.3)

                # 2. Delete Desktop Shortcut
                self.progress["percent"] = 35
                self.progress["status"] = "Removing Desktop shortcut..."
                desktop_shortcut = os.path.join(get_desktop_dir(), f"{APP_NAME}.lnk")
                if os.path.exists(desktop_shortcut):
                    try:
                        os.remove(desktop_shortcut)
                    except Exception:
                        pass
                time.sleep(0.2)

                # 3. Delete Start Menu shortcuts
                self.progress["percent"] = 60
                self.progress["status"] = "Removing Start Menu shortcuts..."
                sm_dir = get_start_menu_dir()
                if os.path.exists(sm_dir):
                    try:
                        shutil.rmtree(sm_dir, ignore_errors=True)
                    except Exception:
                        pass
                time.sleep(0.2)

                # 4. Remove Registry entries
                self.progress["percent"] = 80
                self.progress["status"] = "Cleaning Windows registry..."
                remove_registry_entry()
                time.sleep(0.2)

                # 5. Delete program files in install dir except uninstaller itself
                self.progress["percent"] = 95
                self.progress["status"] = "Removing application files..."
                if os.path.exists(self.install_dir):
                    current_exe = os.path.abspath(sys.argv[0])
                    for item in os.listdir(self.install_dir):
                        item_path = os.path.join(self.install_dir, item)
                        if os.path.abspath(item_path) != current_exe:
                            try:
                                if os.path.isdir(item_path):
                                    shutil.rmtree(item_path, ignore_errors=True)
                                else:
                                    os.remove(item_path)
                            except Exception:
                                pass

                self.progress["percent"] = 100
                self.progress["status"] = "Smart Ease Photobook Studio was successfully uninstalled."
                self.progress["done"] = True

            except Exception as e:
                self.progress["error"] = str(e)
                self.progress["status"] = f"Error: {e}"

        threading.Thread(target=worker, daemon=True).start()
        return True

    def finishAndExit(self):
        target_dir = self.install_dir
        cmd = f'cmd.exe /c timeout /t 2 /nobreak > NUL & rmdir /s /q "{target_dir}"'
        subprocess.Popen(cmd, shell=True, creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0)
        if self.window:
            self.window.destroy()

    def exitUninstaller(self):
        if self.window:
            self.window.destroy()

def main():
    api = UninstallerApi()
    window = webview.create_window(
        title=f"{APP_NAME} - Uninstaller",
        html=HTML_CONTENT,
        js_api=api,
        width=580,
        height=420,
        resizable=False,
        background_color='#0f172a',
        confirm_close=False
    )
    api.set_window(window)
    webview.start(debug=False)

if __name__ == '__main__':
    main()
