#!/usr/bin/env bash
set -e

# ─── Colors ───────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

MODE="${1:-real}"

echo -e "${CYAN}====================================================${NC}"
echo -e "${CYAN}🚀 EHR Blockchain System - Automatic Deployment     ${NC}"
echo -e "${CYAN}====================================================${NC}"
echo -e "Deployment Mode: ${YELLOW}${MODE}${NC}\n"

# ─── 1. Prerequisite Check ───────────────────────────────────────────────────
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}❌ Error: Docker is not running. Please start Docker Desktop first.${NC}"
    exit 1
fi

# ─── 2. Execution Flow ────────────────────────────────────────────────────────
if [ "$MODE" = "real" ] || [ "$MODE" = "fabric" ]; then
    echo -e "${CYAN}[1/4] Checking Fabric Crypto & Channel Artifacts...${NC}"
    if [ ! -d "./fabric-network/crypto-config" ]; then
        if command -v cryptogen &> /dev/null; then
            make fabric-generate
        else
            echo -e "${YELLOW}⚠️ cryptogen binary not found locally; continuing with pre-built / containerized network setup.${NC}"
        fi
    else
        echo -e "${GREEN}✓ Crypto material already generated.${NC}"
    fi

    echo -e "${CYAN}[2/4] Starting Hyperledger Fabric Network & Storage...${NC}"
    docker-compose -f docker-compose.fabric.yml up -d
    echo -e "${GREEN}⏳ Waiting 10s for Fabric network nodes to stabilize...${NC}"
    sleep 10

    echo -e "${CYAN}[3/4] Deploying Smart Contract (Node.js Chaincode)...${NC}"
    docker exec cli bash /opt/gopath/src/github.com/hyperledger/fabric/peer/scripts/bootstrap.sh all || true

    echo -e "${CYAN}[4/4] Building & Launching EHR App Stack (IPFS + Backend + Frontend)...${NC}"
    docker-compose up --build -d
else
    echo -e "${CYAN}[1/1] Building & Launching EHR System in Mock Mode...${NC}"
    MOCK_FABRIC=true docker-compose up --build -d
fi

# ─── 3. Final Summary ─────────────────────────────────────────────────────────
echo -e "\n${GREEN}====================================================${NC}"
echo -e "${GREEN}🎉 EHR System Deployed & Running!                    ${NC}"
echo -e "${GREEN}====================================================${NC}"
echo -e "💻 Frontend App      : ${CYAN}http://localhost:3000${NC}"
echo -e "🔌 Backend REST API  : ${CYAN}http://localhost:4000/api${NC}"
echo -e "📦 IPFS Storage API  : ${CYAN}http://localhost:5001${NC}"
echo -e "🌐 IPFS Gateway      : ${CYAN}http://localhost:8080/ipfs${NC}"
if [ "$MODE" = "real" ]; then
    echo -e "🗄  CouchDB State DB  : ${CYAN}http://localhost:5984/_utils${NC}"
fi
echo -e "${GREEN}====================================================${NC}\n"
