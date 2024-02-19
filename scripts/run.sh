#!/usr/bin/bash

# Source env variables if exist
echo "Sourcing environment variables if exist"
if [ -f ..env ]; then
    echo ".env file found. Sourcing it."
    set -o allexport
    source .env
    set +o allexport
fi

# Run the app
npm start
