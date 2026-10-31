/**
 * Comprehensive API Integration Test Suite
 * Tests all 15 Phase 5 requirements against the Express REST API.
 */

const http = require('http');
const path = require('path');
const assert = require('assert');
const { spawnSync } = require('child_process');
const { app } = require('../src/server');
const { defaultStore } = require('../src/services/assessmentStore');
const { runPythonScript, getPythonExecutablePath } = require('../src/services/pythonRunner');

const TEST_PORT = 5001;
const BASE_URL = `http://localhost:${TEST_PORT}`;

// Sample test vectors
const SAMPLE_FEATURES_A = {
  age: 21,
  academic_year: 3,
  study_hours_per_day: 6.0,
  exam_pressure: 5.0,
  academic_performance: 80.0,
  sleep_hours: 7.5,
  physical_activity: 4.0,
  social_support: 7.0,
  screen_time: 4.5,
  internet_usage: 3.5,
  financial_stress: 3.0,
  family_expectation: 5.0,
  gender: 'Female',
};

const SAMPLE_FEATURES_B = {
  ...SAMPLE_FEATURES_A,
  stress_level: 4.0,
  anxiety_score: 3.0,
  depression_score: 2.0,
  gender: 'Male',
};

const SAMPLE_VIDEO_PATH = path.resolve(__dirname, '../../video/vidssave.com Proper Webcam Placement for Virtual Meeting 720P.mp4');

function makeRequest(method, endpoint, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let rawData = '';
      res.on('data', (chunk) => (rawData += chunk));
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(rawData);
        } catch {
          parsed = rawData;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: parsed,
        });
      });
    });

    req.on('error', reject);

    if (body !== null) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runAllTests() {
  console.log('='.repeat(65));
  console.log('Starting Phase 5 Express REST API Integration Test Suite');
  console.log('='.repeat(65));

  let serverInstance = null;
  let passedCount = 0;
  let failedCount = 0;

  defaultStore.clear();

  const testRunner = async (name, fn) => {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passedCount++;
    } catch (err) {
      console.error(`[FAIL] ${name}`);
      console.error(`       Error: ${err.message}`);
      failedCount++;
    }
  };

  try {
    // Start test server instance on dedicated port 5001
    await new Promise((resolve) => {
      serverInstance = app.listen(TEST_PORT, () => {
        resolve();
      });
    });

    // Test 1: Health endpoint
    await testRunner('Test 1: GET /api/health returns 200 and modelsReady true', async () => {
      const res = await makeRequest('GET', '/api/health');
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.status, 'ok');
      assert.strictEqual(res.body.modelsReady, true);
    });

    // Test 2: Model A successful prediction
    let modelA_Id = null;
    await testRunner('Test 2: POST /api/predictions/burnout/model-a returns finite prediction', async () => {
      const res = await makeRequest('POST', '/api/predictions/burnout/model-a', {
        features: SAMPLE_FEATURES_A,
      });
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.model, 'model_a');
      assert.strictEqual(typeof res.body.prediction, 'number');
      assert.ok(Number.isFinite(res.body.prediction));
      assert.ok(res.body.assessmentId);
      modelA_Id = res.body.assessmentId;
    });

    // Test 3: Model B successful prediction
    let modelB_Id = null;
    await testRunner('Test 3: POST /api/predictions/burnout/model-b returns finite prediction', async () => {
      const res = await makeRequest('POST', '/api/predictions/burnout/model-b', {
        features: SAMPLE_FEATURES_B,
      });
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.model, 'model_b');
      assert.strictEqual(typeof res.body.prediction, 'number');
      assert.ok(Number.isFinite(res.body.prediction));
      assert.ok(res.body.assessmentId);
      modelB_Id = res.body.assessmentId;
    });

    // Test 4: Missing fields rejected with 400
    await testRunner('Test 4: Missing required fields rejected with HTTP 400', async () => {
      const incomplete = { ...SAMPLE_FEATURES_A };
      delete incomplete.study_hours_per_day;

      const res = await makeRequest('POST', '/api/predictions/burnout/model-a', {
        features: incomplete,
      });
      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error.code, 'INVALID_INPUT');
    });

    // Test 5: Invalid gender or numeric input rejected
    await testRunner('Test 5: Invalid gender or boolean/string numeric rejected with 400', async () => {
      // Invalid gender
      const badGender = { ...SAMPLE_FEATURES_A, gender: 'InvalidGender' };
      const res1 = await makeRequest('POST', '/api/predictions/burnout/model-a', { features: badGender });
      assert.strictEqual(res1.statusCode, 400);
      assert.strictEqual(res1.body.error.code, 'INVALID_INPUT');

      // Boolean as number
      const badNum = { ...SAMPLE_FEATURES_A, sleep_hours: true };
      const res2 = await makeRequest('POST', '/api/predictions/burnout/model-a', { features: badNum });
      assert.strictEqual(res2.statusCode, 400);
      assert.strictEqual(res2.body.error.code, 'INVALID_INPUT');

      // Target leakage rejected
      const leakage = { ...SAMPLE_FEATURES_A, mental_health_index: 5.0 };
      const res3 = await makeRequest('POST', '/api/predictions/burnout/model-a', { features: leakage });
      assert.strictEqual(res3.statusCode, 400);
      assert.strictEqual(res3.body.error.code, 'INVALID_INPUT');
    });

    // Test 6: Unknown routes return JSON 404
    await testRunner('Test 6: Unknown route returns JSON 404', async () => {
      const res = await makeRequest('GET', '/api/unknown-service-path');
      assert.strictEqual(res.statusCode, 404);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error.code, 'NOT_FOUND');
    });

    // Test 7: Successful predictions create history records
    await testRunner('Test 7: Predictions automatically generate history records', async () => {
      const res = await makeRequest('GET', '/api/assessments');
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.count >= 2);
      const ids = res.body.data.map((r) => r.id);
      assert.ok(ids.includes(modelA_Id));
      assert.ok(ids.includes(modelB_Id));
    });

    // Test 8: History list, retrieve, and delete behavior
    await testRunner('Test 8: History get by ID and delete by ID work correctly', async () => {
      // Retrieve model A record
      const getRes = await makeRequest('GET', `/api/assessments/${modelA_Id}`);
      assert.strictEqual(getRes.statusCode, 200);
      assert.strictEqual(getRes.body.data.id, modelA_Id);
      assert.strictEqual(getRes.body.data.model, 'model_a');

      // Delete model A record
      const delRes = await makeRequest('DELETE', `/api/assessments/${modelA_Id}`);
      assert.strictEqual(delRes.statusCode, 200);
      assert.strictEqual(delRes.body.success, true);

      // Verify it is gone
      const checkRes = await makeRequest('GET', `/api/assessments/${modelA_Id}`);
      assert.strictEqual(checkRes.statusCode, 404);
      assert.strictEqual(checkRes.body.error.code, 'NOT_FOUND');
    });

    // Test 9: Invalid assessment IDs return 404
    await testRunner('Test 9: Non-existent assessment IDs return 404', async () => {
      const res = await makeRequest('GET', '/api/assessments/00000000-0000-0000-0000-000000000000');
      assert.strictEqual(res.statusCode, 404);
      assert.strictEqual(res.body.error.code, 'NOT_FOUND');

      const delRes = await makeRequest('DELETE', '/api/assessments/00000000-0000-0000-0000-000000000000');
      assert.strictEqual(delRes.statusCode, 404);
      assert.strictEqual(delRes.body.error.code, 'NOT_FOUND');
    });

    // Test 10: Python process timeout handling
    await testRunner('Test 10: Process timeout handling triggers 504 TIMEOUT error', async () => {
      // Test the pythonRunner directly with a 1ms timeout on python
      let caught = null;
      try {
        await runPythonScript('predict_burnout.py', {
          stdinData: { model: 'model_a', features: SAMPLE_FEATURES_A },
          timeout: 1, // 1 millisecond guaranteed timeout
        });
      } catch (err) {
        caught = err;
      }

      assert.ok(caught !== null, 'Expected timeout error');
      assert.strictEqual(caught.code, 'TIMEOUT');
      assert.strictEqual(caught.statusCode, 504);
    });

    // Test 11: Malformed Python stdout handling
    await testRunner('Test 11: Malformed stdout triggers 502 MALFORMED_OUTPUT error', async () => {
      // Using python executable to run inline code emitting invalid non-JSON output
      const pythonExe = getPythonExecutablePath();
      let caught = null;
      try {
        await runPythonScript('predict_burnout.py', {
          args: ['-c', 'import sys; sys.stdout.write("MALFORMED NON JSON"); sys.exit(0)'],
          customPythonPath: pythonExe,
          customSpawn: (exe, args, opts) => {
            // Spawn node or python emitting bad output
            const { spawn } = require('child_process');
            return spawn(pythonExe, ['-c', 'print("BROKEN JSON STRING")'], opts);
          },
        });
      } catch (err) {
        caught = err;
      }

      assert.ok(caught !== null, 'Expected malformed output error');
      assert.strictEqual(caught.code, 'MALFORMED_OUTPUT');
      assert.strictEqual(caught.statusCode, 502);
    });

    // Test 12: Emotion endpoint rejects paths outside allowlist
    await testRunner('Test 12: Emotion endpoint rejects paths outside allowlist with 403', async () => {
      const res = await makeRequest('POST', '/api/predictions/emotion', {
        video_path: 'C:/Windows/System32/cmd.exe',
      });
      assert.strictEqual(res.statusCode, 403);
      assert.strictEqual(res.body.error.code, 'PATH_NOT_ALLOWED');
    });

    // Test 13: Emotion endpoint handles valid local video
    await testRunner('Test 13: Emotion endpoint processes sample video successfully', async () => {
      const res = await makeRequest('POST', '/api/predictions/emotion', {
        video_path: SAMPLE_VIDEO_PATH,
      });

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.model, 'emotion_svm');
      assert.ok(res.body.prediction.label);
      assert.ok(res.body.prediction.class_probabilities);
      assert.ok(res.body.assessmentId);

      // Verify separate emotion history storage
      const histRes = await makeRequest('GET', `/api/assessments/${res.body.assessmentId}`);
      assert.strictEqual(histRes.statusCode, 200);
      assert.strictEqual(histRes.body.data.type, 'emotion');
    });

    // Test 14: Structured error returned without leaking paths or traces
    await testRunner('Test 14: Non-existent video returns structured error without path leak', async () => {
      const res = await makeRequest('POST', '/api/predictions/emotion', {
        video_path: path.resolve(__dirname, '../../../video/non_existent.mp4'),
      });
      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error.code, 'INVALID_VIDEO_PATH');
      assert.ok(!JSON.stringify(res.body).includes('Traceback'));
      assert.ok(!JSON.stringify(res.body).includes('D:\\dsp project 2'));
    });

    // Test 15: Run existing Python inference suites
    await testRunner('Test 15: Existing Python burnout and emotion test suites pass', async () => {
      const pythonExe = getPythonExecutablePath();
      const burnoutTest = path.resolve(__dirname, '../inference/test_burnout_inference.py');
      const emotionTest = path.resolve(__dirname, '../inference/test_emotion_inference.py');

      const bRes = spawnSync(pythonExe, [burnoutTest], { encoding: 'utf8' });
      assert.strictEqual(bRes.status, 0, `Burnout tests failed: ${bRes.stderr || bRes.stdout}`);

      const eRes = spawnSync(pythonExe, [emotionTest], { encoding: 'utf8' });
      assert.strictEqual(eRes.status, 0, `Emotion tests failed: ${eRes.stderr || eRes.stdout}`);
    });

  } finally {
    if (serverInstance) {
      await new Promise((resolve) => serverInstance.close(resolve));
    }
  }

  console.log('='.repeat(65));
  console.log(`Test Suite Finished: ${passedCount} passed, ${failedCount} failed out of 15 tests.`);
  console.log('='.repeat(65));

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests };
