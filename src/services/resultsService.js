import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  orderBy,
  limit,
  serverTimestamp,
  runTransaction
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "../firebase/config";
import { compareDatesDesc, toISODateString } from "../utils/dateUtils";
import { fetchFromCloud, saveToCloud } from "./cloudStorageService";

const LOCAL_STORAGE_KEY_CURRENT = "shillong_teer_current_result";
const LOCAL_STORAGE_KEY_PAST = "shillong_teer_past_results";
const LOCAL_STORAGE_KEY_COMMON = "shillong_teer_common_numbers";

/**
 * Normalizes results from various formats into a clean array of string numbers
 * and a comma-separated string (e.g. "23, 45")
 */
export function extractResultData(data) {
  if (!data) return { result: "", numbers: [] };

  if (Array.isArray(data.numbers) && data.numbers.length > 0) {
    const cleanNumbers = data.numbers.map((n) => String(n).trim()).filter(Boolean);
    return {
      result: data.result || cleanNumbers.join(", "),
      numbers: cleanNumbers
    };
  }

  if (typeof data.result === "string" && data.result.trim() !== "") {
    const cleanNumbers = data.result
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return {
      result: data.result.trim(),
      numbers: cleanNumbers
    };
  }

  // Backwards compatibility with legacy firstRound / secondRound fields
  const legacyParts = [];
  if (data.firstRound !== undefined && data.firstRound !== "") {
    legacyParts.push(String(data.firstRound).trim());
  }
  if (data.secondRound !== undefined && data.secondRound !== "") {
    legacyParts.push(String(data.secondRound).trim());
  }

  return {
    result: legacyParts.join(", "),
    numbers: legacyParts
  };
}

// Initial seed data
const DEFAULT_DEMO_CURRENT = {
  date: "2026-10-06",
  time: "8.30 PM",
  result: "23, 45",
  numbers: ["23", "45"],
  updatedAt: new Date().toISOString()
};

const DEFAULT_DEMO_PAST = [
  {
    date: "2026-10-05",
    time: "8.30 PM",
    result: "12, 67",
    numbers: ["12", "67"],
    createdAt: "2026-10-05T18:00:00Z"
  },
  {
    date: "2026-10-04",
    time: "8.30 PM",
    result: "45, 32",
    numbers: ["45", "32"],
    createdAt: "2026-10-04T18:00:00Z"
  },
  {
    date: "2026-10-03",
    time: "8.30 PM",
    result: "07",
    numbers: ["07"],
    createdAt: "2026-10-03T18:00:00Z"
  }
];

const DEFAULT_DEMO_COMMON = ["12", "27", "34", "45", "67"];

/**
 * Gets the dataset from Cloud Bucket or Local Storage
 */
async function getFullDataset() {
  try {
    const cloudData = await fetchFromCloud();
    if (cloudData && (cloudData.currentResult || cloudData.pastResults || cloudData.commonNumbers)) {
      return {
        currentResult: cloudData.currentResult || DEFAULT_DEMO_CURRENT,
        pastResults: cloudData.pastResults || DEFAULT_DEMO_PAST,
        commonNumbers: cloudData.commonNumbers || DEFAULT_DEMO_COMMON
      };
    }
  } catch (e) {
    console.warn("Could not fetch full dataset from cloud, trying local cache:", e);
  }

  let currentResult = DEFAULT_DEMO_CURRENT;
  let pastResults = DEFAULT_DEMO_PAST;
  let commonNumbers = DEFAULT_DEMO_COMMON;

  const cachedCurrent = localStorage.getItem(LOCAL_STORAGE_KEY_CURRENT);
  if (cachedCurrent) {
    try { currentResult = JSON.parse(cachedCurrent); } catch (e) {}
  }
  const cachedPast = localStorage.getItem(LOCAL_STORAGE_KEY_PAST);
  if (cachedPast) {
    try { pastResults = JSON.parse(cachedPast); } catch (e) {}
  }
  const cachedCommon = localStorage.getItem(LOCAL_STORAGE_KEY_COMMON);
  if (cachedCommon) {
    try { commonNumbers = JSON.parse(cachedCommon); } catch (e) {}
  }

  return { currentResult, pastResults, commonNumbers };
}

/**
 * ----------------------------------------------------
 * READ OPERATIONS
 * ----------------------------------------------------
 */

/**
 * Fetch the active Today's Result
 */
export async function fetchCurrentResult() {
  // 1. Primary: Cloud Firestore if Firebase is configured
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "currentResult", "main");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        const { result, numbers } = extractResultData(data);
        return {
          date: String(data.date || ""),
          time: String(data.time || "8.30 PM"),
          result,
          numbers,
          updatedAt: data.updatedAt
        };
      }
      return null;
    } catch (err) {
      console.warn("Firestore fetchCurrentResult error, falling back:", err);
    }
  }

  // 2. Fallback: Cloud Bucket / Local Cache
  const dataset = await getFullDataset();
  if (dataset.currentResult) {
    const { result, numbers } = extractResultData(dataset.currentResult);
    return {
      date: String(dataset.currentResult.date || ""),
      time: String(dataset.currentResult.time || "8.30 PM"),
      result,
      numbers,
      updatedAt: dataset.currentResult.updatedAt
    };
  }

  return DEFAULT_DEMO_CURRENT;
}

/**
 * Fetch Past Results list, sorted newest first
 */
export async function fetchPastResults() {
  // 1. Primary: Cloud Firestore if Firebase is configured
  if (isFirebaseConfigured && db) {
    try {
      const q = query(
        collection(db, "pastResults"),
        orderBy("date", "desc"),
        limit(60)
      );
      const snap = await getDocs(q);
      const results = [];
      snap.forEach((docItem) => {
        const data = docItem.data();
        const { result, numbers } = extractResultData(data);
        results.push({
          id: docItem.id,
          date: String(data.date || docItem.id),
          time: String(data.time || "8.30 PM"),
          result,
          numbers,
          createdAt: data.createdAt
        });
      });
      results.sort((a, b) => compareDatesDesc(a.date, b.date));
      return results;
    } catch (err) {
      console.warn("Firestore fetchPastResults error, falling back:", err);
    }
  }

  // 2. Fallback: Cloud Bucket / Local Cache
  const dataset = await getFullDataset();
  if (Array.isArray(dataset.pastResults) && dataset.pastResults.length > 0) {
    const list = dataset.pastResults.map((item) => {
      const { result, numbers } = extractResultData(item);
      return {
        ...item,
        time: item.time || "8.30 PM",
        result,
        numbers
      };
    });
    list.sort((a, b) => compareDatesDesc(a.date, b.date));
    return list;
  }

  return DEFAULT_DEMO_PAST;
}

/**
 * Fetch Common Numbers list
 */
export async function fetchCommonNumbers() {
  // 1. Primary: Cloud Firestore if Firebase is configured
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "commonNumbers", "current");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data.numbers)) {
          return data.numbers.map((n) => String(n));
        }
      }
      return [];
    } catch (err) {
      console.warn("Firestore fetchCommonNumbers error, falling back:", err);
    }
  }

  // 2. Fallback: Cloud Bucket / Local Cache
  const dataset = await getFullDataset();
  if (Array.isArray(dataset.commonNumbers) && dataset.commonNumbers.length > 0) {
    return dataset.commonNumbers.map(String);
  }

  return DEFAULT_DEMO_COMMON;
}

/**
 * ----------------------------------------------------
 * WRITE OPERATIONS (Atomic transactions & cloud save)
 * ----------------------------------------------------
 */

/**
 * Updates Today's Result:
 * 1. Reads existing result
 * 2. If it is a new date, automatically archives previous result into pastResults
 * 3. Replaces currentResult with newResult
 * 4. Saves to Firestore (if configured) and Cloud Bucket / Local Storage
 */
export async function updateTodayResult({ date, time, result }) {
  const cleanDate = toISODateString(date);
  const cleanTime = String(time ?? "").trim() || "8.30 PM";
  const rawResult = String(result ?? "").trim();

  if (!cleanDate) {
    throw new Error("A valid date is required.");
  }
  if (!rawResult) {
    throw new Error("Game result number(s) are required (e.g. 23 or 23, 45).");
  }

  // Parse comma-separated numbers, preserving leading zeros (e.g. "07")
  const cleanNumbers = rawResult
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (cleanNumbers.length === 0) {
    throw new Error("Please enter at least one valid result number.");
  }

  const cleanResultString = cleanNumbers.join(", ");

  // 1. Primary: Write to Cloud Firestore using atomic transaction
  if (isFirebaseConfigured && db) {
    const currentDocRef = doc(db, "currentResult", "main");

    await runTransaction(db, async (transaction) => {
      const currentSnap = await transaction.get(currentDocRef);

      if (currentSnap.exists()) {
        const existingData = currentSnap.data();
        const existingDate = toISODateString(existingData.date);

        // If advancing to a NEW date, archive previous result into pastResults
        if (existingDate && existingDate !== cleanDate) {
          const pastDocRef = doc(db, "pastResults", existingDate);
          const { result: prevResult, numbers: prevNumbers } = extractResultData(existingData);

          transaction.set(
            pastDocRef,
            {
              date: existingDate,
              time: String(existingData.time || cleanTime),
              result: prevResult,
              numbers: prevNumbers,
              createdAt: existingData.updatedAt || serverTimestamp()
            },
            { merge: true }
          );
        }
      }

      // Update currentResult/main
      transaction.set(currentDocRef, {
        date: cleanDate,
        time: cleanTime,
        result: cleanResultString,
        numbers: cleanNumbers,
        updatedAt: serverTimestamp()
      });
    });

    // Also mirror to local storage
    localStorage.setItem(LOCAL_STORAGE_KEY_CURRENT, JSON.stringify({
      date: cleanDate,
      time: cleanTime,
      result: cleanResultString,
      numbers: cleanNumbers
    }));

    return {
      date: cleanDate,
      time: cleanTime,
      result: cleanResultString,
      numbers: cleanNumbers
    };
  }

  // 2. Fallback: Cloud Bucket & Local Storage
  const dataset = await getFullDataset();
  const prevCurrent = dataset.currentResult || DEFAULT_DEMO_CURRENT;
  const prevDate = toISODateString(prevCurrent.date);

  let updatedPast = Array.isArray(dataset.pastResults) ? [...dataset.pastResults] : [...DEFAULT_DEMO_PAST];

  if (prevDate && prevDate !== cleanDate) {
    const { result: prevResult, numbers: prevNumbers } = extractResultData(prevCurrent);
    const alreadyExists = updatedPast.some((item) => toISODateString(item.date) === prevDate);
    if (!alreadyExists) {
      updatedPast.unshift({
        date: prevDate,
        time: String(prevCurrent.time || cleanTime),
        result: prevResult,
        numbers: prevNumbers,
        createdAt: new Date().toISOString()
      });
    } else {
      updatedPast = updatedPast.map((item) =>
        toISODateString(item.date) === prevDate
          ? {
              ...item,
              time: String(prevCurrent.time || cleanTime),
              result: prevResult,
              numbers: prevNumbers
            }
          : item
      );
    }
  }

  const newCurrent = {
    date: cleanDate,
    time: cleanTime,
    result: cleanResultString,
    numbers: cleanNumbers,
    updatedAt: new Date().toISOString()
  };

  const updatedDataset = {
    currentResult: newCurrent,
    pastResults: updatedPast,
    commonNumbers: dataset.commonNumbers || DEFAULT_DEMO_COMMON
  };

  await saveToCloud(updatedDataset);
  localStorage.setItem(LOCAL_STORAGE_KEY_CURRENT, JSON.stringify(newCurrent));
  localStorage.setItem(LOCAL_STORAGE_KEY_PAST, JSON.stringify(updatedPast));

  return newCurrent;
}

/**
 * Updates Common Numbers:
 * Replaces common numbers document and syncs.
 */
export async function updateCommonNumbers(numbersArray) {
  const cleanNumbers = (numbersArray || [])
    .map((n) => String(n).trim())
    .filter((n) => n !== "");

  if (cleanNumbers.length === 0) {
    throw new Error("Please provide at least one common number.");
  }

  // 1. Primary: Cloud Firestore if configured
  if (isFirebaseConfigured && db) {
    const docRef = doc(db, "commonNumbers", "current");
    await runTransaction(db, async (transaction) => {
      transaction.set(docRef, {
        numbers: cleanNumbers,
        updatedAt: serverTimestamp()
      });
    });
    localStorage.setItem(LOCAL_STORAGE_KEY_COMMON, JSON.stringify(cleanNumbers));
    return cleanNumbers;
  }

  // 2. Fallback: Cloud Bucket & Local Storage
  const dataset = await getFullDataset();
  const updatedDataset = {
    ...dataset,
    commonNumbers: cleanNumbers
  };

  await saveToCloud(updatedDataset);
  localStorage.setItem(LOCAL_STORAGE_KEY_COMMON, JSON.stringify(cleanNumbers));

  return cleanNumbers;
}
