"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PublicBriefView from "./PublicBriefView";
import { readError } from "../lib/catalogue";
import {
  describeSaveError,
  loadStudioDocument,
  normalizeSoftware,
  saveStudioDocument,
  studioPaths,
  type SoftwareFeature,
} from "../lib/studio";

const initialFeatures: SoftwareFeature[] = [
  {
    id: 1,
    title: "The daily task",
    detail: "Describe the job this software should take off someone's plate.",
  },
  {
    id: 2,
    title: "The people using it",
    detail: "Name who opens it, and what they need to finish.",
  },
  {
    id: 3,
    title: "The result",
    detail: "What should be true at the end of a normal day of use.",
  },
];

export default function SoftwareStudio({ documentId }: { documentId?: string }) {
  const [savedId, setSavedId] = useState<string | null>(documentId || null);
  const [business, setBusiness] = useState("Your Business");
  const [productName, setProductName] = useState("A tool for the work you repeat");
  const [problem, setProblem] = useState(
    "Tell us what currently takes too long, gets lost, or depends on one person.",
  );
  const [features, setFeatures] = useState(initialFeatures);
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
        if (document.kind !== "software") throw new Error("This is not a software brief.");
        const brief = normalizeSoftware(document.payload);
        if (cancelled) return;
        setSavedId(document.id);
        setBusiness(brief.business);
        setProductName(brief.productName);
        setProblem(brief.problem);
        setFeatures(brief.features);
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

  function briefPayload() {
    return { business, productName, problem, features };
  }

  function addFeature() {
    const nextId = features.length ? Math.max(...features.map((feature) => feature.id)) + 1 : 1;
    setFeatures([
      ...features,
      {
        id: nextId,
        title: "Another requirement",
        detail: "Add the next thing the software must do well.",
      },
    ]);
  }

  async function publish() {
    if (!business.trim() || !productName.trim() || !problem.trim()) {
      setTone("error");
      setMessage("Add the business, the product name, and the problem first.");
      return;
    }

    setSaving(true);
    setTone("success");
    setMessage("Saving the brief...");

    try {
      const saved = await saveStudioDocument({
        id: savedId,
        kind: "software",
        title: productName.trim(),
        payload: briefPayload(),
      });
      setSavedId(saved.id);
      setTone("success");
      setMessage("Brief saved. Share the link with anyone who needs to read it.");
    } catch (error) {
      console.error(error);
      setTone("error");
      setMessage(describeSaveError(error));
    } finally {
      setSaving(false);
    }
  }

  function emailBrief() {
    const brief = [
      `Business: ${business}`,
      `Software: ${productName}`,
      "",
      "The problem",
      problem,
      "",
      "Requirements",
      ...features.map((feature, index) => `${index + 1}. ${feature.title}\n${feature.detail}`),
    ].join("\n");

    window.location.href = `mailto:hello@bkmdigital.co.ke?subject=${encodeURIComponent(
      `Software brief: ${productName}`,
    )}&body=${encodeURIComponent(brief)}`;
  }

  const liveHref = savedId ? studioPaths("software", savedId).liveHref : "";

  if (loading) {
    return (
      <main className="catalogue-builder">
        <div className="public-catalogue-loading">Loading brief...</div>
      </main>
    );
  }

  return (
    <main className="catalogue-builder">
      <aside className="builder-sidebar">
        <Link href="/dashboard" className="builder-brand">
          BKM<span>DIGITAL</span>
        </Link>
        <div className="builder-label">SOFTWARE STUDIO</div>
        <nav className="builder-nav">
          <a href="#brief">01 Brief</a>
          <a href="#requirements">02 Requirements</a>
          <a href="#preview">03 Preview</a>
        </nav>
        <div className="builder-sidebar-bottom">
          <Link href="/dashboard">Back to workspace</Link>
        </div>
      </aside>

      <section className="builder-main">
        <header className="builder-header">
          <div>
            <p>PROJECT / SOFTWARE</p>
            <h1>Shape the tool.</h1>
          </div>
          <div className="builder-header-actions">
            <button className="secondary-button header-link" type="button" onClick={emailBrief}>
              Email brief
            </button>
            <button className="publish-button" type="button" onClick={publish} disabled={saving}>
              {saving ? "Saving..." : "Save brief"}
            </button>
          </div>
        </header>

        {message ? (
          <div className={`catalogue-save-message ${tone === "error" ? "is-error" : ""}`} role="status">
            <span>{message}</span>
            {liveHref && tone === "success" ? (
              <Link href={liveHref} target="_blank">
                Open brief
              </Link>
            ) : null}
          </div>
        ) : null}

        <section id="brief" className="builder-section-panel">
          <p className="panel-number">01 / BRIEF</p>
          <h2>Start from the work, not the technology.</h2>
          <p className="panel-intro">
            Custom software should fit the way the business already runs. Write the problem in plain language.
          </p>
          <div className="details-grid">
            <label>
              Business name
              <input value={business} onChange={(event) => setBusiness(event.target.value)} />
            </label>
            <label>
              What should we call it
              <input value={productName} onChange={(event) => setProductName(event.target.value)} />
            </label>
            <label className="span-two">
              The problem
              <textarea value={problem} onChange={(event) => setProblem(event.target.value)} />
            </label>
          </div>
        </section>

        <section id="requirements" className="builder-section-panel">
          <div className="panel-top">
            <div>
              <p className="panel-number">02 / REQUIREMENTS</p>
              <h2>What it must do.</h2>
            </div>
            <button className="add-product-button" type="button" onClick={addFeature}>
              Add requirement
            </button>
          </div>
          <div className="product-editor-list">
            {features.map((feature, index) => (
              <article className="product-editor" key={feature.id}>
                <span className="product-index">{String(index + 1).padStart(2, "0")}</span>
                <div className="product-fields">
                  <input
                    value={feature.title}
                    onChange={(event) =>
                      setFeatures((current) =>
                        current.map((item) =>
                          item.id === feature.id ? { ...item, title: event.target.value } : item,
                        ),
                      )
                    }
                    aria-label="Requirement title"
                  />
                  <textarea
                    value={feature.detail}
                    onChange={(event) =>
                      setFeatures((current) =>
                        current.map((item) =>
                          item.id === feature.id ? { ...item, detail: event.target.value } : item,
                        ),
                      )
                    }
                    aria-label="Requirement detail"
                  />
                </div>
                <button
                  type="button"
                  className="remove-product"
                  onClick={() =>
                    setFeatures((current) => current.filter((item) => item.id !== feature.id))
                  }
                >
                  Remove
                </button>
              </article>
            ))}
          </div>
        </section>

        <section id="preview" className="builder-section-panel preview-panel">
          <p className="panel-number">03 / PREVIEW</p>
          <h2>The brief, as it will be read.</h2>
          <PublicBriefView brief={briefPayload()} mode="preview" />
        </section>
        <footer className="builder-footer">BKM DIGITAL / SOFTWARE STUDIO</footer>
      </section>
    </main>
  );
}
