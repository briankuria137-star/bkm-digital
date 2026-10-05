"use client";

import { useEffect, useState } from "react";
import PublicBriefView from "../../../components/PublicBriefView";
import PublicStatus from "../../../components/PublicStatus";
import { publicError } from "../../../lib/catalogue";
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
        if (!cancelled) setError(publicError(err));
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
        <PublicStatus
          eyebrow="SOFTWARE"
          title="Brief not found."
          detail={error || "This brief does not exist."}
        />
      </main>
    );
  }

  return (
    <main className="public-brief-page">
      <PublicBriefView brief={brief} />
    </main>
  );
}
