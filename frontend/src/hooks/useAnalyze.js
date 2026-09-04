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
      const token = (await getToken()) || "demo_token";

      const formData = new FormData();
      formData.append("file", file);
      formData.append("audio", file); // backward compatibility

      if (metadata.candidateName) formData.append("candidateName", metadata.candidateName);
      if (metadata.candidateEmail) formData.append("candidateEmail", metadata.candidateEmail);
      if (metadata.targetRole) formData.append("targetRole", metadata.targetRole);
      if (metadata.question) formData.append("question", metadata.question);
      if (metadata.mediaType) formData.append("mediaType", metadata.mediaType);
      if (metadata.invitationToken) formData.append("invitationToken", metadata.invitationToken);
      if (metadata.isPrivate !== undefined) formData.append("isPrivate", metadata.isPrivate);
      if (metadata.saveVideoFile !== undefined) formData.append("saveVideoFile", metadata.saveVideoFile);

      if (metadata.proctoringData) {
        formData.append("proctoringData", JSON.stringify(metadata.proctoringData));
      }

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

  const deleteAnalysis = async (id) => {
    try {
      const token = (await getToken()) || "demo_token";
      await axios.delete(`${API_URL}/api/history/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-demo-user-id": "demo_user",
        },
      });
      setHistory((prev) => prev.filter((item) => item._id !== id));
      return true;
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Failed to delete analysis";
      throw new Error(msg);
    }
  };

  return { fetchHistory, deleteAnalysis, history, loading, error };
}

export function useRecruiter() {
  const { getToken } = useAppAuth();
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [stats, setStats] = useState({
    totalCandidates: 0,
    avgHiringScore: 0,
    shortlistedCount: 0,
    flaggedCount: 0,
  });
  const [invitations, setInvitations] = useState([]);
  const [error, setError] = useState(null);

  const fetchCandidates = async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const token = (await getToken()) || "demo_token";
      const { data } = await axios.get(`${API_URL}/api/recruiter/candidates`, {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
          "x-demo-user-id": "demo_user",
        },
      });
      setCandidates(data.data || []);
      if (data.stats) setStats(data.stats);
      return data;
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Failed to load candidates";
      setError(msg);
      return { data: [], stats: null };
    } finally {
      setLoading(false);
    }
  };

  const updateCandidateStatus = async (id, payload) => {
    try {
      const token = (await getToken()) || "demo_token";
      const { data } = await axios.patch(
        `${API_URL}/api/recruiter/candidates/${id}/status`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "x-demo-user-id": "demo_user",
          },
        }
      );

      // Update in local state
      setCandidates((prev) =>
        prev.map((c) => (c._id === id ? { ...c, ...data.data } : c))
      );
      return data.data;
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      throw new Error(msg);
    }
  };

  const createInvitation = async (invitePayload) => {
    try {
      const token = (await getToken()) || "demo_token";
      const { data } = await axios.post(
        `${API_URL}/api/recruiter/invitations`,
        invitePayload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "x-demo-user-id": "demo_user",
          },
        }
      );
      return data;
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      throw new Error(msg);
    }
  };

  const fetchInvitations = async () => {
    try {
      const token = (await getToken()) || "demo_token";
      const { data } = await axios.get(`${API_URL}/api/recruiter/invitations`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-demo-user-id": "demo_user",
        },
      });
      setInvitations(data.data || []);
      return data.data;
    } catch (err) {
      console.error("Failed to load invitations:", err);
      return [];
    }
  };

  const fetchInvitationByToken = async (token) => {
    try {
      const { data } = await axios.get(`${API_URL}/api/invitations/${token}`);
      return data.data;
    } catch (err) {
      throw new Error(err.response?.data?.error || "Interview link not found or expired.");
    }
  };

  return {
    loading,
    error,
    candidates,
    stats,
    invitations,
    fetchCandidates,
    updateCandidateStatus,
    createInvitation,
    fetchInvitations,
    fetchInvitationByToken,
  };
}

export function useWebhooks() {
  const { getToken } = useAppAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const token = (await getToken()) || "demo_token";
      const { data } = await axios.get(`${API_URL}/api/recruiter/webhooks`, {
        headers: { Authorization: `Bearer ${token}`, "x-demo-user-id": "demo_user" },
      });
      setSettings(data.data);
      return data.data;
    } catch (err) {
      console.error("Failed to load webhook settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (payload) => {
    setLoading(true);
    try {
      const token = (await getToken()) || "demo_token";
      const { data } = await axios.post(`${API_URL}/api/recruiter/webhooks`, payload, {
        headers: { Authorization: `Bearer ${token}`, "x-demo-user-id": "demo_user" },
      });
      setSettings(data.data);
      return data.data;
    } catch (err) {
      throw new Error(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const testWebhookDispatch = async (payload = {}) => {
    try {
      const token = (await getToken()) || "demo_token";
      const { data } = await axios.post(`${API_URL}/api/recruiter/webhooks/test`, payload, {
        headers: { Authorization: `Bearer ${token}`, "x-demo-user-id": "demo_user" },
      });
      setTestResult(data);
      if (data.logEntry) {
        setSettings((prev) =>
          prev ? { ...prev, logs: [data.logEntry, ...(prev.logs || [])] } : prev
        );
      }
      return data;
    } catch (err) {
      throw new Error(err.response?.data?.error || err.message);
    }
  };

  return {
    settings,
    loading,
    testResult,
    fetchSettings,
    saveSettings,
    testWebhookDispatch,
  };
}

