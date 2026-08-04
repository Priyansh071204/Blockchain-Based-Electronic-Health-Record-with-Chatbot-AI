# 🏥 EHR Chain — Blockchain Based Electronic Health Record System

A **production-grade**, patient-centric Electronic Health Record (EHR) system built with smart contracts in **Solidity (`EHRContract.sol`)** and **Hyperledger Fabric v2.x (`ehrContract.js`)**, with IPFS off-chain storage, JWT authentication, AI-powered Patient Report Chatbot, and a modern **React (Vite + TypeScript)** dashboard.

---

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                   React + TypeScript Frontend                   │
│  Patient Portal │ Doctor Console │ Admin Panel │ Report Chatbot │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS / REST
┌────────────────────────────▼────────────────────────────────────┐
│                   Node.js + Express Backend                     │
│ JWT Auth │ Rate Limiting │ File Upload │ Web3 / Fabric SDK │ AI   │
└──────┬──────────────────────┬────────────────────────┬──────────┘
       │ Web3 / Fabric SDK    │ HTTP                   │ OpenAI API / Local Fallback
┌──────▼──────────────────┐ ┌─▼──────────────────────┐ ┌▼─────────────────────────┐
│ Blockchain Smart        │ │      IPFS Node       │ │ AI Report Chatbot       │
│ Contracts               │ │ (off-chain storage)  │ │ Service                 │
│ ┌─────────────────────┐ │ └──────────────────────┘ └─────────────────────────┘
│ │ EHRContract.sol     │ │
│ │ ehrContract.js      │ │
│ └─────────────────────┘ │
│ State DB / EVM Ledger   │
└─────────────────────────┘
```

---

## 🗂 Project Structure

```
MEDCHAIN_EHR/
├── chaincode/                    # Smart Contracts / Chaincode
│   ├── index.js                  # Fabric entry point
│   ├── package.json
│   ├── lib/
│   │   └── ehrContract.js        # Fabric Node.js contract
│   └── solidity/
│       └── EHRContract.sol       # Solidity smart contract (EVM / Ethereum)
│
├── backend/                      # Express REST API
│   ├── src/
│   │   ├── server.js             # App entry point & middleware setup
│   │   ├── config/
│   │   │   ├── fabric.js         # Fabric SDK + mock mode adapter
│   │   │   ├── logger.js         # Winston logger configuration
│   │   │   └── connection-profile.json  # Fabric connection profile
│   │   ├── middleware/
│   │   │   ├── auth.js           # JWT authentication & role guards
│   │   │   ├── upload.js         # Multer file upload handling
│   │   │   └── errorHandler.js   # Global error handling middleware
│   │   ├── routes/
│   │   │   ├── admin.js          # /api/admin/*
│   │   │   ├── auth.js           # /api/auth/*
│   │   │   ├── chat.js           # /api/chat/* (AI Chatbot)
│   │   │   ├── doctors.js        # /api/doctors/*
│   │   │   ├── fabric.js         # /api/fabric/* (Network status)
│   │   │   ├── notifications.js  # /api/notifications/*
│   │   │   ├── patients.js       # /api/patients/*
│   │   │   ├── prescriptions.js  # /api/prescriptions/*
│   │   │   └── records.js        # /api/records/*
│   │   └── services/
│   │       ├── authService.js    # User management & JWT token handling
│   │       ├── ipfsService.js    # IPFS file upload & retrieval
│   │       ├── notificationService.js # System notification processing
│   │       └── reportChatService.js   # AI Report Chatbot engine
│   ├── .env                      # Environment configuration
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                     # React Application (Vite + TypeScript)
│   ├── src/
│   │   ├── App.tsx               # Main Router + Auth Provider
│   │   ├── index.css             # Glassmorphism Design System
│   │   ├── main.tsx              # React DOM entry point
│   │   ├── test-setup.ts         # Vitest setup file
│   │   ├── context/
│   │   │   └── AuthContext.tsx   # React Auth State & Hooks
│   │   ├── hooks/
│   │   │   └── useEHR.ts         # EHR API custom hooks
│   │   ├── components/
│   │   │   ├── CryptographicMonitor.tsx # Real-time Blockchain Audit Monitor
│   │   │   ├── Layout.tsx        # Responsive App Shell (Sidebar, TopBar)
│   │   │   ├── Medical3DBackground.tsx # Canvas 3D background animation
│   │   │   ├── PageTransition.tsx# Smooth route transitions
│   │   │   ├── ProtectedRoute.tsx# Dynamic route-level access guards
│   │   │   └── TechGridBackground.tsx # Tech grid visual overlay
│   │   └── pages/
│   │       ├── AdminDashboard.tsx# Admin system statistics & user management
│   │       ├── DoctorDashboard.tsx # Doctor clinical dashboard
│   │       ├── DoctorRecords.tsx # Doctor record management console
│   │       ├── HealthVitals.tsx  # Patient vitals tracking & history
│   │       ├── Login.tsx         # User authentication page
│   │       ├── MedicalRecords.tsx# Patient medical records viewer
│   │       ├── NewRecord.tsx     # Health record creation form with file upload
│   │       ├── PatientDashboard.tsx # Patient overview portal
│   │       ├── Profile.tsx       # User profile settings & access control
│   │       ├── Register.tsx      # User registration form
│   │       └── ReportChatbot.tsx # AI Health Report & General Assistant Chatbot
│   ├── index.html                # HTML entrypoint
│   ├── vite.config.ts            # Vite & Vitest configuration
│   └── package.json
│
├── fabric-network/               # Hyperledger Fabric Network Specs
│   ├── configtx/
│   │   ├── configtx.yaml         # Channel & genesis block config
│   │   └── crypto-config.yaml    # Organization & peer cryptographic spec
│   └── scripts/
│       └── bootstrap.sh          # Network bootstrapping & chaincode deployment
│
├── e2e/                          # End-to-End Testing (Playwright)
│   └── auth.spec.ts              # E2E authentication & workflow tests
│
├── docker-compose.yml            # Application stack (backend + frontend + IPFS)
├── docker-compose.fabric.yml     # Fabric network (orderer + peer + CouchDB + CA)
├── deploy.sh                     # One-command deployment script
├── Makefile                      # Developer command shortcuts
├── package.json                  # Root monorepo workspace scripts
└── README.md
```

---

## ⚡ Quick Start (Development & Production)

The system supports both **Real Fabric Blockchain Mode** and **In-Memory Mock Mode**.

### 1. Install Workspace Dependencies
From the root directory:
```bash
npm run install:all
# Or using Makefile:
make install
```

### 2. Start Infrastructure (Docker)
Start the IPFS node for decentralized file storage and Hyperledger Fabric:
```bash
make ipfs-up     # Start IPFS Node
make fabric-up   # Start Fabric Orderer, Peer, CA, CouchDB
```

### 3. Start Backend API
```bash
cd backend
npm run dev
```

### 4. Start React Frontend (Vite)
```bash
cd frontend
npm run dev
```
Access the web dashboard at `http://localhost:3000`.

### 5. Start in Mock Mode (No Fabric Installation Needed)
If you don't have Hyperledger Fabric installed locally, run in **Mock Mode**:
```bash
make dev-mock
# Or using deploy script:
./deploy.sh mock
```

---

## 🐳 Docker Compose (Full Stack)

Run backend, frontend, and IPFS in containerized mode:

```bash
# Build and launch all services
docker-compose up --build -d

# View live logs
docker-compose logs -f

# Stop container stack
docker-compose down
```

### Stack Port Matrix

| Service | Port / URL | Description |
|---------|------------|-------------|
| **Frontend** | http://localhost:3000 | React Vite Web Application |
| **Backend API** | http://localhost:4000 | Express REST API |
| **IPFS API** | http://localhost:5001 | IPFS RPC / API endpoint |
| **IPFS Gateway** | http://localhost:8080/ipfs | Public IPFS Content Gateway |
| **CouchDB State DB** | http://localhost:5984/_utils | Fabric State Database Console |

---

## ⛓ Hyperledger Fabric Setup

### Prerequisites
- Docker & Docker Compose
- Hyperledger Fabric binaries v2.4 (`cryptogen`, `configtxgen`, `peer`, `orderer`)
  ```bash
  curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.4.7 1.5.5
  export PATH=$PATH:$PWD/fabric-samples/bin
  ```

### Step-by-Step Network Deployment

1. **Generate Cryptographic Material & Channel Artifacts**:
   ```bash
   make fabric-generate
   ```

2. **Launch Fabric Network Containers**:
   ```bash
   make fabric-up
   ```

3. **Deploy EHR Chaincode**:
   ```bash
   make chaincode-deploy
   ```

4. **Update Connection Profile**:
   Update `backend/src/config/connection-profile.json` with generated peer TLS certificates from `fabric-network/crypto-config/`.

---

## 🔗 API Reference

### Authentication — `/api/auth`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Account registration | Public |
| POST | `/api/auth/login` | Authenticate user & get JWT tokens | Public |
| POST | `/api/auth/refresh` | Refresh access token using refresh token | Public |
| GET | `/api/auth/me` | Fetch currently authenticated user profile | Required |
| POST | `/api/auth/logout` | Revoke session & logout | Required |

### Patients — `/api/patients`

| Method | Endpoint | Description | Permitted Roles |
|--------|----------|-------------|-----------------|
| POST | `/api/patients/register` | Register new patient profile | Admin, Patient |
| GET | `/api/patients/:id` | Get patient profile details | Admin, Patient, Doctor |
| POST | `/api/patients/:id/access/grant` | Grant doctor access to medical records | Admin, Patient (own) |
| POST | `/api/patients/:id/access/revoke` | Revoke doctor access | Admin, Patient (own) |
| GET | `/api/patients/:id/records` | Get patient health records | Admin, Patient (own), Doctor (authorized) |
| GET | `/api/patients/:id/prescriptions` | Get patient prescriptions | Admin, Patient (own), Doctor (authorized) |
| GET | `/api/patients/:id/audit` | Retrieve complete audit trail | Admin, Patient (own) |
| GET | `/api/patients/my/audit` | Self-audit trail retrieval | Patient |

### Doctors — `/api/doctors`

| Method | Endpoint | Description | Permitted Roles |
|--------|----------|-------------|-----------------|
| POST | `/api/doctors/register` | Register doctor credentials | Admin |
| GET | `/api/doctors/:id` | Retrieve doctor details | Public / Authenticated |
| PATCH | `/api/doctors/:id/verify` | Verify doctor credentials | Admin |
| GET | `/api/doctors/my/patients` | Retrieve list of assigned patients | Doctor |

### Health Records — `/api/records`

| Method | Endpoint | Description | Permitted Roles |
|--------|----------|-------------|-----------------|
| POST | `/api/records` | Create new health record (with optional IPFS upload) | Doctor (authorized) |
| GET | `/api/records/:id` | Retrieve record by ID | Admin, Patient (own), Doctor (authorized) |
| GET | `/api/records/:id/history` | Retrieve full immutability history of record | Authenticated |

### Prescriptions — `/api/prescriptions`

| Method | Endpoint | Description | Permitted Roles |
|--------|----------|-------------|-----------------|
| POST | `/api/prescriptions` | Issue new digital prescription | Doctor (authorized) |
| GET | `/api/prescriptions/:id` | Get prescription details | Admin, Patient, Doctor, Pharmacist |
| PATCH | `/api/prescriptions/:id/dispense` | Mark prescription as dispensed | Pharmacist, Admin |

### AI Report Chatbot — `/api/chat`

| Method | Endpoint | Description | Permitted Roles |
|--------|----------|-------------|-----------------|
| POST | `/api/chat/message` | Query AI Chatbot with optional report upload | Authenticated |
| DELETE | `/api/chat/clear` | Clear active conversation history | Authenticated |

### Notifications & System — `/api/notifications` & `/api/fabric`

| Method | Endpoint | Description | Permitted Roles |
|--------|----------|-------------|-----------------|
| GET | `/api/notifications` | Get user notifications | Authenticated |
| GET | `/api/fabric/status` | Get blockchain network status | Authenticated |
| GET | `/health` | API Health check endpoint | Public |

---

## 👥 Role-Based Access Control (RBAC)

Strict multi-layered RBAC is enforced across the React frontend, Node.js API middleware, and on-chain smart contracts.

### Permissions Matrix

| Operation / Resource | Admin | Patient | Doctor | Pharmacist |
|----------------------|:-----:|:-------:|:------:|:----------:|
| Register Patient Profile | ✅ | ✅ (self) | ❌ | ❌ |
| Register Doctor Credentials | ✅ | ❌ | ❌ | ❌ |
| Verify Doctor Credentials | ✅ | ❌ | ❌ | ❌ |
| Grant / Revoke Access | ✅ | ✅ (own) | ❌ | ❌ |
| Create Health Record | ❌ | ❌ | ✅ (authorized) | ❌ |
| View Health Record & History | ✅ | ✅ (own) | ✅ (authorized) | ❌ |
| Issue Digital Prescription | ❌ | ❌ | ✅ (authorized) | ❌ |
| Dispense Prescription | ✅ | ❌ | ❌ | ✅ |
| Access Audit Trail | ✅ | ✅ (own) | ✅ (authorized) | ❌ |

---

## 📦 Smart Contract Architecture

The system provides dual smart contract implementations:

1. **Solidity Smart Contract (`chaincode/solidity/EHRContract.sol`)**:
   - Written in Solidity `^0.8.20` targeting EVM/Ethereum networks.
   - Enforces RBAC with custom modifiers (`onlyAdmin`, `onlyDoctor`, `onlyPatient`), custom errors (`Unauthorized`, `NotFound`, `AccessDenied`), on-chain audit trail logging, and dynamic doctor access verification via `_checkDoctorAccess`.

2. **Hyperledger Fabric Chaincode (`chaincode/lib/ehrContract.js`)**:
   - Written in Node.js using `fabric-contract-api`.
   - Uses CouchDB for rich state queries and immutable ledger history tracking.

---

## 🤖 Patient Report Chatbot

The integrated AI assistant allows users to ask health questions with or without medical reports:

- **General Mode:** Query general health advice, system features, privacy controls, or prescription details without file uploads.
- **Report Analysis Mode:** Upload medical report documents (`.pdf`, `.docx`, `.txt`) for instant parsing, key insights extraction, and context-aware Q&A.
- **Hybrid Intelligence:** Supports real-time generative responses via **OpenAI API** (`OPENAI_API_KEY`) with automatic fallback to local semantic rule-based matching if offline.

---

## 🏗 Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment mode (`development` / `production`) |
| `PORT` | `4000` | Express REST API server port |
| `MOCK_FABRIC` | `true` | Enable mock in-memory ledger mode |
| `JWT_SECRET` | *(required)* | Secret key for signing access tokens |
| `JWT_REFRESH_SECRET` | *(required)* | Secret key for signing refresh tokens |
| `JWT_EXPIRES_IN` | `24h` | Access token expiration period |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token expiration period |
| `IPFS_PROTOCOL` | `http` | IPFS node protocol |
| `IPFS_HOST` | `localhost` | IPFS API hostname |
| `IPFS_PORT` | `5001` | IPFS API port |
| `FABRIC_CHANNEL_NAME` | `mychannel` | Fabric channel name |
| `FABRIC_CHAINCODE_NAME` | `ehr-chaincode` | Fabric chaincode ID |
| `OPENAI_MODEL` | `gpt-4.1-mini` | OpenAI LLM model for chatbot |
| `OPENAI_API_KEY` | *(optional)* | OpenAI API key for live AI answers |

---

## 🧪 Testing Suite

The repository features comprehensive automated testing across backend, frontend, and end-to-end user journeys.

```bash
# Run backend unit & integration tests
npm run test:backend

# Run frontend Vitest suite
npm run test:frontend

# Run Playwright End-to-End browser tests
npm run test:e2e

# Run all test suites sequentially
npm run test:all
```

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more details.
