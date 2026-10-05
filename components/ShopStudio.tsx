"use client";

import { ChangeEvent, useEffect, useState } from "react";
import Link from "next/link";
import PublicShopView from "./PublicShopView";
import { readError } from "../lib/catalogue";
import { supabase } from "../lib/supabase";
import {
  describeSaveError,
  loadStudioDocument,
  normalizeShop,
  saveStudioDocument,
  studioPaths,
  type ShopProduct,
} from "../lib/studio";

const initialProducts: ShopProduct[] = [
  {
    id: 1,
    name: "Featured product",
    price: "1500",
    category: "General",
    description: "Describe what the customer is buying, and why it is worth ordering.",
    image: "",
    featured: true,
    available: true,
  },
];

export default function ShopStudio({ documentId }: { documentId?: string }) {
  const [savedId, setSavedId] = useState<string | null>(documentId || null);
  const [business, setBusiness] = useState("Your Business");
  const [shopName, setShopName] = useState("Your Online Shop");
  const [headline, setHeadline] = useState("Everything you need, in one place.");
  const [description, setDescription] = useState(
    "Discover the products and order directly on WhatsApp.",
  );
  const [whatsapp, setWhatsapp] = useState("");
  const [currency, setCurrency] = useState("KSh");
  const [products, setProducts] = useState<ShopProduct[]>(initialProducts);
  const [loading, setLoading] = useState(Boolean(documentId));
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"success" | "error">("success");

  useEffect(() => {
    if (!documentId) return;
    let cancelled = false;

    async function load() {
      try {
        const document = await loadStudioDocument(documentId as string);
        if (document.kind !== "shop") throw new Error("This is not a shop project.");
        const shop = normalizeShop(document.payload);
        if (cancelled) return;
        setSavedId(document.id);
        setBusiness(shop.business);
        setShopName(shop.shopName);
        setHeadline(shop.headline);
        setDescription(shop.description);
        setWhatsapp(shop.whatsapp);
        setCurrency(shop.currency);
        setProducts(shop.products);
      } catch (error) {
        if (!cancelled) {
          setTone("error");
          setMessage(readError(error));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [documentId]);

  function updateProduct(id: number, field: keyof ShopProduct, value: string | boolean) {
    setProducts((current) =>
      current.map((product) => (product.id === id ? { ...product, [field]: value } : product)),
    );
  }

  function addProduct() {
    const nextId = products.length ? Math.max(...products.map((product) => product.id)) + 1 : 1;
    setProducts([
      ...products,
      {
        id: nextId,
        name: `Product ${nextId}`,
        price: "0",
        category: "General",
        description: "Add a description for this product.",
        image: "",
        featured: false,
        available: true,
      },
    ]);
  }

  async function uploadImage(id: number, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      setTone("error");
      setMessage("Use an image under 5MB.");
      return;
    }

    setUploadingId(id);
    try {
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `shop-${id}-${crypto.randomUUID()}.${extension}`;
      const { error } = await supabase.storage.from("catalogue-images").upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("catalogue-images").getPublicUrl(fileName);
      updateProduct(id, "image", data.publicUrl);
    } catch (error) {
      setTone("error");
      setMessage(`Upload failed: ${readError(error)}`);
    } finally {
      setUploadingId(null);
    }
  }

  function shopPayload() {
    return {
      business,
      shopName,
      headline,
      description,
      whatsapp,
      currency,
      products,
    };
  }

  async function publish() {
    if (!business.trim() || !shopName.trim()) {
      setTone("error");
      setMessage("Add a business name and shop name before publishing.");
      return;
    }

    if (!whatsapp.trim()) {
      setTone("error");
      setMessage("Add a WhatsApp number so customers can place orders.");
      return;
    }

    if (products.length === 0) {
      setTone("error");
      setMessage("Add at least one product.");
      return;
    }

    setSaving(true);
    setTone("success");
    setMessage("Publishing your shop...");

    try {
      const saved = await saveStudioDocument({
        id: savedId,
        kind: "shop",
        title: shopName.trim(),
        payload: shopPayload(),
      });
      setSavedId(saved.id);
      setTone("success");
      setMessage("Shop published. Customers can browse and order from the public link.");
    } catch (error) {
      console.error(error);
      setTone("error");
      setMessage(describeSaveError(error));
    } finally {
      setSaving(false);
    }
  }

  const liveHref = savedId ? studioPaths("shop", savedId).liveHref : "";

  if (loading) {
    return (
      <main className="catalogue-builder">
        <div className="public-catalogue-loading">Loading shop...</div>
      </main>
    );
  }

  return (
    <main className="catalogue-builder">
      <aside className="builder-sidebar">
        <Link href="/dashboard" className="builder-brand">
          BKM<span>DIGITAL</span>
        </Link>
        <div className="builder-label">ONLINE SHOP BUILDER</div>
        <nav className="builder-nav">
          <a href="#details">01 Shop details</a>
          <a href="#products">02 Products</a>
          <a href="#preview">03 Preview</a>
        </nav>
        <div className="builder-sidebar-bottom">
          <Link href="/projects">Back to projects</Link>
        </div>
      </aside>

      <section className="builder-main">
        <header className="builder-header">
          <div>
            <p>PROJECT / ONLINE SHOP</p>
            <h1>{savedId ? "Edit your shop." : "Build your online shop."}</h1>
          </div>
          <div className="builder-header-actions">
            {liveHref ? (
              <Link href={liveHref} className="secondary-button header-link" target="_blank">
                View live
              </Link>
            ) : null}
            <button className="publish-button" type="button" onClick={publish} disabled={saving}>
              {saving ? "Publishing..." : "Publish shop"}
            </button>
          </div>
        </header>

        {message ? (
          <div className={`catalogue-save-message ${tone === "error" ? "is-error" : ""}`} role="status">
            <span>{message}</span>
            {liveHref && tone === "success" ? (
              <Link href={liveHref} target="_blank">
                Open shop
              </Link>
            ) : null}
          </div>
        ) : null}

        <section id="details" className="builder-section-panel">
          <p className="panel-number">01 / SHOP DETAILS</p>
          <h2>Your storefront.</h2>
          <div className="details-grid">
            <label>
              Business name
              <input value={business} onChange={(event) => setBusiness(event.target.value)} />
            </label>
            <label>
              Shop name
              <input value={shopName} onChange={(event) => setShopName(event.target.value)} />
            </label>
            <label>
              Main headline
              <input value={headline} onChange={(event) => setHeadline(event.target.value)} />
            </label>
            <label>
              WhatsApp number
              <input value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} placeholder="2547XXXXXXXX" />
            </label>
            <label>
              Currency
              <select value={currency} onChange={(event) => setCurrency(event.target.value)}>
                <option value="KSh">KSh — Kenyan Shilling</option>
                <option value="$">$ — US Dollar</option>
                <option value="£">£ — Pound Sterling</option>
                <option value="€">€ — Euro</option>
              </select>
            </label>
            <label className="span-two">
              Shop introduction
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} />
            </label>
          </div>
        </section>

        <section id="products" className="builder-section-panel">
          <div className="panel-top">
            <div>
              <p className="panel-number">02 / PRODUCTS</p>
              <h2>Your inventory.</h2>
            </div>
            <button className="add-product-button" type="button" onClick={addProduct}>
              Add product
            </button>
          </div>
          <div className="product-editor-list">
            {products.map((product, index) => (
              <article className="product-editor" key={product.id}>
                <span className="product-index">{String(index + 1).padStart(2, "0")}</span>
                <div className="product-fields">
                  <input
                    value={product.name}
                    onChange={(event) => updateProduct(product.id, "name", event.target.value)}
                    aria-label="Product name"
                    placeholder="Product name"
                  />
                  <input
                    value={product.price}
                    onChange={(event) => updateProduct(product.id, "price", event.target.value)}
                    aria-label="Product price"
                    placeholder="1500"
                  />
                  <input
                    value={product.category}
                    onChange={(event) => updateProduct(product.id, "category", event.target.value)}
                    aria-label="Product category"
                    placeholder="Category"
                  />
                  <textarea
                    value={product.description}
                    onChange={(event) => updateProduct(product.id, "description", event.target.value)}
                    aria-label="Product description"
                    placeholder="Product description"
                  />
                  <label>
                    Image address
                    <input
                      value={product.image}
                      onChange={(event) => updateProduct(product.id, "image", event.target.value)}
                      placeholder="https://..."
                    />
                  </label>
                  <label className="gallery-add-button shop-upload">
                    {uploadingId === product.id ? "Uploading..." : "Upload photo"}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingId === product.id}
                      onChange={(event) => uploadImage(product.id, event)}
                    />
                  </label>
                  <label>
                    Availability
                    <select
                      value={product.available ? "available" : "sold-out"}
                      onChange={(event) =>
                        updateProduct(product.id, "available", event.target.value === "available")
                      }
                    >
                      <option value="available">Available</option>
                      <option value="sold-out">Sold out</option>
                    </select>
                  </label>
                  <label>
                    Featured product
                    <select
                      value={product.featured ? "yes" : "no"}
                      onChange={(event) =>
                        updateProduct(product.id, "featured", event.target.value === "yes")
                      }
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </label>
                </div>
                <button
                  type="button"
                  className="remove-product"
                  onClick={() => setProducts((current) => current.filter((item) => item.id !== product.id))}
                >
                  Remove
                </button>
              </article>
            ))}
          </div>
        </section>

        <section id="preview" className="builder-section-panel preview-panel">
          <p className="panel-number">03 / PREVIEW</p>
          <h2>This is the public shop.</h2>
          <div className="catalogue-preview-frame">
            <PublicShopView shop={shopPayload()} mode="preview" />
          </div>
        </section>
        <footer className="builder-footer">BKM DIGITAL / ONLINE SHOP BUILDER</footer>
      </section>
    </main>
  );
}
