"use client";
import Image from "next/image";

import { useState } from "react";
import Link from "next/link";

type ShopProduct = {
  id: number;
  name: string;
  price: string;
  category: string;
  description: string;
  image: string;
  featured: boolean;
  available: boolean;
};

const initialProducts: ShopProduct[] = [
  {
    id: 1,
    name: "Featured Product",
    price: "KSh 0",
    category: "General",
    description: "Add your product description here.",
    image: "",
    featured: true,
    available: true,
  },
];

export default function ShopBuilder() {
  const [business, setBusiness] = useState("Your Business");
  const [shopName, setShopName] = useState("Your Online Shop");
  const [headline, setHeadline] = useState(
    "Everything you need, in one place.",
  );
  const [description, setDescription] = useState(
    "Discover our products and order directly from our online shop.",
  );
  const [whatsapp, setWhatsapp] = useState("");
  const [currency, setCurrency] = useState("KSh");
  const [products, setProducts] = useState<ShopProduct[]>(initialProducts);

  function addProduct() {
    const nextId =
      products.length > 0
        ? Math.max(...products.map((product) => product.id)) + 1
        : 1;

    setProducts([
      ...products,
      {
        id: nextId,
        name: `Product ${nextId}`,
        price: "KSh 0",
        category: "General",
        description: "Add a description for this product.",
        image: "",
        featured: false,
        available: true,
      },
    ]);
  }

  function removeProduct(id: number) {
    setProducts(products.filter((product) => product.id !== id));
  }

  function updateProduct(
    id: number,
    field: keyof ShopProduct,
    value: string | boolean,
  ) {
    setProducts(
      products.map((product) =>
        product.id === id
          ? { ...product, [field]: value }
          : product,
      ),
    );
  }

  return (
    <main className="catalogue-builder">
      <aside className="builder-sidebar">
        <Link href="/dashboard" className="builder-brand">
          BKM<span>DIGITAL</span>
        </Link>

        <div className="builder-label">
          ONLINE SHOP BUILDER
        </div>

        <nav className="builder-nav">
          <a href="#details">01&nbsp;&nbsp; Shop Details</a>
          <a href="#products">02&nbsp;&nbsp; Products</a>
          <a href="#settings">03&nbsp;&nbsp; Shop Settings</a>
          <a href="#preview">04&nbsp;&nbsp; Preview</a>
        </nav>

        <div className="builder-sidebar-bottom">
          <Link href="/projects">← Back to projects</Link>
        </div>
      </aside>

      <section className="builder-main">
        <header className="builder-header">
          <div>
            <p>PROJECT / ONLINE SHOP</p>
            <h1>Build your online shop.</h1>
          </div>

          <button
            className="publish-button"
            type="button"
            onClick={() =>
              alert("Shop publishing will be connected next.")
            }
          >
            Publish Shop →
          </button>
        </header>

        <section
          id="details"
          className="builder-section-panel"
        >
          <p className="panel-number">01 / SHOP DETAILS</p>

          <h2>Your storefront.</h2>

          <div className="details-grid">
            <label>
              Business name
              <input
                value={business}
                onChange={(event) =>
                  setBusiness(event.target.value)
                }
                placeholder="Business name"
              />
            </label>

            <label>
              Shop name
              <input
                value={shopName}
                onChange={(event) =>
                  setShopName(event.target.value)
                }
                placeholder="Shop name"
              />
            </label>

            <label>
              Main headline
              <input
                value={headline}
                onChange={(event) =>
                  setHeadline(event.target.value)
                }
                placeholder="Your main shop headline"
              />
            </label>

            <label>
              WhatsApp number
              <input
                value={whatsapp}
                onChange={(event) =>
                  setWhatsapp(event.target.value)
                }
                placeholder="2547XXXXXXXX"
              />
            </label>

            <label>
              Shop introduction
              <textarea
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="Tell customers about your shop"
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
              <h2>Your inventory.</h2>
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
                    placeholder={`${currency} 0`}
                  />

                  <input
                    value={product.category}
                    onChange={(event) =>
                      updateProduct(
                        product.id,
                        "category",
                        event.target.value,
                      )
                    }
                    aria-label="Product category"
                    placeholder="Category"
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

                  <div className="details-grid">
                    <label>
                      Product image URL
                      <input
                        value={product.image}
                        onChange={(event) =>
                          updateProduct(
                            product.id,
                            "image",
                            event.target.value,
                          )
                        }
                        placeholder="https://..."
                      />
                    </label>

                    <label>
                      Availability
                      <select
                        value={product.available ? "available" : "sold-out"}
                        onChange={(event) =>
                          updateProduct(
                            product.id,
                            "available",
                            event.target.value === "available",
                          )
                        }
                      >
                        <option value="available">
                          Available
                        </option>
                        <option value="sold-out">
                          Sold out
                        </option>
                      </select>
                    </label>
                  </div>

                  <label>
                    Featured product
                    <select
                      value={product.featured ? "yes" : "no"}
                      onChange={(event) =>
                        updateProduct(
                          product.id,
                          "featured",
                          event.target.value === "yes",
                        )
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
                  onClick={() => removeProduct(product.id)}
                >
                  Remove
                </button>
              </article>
            ))}
          </div>
        </section>

        <section
          id="settings"
          className="builder-section-panel"
        >
          <p className="panel-number">03 / SHOP SETTINGS</p>

          <h2>Commerce settings.</h2>

          <div className="details-grid">
            <label>
              Currency
              <select
                value={currency}
                onChange={(event) =>
                  setCurrency(event.target.value)
                }
              >
                <option value="KSh">KSh — Kenyan Shilling</option>
                <option value="$">$ — US Dollar</option>
                <option value="£">£ — Pound Sterling</option>
                <option value="€">€ — Euro</option>
              </select>
            </label>

            <label>
              Order method
              <input
                value="WhatsApp"
                readOnly
              />
            </label>
          </div>

          <div className="welcome-panel">
            <div>
              <p className="dashboard-eyebrow">
                DIRECT ORDERS
              </p>
              <h2>WhatsApp commerce.</h2>
              <p>
                Customers will be able to select products and
                send their order directly to your WhatsApp
                number.
              </p>
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
            <h2>{shopName}</h2>
            <h3>{headline}</h3>
            <p>{description}</p>

            <div className="preview-grid">
              {products.map((product) => (
                <div
                  className="preview-product"
                  key={product.id}
                >
                  {product.image ? (
                    <Image
                    src={product.image}
                    alt={product.name}
                    width={800}
                    height={800}
                    className="preview-product-image"
                  />
                  ) : (
                    <div className="preview-image">
                      PRODUCT
                    </div>
                  )}

                  {product.featured && (
                    <span>FEATURED</span>
                  )}

                  <small>{product.category}</small>

                  <h3>{product.name}</h3>

                  <strong>{product.price}</strong>

                  <p>{product.description}</p>

                  <button type="button">
                    Order on WhatsApp
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="builder-footer">
          BKM DIGITAL / ONLINE SHOP BUILDER v1
        </footer>
      </section>
    </main>
  );
}
