const env = require("../config/env");

const TOKEN_TTL_MS = 23 * 60 * 60 * 1000;

let cachedAccessToken = null;
let tokenExpiresAt = 0;

const isTestEnvironment = () => env.sandboxApiKey.startsWith("key_test");

const getBaseUrl = () => {
  if (env.sandboxApiBaseUrl) {
    return env.sandboxApiBaseUrl.replace(/\/$/, "");
  }

  if (env.sandboxApiKey.startsWith("key_live")) {
    return "https://api.sandbox.co.in";
  }

  return "https://test-api.sandbox.co.in";
};

const requireSandboxConfig = () => {
  if (!env.sandboxApiKey || !env.sandboxApiSecret) {
    const error = new Error(
      "Sandbox is not configured. Set SANDBOX_API_KEY and SANDBOX_API_SECRET."
    );
    error.statusCode = 500;
    throw error;
  }
};

const authenticate = async () => {
  requireSandboxConfig();

  const response = await fetch(`${getBaseUrl()}/authenticate`, {
    method: "POST",
    headers: {
      "x-api-key": env.sandboxApiKey,
      "x-api-secret": env.sandboxApiSecret,
      "x-api-version": "1.0.0",
      "Content-Type": "application/json",
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || !payload?.data?.access_token) {
    const message =
      payload?.message ||
      payload?.error ||
      "Failed to authenticate with Sandbox API.";
    const error = new Error(message);
    error.statusCode = response.status || 502;
    throw error;
  }

  cachedAccessToken = payload.data.access_token;
  tokenExpiresAt = Date.now() + TOKEN_TTL_MS;

  return cachedAccessToken;
};

const getAccessToken = async () => {
  if (cachedAccessToken && Date.now() < tokenExpiresAt) {
    return cachedAccessToken;
  }

  return authenticate();
};

const sandboxRequest = async (path, body) => {
  requireSandboxConfig();

  const makeRequest = async (accessToken) => {
    return fetch(`${getBaseUrl()}${path}`, {
      method: "POST",
      headers: {
        "x-api-key": env.sandboxApiKey,
        authorization: accessToken,
        "x-api-version": "1.0.0",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  };

  let accessToken = await getAccessToken();
  let response = await makeRequest(accessToken);

  if (response.status === 401) {
    cachedAccessToken = null;
    tokenExpiresAt = 0;
    accessToken = await authenticate();
    response = await makeRequest(accessToken);
  }

  const payload = await response.json().catch(() => ({}));

  return {
    ok: response.ok,
    status: response.status,
    payload,
  };
};

module.exports = {
  sandboxRequest,
  isTestEnvironment,
};
