"""
Smart Ease Photobook Studio - Local HTTP Backend Server
Runs the lightweight offline local API server on http://127.0.0.1:8765
Supports Google Chrome, Microsoft Edge, and Desktop WebViews.
"""

import os
import sys
import json
import socket
from http.server import ThreadingHTTPServer

# Import custom handler from app_main
from app_main import CustomHTTPHandler, find_preferred_or_free_port

def run_server(port=8765):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(base_dir)

    active_port = find_preferred_or_free_port(port)
    server_address = ('127.0.0.1', active_port)
    httpd = ThreadingHTTPServer(server_address, CustomHTTPHandler)
    
    server_url = f"http://127.0.0.1:{active_port}"
    print(f"=======================================================")
    print(f"  Smart Ease Photobook Studio Backend Server Active    ")
    print(f"  URL: {server_url}/index.html                         ")
    print(f"  Serving directory: {base_dir}                        ")
    print(f"=======================================================")

    try:
        with open('server_port.json', 'w', encoding='utf-8') as f:
            json.dump({"port": active_port, "url": server_url}, f)
    except Exception:
        pass

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
    finally:
        httpd.server_close()

if __name__ == '__main__':
    port_arg = int(sys.argv[1]) if len(sys.argv) > 1 and sys.argv[1].isdigit() else 8765
    run_server(port_arg)
