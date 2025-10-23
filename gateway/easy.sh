#!/bin/bash
set -e

echo "Starting initialization..."

echo "Create proxy docker network..."
docker network create proxy || echo "Proxy network already exists"

# Setup env file
echo "Writing timezone to .env file..."
echo "TZ=Asia/Ho_Chi_Minh" > .env
echo ".env file created with timezone Asia/Ho_Chi_Minh"

# Setup grafana permissions
echo "Setting Grafana permissions..."
chmod 472 grafana
echo "Grafana directory permissions updated"

# Setup telegraf Docker socket group
echo "Detecting Docker socket GID..."
SOCKET_GID=$(stat -c '%g' /var/run/docker.sock)
echo "Docker socket GID detected: $SOCKET_GID"
echo "Updating docker-compose.yml with socket GID..."
sed -i "s/{docker_socket_gid}/$SOCKET_GID/" docker-compose.yml
echo "Docker socket GID injected into docker-compose.yml"

# Ask user for API domains
echo "Please enter your domains:"
read -rp "API Gateway domain: " API_GATEWAY_DOMAIN
read -rp "Grafana domain: " API_GRAFANA_DOMAIN

# Replace placeholders in docker-compose.yml
echo "Updating docker-compose.yml with domains..."
sed -i "s|{API_GATEWAY_DOMAIN}|$API_GATEWAY_DOMAIN|g" docker-compose.yml
sed -i "s|{API_GRAFANA_DOMAIN}|$API_GRAFANA_DOMAIN|g" docker-compose.yml
echo "Domains injected into docker-compose.yml"

# Setup SSH port
echo "Please enter your SSH port:"
read -rp "SSH Port: " SSH_PORT

echo "Updating ufw_allow_ssh.sh with SSH port..."
sed -i "s|{SSH_PORT}|$SSH_PORT|g" ufw_allow_ssh.sh
echo "SSH port injected into ufw_allow_ssh.sh"

# Run ufw_allow_ssh.sh
echo "Applying firewall rules..."
bash ufw_allow_ssh.sh
echo "Firewall updated with SSH port $SSH_PORT"

# Run ufw_allow.sh
echo "Running ufw_allow.sh..."
bash ufw_allow.sh
echo "ufw_allow.sh executed successfully"

# Ensure UFW is enabled
echo "Checking UFW status..."
if ! ufw status | grep -q "Status: active"; then
  echo "Enabling UFW..."
  yes | ufw enable
  echo "UFW enabled"
else
  echo "UFW already enabled"
fi

# Run ufw_docker_install.sh
echo "Running ufw_docker_install.sh..."
bash ufw_docker_install.sh
echo "ufw_docker_install.sh executed successfully"

# Restart UFW to apply changes
echo "Restarting UFW to apply changes..."
systemctl restart ufw
echo "UFW restarted successfully"
