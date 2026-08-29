"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Catalogue = {
  id: string;
  name: string;
  business_name: string;
};

export default function Dashboard() {
  const [catalogues, setCatalogues] = useState<Catalogue[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadCatalogues() {
      const { data, error } = await supabase
        .from("catalogues")
        .select("id, name, business_name")
        .order("id", { ascending: false });

      if (error) {
        console.error("Dashboard catalogue error:", error);
      } else {
        setCatalogues(data || []);
      }

      setLoading(false);
    }

    loadCatalogues();
  }, []);

  async function deleteCatalogue(catalogue: Catalogue) {
    const confirmed = window.confirm(
      `Delete "${catalogue.name}"?\n\nThis will permanently remove the catalogue and its products.`,
    );

    if (!confirmed) return;

    setDeletingId(catalogue.id);
    setMessage("");

    try {
      const { error: productsError } = await supabase
        .from("catalogue_products")
        .delete()
        .eq("catalogue_id", catalogue.id);

      if (productsError) {
        throw productsError;
      }

      const { error: catalogueError } = await supabase
        .from("catalogues")
        .delete()
        .eq("id", catalogue.id);

      if (catalogueError) {
        throw catalogueError;
      }

      setCatalogues((current) =>
        current.filter((item) => item.id !== catalogue.id),
      );

      setMessage("Catalogue deleted successfully.");
    } catch (error) {
      console.error("Delete catalogue error:", error);

      setMessage(
        error instanceof Error
          ? `Delete failed: ${error.message}`
          : "Delete failed. Please try again.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function shareCatalogue(catalogueId: string) {
    const url = `${window.location.origin}/c/${catalogueId}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "BKM DIGITAL Catalogue",
          text: "View this digital catalogue.",
          url,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setMessage("Catalogue link copied to clipboard.");
      } else {
        window.prompt("Copy this catalogue link:", url);
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("Share error:", error);
      }
    }
  }

  const projectCount = catalogues.length;
  const publishedCount = catalogues.length;
  const draftCount = 0;

  const stats = [
    {
      label: "Projects",
      value: String(projectCount).padStart(2, "0"),
    },
    {
      label: "Published",
      value: String(publishedCount).padStart(2, "0"),
    },
    {
      label: "Drafts",
      value: String(draftCount).padStart(2, "0"),
    },
    {
      label: "Templates",
      value: "00",
    },
  ];

  return (
    <main className="dashboard">
      <aside className="sidebar">
        <div className="dashboard-brand">
          BKM<span>DIGITAL</span>
        </div>

        <nav className="dashboard-nav">
          <a href="/dashboard" className="active">
            <span>01</span>
            Dashboard
          </a>

          <a href="#projects">
            <span>02</span>
            Projects
          </a>

          <Link href="/catalogue">
            <span>03</span>
            Catalogues
          </Link>

          <a href="#new-project">
            <span>04</span>
            Templates
          </a>

          <a href="#new-project">
            <span>05</span>
            Settings
          </a>
        </nav>

        <div className="sidebar-bottom">
          <p>BUILDING DIGITAL</p>
          <strong>
            ONE BUSINESS
            <br />
            AT A TIME.
          </strong>
        </div>
      </aside>

      <section className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-eyebrow">BKM DIGITAL / WORKSPACE</p>
            <h1>Good morning.</h1>
          </div>

          <Link href="/" className="back-link">
            ← View website
          </Link>
        </header>

        <section className="welcome-panel">
          <div>
            <p className="dashboard-eyebrow">YOUR DIGITAL WORKSPACE</p>

            <h2>What are we building today?</h2>

            <p>Create, manage and publish digital products from one place.</p>
          </div>

          <Link href="/catalogue" className="create-button">
            + New Project
          </Link>
        </section>

        <section className="stats-grid">
          {stats.map((stat) => (
            <div className="stat-card" key={stat.label}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </div>
          ))}
        </section>

        {message && (
          <div className="catalogue-save-message" role="status">
            {message}
          </div>
        )}

        <section id="projects" className="projects-section">
          <div className="section-top">
            <div>
              <p className="dashboard-eyebrow">RECENT WORK</p>
              <h2>Projects</h2>
            </div>

            <Link href="/catalogue">Create catalogue →</Link>
          </div>

          <div className="project-list">
            {loading ? (
              <article className="project-row">
                <div className="project-info">
                  <h3>Loading catalogues...</h3>
                  <p>Please wait.</p>
                </div>
              </article>
            ) : catalogues.length === 0 ? (
              <article className="project-row">
                <div className="project-index">01</div>

                <div className="project-info">
                  <h3>No catalogues yet</h3>
                  <p>Create your first digital catalogue.</p>
                </div>

                <Link href="/catalogue" className="view-catalogue-button">
                  Create Catalogue →
                </Link>
              </article>
            ) : (
              catalogues.map((catalogue, index) => (
                <article className="project-row" key={catalogue.id}>
                  <div className="project-index">
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  <div className="project-info">
                    <h3>{catalogue.name}</h3>
                    <p>{catalogue.business_name}</p>
                  </div>

                  <div className="project-status">
                    <span>Published</span>
                  </div>

                  <div className="project-updated">Catalogue</div>

                  <div className="project-actions">
                    <Link
                      href={`/catalogue/${catalogue.id}`}
                      className="project-action edit"
                    >
                      Edit
                    </Link>

                    <Link
                      href={`/c/${catalogue.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="project-action preview"
                    >
                      Preview
                    </Link>

                    <button
                      type="button"
                      className="project-action share"
                      onClick={() => shareCatalogue(catalogue.id)}
                    >
                      Share
                    </button>

                    <button
                      type="button"
                      className="project-action delete"
                      disabled={deletingId === catalogue.id}
                      onClick={() => deleteCatalogue(catalogue)}
                    >
                      {deletingId === catalogue.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section id="new-project" className="builder-section">
          <div>
            <p className="dashboard-eyebrow">START SOMETHING NEW</p>
            <h2>Choose what you want to build.</h2>
          </div>

          <div className="builder-grid">
            <Link href="/catalogue" className="builder-card">
              <span>01</span>
              <h3>Catalogue</h3>
              <p>Create a shareable digital product catalogue.</p>
              <strong>→</strong>
            </Link>

            <a href="/website" className="builder-card">
              <span>02</span>
              <h3>Website</h3>
              <p>Build a professional website for a business.</p>
              <strong>→</strong>
            </a>

            <a href="/shop" className="builder-card">
              <span>03</span>
              <h3>Online Shop</h3>
              <p>Turn products into a complete online storefront.</p>
              <strong>→</strong>
            </a>

            <a href="/software" className="builder-card">
              <span>04</span>
              <h3>Software</h3>
              <p>Create a custom digital tool around a business need.</p>
              <strong>→</strong>
            </a>
          </div>
        </section>

        <footer className="builder-footer">BKM DIGITAL / WORKSPACE v1</footer>
      </section>
    </main>
  );
}
