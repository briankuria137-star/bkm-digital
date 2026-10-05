"use client";

import Image from "next/image";
import { useEffect, useState, type CSSProperties } from "react";
import {
  externalHref,
  whatsAppHref,
  type CatalogueDesign,
  type CatalogueDetails,
} from "../lib/catalogue";

export type PublicProduct = {
  id: string;
  name: string;
  price: string;
  description: string;
  images: string[];
};

type PublicCatalogueViewProps = {
  catalogue: CatalogueDetails;
  products: PublicProduct[];
  design: CatalogueDesign;
  mode?: "live" | "preview";
  shareUrl?: string;
};

export default function PublicCatalogueView({
  catalogue,
  products,
  design,
  mode = "live",
  shareUrl = "",
}: PublicCatalogueViewProps) {
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState("");
  const [activeImages, setActiveImages] = useState<Record<string, number>>({});
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [viewerIndex, setViewerIndex] = useState(0);

  const viewerProduct = products.find((product) => product.id === viewerId) || null;
  const viewerImages = viewerProduct?.images || [];

  useEffect(() => {
    if (!viewerProduct) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setViewerId(null);
      }

      if (event.key === "ArrowRight" && viewerImages.length > 1) {
        setViewerIndex((current) => (current + 1) % viewerImages.length);
      }

      if (event.key === "ArrowLeft" && viewerImages.length > 1) {
        setViewerIndex((current) =>
          current === 0 ? viewerImages.length - 1 : current - 1,
        );
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [viewerProduct, viewerImages.length]);

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2400);
  }

  function currentShareUrl() {
    if (shareUrl) {
      if (shareUrl.startsWith("http")) return shareUrl;
      if (typeof window === "undefined") return "";
      return new URL(shareUrl, window.location.origin).toString();
    }

    if (mode === "preview" || typeof window === "undefined") return "";
    return window.location.href;
  }

  async function copyLink() {
    const url = currentShareUrl();

    if (!url) {
      showNotice("Save the catalogue to get a public link.");
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Copy link error:", error);
      window.prompt("Copy this catalogue link:", url);
    }
  }

  function shareWhatsApp() {
    const url = currentShareUrl();

    if (!url) {
      showNotice("Save the catalogue to share it.");
      return;
    }

    const text = `View ${catalogue.name} from ${catalogue.business_name}: ${url}`;

    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  async function shareCatalogue() {
    const url = currentShareUrl();

    if (!url) {
      showNotice("Save the catalogue to share it.");
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: catalogue.name,
          text: `${catalogue.name} by ${catalogue.business_name}`,
          url,
        });
        return;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        console.error("Share error:", error);
      }
    }

    await copyLink();
  }

  function orderProduct(product: PublicProduct) {
    const text = `Hello ${catalogue.business_name}, I would like to order ${product.name} (${product.price}) from ${catalogue.name}.`;

    window.open(
      whatsAppHref(catalogue.whatsapp, text),
      "_blank",
      "noopener,noreferrer",
    );
  }

  function openViewer(product: PublicProduct, imageIndex = 0) {
    setViewerId(product.id);
    setViewerIndex(imageIndex);
  }

  const contactLinks = [
    catalogue.phone
      ? { label: catalogue.phone, href: externalHref("phone", catalogue.phone) }
      : null,
    catalogue.email
      ? { label: catalogue.email, href: externalHref("email", catalogue.email) }
      : null,
    catalogue.location ? { label: catalogue.location, href: null } : null,
    catalogue.instagram
      ? {
          label: "Instagram",
          href: externalHref("instagram", catalogue.instagram),
        }
      : null,
    catalogue.facebook
      ? { label: "Facebook", href: externalHref("facebook", catalogue.facebook) }
      : null,
    catalogue.tiktok
      ? { label: "TikTok", href: externalHref("tiktok", catalogue.tiktok) }
      : null,
    catalogue.website
      ? { label: "Website", href: externalHref("website", catalogue.website) }
      : null,
  ].filter((item): item is { label: string; href: string | null } => Boolean(item));

  return (
    <div
      className={`public-catalogue theme-${design.theme} layout-${design.layout} radius-${design.radius}${mode === "preview" ? " is-preview" : ""}`}
      style={{ "--catalogue-accent": design.accent } as CSSProperties}
    >
      <header className="public-catalogue-header">
        <div className="public-brand-mark">
          <span className="public-brand-line" />
          <p>{catalogue.business_name}</p>
          <span className="public-brand-line" />
        </div>
        <h1>{catalogue.name}</h1>
        {catalogue.location ? (
          <p className="public-location">{catalogue.location}</p>
        ) : null}
        <div className="public-header-accent" />
      </header>

      <section className="public-product-grid" aria-label="Products">
        {products.length === 0 ? (
          <div className="empty-catalogue">
            <p>No products have been added yet.</p>
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
              <article className="public-product-card" key={product.id}>
                {activeImage ? (
                  <>
                    <button
                      type="button"
                      className="public-product-open"
                      onClick={() => openViewer(product, activeIndex)}
                      aria-label={`View ${product.name}`}
                    >
                    <div className="public-product-image-wrapper">
                      <Image
                        src={activeImage}
                        alt={product.name}
                        className="public-product-image"
                        fill
                        sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw"
                        unoptimized
                      />
                      {images.length > 1 ? (
                        <span className="public-product-image-count">
                          {activeIndex + 1}/{images.length}
                        </span>
                      ) : null}
                    </div>
                    </button>

                    {images.length > 1 ? (
                      <div
                        className="public-product-thumbnails"
                        aria-label={`${product.name} photos`}
                      >
                        {images.map((image, imageIndex) => (
                          <button
                            key={`${image}-${imageIndex}`}
                            type="button"
                            className={`public-product-thumbnail ${imageIndex === activeIndex ? "active" : ""}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              setActiveImages((current) => ({
                                ...current,
                                [product.id]: imageIndex,
                              }));
                            }}
                            aria-label={`Show photo ${imageIndex + 1} of ${product.name}`}
                            aria-pressed={imageIndex === activeIndex}
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
                    ) : null}
                  </>
                ) : (
                  <button
                    type="button"
                    className="public-product-open"
                    onClick={() => openViewer(product, 0)}
                    aria-label={`View ${product.name}`}
                  >
                    <div className="public-product-placeholder">
                      <span>{product.name || "Product"}</span>
                    </div>
                  </button>
                )}

                <div className="public-product-info">
                  <div className="product-title-row">
                    <h2>{product.name}</h2>
                    <strong>{product.price}</strong>
                  </div>
                  {product.description ? <p>{product.description}</p> : null}
                  <button
                    type="button"
                    className="product-order-button"
                    onClick={(event) => {
                      event.stopPropagation();
                      orderProduct(product);
                    }}
                  >
                    Order on WhatsApp
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              </article>
            );
          })
        )}
      </section>

      <section className="public-contact-panel">
        <div>
          <span>DIRECT ORDERS</span>
          <h2>Talk to {catalogue.business_name}.</h2>
        </div>

        <div className="catalogue-share-actions">
          <button type="button" onClick={copyLink}>
            {copied ? "Link copied" : "Copy link"}
          </button>
          <button type="button" onClick={shareWhatsApp}>
            WhatsApp
          </button>
          <button type="button" onClick={shareCatalogue}>
            Share
          </button>
        </div>
      </section>

      {notice ? (
        <p className="catalogue-inline-notice" role="status">
          {notice}
        </p>
      ) : null}

      <footer className="public-catalogue-footer">
        <div className="footer-business">{catalogue.business_name}</div>
        {contactLinks.length > 0 ? (
          <div className="footer-contact">
            {contactLinks.map((item) =>
              item.href ? (
                <a key={item.label} href={item.href} target={item.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
                  {item.label}
                </a>
              ) : (
                <span key={item.label}>{item.label}</span>
              ),
            )}
          </div>
        ) : null}
        <div className="footer-powered">
          <span>BUILT WITH</span>
          <strong>BKM DIGITAL</strong>
        </div>
      </footer>

      {viewerProduct ? (
        <div
          className="product-viewer-backdrop"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) setViewerId(null);
          }}
        >
          <div
            className="product-viewer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-viewer-title"
          >
            <button
              type="button"
              className="product-viewer-close"
              onClick={() => setViewerId(null)}
              aria-label="Close product"
            >
              ×
            </button>

            <div className="product-viewer-media">
              {viewerImages[viewerIndex] ? (
                <Image
                  src={viewerImages[viewerIndex]}
                  alt={viewerProduct.name}
                  fill
                  sizes="(max-width: 600px) 100vw, 960px"
                  className="product-viewer-image"
                  unoptimized
                />
              ) : (
                <div className="product-viewer-placeholder">NO PHOTO</div>
              )}

              {viewerImages.length > 1 ? (
                <>
                  <button
                    type="button"
                    className="product-viewer-nav product-viewer-prev"
                    onClick={() =>
                      setViewerIndex((current) =>
                        current === 0 ? viewerImages.length - 1 : current - 1,
                      )
                    }
                    aria-label="Previous photo"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className="product-viewer-nav product-viewer-next"
                    onClick={() =>
                      setViewerIndex((current) => (current + 1) % viewerImages.length)
                    }
                    aria-label="Next photo"
                  >
                    ›
                  </button>
                </>
              ) : null}
            </div>

            {viewerImages.length > 1 ? (
              <div className="product-viewer-thumbnails">
                {viewerImages.map((image, imageIndex) => (
                  <button
                    key={`${image}-${imageIndex}`}
                    type="button"
                    className={`product-viewer-thumbnail ${imageIndex === viewerIndex ? "active" : ""}`}
                    onClick={() => setViewerIndex(imageIndex)}
                    aria-label={`Photo ${imageIndex + 1}`}
                  >
                    <Image src={image} alt="" width={144} height={144} unoptimized />
                  </button>
                ))}
              </div>
            ) : null}

            <div className="product-viewer-details">
              <div className="product-viewer-heading">
                <div>
                  <span>
                    {String(products.findIndex((item) => item.id === viewerProduct.id) + 1).padStart(2, "0")}{" "}
                    / {String(products.length).padStart(2, "0")}
                  </span>
                  <h2 id="product-viewer-title">{viewerProduct.name}</h2>
                </div>
                <strong>{viewerProduct.price}</strong>
              </div>
              {viewerProduct.description ? <p>{viewerProduct.description}</p> : null}
              <button
                type="button"
                className="product-viewer-order"
                onClick={() => orderProduct(viewerProduct)}
              >
                Order on WhatsApp
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
