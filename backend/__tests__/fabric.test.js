'use strict';

const { evaluateTransaction, submitTransaction, __resetMockStore } = require('../src/config/fabric');

describe('Fabric Mock Logic', () => {
  beforeEach(() => {
    // We don't reset every time because we want to test the persistent seed data
    // but we can if we want isolated tests.
  });

  it('should return seeded patient data', async () => {
    const patient = await evaluateTransaction('getPatient', 'PAT001');
    expect(patient).toBeDefined();
    expect(patient.name).toEqual('John Doe');
    expect(patient.patientId).toEqual('PAT001');
  });

  it('should return authored records for a doctor', async () => {
    // DOC001 is a seeded doctor who authored record REC001
    const records = await evaluateTransaction('queryRecordsByDoctor', 'DOC001');
    expect(records).toBeInstanceOf(Array);
    expect(records.length).toBeGreaterThanOrEqual(1);
    expect(records[0].doctorId).toEqual('DOC001');
  });

  it('should show simulated history for a record', async () => {
    const history = await evaluateTransaction('getRecordHistory', 'REC001');
    expect(history).toBeInstanceOf(Array);
    expect(history.length).toEqual(2);
    expect(history[0]).toHaveProperty('txId');
  });

  it('should register a new patient in the mock store', async () => {
    const newPatientData = [
      'PAT_TEST_999', 'Test Patient', '1990-01-01', 'Female', 'A+', 'Contact X'
    ];
    
    await submitTransaction('registerPatient', ...newPatientData);
    
    const retrieved = await evaluateTransaction('getPatient', 'PAT_TEST_999');
    expect(retrieved.name).toEqual('Test Patient');
  });

  it('should throw error for non-existent patient', async () => {
    await expect(evaluateTransaction('getPatient', 'NON_EXISTENT'))
      .rejects.toThrow('Patient NON_EXISTENT does not exist');
  });
});
