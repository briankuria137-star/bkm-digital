"use client";

import { ChangeEvent, useState } from "react";
import Link from "next/link";
import CatalogueDesignControls from "../../components/CatalogueDesignControls";
import ProductGallery from "../../components/ProductGallery";
import PublicCatalogueView from "../../components/PublicCatalogueView";
import {
  createCatalogue,
  defaultDesign,
  markProjectPublished,
  readError,
  replaceCatalogueProducts,
  updateCatalogue,
  type CatalogueDesign,
  type DraftProduct,
} from "../../lib/catalogue";
import { supabase } from "../../lib/supabase";

const initialProducts: DraftProduct[] = [
  {
    id: 1,
    name: "Classic Sneaker",
    price: "KSh 1,500",
    description: "Clean everyday sneaker for a modern casual look.",
    image: "",
    images: [],
  },
  {
    id: 2,
    name: "Premium Loafer",
    price: "KSh 2,000",
    description: "Smart leather-style loafer for work and occasions.",
    image: "",
    images: [],
  },
];

export default function CatalogueBuilder() {
  const [products, setProducts] = useState<DraftProduct[]>(initialProducts);
  const [name, setName] = useState("My New Catalogue");
  const [business, setBusiness] = useState("Your Business");
  const [whatsapp, setWhatsapp] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [website, setWebsite] = useState("");
  const [location, setLocation] = useState("");
  const [design, setDesign] = useState<CatalogueDesign>(defaultDesign);
  const [catalogueId, setCatalogueId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingProductId, setUploadingProductId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

  function addProduct() {
    const nextId = products.length
      ? Math.max(...products.map((product) => product.id)) + 1
      : 1;

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
        product.id === id
          ? { ...product, images, image: images[0] || "" }
          : product,
      ),
    );
  }

  async function handleImageUpload(id: number, event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const product = products.find((item) => item.id === id);
    if (!product) return;

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
        setMessage("Please choose image files only.");
        event.target.value = "";
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setMessageTone("error");
        setMessage(`${file.name} is larger than 5MB.`);
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

        const { error } = await supabase.storage
          .from("catalogue-images")
          .upload(fileName, file, {
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

  async function saveCatalogue() {
    if (!name.trim()) {
      setMessageTone("error");
      setMessage("Enter a catalogue name before saving.");
      return;
    }

    if (!business.trim()) {
      setMessageTone("error");
      setMessage("Enter a business name before saving.");
      return;
    }

    if (products.length === 0) {
      setMessageTone("error");
      setMessage("Add at least one product before saving.");
      return;
    }

    setSaving(true);
    setMessage("Saving your catalogue...");
    setMessageTone("success");

    const input = {
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
    };

    try {
      let currentId = catalogueId;
      let designSaved = true;

      if (!currentId) {
        const created = await createCatalogue(input, design);
        currentId = created.id;
        designSaved = created.designSaved;
        setCatalogueId(created.id);
      } else {
        const updated = await updateCatalogue(currentId, input, design);
        designSaved = updated.designSaved;
      }

      const galleryWarning = await replaceCatalogueProducts(currentId, products);
      await markProjectPublished(currentId);

      if (galleryWarning) {
        setMessageTone("error");
        setMessage(galleryWarning);
      } else if (!designSaved) {
        setMessageTone("success");
        setMessage(
          "Catalogue saved. Add the design update to your database to keep style choices on the public link.",
        );
      } else {
        setMessageTone("success");
        setMessage("Catalogue saved. It is ready to share.");
      }
    } catch (error) {
      console.error("Save catalogue error:", error);
      setMessageTone("error");
      setMessage(`Save failed: ${readError(error)}`);
    } finally {
      setSaving(false);
    }
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

        <div className="builder-label">CATALOGUE BUILDER</div>

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
            <p>PROJECT / NEW CATALOGUE</p>
            <h1>Build your catalogue.</h1>
          </div>

          <div className="builder-header-actions">
            {catalogueId ? (
              <Link
                href={`/c/${catalogueId}`}
                className="secondary-button header-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                View live
              </Link>
            ) : null}
            <button
              className="publish-button"
              type="button"
              onClick={saveCatalogue}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save catalogue"}
            </button>
          </div>
        </header>

        {message ? (
          <div
            className={`catalogue-save-message ${messageTone === "error" ? "is-error" : ""}`}
            role="status"
          >
            <span>{message}</span>
            {catalogueId && messageTone === "success" ? (
              <Link href={`/c/${catalogueId}`} target="_blank" rel="noopener noreferrer">
                Open public catalogue
              </Link>
            ) : null}
          </div>
        ) : null}

        <section id="details" className="builder-section-panel">
          <p className="panel-number">01 / DETAILS</p>
          <h2>Start with the basics.</h2>

          <div className="details-grid">
            <label>
              Catalogue name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Yobby Kicks"
              />
            </label>

            <label>
              Business name
              <input
                value={business}
                onChange={(event) => setBusiness(event.target.value)}
                placeholder="Your business"
              />
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
                  inputMode="tel"
                />
              </label>
              <label>
                Phone
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+254 7XX XXX XXX"
                  inputMode="tel"
                />
              </label>
              <label>
                Email
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="hello@yourbusiness.com"
                  inputMode="email"
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
                  inputMode="url"
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
                          product.images.filter((_, index) => index !== imageIndex),
                        );
                      }}
                    />
                  </div>

                  <input
                    value={product.name}
                    onChange={(event) =>
                      updateProduct(product.id, "name", event.target.value)
                    }
                    aria-label="Product name"
                    placeholder="Product name"
                  />
                  <input
                    value={product.price}
                    onChange={(event) =>
                      updateProduct(product.id, "price", event.target.value)
                    }
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
            Choose a style, layout, accent, and corner treatment. The preview
            updates immediately.
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
                images: product.images.length
                  ? product.images
                  : product.image
                    ? [product.image]
                    : [],
              }))}
              design={design}
              mode="preview"
            />
          </div>
        </section>

        <footer className="builder-footer">BKM DIGITAL / CATALOGUE BUILDER</footer>
      </section>
    </main>
  );
}
