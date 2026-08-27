"use client";

import { useState } from "react";
import Link from "next/link";

type Section = {
  id: number;
  type: string;
  title: string;
  description: string;
};

const initialSections: Section[] = [
  {
    id: 1,
    type: "Hero",
    title: "Your business deserves a digital home.",
    description:
      "Introduce your business with a strong first impression and a clear call to action.",
  },
  {
    id: 2,
    type: "About",
    title: "Built around your business.",
    description:
      "Tell customers who you are, what you do and why they should choose you.",
  },
  {
    id: 3,
    type: "Services",
    title: "What we offer.",
    description:
      "Showcase your products, services or areas of expertise.",
  },
  {
    id: 4,
    type: "Contact",
    title: "Let's work together.",
    description:
      "Give customers an easy way to contact or visit your business.",
  },
];

export default function WebsiteBuilder() {
  const [business, setBusiness] = useState("Your Business");
  const [headline, setHeadline] = useState(
    "Your business deserves a digital home.",
  );
  const [description, setDescription] = useState(
    "Build a professional online presence with BKM DIGITAL.",
  );
  const [sections, setSections] = useState(initialSections);

  function addSection() {
    const nextId =
      sections.length > 0
        ? Math.max(...sections.map((section) => section.id)) + 1
        : 1;

    setSections([
      ...sections,
      {
        id: nextId,
        type: "Custom",
        title: "New section",
        description: "Add content to this section.",
      },
    ]);
  }

  function removeSection(id: number) {
    setSections(sections.filter((section) => section.id !== id));
  }

  function updateSection(
    id: number,
    field: keyof Section,
    value: string,
  ) {
    setSections(
      sections.map((section) =>
        section.id === id
          ? { ...section, [field]: value }
          : section,
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
          WEBSITE BUILDER
        </div>

        <nav className="builder-nav">
          <a href="#details">01&nbsp;&nbsp; Details</a>
          <a href="#sections">02&nbsp;&nbsp; Sections</a>
          <a href="#preview">03&nbsp;&nbsp; Preview</a>
        </nav>

        <div className="builder-sidebar-bottom">
          <Link href="/projects">← Back to projects</Link>
        </div>
      </aside>

      <section className="builder-main">
        <header className="builder-header">
          <div>
            <p>PROJECT / WEBSITE</p>
            <h1>Build your website.</h1>
          </div>

          <button
            className="publish-button"
            type="button"
          >
            Publish Website →
          </button>
        </header>

        <section
          id="details"
          className="builder-section-panel"
        >
          <p className="panel-number">01 / DETAILS</p>
          <h2>Business information.</h2>

          <div className="details-grid">
            <label>
              Business name
              <input
                value={business}
                onChange={(event) =>
                  setBusiness(event.target.value)
                }
              />
            </label>

            <label>
              Main headline
              <input
                value={headline}
                onChange={(event) =>
                  setHeadline(event.target.value)
                }
              />
            </label>

            <label>
              Introduction
              <textarea
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
              />
            </label>
          </div>
        </section>

        <section
          id="sections"
          className="builder-section-panel"
        >
          <div className="panel-top">
            <div>
              <p className="panel-number">02 / SECTIONS</p>
              <h2>Website structure.</h2>
            </div>

            <button
              className="add-product-button"
              type="button"
              onClick={addSection}
            >
              + Add section
            </button>
          </div>

          <div className="product-editor-list">
            {sections.map((section, index) => (
              <article
                className="product-editor"
                key={section.id}
              >
                <span className="product-index">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <div className="product-fields">
                  <input
                    value={section.type}
                    onChange={(event) =>
                      updateSection(
                        section.id,
                        "type",
                        event.target.value,
                      )
                    }
                    aria-label="Section type"
                    placeholder="Section type"
                  />

                  <input
                    value={section.title}
                    onChange={(event) =>
                      updateSection(
                        section.id,
                        "title",
                        event.target.value,
                      )
                    }
                    aria-label="Section title"
                    placeholder="Section title"
                  />

                  <textarea
                    value={section.description}
                    onChange={(event) =>
                      updateSection(
                        section.id,
                        "description",
                        event.target.value,
                      )
                    }
                    aria-label="Section description"
                    placeholder="Section description"
                  />
                </div>

                <button
                  type="button"
                  className="remove-product"
                  onClick={() =>
                    removeSection(section.id)
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
            <h2>{headline}</h2>
            <p>{description}</p>

            <div className="preview-grid">
              {sections.map((section) => (
                <div
                  className="preview-product"
                  key={section.id}
                >
                  <span>{section.type}</span>
                  <h3>{section.title}</h3>
                  <p>{section.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="builder-footer">
          BKM DIGITAL / WEBSITE BUILDER v1
        </footer>
      </section>
    </main>
  );
}
