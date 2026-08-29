"use client";
import Image from "next/image";

import { ChangeEvent, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Product = {
  id: number;
  name: string;
  price: string;
  description: string;
  image: string;
  images: string[];
};

const initialProducts: Product[] = [
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
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [name, setName] = useState("My New Catalogue");
  const [business, setBusiness] = useState("Your Business");
  const [whatsapp, setWhatsapp] = useState("");
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [website, setWebsite] = useState("");
  const [location, setLocation] = useState("");

  const [catalogueId, setCatalogueId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingProductId, setUploadingProductId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

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
        description: "Add a description for this product.",
        image: "",
        images: [],
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
    setProducts((currentProducts) =>
      currentProducts.map((product) =>
        product.id === id ? { ...product, [field]: value } : product,
      ),
    );
  }

  async function handleImageUpload(
    id: number,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const files = Array.from(event.target.files || []);

    if (!files.length) return;

    const product = products.find((item) => item.id === id);

    if (!product) return;

    const currentImages = product.images || [];
    const remainingSlots = 5 - currentImages.length;

    if (remainingSlots <= 0) {
      alert("This product already has 5 photos.");
      event.target.value = "";
      return;
    }

    if (files.length > remainingSlots) {
      alert(
        `You can upload up to 5 photos per product. ${remainingSlots} slot(s) remaining.`,
      );
      event.target.value = "";
      return;
    }

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        alert("Please select image files only.");
        event.target.value = "";
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is larger than 5MB.`);
        event.target.value = "";
        return;
      }
    }

    setUploadingProductId(id);

    try {
      const uploadedUrls: string[] = [];

      for (const file of files) {
        const extension =
          file.name.split(".").pop()?.toLowerCase() || "jpg";

        const fileName =
          `${id}-${crypto.randomUUID()}.${extension}`;

        const { error } = await supabase.storage
          .from("catalogue-images")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type,
          });

        if (error) {
          throw error;
        }

        const { data } = supabase.storage
          .from("catalogue-images")
          .getPublicUrl(fileName);

        uploadedUrls.push(data.publicUrl);
      }

      setProducts((currentProducts) =>
        currentProducts.map((item) => {
          if (item.id !== id) return item;

          const images = [
            ...(item.images || []),
            ...uploadedUrls,
          ];

          return {
            ...item,
            images,
            image: images[0] || "",
          };
        }),
      );
    } catch (error) {
      console.error("Image upload error:", error);

      alert(
        error instanceof Error
          ? `Upload failed: ${error.message}`
          : "Upload failed. Please try again.",
      );
    } finally {
      setUploadingProductId(null);
      event.target.value = "";
    }
  }

  function removeImage(id: number) {
    setProducts((currentProducts) =>
      currentProducts.map((item) =>
        item.id === id
          ? { ...item, images: [], image: "" }
          : item,
      ),
    );
  }

  async function saveCatalogue() {
    if (!name.trim()) { alert("Please enter a catalogue name."); return; }
    if (!business.trim()) { alert("Please enter a business name."); return; }
    if (products.length === 0) { alert("Add at least one product before saving."); return; }

    setSaving(true);
    setMessage("STEP 1: SAVE STARTED");

    try {
      let currentCatalogueId = catalogueId;

      if (!currentCatalogueId) {
        setMessage("STEP 2: Creating project...");

        const { data: project, error: projectError } = await supabase
          .from("projects")
          .insert({
            name: name.trim(),
            type: "catalogue",
            status: "draft",
          })
          .select("id")
          .single();

        if (projectError) throw projectError;
        if (!project) throw new Error("Project was not returned.");

        setMessage("STEP 3: Project created. Creating catalogue...");

        const { data: catalogue, error: catalogueError } = await supabase
          .from("catalogues")
          .insert({
            project_id: project.id,
            name: name.trim(),
            business_name: business.trim(),
            whatsapp: whatsapp.trim() || null,
            phone: phone.trim() || null,
            instagram: instagram.trim() || null,
            facebook: facebook.trim() || null,
            tiktok: tiktok.trim() || null,
            website: website.trim() || null,
            location: location.trim() || null,
          })
          .select("id")
          .single();

        if (catalogueError) throw catalogueError;
        if (!catalogue) throw new Error("Catalogue was not returned.");

        currentCatalogueId = catalogue.id;
        setCatalogueId(catalogue.id);
      } else {
        setMessage("STEP 3: Updating catalogue...");

        const { error } = await supabase
          .from("catalogues")
          .update({
            name: name.trim(),
            business_name: business.trim(),
          whatsapp: whatsapp.trim() || null,
          phone: phone.trim() || null,
          instagram: instagram.trim() || null,
          facebook: facebook.trim() || null,
          tiktok: tiktok.trim() || null,
          website: website.trim() || null,
          location: location.trim() || null,
        })
        .eq("id", currentCatalogueId);

        if (error) throw error;

        const { error: deleteError } = await supabase
          .from("catalogue_products")
          .delete()
          .eq("catalogue_id", currentCatalogueId);

        if (deleteError) throw deleteError;
      }

      setMessage("STEP 4: Saving products...");

      const productRows = products.map((product) => ({
        catalogue_id: currentCatalogueId,
        name: product.name.trim(),
        price: product.price.trim(),
        description: product.description.trim(),
        image: product.image || null,
      }));

      const { error: productError } = await supabase
        .from("catalogue_products")
        .insert(productRows);

      if (productError) throw productError;

      setMessage("STEP 5: SAVE COMPLETE — ID: " + currentCatalogueId);
      console.log("SAVE COMPLETE:", currentCatalogueId);

    } catch (error) {
      console.error("Save catalogue error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setMessage("SAVE FAILED: " + errorMessage);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="catalogue-builder">
      <aside className="builder-sidebar">
        <Link href="/dashboard" className="builder-brand">
          BKM<span>DIGITAL</span>
        </Link>

        <div className="builder-label">CATALOGUE BUILDER</div>

        <nav className="builder-nav">
          <a href="#details">01&nbsp;&nbsp; Details</a>
          <a href="#products">02&nbsp;&nbsp; Products</a>
          <a href="#design">03&nbsp;&nbsp; Design</a>
          <a href="#preview">04&nbsp;&nbsp; Preview</a>
        </nav>

        <div className="builder-sidebar-bottom">
          <Link href="/dashboard">← Back to workspace</Link>
        </div>
      </aside>

      <section className="builder-main">
        <header className="builder-header">
          <div>
            <p>PROJECT / NEW CATALOGUE</p>
            <h1>Build your catalogue.</h1>
          </div>

          <button
            className="publish-button"
            type="button"
            onClick={saveCatalogue}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Catalogue →"}
          </button>
        </header>

        {message && (
          <div className="catalogue-save-message" role="status">
            {message}
          </div>
        )}

        <section id="details" className="builder-section-panel">
  <p className="panel-number">01 / DETAILS</p>
  <h2>Start with the basics.</h2>

  <div className="details-grid">
    <label>
      Catalogue name
      <input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Yobby Kicks" />
    </label>

    <label>
      Business name
      <input value={business} onChange={(event) => setBusiness(event.target.value)} placeholder="e.g. BKM DIGITAL" />
    </label>
  </div>

  <div className="contact-fields">
    <p className="panel-number">CONTACT & SOCIAL</p>
    <div className="details-grid">
      <label>
        WhatsApp
        <input value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} placeholder="+254 7XX XXX XXX" />
      </label>

      <label>
        Phone
        <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+254 7XX XXX XXX" />
      </label>

      <label>
        Instagram
        <input value={instagram} onChange={(event) => setInstagram(event.target.value)} placeholder="" />
      </label>

      <label>
        Facebook
        <input value={facebook} onChange={(event) => setFacebook(event.target.value)} placeholder="facebook.com/yourbusiness" />
      </label>

      <label>
        TikTok
        <input value={tiktok} onChange={(event) => setTiktok(event.target.value)} placeholder="" />
      </label>

      <label>
        Website
        <input value={website} onChange={(event) => setWebsite(event.target.value)} placeholder="https://yourwebsite.com" />
      </label>

      <label>
        Location
        <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Mwihoko, Ruiru" />
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
              <article className="product-editor" key={product.id}>
                <span className="product-index">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <div className="product-fields">
                  <div className="image-upload-area">
  {product.images && product.images.length > 0 ? (
    <>
      <div className="product-gallery-main">
        <Image
          src={product.images[0]}
          unoptimized
          alt={product.name || "Product image"}
          width={800}
          height={800}
          className="uploaded-product-image"
        />
        <span className="primary-image-badge">PRIMARY</span>
      </div>

      <div className="product-gallery-thumbnails">
        {product.images.map((image, imageIndex) => (
          <div
            className={`product-gallery-thumbnail ${
              imageIndex === 0 ? "active" : ""
            }`}
            key={`${image}-${imageIndex}`}
          >
            <button
              type="button"
              className="thumbnail-select"
              onClick={() => {
                if (imageIndex === 0) return;

                setProducts((currentProducts) =>
                  currentProducts.map((item) => {
                    if (item.id !== product.id) return item;

                    const images = [...item.images];
                    const [selectedImage] = images.splice(imageIndex, 1);

                    return {
                      ...item,
                      images: [selectedImage, ...images],
                      image: selectedImage || "",
                    };
                  }),
                );
              }}
            >
              <Image
                src={image}
                unoptimized
                alt={`${product.name || "Product"} image ${imageIndex + 1}`}
                width={160}
                height={160}
              />
            </button>

            <button
              type="button"
              className="thumbnail-remove"
              onClick={() => {
                setProducts((currentProducts) =>
                  currentProducts.map((item) => {
                    if (item.id !== product.id) return item;

                    const images = item.images.filter(
                      (_, index) => index !== imageIndex,
                    );

                    return {
                      ...item,
                      images,
                      image: images[0] || "",
                    };
                  }),
                );
              }}
              aria-label={`Remove image ${imageIndex + 1}`}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="gallery-upload-footer">
        <span>{product.images.length}/5 photos</span>

        {product.images.length < 5 && (
          <label className="gallery-add-button">
            {uploadingProductId === product.id
              ? "Uploading..."
              : "+ Add photos"}

            <input
              type="file"
              accept="image/*"
              multiple
              disabled={uploadingProductId === product.id}
              onChange={(event) =>
                handleImageUpload(product.id, event)
              }
            />
          </label>
        )}
      </div>
    </>
  ) : (
    <label className="upload-box">
      <span>+</span>
      <strong>Upload product photos</strong>
      <small>Up to 5 photos · JPG, PNG or WEBP · Max 5MB each</small>

      <input
        type="file"
        accept="image/*"
        multiple
        disabled={uploadingProductId === product.id}
        onChange={(event) =>
          handleImageUpload(product.id, event)
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

          <div className="design-options">
            <div>
              <span>STYLE</span>
              <strong>Minimal / Editorial</strong>
            </div>

            <div>
              <span>LAYOUT</span>
              <strong>Product Grid</strong>
            </div>

            <div>
              <span>ACCENT</span>
              <strong>Black &amp; White</strong>
            </div>
          </div>
        </section>

        <section
          id="preview"
          className="builder-section-panel preview-panel"
        >
          <p className="panel-number">04 / PREVIEW</p>

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
                    <Image
                        className="preview-product-image"
                        src={product.image}
                        alt={product.name}
                        width={800}
                        height={800}
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
          BKM DIGITAL / CATALOGUE BUILDER v1
        </footer>
      </section>
    </main>
  );
}
