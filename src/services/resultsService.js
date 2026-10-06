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
 * Normalizes 2-round result data (F/R and S/R)
 */
export function extractRoundData(data) {
  if (!data) {
    return {
      firstRound: "--",
      firstRoundTime: "08:30 PM",
      secondRound: "--",
      secondRoundTime: "09:30 PM"
    };
  }

  let firstRound =
    data.firstRound !== undefined && data.firstRound !== null
      ? String(data.firstRound).trim()
      : "";
  let secondRound =
    data.secondRound !== undefined && data.secondRound !== null
      ? String(data.secondRound).trim()
      : "";
  let firstRoundTime = String(
    data.firstRoundTime || data.fRoundTime || data.time || "08:30 PM"
  ).trim();
  let secondRoundTime = String(
    data.secondRoundTime || data.sRoundTime || "09:30 PM"
  ).trim();

  // If firstRound/secondRound empty, extract from legacy arrays or result string
  if (!firstRound && !secondRound) {
    if (Array.isArray(data.numbers) && data.numbers.length > 0) {
      firstRound = String(data.numbers[0] || "").trim();
      secondRound = String(data.numbers[1] || "").trim();
    } else if (typeof data.result === "string" && data.result.trim()) {
      const parts = data.result
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      firstRound = parts[0] || "";
      secondRound = parts[1] || "";
    }
  }

  return {
    firstRound: firstRound || "--",
    firstRoundTime: firstRoundTime || "08:30 PM",
    secondRound: secondRound || "--",
    secondRoundTime: secondRoundTime || "09:30 PM"
  };
}

/**
 * Normalizes Target / Common Numbers data (Direct, House, Ending)
 */
export function extractCommonData(data) {
  if (!data) {
    return {
      title: "SHILLONG",
      direct: "48, 91",
      house: "6",
      ending: "2"
    };
  }

  if (typeof data === "object" && !Array.isArray(data)) {
    return {
      title: String(data.title || "SHILLONG").trim(),
      direct:
        data.direct !== undefined && data.direct !== null && String(data.direct).trim() !== ""
          ? String(data.direct).trim()
          : Array.isArray(data.numbers) && data.numbers.length > 0
          ? String(data.numbers[0])
          : "--",
      house:
        data.house !== undefined && data.house !== null && String(data.house).trim() !== ""
          ? String(data.house).trim()
          : Array.isArray(data.numbers) && data.numbers.length > 1
          ? String(data.numbers[1])
          : "--",
      ending:
        data.ending !== undefined && data.ending !== null && String(data.ending).trim() !== ""
          ? String(data.ending).trim()
          : Array.isArray(data.numbers) && data.numbers.length > 2
          ? String(data.numbers[2])
          : "--"
    };
  }

  if (Array.isArray(data)) {
    return {
      title: "SHILLONG",
      direct: data.slice(0, 2).join(", ") || "--",
      house: data[2] || "--",
      ending: data[3] || "--"
    };
  }

  return {
    title: "SHILLONG",
    direct: "48, 91",
    house: "6",
    ending: "2"
  };
}

// Initial seed data
const DEFAULT_DEMO_CURRENT = {
  date: "2026-10-06",
  firstRound: "06",
  firstRoundTime: "08:30 PM",
  secondRound: "88",
  secondRoundTime: "09:30 PM",
  result: "06, 88",
  numbers: ["06", "88"],
  updatedAt: new Date().toISOString()
};

const DEFAULT_DEMO_PAST = [
  {
    id: "2026-10-05",
    date: "2026-10-05",
    firstRound: "06",
    firstRoundTime: "08:30 PM",
    secondRound: "88",
    secondRoundTime: "09:30 PM",
    result: "06, 88",
    numbers: ["06", "88"],
    createdAt: "2026-10-05T18:00:00Z"
  },
  {
    id: "2026-10-04",
    date: "2026-10-04",
    firstRound: "45",
    firstRoundTime: "08:30 PM",
    secondRound: "32",
    secondRoundTime: "09:30 PM",
    result: "45, 32",
    numbers: ["45", "32"],
    createdAt: "2026-10-04T18:00:00Z"
  },
  {
    id: "2026-10-03",
    date: "2026-10-03",
    firstRound: "07",
    firstRoundTime: "08:30 PM",
    secondRound: "61",
    secondRoundTime: "09:30 PM",
    result: "07, 61",
    numbers: ["07", "61"],
    createdAt: "2026-10-03T18:00:00Z"
  }
];

const DEFAULT_DEMO_COMMON = {
  title: "SHILLONG",
  direct: "48, 91",
  house: "6",
  ending: "2"
};

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
 * Fetch the active Today's Result (2 Rounds)
 */
export async function fetchCurrentResult() {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "currentResult", "main");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        const roundData = extractRoundData(data);
        return {
          date: String(data.date || ""),
          firstRound: roundData.firstRound,
          firstRoundTime: roundData.firstRoundTime,
          secondRound: roundData.secondRound,
          secondRoundTime: roundData.secondRoundTime,
          result: `${roundData.firstRound}, ${roundData.secondRound}`,
          numbers: [roundData.firstRound, roundData.secondRound],
          updatedAt: data.updatedAt
        };
      }
      return null;
    } catch (err) {
      console.warn("Firestore fetchCurrentResult error, falling back:", err);
    }
  }

  const dataset = await getFullDataset();
  if (dataset.currentResult) {
    const roundData = extractRoundData(dataset.currentResult);
    return {
      date: String(dataset.currentResult.date || ""),
      firstRound: roundData.firstRound,
      firstRoundTime: roundData.firstRoundTime,
      secondRound: roundData.secondRound,
      secondRoundTime: roundData.secondRoundTime,
      result: `${roundData.firstRound}, ${roundData.secondRound}`,
      numbers: [roundData.firstRound, roundData.secondRound],
      updatedAt: dataset.currentResult.updatedAt
    };
  }

  return DEFAULT_DEMO_CURRENT;
}

/**
 * Fetch Past Results list, sorted newest first
 */
export async function fetchPastResults() {
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
        const roundData = extractRoundData(data);
        results.push({
          id: docItem.id,
          date: String(data.date || docItem.id),
          firstRound: roundData.firstRound,
          firstRoundTime: roundData.firstRoundTime,
          secondRound: roundData.secondRound,
          secondRoundTime: roundData.secondRoundTime,
          result: `${roundData.firstRound}, ${roundData.secondRound}`,
          numbers: [roundData.firstRound, roundData.secondRound],
          createdAt: data.createdAt
        });
      });
      results.sort((a, b) => compareDatesDesc(a.date, b.date));
      return results;
    } catch (err) {
      console.warn("Firestore fetchPastResults error, falling back:", err);
    }
  }

  const dataset = await getFullDataset();
  if (Array.isArray(dataset.pastResults) && dataset.pastResults.length > 0) {
    const list = dataset.pastResults.map((item) => {
      const roundData = extractRoundData(item);
      return {
        ...item,
        firstRound: roundData.firstRound,
        firstRoundTime: roundData.firstRoundTime,
        secondRound: roundData.secondRound,
        secondRoundTime: roundData.secondRoundTime,
        result: `${roundData.firstRound}, ${roundData.secondRound}`,
        numbers: [roundData.firstRound, roundData.secondRound]
      };
    });
    list.sort((a, b) => compareDatesDesc(a.date, b.date));
    return list;
  }

  return DEFAULT_DEMO_PAST;
}

/**
 * Fetch Common Numbers object { title, direct, house, ending }
 */
export async function fetchCommonNumbers() {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "commonNumbers", "current");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        return extractCommonData(data);
      }
      return DEFAULT_DEMO_COMMON;
    } catch (err) {
      console.warn("Firestore fetchCommonNumbers error, falling back:", err);
    }
  }

  const dataset = await getFullDataset();
  if (dataset.commonNumbers) {
    return extractCommonData(dataset.commonNumbers);
  }

  return DEFAULT_DEMO_COMMON;
}

/**
 * ----------------------------------------------------
 * WRITE OPERATIONS (Atomic transactions & cloud save)
 * ----------------------------------------------------
 */

/**
 * Updates Today's 2-Round Result:
 * 1. Reads existing result
 * 2. If advancing to a new date, atomically archives previous 2-round result into pastResults
 * 3. Updates currentResult with new rounds
 */
export async function updateTodayResult({
  date,
  firstRound,
  firstRoundTime = "08:30 PM",
  secondRound,
  secondRoundTime = "09:30 PM"
}) {
  const cleanDate = toISODateString(date);
  const cleanFTime = String(firstRoundTime || "08:30 PM").trim();
  const cleanSTime = String(secondRoundTime || "09:30 PM").trim();
  const cleanFRound = String(firstRound ?? "").trim() || "--";
  const cleanSRound = String(secondRound ?? "").trim() || "--";

  if (!cleanDate) {
    throw new Error("A valid date is required.");
  }
  if (cleanFRound === "--" && cleanSRound === "--") {
    throw new Error("Please enter at least one round result (F/R or S/R).");
  }

  const cleanResultString = `${cleanFRound}, ${cleanSRound}`;
  const cleanNumbers = [cleanFRound, cleanSRound];

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
          const prevRounds = extractRoundData(existingData);

          transaction.set(
            pastDocRef,
            {
              date: existingDate,
              firstRound: prevRounds.firstRound,
              firstRoundTime: prevRounds.firstRoundTime,
              secondRound: prevRounds.secondRound,
              secondRoundTime: prevRounds.secondRoundTime,
              result: `${prevRounds.firstRound}, ${prevRounds.secondRound}`,
              numbers: [prevRounds.firstRound, prevRounds.secondRound],
              createdAt: existingData.updatedAt || serverTimestamp()
            },
            { merge: true }
          );
        }
      }

      // Update currentResult/main
      transaction.set(currentDocRef, {
        date: cleanDate,
        firstRound: cleanFRound,
        firstRoundTime: cleanFTime,
        secondRound: cleanSRound,
        secondRoundTime: cleanSTime,
        result: cleanResultString,
        numbers: cleanNumbers,
        updatedAt: serverTimestamp()
      });
    });

    const payload = {
      date: cleanDate,
      firstRound: cleanFRound,
      firstRoundTime: cleanFTime,
      secondRound: cleanSRound,
      secondRoundTime: cleanSTime,
      result: cleanResultString,
      numbers: cleanNumbers
    };

    localStorage.setItem(LOCAL_STORAGE_KEY_CURRENT, JSON.stringify(payload));
    return payload;
  }

  // Fallback: Cloud Bucket & Local Storage
  const dataset = await getFullDataset();
  const prevCurrent = dataset.currentResult || DEFAULT_DEMO_CURRENT;
  const prevDate = toISODateString(prevCurrent.date);

  let updatedPast = Array.isArray(dataset.pastResults)
    ? [...dataset.pastResults]
    : [...DEFAULT_DEMO_PAST];

  if (prevDate && prevDate !== cleanDate) {
    const prevRounds = extractRoundData(prevCurrent);
    const alreadyExists = updatedPast.some((item) => toISODateString(item.date) === prevDate);
    const pastEntry = {
      date: prevDate,
      firstRound: prevRounds.firstRound,
      firstRoundTime: prevRounds.firstRoundTime,
      secondRound: prevRounds.secondRound,
      secondRoundTime: prevRounds.secondRoundTime,
      result: `${prevRounds.firstRound}, ${prevRounds.secondRound}`,
      numbers: [prevRounds.firstRound, prevRounds.secondRound],
      createdAt: new Date().toISOString()
    };

    if (!alreadyExists) {
      updatedPast.unshift(pastEntry);
    } else {
      updatedPast = updatedPast.map((item) =>
        toISODateString(item.date) === prevDate ? { ...item, ...pastEntry } : item
      );
    }
  }

  const newCurrent = {
    date: cleanDate,
    firstRound: cleanFRound,
    firstRoundTime: cleanFTime,
    secondRound: cleanSRound,
    secondRoundTime: cleanSTime,
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
 * Replaces target common data { title, direct, house, ending }
 */
export async function updateCommonNumbers({ title, direct, house, ending }) {
  const cleanTitle = String(title || "SHILLONG").trim() || "SHILLONG";
  const cleanDirect = String(direct ?? "").trim() || "--";
  const cleanHouse = String(house ?? "").trim() || "--";
  const cleanEnding = String(ending ?? "").trim() || "--";

  const payload = {
    title: cleanTitle,
    direct: cleanDirect,
    house: cleanHouse,
    ending: cleanEnding
  };

  if (isFirebaseConfigured && db) {
    const docRef = doc(db, "commonNumbers", "current");
    await runTransaction(db, async (transaction) => {
      transaction.set(docRef, {
        ...payload,
        numbers: [cleanDirect, cleanHouse, cleanEnding],
        updatedAt: serverTimestamp()
      });
    });
    localStorage.setItem(LOCAL_STORAGE_KEY_COMMON, JSON.stringify(payload));
    return payload;
  }

  const dataset = await getFullDataset();
  const updatedDataset = {
    ...dataset,
    commonNumbers: payload
  };

  await saveToCloud(updatedDataset);
  localStorage.setItem(LOCAL_STORAGE_KEY_COMMON, JSON.stringify(payload));

  return payload;
}
