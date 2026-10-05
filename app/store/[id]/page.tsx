"use client";

import { useEffect, useState } from "react";
import PublicShopView from "../../../components/PublicShopView";
import { readError } from "../../../lib/catalogue";
import { loadStudioDocument, normalizeShop, type ShopPayload } from "../../../lib/studio";

export default function PublicShopPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [shop, setShop] = useState<ShopPayload | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { id } = await params;
        const document = await loadStudioDocument(id);
        if (document.kind !== "shop") throw new Error("This shop was not found.");
        if (!cancelled) setShop(normalizeShop(document.payload));
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
      <main className="public-shop">
        <div className="public-catalogue-loading">Loading shop...</div>
      </main>
    );
  }

  if (error || !shop) {
    return (
      <main className="public-shop">
        <div className="public-catalogue-error">
          <p>SHOP</p>
          <h1>Shop not found.</h1>
          <span>{error || "This shop does not exist."}</span>
        </div>
      </main>
    );
  }

  return (
    <main>
      <PublicShopView shop={shop} />
    </main>
  );
}
