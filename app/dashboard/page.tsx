"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readError } from "../../lib/catalogue";
import { deleteWorkspaceItem, loadWorkspace, type WorkspaceItem } from "../../lib/studio";

export default function Dashboard() {
  const [items, setItems] = useState<WorkspaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [greeting, setGreeting] = useState("Welcome back.");

  useEffect(() => {
    const hour = new Date().getHours();
    const next =
      hour < 12 ? "Good morning." : hour < 17 ? "Good afternoon." : "Good evening.";
    const timer = window.setTimeout(() => setGreeting(next), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    async function loadItems() {
      try {
        setItems(await loadWorkspace());
      } catch (error) {
        console.error("Workspace load error:", error);
        setLoadError(readError(error));
      } finally {
        setLoading(false);
      }
    }

    loadItems();
  }, []);

  async function deleteItem(item: WorkspaceItem) {
    const confirmed = window.confirm(
      `Delete "${item.name}"?\n\nThis permanently removes the ${item.type} and its public link.`,
    );

    if (!confirmed) return;

    setDeletingId(item.id);
    setMessage("");

    try {
      await deleteWorkspaceItem(item);
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      setMessage("Project deleted.");
    } catch (error) {
      console.error("Delete error:", error);
      setMessage(`Delete failed: ${readError(error)}`);
    } finally {
      setDeletingId(null);
    }
  }

  async function shareItem(item: WorkspaceItem) {
    const url = `${window.location.origin}${item.liveHref}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: item.name,
          text: `${item.name} — ${item.detail}`,
          url,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setMessage("Link copied.");
      } else {
        window.prompt("Copy this link:", url);
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("Share error:", error);
      }
    }
  }

  const projectCount = items.length;
  const publishedCount = items.filter(
    (item) => item.status === "published" || item.status === "live",
  ).length;
  const draftCount = items.filter((item) => item.status === "draft").length;

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
      label: "Builders",
      value: "04",
    },
  ];

  return (
    <main className="dashboard">
      <aside className="sidebar">
        <div className="dashboard-brand">
          BKM<span>DIGITAL</span>
        </div>

        <nav className="dashboard-nav">
          <Link href="/dashboard" className="active">
            <span>01</span>
            Dashboard
          </Link>

          <Link href="/projects">
            <span>02</span>
            Projects
          </Link>

          <Link href="/catalogue">
            <span>03</span>
            Catalogues
          </Link>

          <a href="#new-project">
            <span>04</span>
            Builders
          </a>

          <a href="#workspace">
            <span>05</span>
            Studio
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
            <h1>{greeting}</h1>
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
                  <h3>Loading projects...</h3>
                  <p>Please wait.</p>
                </div>
              </article>
            ) : loadError ? (
              <article className="project-row">
                <div className="project-index">—</div>
                <div className="project-info">
                  <h3>Projects could not be loaded</h3>
                  <p>{loadError}</p>
                </div>
              </article>
            ) : items.length === 0 ? (
              <article className="project-row">
                <div className="project-index">01</div>

                <div className="project-info">
                  <h3>No projects yet</h3>
                  <p>Start with a catalogue, website, shop, or software brief.</p>
                </div>

                <Link href="/catalogue" className="view-catalogue-button">
                  Create catalogue
                </Link>
              </article>
            ) : (
              items.map((item, index) => (
                <article className="project-row" key={`${item.type}-${item.id}`}>
                  <div className="project-index">
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  <div className="project-info">
                    <h3>{item.name}</h3>
                    <p>{item.detail}</p>
                  </div>

                  <div className="project-status">
                    <span>{item.status}</span>
                  </div>

                  <div className="project-updated">{item.type}</div>

                  <div className="project-actions">
                    <Link href={item.editHref} className="project-action edit">
                      Edit
                    </Link>

                    <Link
                      href={item.liveHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="project-action preview"
                    >
                      Preview
                    </Link>

                    <button
                      type="button"
                      className="project-action share"
                      onClick={() => shareItem(item)}
                    >
                      Share
                    </button>

                    <button
                      type="button"
                      className="project-action delete"
                      disabled={deletingId === item.id}
                      onClick={() => deleteItem(item)}
                    >
                      {deletingId === item.id ? "Deleting..." : "Delete"}
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

            <Link href="/website" className="builder-card">
              <span>02</span>
              <h3>Website</h3>
              <p>Build a professional website for a business.</p>
              <strong>→</strong>
            </Link>

            <Link href="/shop" className="builder-card">
              <span>03</span>
              <h3>Online Shop</h3>
              <p>Turn products into a complete online storefront.</p>
              <strong>→</strong>
            </Link>

            <Link href="/software" className="builder-card">
              <span>04</span>
              <h3>Software</h3>
              <p>Create a custom digital tool around a business need.</p>
              <strong>→</strong>
            </Link>
          </div>
        </section>

        <section id="workspace" className="builder-section studio-panel">
          <div>
            <p className="dashboard-eyebrow">STUDIO</p>
            <h2>A quieter place to work.</h2>
          </div>
          <div className="studio-grid">
            <article>
              <span>01</span>
              <h3>Catalogues go live when you save.</h3>
              <p>
                A saved catalogue has a public link your customers can open, share,
                and use to order on WhatsApp.
              </p>
            </article>
            <article>
              <span>02</span>
              <h3>Websites, shops, and software.</h3>
              <p>
                Save a website, shop, or software brief and it gets a public link,
                the same way a catalogue does.
              </p>
            </article>
            <article>
              <span>03</span>
              <h3>Need a hand?</h3>
              <p>
                Write to{" "}
                <a href="mailto:hello@bkmdigital.co.ke">hello@bkmdigital.co.ke</a>{" "}
                and we will pick it up from the brief.
              </p>
            </article>
          </div>
        </section>

        <footer className="builder-footer">BKM DIGITAL / WORKSPACE</footer>
      </section>
    </main>
  );
}
