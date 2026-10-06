import { useState, useEffect, useCallback } from "react";
import {
  fetchCurrentResult,
  fetchPastResults,
  fetchCommonNumbers
} from "../services/resultsService";

export function useResults() {
  const [currentResult, setCurrentResult] = useState(null);
  const [pastResults, setPastResults] = useState([]);
  const [commonNumbers, setCommonNumbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [current, past, common] = await Promise.all([
        fetchCurrentResult(),
        fetchPastResults(),
        fetchCommonNumbers()
      ]);
      setCurrentResult(current);
      setPastResults(past || []);
      setCommonNumbers(common || []);
    } catch (err) {
      console.error("Failed to load results:", err);
      setError("Unable to load latest data. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    currentResult,
    pastResults,
    commonNumbers,
    loading,
    error,
    refreshResults: loadData
  };
}
