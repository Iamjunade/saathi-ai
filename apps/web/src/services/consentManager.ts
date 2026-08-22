// PRD §37: Consent Model — every sensitive operation has a consent record

export interface ConsentRecord {
  id: string;
  userId: string;
  purpose: string;
  dataTypes: string[];
  recipient: string;
  timestamp: string;
  expiry: string | null;
  version: number;
  revokedAt: string | null;
  caseId?: string;
}

const STORAGE_KEY = 'saathi_consent_records';

function loadRecords(): ConsentRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecords(records: ConsentRecord[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function createConsentRecord(
  userId: string,
  purpose: string,
  dataTypes: string[],
  recipient: string,
  caseId?: string
): ConsentRecord {
  const record: ConsentRecord = {
    id: `CONSENT-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    userId,
    purpose,
    dataTypes,
    recipient,
    timestamp: new Date().toISOString(),
    expiry: null,
    version: 1,
    revokedAt: null,
    caseId
  };

  const records = loadRecords();
  records.push(record);
  saveRecords(records);

  return record;
}

export function revokeConsent(consentId: string): boolean {
  const records = loadRecords();
  const idx = records.findIndex(r => r.id === consentId);
  if (idx === -1) return false;

  records[idx].revokedAt = new Date().toISOString();
  saveRecords(records);
  return true;
}

export function getConsentHistory(userId?: string): ConsentRecord[] {
  const records = loadRecords();
  if (userId) {
    return records.filter(r => r.userId === userId);
  }
  return records;
}

export function getActiveConsents(userId: string): ConsentRecord[] {
  return loadRecords().filter(r => r.userId === userId && r.revokedAt === null);
}
