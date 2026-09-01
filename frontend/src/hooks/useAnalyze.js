import { useState } from "react";
import { useAppAuth } from "../context/AuthContext";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function useAnalyze() {
  const { getToken } = useAppAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const analyze = async (file, metadata = {}) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Get fresh JWT or demo token
      const token = (await getToken()) || "demo_token";

      const formData = new FormData();
      formData.append("file", file);
      formData.append("audio", file); // backward compatibility

      if (metadata.candidateName) formData.append("candidateName", metadata.candidateName);
      if (metadata.targetRole) formData.append("targetRole", metadata.targetRole);
      if (metadata.question) formData.append("question", metadata.question);
      if (metadata.mediaType) formData.append("mediaType", metadata.mediaType);

      const { data } = await axios.post(`${API_URL}/api/analyze`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-demo-user-id": "demo_user",
        },
        timeout: 120000,
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
  const { getToken } = useAppAuth();
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const token = (await getToken()) || "demo_token";
      const { data } = await axios.get(`${API_URL}/api/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-demo-user-id": "demo_user",
        },
      });
      setHistory(data.data || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return { fetchHistory, history, loading, error };
}
