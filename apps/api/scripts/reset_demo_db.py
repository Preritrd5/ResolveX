"""
ResolveX Demo Database Reset CLI
Usage: python -m apps.api.scripts.reset_demo_db [--seed=42]
Resets the Acme Commerce dataset deterministically to the clean demonstration baseline.
"""

import sys
import argparse
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from data.seed.generate_demo_data import generate_all_data
from data.seed.generate_sql_seed import generate_sql

def reset_demo(seed: int = 42):
    print(f"[*] Resetting ResolveX demo environment with seed={seed}...")
    generate_all_data()
    generate_sql()
    print("[+] Reset complete. Fixture JSON and Supabase seed.sql refreshed.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Reset ResolveX Demo Data")
    parser.add_argument("--seed", type=int, default=42, help="Fixed random seed (default: 42)")
    args = parser.parse_args()
    reset_demo(args.seed)
