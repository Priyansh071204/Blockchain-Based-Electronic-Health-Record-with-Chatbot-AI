# 🏥 EHR Chain — Blockchain Based Electronic Health Record System

A **production-grade**, patient-centric Electronic Health Record (EHR) system built with smart contracts in **Solidity (`EHRContract.sol`)** and **Hyperledger Fabric v2.x (`ehrContract.js`)**, with IPFS off-chain storage, JWT authentication, and a modern **React (Vite + TypeScript)** dashboard.

---

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                   React + TypeScript Frontend                   │
│          Patient Portal │ Doctor Clinical Console │ Admin Panel      │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS / REST
┌────────────────────────────▼────────────────────────────────────┐
│                   Node.js + Express Backend                     │
│    JWT Auth │ Rate Limiting │ File Upload │ Web3 / Fabric SDK   │
└──────┬──────────────────────────────────────┬───────────────────┘
       │ Web3 / Fabric SDK                    │ HTTP
┌──────▼──────────────────────────┐  ┌────────▼──────────────────┐
│     Blockchain Smart Contracts  │  │         IPFS Node           │
│  ┌───────────────────────────┐  │  │   (off-chain doc storage)   │
│  │ EHR Contract (Solidity)   │  │  └─────────────────────────────┘
│  │ EHR Chaincode (Node.js)   │  │
│  └───────────────────────────┘  │
│  State DB / EVM Ledger          │
└─────────────────────────────────┘
```


---

## 🗂 Project Structure

```
ehr-blockchain/
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
│   │   ├── server.js             # App entry point
│   │   ├── config/
│   │   │   ├── fabric.js         # Fabric SDK + mock mode
│   │   │   ├── logger.js         # Winston logger
│   │   │   └── connection-profile.json  # Fabric connection profile
│   │   ├── middleware/
│   │   │   ├── auth.js           # JWT middleware + role guards
│   │   │   ├── upload.js         # Multer file upload
│   │   │   └── errorHandler.js   # Global error handler
│   │   ├── routes/
│   │   │   ├── auth.js           # /api/auth/*
│   │   │   ├── patients.js       # /api/patients/*
│   │   │   ├── doctors.js        # /api/doctors/*
│   │   │   ├── records.js        # /api/records/*
│   │   │   ├── prescriptions.js  # /api/prescriptions/*
│   │   │   └── admin.js          # /api/admin/*
│   │   └── services/
│   │       ├── authService.js    # User management + JWT
│   │       └── ipfsService.js    # IPFS upload/retrieve
│   ├── .env                      # Environment config
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                     # React Application (Migrated from Angular)
│   ├── src/
│   │   ├── App.tsx               # Main Router + Auth Provider
│   │   ├── index.css             # Glassmorphism Design System
│   │   ├── context/
│   │   │   └── AuthContext.tsx   # React Auth State + Hooks
│   │   ├── hooks/
│   │   │   └── useEHR.ts         # EHR API hooks (replacing JS services)
│   │   ├── components/
│   │   │   ├── Layout.tsx        # AppShell Shell (SideRail, TopBar)
│   │   │   └── ProtectedRoute.tsx # Route-level guards
│   │   └── pages/
│   │       ├── Login.tsx
│   │       ├── Register.tsx
│   │       ├── AdminDashboard.tsx
│   │       ├── DoctorDashboard.tsx
│   │       └── PatientDashboard.tsx
│   ├── index.html                # Entry entrypoint
│   ├── vite.config.ts            # Vite Configuration
│   └── package.json              # Modern dependencies
│
├── fabric-network/
│   ├── configtx/
│   │   ├── configtx.yaml         # Channel + genesis config
│   │   └── crypto-config.yaml    # Org + peer definitions
│   └── scripts/
│       └── bootstrap.sh          # Network setup script
│
├── docker-compose.yml            # App stack (backend + frontend + IPFS)
├── docker-compose.fabric.yml     # Fabric network (orderer + peer + CouchDB + CA)
├── Makefile                      # Developer commands
└── README.md
```

---

## ⚡ Quick Start (Real Mode — Production Architecture)

The system is configured to use **Hyperledger Fabric** and **IPFS** by default. Ensure your local infrastructure is active before starting.

### 1. Start Infrastructure (Docker)
The node is required for decentralized file storage:
```bash
make ipfs-up     # Start IPFS
make fabric-up   # Start Fabric Peer/Orderer/CA
```

### 2. Start Backend API
Open a terminal:
```bash
cd backend
npm install
npm run dev
```
*Wait for `⛓ Fabric Gateway Connected` in the logs.*

### 3. Start React Frontend (Vite)
Open a second terminal:
```bash
cd frontend
npm install
npm run dev
```

### 4. Mock Mode (Alternative)
If you do not have Fabric installed, you can run in **Mock Mode** using:
```bash
make dev-mock
```
*Note: In mock mode, data is in-memory and will reset on server restart.*

*Register new MSP identities directly at `/register`.*

---

## 🐳 Docker Compose (Full Stack)

Runs backend + frontend + IPFS in containers:

```bash
# Build and start everything
docker-compose up --build -d

# Check logs
docker-compose logs -f

# Stop
docker-compose down
```

Services:

| Service  | URL                        |
|----------|----------------------------|
| Frontend | http://localhost:3000      |
| Backend  | http://localhost:4000      |
| IPFS API | http://localhost:5001      |
| IPFS GW  | http://localhost:8080/ipfs |

---

## ⛓ Hyperledger Fabric Setup (Full Blockchain Mode)

### Prerequisites
- Docker + Docker Compose
- Fabric binaries v2.4: `cryptogen`, `configtxgen`, `peer`, `orderer`
  ```bash
  curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.4.7 1.5.5
  export PATH=$PATH:$PWD/fabric-samples/bin
  ```

### Step 1 — Generate Crypto Material

```bash
make fabric-generate
```

This runs `cryptogen` and `configtxgen` to create:
- `fabric-network/crypto-config/` — MSP certs and TLS certs
- `fabric-network/channel-artifacts/` — genesis block + channel tx

### Step 2 — Start Fabric Network

```bash
make fabric-up
# Starts: orderer, peer0, CouchDB, Fabric CA
```

Verify containers are running:
```bash
docker ps
# Should show: orderer.example.com, peer0.org1.example.com, couchdb, ca.org1.example.com
```

### Step 3 — Deploy Chaincode

```bash
make chaincode-deploy
# Inside CLI container, runs bootstrap.sh: create channel → join → package → install → approve → commit
```

### Step 4 — Update Connection Profile

Edit `backend/src/config/connection-profile.json` — replace `FILL_WITH_TLS_CERT` values with actual TLS PEM certs from `fabric-network/crypto-config/`.

```bash
# Helper: print the peer TLS cert
cat fabric-network/crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
```

### Step 5 — Start Application Stack

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

---

## 🔗 API Reference

### Authentication — `/api/auth`

| Method | Endpoint          | Description          | Auth |
|--------|-------------------|----------------------|------|
| POST   | /auth/register    | Create account       | —    |
| POST   | /auth/login       | Login + get JWT      | —    |
| POST   | /auth/refresh     | Refresh access token | —    |
| GET    | /auth/me          | Get current user     | ✓    |
| POST   | /auth/logout      | Logout               | ✓    |

### Patients — `/api/patients`

| Method | Endpoint                          | Description            | Roles            |
|--------|-----------------------------------|------------------------|------------------|
| POST   | /patients/register                | Register patient       | admin, patient   |
| GET    | /patients/:id                     | Get patient profile    | admin, patient, doctor |
| POST   | /patients/:id/access/grant        | Grant doctor access    | admin, patient   |
| POST   | /patients/:id/access/revoke       | Revoke doctor access   | admin, patient   |
| GET    | /patients/:id/records             | Get patient records    | admin, patient, doctor |
| GET    | /patients/:id/prescriptions       | Get prescriptions      | admin, patient, doctor |
| GET    | /patients/:id/audit               | Get audit trail        | admin, patient         |
| GET    | /patients/my/audit                | Get self audit trail    | patient               |

### Doctors — `/api/doctors`

| Method | Endpoint              | Description       | Roles  |
|--------|-----------------------|-------------------|--------|
| POST   | /doctors/register     | Register doctor   | admin  |
| GET    | /doctors/:id          | Get doctor info   | any    |
| PATCH  | /doctors/:id/verify   | Verify doctor     | admin  |
| GET    | /doctors/my/patients  | Get assigned patients | doctor |

### Records — `/api/records`

| Method | Endpoint               | Description           | Roles  |
|--------|------------------------|-----------------------|--------|
| POST   | /records               | Create health record  | doctor |
| GET    | /records/:id           | Get record by ID      | admin, patient, doctor |
| GET    | /records/:id/history   | Get record history    | any    |

**Create Record** — multipart/form-data:
```
patientId    (string, required)
recordType   (string, required)
description  (string, required)
file         (file, optional — uploaded to IPFS)
metadata     (JSON string, optional)
```

### Prescriptions — `/api/prescriptions`

| Method | Endpoint                       | Description            | Roles            |
|--------|--------------------------------|------------------------|------------------|
| POST   | /prescriptions                 | Create prescription    | doctor           |
| GET    | /prescriptions/:id             | Get prescription       | admin, patient, doctor |
| PATCH  | /prescriptions/:id/dispense    | Mark as dispensed      | pharmacist, admin |

### Admin — `/api/admin`

| Method | Endpoint        | Description        | Roles |
|--------|-----------------|--------------------|-------|
| GET    | /admin/patients | List all patients  | admin |
| GET    | /admin/doctors  | List all doctors   | admin |
| GET    | /admin/users    | List all users     | admin |
| GET    | /admin/stats    | System statistics  | admin |

---

## 👥 Role-Based Access Control (RBAC)

The system enforces strict multi-layered Role-Based Access Control (RBAC) across the React frontend, Node.js REST API middleware, and on-chain smart contracts (Hyperledger Fabric Chaincode & Solidity Smart Contract).

### System Roles & Responsibilities

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| **`admin`** | System Administrator | Register/verify doctors, manage users, create billing records, view full system stats and query all records. |
| **`patient`** | Patient / Data Owner | Self-register, view personal medical history/prescriptions, grant or revoke doctor access with optional expiration, view audit logs. |
| **`doctor`** | Verified Medical Doctor | Register under admin verification, create health records and digital prescriptions for authorized patients, view authorized patient profiles. |
| **`pharmacist`** | Registered Pharmacist | View prescriptions and dispense active digital prescriptions. |

---

### RBAC Permissions Matrix

| Operations / Resources | Admin | Patient | Doctor | Pharmacist |
|------------------------|:-----:|:-------:|:------:|:----------:|
| Register Patient | ✅ | ✅ (self) | ❌ | ❌ |
| Register Doctor | ✅ | ❌ | ❌ | ❌ |
| Verify Doctor Credentials | ✅ | ❌ | ❌ | ❌ |
| Grant / Revoke Doctor Access | ✅ | ✅ (own data) | ❌ | ❌ |
| Create Health Record | ❌ | ❌ | ✅ (authorized) | ❌ |
| View Health Record / History | ✅ | ✅ (own) | ✅ (authorized) | ❌ |
| Issue Prescription | ❌ | ❌ | ✅ (authorized) | ❌ |
| Dispense Prescription | ✅ | ❌ | ❌ | ✅ |
| Create Billing / Appointments | ✅ | ❌ | ✅ (appts) | ❌ |
| View Audit Trail | ✅ | ✅ (own) | ✅ (authorized) | ❌ |

---

### 🔐 Access Control Logic & Smart Contract Enforcement

Access to patient medical records is dynamically evaluated on-chain via patient-managed access delegation:

```
Doctor requests patient record / creates health record:
  ┌─────────────────────────────────────────────────────────────┐
  │ IF callerRole === "admin"                                  │
  │   → ALLOW                                                   │
  │ ELSE IF callerRole === "patient" AND callerId === patientId  │
  │   → ALLOW                                                   │
  │ ELSE IF callerRole === "doctor"                            │
  │   IF patient.authorizedDoctors[doctorId].exists            │
  │     AND access.active === true                              │
  │     AND (access.expiresAt === 0 OR access.expiresAt > now)  │
  │   → ALLOW + Log VIEW_RECORD / CREATE_RECORD on-chain        │
  │   ELSE                                                      │
  │   → DENY  + Log DENIED_VIEW_RECORD on-chain                 │
  └─────────────────────────────────────────────────────────────┘
```

#### Dual Enforcement:
1. **API Middleware (`backend/src/middleware/auth.js`)**: Evaluates signed JWT payload claims and blocks unauthorized HTTP requests before hitting the network.
2. **On-Chain Smart Contract (`ehrContract.js` & `EHRContract.sol`)**: Hardened on-chain role checking (`onlyAdmin`, `onlyDoctor`, `onlyPatient`, `_checkDoctorAccess`) guarantees data confidentiality even if the backend is bypassed.

Every attempt (granted or denied) is immutably recorded in the blockchain audit trail.

---


## 📦 Smart Contract & Chaincode Architecture

The system's core business logic and access control rules are implemented using **Solidity (`chaincode/solidity/EHRContract.sol`)** for EVM/Ethereum networks, as well as Hyperledger Fabric Node.js chaincode (`chaincode/lib/ehrContract.js`):

1. **Solidity Smart Contract (`chaincode/solidity/EHRContract.sol`) [Primary]**: 
   Written in Solidity `^0.8.20` targeting EVM networks. Implements strict Role-Based Access Control using custom enums (`Role`: `NONE`, `ADMIN`, `PATIENT`, `DOCTOR`, `PHARMACIST`), modifiers (`onlyAdmin`, `onlyAdminOrRole`), custom errors (`Unauthorized`, `AlreadyExists`, `NotFound`, `AccessDenied`), on-chain audit logs, and dynamic doctor access verification via `_checkDoctorAccess`.

2. **Hyperledger Fabric Chaincode (`chaincode/lib/ehrContract.js`)**: 
   Written in Node.js using `fabric-contract-api` for enterprise Hyperledger Fabric network channels with CouchDB rich state database indexing.

### Function Reference

| Function | Description | Access Control / Roles |
|----------|-------------|------------------------|
| `registerPatient` | Register new patient profile | Admin or Patient (self) |
| `registerDoctor` | Register new doctor credentials | Admin only |
| `verifyDoctor` | Verify doctor credentials | Admin only |
| `grantDoctorAccess` | Grant doctor access with expiration | Admin or Patient (own) |
| `revokeDoctorAccess` | Revoke doctor access | Admin or Patient (own) |
| `createHealthRecord` | Create record linked to IPFS hash | Doctor only (Access check) |
| `getHealthRecord` | Retrieve health record details | Admin, Patient (own), Doctor (Access check) |
| `getPatientRecords` | Get all records for a patient | Admin, Patient (own), Doctor (Access check) |
| `createPrescription` | Issue digital prescription | Doctor only (Access check) |
| `dispensePrescription` | Dispense active prescription | Pharmacist or Admin |
| `getPrescription` | Retrieve prescription details | Admin, Patient (own), Doctor |
| `getPatientPrescriptions` | Get all patient prescriptions | Admin, Patient (own), Doctor |
| `createAppointment` | Schedule patient-doctor appointment | Doctor or Admin |
| `getPatientAppointments` | View scheduled appointments | Patient (own), Doctor, Admin |
| `createBillingRecord` | Issue billing item | Admin only |
| `getPatientBilling` | View billing details | Patient (own), Admin |
| `queryAllPatients` | Query all registered patients | Admin only |
| `queryAllDoctors` | Query all registered doctors | Admin only |
| `getDoctorPatients` | Get assigned patients for doctor | Doctor or Admin |
| `queryRecordsByDoctor` | Query records authored by doctor | Doctor or Admin |
| `getAuditTrail` | Immutable transaction audit log | Admin, Patient (own), Doctor |

---


## 🏗 Environment Variables

### Backend (`backend/.env`)

| Variable                  | Default             | Description                    |
|---------------------------|---------------------|--------------------------------|
| `PORT`                    | `4000`              | API server port                |
| `JWT_SECRET`              | *(required)*        | JWT signing secret             |
| `JWT_EXPIRES_IN`          | `24h`               | Token lifetime                 |
| `JWT_REFRESH_SECRET`      | *(required)*        | Refresh token secret           |
| `FABRIC_CHANNEL_NAME`     | `mychannel`         | Fabric channel                 |
| `FABRIC_CHAINCODE_NAME`   | `ehr-chaincode`     | Chaincode name                 |
| `FABRIC_WALLET_PATH`      | `./wallet`          | Path to identity wallet        |
| `FABRIC_CONNECTION_PROFILE` | `./src/config/connection-profile.json` | Path to CCP |
| `IPFS_HOST`               | `localhost`         | IPFS daemon host               |
| `IPFS_PORT`               | `5001`              | IPFS API port                  |
| `IPFS_GATEWAY`            | `http://localhost:8080/ipfs` | Public IPFS gateway   |
| `CORS_ORIGIN`             | `http://localhost:3000` | Allowed CORS origin        |

### Frontend (`frontend/.env`)

| Variable                  | Default                   | Description         |
|---------------------------|---------------------------|---------------------|
| `REACT_APP_API_URL`       | `http://localhost:4000/api` | Backend API URL   |
| `REACT_APP_IPFS_GATEWAY`  | `http://localhost:8080/ipfs` | IPFS gateway URL  |

---

## 🧪 Testing the API

```bash
# 1. Login as admin
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ehr.local","password":"Admin@123"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

echo "Token: $TOKEN"

# 2. Register a patient (Auto-syncs to ledger)
curl -s -X POST http://localhost:4000/api/patients/register \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"patientId":"pat_001","name":"Priya Patel","dob":"1990-05-15","gender":"Female","bloodGroup":"O+","emergencyContact":"+91-9876543210"}' | python3 -m json.tool

# 3. Register a doctor (Requires license and specialization)
curl -s -X POST http://localhost:4000/api/doctors/register \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"doctorId":"doc_001","name":"Dr. Rajesh Sharma","specialization":"Cardiology","licenseNumber":"MCI-12345","hospital":"City General Hospital"}' | python3 -m json.tool

# 4. Grant doctor access (login as patient first)
PAT_TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"patient@ehr.local","password":"Patient@123"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

curl -s -X POST http://localhost:4000/api/patients/pat_001/access/grant \
  -H "Authorization: Bearer $PAT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"doctorId":"doc_001","expiresAt":"2025-12-31"}' | python3 -m json.tool

# 5. Get audit trail
curl -s http://localhost:4000/api/patients/pat_001/audit \
  -H "Authorization: Bearer $PAT_TOKEN" | python3 -m json.tool
```

---

## 🔒 Security Features

- **JWT** access tokens (24h) + refresh tokens (7d)
- **Helmet.js** HTTP security headers
- **Rate limiting** — 100 req / 15 min per IP
- **CORS** whitelist
- **Role-based guards** on every API route and chaincode function
- **Access expiry** — doctor grants can have an expiration date
- **Immutable audit trail** — every action logged on-chain
- **IPFS content addressing** — files cannot be tampered without changing hash

---

## 🛠 VS Code Development Tips

1. Install recommended extensions: **ESLint**, **Prettier**, **REST Client**
2. Use the built-in terminal to run `make dev` — it starts both servers
3. Create `.vscode/launch.json` for backend debugging:

```json
{
  "configurations": [{
    "type": "node",
    "request": "launch",
    "name": "EHR Backend",
    "program": "${workspaceFolder}/backend/src/server.js",
    "envFile": "${workspaceFolder}/backend/.env",
    "console": "integratedTerminal"
  }]
}
```

---

## 🔄 Mock vs Fabric Mode

| Feature           | Mock Mode (default) | Fabric Mode          |
|-------------------|---------------------|----------------------|
| Setup time        | 30 seconds          | 15–30 minutes        |
| Requires Docker   | No (optional IPFS)  | Yes                  |
| Blockchain data   | In-memory (resets)  | Persistent ledger    |
| IPFS              | Mock hash           | Real IPFS node       |
| CouchDB queries   | In-memory filter    | Real rich queries    |
| Immutability      | Not enforced        | Fully enforced       |

Mock mode is ideal for frontend development. Switch to Fabric mode for integration testing and production.

---

## 📊 Data Flow: Create Health Record

```
Doctor uploads file + metadata
         │
         ▼
    Backend API
    POST /api/records
         │
    ┌────┴────┐
    │         │
    ▼         ▼
  File     Metadata
  buffer   object
    │
    ▼
  IPFS Node
  (uploadToIPFS)
    │
    ▼
  ipfsHash = "QmXyz..."
    │
    └──────────────┐
                   ▼
            Fabric Chaincode
            createHealthRecord(
              recordId, patientId, doctorId,
              ipfsHash, recordType,
              description, metadata
            )
                   │
            ┌──────┴──────┐
            │             │
            ▼             ▼
       Access          Write to
       Check           CouchDB
       (pass/fail)     ledger
                       │
                       ▼
                  Audit log written
                  (immutable)
```

---

## 🤝 Contributing

1. Fork the repo
2. Create feature branch: `git checkout -b feature/my-feature`
3. Commit: `git commit -m 'feat: add my feature'`
4. Push and open a PR

---

## 📄 License

MIT License — see [LICENSE](LICENSE)

---

*Built with ❤️ using Hyperledger Fabric v2.4, Node.js, React, and IPFS*


## Patient Report Chatbot

The patient chatbot is fully responsive and supports querying both with and without an uploaded report:

- **General Mode:** Ask general questions about EHR usage, privacy settings, billing, prescriptions, or doctor visits anytime without uploading any files.
- **Report Mode:** Upload any `.pdf`, `.docx`, or `.txt` health report to automatically generate a summary and ask questions based specifically on the report's text.
- **Features:** 
  - **Mobile Responsive:** Modern layout optimized for desktop and mobile, ensuring the input fields and buttons stay inline.
  - **Auto-Scrolling:** Smooth auto-scrolling to keep active chat content centered and in focus.
  - **Smart Fallback:** Instantly falls back to local semantic rule-matching or general assistant logic if no report is present or the API is offline.
  - **OpenAI Integration:** Set `OPENAI_API_KEY` in `backend/.env` to swap fallback logic for real-time generative responses.

Example backend settings:

```env
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-4.1-mini
```

Uploaded report text is processed server-side. Do not place OpenAI API keys in frontend files.
