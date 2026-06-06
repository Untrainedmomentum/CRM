#!/usr/bin/env python3
"""
Untrained Momentum CRM - Deploy Script
Writes all final CRM files directly to G:\\My Drive\\GitHub\\CRM\\
Run: python deploy_final.py
"""

import os
import shutil
import sys

REPO = r"G:\My Drive\GitHub\CRM"
SRC  = os.path.dirname(os.path.abspath(__file__))

FILES = [
    "index.html",
    "dashboard.html",
    "clients.html",
    "client.html",
    "john.html",
    "tickets.html",
    "portal.html",
    "shared.js",
    "style.css",
]

def main():
    if not os.path.exists(REPO):
        print(f"ERROR: Repo not found at {REPO}")
        sys.exit(1)

    print(f"Deploying to {REPO}...\n")
    ok = 0
    for f in FILES:
        src = os.path.join(SRC, f)
        dst = os.path.join(REPO, f)
        if not os.path.exists(src):
            print(f"  SKIP  {f}  (not found in source)")
            continue
        shutil.copy2(src, dst)
        print(f"  OK    {f}")
        ok += 1

    print(f"\nDone — {ok}/{len(FILES)} files deployed.")
    print("Now commit and push in GitHub Desktop.")

if __name__ == "__main__":
    main()
