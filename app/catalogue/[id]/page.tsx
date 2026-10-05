"use client";

import { ChangeEvent, useEffect, useState } from "react";
import Link from "next/link";
import CatalogueDesignControls from "../../../components/CatalogueDesignControls";
import ProductGallery from "../../../components/ProductGallery";
import PublicCatalogueView from "../../../components/PublicCatalogueView";
import {
  defaultDesign,
  fetchCatalogue,
  fetchProductGalleries,
  markProjectPublished,
  readError,
  replaceCatalogueProducts,
  updateCatalogue,
  type CatalogueDesign,
  type DraftProduct,
} from "../../../lib/catalogue";
import { supabase } from "../../../lib/supabase";

export default function EditCatalogue({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [catalogueId, setCatalogueId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [business, setBusiness] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [website, setWebsite] = useState("");
  const [location, setLocation] = useState("");
  const [design, setDesign] = useState<CatalogueDesign>(defaultDesign);
  const [products, setProducts] = useState<DraftProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingProductId, setUploadingProductId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

  useEffect(() => {
    let cancelled = false;

    async function loadCatalogue() {
      try {
        const { id } = await params;
        if (!id) throw new Error("Invalid catalogue ID.");

        const catalogue = await fetchCatalogue(id);

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

        if (cancelled) return;

        setCatalogueId(catalogue.id);
        setName(catalogue.name);
        setBusiness(catalogue.business_name);
        setWhatsapp(catalogue.whatsapp || "");
        setPhone(catalogue.phone || "");
        setEmail(catalogue.email || "");
        setInstagram(catalogue.instagram || "");
        setFacebook(catalogue.facebook || "");
        setTiktok(catalogue.tiktok || "");
        setWebsite(catalogue.website || "");
        setLocation(catalogue.location || "");
        setDesign(catalogue.design);
        setProducts(
          rows.map((product) => {
            const storedImages = Array.isArray(
              (product as unknown as { images?: unknown }).images,
            )
              ? ((product as unknown as { images: unknown[] }).images || []).filter(
                  (image): image is string => typeof image === "string" && image.length > 0,
                )
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
              id: Number(product.id),
              name: product.name || "",
              price: product.price || "",
              description: product.description || "",
              image: images[0] || "",
              images,
            };
          }),
        );
      } catch (error) {
        if (cancelled) return;
        console.error("Edit catalogue loading error:", error);
        setMessageTone("error");
        setMessage(readError(error));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadCatalogue();

    return () => {
      cancelled = true;
    };
  }, [params]);

  function addProduct() {
    const nextId =
      products.length > 0 ? Math.max(...products.map((product) => product.id)) + 1 : 1;

    setProducts([
      ...products,
      {
        id: nextId,
        name: `Product ${nextId}`,
        price: "KSh 0",
        description: "Add a short description for this product.",
        image: "",
        images: [],
      },
    ]);
  }

  function removeProduct(id: number) {
    setProducts(products.filter((product) => product.id !== id));
  }

  function updateProduct(id: number, field: keyof DraftProduct, value: string) {
    setProducts((currentProducts) =>
      currentProducts.map((product) =>
        product.id === id ? { ...product, [field]: value } : product,
      ),
    );
  }

  function setProductImages(id: number, images: string[]) {
    setProducts((currentProducts) =>
      currentProducts.map((product) =>
        product.id === id ? { ...product, images, image: images[0] || "" } : product,
      ),
    );
  }

  async function handleImageUpload(id: number, event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const product = products.find((item) => item.id === id);

    if (!product) {
      event.target.value = "";
      return;
    }

    const currentImages = product.images || [];
    const remainingSlots = 5 - currentImages.length;

    if (remainingSlots <= 0) {
      setMessageTone("error");
      setMessage("This product already has 5 photos.");
      event.target.value = "";
      return;
    }

    const selectedFiles = files.slice(0, remainingSlots);

    if (files.length > remainingSlots) {
      setMessageTone("error");
      setMessage(
        `Only ${remainingSlots} more photo${remainingSlots === 1 ? "" : "s"} can be added.`,
      );
    }

    for (const file of selectedFiles) {
      if (!file.type.startsWith("image/")) {
        setMessageTone("error");
        setMessage(`"${file.name}" is not an image.`);
        event.target.value = "";
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setMessageTone("error");
        setMessage(`"${file.name}" is larger than 5MB.`);
        event.target.value = "";
        return;
      }
    }

    setUploadingProductId(id);

    try {
      const uploadedUrls: string[] = [];

      for (const file of selectedFiles) {
        const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const fileName = `${id}-${crypto.randomUUID()}.${extension}`;

        const { error } = await supabase.storage.from("catalogue-images").upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

        if (error) throw error;

        const { data } = supabase.storage.from("catalogue-images").getPublicUrl(fileName);
        uploadedUrls.push(data.publicUrl);
      }

      setProductImages(id, [...currentImages, ...uploadedUrls]);
    } catch (error) {
      console.error("Image upload error:", error);
      setMessageTone("error");
      setMessage(`Upload failed: ${readError(error)}`);
    } finally {
      setUploadingProductId(null);
      event.target.value = "";
    }
  }

  async function saveChanges() {
    if (!catalogueId) {
      setMessageTone("error");
      setMessage("This catalogue is not ready to save.");
      return;
    }

    if (!name.trim() || !business.trim()) {
      setMessageTone("error");
      setMessage("Catalogue name and business name are required.");
      return;
    }

    if (products.length === 0) {
      setMessageTone("error");
      setMessage("Add at least one product before saving.");
      return;
    }

    setSaving(true);
    setMessage("Saving changes...");
    setMessageTone("success");

    try {
      const updated = await updateCatalogue(
        catalogueId,
        {
          name,
          business,
          whatsapp,
          phone,
          email,
          instagram,
          facebook,
          tiktok,
          website,
          location,
        },
        design,
      );

      const galleryWarning = await replaceCatalogueProducts(catalogueId, products);
      await markProjectPublished(catalogueId);

      if (galleryWarning) {
        setMessageTone("error");
        setMessage(galleryWarning);
      } else if (!updated.designSaved) {
        setMessage("Changes saved. Design settings need the database update before they publish.");
      } else {
        setMessage("Changes saved.");
      }
    } catch (error) {
      console.error("Catalogue update error:", error);
      setMessageTone("error");
      setMessage(`Update failed: ${readError(error)}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="catalogue-builder">
        <div className="public-catalogue-loading">Loading catalogue...</div>
      </main>
    );
  }

  if (!catalogueId) {
    return (
      <main className="catalogue-builder">
        <div className="public-catalogue-error">
          <p>CATALOGUE</p>
          <h1>Catalogue not found.</h1>
          <span>{message || "This catalogue does not exist."}</span>
          <Link href="/dashboard" className="primary-button quiet-link">
            Back to workspace
          </Link>
        </div>
      </main>
    );
  }

  const previewCatalogue = {
    name: name || "Untitled catalogue",
    business_name: business || "Your business",
    whatsapp: whatsapp || null,
    phone: phone || null,
    email: email || null,
    instagram: instagram || null,
    facebook: facebook || null,
    tiktok: tiktok || null,
    website: website || null,
    location: location || null,
  };

  return (
    <main className="catalogue-builder">
      <aside className="builder-sidebar">
        <Link href="/dashboard" className="builder-brand">
          BKM<span>DIGITAL</span>
        </Link>

        <div className="builder-label">EDIT CATALOGUE</div>

        <nav className="builder-nav">
          <a href="#details">01 Details</a>
          <a href="#products">02 Products</a>
          <a href="#design">03 Design</a>
          <a href="#preview">04 Preview</a>
        </nav>

        <div className="builder-sidebar-bottom">
          <Link href="/dashboard">Back to workspace</Link>
        </div>
      </aside>

      <section className="builder-main">
        <header className="builder-header">
          <div>
            <p>PROJECT / EDIT CATALOGUE</p>
            <h1>Edit your catalogue.</h1>
          </div>

          <div className="builder-header-actions">
            <Link
              href={`/c/${catalogueId}`}
              className="secondary-button header-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              View live
            </Link>
            <button
              className="publish-button"
              type="button"
              onClick={saveChanges}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </header>

        {message ? (
          <div
            className={`catalogue-save-message ${messageTone === "error" ? "is-error" : ""}`}
            role="status"
          >
            <span>{message}</span>
            {messageTone === "success" ? (
              <Link href={`/c/${catalogueId}`} target="_blank" rel="noopener noreferrer">
                Open public catalogue
              </Link>
            ) : null}
          </div>
        ) : null}

        <section id="details" className="builder-section-panel">
          <p className="panel-number">01 / DETAILS</p>
          <h2>Catalogue information.</h2>

          <div className="details-grid">
            <label>
              Catalogue name
              <input value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label>
              Business name
              <input value={business} onChange={(event) => setBusiness(event.target.value)} />
            </label>
          </div>

          <div className="contact-fields">
            <p className="panel-number">CONTACT & SOCIAL</p>
            <div className="details-grid">
              <label>
                WhatsApp
                <input
                  value={whatsapp}
                  onChange={(event) => setWhatsapp(event.target.value)}
                  placeholder="+254 7XX XXX XXX"
                />
              </label>
              <label>
                Phone
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+254 7XX XXX XXX"
                />
              </label>
              <label>
                Email
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="hello@yourbusiness.com"
                />
              </label>
              <label>
                Instagram
                <input
                  value={instagram}
                  onChange={(event) => setInstagram(event.target.value)}
                  placeholder="@yourbusiness"
                />
              </label>
              <label>
                Facebook
                <input
                  value={facebook}
                  onChange={(event) => setFacebook(event.target.value)}
                  placeholder="facebook.com/yourbusiness"
                />
              </label>
              <label>
                TikTok
                <input
                  value={tiktok}
                  onChange={(event) => setTiktok(event.target.value)}
                  placeholder="@yourbusiness"
                />
              </label>
              <label>
                Website
                <input
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                  placeholder="https://yourwebsite.com"
                />
              </label>
              <label>
                Location
                <input
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="Mwihoko, Ruiru"
                />
              </label>
            </div>
          </div>
        </section>

        <section id="products" className="builder-section-panel">
          <div className="panel-top">
            <div>
              <p className="panel-number">02 / PRODUCTS</p>
              <h2>Your products.</h2>
            </div>
            <button className="add-product-button" type="button" onClick={addProduct}>
              Add product
            </button>
          </div>

          <div className="product-editor-list">
            {products.map((product, index) => (
              <article className="product-editor" key={product.id}>
                <span className="product-index">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="product-fields">
                  <div className="image-upload-area">
                    <ProductGallery
                      name={product.name}
                      images={product.images}
                      uploading={uploadingProductId === product.id}
                      onUpload={(event) => handleImageUpload(product.id, event)}
                      onMakePrimary={(imageIndex) => {
                        if (imageIndex === 0) return;
                        const images = [...product.images];
                        const [selectedImage] = images.splice(imageIndex, 1);
                        setProductImages(product.id, [selectedImage, ...images]);
                      }}
                      onRemoveImage={(imageIndex) => {
                        setProductImages(
                          product.id,
                          product.images.filter((_, current) => current !== imageIndex),
                        );
                      }}
                    />
                  </div>
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
                    placeholder="Price"
                  />
                  <textarea
                    value={product.description}
                    onChange={(event) =>
                      updateProduct(product.id, "description", event.target.value)
                    }
                    aria-label="Product description"
                    placeholder="Product description"
                  />
                </div>
                <button
                  type="button"
                  className="remove-product"
                  onClick={() => removeProduct(product.id)}
                >
                  Remove
                </button>
              </article>
            ))}
          </div>
        </section>

        <section id="design" className="builder-section-panel">
          <p className="panel-number">03 / DESIGN</p>
          <h2>Keep it unmistakably yours.</h2>
          <p className="panel-intro">
            Style changes appear in the preview and on the public catalogue after you save.
          </p>
          <CatalogueDesignControls design={design} onChange={setDesign} />
        </section>

        <section id="preview" className="builder-section-panel preview-panel">
          <p className="panel-number">04 / PREVIEW</p>
          <h2>This is what customers see.</h2>
          <div className="catalogue-preview-frame">
            <PublicCatalogueView
              catalogue={previewCatalogue}
              products={products.map((product) => ({
                id: String(product.id),
                name: product.name,
                price: product.price,
                description: product.description,
                images: product.images,
              }))}
              design={design}
              mode="preview"
              shareUrl={`/c/${catalogueId}`}
            />
          </div>
        </section>

        <footer className="builder-footer">BKM DIGITAL / CATALOGUE EDITOR</footer>
      </section>
    </main>
  );
}
