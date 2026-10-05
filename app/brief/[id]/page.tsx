"use client";

import { useEffect, useState } from "react";
import PublicBriefView from "../../../components/PublicBriefView";
import { readError } from "../../../lib/catalogue";
import {
  loadStudioDocument,
  normalizeSoftware,
  type SoftwarePayload,
} from "../../../lib/studio";

export default function PublicBriefPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [brief, setBrief] = useState<SoftwarePayload | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { id } = await params;
        const document = await loadStudioDocument(id);
        if (document.kind !== "software") throw new Error("This brief was not found.");
        if (!cancelled) setBrief(normalizeSoftware(document.payload));
      } catch (err) {
        if (!cancelled) setError(readError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [params]);

  if (loading) {
    return (
      <main className="public-brief-page">
        <div className="public-catalogue-loading">Loading brief...</div>
      </main>
    );
  }

  if (error || !brief) {
    return (
      <main className="public-brief-page">
        <div className="public-catalogue-error">
          <p>SOFTWARE</p>
          <h1>Brief not found.</h1>
          <span>{error || "This brief does not exist."}</span>
        </div>
      </main>
    );
  }

  return (
    <main className="public-brief-page">
      <PublicBriefView brief={brief} />
    </main>
  );
}
