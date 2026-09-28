async function seedSeniorReport() {
  const baseURL = 'http://localhost:4000';
  const email = 'senior.evaluator@example.com';
  const password = 'Password123!';

  console.log('--- Seeding Senior Evaluator Account ---');
  
  // Try login or signup
  let token = '';
  const loginRes = await fetch(`${baseURL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (loginRes.ok) {
    const loginData: any = await loginRes.json();
    token = loginData?.data?.tokens?.accessToken || loginData?.tokens?.accessToken;
    console.log('✓ Logged into existing account');
  } else {
    const signupRes = await fetch(`${baseURL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Alex Vance', email, password }),
    });
    const signupData: any = await signupRes.json();
    token = signupData?.data?.tokens?.accessToken || signupData?.tokens?.accessToken;
    console.log('✓ Created fresh account');
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  await fetch(`${baseURL}/profile/setup`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Alex Vance',
      jobRole: 'Principal Staff Engineer',
      department: 'Distributed Systems & Infrastructure',
      reviewYear: 2026,
    }),
  });

  // Log 3 high impact activities
  await fetch(`${baseURL}/activities`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      text: 'Architected and rolled out resilient distributed consensus layer utilizing Raft protocol, lowering median failover latency by 45%.',
      project: 'Core Infrastructure',
      category: 'Architecture',
      skills: ['Raft', 'Go', 'Distributed Systems', 'Fault Tolerance'],
      workDate: new Date('2026-09-10T11:00:00.000Z'),
    }),
  });

  await fetch(`${baseURL}/activities`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      text: 'Spearheaded zero-trust security credential rotation pipeline across 120 production microservices with zero service degradation.',
      project: 'Security & Compliance',
      category: 'Security',
      skills: ['mTLS', 'Vault', 'Kubernetes', 'Security'],
      workDate: new Date('2026-09-18T14:30:00.000Z'),
    }),
  });

  console.log('✓ Seeded activities. Generating Monthly Summary...');
  await fetch(`${baseURL}/summaries/monthly/generate`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ month: 9, year: 2026 }),
  });

  console.log('✓ Generating Annual Evaluation Report...');
  const yearlyRes = await fetch(`${baseURL}/reports/yearly/2026/generate`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ forceNewVersion: false }),
  });
  const yearlyData: any = await yearlyRes.json();
  console.log('✓ Annual report status:', yearlyRes.status, 'Version:', yearlyData?.data?.report?.version);

  console.log('\nSeed Complete! Credentials:');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
}

seedSeniorReport().catch(console.error);
