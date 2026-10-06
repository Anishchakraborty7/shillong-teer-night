/**
 * Zero-Backend Cloud Storage Service
 * Provides free, serverless cloud synchronization for Shillong Teer Night
 * without requiring Firebase Console, SQL, or custom backend servers.
 *
 * Supported Cloud Providers:
 * 1. Pantry Cloud (https://getpantry.cloud) - 100% Free, Zero configuration beyond a Pantry ID
 * 2. JSONBin.io (https://jsonbin.io) - Free JSON bucket with Bin ID + Access Key
 * 3. Custom REST Endpoint / Webhook
 */

const STORAGE_KEYS = {
  PROVIDER: "shillong_cloud_provider",
  PANTRY_ID: "shillong_pantry_id",
  JSONBIN_ID: "shillong_jsonbin_id",
  JSONBIN_KEY: "shillong_jsonbin_key",
  CUSTOM_URL: "shillong_custom_url",
  LOCAL_CACHE: "shillong_cloud_full_payload"
};

/**
 * Get the active cloud configuration from localStorage or .env
 */
export function getCloudConfig() {
  const provider =
    localStorage.getItem(STORAGE_KEYS.PROVIDER) ||
    import.meta.env.VITE_CLOUD_PROVIDER ||
    (import.meta.env.VITE_PANTRY_ID ? "pantry" : "pantry");

  const pantryId =
    localStorage.getItem(STORAGE_KEYS.PANTRY_ID) ||
    import.meta.env.VITE_PANTRY_ID ||
    "";

  const jsonBinId =
    localStorage.getItem(STORAGE_KEYS.JSONBIN_ID) ||
    import.meta.env.VITE_JSONBIN_BIN_ID ||
    "";

  const jsonBinKey =
    localStorage.getItem(STORAGE_KEYS.JSONBIN_KEY) ||
    import.meta.env.VITE_JSONBIN_KEY ||
    "";

  const customUrl =
    localStorage.getItem(STORAGE_KEYS.CUSTOM_URL) ||
    import.meta.env.VITE_CLOUD_STORAGE_URL ||
    "";

  return {
    provider,
    pantryId: pantryId.trim(),
    jsonBinId: jsonBinId.trim(),
    jsonBinKey: jsonBinKey.trim(),
    customUrl: customUrl.trim(),
    isConfigured: Boolean(
      (provider === "pantry" && pantryId.trim()) ||
      (provider === "jsonbin" && jsonBinId.trim()) ||
      (provider === "custom" && customUrl.trim())
    )
  };
}

/**
 * Save cloud configuration
 */
export function saveCloudConfig({ provider, pantryId, jsonBinId, jsonBinKey, customUrl }) {
  if (provider) localStorage.setItem(STORAGE_KEYS.PROVIDER, provider);
  if (pantryId !== undefined) localStorage.setItem(STORAGE_KEYS.PANTRY_ID, pantryId.trim());
  if (jsonBinId !== undefined) localStorage.setItem(STORAGE_KEYS.JSONBIN_ID, jsonBinId.trim());
  if (jsonBinKey !== undefined) localStorage.setItem(STORAGE_KEYS.JSONBIN_KEY, jsonBinKey.trim());
  if (customUrl !== undefined) localStorage.setItem(STORAGE_KEYS.CUSTOM_URL, customUrl.trim());
  return getCloudConfig();
}

/**
 * Fetch data from the active Cloud JSON bucket
 */
export async function fetchFromCloud() {
  const config = getCloudConfig();

  if (!config.isConfigured) {
    // Return cached data if cloud is not yet configured
    const cached = localStorage.getItem(STORAGE_KEYS.LOCAL_CACHE);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {}
    }
    return null;
  }

  try {
    let response;

    if (config.provider === "pantry" && config.pantryId) {
      const url = `https://getpantry.cloud/apiv1/pantry/${config.pantryId}/basket/shillong_teer_night`;
      response = await fetch(url, { method: "GET" });
    } else if (config.provider === "jsonbin" && config.jsonBinId) {
      const url = `https://api.jsonbin.io/v3/b/${config.jsonBinId}/latest`;
      const headers = {};
      if (config.jsonBinKey) headers["X-Access-Key"] = config.jsonBinKey;
      response = await fetch(url, { method: "GET", headers });
    } else if (config.provider === "custom" && config.customUrl) {
      response = await fetch(config.customUrl, { method: "GET" });
    }

    if (response && response.ok) {
      const json = await response.json();
      // Handle JSONBin wrapper format { record: { ... } }
      const payload = json.record ? json.record : json;

      // Update local cache
      localStorage.setItem(STORAGE_KEYS.LOCAL_CACHE, JSON.stringify(payload));
      return payload;
    } else if (response && response.status === 404) {
      // Basket does not exist yet on Pantry, return null so initial data can be created
      return null;
    }
  } catch (err) {
    console.warn("Could not reach Cloud JSON storage, using local cache:", err);
  }

  // Fallback to local cache
  const cached = localStorage.getItem(STORAGE_KEYS.LOCAL_CACHE);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {}
  }
  return null;
}

/**
 * Save updated data to the active Cloud JSON bucket
 */
export async function saveToCloud(payload) {
  const config = getCloudConfig();

  // Always update local cache first
  localStorage.setItem(STORAGE_KEYS.LOCAL_CACHE, JSON.stringify(payload));

  if (!config.isConfigured) {
    return { success: true, mode: "local" };
  }

  try {
    let response;

    if (config.provider === "pantry" && config.pantryId) {
      const url = `https://getpantry.cloud/apiv1/pantry/${config.pantryId}/basket/shillong_teer_night`;
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } else if (config.provider === "jsonbin" && config.jsonBinId) {
      const url = `https://api.jsonbin.io/v3/b/${config.jsonBinId}`;
      const headers = { "Content-Type": "application/json" };
      if (config.jsonBinKey) headers["X-Access-Key"] = config.jsonBinKey;
      response = await fetch(url, {
        method: "PUT",
        headers,
        body: JSON.stringify(payload)
      });
    } else if (config.provider === "custom" && config.customUrl) {
      response = await fetch(config.customUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    }

    if (response && (response.ok || response.status === 200 || response.status === 201)) {
      return { success: true, mode: "cloud" };
    } else {
      throw new Error(`Cloud storage returned status ${response?.status}`);
    }
  } catch (err) {
    console.error("Cloud storage sync failed:", err);
    throw new Error(`Failed to sync to cloud: ${err.message}. Local changes were saved.`);
  }
}

/**
 * Test cloud connection with given settings
 */
export async function testCloudConnection(testConfig) {
  try {
    if (testConfig.provider === "pantry" && testConfig.pantryId) {
      const url = `https://getpantry.cloud/apiv1/pantry/${testConfig.pantryId}`;
      const res = await fetch(url);
      if (res.ok) {
        return { success: true, message: "Connected to Pantry Cloud successfully!" };
      }
      return { success: false, message: `Pantry ID not recognized (Status ${res.status}). Please check your ID.` };
    } else if (testConfig.provider === "jsonbin" && testConfig.jsonBinId) {
      const url = `https://api.jsonbin.io/v3/b/${testConfig.jsonBinId}/latest`;
      const headers = {};
      if (testConfig.jsonBinKey) headers["X-Access-Key"] = testConfig.jsonBinKey;
      const res = await fetch(url, { headers });
      if (res.ok) {
        return { success: true, message: "Connected to JSONBin successfully!" };
      }
      return { success: false, message: `JSONBin check failed (Status ${res.status}).` };
    }
    return { success: false, message: "Please enter your provider ID." };
  } catch (err) {
    return { success: false, message: `Connection error: ${err.message}` };
  }
}
