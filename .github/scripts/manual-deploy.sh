#!/bin/bash

# Deployment Helper Script
# Use this script to manually deploy a specific service to a specific environment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "=================================================="
echo "  Manual Deployment Helper"
echo "=================================================="
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI (gh) is not installed.${NC}"
    echo "Please install it from: https://cli.github.com/"
    exit 1
fi

# Service selection
echo "Select service to deploy:"
echo "1) user-service"
echo "2) notification-service"
echo "3) routing-service"
echo "4) traffic-service"
echo "5) web-service"
echo "6) kafka"
echo ""
echo -n "Enter option (1-6): "
read service_option

case $service_option in
    1) SERVICE="user-service"; SERVICE_PATH="user_service" ;;
    2) SERVICE="notification-service"; SERVICE_PATH="notification_service" ;;
    3) SERVICE="routing-service"; SERVICE_PATH="routing_service" ;;
    4) SERVICE="traffic-service"; SERVICE_PATH="traffic_service" ;;
    5) SERVICE="web-service"; SERVICE_PATH="web_service" ;;
    6) SERVICE="kafka"; SERVICE_PATH="kafka" ;;
    *) echo -e "${RED}Invalid option${NC}"; exit 1 ;;
esac

echo ""
echo "Selected: $SERVICE"
echo ""

# Environment selection
echo "Select environment:"
echo "1) Development"
echo "2) Staging"
echo "3) Production"
echo ""
echo -n "Enter option (1-3): "
read env_option

case $env_option in
    1) ENVIRONMENT="dev"; BRANCH="develop" ;;
    2) ENVIRONMENT="staging"; BRANCH="staging" ;;
    3) ENVIRONMENT="production"; BRANCH="main" ;;
    *) echo -e "${RED}Invalid option${NC}"; exit 1 ;;
esac

echo ""
echo "Selected environment: $ENVIRONMENT"
echo "Target branch: $BRANCH"
echo ""

# Confirmation
echo -e "${YELLOW}⚠ WARNING: This will trigger a deployment${NC}"
echo ""
echo "Service: $SERVICE"
echo "Environment: $ENVIRONMENT"
echo "Branch: $BRANCH"
echo ""
echo -n "Are you sure? (yes/no): "
read confirmation

if [ "$confirmation" != "yes" ]; then
    echo "Deployment cancelled."
    exit 0
fi

# Trigger workflow
echo ""
echo -e "${BLUE}Triggering deployment...${NC}"

# Check if there are changes in the service
cd "$SERVICE_PATH" 2>/dev/null || {
    echo -e "${RED}Error: Service directory not found${NC}"
    exit 1
}

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)

echo ""
echo "Current branch: $CURRENT_BRANCH"
echo "Target branch: $BRANCH"

if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
    echo ""
    echo -e "${YELLOW}Note: You are not on the target branch.${NC}"
    echo "Pushing to $BRANCH will trigger the deployment."
    echo ""
    echo -n "Continue? (yes/no): "
    read continue_confirm

    if [ "$continue_confirm" != "yes" ]; then
        echo "Deployment cancelled."
        exit 0
    fi
fi

# Create a deployment tag
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
TAG="deploy-${SERVICE}-${ENVIRONMENT}-${TIMESTAMP}"

echo ""
echo -e "${BLUE}Creating deployment tag: $TAG${NC}"

cd ..
git tag -a "$TAG" -m "Deploy $SERVICE to $ENVIRONMENT"
git push origin "$TAG"

echo ""
echo -e "${GREEN}✓ Deployment triggered!${NC}"
echo ""
echo "Monitor the deployment:"
echo "  gh workflow view"
echo "  gh run list --workflow=deploy-services.yml"
echo ""
echo "Or visit:"
echo "  https://github.com/$(gh repo view --json nameWithOwner -q .nameWithOwner)/actions"
echo ""
