#!/bin/bash

# Ensure /opt/homebrew/bin is in PATH for Homebrew-installed node/npm
export PATH="/opt/homebrew/bin:$PATH"

# Load environment variables from .env file if it exists
if [ -f .env ]; then
    echo "Loading environment variables from .env..."
    export $(grep -v '^#' .env | xargs)
fi

echo "Select how you want to start the AI Gateway:"
echo "1) Start Node.js Development Server (npm run dev:node)"
echo "2) Start Cloudflare Workers Development Server (npm run dev:workerd)"
echo "3) Start Production Node.js Server (after 'npm run build')"
echo "Enter your choice (1, 2, or 3): "

read choice

case $choice in
    1)
        echo "Starting AI Gateway in Node.js development mode..."
        /opt/homebrew/bin/npm run dev:node --loglevel verbose
        ;;
    2)
        echo "Starting AI Gateway in Cloudflare Workers development mode..."
        /opt/homebrew/bin/npm run dev:workerd
        ;;
    3)
        echo "Starting AI Gateway in Production Node.js mode (ensure you've run 'npm run build')..."
        /opt/homebrew/bin/npm run start:node
        ;;
    *)
        echo "Invalid choice. Please run the script again and select 1, 2, or 3."
        ;;
esac
