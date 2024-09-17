#!/bin/bash

# Use $HOME environment variable instead of hardcoded path
LEDGER_PATH=".anchor/test-ledger"
RPC_PORT=8899
MAX_WAIT_TIME=60  # Maximum wait time in seconds

# Construct the path to the .so file using $HOME
PROGRAM_SO_PATH="$HOME/zk/cyklon/anchor/target/deploy/cyklon.so"

# Start the validator in the background
solana-test-validator \
  --ledger "$LEDGER_PATH" \
  --mint 4doTkL1geeiw3EHeoKgXx9EQ84DAV2fsx3GSdGiHJX8u \
  --bpf-program 5WrVRh6pUTvyrjrTn4GKGebsZn2GnqBK2h7agfn2QvBX "$PROGRAM_SO_PATH" \
  --bind-address 0.0.0.0 \
  --clone TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA \
  --rpc-port $RPC_PORT \
  --url https://api.mainnet-beta.solana.com \
  --reset \
  --quiet &

VALIDATOR_PID=$!

echo "Waiting for validator to start..."

# Wait for the RPC port to become available
start_time=$(date +%s)
while true; do
  if nc -z localhost $RPC_PORT; then
    echo "Validator is ready!"
    break
  fi

  current_time=$(date +%s)
  elapsed_time=$((current_time - start_time))
  
  if [ $elapsed_time -ge $MAX_WAIT_TIME ]; then
    echo "Timeout waiting for validator to start."
    kill $VALIDATOR_PID
    exit 1
  fi

  sleep 1
done

# Kill the validator process
kill $VALIDATOR_PID

echo "Ledger initialized at $LEDGER_PATH"
