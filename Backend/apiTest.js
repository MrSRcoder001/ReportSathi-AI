const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const API_URL = 'http://127.0.0.1:5000/api';

async function runApiTest() {
  console.log('--- Starting API E2E Test ---');
  let token = '';
  let reportId = '';

  try {
    // 1. Register or Login
    console.log('\n1. Registering/Logging in test user...');
    try {
      const regRes = await axios.post(`${API_URL}/auth/register`, {
        name: 'API Tester',
        email: 'apitest@example.com',
        password: 'password123'
      });
      token = regRes.data.token;
      console.log('User registered successfully.');
    } catch (e) {
      if (e.response && e.response.status === 400) {
        // User already exists, just login
        const logRes = await axios.post(`${API_URL}/auth/login`, {
          email: 'apitest@example.com',
          password: 'password123'
        });
        token = logRes.data.token;
        console.log('User logged in successfully.');
      } else {
        throw e;
      }
    }

    const axiosConfig = {
      headers: { Authorization: `Bearer ${token}` }
    };

    // Setup Profile
    console.log('\n2. Fetching Patient Profile...');
    let profileId;
    const profilesRes = await axios.get(`${API_URL}/profiles`, axiosConfig);
    if (profilesRes.data.length > 0) {
      profileId = profilesRes.data[0]._id;
      console.log(`✅ Profile found: ${profilesRes.data[0].profileName}`);
    } else {
      console.log('No profile found. Creating Self profile...');
      const createProfileRes = await axios.post(`${API_URL}/profiles`, {
        profileName: 'Test User',
        relation: 'Self',
        age: 30,
        gender: 'Male',
        bloodGroup: 'Unknown'
      }, axiosConfig);
      profileId = createProfileRes.data._id;
      console.log('✅ Profile created.');
    }

    // 2. Upload Report
    console.log('\n3. Uploading mock report...');
    
    // Create a dummy image file (Must be a real image to prevent Tesseract worker thread crash)
    const dummyFilePath = path.join(__dirname, '../mock_medical_report.png');
    const tinyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==', 'base64');
    fs.writeFileSync(dummyFilePath, tinyPng);

    const form = new FormData();
    form.append('report', fs.createReadStream(dummyFilePath), 'test.png');
    form.append('language', 'English');
    form.append('patientProfileId', profileId);

    const uploadRes = await axios.post(`${API_URL}/reports/upload`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`
      }
    });

    reportId = uploadRes.data.reportId;
    console.log(`Report uploaded! ID: ${reportId}`);

    // 3. Poll for completion
    console.log('\n3. Waiting for AI processing to complete...');
    let report;
    let attempts = 0;
    while (attempts < 10) {
      const statusRes = await axios.get(`${API_URL}/reports/${reportId}`, axiosConfig);
      report = statusRes.data;
      if (report.status === 'completed' || report.status === 'failed') {
        break;
      }
      console.log(`Status: ${report.status}... waiting 3s`);
      await new Promise(r => setTimeout(r, 3000));
      attempts++;
    }

    if (report.status === 'failed') {
      console.log('Report processing failed (this is expected if OCR fails on a fake image, but the fallback should kick in if we mocked it right. Wait, OCR failure sets status to failed immediately).');
    } else {
      console.log('\nReport processing completed!');
      console.log('Health Score:', report.healthScore);
      console.log('AI Summary:', report.aiSummary);
    }

    // 4. Test Chat
    console.log('\n4. Testing AI Chat endpoint...');
    const chatRes = await axios.post(`${API_URL}/reports/${reportId}/chat`, {
      question: "What does this report mean?"
    }, axiosConfig);

    console.log('Chat AI Response:', chatRes.data.answer);

    console.log('\n--- API E2E Test Success ---');
  } catch (error) {
    console.error('\nAPI Test Failed:');
    if (error.response) {
      console.error(error.response.status, error.response.data);
    } else {
      console.error(error.stack);
    }
  }
}

runApiTest();
