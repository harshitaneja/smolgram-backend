import db from './db';

async function seed() {
  console.log('Seeding database...');

  // Create experiment
  const expId = 'exp-001';
  await db.query(
    `INSERT IGNORE INTO experiments (id, name, description, status) 
     VALUES (?, ?, ?, ?)`,
    [expId, 'Smolgram Pilot Study', 'First pilot study with demetrication', 'ACTIVE']
  );

  // Create treatments
  const treatments = [
    { id: 'tr-control', name: 'Control', demetricate: false },
    { id: 'tr-demetricate', name: 'Demetrication', demetricate: true },
  ];

  for (const t of treatments) {
    await db.query(
      `INSERT IGNORE INTO treatments (id, experimentId, name, demetricate, config) 
       VALUES (?, ?, ?, ?, '{}')`,
      [t.id, expId, t.name, t.demetricate]
    );
  }

  // Create sample participants  
  const participants = [
    { id: 'P-E1-01', authcode: '101010', treatmentId: 'tr-control' },
    { id: 'P-E1-02', authcode: '121212', treatmentId: 'tr-demetricate' },
    { id: 'P-E1-03', authcode: '131313', treatmentId: 'tr-control' },
    { id: 'P-E1-04', authcode: '141414', treatmentId: 'tr-control' },
    { id: 'P-E1-05', authcode: '151515', treatmentId: 'tr-demetricate' },
  ];

  for (const p of participants) {
    await db.query(
      `INSERT IGNORE INTO participants (id, authcode, experimentId, treatmentId) 
       VALUES (?, ?, ?, ?)`,
      [p.id, p.authcode, expId, p.treatmentId]
    );
  }

  console.log('✓ Seeded: 1 experiment, 2 treatments, 5 participants');
  console.log('  Demo codes: 922922 (demetricated), 422422 (control)');
  console.log('  Real codes: 101010, 121212, 131313, 141414, 151515');
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });
