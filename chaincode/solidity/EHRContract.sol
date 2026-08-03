// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title EHRContract
 * @dev Blockchain-Based Electronic Health Record (EHR) Smart Contract in Solidity.
 * Fully features parity with Hyperledger Fabric EHR Chaincode.
 * Handles patient & doctor registration, access grant/revocation, IPFS health record indexing,
 * prescriptions, appointments, billing, and complete on-chain audit trails.
 */
contract EHRContract {

    // ──────────────────────────────────────────────────────────────────────────
    //  ENUMS & STRUCTS
    // ──────────────────────────────────────────────────────────────────────────

    enum Role { NONE, ADMIN, PATIENT, DOCTOR, PHARMACIST }
    enum PrescriptionStatus { ACTIVE, DISPENSED, EXPIRED, CANCELLED }

    struct DoctorAccess {
        string doctorId;
        uint256 grantedAt;
        uint256 expiresAt;
        bool active;
        uint256 revokedAt;
    }

    struct Patient {
        string patientId;
        address walletAddress;
        string name;
        string dob;
        string gender;
        string bloodGroup;
        string emergencyContact;
        uint256 createdAt;
        uint256 updatedAt;
        bool active;
        uint256 version;
    }

    struct Doctor {
        string doctorId;
        address walletAddress;
        string name;
        string specialization;
        string licenseNumber;
        string hospital;
        uint256 createdAt;
        uint256 updatedAt;
        bool active;
        bool verified;
        uint256 verifiedAt;
        uint256 version;
    }

    struct HealthRecord {
        string recordId;
        string patientId;
        string doctorId;
        string ipfsHash;
        string recordType;
        string description;
        string metadata;
        uint256 createdAt;
        uint256 updatedAt;
        bool active;
        uint256 version;
    }

    struct Prescription {
        string prescriptionId;
        string patientId;
        string doctorId;
        string medications; // JSON payload or medication list string
        string instructions;
        uint256 validUntil;
        PrescriptionStatus status;
        uint256 dispensedAt;
        string dispensedBy;
        uint256 createdAt;
        uint256 updatedAt;
        uint256 version;
    }

    struct Appointment {
        string appointmentId;
        string patientId;
        string doctorId;
        string date;
        string time;
        string reason;
        string status;
        uint256 createdAt;
        uint256 updatedAt;
    }

    struct BillingRecord {
        string billId;
        string patientId;
        uint256 amount;
        string description;
        string status;
        string dueDate;
        uint256 createdAt;
    }

    struct AuditLog {
        bytes32 txId;
        uint256 timestamp;
        string action;
        string entityId;
        string actorId;
        string role;
        string details;
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  STATE VARIABLES & MAPPINGS
    // ──────────────────────────────────────────────────────────────────────────

    address public admin;

    // Role management
    mapping(address => Role) public userRoles;
    mapping(address => string) public addressToEntityId;

    // Patients
    mapping(string => Patient) private patients;
    mapping(string => bool) private patientExists;
    string[] private patientIdList;
    mapping(string => DoctorAccess[]) private patientAuthorizedDoctors;
    mapping(string => string[]) private patientRecordIds;
    mapping(string => string[]) private patientPrescriptionIds;
    mapping(string => string[]) private patientAppointmentIds;
    mapping(string => string[]) private patientBillingIds;

    // Doctors
    mapping(string => Doctor) private doctors;
    mapping(string => bool) private doctorExists;
    string[] private doctorIdList;
    mapping(string => string[]) private doctorPatientIds;
    mapping(string => string[]) private doctorAuthoredRecordIds;

    // Health Records
    mapping(string => HealthRecord) private healthRecords;
    mapping(string => bool) private healthRecordExists;

    // Prescriptions
    mapping(string => Prescription) private prescriptions;
    mapping(string => bool) private prescriptionExists;

    // Appointments
    mapping(string => Appointment) private appointments;
    mapping(string => bool) private appointmentExists;

    // Billing Records
    mapping(string => BillingRecord) private billingRecords;
    mapping(string => bool) private billingRecordExists;

    // Audit Logs (entityId => list of audit logs)
    mapping(string => AuditLog[]) private auditLogs;

    // ──────────────────────────────────────────────────────────────────────────
    //  EVENTS
    // ──────────────────────────────────────────────────────────────────────────

    event PatientRegistered(string indexed patientId, string name, address indexed wallet);
    event DoctorRegistered(string indexed doctorId, string name, address indexed wallet);
    event DoctorVerified(string indexed doctorId, uint256 timestamp);
    event AccessGranted(string indexed patientId, string indexed doctorId, uint256 expiresAt);
    event AccessRevoked(string indexed patientId, string indexed doctorId);
    event HealthRecordCreated(string indexed recordId, string indexed patientId, string indexed doctorId, string ipfsHash);
    event HealthRecordViewed(string indexed recordId, string indexed patientId, string indexed viewerId);
    event PrescriptionCreated(string indexed prescriptionId, string indexed patientId, string indexed doctorId);
    event PrescriptionDispensed(string indexed prescriptionId, string indexed patientId, string pharmacistId);
    event AppointmentCreated(string indexed appointmentId, string indexed patientId, string indexed doctorId);
    event BillingRecordCreated(string indexed billId, string indexed patientId, uint256 amount);
    event AuditLogged(bytes32 indexed txHash, string action, string indexed entityId, string actorId, string role);

    // ──────────────────────────────────────────────────────────────────────────
    //  CUSTOM ERRORS
    // ──────────────────────────────────────────────────────────────────────────

    error Unauthorized(string reason);
    error AlreadyExists(string entity, string id);
    error NotFound(string entity, string id);
    error AccessDenied(string reason);
    error InvalidStatus(string reason);

    // ──────────────────────────────────────────────────────────────────────────
    //  MODIFIERS
    // ──────────────────────────────────────────────────────────────────────────

    modifier onlyAdmin() {
        if (msg.sender != admin && userRoles[msg.sender] != Role.ADMIN) {
            revert Unauthorized("Only admin allowed");
        }
        _;
    }

    modifier onlyAdminOrRole(Role requiredRole) {
        if (msg.sender != admin && userRoles[msg.sender] != Role.ADMIN && userRoles[msg.sender] != requiredRole) {
            revert Unauthorized("Unauthorized role");
        }
        _;
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  CONSTRUCTOR & ROLE CONFIGURATION
    // ──────────────────────────────────────────────────────────────────────────

    constructor() {
        admin = msg.sender;
        userRoles[msg.sender] = Role.ADMIN;
    }

    /**
     * @dev Assigns a role to an address and maps it to an entity ID.
     */
    function setUserRole(address account, Role role, string memory entityId) external onlyAdmin {
        userRoles[account] = role;
        if (bytes(entityId).length > 0) {
            addressToEntityId[account] = entityId;
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  INTERNAL HELPERS
    // ──────────────────────────────────────────────────────────────────────────

    function _audit(
        string memory action,
        string memory entityId,
        string memory actorId,
        string memory role,
        string memory details
    ) internal {
        bytes32 txHash = keccak256(abi.encodePacked(block.number, block.timestamp, msg.sender, action, entityId));
        AuditLog memory log = AuditLog({
            txId: txHash,
            timestamp: block.timestamp,
            action: action,
            entityId: entityId,
            actorId: actorId,
            role: role,
            details: details
        });
        auditLogs[entityId].push(log);
        emit AuditLogged(txHash, action, entityId, actorId, role);
    }

    function _checkDoctorAccess(string memory patientId, string memory doctorId)
        internal
        view
        returns (bool allowed, string memory reason)
    {
        DoctorAccess[] storage accesses = patientAuthorizedDoctors[patientId];
        for (uint256 i = 0; i < accesses.length; i++) {
            if (keccak256(bytes(accesses[i].doctorId)) == keccak256(bytes(doctorId))) {
                if (!accesses[i].active) {
                    return (false, "Access has been revoked");
                }
                if (accesses[i].expiresAt > 0 && accesses[i].expiresAt < block.timestamp) {
                    return (false, "Access grant has expired");
                }
                return (true, "Authorized");
            }
        }
        return (false, "No access grant found");
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  PATIENT REGISTRATION
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * @dev Registers a new patient. Can be invoked by admin or patient self-registration.
     */
    function registerPatient(
        string memory patientId,
        string memory name,
        string memory dob,
        string memory gender,
        string memory bloodGroup,
        string memory emergencyContact,
        string memory callerRole
    ) external returns (bool) {
        bool isAdmin = (msg.sender == admin || userRoles[msg.sender] == Role.ADMIN);
        bool isPatientRole = (keccak256(bytes(callerRole)) == keccak256(bytes("patient")) || userRoles[msg.sender] == Role.PATIENT);
        bool isAdminRole = (keccak256(bytes(callerRole)) == keccak256(bytes("admin")) || isAdmin);

        if (!isAdminRole && !isPatientRole) {
            revert Unauthorized("Only admin or self-registration allowed");
        }

        if (patientExists[patientId]) {
            revert AlreadyExists("Patient", patientId);
        }

        Patient memory p = Patient({
            patientId: patientId,
            walletAddress: msg.sender,
            name: name,
            dob: dob,
            gender: gender,
            bloodGroup: bloodGroup,
            emergencyContact: emergencyContact,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            active: true,
            version: 1
        });

        patients[patientId] = p;
        patientExists[patientId] = true;
        patientIdList.push(patientId);
        userRoles[msg.sender] = Role.PATIENT;
        addressToEntityId[msg.sender] = patientId;

        _audit("REGISTER_PATIENT", patientId, patientId, callerRole, name);
        emit PatientRegistered(patientId, name, msg.sender);
        return true;
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  DOCTOR REGISTRATION & VERIFICATION
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * @dev Registers a new doctor. Admin only.
     */
    function registerDoctor(
        string memory doctorId,
        string memory name,
        string memory specialization,
        string memory licenseNumber,
        string memory hospital,
        string memory callerRole
    ) external returns (bool) {
        if (msg.sender != admin && userRoles[msg.sender] != Role.ADMIN && keccak256(bytes(callerRole)) != keccak256(bytes("admin"))) {
            revert Unauthorized("Only admin can register doctors");
        }

        if (doctorExists[doctorId]) {
            revert AlreadyExists("Doctor", doctorId);
        }

        Doctor memory d = Doctor({
            doctorId: doctorId,
            walletAddress: msg.sender,
            name: name,
            specialization: specialization,
            licenseNumber: licenseNumber,
            hospital: hospital,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            active: true,
            verified: false,
            verifiedAt: 0,
            version: 1
        });

        doctors[doctorId] = d;
        doctorExists[doctorId] = true;
        doctorIdList.push(doctorId);

        _audit("REGISTER_DOCTOR", doctorId, doctorId, callerRole, name);
        emit DoctorRegistered(doctorId, name, msg.sender);
        return true;
    }

    /**
     * @dev Verifies a registered doctor. Admin only.
     */
    function verifyDoctor(string memory doctorId, string memory callerId, string memory callerRole) external returns (bool) {
        if (msg.sender != admin && userRoles[msg.sender] != Role.ADMIN && keccak256(bytes(callerRole)) != keccak256(bytes("admin"))) {
            revert Unauthorized("Only admin can verify doctors");
        }
        if (!doctorExists[doctorId]) {
            revert NotFound("Doctor", doctorId);
        }

        Doctor storage d = doctors[doctorId];
        d.verified = true;
        d.verifiedAt = block.timestamp;
        d.updatedAt = block.timestamp;
        d.version += 1;

        _audit("VERIFY_DOCTOR", doctorId, callerId, callerRole, "Doctor verified");
        emit DoctorVerified(doctorId, block.timestamp);
        return true;
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  ACCESS DELEGATION (GRANT / REVOKE)
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * @dev Grants access permission to a doctor for a patient's health records.
     */
    function grantDoctorAccess(
        string memory patientId,
        string memory doctorId,
        uint256 expiresAt,
        string memory callerId,
        string memory callerRole
    ) external returns (bool) {
        if (!patientExists[patientId]) revert NotFound("Patient", patientId);
        if (!doctorExists[doctorId]) revert NotFound("Doctor", doctorId);

        bool isPatient = (keccak256(bytes(callerRole)) == keccak256(bytes("patient")) || userRoles[msg.sender] == Role.PATIENT);
        bool isAdmin = (keccak256(bytes(callerRole)) == keccak256(bytes("admin")) || msg.sender == admin || userRoles[msg.sender] == Role.ADMIN);

        if (!isPatient && !isAdmin) {
            revert Unauthorized("Only patient or admin can grant access");
        }
        if (isPatient && keccak256(bytes(callerId)) != keccak256(bytes(patientId))) {
            revert Unauthorized("Patients can only manage their own access");
        }

        DoctorAccess[] storage accesses = patientAuthorizedDoctors[patientId];
        bool found = false;

        for (uint256 i = 0; i < accesses.length; i++) {
            if (keccak256(bytes(accesses[i].doctorId)) == keccak256(bytes(doctorId))) {
                accesses[i].grantedAt = block.timestamp;
                accesses[i].expiresAt = expiresAt;
                accesses[i].active = true;
                accesses[i].revokedAt = 0;
                found = true;
                break;
            }
        }

        if (!found) {
            accesses.push(DoctorAccess({
                doctorId: doctorId,
                grantedAt: block.timestamp,
                expiresAt: expiresAt,
                active: true,
                revokedAt: 0
            }));
        }

        // Add patient to doctor's patient list if not present
        string[] storage docPatients = doctorPatientIds[doctorId];
        bool pFound = false;
        for (uint256 j = 0; j < docPatients.length; j++) {
            if (keccak256(bytes(docPatients[j])) == keccak256(bytes(patientId))) {
                pFound = true;
                break;
            }
        }
        if (!pFound) {
            docPatients.push(patientId);
        }

        patients[patientId].updatedAt = block.timestamp;
        patients[patientId].version += 1;

        _audit("GRANT_ACCESS", patientId, callerId, callerRole, doctorId);
        emit AccessGranted(patientId, doctorId, expiresAt);
        return true;
    }

    /**
     * @dev Revokes a doctor's access permission for a patient's records.
     */
    function revokeDoctorAccess(
        string memory patientId,
        string memory doctorId,
        string memory callerId,
        string memory callerRole
    ) external returns (bool) {
        if (!patientExists[patientId]) revert NotFound("Patient", patientId);

        bool isPatient = (keccak256(bytes(callerRole)) == keccak256(bytes("patient")) || userRoles[msg.sender] == Role.PATIENT);
        bool isAdmin = (keccak256(bytes(callerRole)) == keccak256(bytes("admin")) || msg.sender == admin || userRoles[msg.sender] == Role.ADMIN);

        if (!isPatient && !isAdmin) {
            revert Unauthorized("Only patient or admin can revoke access");
        }
        if (isPatient && keccak256(bytes(callerId)) != keccak256(bytes(patientId))) {
            revert Unauthorized("Patients can only manage their own access");
        }

        DoctorAccess[] storage accesses = patientAuthorizedDoctors[patientId];
        bool found = false;

        for (uint256 i = 0; i < accesses.length; i++) {
            if (keccak256(bytes(accesses[i].doctorId)) == keccak256(bytes(doctorId))) {
                accesses[i].active = false;
                accesses[i].revokedAt = block.timestamp;
                found = true;
                break;
            }
        }

        if (!found) {
            revert NotFound("DoctorAccess", doctorId);
        }

        patients[patientId].updatedAt = block.timestamp;
        patients[patientId].version += 1;

        _audit("REVOKE_ACCESS", patientId, callerId, callerRole, doctorId);
        emit AccessRevoked(patientId, doctorId);
        return true;
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  HEALTH RECORDS
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * @dev Creates a health record linked to IPFS hash. Doctor only (with active consent).
     */
    function createHealthRecord(
        string memory recordId,
        string memory patientId,
        string memory doctorId,
        string memory ipfsHash,
        string memory recordType,
        string memory description,
        string memory metadata,
        string memory callerId,
        string memory callerRole
    ) external returns (bool) {
        bool isDoctor = (keccak256(bytes(callerRole)) == keccak256(bytes("doctor")) || userRoles[msg.sender] == Role.DOCTOR);
        if (!isDoctor) {
            revert Unauthorized("Only doctors can create health records");
        }

        (bool allowed, string memory reason) = _checkDoctorAccess(patientId, doctorId);
        if (!allowed) {
            _audit("DENIED_CREATE_RECORD", patientId, callerId, callerRole, reason);
            revert AccessDenied(reason);
        }

        if (healthRecordExists[recordId]) {
            revert AlreadyExists("HealthRecord", recordId);
        }

        HealthRecord memory rec = HealthRecord({
            recordId: recordId,
            patientId: patientId,
            doctorId: doctorId,
            ipfsHash: ipfsHash,
            recordType: recordType,
            description: description,
            metadata: metadata,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            active: true,
            version: 1
        });

        healthRecords[recordId] = rec;
        healthRecordExists[recordId] = true;
        patientRecordIds[patientId].push(recordId);
        doctorAuthoredRecordIds[doctorId].push(recordId);

        patients[patientId].updatedAt = block.timestamp;

        _audit("CREATE_RECORD", patientId, callerId, callerRole, recordId);
        emit HealthRecordCreated(recordId, patientId, doctorId, ipfsHash);
        return true;
    }

    /**
     * @dev Retrieves a health record by ID with access control checks.
     */
    function getHealthRecord(
        string memory recordId,
        string memory callerId,
        string memory callerRole
    ) external returns (HealthRecord memory) {
        if (!healthRecordExists[recordId]) revert NotFound("HealthRecord", recordId);

        HealthRecord memory rec = healthRecords[recordId];

        bool isPatient = (keccak256(bytes(callerRole)) == keccak256(bytes("patient")));
        bool isDoctor = (keccak256(bytes(callerRole)) == keccak256(bytes("doctor")));
        bool isAdmin = (keccak256(bytes(callerRole)) == keccak256(bytes("admin")) || msg.sender == admin);

        if (isPatient) {
            if (keccak256(bytes(rec.patientId)) != keccak256(bytes(callerId))) {
                revert Unauthorized("Not your record");
            }
        } else if (isDoctor) {
            (bool allowed, string memory reason) = _checkDoctorAccess(rec.patientId, callerId);
            if (!allowed) {
                _audit("DENIED_VIEW_RECORD", rec.patientId, callerId, callerRole, reason);
                revert AccessDenied(reason);
            }
        } else if (!isAdmin) {
            revert Unauthorized("Unauthorized role");
        }

        _audit("VIEW_RECORD", rec.patientId, callerId, callerRole, recordId);
        emit HealthRecordViewed(recordId, rec.patientId, callerId);
        return rec;
    }

    /**
     * @dev Returns all health records for a patient.
     */
    function getPatientRecords(
        string memory patientId,
        string memory callerId,
        string memory callerRole
    ) external returns (HealthRecord[] memory) {
        bool isPatient = (keccak256(bytes(callerRole)) == keccak256(bytes("patient")));
        bool isDoctor = (keccak256(bytes(callerRole)) == keccak256(bytes("doctor")));
        bool isAdmin = (keccak256(bytes(callerRole)) == keccak256(bytes("admin")) || msg.sender == admin);

        if (isPatient && keccak256(bytes(callerId)) != keccak256(bytes(patientId))) {
            revert Unauthorized("Not your records");
        }
        if (isDoctor) {
            (bool allowed, string memory reason) = _checkDoctorAccess(patientId, callerId);
            if (!allowed) {
                _audit("DENIED_VIEW_RECORDS", patientId, callerId, callerRole, reason);
                revert AccessDenied(reason);
            }
        } else if (!isPatient && !isAdmin) {
            revert Unauthorized("Unauthorized role");
        }

        string[] storage rIds = patientRecordIds[patientId];
        HealthRecord[] memory recs = new HealthRecord[](rIds.length);

        for (uint256 i = 0; i < rIds.length; i++) {
            recs[i] = healthRecords[rIds[i]];
        }

        _audit("LIST_RECORDS", patientId, callerId, callerRole, "Listed records");
        return recs;
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  PRESCRIPTIONS
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * @dev Creates a digital prescription. Doctor only.
     */
    function createPrescription(
        string memory prescriptionId,
        string memory patientId,
        string memory doctorId,
        string memory medications,
        string memory instructions,
        uint256 validUntil,
        string memory callerId,
        string memory callerRole
    ) external returns (bool) {
        bool isDoctor = (keccak256(bytes(callerRole)) == keccak256(bytes("doctor")) || userRoles[msg.sender] == Role.DOCTOR);
        if (!isDoctor) revert Unauthorized("Only doctors can create prescriptions");

        (bool allowed, string memory reason) = _checkDoctorAccess(patientId, doctorId);
        if (!allowed) {
            _audit("DENIED_CREATE_PRESCRIPTION", patientId, callerId, callerRole, reason);
            revert AccessDenied(reason);
        }

        if (prescriptionExists[prescriptionId]) revert AlreadyExists("Prescription", prescriptionId);

        Prescription memory rx = Prescription({
            prescriptionId: prescriptionId,
            patientId: patientId,
            doctorId: doctorId,
            medications: medications,
            instructions: instructions,
            validUntil: validUntil,
            status: PrescriptionStatus.ACTIVE,
            dispensedAt: 0,
            dispensedBy: "",
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            version: 1
        });

        prescriptions[prescriptionId] = rx;
        prescriptionExists[prescriptionId] = true;
        patientPrescriptionIds[patientId].push(prescriptionId);

        _audit("CREATE_PRESCRIPTION", patientId, callerId, callerRole, prescriptionId);
        emit PrescriptionCreated(prescriptionId, patientId, doctorId);
        return true;
    }

    /**
     * @dev Dispenses a prescription. Pharmacist or Admin only.
     */
    function dispensePrescription(
        string memory prescriptionId,
        string memory pharmacistId,
        string memory callerId,
        string memory callerRole
    ) external returns (bool) {
        bool isPharmacist = (keccak256(bytes(callerRole)) == keccak256(bytes("pharmacist")) || userRoles[msg.sender] == Role.PHARMACIST);
        bool isAdmin = (keccak256(bytes(callerRole)) == keccak256(bytes("admin")) || msg.sender == admin || userRoles[msg.sender] == Role.ADMIN);

        if (!isPharmacist && !isAdmin) {
            revert Unauthorized("Only pharmacist or admin can dispense prescriptions");
        }

        if (!prescriptionExists[prescriptionId]) revert NotFound("Prescription", prescriptionId);

        Prescription storage rx = prescriptions[prescriptionId];
        if (rx.status != PrescriptionStatus.ACTIVE) {
            revert InvalidStatus("Prescription is not active");
        }
        if (rx.validUntil > 0 && rx.validUntil < block.timestamp) {
            rx.status = PrescriptionStatus.EXPIRED;
            revert InvalidStatus("Prescription has expired");
        }

        rx.status = PrescriptionStatus.DISPENSED;
        rx.dispensedAt = block.timestamp;
        rx.dispensedBy = pharmacistId;
        rx.updatedAt = block.timestamp;
        rx.version += 1;

        _audit("DISPENSE_PRESCRIPTION", rx.patientId, callerId, callerRole, prescriptionId);
        emit PrescriptionDispensed(prescriptionId, rx.patientId, pharmacistId);
        return true;
    }

    /**
     * @dev Gets a prescription by ID.
     */
    function getPrescription(
        string memory prescriptionId,
        string memory callerId,
        string memory callerRole
    ) external view returns (Prescription memory) {
        if (!prescriptionExists[prescriptionId]) revert NotFound("Prescription", prescriptionId);
        Prescription memory rx = prescriptions[prescriptionId];

        if (keccak256(bytes(callerRole)) == keccak256(bytes("patient")) && keccak256(bytes(rx.patientId)) != keccak256(bytes(callerId))) {
            revert Unauthorized("Not your prescription");
        }
        return rx;
    }

    /**
     * @dev Gets all prescriptions for a patient.
     */
    function getPatientPrescriptions(
        string memory patientId,
        string memory callerId,
        string memory callerRole
    ) external view returns (Prescription[] memory) {
        if (keccak256(bytes(callerRole)) == keccak256(bytes("patient")) && keccak256(bytes(callerId)) != keccak256(bytes(patientId))) {
            revert Unauthorized("Unauthorized");
        }

        string[] storage pIds = patientPrescriptionIds[patientId];
        Prescription[] memory list = new Prescription[](pIds.length);
        for (uint256 i = 0; i < pIds.length; i++) {
            list[i] = prescriptions[pIds[i]];
        }
        return list;
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  APPOINTMENTS & BILLING
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * @dev Creates an appointment. Doctor or Admin only.
     */
    function createAppointment(
        string memory appointmentId,
        string memory patientId,
        string memory doctorId,
        string memory date,
        string memory time,
        string memory reason,
        string memory status,
        string memory callerId,
        string memory callerRole
    ) external returns (bool) {
        bool isDoctor = (keccak256(bytes(callerRole)) == keccak256(bytes("doctor")) || userRoles[msg.sender] == Role.DOCTOR);
        bool isAdmin = (keccak256(bytes(callerRole)) == keccak256(bytes("admin")) || msg.sender == admin || userRoles[msg.sender] == Role.ADMIN);

        if (!isDoctor && !isAdmin) revert Unauthorized("Only doctor or admin can create appointments");
        if (appointmentExists[appointmentId]) revert AlreadyExists("Appointment", appointmentId);

        Appointment memory appt = Appointment({
            appointmentId: appointmentId,
            patientId: patientId,
            doctorId: doctorId,
            date: date,
            time: time,
            reason: reason,
            status: bytes(status).length > 0 ? status : "SCHEDULED",
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        appointments[appointmentId] = appt;
        appointmentExists[appointmentId] = true;
        patientAppointmentIds[patientId].push(appointmentId);

        _audit("CREATE_APPOINTMENT", patientId, callerId, callerRole, appointmentId);
        emit AppointmentCreated(appointmentId, patientId, doctorId);
        return true;
    }

    /**
     * @dev Gets all appointments for a patient.
     */
    function getPatientAppointments(
        string memory patientId,
        string memory callerId,
        string memory callerRole
    ) external view returns (Appointment[] memory) {
        if (keccak256(bytes(callerRole)) == keccak256(bytes("patient")) && keccak256(bytes(callerId)) != keccak256(bytes(patientId))) {
            revert Unauthorized("Unauthorized");
        }

        string[] storage apptIds = patientAppointmentIds[patientId];
        Appointment[] memory list = new Appointment[](apptIds.length);
        for (uint256 i = 0; i < apptIds.length; i++) {
            list[i] = appointments[apptIds[i]];
        }
        return list;
    }

    /**
     * @dev Creates a billing record. Admin only.
     */
    function createBillingRecord(
        string memory billId,
        string memory patientId,
        uint256 amount,
        string memory description,
        string memory status,
        string memory dueDate,
        string memory callerId,
        string memory callerRole
    ) external returns (bool) {
        if (msg.sender != admin && userRoles[msg.sender] != Role.ADMIN && keccak256(bytes(callerRole)) != keccak256(bytes("admin"))) {
            revert Unauthorized("Admin only");
        }
        if (billingRecordExists[billId]) revert AlreadyExists("BillingRecord", billId);

        BillingRecord memory bill = BillingRecord({
            billId: billId,
            patientId: patientId,
            amount: amount,
            description: description,
            status: bytes(status).length > 0 ? status : "PENDING",
            dueDate: dueDate,
            createdAt: block.timestamp
        });

        billingRecords[billId] = bill;
        billingRecordExists[billId] = true;
        patientBillingIds[patientId].push(billId);

        _audit("CREATE_BILLING", patientId, callerId, callerRole, billId);
        emit BillingRecordCreated(billId, patientId, amount);
        return true;
    }

    /**
     * @dev Gets all billing records for a patient.
     */
    function getPatientBilling(
        string memory patientId,
        string memory callerId,
        string memory callerRole
    ) external view returns (BillingRecord[] memory) {
        if (keccak256(bytes(callerRole)) == keccak256(bytes("patient")) && keccak256(bytes(callerId)) != keccak256(bytes(patientId))) {
            revert Unauthorized("Unauthorized");
        }

        string[] storage bIds = patientBillingIds[patientId];
        BillingRecord[] memory list = new BillingRecord[](bIds.length);
        for (uint256 i = 0; i < bIds.length; i++) {
            list[i] = billingRecords[bIds[i]];
        }
        return list;
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  QUERIES & AUDIT
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * @dev Queries all registered patients. Admin only.
     */
    function queryAllPatients(string memory callerRole) external view returns (Patient[] memory) {
        if (msg.sender != admin && userRoles[msg.sender] != Role.ADMIN && keccak256(bytes(callerRole)) != keccak256(bytes("admin"))) {
            revert Unauthorized("Admin only");
        }
        Patient[] memory list = new Patient[](patientIdList.length);
        for (uint256 i = 0; i < patientIdList.length; i++) {
            list[i] = patients[patientIdList[i]];
        }
        return list;
    }

    /**
     * @dev Queries all registered doctors. Admin only.
     */
    function queryAllDoctors(string memory callerRole) external view returns (Doctor[] memory) {
        if (msg.sender != admin && userRoles[msg.sender] != Role.ADMIN && keccak256(bytes(callerRole)) != keccak256(bytes("admin"))) {
            revert Unauthorized("Admin only");
        }
        Doctor[] memory list = new Doctor[](doctorIdList.length);
        for (uint256 i = 0; i < doctorIdList.length; i++) {
            list[i] = doctors[doctorIdList[i]];
        }
        return list;
    }

    /**
     * @dev Queries all records authored by a specific doctor.
     */
    function queryRecordsByDoctor(
        string memory doctorId,
        string memory callerId,
        string memory callerRole
    ) external view returns (HealthRecord[] memory) {
        bool isDoctor = (keccak256(bytes(callerRole)) == keccak256(bytes("doctor")));
        bool isAdmin = (keccak256(bytes(callerRole)) == keccak256(bytes("admin")) || msg.sender == admin);

        if (!isDoctor && !isAdmin) revert Unauthorized("Unauthorized");

        string[] storage rIds = doctorAuthoredRecordIds[doctorId];
        HealthRecord[] memory list = new HealthRecord[](rIds.length);
        for (uint256 i = 0; i < rIds.length; i++) {
            list[i] = healthRecords[rIds[i]];
        }
        return list;
    }

    /**
     * @dev Returns audit trail logs for a given entity ID.
     */
    function getAuditTrail(
        string memory entityId,
        string memory callerId,
        string memory callerRole
    ) external view returns (AuditLog[] memory) {
        bool isPatient = (keccak256(bytes(callerRole)) == keccak256(bytes("patient")));
        if (isPatient && keccak256(bytes(callerId)) != keccak256(bytes(entityId))) {
            revert Unauthorized("Unauthorized to view this audit trail");
        }
        return auditLogs[entityId];
    }
}
