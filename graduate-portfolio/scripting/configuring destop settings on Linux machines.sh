#!/bin/bash

# Automated Linux Setup Script
# Tested on Ubuntu/Debian-based systems

# Exit on error
set -e

# Function for logging
log() {
    echo "[INFO] $1"
}

# Update and upgrade system
log "Updating system..."
sudo apt update && sudo apt upgrade -y


# Configure firewall
log "Configuring firewall..."
sudo apt install -y ufw
sudo ufw enable
sudo ufw allow ssh

# Add useful aliases to .bashrc
log "Adding custom aliases..."
echo "alias ll='ls -la'" >> ~/.bashrc
echo "alias update='sudo apt update && sudo apt upgrade -y'" >> ~/.bashrc
source ~/.bashrc

# Display system info
log "Setup complete! Displaying system info..."
neofetch