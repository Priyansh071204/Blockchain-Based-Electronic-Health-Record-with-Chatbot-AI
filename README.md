# 🏥 EHR Chain — Blockchain Based  Electronic Health Record System

A **production-grade**, patient-centric Electronic Health Record (EHR) system built on **Hyperledger Fabric v2.x**, with IPFS off-chain storage, JWT auth, and a modern **React (Vite + TypeScript)** dashboard.

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
│    JWT Auth │ Rate Limiting │ File Upload │ Fabric SDK          │
└──────┬──────────────────────────────────────┬───────────────────┘
       │ Fabric SDK (gRPC)                    │ HTTP
┌──────▼──────────────────┐        ┌──────────▼──────────────────┐
│  Hyperledger Fabric v2  │        │         IPFS Node           │
│  ┌─────────────────┐    │        │   (off-chain doc storage)   │
│  │  EHR Chaincode  │    │        └─────────────────────────────┘
│  │  (Node.js)      │    │
│  └─────────────────┘    │
│  Channel: mychannel     │
│  State DB: CouchDB      │
│  CA: fabric-ca          │
└─────────────────────────┘
```

---

## 🗂 Project Structure

```
ehr-blockchain/
├── chaincode/                    # Hyperledger Fabric Chaincode (Node.js)
│   ├── index.js                  # Entry point
│   ├── package.json
│   └── lib/
│       └── ehrContract.js        # Smart contract (all 8 functions)
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

## ⚡ Quick Start (Development Mode — Mock Mode)

The backend runs in **mock mode** automatically when no Fabric connection profile is found. This is the fastest way to test the React frontend and all system features.

### 1. Start IPFS Node (Docker)
The node is required for decentralized file storage:
```bash
make ipfs-up
```
*Verify with `docker ps` — `ipfs.ehr.com` should be active.*

### 2. Start Backend API
Open a terminal:
```bash
cd backend
npm install   # (First time only)
npm run dev
```
*Endpoint: `http://localhost:4000`*

### 3. Start React Frontend (Vite)
Open a second terminal:
```bash
cd frontend
npm install   # (First time only)
npm run dev
```
*Dashboard: `http://localhost:5173`*

### 4. Login Credentials
Use the following identities to explore the dashboard roles:

| Role    | Email               | Password   |
|---------|---------------------|------------|
| Admin   | admin@ehr.local     | Admin@123  |
| Doctor  | doctor@ehr.local    | Doctor@123 |
| Patient | patient@ehr.local   | Patient@123 |

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

## 🔐 Access Control Logic

```
Doctor requests patient record:
  ┌─────────────────────────────────────────────────┐
  │ IF authorizedDoctors[doctorId].exists            │
  │   AND .active === true                           │
  │   AND (.expiresAt === null OR .expiresAt > now)  │
  │ THEN → ALLOW + log VIEW_RECORD                   │
  │ ELSE → DENY  + log DENIED_VIEW_RECORD            │
  └─────────────────────────────────────────────────┘
```

Every action — allowed or denied — is logged immutably to the blockchain audit trail.

---

## 📦 Chaincode Functions

| Function                | Description                                    |
|-------------------------|------------------------------------------------|
| `initLedger`            | Initialize the ledger                          |
| `registerPatient`       | Register a new patient                         |
| `registerDoctor`        | Register a new doctor (admin only)             |
| `grantDoctorAccess`     | Patient grants doctor access                   |
| `revokeDoctorAccess`    | Patient revokes doctor access                  |
| `createHealthRecord`    | Doctor creates record (access check enforced)  |
| `getHealthRecord`       | Get a specific record (access check enforced)  |
| `getPatientRecords`     | Get all records for a patient                  |
| `createPrescription`    | Doctor writes prescription                     |
| `dispensePrescription`  | Pharmacist dispenses prescription              |
| `getPrescription`       | Get prescription details                       |
| `getAuditTrail`         | Get full immutable audit log for entity        |
| `getRecordHistory`      | Get Fabric native history for a record         |
| `queryAllPatients`      | CouchDB rich query — all patients (admin)      |
| `queryAllDoctors`       | CouchDB rich query — all doctors (admin)       |
| `getDoctorPatients`     | Get authorized patient list for a doctor       |
| `verifyDoctor`          | Admin verifies doctor credentials              |

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
