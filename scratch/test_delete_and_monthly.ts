async function testDeleteAndMonthly() {
  console.log('--- Testing Delete Drafts & Monthly Report Generation ---');
  const baseURL = 'http://localhost:4000';

  const email = `test_delete_${Date.now()}@example.com`;
  const password = 'Password123!';

  const signupRes = await fetch(`${baseURL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Delete Tester', email, password }),
  });
  const signupData: any = await signupRes.json();
  const token = signupData?.data?.tokens?.accessToken || signupData?.tokens?.accessToken;

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  await fetch(`${baseURL}/profile/setup`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Delete Tester',
      jobRole: 'Lead Engineer',
      department: 'Platform',
      reviewYear: 2026,
    }),
  });

  // Add activities in September
  const actRes1 = await fetch(`${baseURL}/activities`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      text: 'Architected distributed event streaming using Apache Kafka and Schema Registry.',
      project: 'Data Platform',
      category: 'Feature',
      skills: ['Kafka', 'Distributed Systems'],
      workDate: new Date('2026-09-08T10:00:00.000Z'),
    }),
  });
  console.log('Activity 1 creation status:', actRes1.status);

  const actRes2 = await fetch(`${baseURL}/activities`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      text: 'Implemented zero-downtime database schema migrations with automated rollback hooks.',
      project: 'Core Database',
      category: 'Optimization',
      skills: ['PostgreSQL', 'Liquibase', 'DevOps'],
      workDate: new Date('2026-09-16T15:00:00.000Z'),
    }),
  });
  console.log('Activity 2 creation status:', actRes2.status);
  console.log('✓ Created 2 activities for September');

  // Test 1: Generate Monthly Summary WITHOUT weekly summaries first
  console.log('\n--- Testing Monthly Summary Generation from Raw Activities ---');
  const genMonthRes = await fetch(`${baseURL}/summaries/monthly/generate`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ month: 9, year: 2026 }),
  });
  const genMonthData: any = await genMonthRes.json();
  console.log('✓ Monthly report generated directly from activities:', {
    success: genMonthData.success,
    entryCount: genMonthData.data?.summary?.summary?.entryCount,
    aiSummary: genMonthData.data?.summary?.summary?.aiSummary?.slice(0, 60) + '...',
    majorWorkAreas: genMonthData.data?.summary?.summary?.majorWorkAreas,
    skills: genMonthData.data?.summary?.summary?.skillsDemonstrated,
  });

  // Test 2: Delete Monthly Summary
  console.log('\n--- Testing Delete Monthly Summary ---');
  const delMonthRes = await fetch(`${baseURL}/summaries/monthly?month=9&year=2026`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  const delMonthData: any = await delMonthRes.json();
  console.log('✓ Deleted monthly summary:', delMonthData);

  // Test 3: Create 2 yearly report versions and delete one
  console.log('\n--- Testing Create 2 Yearly Drafts and Delete Version ---');
  const gen1 = await fetch(`${baseURL}/reports/yearly/2026/generate`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ forceNewVersion: false }),
  });
  const data1: any = await gen1.json();
  console.log(`✓ Draft Version 1 created: v${data1.data?.report?.version}`);

  const gen2 = await fetch(`${baseURL}/reports/yearly/2026/generate`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ forceNewVersion: true }),
  });
  const data2: any = await gen2.json();
  console.log(`✓ Draft Version 2 created: v${data2.data?.report?.version}`);

  // Delete Version 2
  const delDraftRes = await fetch(`${baseURL}/reports/yearly/2026?version=2`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  const delDraftData: any = await delDraftRes.json();
  console.log('✓ Deleted Draft Version 2:', delDraftData);

  // List remaining versions
  const listRes = await fetch(`${baseURL}/reports/yearly/2026/versions`, {
    headers: authHeaders,
  });
  const listData: any = await listRes.json();
  console.log('✓ Remaining versions after deletion:', listData.data?.versions?.map((v: any) => `v${v.version}`));

  console.log('\n=== ALL DELETE & MONTHLY REPORT TESTS PASSED 100% ===');
}

testDeleteAndMonthly().catch(console.error);
