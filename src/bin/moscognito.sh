#!/bin/bash

# Start the MongoDB daemon, suppress logs
/usr/bin/mongod --dbpath /var/lib/mongodb/ &>/dev/null &

# Start the server, pass in arguments from caller
node /broker/bin/moscognito.js "$@"