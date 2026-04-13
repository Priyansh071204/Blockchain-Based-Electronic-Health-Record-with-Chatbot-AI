'use strict';

const { Contract } = require('fabric-contract-api');

class EHRContract extends Contract {
  constructor() {
    super('EHRContract');
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  HELPERS
  // ──────────────────────────────────────────────────────────────────────────

  async _exists(ctx, key) {
    const data = await ctx.stub.getState(key);
    return data && data.length > 0;
  }

  async _get(ctx, key) {
    const data = await ctx.stub.getState(key);
    if (!data || data.length === 0) throw new Error(`${key} does not exist`);
    return JSON.parse(data.toString());
  }

  async _put(ctx, key, obj) {
    await ctx.stub.putState(key, Buffer.from(JSON.stringify(obj)));
  }

  _now(ctx) {
    const ts = ctx.stub.getTxTimestamp();
    return new Date(ts.seconds.low * 1000).toISOString();
  }

  _txid(ctx) { return ctx.stub.getTxID(); }

  async _audit(ctx, action, entityId, actorId, role, details = {}) {
    const key = `AUDIT_${this._txid(ctx)}_${Date.now()}`;
    const entry = {
      docType: 'auditLog', txId: this._txid(ctx),
      timestamp: this._now(ctx), action, entityId,
      actorId, role, details,
    };
    await this._put(ctx, key, entry);

    const listKey = `AUDITLIST_${entityId}`;
    let list = (await this._exists(ctx, listKey)) ? await this._get(ctx, listKey) : [];
    list.push(key);
    await this._put(ctx, listKey, list);
  }

  async _checkDoctorAccess(ctx, patientId, doctorId) {
    const patient = await this._get(ctx, `PATIENT_${patientId}`);
    const access = (patient.authorizedDoctors || []).find(a => a.doctorId === doctorId);
    if (!access) return { allowed: false, reason: 'No access grant found' };
    if (!access.active) return { allowed: false, reason: 'Access has been revoked' };
    if (access.expiresAt && new Date(access.expiresAt) < new Date())
      return { allowed: false, reason: 'Access grant has expired' };
    return { allowed: true };
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  INIT
  // ──────────────────────────────────────────────────────────────────────────

  async initLedger(ctx) {
    console.info('EHR Ledger Initialized');
    return { success: true, message: 'EHR Ledger initialized successfully' };
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  PATIENT REGISTRATION
  // ──────────────────────────────────────────────────────────────────────────

  async registerPatient(ctx, patientId, name, dob, gender, bloodGroup, emergencyContact, callerRole) {
    if (!['admin', 'patient'].includes(callerRole))
      throw new Error('Unauthorized: Only admin or self-registration allowed');

    const key = `PATIENT_${patientId}`;
    if (await this._exists(ctx, key)) throw new Error(`Patient ${patientId} already exists`);

    const patient = {
      docType: 'patient', patientId, name, dob, gender, bloodGroup,
      emergencyContact, authorizedDoctors: [], recordIds: [],
      prescriptionIds: [], appointmentIds: [], billingIds: [],
      createdAt: this._now(ctx),
      updatedAt: this._now(ctx), active: true, version: 1,
    };

    await this._put(ctx, key, patient);
    await this._audit(ctx, 'REGISTER_PATIENT', patientId, patientId, callerRole, { name });
    return JSON.stringify(patient);
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  DOCTOR REGISTRATION
  // ──────────────────────────────────────────────────────────────────────────

  async registerDoctor(ctx, doctorId, name, specialization, licenseNumber, hospital, callerRole) {
    if (callerRole !== 'admin') throw new Error('Unauthorized: Only admin can register doctors');

    const key = `DOCTOR_${doctorId}`;
    if (await this._exists(ctx, key)) throw new Error(`Doctor ${doctorId} already exists`);

    const doctor = {
      docType: 'doctor', doctorId, name, specialization,
      licenseNumber, hospital, patientIds: [],
      createdAt: this._now(ctx), updatedAt: this._now(ctx),
      active: true, verified: false, version: 1,
    };

    await this._put(ctx, key, doctor);
    await this._audit(ctx, 'REGISTER_DOCTOR', doctorId, doctorId, callerRole, { name, specialization });
    return JSON.stringify(doctor);
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  GRANT DOCTOR ACCESS
  // ──────────────────────────────────────────────────────────────────────────

  async grantDoctorAccess(ctx, patientId, doctorId, expiresAt, callerId, callerRole) {
    if (!['patient', 'admin'].includes(callerRole))
      throw new Error('Unauthorized: Only patient or admin can grant access');
    if (callerRole === 'patient' && callerId !== patientId)
      throw new Error('Unauthorized: Patients can only manage their own access');

    const pKey = `PATIENT_${patientId}`;
    const dKey = `DOCTOR_${doctorId}`;
    if (!await this._exists(ctx, pKey)) throw new Error(`Patient ${patientId} not found`);
    if (!await this._exists(ctx, dKey)) throw new Error(`Doctor ${doctorId} not found`);

    const patient = await this._get(ctx, pKey);
    const doctor = await this._get(ctx, dKey);

    const idx = patient.authorizedDoctors.findIndex(a => a.doctorId === doctorId);
    const entry = {
      doctorId, grantedAt: this._now(ctx),
      expiresAt: expiresAt || null, active: true,
    };

    if (idx >= 0) patient.authorizedDoctors[idx] = entry;
    else patient.authorizedDoctors.push(entry);

    if (!doctor.patientIds.includes(patientId)) doctor.patientIds.push(patientId);

    patient.updatedAt = this._now(ctx);
    patient.version += 1;
    doctor.updatedAt = this._now(ctx);

    await this._put(ctx, pKey, patient);
    await this._put(ctx, dKey, doctor);
    await this._audit(ctx, 'GRANT_ACCESS', patientId, callerId, callerRole, { doctorId, expiresAt });
    return JSON.stringify({ success: true, patientId, doctorId });
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  REVOKE DOCTOR ACCESS
  // ──────────────────────────────────────────────────────────────────────────

  async revokeDoctorAccess(ctx, patientId, doctorId, callerId, callerRole) {
    if (!['patient', 'admin'].includes(callerRole))
      throw new Error('Unauthorized: Only patient or admin can revoke access');
    if (callerRole === 'patient' && callerId !== patientId)
      throw new Error('Unauthorized: Patients can only manage their own access');

    const pKey = `PATIENT_${patientId}`;
    const patient = await this._get(ctx, pKey);

    const idx = patient.authorizedDoctors.findIndex(a => a.doctorId === doctorId);
    if (idx < 0) throw new Error(`Doctor ${doctorId} has no access grant for patient ${patientId}`);

    patient.authorizedDoctors[idx].active = false;
    patient.authorizedDoctors[idx].revokedAt = this._now(ctx);
    patient.updatedAt = this._now(ctx);
    patient.version += 1;

    await this._put(ctx, pKey, patient);
    await this._audit(ctx, 'REVOKE_ACCESS', patientId, callerId, callerRole, { doctorId });
    return JSON.stringify({ success: true, patientId, doctorId });
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  CREATE HEALTH RECORD
  // ──────────────────────────────────────────────────────────────────────────

  async createHealthRecord(ctx, recordId, patientId, doctorId, ipfsHash, recordType, description, metadataStr, callerId, callerRole) {
    if (callerRole !== 'doctor') throw new Error('Unauthorized: Only doctors can create health records');

    const access = await this._checkDoctorAccess(ctx, patientId, doctorId);
    if (!access.allowed) {
      await this._audit(ctx, 'DENIED_CREATE_RECORD', patientId, callerId, callerRole, { reason: access.reason, doctorId });
      throw new Error(`Access denied: ${access.reason}`);
    }

    const key = `RECORD_${recordId}`;
    if (await this._exists(ctx, key)) throw new Error(`Record ${recordId} already exists`);

    const record = {
      docType: 'healthRecord', recordId, patientId, doctorId,
      ipfsHash, recordType, description,
      metadata: JSON.parse(metadataStr || '{}'),
      createdAt: this._now(ctx), updatedAt: this._now(ctx),
      active: true, version: 1,
    };

    await this._put(ctx, key, record);

    const patient = await this._get(ctx, `PATIENT_${patientId}`);
    patient.recordIds.push(recordId);
    patient.updatedAt = this._now(ctx);
    await this._put(ctx, `PATIENT_${patientId}`, patient);

    await this._audit(ctx, 'CREATE_RECORD', patientId, callerId, callerRole, { recordId, doctorId, recordType, ipfsHash });
    return JSON.stringify(record);
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  GET HEALTH RECORD
  // ──────────────────────────────────────────────────────────────────────────

  async getHealthRecord(ctx, recordId, callerId, callerRole) {
    const record = await this._get(ctx, `RECORD_${recordId}`);

    if (callerRole === 'patient') {
      if (record.patientId !== callerId) throw new Error('Unauthorized: Not your record');
    } else if (callerRole === 'doctor') {
      const access = await this._checkDoctorAccess(ctx, record.patientId, callerId);
      if (!access.allowed) {
        await this._audit(ctx, 'DENIED_VIEW_RECORD', record.patientId, callerId, callerRole, { recordId, reason: access.reason });
        throw new Error(`Access denied: ${access.reason}`);
      }
    } else if (callerRole !== 'admin') {
      throw new Error('Unauthorized role');
    }

    await this._audit(ctx, 'VIEW_RECORD', record.patientId, callerId, callerRole, { recordId });
    return JSON.stringify(record);
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  GET PATIENT RECORDS
  // ──────────────────────────────────────────────────────────────────────────

  async getPatientRecords(ctx, patientId, callerId, callerRole) {
    if (callerRole === 'patient' && callerId !== patientId)
      throw new Error('Unauthorized: Not your records');
    if (callerRole === 'doctor') {
      const access = await this._checkDoctorAccess(ctx, patientId, callerId);
      if (!access.allowed) {
        await this._audit(ctx, 'DENIED_VIEW_RECORDS', patientId, callerId, callerRole, { reason: access.reason });
        throw new Error(`Access denied: ${access.reason}`);
      }
    }

    const patient = await this._get(ctx, `PATIENT_${patientId}`);
    const records = [];
    for (const rid of (patient.recordIds || [])) {
      try { records.push(await this._get(ctx, `RECORD_${rid}`)); } catch (_) {}
    }

    await this._audit(ctx, 'LIST_RECORDS', patientId, callerId, callerRole, { count: records.length });
    return JSON.stringify(records);
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  CREATE PRESCRIPTION
  // ──────────────────────────────────────────────────────────────────────────

  async createPrescription(ctx, prescriptionId, patientId, doctorId, medicationsStr, instructions, validUntil, callerId, callerRole) {
    if (callerRole !== 'doctor') throw new Error('Unauthorized: Only doctors can create prescriptions');

    const access = await this._checkDoctorAccess(ctx, patientId, doctorId);
    if (!access.allowed) {
      await this._audit(ctx, 'DENIED_CREATE_PRESCRIPTION', patientId, callerId, callerRole, { reason: access.reason });
      throw new Error(`Access denied: ${access.reason}`);
    }

    const key = `PRESCRIPTION_${prescriptionId}`;
    if (await this._exists(ctx, key)) throw new Error(`Prescription ${prescriptionId} already exists`);

    const rx = {
      docType: 'prescription', prescriptionId, patientId, doctorId,
      medications: JSON.parse(medicationsStr), instructions, validUntil,
      status: 'ACTIVE', dispensedAt: null, dispensedBy: null,
      createdAt: this._now(ctx), updatedAt: this._now(ctx), version: 1,
    };

    await this._put(ctx, key, rx);

    const patient = await this._get(ctx, `PATIENT_${patientId}`);
    (patient.prescriptionIds = patient.prescriptionIds || []).push(prescriptionId);
    patient.updatedAt = this._now(ctx);
    await this._put(ctx, `PATIENT_${patientId}`, patient);

    await this._audit(ctx, 'CREATE_PRESCRIPTION', patientId, callerId, callerRole, { prescriptionId, doctorId });
    return JSON.stringify(rx);
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  DISPENSE PRESCRIPTION
  // ──────────────────────────────────────────────────────────────────────────

  async dispensePrescription(ctx, prescriptionId, pharmacistId, callerId, callerRole) {
    if (!['pharmacist', 'admin'].includes(callerRole))
      throw new Error('Unauthorized: Only pharmacist or admin can dispense prescriptions');

    const key = `PRESCRIPTION_${prescriptionId}`;
    const rx = await this._get(ctx, key);

    if (rx.status !== 'ACTIVE') throw new Error(`Prescription already ${rx.status}`);
    if (rx.validUntil && new Date(rx.validUntil) < new Date())
      throw new Error('Prescription has expired');

    rx.status = 'DISPENSED';
    rx.dispensedAt = this._now(ctx);
    rx.dispensedBy = pharmacistId;
    rx.updatedAt = this._now(ctx);
    rx.version += 1;

    await this._put(ctx, key, rx);
    await this._audit(ctx, 'DISPENSE_PRESCRIPTION', rx.patientId, callerId, callerRole, { prescriptionId, pharmacistId });
    return JSON.stringify(rx);
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  GETTERS
  // ──────────────────────────────────────────────────────────────────────────

  async getPatient(ctx, patientId, callerId, callerRole) {
    if (callerRole === 'patient' && callerId !== patientId) throw new Error('Unauthorized');
    if (callerRole === 'doctor') {
      const access = await this._checkDoctorAccess(ctx, patientId, callerId);
      if (!access.allowed) throw new Error(`Access denied: ${access.reason}`);
    }
    return JSON.stringify(await this._get(ctx, `PATIENT_${patientId}`));
  }

  async getDoctor(ctx, doctorId, callerId, callerRole) {
    return JSON.stringify(await this._get(ctx, `DOCTOR_${doctorId}`));
  }

  async getPrescription(ctx, prescriptionId, callerId, callerRole) {
    const rx = await this._get(ctx, `PRESCRIPTION_${prescriptionId}`);
    if (callerRole === 'patient' && rx.patientId !== callerId) throw new Error('Unauthorized');
    return JSON.stringify(rx);
  }

  async getPatientPrescriptions(ctx, patientId, callerId, callerRole) {
    if (callerRole === 'patient' && callerId !== patientId) throw new Error('Unauthorized');
    const patient = await this._get(ctx, `PATIENT_${patientId}`);
    const results = [];
    for (const pid of (patient.prescriptionIds || [])) {
      try { results.push(await this._get(ctx, `PRESCRIPTION_${pid}`)); } catch (_) {}
    }
    return JSON.stringify(results);
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  AUDIT TRAIL
  // ──────────────────────────────────────────────────────────────────────────

  async getAuditTrail(ctx, entityId, callerId, callerRole) {
    if (!['admin', 'patient', 'doctor'].includes(callerRole)) throw new Error('Unauthorized');
    if (callerRole === 'patient' && callerId !== entityId) throw new Error('Unauthorized');

    const listKey = `AUDITLIST_${entityId}`;
    if (!await this._exists(ctx, listKey)) return JSON.stringify([]);

    const keys = await this._get(ctx, listKey);
    const entries = [];
    for (const k of keys) {
      try { entries.push(await this._get(ctx, k)); } catch (_) {}
    }
    return JSON.stringify(entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  RECORD HISTORY (Fabric native versioning)
  // ──────────────────────────────────────────────────────────────────────────

  async getRecordHistory(ctx, recordId) {
    const iterator = await ctx.stub.getHistoryForKey(`RECORD_${recordId}`);
    const history = [];
    let res = await iterator.next();
    while (!res.done) {
      if (res.value) {
        history.push({
          txId: res.value.txId,
          timestamp: new Date(res.value.timestamp.seconds.low * 1000).toISOString(),
          isDelete: res.value.isDelete,
          data: res.value.value ? JSON.parse(res.value.value.toString()) : null,
        });
      }
      res = await iterator.next();
    }
    await iterator.close();
    return JSON.stringify(history);
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  ADMIN QUERIES (CouchDB rich queries)
  // ──────────────────────────────────────────────────────────────────────────

  async queryAllPatients(ctx, callerId, callerRole) {
    if (callerRole !== 'admin') throw new Error('Unauthorized: Admin only');
    const iterator = await ctx.stub.getQueryResult(JSON.stringify({ selector: { docType: 'patient' } }));
    const results = [];
    let res = await iterator.next();
    while (!res.done) {
      results.push(JSON.parse(res.value.value.toString()));
      res = await iterator.next();
    }
    await iterator.close();
    return JSON.stringify(results);
  }

  async queryAllDoctors(ctx, callerId, callerRole) {
    if (callerRole !== 'admin') throw new Error('Unauthorized: Admin only');
    const iterator = await ctx.stub.getQueryResult(JSON.stringify({ selector: { docType: 'doctor' } }));
    const results = [];
    let res = await iterator.next();
    while (!res.done) {
      results.push(JSON.parse(res.value.value.toString()));
      res = await iterator.next();
    }
    await iterator.close();
    return JSON.stringify(results);
  }

  async getDoctorPatients(ctx, doctorId, callerId, callerRole) {
    if (callerRole !== 'doctor' && callerRole !== 'admin') throw new Error('Unauthorized');
    const dKey = `DOCTOR_${doctorId}`;
    const doctor = await this._get(ctx, dKey);
    
    const results = [];
    for (const pId of (doctor.patientIds || [])) {
      try {
        const pKey = `PATIENT_${pId}`;
        const p = await this._get(ctx, pKey);
        results.push(p);
      } catch (err) { /* Skip missing patients */ }
    }
    return JSON.stringify(results);
  }

  async verifyDoctor(ctx, doctorId, callerId, callerRole) {
    if (callerRole !== 'admin') throw new Error('Unauthorized: Admin only');
    const key = `DOCTOR_${doctorId}`;
    const doctor = await this._get(ctx, key);
    doctor.verified = true;
    doctor.verifiedAt = this._now(ctx);
    doctor.updatedAt = this._now(ctx);
    doctor.version += 1;
    await this._put(ctx, key, doctor);
    await this._audit(ctx, 'VERIFY_DOCTOR', doctorId, callerId, callerRole, {});
    return JSON.stringify(doctor);
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  DOCTOR AUTHORED RECORDS
  // ──────────────────────────────────────────────────────────────────────────

  async queryRecordsByDoctor(ctx, doctorId, callerId, callerRole) {
    if (callerRole !== 'doctor' && callerRole !== 'admin') {
      throw new Error('Unauthorized');
    }

    const query = {
      selector: {
        docType: 'healthRecord',
        doctorId: doctorId,
      },
    };

    const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
    const results = [];
    let res = await iterator.next();
    while (!res.done) {
      if (res.value && res.value.value) {
        results.push(JSON.parse(res.value.value.toString()));
      }
      res = await iterator.next();
    }
    await iterator.close();

    return JSON.stringify(results);
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  APPOINTMENTS
  // ──────────────────────────────────────────────────────────────────────────

  async createAppointment(ctx, appointmentId, patientId, doctorId, date, time, reason, status, callerId, callerRole) {
    if (!['doctor', 'admin'].includes(callerRole)) throw new Error('Unauthorized');
    const key = `APPO_${appointmentId}`;
    if (await this._exists(ctx, key)) throw new Error(`Appointment ${appointmentId} exists`);

    const appt = {
      docType: 'appointment', appointmentId, patientId, doctorId, date, time, reason,
      status: status || 'SCHEDULED', createdAt: this._now(ctx), updatedAt: this._now(ctx),
    };

    await this._put(ctx, key, appt);
    const patient = await this._get(ctx, `PATIENT_${patientId}`);
    (patient.appointmentIds = patient.appointmentIds || []).push(appointmentId);
    await this._put(ctx, `PATIENT_${patientId}`, patient);
    return JSON.stringify(appt);
  }

  async getPatientAppointments(ctx, patientId, callerId, callerRole) {
    if (callerRole === 'patient' && callerId !== patientId) throw new Error('Unauthorized');
    const patient = await this._get(ctx, `PATIENT_${patientId}`);
    const results = [];
    for (const id of (patient.appointmentIds || [])) {
      try { results.push(await this._get(ctx, `APPO_${id}`)); } catch (_) {}
    }
    return JSON.stringify(results);
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  BILLING
  // ──────────────────────────────────────────────────────────────────────────

  async createBillingRecord(ctx, billId, patientId, amount, description, status, dueDate, callerId, callerRole) {
    if (callerRole !== 'admin') throw new Error('Unauthorized: Admin only');
    const key = `BILL_${billId}`;
    if (await this._exists(ctx, key)) throw new Error(`Bill ${billId} exists`);

    const bill = {
      docType: 'billing', billId, patientId, amount, description, 
      status: status || 'PENDING', dueDate, createdAt: this._now(ctx),
    };

    await this._put(ctx, key, bill);
    const patient = await this._get(ctx, `PATIENT_${patientId}`);
    (patient.billingIds = patient.billingIds || []).push(billId);
    await this._put(ctx, `PATIENT_${patientId}`, patient);
    return JSON.stringify(bill);
  }

  async getPatientBilling(ctx, patientId, callerId, callerRole) {
    if (callerRole === 'patient' && callerId !== patientId) throw new Error('Unauthorized');
    const patient = await this._get(ctx, `PATIENT_${patientId}`);
    const results = [];
    for (const id of (patient.billingIds || [])) {
      try { results.push(await this._get(ctx, `BILL_${id}`)); } catch (_) {}
    }
    return JSON.stringify(results);
  }

  async getPatientVitals(ctx, patientId, callerId, callerRole) {
    if (callerRole === 'patient' && callerId !== patientId) throw new Error('Unauthorized');
    if (callerRole === 'doctor') {
      const access = await this._checkDoctorAccess(ctx, patientId, callerId);
      if (!access.allowed) throw new Error(`Access denied: ${access.reason}`);
    }
    const patient = await this._get(ctx, `PATIENT_${patientId}`);
    const results = [];
    for (const id of (patient.vitalIds || [])) {
      try { results.push(await this._get(ctx, `VIT_${id}`)); } catch (_) {}
    }
    return JSON.stringify(results);
  }
}

module.exports = EHRContract;
