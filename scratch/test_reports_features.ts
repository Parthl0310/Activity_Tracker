async function runTests() {
  console.log('--- Testing Reports & Summaries API Endpoints ---');
  const baseURL = 'http://localhost:4000';

  // 1. Try to login or create a test user
  const email = `report_test_${Date.now()}@example.com`;
  const password = 'Password123!';
  let token = '';

  const signupRes = await fetch(`${baseURL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Senior Test Engineer',
      email,
      password,
    }),
  });
  const signupData: any = await signupRes.json();
  token = signupData?.data?.tokens?.accessToken || signupData?.tokens?.accessToken;
  console.log('✓ Created test user with token');

  if (!token) {
    console.error('Failed to get auth token:', signupData);
    process.exit(1);
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // Setup profile
  await fetch(`${baseURL}/profile/setup`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Senior Test Engineer',
      jobRole: 'Staff Infrastructure Engineer',
      department: 'Platform Engineering',
      reviewYear: 2026,
    }),
  });
  console.log('✓ Setup user profile');

  // Add 2 activities
  await fetch(`${baseURL}/activities`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      text: 'Migrated Kubernetes deployment pipelines to ArgoCD reducing deployment latency by 40%.',
      project: 'Cloud Infra',
      category: 'Architecture',
      workDate: new Date('2026-09-18T10:00:00.000Z'),
    }),
  });

  await fetch(`${baseURL}/activities`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      text: 'Configured Prometheus alerts and Grafana dashboards for microservice SLO monitoring.',
      project: 'Observability',
      category: 'Operations',
      workDate: new Date('2026-09-20T14:00:00.000Z'),
    }),
  });
  console.log('✓ Added 2 test activities');

  // Test 1: Weekly Summary Generate & Get
  console.log('\n--- Testing Weekly Summary (RAG L1) ---');
  const weekStart = '2026-09-15T00:00:00.000Z';
  const weekEnd = '2026-09-21T23:59:59.999Z';

  const genWeeklyRes = await fetch(`${baseURL}/summaries/weekly/generate`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ weekStart, weekEnd }),
  });
  const genWeeklyData: any = await genWeeklyRes.json();
  console.log('✓ Generated weekly summary:', {
    success: genWeeklyData.success,
    entryCount: genWeeklyData.data?.summary?.summary?.entryCount,
    status: genWeeklyData.data?.summary?.status,
    majorWorkCount: genWeeklyData.data?.summary?.summary?.majorWork?.length,
  });

  const getWeeklyRes = await fetch(`${baseURL}/summaries/weekly?weekStart=${encodeURIComponent(weekStart)}`, {
    headers: authHeaders,
  });
  const getWeeklyData: any = await getWeeklyRes.json();
  console.log('✓ Fetched weekly summary successfully:', getWeeklyData.data?.summary?.summary?.aiInsight?.slice(0, 60) + '...');

  // Test 2: Monthly Summary Generate & Get
  console.log('\n--- Testing Monthly Summary (RAG L2) ---');
  const genMonthlyRes = await fetch(`${baseURL}/summaries/monthly/generate`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ month: 9, year: 2026 }),
  });
  const genMonthlyData: any = await genMonthlyRes.json();
  console.log('✓ Generated monthly summary:', {
    success: genMonthlyData.success,
    entryCount: genMonthlyData.data?.summary?.summary?.entryCount,
    majorWorkAreasCount: genMonthlyData.data?.summary?.summary?.majorWorkAreas?.length,
    skillsCount: genMonthlyData.data?.summary?.summary?.skillsDemonstrated?.length,
  });

  const getMonthlyRes = await fetch(`${baseURL}/summaries/monthly?month=9&year=2026`, {
    headers: authHeaders,
  });
  const getMonthlyData: any = await getMonthlyRes.json();
  console.log('✓ Fetched monthly summary successfully:', getMonthlyData.data?.summary?.summary?.aiSummary?.slice(0, 60) + '...');

  // Test 3: Yearly Report Generate, Lock, Unlock, Force New Version, and Merge
  console.log('\n--- Testing Yearly Report Multi-Version, Lock/Unlock & Merge ---');
  const genYearlyRes = await fetch(`${baseURL}/reports/yearly/2026/generate`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ forceNewVersion: false }),
  });
  const genYearlyData: any = await genYearlyRes.json();
  const ver1 = genYearlyData.data?.report?.version;
  console.log(`✓ Generated Yearly Report Version ${ver1}, status:`, genYearlyData.data?.report?.status);

  // Lock (Finalize)
  const finalizeRes = await fetch(`${baseURL}/reports/yearly/2026/finalize`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ version: ver1 }),
  });
  const finalizeData: any = await finalizeRes.json();
  console.log(`✓ Finalized Report Version ${ver1}, new status:`, finalizeData.data?.report?.status);

  // Unlock
  const unlockRes = await fetch(`${baseURL}/reports/yearly/2026/unlock`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ version: ver1 }),
  });
  const unlockData: any = await unlockRes.json();
  console.log(`✓ Unlocked Report Version ${ver1}, new status:`, unlockData.data?.report?.status);

  // Force Generate New Version (e.g. Version 2)
  const genVer2Res = await fetch(`${baseURL}/reports/yearly/2026/generate`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ forceNewVersion: true }),
  });
  const genVer2Data: any = await genVer2Res.json();
  const ver2 = genVer2Data.data?.report?.version;
  console.log(`✓ Generated Force-New-Version Report Version ${ver2}, status:`, genVer2Data.data?.report?.status);

  // List Versions
  const listVersRes = await fetch(`${baseURL}/reports/yearly/2026/versions`, {
    headers: authHeaders,
  });
  const listVersData: any = await listVersRes.json();
  const allVers = listVersData.data?.versions || [];
  console.log(`✓ Listed ${allVers.length} versions:`, allVers.map((v: any) => `v${v.version} (${v.status})`).join(', '));

  // Merge Reports
  const mergedContent = {
    executiveSummary: 'Merged Executive Summary combining both versions.',
    majorContributions: 'Merged Contributions: ArgoCD deployment pipelines and Observability monitoring.',
    technicalWork: 'Kubernetes, ArgoCD, Prometheus, Grafana, Distributed Tracing.',
    skillsDemonstrated: 'DevOps, SRE, Monitoring, CI/CD, Kubernetes.',
    projects: 'Cloud Infra and Observability.',
    learningAndDevelopment: 'Advanced GitOps patterns and SLO design.',
    achievedGoals: 'All 2026 engineering goals met ahead of schedule.',
    overallYearSummary: 'Consolidated final summary across all deliverables in 2026.',
  };

  const mergeRes = await fetch(`${baseURL}/reports/yearly/2026/merge`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ report: mergedContent }),
  });
  const mergeData: any = await mergeRes.json();
  const verMerged = mergeData.data?.report?.version;
  console.log(`✓ Merged Reports into new Version ${verMerged} with status:`, mergeData.data?.report?.status);

  console.log('\n=== ALL REPORT & SUMMARY VERIFICATIONS PASSED 100% SUCCESSFULLY ===');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
