"use client";

import Image from "next/image";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

type Catalogue = {
  id: string;
  name: string;
  business_name: string;
  whatsapp: string | null;
  phone: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  email: string | null;
  website: string | null;
  location: string | null;
};

type Product = {
  id: string;
  name: string;
  price: string;
  description: string;
  image: string | null;
};

function getCatalogueUrl() {
  if (typeof window === "undefined") return "";
  return window.location.href;
}

export default function PublicCatalogue({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [catalogue, setCatalogue] = useState<Catalogue | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function copyCatalogueLink() {
    const url = getCatalogueUrl();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy link error:", err);
    }
  }

  function orderProduct(product: Product) {
    if (!catalogue) return;
    const text = `Hello ${catalogue.business_name}, I would like to order: ${product.name} - ${product.price}. From ${catalogue.name}.`;
    if (!catalogue.whatsapp) {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
      return;
    }
    let phone = catalogue.whatsapp.replace(/\D/g, "");
    if (phone.startsWith("0")) phone = "254" + phone.slice(1);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");
  }

  function shareWhatsApp() {
    const url = getCatalogueUrl();
    if (!url || !catalogue) return;
    const text = `Check out ${catalogue.name} from ${catalogue.business_name}: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  async function shareCatalogue() {
    const url = getCatalogueUrl();
    if (!url || !catalogue) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: catalogue.name,
          text: `Check out ${catalogue.name} from ${catalogue.business_name}.`,
          url,
        });
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          console.error("Share error:", err);
        }
      }
    } else {
      await copyCatalogueLink();
    }
  }


  useEffect(() => {
    async function loadCatalogue() {
      try {
        const { id } = await params;
        const catalogueId = id;

      if (!catalogueId) {
        throw new Error("Invalid catalogue ID.");
      }

        const { data: catalogueData, error: catalogueError } =
          await supabase
            .from("catalogues")
            .select("id, name, business_name, whatsapp, phone, instagram, facebook, tiktok, email, website, location")
            .eq("id", catalogueId)
            .single();

        if (catalogueError) {
          throw catalogueError;
        }

        const { data: productData, error: productError } =
          await supabase
            .from("catalogue_products")
            .select("id, name, price, description, image")
            .eq("catalogue_id", catalogueId)
            .order("id", { ascending: true });

        if (productError) {
          throw productError;
        }

        setCatalogue(catalogueData);
        setProducts(productData || []);
      } catch (err) {
        console.error("Catalogue loading error:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load this catalogue.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadCatalogue();
  }, [params]);

  if (loading) {
    return (
      <main className="public-catalogue">
        <div className="public-catalogue-loading">
          Loading catalogue...
        </div>
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
    <main className="public-catalogue">
      <header className="public-catalogue-header">
        <p>{catalogue.business_name}</p>
        <h1>{catalogue.name}</h1>
        <span>PRODUCT CATALOGUE</span>
      </header>

      <section className="public-product-grid">
        {products.length === 0 ? (
          <div className="empty-catalogue">
            <p>No products available yet.</p>
          </div>
        ) : (
          products.map((product) => (
            <article className="public-product-card" key={product.id}>
              {product.image ? (
                <div className="public-product-image-wrapper">
                  <Image
                    src={product.image}
                    alt={product.name}
                    className="public-product-image"
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
              ) : (
                <div className="public-product-placeholder">
                  PRODUCT
                </div>
              )}

              <div className="public-product-info">
                <h2>{product.name}</h2>
                <strong>{product.price}</strong>
                <p>{product.description}</p>
                  <button
                    type="button"
                    className="product-order-button"
                    onClick={() => orderProduct(product)}
                  >
                    Order on WhatsApp →
                  </button>

              </div>
            </article>
          ))
        )}
      </section>

          <div className="catalogue-share-actions">
            <button type="button" onClick={copyCatalogueLink}>
              {copied ? "✓ Link copied" : "Copy link"}
            </button>
            <button type="button" onClick={shareWhatsApp}>
              WhatsApp
            </button>
            <button type="button" onClick={shareCatalogue}>
              Share
            </button>
          </div>

      <footer className="public-catalogue-footer">
        <span>BUILT WITH</span>
        <strong>BKM DIGITAL</strong>
      </footer>
    </main>
  );
}
