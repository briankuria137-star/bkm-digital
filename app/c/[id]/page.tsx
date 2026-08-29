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
  images: string[];
};

type GalleryImage = {
  product_id: string | number;
  image_url: string;
  sort_order: number | null;
  display_order: number | null;
  is_primary: boolean | null;
};

function getCatalogueUrl() {
  if (typeof window === "undefined") return "";
  return window.location.href;
}

function normalizeImages(
  product: Product,
  galleryImages: GalleryImage[],
): string[] {
  const gallery = galleryImages
    .filter(
      (item) =>
        typeof item.image_url === "string" &&
        item.image_url.trim().length > 0,
    )
    .sort((a, b) => {
      const aOrder =
        typeof a.sort_order === "number"
          ? a.sort_order
          : typeof a.display_order === "number"
            ? a.display_order
            : 0;

      const bOrder =
        typeof b.sort_order === "number"
          ? b.sort_order
          : typeof b.display_order === "number"
            ? b.display_order
            : 0;

      if (a.is_primary && !b.is_primary) return -1;
      if (!a.is_primary && b.is_primary) return 1;

      return aOrder - bOrder;
    })
    .map((item) => item.image_url);

  if (gallery.length > 0) {
    return Array.from(new Set(gallery));
  }

  if (product.image) {
    return [product.image];
  }

  return [];
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
  const [activeImages, setActiveImages] = useState<Record<string, number>>(
    {},
  );

  async function copyCatalogueLink() {
    const url = getCatalogueUrl();

    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error("Copy link error:", err);
    }
  }

  function orderProduct(product: Product) {
    if (!catalogue) return;

    const text = `Hello ${catalogue.business_name}, I would like to order: ${product.name} - ${product.price}. From ${catalogue.name}.`;

    if (!catalogue.whatsapp) {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(text)}`,
        "_blank",
        "noopener,noreferrer",
      );
      return;
    }

    let phone = catalogue.whatsapp.replace(/\D/g, "");

    if (phone.startsWith("0")) {
      phone = "254" + phone.slice(1);
    }

    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  function shareWhatsApp() {
    const url = getCatalogueUrl();

    if (!url || !catalogue) return;

    const text = `Check out ${catalogue.name} from ${catalogue.business_name}: ${url}`;

    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
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
    let cancelled = false;

    async function loadCatalogue() {
      try {
        const { id } = await params;
        const catalogueId = id;

        if (!catalogueId) {
          throw new Error("Invalid catalogue ID.");
        }

        const {
          data: catalogueData,
          error: catalogueError,
        } = await supabase
          .from("catalogues")
          .select(
            "id, name, business_name, whatsapp, phone, instagram, facebook, tiktok, email, website, location",
          )
          .eq("id", catalogueId)
          .single();

        if (catalogueError) {
          throw catalogueError;
        }

        const {
          data: productData,
          error: productError,
        } = await supabase
          .from("catalogue_products")
          .select("id, name, price, description, image")
          .eq("catalogue_id", catalogueId)
          .order("id", { ascending: true });

        if (productError) {
          throw productError;
        }

        const productIds = (productData || []).map((product) => product.id);

        let galleryData: GalleryImage[] = [];

        if (productIds.length > 0) {
          const {
            data,
            error: galleryError,
          } = await supabase
            .from("catalogue_product_images")
            .select(
              "product_id, image_url, sort_order, display_order, is_primary",
            )
            .in("product_id", productIds)
            .order("sort_order", { ascending: true })
            .order("display_order", { ascending: true });

          if (galleryError) {
            throw galleryError;
          }

          galleryData = (data || []) as GalleryImage[];
        }

        const normalizedProducts: Product[] = (productData || []).map(
          (product) => {
            const productGallery = galleryData.filter(
              (galleryImage) =>
                String(galleryImage.product_id) === String(product.id),
            );

            const images = normalizeImages(
              {
                ...product,
                image: product.image || null,
                images: [],
              },
              productGallery,
            );

            return {
              id: String(product.id),
              name: product.name,
              price: product.price,
              description: product.description,
              image: images[0] || null,
              images,
            };
          },
        );

        if (cancelled) return;

        setCatalogue(catalogueData);
        setProducts(normalizedProducts);

        const initialActiveImages: Record<string, number> = {};

        normalizedProducts.forEach((product) => {
          initialActiveImages[product.id] = 0;
        });

        setActiveImages(initialActiveImages);
      } catch (err) {
        if (cancelled) return;

        console.error("Catalogue loading error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load this catalogue.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCatalogue();

    return () => {
      cancelled = true;
    };
  }, [params]);

  function selectProductImage(productId: string, imageIndex: number) {
    setActiveImages((current) => ({
      ...current,
      [productId]: imageIndex,
    }));
  }

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
          <span>
            {error || "This catalogue does not exist."}
          </span>
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
          products.map((product) => {
            const images = product.images || [];

            const activeIndex = Math.min(
              activeImages[product.id] || 0,
              Math.max(images.length - 1, 0),
            );

            const activeImage = images[activeIndex];

            return (
              <article
                className="public-product-card"
                key={product.id}
              >
                {activeImage ? (
                  <>
                    <div className="public-product-image-wrapper">
                      <Image
                        src={activeImage}
                        alt={product.name}
                        className="public-product-image"
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        priority={activeIndex === 0}
                        unoptimized
                      />

                      {images.length > 1 && (
                        <span className="public-product-image-count">
                          {activeIndex + 1}/{images.length}
                        </span>
                      )}
                    </div>

                    {images.length > 1 && (
                      <div
                        className="public-product-thumbnails"
                        aria-label={`${product.name} photos`}
                      >
                        {images.map((image, imageIndex) => (
                          <button
                            key={`${image}-${imageIndex}`}
                            type="button"
                            className={`public-product-thumbnail ${
                              imageIndex === activeIndex ? "active" : ""
                            }`}
                            onClick={() =>
                              selectProductImage(
                                product.id,
                                imageIndex,
                              )
                            }
                            aria-label={`View ${product.name} photo ${
                              imageIndex + 1
                            }`}
                            aria-pressed={
                              imageIndex === activeIndex
                            }
                          >
                            <Image
                              src={image}
                              alt=""
                              width={120}
                              height={120}
                              unoptimized
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
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
            );
          })
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
