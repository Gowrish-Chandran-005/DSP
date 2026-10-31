/**
 * Python Runner Service
 * Spawns isolated Python child processes to execute ML inference modules.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Resolves the path to the virtual environment Python executable.
 */
function getPythonExecutablePath() {
  const backendRoot = path.resolve(__dirname, '../../');
  const isWindows = process.platform === 'win32';
  const pythonPath = isWindows
    ? path.join(backendRoot, '.venv', 'Scripts', 'python.exe')
    : path.join(backendRoot, '.venv', 'bin', 'python');

  return pythonPath;
}

/**
 * Executes a Python inference script within the backend virtual environment.
 *
 * @param {string} scriptName - Name of script inside backend/inference (e.g. 'predict_burnout.py')
 * @param {Object} options
 * @param {Array<string>} [options.args=[]] - CLI arguments for the script
 * @param {Object|string} [options.stdinData=null] - Object or string to stream to stdin
 * @param {number} [options.timeout=25000] - Execution timeout in ms
 * @param {number} [options.maxBuffer=1048576] - Maximum allowed stdout/stderr in bytes (1MB)
 * @param {Function} [options.customSpawn=null] - Optional injectable spawn for testing seams
 * @param {string} [options.customPythonPath=null] - Optional override for Python executable
 * @returns {Promise<Object>} Resolves with parsed JSON stdout from Python script
 */
function runPythonScript(scriptName, options = {}) {
  const {
    args = [],
    stdinData = null,
    timeout = 25000,
    maxBuffer = 1024 * 1024,
    customSpawn = null,
    customPythonPath = null,
  } = options;

  return new Promise((resolve, reject) => {
    const pythonExe = customPythonPath || getPythonExecutablePath();
    const scriptPath = path.resolve(__dirname, '../../inference', scriptName);

    // Verify script exists unless custom spawn injected
    if (!customSpawn && !fs.existsSync(scriptPath)) {
      return reject({
        code: 'SCRIPT_NOT_FOUND',
        message: 'Inference script not found.',
        statusCode: 500,
      });
    }

    const spawnFn = customSpawn || spawn;
    const spawnArgs = [scriptPath, ...args];

    let child;
    try {
      child = spawnFn(pythonExe, spawnArgs, {
        shell: false,
        windowsHide: true,
      });
    } catch (err) {
      return reject({
        code: 'SPAWN_ERROR',
        message: 'Failed to launch inference process.',
        statusCode: 500,
      });
    }

    let stdoutBuffer = '';
    let stderrBuffer = '';
    let isTerminated = false;
    let timer = null;

    const cleanupAndKill = (reasonCode, reasonMessage, statusCode = 500) => {
      if (isTerminated) return;
      isTerminated = true;
      if (timer) clearTimeout(timer);

      try {
        if (!child.killed) {
          child.kill('SIGKILL');
        }
      } catch (kErr) {
        // Ignore kill errors
      }

      reject({
        code: reasonCode,
        message: reasonMessage,
        statusCode,
      });
    };

    // Timeout guard
    if (timeout > 0) {
      timer = setTimeout(() => {
        cleanupAndKill('TIMEOUT', 'Inference process timed out.', 504);
      }, timeout);
    }

    if (child.stdout) {
      child.stdout.setEncoding('utf8');
      child.stdout.on('data', (chunk) => {
        stdoutBuffer += chunk;
        if (Buffer.byteLength(stdoutBuffer, 'utf8') > maxBuffer) {
          cleanupAndKill('OUTPUT_LIMIT_EXCEEDED', 'Inference process output exceeded maximum buffer limit.', 500);
        }
      });
    }

    if (child.stderr) {
      child.stderr.setEncoding('utf8');
      child.stderr.on('data', (chunk) => {
        stderrBuffer += chunk;
        if (Buffer.byteLength(stderrBuffer, 'utf8') > maxBuffer) {
          cleanupAndKill('OUTPUT_LIMIT_EXCEEDED', 'Inference process stderr exceeded maximum buffer limit.', 500);
        }
      });
    }

    child.on('error', (err) => {
      cleanupAndKill('PROCESS_ERROR', 'Inference process encountered an error.', 500);
    });

    child.on('close', (exitCode) => {
      if (isTerminated) return;
      isTerminated = true;
      if (timer) clearTimeout(timer);

      const trimmedStdout = stdoutBuffer.trim();

      if (!trimmedStdout) {
        return reject({
          code: 'EMPTY_OUTPUT',
          message: 'Inference process produced no response.',
          statusCode: 502,
        });
      }

      let parsed;
      try {
        parsed = JSON.parse(trimmedStdout);
      } catch (parseErr) {
        return reject({
          code: 'MALFORMED_OUTPUT',
          message: 'Failed to parse inference response.',
          statusCode: 502,
        });
      }

      if (parsed.success === false) {
        const errObj = parsed.error || {};
        const code = errObj.code || 'INFERENCE_ERROR';
        const msg = errObj.message || 'Inference error occurred.';
        // Determine appropriate HTTP status based on error code
        const statusCode = code === 'INVALID_INPUT' || code === 'INVALID_VIDEO' ? 400 : (code === 'NO_FACE_DETECTED' ? 422 : 500);

        return reject({
          code,
          message: msg,
          statusCode,
        });
      }

      resolve(parsed);
    });

    // Write to stdin if provided
    if (stdinData !== null && child.stdin) {
      try {
        const payloadStr = typeof stdinData === 'string' ? stdinData : JSON.stringify(stdinData);
        child.stdin.write(payloadStr);
        child.stdin.end();
      } catch (writeErr) {
        cleanupAndKill('STDIN_WRITE_ERROR', 'Failed to transmit payload to inference process.', 500);
      }
    } else if (child.stdin) {
      child.stdin.end();
    }
  });
}

module.exports = {
  getPythonExecutablePath,
  runPythonScript,
};
