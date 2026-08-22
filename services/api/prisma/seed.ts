import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedDatabase() {
  console.log('🌱 Starting database seed...');

  // 1. Seed Users
  const user1 = await prisma.user.upsert({
    where: { phone: '+919876543210' },
    update: {},
    create: {
      id: 'usr_rahul_sharma',
      phone: '+919876543210',
      name: 'Rahul Sharma',
      trustedContacts: JSON.stringify([
        { name: 'Pooja Sharma', phone: '+919876543211', relation: 'Spouse' },
        { name: 'Dr. Anand Verma', phone: '+919876543212', relation: 'Family Physician' },
      ]),
    },
  });

  const user2 = await prisma.user.upsert({
    where: { phone: '+919876543220' },
    update: {},
    create: {
      id: 'usr_ananya_reddy',
      phone: '+919876543220',
      name: 'Ananya Reddy',
      trustedContacts: JSON.stringify([
        { name: 'Kavitha Reddy', phone: '+919876543221', relation: 'Mother' },
      ]),
    },
  });

  const user3 = await prisma.user.upsert({
    where: { phone: '+919876543230' },
    update: {},
    create: {
      id: 'usr_vikram_singh',
      phone: '+919876543230',
      name: 'Vikram Singh',
      trustedContacts: JSON.stringify([
        { name: 'Sandeep Singh', phone: '+919876543231', relation: 'Brother' },
      ]),
    },
  });

  console.log('✅ Seeded users:', [user1.name, user2.name, user3.name]);

  // 2. Seed Hospitals
  const hospitalsData = [
    {
      id: 'hosp_apollo_jubilee',
      name: 'Apollo Health City - Jubilee Hills',
      lat: 17.4325,
      lng: 78.4071,
      capacity: 120,
      availableBeds: 18,
      contactPhone: '+914023607777',
      status: 'AVAILABLE',
      specialties: JSON.stringify(['TRAUMA_ICU', 'CARDIOLOGY', 'NEURO_SURGERY', 'STROKE_UNIT']),
    },
    {
      id: 'hosp_kims_secunderabad',
      name: 'KIMS Hospitals - Secunderabad',
      lat: 17.4399,
      lng: 78.4983,
      capacity: 90,
      availableBeds: 12,
      contactPhone: '+914044885000',
      status: 'AVAILABLE',
      specialties: JSON.stringify(['CARDIOLOGY', 'PULMONOLOGY', 'BURN_UNIT', 'TRAUMA_ICU']),
    },
    {
      id: 'hosp_care_banjara',
      name: 'CARE Hospitals - Banjara Hills',
      lat: 17.4156,
      lng: 78.4482,
      capacity: 80,
      availableBeds: 6,
      contactPhone: '+914061656565',
      status: 'AVAILABLE',
      specialties: JSON.stringify(['EMERGENCY_MEDICINE', 'CARDIAC_ICU', 'ORTHOPEDICS']),
    },
    {
      id: 'hosp_yashoda_somajiguda',
      name: 'Yashoda Hospital - Somajiguda',
      lat: 17.4262,
      lng: 78.4578,
      capacity: 110,
      availableBeds: 24,
      contactPhone: '+914045674567',
      status: 'AVAILABLE',
      specialties: JSON.stringify(['TRAUMA_ICU', 'NEPHROLOGY', 'CARDIOLOGY', 'CRITICAL_CARE']),
    },
    {
      id: 'hosp_gandhi_govt',
      name: 'Gandhi Government General Hospital',
      lat: 17.4243,
      lng: 78.5034,
      capacity: 250,
      availableBeds: 45,
      contactPhone: '+914027505566',
      status: 'AVAILABLE',
      specialties: JSON.stringify(['TRAUMA_CENTER', 'BURN_UNIT', 'MASS_CASUALTY', 'PEDIATRICS']),
    },
  ];

  for (const h of hospitalsData) {
    await prisma.hospital.upsert({
      where: { id: h.id },
      update: h,
      create: h,
    });
  }
  console.log(`✅ Seeded ${hospitalsData.length} emergency hospitals`);

  // 3. Seed Sample Active Cases
  const case1 = await prisma.case.upsert({
    where: { id: 'case_med_9021' },
    update: {},
    create: {
      id: 'case_med_9021',
      caseType: 'MEDICAL',
      status: 'AWAITING_USER',
      riskLevel: 'CRITICAL',
      userId: user1.id,
      title: 'Acute Chest Pain & Dyspnea (Suspected STEMI)',
      description: 'Patient experiencing severe radiating retrosternal pain, sweating, shortness of breath for 15 mins.',
      location: JSON.stringify({
        lat: 17.4289,
        lng: 78.4112,
        address: 'Road No. 36, Jubilee Hills, Hyderabad',
        landmark: 'Near Metro Station Pillar 1402',
        city: 'Hyderabad',
        zone: 'West Zone',
      }),
      metadata: JSON.stringify({
        symptoms: ['Chest Pain', 'Shortness of Breath', 'Diaphoresis'],
        pulse: 118,
        spo2: 92,
        aiTriageConfidence: 0.96,
        targetHospitalId: 'hosp_apollo_jubilee',
      }),
      actions: {
        create: [
          {
            id: 'act_amb_9021',
            actionType: 'AMBULANCE_DISPATCH',
            riskLevel: 'CRITICAL',
            requiresApproval: true,
            status: 'PENDING',
            payload: JSON.stringify({
              priority: 'ALS', // Advanced Life Support
              targetHospital: 'Apollo Health City - Jubilee Hills',
              estimatedEtaMins: 6,
              dispatchCoords: { lat: 17.4289, lng: 78.4112 },
            }),
          },
          {
            id: 'act_hosp_alert_9021',
            actionType: 'HOSPITAL_ALERT',
            riskLevel: 'CRITICAL',
            requiresApproval: false,
            status: 'COMPLETED',
            payload: JSON.stringify({
              hospitalId: 'hosp_apollo_jubilee',
              reservedBay: 'ICU-BAY-03',
              triageSummary: '52M Acute Coronary Syndrome, Cath Lab standby requested',
            }),
          },
        ],
      },
      events: {
        create: [
          {
            eventType: 'CASE_INITIALIZED',
            payload: JSON.stringify({ trigger: 'SOS_VOICE_CALL', caller: '+919876543210' }),
          },
          {
            eventType: 'AI_TRIAGE_COMPLETED',
            payload: JSON.stringify({ diagnosis: 'Probable Myocardial Infarction', risk: 'CRITICAL' }),
          },
          {
            eventType: 'AUTHORIZATION_REQUESTED',
            payload: JSON.stringify({ action: 'AMBULANCE_DISPATCH', timeoutSeconds: 60 }),
          },
        ],
      },
    },
  });

  const case2 = await prisma.case.upsert({
    where: { id: 'case_dis_8841' },
    update: {},
    create: {
      id: 'case_dis_8841',
      caseType: 'DISASTER',
      status: 'ACTION_EXECUTING',
      riskLevel: 'HIGH',
      userId: user2.id,
      title: 'Flash Flood Inundation & Power Line Hazard',
      description: 'Ground floor submerged with 3.5ft water. Live electrical wire fell near residential apartment entrance.',
      location: JSON.stringify({
        lat: 17.4421,
        lng: 78.4912,
        address: 'Sindhi Colony, Secunderabad',
        landmark: 'Near Hanuman Temple',
        city: 'Hyderabad',
        zone: 'North Zone',
      }),
      metadata: JSON.stringify({
        hazardType: 'FLOOD_AND_ELECTRICAL',
        trappedPersons: 4,
        waterDepthFt: 3.5,
      }),
      actions: {
        create: [
          {
            id: 'act_ndrf_8841',
            actionType: 'DISASTER_EVACUATION',
            riskLevel: 'HIGH',
            requiresApproval: true,
            status: 'EXECUTING',
            payload: JSON.stringify({
              agency: 'DRF / State Disaster Response Force',
              boatRequired: true,
              electricityGridCutoffRequested: true,
            }),
          },
        ],
      },
      events: {
        create: [
          {
            eventType: 'DISASTER_ALERT_LOGGED',
            payload: JSON.stringify({ category: 'URBAN_FLOOD' }),
          },
          {
            eventType: 'STATUS_CHANGED',
            payload: JSON.stringify({ from: 'AWAITING_USER', to: 'AUTHORIZED', actor: 'USER' }),
          },
          {
            eventType: 'ACTION_DISPATCHED',
            payload: JSON.stringify({ team: 'DRF-UNIT-07', etaMins: 11 }),
          },
        ],
      },
    },
  });

  const case3 = await prisma.case.upsert({
    where: { id: 'case_civ_7732' },
    update: {},
    create: {
      id: 'case_civ_7732',
      caseType: 'CIVIC',
      status: 'FOLLOW_UP',
      riskLevel: 'MEDIUM',
      userId: user3.id,
      title: 'Deep Uncovered Stormwater Drain on Main Road',
      description: '6-foot deep uncovered manhole on waterlogged arterial road causing heavy traffic and pedestrian danger.',
      location: JSON.stringify({
        lat: 17.4198,
        lng: 78.4411,
        address: 'Banjara Hills Road No. 12',
        landmark: 'Opposite City Center Mall',
        city: 'Hyderabad',
        zone: 'Central Zone',
      }),
      metadata: JSON.stringify({
        department: 'GHMC Engineering & Stormwater Division',
        reportedVia: 'SAATHI_CIVIC_AGENT',
      }),
      complaints: {
        create: [
          {
            department: 'GHMC Stormwater Drainage Dept',
            description: 'Uncovered 6ft storm drain presenting severe pedestrian risk',
            status: 'IN_PROGRESS',
            referenceId: 'CIVIC-2026-9042',
            location: JSON.stringify({ lat: 17.4198, lng: 78.4411 }),
          },
        ],
      },
      events: {
        create: [
          {
            eventType: 'CIVIC_COMPLAINT_REGISTERED',
            payload: JSON.stringify({ referenceId: 'CIVIC-2026-9042' }),
          },
          {
            eventType: 'OFFICIAL_TICKET_FORWARDED',
            payload: JSON.stringify({ officer: 'Executive Engineer - Ward 94' }),
          },
        ],
      },
    },
  });

  // 4. Seed Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        caseId: case1.id,
        actionId: 'act_hosp_alert_9021',
        actor: 'AI_AGENT',
        action: 'HOSPITAL_TRIAGE_ALERT_DISPATCHED',
        details: JSON.stringify({
          hospital: 'Apollo Health City',
          icuRequired: true,
          spo2: 92,
        }),
      },
      {
        caseId: case2.id,
        actionId: 'act_ndrf_8841',
        actor: 'USER',
        action: 'ACTION_APPROVED',
        details: JSON.stringify({
          userId: user2.id,
          consentGiven: true,
          authorizedAction: 'DISASTER_EVACUATION',
        }),
      },
      {
        caseId: case3.id,
        actor: 'CIVIC_DISPATCH_BOT',
        action: 'COMPLAINT_REFERENCE_GENERATED',
        details: JSON.stringify({
          referenceId: 'CIVIC-2026-9042',
          department: 'GHMC',
          priority: 'P2',
        }),
      },
    ],
  });

  console.log('✅ Seeded audit logs');
  console.log('🚀 Database seeding finished successfully!');
}

if (require.main === module) {
  seedDatabase()
    .catch((e) => {
      console.error('❌ Seeding failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
