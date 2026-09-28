async function debug() {
  const baseURL = 'http://localhost:4000';
  const email = `debug_test_${Date.now()}@example.com`;
  const password = 'Password123!';

  const signupRes = await fetch(`${baseURL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Debug User', email, password }),
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
      name: 'Debug User',
      jobRole: 'Software Engineer',
      department: 'Core',
      reviewYear: 2026,
    }),
  });

  await fetch(`${baseURL}/activities`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      text: 'Developed automated deployment system for Kubernetes clusters.',
      project: 'Core Infrastructure',
      category: 'Engineering',
      workDate: new Date('2026-05-10T10:00:00.000Z'),
    }),
  });

  console.log('Generating Report 1...');
  const res1 = await fetch(`${baseURL}/reports/yearly/2026/generate`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ forceNewVersion: false }),
  });
  const data1: any = await res1.json();
  console.log('Report 1 status code:', res1.status, 'Response:', JSON.stringify(data1));

  console.log('Generating Report 2 with forceNewVersion: true...');
  const res2 = await fetch(`${baseURL}/reports/yearly/2026/generate`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ forceNewVersion: true }),
  });
  const data2: any = await res2.json();
  console.log('Report 2 status code:', res2.status, 'Response:', JSON.stringify(data2));
}

debug().catch(console.error);
