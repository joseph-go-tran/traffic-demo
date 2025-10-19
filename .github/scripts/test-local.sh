#!/bin/bash

# Local CI/CD Test Script
# This script helps you test Docker builds locally before pushing to GitHub

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "=================================================="
echo "  Local CI/CD Test Script"
echo "=================================================="
echo ""
echo "Repository root: $REPO_ROOT"
echo ""

# Function to test build
test_build() {
    local service_name=$1
    local service_path=$2
    local has_tests=$3

    echo ""
    echo -e "${BLUE}=================================================="
    echo "  Testing: $service_name"
    echo -e "==================================================${NC}"
    echo ""

    cd "$REPO_ROOT/$service_path"

    # Check if Dockerfile exists
    if [ ! -f "Dockerfile" ]; then
        echo -e "${YELLOW}⚠ No Dockerfile found for $service_name${NC}"
        echo -e "${YELLOW}  Skipping Docker build test${NC}"
        return
    fi

    # Build Docker image
    echo -e "${BLUE}Building Docker image...${NC}"
    if docker build -t "test/$service_name:local" .; then
        echo -e "${GREEN}✓ Docker build successful${NC}"
    else
        echo -e "${RED}✗ Docker build failed${NC}"
        return 1
    fi

    # Run tests if available
    if [ "$has_tests" = true ]; then
        echo ""
        echo -e "${BLUE}Running tests...${NC}"

        case $service_name in
            user-service|routing-service|traffic-service)
                if [ -f "requirements.txt" ]; then
                    python3 -m pip install -q -r requirements.txt
                    if [ -d "tests" ]; then
                        python3 -m pytest tests/ -v
                        if [ $? -eq 0 ]; then
                            echo -e "${GREEN}✓ Tests passed${NC}"
                        else
                            echo -e "${RED}✗ Tests failed${NC}"
                            return 1
                        fi
                    fi
                fi
                ;;
            notification-service|web-service)
                if [ -f "package.json" ]; then
                    npm install --silent
                    if npm test 2>/dev/null; then
                        echo -e "${GREEN}✓ Tests passed${NC}"
                    else
                        echo -e "${YELLOW}⚠ No tests or tests failed${NC}"
                    fi
                fi
                ;;
        esac
    fi

    echo -e "${GREEN}✓ $service_name build test completed successfully${NC}"
}

# Function to check for changes
check_changes() {
    local service_path=$1

    if [ -n "$(git status --porcelain "$REPO_ROOT/$service_path" 2>/dev/null)" ]; then
        return 0  # Has changes
    else
        return 1  # No changes
    fi
}

# Main menu
echo "Select test mode:"
echo "1) Test all services"
echo "2) Test only services with changes"
echo "3) Test specific service"
echo "4) Quick validation (build only, no tests)"
echo ""
echo -n "Enter option (1-4): "
read option

case $option in
    1)
        echo ""
        echo "Testing all services..."
        test_build "user-service" "user_service" true
        test_build "notification-service" "notification_service" true
        test_build "routing-service" "routing_service" true
        test_build "traffic-service" "traffic_service" true
        test_build "web-service" "web_service" true
        ;;
    2)
        echo ""
        echo "Checking for changes..."
        cd "$REPO_ROOT"

        if check_changes "user_service"; then
            echo -e "${YELLOW}→ Changes detected in user_service${NC}"
            test_build "user-service" "user_service" true
        fi

        if check_changes "notification_service"; then
            echo -e "${YELLOW}→ Changes detected in notification_service${NC}"
            test_build "notification-service" "notification_service" true
        fi

        if check_changes "routing_service"; then
            echo -e "${YELLOW}→ Changes detected in routing_service${NC}"
            test_build "routing-service" "routing_service" true
        fi

        if check_changes "traffic_service"; then
            echo -e "${YELLOW}→ Changes detected in traffic_service${NC}"
            test_build "traffic-service" "traffic_service" true
        fi

        if check_changes "web_service"; then
            echo -e "${YELLOW}→ Changes detected in web_service${NC}"
            test_build "web-service" "web_service" true
        fi
        ;;
    3)
        echo ""
        echo "Available services:"
        echo "1) user-service"
        echo "2) notification-service"
        echo "3) routing-service"
        echo "4) traffic-service"
        echo "5) web-service"
        echo ""
        echo -n "Select service (1-5): "
        read service_option

        case $service_option in
            1) test_build "user-service" "user_service" true ;;
            2) test_build "notification-service" "notification_service" true ;;
            3) test_build "routing-service" "routing_service" true ;;
            4) test_build "traffic-service" "traffic_service" true ;;
            5) test_build "web-service" "web_service" true ;;
            *) echo -e "${RED}Invalid option${NC}" ;;
        esac
        ;;
    4)
        echo ""
        echo "Quick validation (build only)..."
        test_build "user-service" "user_service" false
        test_build "notification-service" "notification_service" false
        test_build "routing-service" "routing_service" false
        test_build "traffic-service" "traffic_service" false
        test_build "web-service" "web_service" false
        ;;
    *)
        echo -e "${RED}Invalid option${NC}"
        exit 1
        ;;
esac

echo ""
echo "=================================================="
echo "  Test Summary"
echo "=================================================="
echo ""
echo "Docker images created:"
docker images | grep "test/" || echo "No test images found"
echo ""
echo "To clean up test images:"
echo "  docker rmi \$(docker images -q 'test/*')"
echo ""
echo -e "${GREEN}Testing complete!${NC}"
echo ""
