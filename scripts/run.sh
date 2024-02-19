#!/usr/bin/bash

# Source env variables if exist
if [ -f .env ]; then
    source .env
fi

# Run the app
npm start
