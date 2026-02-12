import time
import sys

# Simple keep-alive script to prove the container is running
if __name__ == "__main__":
    print("Backend Service (Python 3.10) is starting...", file=sys.stderr)
    while True:
        print("Backend is alive and waiting for Phase 2...", file=sys.stderr)
        time.sleep(30)
