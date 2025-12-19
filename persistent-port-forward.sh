#!/bin/bash
# Persistent port-forward script with auto-restart
# This monitors the port-forward and automatically restarts it if it dies

echo "Starting persistent port-forward for API service..."
echo "This will automatically restart if the connection drops."
echo "Press Ctrl+C to stop."

# Function to start port-forward
start_port_forward() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting kubectl port-forward..."
    kubectl port-forward -n l4h svc/api 8765:8080
    EXIT_CODE=$?
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Port-forward exited with code $EXIT_CODE"
}

# Infinite loop to restart on failure
while true; do
    start_port_forward
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Restarting in 2 seconds..."
    sleep 2
done
