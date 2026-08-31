import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function useAnalyze() {
  const { getToken } = useAuth();
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [result, setResult]     = useState(null);

  const analyze = async (file) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Get fresh Clerk JWT
      const token = await getToken();

      const formData = new FormData();
      formData.append("audio", file);

      const { data } = await axios.post(`${API_URL}/api/analyze`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        timeout: 90000,
      });

      setResult(data.data);
      return data.data;
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Analysis failed";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  return { analyze, loading, error, result };
}

export function useHistory() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [error, setError]     = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const { data } = await axios.get(`${API_URL}/api/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory(data.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return { fetchHistory, history, loading, error };
}
