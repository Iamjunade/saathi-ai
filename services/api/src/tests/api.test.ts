process.env.TSX_TEST = 'true';
process.env.NODE_ENV = 'test';

import { app, server, startServer } from '../server';
import { prisma } from '../db';
import { seedDatabase } from '../../prisma/seed';

async function runTests() {
  console.log('🧪 Starting SAATHI Backend API & State Machine Test Suite...\n');

  // Start test server on port 4099
  const TEST_PORT = 4099;
  await startServer(TEST_PORT);
  const baseUrl = `http://localhost:${TEST_PORT}`;

  let passed = 0;
  let failed = 0;

  async function request(path: string, options: { method?: string; body?: any; headers?: any } = {}) {
    const res = await fetch(`${baseUrl}${path}`, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const json = await res.json().catch(() => null);
    return { status: res.status, data: json };
  }

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // 0. Seed Test Database
    console.log('--- Step 0: Database Seeding ---');
    await seedDatabase();

    // 1. Health check
    console.log('\n--- Step 1: Health Check ---');
    const health = await request('/health');
    assert(health.status === 200 && health.data.status === 'ok', 'GET /health returns status ok');

    // 2. Create new Emergency Case (Task 2)
    console.log('\n--- Step 2: Case Creation ---');
    const createCaseRes = await request('/api/cases', {
      method: 'POST',
      body: {
        caseType: 'MEDICAL',
        riskLevel: 'CRITICAL',
        userName: 'Suresh Kumar',
        userPhone: '+919988776655',
        title: 'Severe Cardiac Arrhythmia',
        description: 'Caller reporting sudden collapse, irregular pulse, and gasping.',
        location: {
          lat: 17.4375,
          lng: 78.4482,
          address: 'Road No. 10, Banjara Hills, Hyderabad',
          city: 'Hyderabad',
        },
        metadata: {
          symptoms: ['Loss of Consciousness', 'Irregular Pulse'],
          callerRelation: 'Colleague',
        },
        initialAction: {
          actionType: 'AMBULANCE_DISPATCH',
          riskLevel: 'CRITICAL',
          payload: { targetHospital: 'CARE Hospitals', priority: 'ALS' },
          requiresApproval: true,
        },
      },
    });

    assert(createCaseRes.status === 201, 'POST /api/cases creates a case with 201 status');
    assert(createCaseRes.data.data.status === 'CREATED', 'Initial case state is CREATED');
    const testCaseId = createCaseRes.data.data.id;
    const testActionId = createCaseRes.data.data.actions[0]?.id;

    // 3. State Machine Transitions (Task 2)
    console.log('\n--- Step 3: State Machine Transitions ---');
    
    // CREATED -> ASSESSING
    const t1 = await request(`/api/cases/${testCaseId}/status`, {
      method: 'PATCH',
      body: { status: 'ASSESSING', actor: 'AI_TRIAGE_BOT', reason: 'Vitals analysis underway' },
    });
    assert(t1.status === 200 && t1.data.data.status === 'ASSESSING', 'Transition: CREATED -> ASSESSING');

    // ASSESSING -> AWAITING_USER
    const t2 = await request(`/api/cases/${testCaseId}/status`, {
      method: 'PATCH',
      body: { status: 'AWAITING_USER', actor: 'AI_TRIAGE_BOT', reason: 'Ambulance dispatch requires user consent' },
    });
    assert(t2.status === 200 && t2.data.data.status === 'AWAITING_USER', 'Transition: ASSESSING -> AWAITING_USER');

    // 4. Action Approval (Task 2 & 1)
    console.log('\n--- Step 4: Action Authorization ---');
    const approveRes = await request(`/api/actions/${testActionId}/approve`, {
      method: 'POST',
      body: {
        actor: 'USER',
        reason: 'User tapped [Authorize Dispatch] on mobile app',
      },
    });
    assert(approveRes.status === 200, 'POST /api/actions/:id/approve returns 200');
    assert(approveRes.data.data.action.status === 'APPROVED', 'Action status updated to APPROVED');
    assert(approveRes.data.data.case.status === 'AUTHORIZED', 'Case automatically transitioned to AUTHORIZED');

    // 5. Complete Remaining State Transitions
    console.log('\n--- Step 5: Execution to Resolution Flow ---');
    // AUTHORIZED -> ACTION_EXECUTING
    const t3 = await request(`/api/cases/${testCaseId}/status`, {
      method: 'PATCH',
      body: { status: 'ACTION_EXECUTING', actor: 'HOSPITAL_DISPATCH', reason: 'ALS Ambulance Unit 14 rolling' },
    });
    assert(t3.status === 200 && t3.data.data.status === 'ACTION_EXECUTING', 'Transition: AUTHORIZED -> ACTION_EXECUTING');

    // ACTION_EXECUTING -> ACTION_COMPLETED
    const t4 = await request(`/api/cases/${testCaseId}/status`, {
      method: 'PATCH',
      body: { status: 'ACTION_COMPLETED', actor: 'HOSPITAL_INTAKE', reason: 'Patient admitted to Trauma ICU Bay 4' },
    });
    assert(t4.status === 200 && t4.data.data.status === 'ACTION_COMPLETED', 'Transition: ACTION_EXECUTING -> ACTION_COMPLETED');

    // ACTION_COMPLETED -> FOLLOW_UP
    const t5 = await request(`/api/cases/${testCaseId}/status`, {
      method: 'PATCH',
      body: { status: 'FOLLOW_UP', actor: 'AI_CASE_MANAGER', reason: 'SMS sent to trusted contacts' },
    });
    assert(t5.status === 200 && t5.data.data.status === 'FOLLOW_UP', 'Transition: ACTION_COMPLETED -> FOLLOW_UP');

    // FOLLOW_UP -> RESOLVED
    const t6 = await request(`/api/cases/${testCaseId}/status`, {
      method: 'PATCH',
      body: { status: 'RESOLVED', actor: 'OPS_SUPERVISOR', reason: 'All actions completed successfully' },
    });
    assert(t6.status === 200 && t6.data.data.status === 'RESOLVED', 'Transition: FOLLOW_UP -> RESOLVED');

    // 6. Nearby Hospitals Query (Task 2)
    console.log('\n--- Step 6: Nearby Hospitals API ---');
    const nearbyRes = await request('/api/hospitals/nearby?lat=17.4375&lng=78.4482&radius=10');
    assert(nearbyRes.status === 200, 'GET /api/hospitals/nearby returns 200');
    assert(Array.isArray(nearbyRes.data.data) && nearbyRes.data.data.length > 0, 'Returns list of nearby hospitals');
    assert(nearbyRes.data.data[0].distanceKm !== undefined, 'Hospitals contain calculated distanceKm');
    assert(nearbyRes.data.data[0].estimatedArrivalMins !== undefined, 'Hospitals contain estimatedArrivalMins');

    // 7. Civic Complaints API (Task 2)
    console.log('\n--- Step 7: Civic Complaints API ---');
    const civicRes = await request('/api/civic/complaints', {
      method: 'POST',
      body: {
        department: 'GHMC Roads & Buildings',
        description: 'Severe waterlogging and crater-sized pothole on Jubilee Hills Checkpost.',
        location: { lat: 17.4300, lng: 78.4200 },
      },
    });
    assert(civicRes.status === 201, 'POST /api/civic/complaints returns 201');
    assert(
      typeof civicRes.data.data.referenceId === 'string' &&
        civicRes.data.data.referenceId.startsWith('CIVIC-2026-'),
      `Generates reference ID format CIVIC-2026-XXXX (got: ${civicRes.data.data?.referenceId})`
    );

    // 8. Audit Logs API (Task 1 & 2)
    console.log('\n--- Step 8: Audit Logs API ---');
    const auditRes = await request('/api/audit-logs?limit=10');
    assert(auditRes.status === 200, 'GET /api/audit-logs returns 200');
    assert(Array.isArray(auditRes.data.data) && auditRes.data.data.length >= 3, 'Returns comprehensive audit logs');

    console.log(`\n========================================`);
    console.log(`🎯 Test Summary: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('💥 Test suite crashed:', err);
    process.exit(1);
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

runTests();
