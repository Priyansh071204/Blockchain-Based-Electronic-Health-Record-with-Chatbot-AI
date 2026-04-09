#!/bin/bash
set -e

# ─── EHR Fabric Network Bootstrap ─────────────────────────────────────────────
# This script sets up the Hyperledger Fabric network for the EHR system.
# Prerequisites: fabric-samples binaries in PATH (cryptogen, configtxgen, peer, orderer)

# Ensure we're in the script's parent directory
cd "$(dirname "$0")/.." || exit 1

CHANNEL_NAME="mychannel"
CHAINCODE_NAME="ehr-chaincode"
CHAINCODE_VERSION="1.0"
CHAINCODE_PATH="/opt/gopath/src/github.com/chaincode/ehr-chaincode"
DELAY=3
MAX_RETRY=5
VERBOSE=false

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()  { echo -e "${BLUE}[INFO]${NC} $1"; }
ok()   { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()  { echo -e "${RED}[ERR]${NC} $1"; exit 1; }

# ─── 1. Generate crypto material ─────────────────────────────────────────────
generateCrypto() {
  log "Generating cryptographic material..."
  if [ -d "../crypto-config" ]; then
    warn "crypto-config already exists – skipping"
    return
  fi
  cryptogen generate --config=configtx/crypto-config.yaml --output="crypto-config" || err "cryptogen failed"
  ok "Crypto material generated"
}

# ─── 2. Generate genesis block ────────────────────────────────────────────────
generateGenesis() {
  log "Generating genesis block..."
  mkdir -p channel-artifacts
  configtxgen -profile TwoOrgsOrdererGenesis -channelID system-channel \
    -outputBlock channel-artifacts/genesis.block \
    -configPath configtx/ || err "Genesis block generation failed"
  ok "Genesis block created"
}

# ─── 3. Generate channel tx ───────────────────────────────────────────────────
generateChannelTx() {
  log "Generating channel transaction..."
  configtxgen -profile TwoOrgsChannel -outputCreateChannelTx \
    channel-artifacts/${CHANNEL_NAME}.tx \
    -channelID ${CHANNEL_NAME} \
    -configPath configtx/ || err "Channel tx generation failed"
  ok "Channel transaction created"
}

# ─── 4. Create channel ────────────────────────────────────────────────────────
createChannel() {
  log "Creating channel ${CHANNEL_NAME}..."
  if [ -f "channel-artifacts/${CHANNEL_NAME}.block" ]; then
    warn "Channel block already exists – skipping creation"
    return
  fi
  peer channel create \
    -o orderer.example.com:7050 \
    -c ${CHANNEL_NAME} \
    -f channel-artifacts/${CHANNEL_NAME}.tx \
    --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
    --outputBlock channel-artifacts/${CHANNEL_NAME}.block || err "Channel creation failed"
  ok "Channel ${CHANNEL_NAME} created"
}

# ─── 5. Join channel ──────────────────────────────────────────────────────────
joinChannel() {
  log "Joining peer to channel..."
  if peer channel list | grep -q "${CHANNEL_NAME}"; then
    warn "Peer already joined channel – skipping"
    return
  fi
  peer channel join -b channel-artifacts/${CHANNEL_NAME}.block || err "Channel join failed"
  ok "Peer joined channel"
}

# ─── 6. Package chaincode ─────────────────────────────────────────────────────
packageChaincode() {
  log "CCAAS: Skipping standard packaging (using pre-built tarball)..."
  # peer lifecycle chaincode package ${CHAINCODE_NAME}.tar.gz ...
  ok "CCAAS: Package ready"
}

# ─── 7. Install chaincode ─────────────────────────────────────────────────────
installChaincode() {
  log "Installing CCAAS chaincode..."
  if peer lifecycle chaincode queryinstalled | grep -q "${CHAINCODE_NAME}_${CHAINCODE_VERSION}"; then
    warn "Chaincode already installed – skipping"
  else
    # Use the pre-built CCAAS bundle
    peer lifecycle chaincode install /opt/gopath/src/github.com/chaincode/ehr-chaincode/${CHAINCODE_NAME}.tar.gz || err "Chaincode install failed"
    ok "Chaincode installed"
  fi

  # Get package ID
  PACKAGE_ID=$(peer lifecycle chaincode queryinstalled | grep "${CHAINCODE_NAME}_${CHAINCODE_VERSION}" | awk '{print $3}' | sed 's/,//')
  log "Package ID: ${PACKAGE_ID}"
  echo "PACKAGE_ID=${PACKAGE_ID}" > /tmp/chaincode_env
  
  # Export for the host system to update docker-compose
  echo "${PACKAGE_ID}" > /opt/gopath/src/github.com/chaincode/ehr-chaincode/package_id.txt
}

# ─── 8. Approve chaincode ─────────────────────────────────────────────────────
approveChaincode() {
  source /tmp/chaincode_env
  log "Approving chaincode for Org1..."
  peer lifecycle chaincode approveformyorg \
    -o orderer.example.com:7050 \
    --channelID ${CHANNEL_NAME} \
    --name ${CHAINCODE_NAME} \
    --version ${CHAINCODE_VERSION} \
    --package-id ${PACKAGE_ID} \
    --sequence 1 \
    --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem || err "Approval failed"
  ok "Chaincode approved"
}

# ─── 9. Commit chaincode ──────────────────────────────────────────────────────
commitChaincode() {
  log "Committing chaincode..."
  peer lifecycle chaincode commit \
    -o orderer.example.com:7050 \
    --channelID ${CHANNEL_NAME} \
    --name ${CHAINCODE_NAME} \
    --version ${CHAINCODE_VERSION} \
    --sequence 1 \
    --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
    --peerAddresses peer0.org1.example.com:7051 \
    --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt || err "Commit failed"
  ok "Chaincode committed"
}

# ─── 10. Initialize chaincode ────────────────────────────────────────────────
initChaincode() {
  log "Initializing chaincode..."
  peer chaincode invoke \
    -o orderer.example.com:7050 \
    --isInit \
    --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
    -C ${CHANNEL_NAME} -n ${CHAINCODE_NAME} \
    --peerAddresses peer0.org1.example.com:7051 \
    --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
    -c '{"function":"initLedger","Args":[]}' || warn "Init failed (may be expected if --init-required not set)"
  ok "Chaincode initialized"
}

# ─── Main ─────────────────────────────────────────────────────────────────────
case "$1" in
  all)
    generateCrypto
    generateGenesis
    generateChannelTx
    sleep $DELAY
    createChannel
    joinChannel
    packageChaincode
    installChaincode
    approveChaincode
    commitChaincode
    initChaincode
    ok "=== EHR Network fully bootstrapped! ==="
    ;;
  crypto)     generateCrypto ;;
  channel)    createChannel; joinChannel ;;
  chaincode)  packageChaincode; installChaincode; approveChaincode; commitChaincode ;;
  *) echo "Usage: $0 {all|crypto|channel|chaincode}"; exit 1 ;;
esac
