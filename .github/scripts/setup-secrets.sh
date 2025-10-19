#!/bin/bash

# GitHub Secrets Setup Script
# This script helps you set up required GitHub secrets for CI/CD

set -e

echo "=================================================="
echo "  GitHub Actions CI/CD Secrets Setup"
echo "=================================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI (gh) is not installed.${NC}"
    echo "Please install it from: https://cli.github.com/"
    echo ""
    echo "On macOS: brew install gh"
    echo "On Ubuntu: sudo apt install gh"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}You need to authenticate with GitHub first.${NC}"
    echo "Running: gh auth login"
    gh auth login
fi

echo -e "${GREEN}✓ GitHub CLI is authenticated${NC}"
echo ""

# Get repository info
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo "")

if [ -z "$REPO" ]; then
    echo -e "${RED}Error: Not in a GitHub repository or unable to detect repository.${NC}"
    echo "Please make sure you're in the repository directory."
    exit 1
fi

echo "Repository: $REPO"
echo ""

# Function to set secret
set_secret() {
    local secret_name=$1
    local secret_description=$2
    local is_multiline=${3:-false}

    echo "-----------------------------------"
    echo "Setting: $secret_name"
    echo "Description: $secret_description"
    echo ""

    if [ "$is_multiline" = true ]; then
        echo "Enter the value (Press Ctrl+D when done):"
        secret_value=$(cat)
    else
        echo -n "Enter the value: "
        read -s secret_value
        echo ""
    fi

    if [ -z "$secret_value" ]; then
        echo -e "${YELLOW}⚠ Skipped (empty value)${NC}"
        return
    fi

    echo "$secret_value" | gh secret set "$secret_name" --repo "$REPO"

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Successfully set $secret_name${NC}"
    else
        echo -e "${RED}✗ Failed to set $secret_name${NC}"
    fi
    echo ""
}

echo "=================================================="
echo "  Step 1: Docker Hub Credentials"
echo "=================================================="
echo ""

set_secret "DOCKER_USERNAME" "Your Docker Hub username"
set_secret "DOCKER_PASSWORD" "Your Docker Hub password or access token"

echo ""
echo "=================================================="
echo "  Step 2: Server Deployment Credentials"
echo "=================================================="
echo ""

set_secret "SERVER_HOST" "Production server IP or hostname (e.g., 192.168.1.100 or example.com)"
set_secret "SERVER_USER" "SSH username for server access (e.g., ubuntu, root)"

echo ""
echo "-----------------------------------"
echo "Setting: SSH_PRIVATE_KEY"
echo "Description: Private SSH key for authentication"
echo ""
echo "Options:"
echo "1) Paste the key content directly (recommended)"
echo "2) Load from a file"
echo ""
echo -n "Choose option (1 or 2): "
read option

if [ "$option" = "1" ]; then
    echo ""
    echo "Paste your SSH private key below and press Ctrl+D when done:"
    echo "(Usually found at ~/.ssh/id_rsa or ~/.ssh/id_ed25519)"
    echo ""
    ssh_key=$(cat)

    if [ -z "$ssh_key" ]; then
        echo -e "${YELLOW}⚠ Skipped SSH_PRIVATE_KEY (empty value)${NC}"
    else
        echo "$ssh_key" | gh secret set "SSH_PRIVATE_KEY" --repo "$REPO"
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Successfully set SSH_PRIVATE_KEY${NC}"
        else
            echo -e "${RED}✗ Failed to set SSH_PRIVATE_KEY${NC}"
        fi
    fi
elif [ "$option" = "2" ]; then
    echo -n "Enter the path to your SSH private key file: "
    read key_path

    if [ -f "$key_path" ]; then
        gh secret set "SSH_PRIVATE_KEY" --repo "$REPO" < "$key_path"
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Successfully set SSH_PRIVATE_KEY${NC}"
        else
            echo -e "${RED}✗ Failed to set SSH_PRIVATE_KEY${NC}"
        fi
    else
        echo -e "${RED}✗ File not found: $key_path${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Invalid option. Skipped SSH_PRIVATE_KEY${NC}"
fi

echo ""
echo "=================================================="
echo "  Setup Complete!"
echo "=================================================="
echo ""
echo "Next steps:"
echo "1. Update deployment paths in .github/workflows/deploy-services.yml"
echo "2. Ensure your server has Docker and docker-compose installed"
echo "3. Set up docker-compose.yml files on your server for each service"
echo "4. Test the workflow by pushing a change to a service"
echo ""
echo "View configured secrets:"
echo "  gh secret list --repo $REPO"
echo ""
echo "For more information, see: .github/workflows/DEPLOYMENT_GUIDE.md"
echo ""
