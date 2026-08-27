"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

type Catalogue = {
  id: string;
  name: string;
  business_name: string;
};

type Product = {
  id: string;
  name: string;
  price: string;
  description: string;
  image: string | null;
};

export default function PublicCatalogue({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [catalogue, setCatalogue] = useState<Catalogue | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
            .select("id, name, business_name")
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
                <img
                  src={product.image}
                  alt={product.name}
                  className="public-product-image"
                />
              ) : (
                <div className="public-product-placeholder">
                  PRODUCT
                </div>
              )}

              <div className="public-product-info">
                <h2>{product.name}</h2>
                <strong>{product.price}</strong>
                <p>{product.description}</p>
              </div>
            </article>
          ))
        )}
      </section>

      <footer className="public-catalogue-footer">
        <span>BUILT WITH</span>
        <strong>BKM DIGITAL</strong>
      </footer>
    </main>
  );
}
