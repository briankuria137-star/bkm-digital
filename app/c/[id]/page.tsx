"use client";

import { useEffect, useState } from "react";
import PublicCatalogueView from "../../../components/PublicCatalogueView";
import {
  defaultDesign,
  fetchCatalogue,
  fetchProductGalleries,
  readError,
  type CatalogueDesign,
  type CatalogueRecord,
} from "../../../lib/catalogue";
import { supabase } from "../../../lib/supabase";
import type { PublicProduct } from "../../../components/PublicCatalogueView";

export default function PublicCatalogue({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [catalogue, setCatalogue] = useState<CatalogueRecord | null>(null);
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [design, setDesign] = useState<CatalogueDesign>(defaultDesign);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadCatalogue() {
      try {
        const { id } = await params;

        if (!id) throw new Error("This catalogue link is not valid.");

        const catalogueData = await fetchCatalogue(id);

        const withImages = await supabase
          .from("catalogue_products")
          .select("id, name, price, description, image, images")
          .eq("catalogue_id", id)
          .order("id", { ascending: true });

        const productResult = withImages.error
          ? await supabase
              .from("catalogue_products")
              .select("id, name, price, description, image")
              .eq("catalogue_id", id)
              .order("id", { ascending: true })
          : withImages;

        if (productResult.error) throw productResult.error;

        const rows = productResult.data || [];
        const galleries = await fetchProductGalleries(rows.map((product) => product.id));

        const normalized: PublicProduct[] = rows.map((product) => {
          const storedImages = Array.isArray(
          (product as unknown as { images?: unknown }).images,
        )
          ? (
              (product as unknown as { images: unknown[] }).images || []
            ).filter((image): image is string => typeof image === "string" && image.trim().length > 0)
          : [];
          const galleryImages = galleries?.[String(product.id)] || [];
          const images = galleryImages.length
            ? galleryImages
            : storedImages.length
              ? storedImages
              : product.image
                ? [product.image]
                : [];

          return {
            id: String(product.id),
            name: product.name || "Untitled product",
            price: product.price || "",
            description: product.description || "",
            images,
          };
        });

        if (cancelled) return;

        setCatalogue(catalogueData);
        setDesign(catalogueData.design);
        setProducts(normalized);
      } catch (err) {
        if (cancelled) return;
        console.error("Catalogue loading error:", err);
        setError(readError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadCatalogue();

    return () => {
      cancelled = true;
    };
  }, [params]);

  if (loading) {
    return (
      <main className="public-catalogue">
        <div className="public-catalogue-loading">Loading catalogue...</div>
      </main>
    );
  }

  if (error || !catalogue) {
    return (
      <main className="public-catalogue">
        <div className="public-catalogue-error">
          <p>CATALOGUE</p>
          <h1>Catalogue not found.</h1>
          <span>{error || "This catalogue does not exist."}</span>
        </div>
      </main>
    );
  }

  return (
    <main>
      <PublicCatalogueView catalogue={catalogue} products={products} design={design} />
    </main>
  );
}
