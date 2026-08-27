"use client";

import { ChangeEvent, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";

type Product = {
  id: number;
  name: string;
  price: string;
  description: string;
  image: string;
};

export default function EditCatalogue({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [catalogueId, setCatalogueId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [business, setBusiness] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadCatalogue() {
      try {
        const { id } = await params;
        const catalogueUuid = id;
      if (!catalogueUuid) {
        throw new Error("Invalid catalogue ID.");
      }

        const { data: catalogue, error: catalogueError } = await supabase
          .from("catalogues")
          .select("id, name, business_name")
          .eq("id", catalogueUuid)
          .single();

        if (catalogueError) {
          throw catalogueError;
        }

        const { data: productData, error: productError } = await supabase
          .from("catalogue_products")
          .select("id, name, price, description, image")
          .eq("catalogue_id", catalogueUuid)
          .order("id", { ascending: true });

        if (productError) {
          throw productError;
        }

        setCatalogueId(catalogue.id);
        setName(catalogue.name);
        setBusiness(catalogue.business_name);
        setProducts(productData || []);
      } catch (error) {
        console.error("Edit catalogue loading error:", error);
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to load catalogue.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadCatalogue();
  }, [params]);

  function addProduct() {
    const nextId = products.length > 0
      ? Math.max(...products.map((product) => product.id)) + 1
      : 1;

    setProducts([
      ...products,
      {
        id: nextId,
        name: `Product ${nextId}`,
        price: "KSh 0",
        description: "Add a description for this product.",
        image: "",
      },
    ]);
  }

  function removeProduct(id: number) {
    setProducts(products.filter((product) => product.id !== id));
  }

  function updateProduct(
    id: number,
    field: keyof Product,
    value: string,
  ) {
    setProducts(
      products.map((product) =>
        product.id === id ? { ...product, [field]: value } : product,
      ),
    );
  }

  async function handleImageUpload(
    id: number,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be smaller than 5MB.");
      return;
    }

    const extension =
      file.name.split(".").pop()?.toLowerCase() || "jpg";

    const fileName = `${id}-${crypto.randomUUID()}.${extension}`;

    const { error } = await supabase.storage
      .from("catalogue-images")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type,
      });

    if (error) {
      console.error("Image upload error:", error);
      alert(`Upload failed: ${error.message}`);
      return;
    }

    const { data } = supabase.storage
      .from("catalogue-images")
      .getPublicUrl(fileName);

    updateProduct(id, "image", data.publicUrl);
  }

  async function saveChanges() {
    if (!catalogueId) {
      setMessage("Catalogue is not ready.");
      return;
    }

    if (!name.trim()) {
      alert("Please enter a catalogue name.");
      return;
    }

    if (!business.trim()) {
      alert("Please enter a business name.");
      return;
    }

    if (products.length === 0) {
      alert("Add at least one product before saving.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const { error: catalogueError } = await supabase
        .from("catalogues")
        .update({
          name: name.trim(),
          business_name: business.trim(),
        })
        .eq("id", catalogueId);

      if (catalogueError) {
        throw catalogueError;
      }

      const { error: deleteError } = await supabase
        .from("catalogue_products")
        .delete()
        .eq("catalogue_id", catalogueId);

      if (deleteError) {
        throw deleteError;
      }

      const productRows = products.map((product) => ({
        catalogue_id: catalogueId,
        name: product.name.trim(),
        price: product.price.trim(),
        description: product.description.trim(),
        image: product.image || null,
      }));

      const { error: productError } = await supabase
        .from("catalogue_products")
        .insert(productRows);

      if (productError) {
        throw productError;
      }

      setMessage("Catalogue updated successfully.");
    } catch (error) {
      console.error("Catalogue update error:", error);

      setMessage(
        `Update failed: ${
          error instanceof Error
            ? error.message
            : "Something went wrong."
        }`,
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="catalogue-builder">
        <div className="public-catalogue-loading">
          Loading catalogue...
        </div>
      </main>
    );
  }

  if (!catalogueId) {
    return (
      <main className="catalogue-builder">
        <div className="public-catalogue-error">
          <h1>Catalogue not found.</h1>
          <p>{message}</p>
          <Link href="/projects">← Back to projects</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="catalogue-builder">
      <aside className="builder-sidebar">
        <Link href="/dashboard" className="builder-brand">
          BKM<span>DIGITAL</span>
        </Link>

        <div className="builder-label">
          EDIT CATALOGUE
        </div>

        <nav className="builder-nav">
          <a href="#details">01&nbsp;&nbsp; Details</a>
          <a href="#products">02&nbsp;&nbsp; Products</a>
          <a href="#preview">03&nbsp;&nbsp; Preview</a>
        </nav>

        <div className="builder-sidebar-bottom">
          <Link href="/projects">← Back to projects</Link>
        </div>
      </aside>

      <section className="builder-main">
        <header className="builder-header">
          <div>
            <p>PROJECT / EDIT CATALOGUE</p>
            <h1>Edit your catalogue.</h1>
          </div>

          <button
            className="publish-button"
            type="button"
            onClick={saveChanges}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes →"}
          </button>
        </header>

        {message && (
          <div className="catalogue-save-message" role="status">
            {message}
          </div>
        )}

        <section
          id="details"
          className="builder-section-panel"
        >
          <p className="panel-number">01 / DETAILS</p>
          <h2>Catalogue information.</h2>

          <div className="details-grid">
            <label>
              Catalogue name
              <input
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
              />
            </label>

            <label>
              Business name
              <input
                value={business}
                onChange={(event) =>
                  setBusiness(event.target.value)
                }
              />
            </label>
          </div>
        </section>

        <section
          id="products"
          className="builder-section-panel"
        >
          <div className="panel-top">
            <div>
              <p className="panel-number">02 / PRODUCTS</p>
              <h2>Your products.</h2>
            </div>

            <button
              className="add-product-button"
              type="button"
              onClick={addProduct}
            >
              + Add product
            </button>
          </div>

          <div className="product-editor-list">
            {products.map((product, index) => (
              <article
                className="product-editor"
                key={product.id}
              >
                <span className="product-index">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <div className="product-fields">
                  <div className="image-upload-area">
                    {product.image ? (
                      <div className="uploaded-image">
                        <img
                          src={product.image}
                          alt={product.name}
                        />

                        <button
                          type="button"
                          onClick={() =>
                            updateProduct(
                              product.id,
                              "image",
                              "",
                            )
                          }
                        >
                          Remove image
                        </button>
                      </div>
                    ) : (
                      <label className="upload-box">
                        <span>+</span>
                        <strong>
                          Upload product image
                        </strong>
                        <small>
                          JPG, PNG or WEBP · Max 5MB
                        </small>

                        <input
                          type="file"
                          accept="image/*"
                          onChange={(event) =>
                            handleImageUpload(
                              product.id,
                              event,
                            )
                          }
                        />
                      </label>
                    )}
                  </div>

                  <input
                    value={product.name}
                    onChange={(event) =>
                      updateProduct(
                        product.id,
                        "name",
                        event.target.value,
                      )
                    }
                    aria-label="Product name"
                    placeholder="Product name"
                  />

                  <input
                    value={product.price}
                    onChange={(event) =>
                      updateProduct(
                        product.id,
                        "price",
                        event.target.value,
                      )
                    }
                    aria-label="Product price"
                    placeholder="Price"
                  />

                  <textarea
                    value={product.description}
                    onChange={(event) =>
                      updateProduct(
                        product.id,
                        "description",
                        event.target.value,
                      )
                    }
                    aria-label="Product description"
                    placeholder="Product description"
                  />
                </div>

                <button
                  type="button"
                  className="remove-product"
                  onClick={() =>
                    removeProduct(product.id)
                  }
                >
                  Remove
                </button>
              </article>
            ))}
          </div>
        </section>

        <section
          id="preview"
          className="builder-section-panel preview-panel"
        >
          <p className="panel-number">03 / PREVIEW</p>

          <div className="catalogue-preview">
            <p>{business}</p>
            <h2>{name}</h2>

            <div className="preview-grid">
              {products.map((product) => (
                <div
                  className="preview-product"
                  key={product.id}
                >
                  {product.image ? (
                    <img
                      className="preview-product-image"
                      src={product.image}
                      alt={product.name}
                    />
                  ) : (
                    <div className="preview-image">
                      PRODUCT
                    </div>
                  )}

                  <h3>{product.name}</h3>
                  <strong>{product.price}</strong>
                  <p>{product.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="builder-footer">
          BKM DIGITAL / CATALOGUE EDITOR v1
        </footer>
      </section>
    </main>
  );
}
