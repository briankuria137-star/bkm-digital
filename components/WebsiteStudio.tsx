"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PublicWebsiteView from "./PublicWebsiteView";
import { readError } from "../lib/catalogue";
import {
  describeSaveError,
  loadStudioDocument,
  normalizeWebsite,
  saveStudioDocument,
  studioPaths,
  type WebsiteSection,
} from "../lib/studio";

const initialSections: WebsiteSection[] = [
  {
    id: 1,
    type: "About",
    title: "Built around your business.",
    description: "Tell customers who you are, what you do, and why they should choose you.",
  },
  {
    id: 2,
    type: "Services",
    title: "What we offer.",
    description: "Showcase your products, services, or areas of expertise.",
  },
  {
    id: 3,
    type: "Work",
    title: "Proof, not promises.",
    description: "Share a result, a client story, or the kind of work you want to be known for.",
  },
];

const sectionTypes = ["About", "Services", "Work", "Visit", "Custom"];

export default function WebsiteStudio({ documentId }: { documentId?: string }) {
  const [savedId, setSavedId] = useState<string | null>(documentId || null);
  const [business, setBusiness] = useState("Your Business");
  const [headline, setHeadline] = useState("Your business deserves a digital home.");
  const [description, setDescription] = useState(
    "A clear introduction to who you are and how customers can start.",
  );
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [location, setLocation] = useState("");
  const [sections, setSections] = useState(initialSections);
  const [loading, setLoading] = useState(Boolean(documentId));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"success" | "error">("success");

  useEffect(() => {
    if (!documentId) return;
    let cancelled = false;

    async function load() {
      try {
        const document = await loadStudioDocument(documentId as string);
        if (document.kind !== "website") throw new Error("This is not a website project.");
        const site = normalizeWebsite(document.payload);
        if (cancelled) return;
        setSavedId(document.id);
        setBusiness(site.business);
        setHeadline(site.headline);
        setDescription(site.introduction);
        setPhone(site.phone);
        setEmail(site.email);
        setWhatsapp(site.whatsapp);
        setLocation(site.location);
        setSections(site.sections);
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

  function payload() {
    return {
      business,
      headline,
      introduction: description,
      phone,
      email,
      whatsapp,
      location,
      sections,
    };
  }

  function addSection() {
    const nextId = sections.length ? Math.max(...sections.map((section) => section.id)) + 1 : 1;
    setSections([
      ...sections,
      {
        id: nextId,
        type: "Custom",
        title: "New section",
        description: "Add the content customers should read here.",
      },
    ]);
  }

  function updateSection(id: number, field: keyof WebsiteSection, value: string) {
    setSections((current) =>
      current.map((section) => (section.id === id ? { ...section, [field]: value } : section)),
    );
  }

  async function publish() {
    if (!business.trim() || !headline.trim()) {
      setTone("error");
      setMessage("Add a business name and headline before publishing.");
      return;
    }

    setSaving(true);
    setTone("success");
    setMessage("Publishing your website...");

    try {
      const saved = await saveStudioDocument({
        id: savedId,
        kind: "website",
        title: business.trim(),
        payload: payload(),
      });
      setSavedId(saved.id);
      setTone("success");
      setMessage("Website published. The public link is ready.");
    } catch (error) {
      console.error(error);
      setTone("error");
      setMessage(describeSaveError(error));
    } finally {
      setSaving(false);
    }
  }

  const liveHref = savedId ? studioPaths("website", savedId).liveHref : "";

  if (loading) {
    return (
      <main className="catalogue-builder">
        <div className="public-catalogue-loading">Loading website...</div>
      </main>
    );
  }

  return (
    <main className="catalogue-builder">
      <aside className="builder-sidebar">
        <Link href="/dashboard" className="builder-brand">
          BKM<span>DIGITAL</span>
        </Link>
        <div className="builder-label">WEBSITE BUILDER</div>
        <nav className="builder-nav">
          <a href="#details">01 Details</a>
          <a href="#sections">02 Sections</a>
          <a href="#preview">03 Preview</a>
        </nav>
        <div className="builder-sidebar-bottom">
          <Link href="/projects">Back to projects</Link>
        </div>
      </aside>

      <section className="builder-main">
        <header className="builder-header">
          <div>
            <p>PROJECT / WEBSITE</p>
            <h1>{savedId ? "Edit your website." : "Build your website."}</h1>
          </div>
          <div className="builder-header-actions">
            {liveHref ? (
              <Link href={liveHref} className="secondary-button header-link" target="_blank">
                View live
              </Link>
            ) : null}
            <button className="publish-button" type="button" onClick={publish} disabled={saving}>
              {saving ? "Publishing..." : "Publish website"}
            </button>
          </div>
        </header>

        {message ? (
          <div className={`catalogue-save-message ${tone === "error" ? "is-error" : ""}`} role="status">
            <span>{message}</span>
            {liveHref && tone === "success" ? (
              <Link href={liveHref} target="_blank">
                Open website
              </Link>
            ) : null}
          </div>
        ) : null}

        <section id="details" className="builder-section-panel">
          <p className="panel-number">01 / DETAILS</p>
          <h2>Business information.</h2>
          <p className="panel-intro">
            This becomes the public homepage: a headline, a short introduction, and a way to reach you.
          </p>
          <div className="details-grid">
            <label>
              Business name
              <input value={business} onChange={(event) => setBusiness(event.target.value)} />
            </label>
            <label>
              Main headline
              <input value={headline} onChange={(event) => setHeadline(event.target.value)} />
            </label>
            <label className="span-two">
              Introduction
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} />
            </label>
            <label>
              Phone
              <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+254 7XX XXX XXX" />
            </label>
            <label>
              Email
              <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="hello@yourbusiness.com" />
            </label>
            <label>
              WhatsApp
              <input value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} placeholder="+254 7XX XXX XXX" />
            </label>
            <label>
              Location
              <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Nairobi" />
            </label>
          </div>
        </section>

        <section id="sections" className="builder-section-panel">
          <div className="panel-top">
            <div>
              <p className="panel-number">02 / SECTIONS</p>
              <h2>Website structure.</h2>
            </div>
            <button className="add-product-button" type="button" onClick={addSection}>
              Add section
            </button>
          </div>
          <div className="product-editor-list">
            {sections.map((section, index) => (
              <article className="product-editor" key={section.id}>
                <span className="product-index">{String(index + 1).padStart(2, "0")}</span>
                <div className="product-fields">
                  <select
                    value={sectionTypes.includes(section.type) ? section.type : "Custom"}
                    onChange={(event) => updateSection(section.id, "type", event.target.value)}
                    aria-label="Section type"
                  >
                    {sectionTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <input
                    value={section.title}
                    onChange={(event) => updateSection(section.id, "title", event.target.value)}
                    aria-label="Section title"
                    placeholder="Section title"
                  />
                  <textarea
                    value={section.description}
                    onChange={(event) => updateSection(section.id, "description", event.target.value)}
                    aria-label="Section description"
                    placeholder="Section description"
                  />
                </div>
                <button
                  type="button"
                  className="remove-product"
                  onClick={() => setSections((current) => current.filter((item) => item.id !== section.id))}
                >
                  Remove
                </button>
              </article>
            ))}
          </div>
        </section>

        <section id="preview" className="builder-section-panel preview-panel">
          <p className="panel-number">03 / PREVIEW</p>
          <h2>This is the public website.</h2>
          <div className="catalogue-preview-frame">
            <PublicWebsiteView site={payload()} mode="preview" />
          </div>
        </section>

        <footer className="builder-footer">BKM DIGITAL / WEBSITE BUILDER</footer>
      </section>
    </main>
  );
}
