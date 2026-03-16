import { useEffect, useState } from "react";
import apiClient from "../api/client";

export const Test = () => {
  const [user, setUser] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get("/users/me")
      .then((res) => {
        setUser(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">API Connection Test</h1>
      {loading && <p>Loading...</p>}
      {user && (
        <div className="bg-surface border-border rounded-lg border-2 p-4">
          <p className="mb-2 font-semibold">✅ Backend connected!</p>
          <pre className="overflow-auto text-sm">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
      )}
      {error && (
        <div className="rounded-lg border-2 border-red-500 bg-red-100 p-4 text-red-900">
          <p className="font-semibold">❌ Backend connection failed</p>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};
