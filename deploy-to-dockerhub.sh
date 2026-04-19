#!/bin/bash

# ============================================
# WAREHOUSE WEB - Docker Hub Deployment
# ============================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

DOCKER_USERNAME="${DOCKER_USERNAME:-tuguldur}"
IMAGE_NAME="${IMAGE_NAME:-warehouse-web}"

echo -e "${BLUE}🐳 Warehouse Web - Docker Hub Deployment${NC}"
echo "============================================"
echo ""

if ! docker info | grep -q "Username"; then
    echo -e "${YELLOW}⚠️  Not logged in to Docker Hub${NC}"
    docker login
fi

echo -e "${GREEN}✅ Docker Hub login detected${NC}"
echo ""

echo -e "${YELLOW}Choose deployment option:${NC}"
echo "1) Build and push 'latest' tag"
echo "2) Build and push with version tag"
echo "3) Push both 'latest' and version tag"
read -p "Enter choice (1-3): " CHOICE

VERSION_TAG=""
if [ "$CHOICE" == "2" ] || [ "$CHOICE" == "3" ]; then
    read -p "Enter version tag (e.g., v1.0.0): " VERSION_TAG
    if [ -z "$VERSION_TAG" ]; then
        echo -e "${RED}❌ Version tag required!${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${YELLOW}🔨 Building Docker image...${NC}"
docker build -t ${DOCKER_USERNAME}/${IMAGE_NAME}:latest -f Dockerfile .

echo -e "${GREEN}✅ Build successful${NC}"

if [ -n "$VERSION_TAG" ]; then
    echo -e "${YELLOW}🏷️  Tagging as ${VERSION_TAG}...${NC}"
    docker tag ${DOCKER_USERNAME}/${IMAGE_NAME}:latest ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION_TAG}
fi

echo ""
echo -e "${YELLOW}📤 Pushing to Docker Hub...${NC}"

if [ "$CHOICE" == "1" ] || [ "$CHOICE" == "3" ]; then
    docker push ${DOCKER_USERNAME}/${IMAGE_NAME}:latest
    echo -e "${GREEN}✅ Pushed 'latest' successfully${NC}"
fi

if [ "$CHOICE" == "2" ] || [ "$CHOICE" == "3" ]; then
    docker push ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION_TAG}
    echo -e "${GREEN}✅ Pushed '${VERSION_TAG}' successfully${NC}"
fi

echo ""
echo -e "${GREEN}✨ Deployment complete${NC}"
echo -e "${BLUE}📦 Image:${NC} https://hub.docker.com/r/${DOCKER_USERNAME}/${IMAGE_NAME}"
