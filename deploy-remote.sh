#!/bin/bash
# Deploy to remote server: SSH in, pull latest, run deploy-server.sh

set -e

ssh payoffsolar "cd /opt/bitnami/projects/payoffsolar && git pull && ./deploy-server.sh"
