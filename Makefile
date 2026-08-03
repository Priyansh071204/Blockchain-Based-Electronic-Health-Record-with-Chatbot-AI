# ── EHR Blockchain System – Makefile ──────────────────────────────────────────
.PHONY: help install dev-backend dev-frontend dev fabric-up fabric-down \
        chaincode-deploy clean logs test

SHELL := /bin/bash
BACKEND_DIR  := ./backend
FRONTEND_DIR := ./frontend

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
	  awk 'BEGIN{FS=":.*?## "}; {printf "\033[36m%-22s\033[0m %s\n", $$1, $$2}'

# ── Installation ───────────────────────────────────────────────────────────────
install: ## Install all dependencies
	@echo "📦 Installing backend dependencies..."
	cd $(BACKEND_DIR) && npm install
	@echo "📦 Installing frontend dependencies..."
	cd $(FRONTEND_DIR) && npm install
	@echo "📦 Installing chaincode dependencies..."
	cd ./chaincode && npm install
	@echo "✅ All dependencies installed"

# ── Development ───────────────────────────────────────────────────────────────
dev: ## Start backend + frontend in configured mode (defaults to Real)
	@echo "🚀 Starting EHR in Real Mode..."
	@make dev-backend & make dev-frontend

dev-mock: ## Start backend + frontend in MOCK mode (no Fabric needed)
	@echo "🚀 Starting EHR in MOCK mode..."
	export MOCK_FABRIC=true && make dev-backend & make dev-frontend

dev-backend: ## Start backend only
	@make kill-backend
	cd $(BACKEND_DIR) && npm run dev

kill-backend: ## Kill any process running on backend port 4000
	@echo "🔍 Checking for stale backend processes on :4000..."
	@lsof -t -i :4000 | xargs kill -9 2>/dev/null || true

dev-frontend: ## Start frontend only
	cd $(FRONTEND_DIR) && npm run dev

# ── IPFS Only ─────────────────────────────────────────────────────────────────
ipfs-up: ## Start IPFS node via Docker
	docker-compose up -d ipfs
	@echo "🗂  IPFS running at http://localhost:5001"
	@echo "🌐 IPFS Gateway: http://localhost:8080/ipfs"

ipfs-down: ## Stop IPFS node
	docker-compose stop ipfs

# ── One-Command Automatic Deployment ──────────────────────────────────────────
deploy: ## Deploy full production stack (Fabric + IPFS + Backend + Frontend)
	./deploy.sh real

deploy-mock: ## Deploy lightweight stack in mock mode (IPFS + Backend + Frontend)
	./deploy.sh mock

# ── Full Docker Stack (no Fabric) ─────────────────────────────────────────────
docker-up: ## Start backend + frontend + IPFS via Docker
	docker-compose up --build -d
	@echo "🏥 EHR Stack running:"
	@echo "   Frontend  → http://localhost:3000"
	@echo "   Backend   → http://localhost:4000"
	@echo "   IPFS API  → http://localhost:5001"

docker-down: ## Stop Docker stack
	docker-compose down

docker-logs: ## View Docker logs
	docker-compose logs -f

# ── Hyperledger Fabric ─────────────────────────────────────────────────────────
fabric-up: ## Start Hyperledger Fabric network
	docker-compose -f docker-compose.fabric.yml up -d
	@echo "⏳ Waiting for Fabric network to start..."
	@sleep 10
	@echo "⛓  Fabric network running"
	@echo "   CouchDB → http://localhost:5984/_utils"

fabric-down: ## Stop Fabric network and clear state
	docker-compose -f docker-compose.fabric.yml down -v --remove-orphans
	@rm -rf ./fabric-network/crypto-config
	@rm -rf ./fabric-network/channel-artifacts
	@rm -rf ./fabric-network/couchdb
	@echo "🧹 Fabric state cleared"

fabric-generate: ## Generate crypto + channel artifacts
	cd fabric-network && \
	  cryptogen generate --config=./configtx/crypto-config.yaml --output=./crypto-config && \
	  mkdir -p channel-artifacts && \
	  configtxgen -profile TwoOrgsOrdererGenesis -channelID system-channel \
	    -outputBlock ./channel-artifacts/genesis.block \
	    -configPath ./configtx && \
	  configtxgen -profile TwoOrgsChannel -outputCreateChannelTx \
	    ./channel-artifacts/mychannel.tx \
	    -channelID mychannel \
	    -configPath ./configtx
	@echo "✅ Crypto + channel artifacts generated"

chaincode-deploy: ## Deploy chaincode to running Fabric network
	@echo "🔗 Deploying EHR chaincode..."
	docker exec cli bash /opt/gopath/src/github.com/hyperledger/fabric/peer/scripts/bootstrap.sh all
	@echo "✅ Chaincode deployed"

# ── Testing ────────────────────────────────────────────────────────────────────
test-backend: ## Run backend tests
	cd $(BACKEND_DIR) && npm test

test-chaincode: ## Run chaincode tests
	cd ./chaincode && npm test

test-api: ## Quick API smoke test (requires backend running)
	@echo "🔍 Testing API endpoints..."
	@curl -sf http://localhost:4000/health | python3 -m json.tool || echo "Backend not running"
	@curl -sf -X POST http://localhost:4000/api/auth/login \
	  -H "Content-Type: application/json" \
	  -d '{"email":"admin@ehr.local","password":"Admin@123"}' | python3 -m json.tool

# ── Cleanup ────────────────────────────────────────────────────────────────────
clean: ## Clean all build artifacts and node_modules
	@echo "🧹 Cleaning..."
	rm -rf $(BACKEND_DIR)/node_modules $(BACKEND_DIR)/logs $(BACKEND_DIR)/wallet $(BACKEND_DIR)/uploads
	rm -rf $(FRONTEND_DIR)/node_modules $(FRONTEND_DIR)/build
	rm -rf ./chaincode/node_modules
	@echo "✅ Cleaned"

clean-docker: ## Remove all Docker containers/volumes for this project
	docker-compose down -v --remove-orphans
	docker-compose -f docker-compose.fabric.yml down -v --remove-orphans

logs-backend: ## Follow backend logs
	cd $(BACKEND_DIR) && tail -f logs/app.log

status: ## Show status of all services
	@echo "=== Docker Services ==="
	@docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "Docker not running"
	@echo ""
	@echo "=== Port Check ==="
	@lsof -i :3000 2>/dev/null | grep LISTEN | head -1 && echo "✅ :3000 Frontend" || echo "❌ :3000 Frontend (not running)"
	@lsof -i :4000 2>/dev/null | grep LISTEN | head -1 && echo "✅ :4000 Backend"  || echo "❌ :4000 Backend (not running)"
	@lsof -i :5001 2>/dev/null | grep LISTEN | head -1 && echo "✅ :5001 IPFS"     || echo "❌ :5001 IPFS (not running)"
	@lsof -i :7051 2>/dev/null | grep LISTEN | head -1 && echo "✅ :7051 Fabric"   || echo "❌ :7051 Fabric (not running)"
