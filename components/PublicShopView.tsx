"use client";

import { useMemo, useState } from "react";
import { whatsAppHref } from "../lib/catalogue";
import type { ShopPayload, ShopProduct } from "../lib/studio";

function displayPrice(product: ShopProduct, currency: string) {
  const price = product.price.trim();
  if (!price) return currency;
  if (price.startsWith(currency)) return price;
  if (/^[A-Z$£€]/.test(price) || price.toLowerCase().startsWith("ksh")) return price;
  return `${currency} ${price.replace(/^[^\d]*/, "") || price}`;
}

export default function PublicShopView({
  shop,
  mode = "live",
}: {
  shop: ShopPayload;
  mode?: "live" | "preview";
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const categories = useMemo(() => {
    const names = shop.products.map((product) => product.category.trim()).filter(Boolean);
    return ["All", ...Array.from(new Set(names))];
  }, [shop.products]);

  const visible = shop.products.filter((product) => {
    const matchesCategory = category === "All" || product.category === category;
    const haystack = `${product.name} ${product.description} ${product.category}`.toLowerCase();
    return matchesCategory && haystack.includes(query.trim().toLowerCase());
  });

  function order(product: ShopProduct) {
    const text = `Hello ${shop.business}, I would like to order ${product.name} (${displayPrice(product, shop.currency)}) from ${shop.shopName}.`;
    window.open(whatsAppHref(shop.whatsapp, text), "_blank", "noopener,noreferrer");
  }

  return (
    <div className={`public-shop ${mode === "preview" ? "is-preview" : ""}`}>
      <header className="public-shop-header">
        <p>{shop.business}</p>
        <h1>{shop.shopName}</h1>
        {shop.headline ? <h2>{shop.headline}</h2> : null}
        {shop.description ? <p className="public-shop-lead">{shop.description}</p> : null}
      </header>

      <div className="shop-toolbar">
        <div className="shop-categories" role="tablist" aria-label="Categories">
          {categories.map((name) => (
            <button
              key={name}
              type="button"
              className={name === category ? "active" : ""}
              onClick={() => setCategory(name)}
            >
              {name}
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search products"
          aria-label="Search products"
        />
      </div>

      <section className="public-shop-grid">
        {visible.length === 0 ? (
          <div className="empty-catalogue">
            <p>No products match this view.</p>
          </div>
        ) : (
          visible.map((product) => (
            <article
              className={`shop-card ${product.available ? "" : "is-sold-out"} ${product.featured ? "is-featured" : ""}`}
              key={product.id}
            >
              <div className="shop-card-media">
                {product.image ? (
                  // User-supplied image URLs are not limited to one host.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.image} alt={product.name} />
                ) : (
                  <span>Product</span>
                )}
                {product.featured ? <em>Featured</em> : null}
                {!product.available ? <strong>Sold out</strong> : null}
              </div>
              <div className="shop-card-body">
                <small>{product.category}</small>
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <div className="shop-card-row">
                  <b>{displayPrice(product, shop.currency)}</b>
                  <button
                    type="button"
                    className="product-order-button"
                    disabled={!product.available}
                    onClick={() => order(product)}
                  >
                    {product.available ? "Order on WhatsApp" : "Unavailable"}
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </section>

      <footer className="public-site-footer">
        <strong>{shop.business}</strong>
        <span>Orders on WhatsApp · Built with BKM DIGITAL</span>
      </footer>
    </div>
  );
}
