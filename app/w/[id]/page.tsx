"use client";

import { useEffect, useState } from "react";
import PublicWebsiteView from "../../../components/PublicWebsiteView";
import { readError } from "../../../lib/catalogue";
import { loadStudioDocument, normalizeWebsite, type WebsitePayload } from "../../../lib/studio";

export default function PublicWebsitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [site, setSite] = useState<WebsitePayload | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { id } = await params;
        const document = await loadStudioDocument(id);
        if (document.kind !== "website") throw new Error("This website was not found.");
        if (!cancelled) setSite(normalizeWebsite(document.payload));
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
      <main className="public-site">
        <div className="public-catalogue-loading">Loading website...</div>
      </main>
    );
  }

  if (error || !site) {
    return (
      <main className="public-site">
        <div className="public-catalogue-error">
          <p>WEBSITE</p>
          <h1>Website not found.</h1>
          <span>{error || "This page does not exist."}</span>
        </div>
      </main>
    );
  }

  return (
    <main>
      <PublicWebsiteView site={site} />
    </main>
  );
}
