#!/usr/bin/bash

# Source env variables if exist
echo "Sourcing environment variables if exist"
if [ -f ../.env ]; then
    echo ".env file found. Sourcing it."
    source ../.env
fi

# Run the app
npm start
