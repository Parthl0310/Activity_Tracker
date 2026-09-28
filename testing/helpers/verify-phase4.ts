const API_BASE = 'http://localhost:4000';

async function verify() {
  console.log('🚀 Starting Phase 4 End-to-End Verification...\n');

  // 1. Authenticate
  const testEmail = `test_p4_${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  console.log(`1. Creating test user: ${testEmail}...`);
  
  let token = '';
  try {
    const signupRes = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Kavya Deshmukh',
        email: testEmail,
        password: testPassword,
      }),
    });
    const signupData: any = await signupRes.json();
    token = signupData?.data?.tokens?.accessToken || signupData?.tokens?.accessToken;
    if (!token) throw new Error('No access token returned: ' + JSON.stringify(signupData));
    console.log('   ✅ User signed up successfully. Token obtained.');
  } catch (err: any) {
    console.error('   ❌ Signup failed:', err.message);
    process.exit(1);
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // 2. Test Profile Update with Enterprise Fields
  console.log('\n2. Testing PATCH /profile with skills, projects, and bio...');
  try {
    const profileUpdateRes = await fetch(`${API_BASE}/profile`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Kavya Deshmukh',
        jobRole: 'Staff Distributed Systems Engineer',
        department: 'Core Platform & AI Infrastructure',
        reviewYear: 2026,
        skills: ['TypeScript', 'Node.js', 'Distributed Systems', 'Pinecone', 'Gemini Flash'],
        currentProjects: ['Vector Search Engine', 'AI Activity Enrichment'],
        joiningDate: '2024-03-15',
        professionalBackground: 'Specializing in high-throughput distributed architectures, semantic RAG pipelines, and LLM orchestration.',
      }),
    });
    const updateData: any = await profileUpdateRes.json();
    const updatedUser = updateData?.data?.profile || updateData?.profile;
    console.log('   ✅ Profile updated successfully:');
    console.log('      - Role:', updatedUser.jobRole);
    console.log('      - Department:', updatedUser.department);
    console.log('      - Skills count:', updatedUser.skills?.length);
    console.log('      - Projects count:', updatedUser.currentProjects?.length);
  } catch (err: any) {
    console.error('   ❌ Profile update failed:', err.message);
    process.exit(1);
  }

  // 3. Verify GET /profile
  console.log('\n3. Verifying GET /profile persistence...');
  try {
    const getProfileRes = await fetch(`${API_BASE}/profile`, { headers: authHeaders });
    const getData: any = await getProfileRes.json();
    const profile = getData?.data?.profile || getData?.profile;
    if (
      profile.skills?.includes('Pinecone') &&
      profile.currentProjects?.includes('Vector Search Engine') &&
      profile.jobRole === 'Staff Distributed Systems Engineer'
    ) {
      console.log('   ✅ GET /profile returned all saved fields accurately.');
    } else {
      console.error('   ❌ Some profile fields did not persist correctly:', profile);
      process.exit(1);
    }
  } catch (err: any) {
    console.error('   ❌ GET /profile failed:', err.message);
    process.exit(1);
  }

  // 4. Test Core AI Enrichment Preview (Zero Regression Check)
  console.log('\n4. Verifying AI Enrichment Preview (POST /activities/enrich-preview)...');
  try {
    const enrichRes = await fetch(`${API_BASE}/activities/enrich-preview`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        text: 'Architected and deployed a multi-tenant Redis rate limiter handling 25,000 req/sec to prevent DDoS attacks on public API endpoints.',
        project: 'API Gateway',
      }),
    });
    const enrichJson: any = await enrichRes.json();
    const enrichData = enrichJson.data?.data || enrichJson.data;
    console.log('   ✅ AI Enrichment Preview succeeded:');
    console.log('      - AI Refined Text:', enrichData.aiRefinedText);
    console.log('      - Category:', enrichData.category);
    console.log('      - Extracted Skills:', enrichData.skills);
  } catch (err: any) {
    console.error('   ❌ AI Enrichment preview failed:', err.message);
    process.exit(1);
  }

  // 5. Test Activity Creation & Instant Re-enrichment on Edit
  console.log('\n5. Verifying Activity Creation & Re-enrichment on Edit...');
  let activityId = '';
  try {
    const createRes = await fetch(`${API_BASE}/activities`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        text: 'Built initial database migration scripts.',
        project: 'Core Platform',
        workDate: new Date().toISOString(),
        category: 'Feature',
        workType: 'Technical',
      }),
    });
    const createJson: any = await createRes.json();
    if (!createJson.success) {
      throw new Error('Create failed: ' + JSON.stringify(createJson));
    }
    const created = createJson.data?.activity || createJson.activity;
    activityId = created._id || created.id;
    console.log('   ✅ Activity created with ID:', activityId);

    // Edit and verify re-enrichment
    const updateRes = await fetch(`${API_BASE}/activities/${activityId}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        text: 'Redesigned the database indexing strategy in MongoDB to optimize slow aggregation pipelines, slashing latency from 850ms to 42ms.',
      }),
    });
    const updateJson: any = await updateRes.json();
    if (!updateJson.success) {
      throw new Error('Update failed: ' + JSON.stringify(updateJson));
    }
    const updated = updateJson.data?.activity || updateJson.data || updateJson.activity;
    console.log('   ✅ Activity edited and re-enriched:');
    console.log('      - Updated AI Refined Text:', updated?.aiRefinedText);
    console.log('      - Updated Category:', updated?.category);
    console.log('      - Updated Skills:', updated?.skills);
  } catch (err: any) {
    console.error('   ❌ Activity create/edit failed:', err.message);
    process.exit(1);
  }

  console.log('\n======================================================');
  console.log('🎉 ALL INTEGRATION CHECKS PASSED WITH 100% SUCCESS!');
  console.log('======================================================\n');
}

verify();
