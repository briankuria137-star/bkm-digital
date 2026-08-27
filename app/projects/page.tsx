"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Catalogue = {
  id: number;
  name: string;
  business_name: string;
};

export default function ProjectsPage() {
  const [catalogues, setCatalogues] = useState<Catalogue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProjects() {
      const { data, error } = await supabase
        .from("catalogues")
        .select("id, name, business_name")
        .order("id", { ascending: false });

      if (error) {
        console.error("Projects error:", error);
      } else {
        setCatalogues(data || []);
      }

      setLoading(false);
    }

    loadProjects();
  }, []);

  return (
    <main className="dashboard">
      <aside className="sidebar">
        <div className="dashboard-brand">
          BKM<span>DIGITAL</span>
        </div>

        <nav className="dashboard-nav">
          <Link href="/dashboard">
            <span>01</span>
            Dashboard
          </Link>

          <Link href="/projects" className="active">
            <span>02</span>
            Projects
          </Link>

          <Link href="/catalogue">
            <span>03</span>
            Catalogues
          </Link>

          <a href="/dashboard#new-project">
            <span>04</span>
            Templates
          </a>

          <a href="/dashboard#new-project">
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
            <p className="dashboard-eyebrow">BKM DIGITAL / PROJECTS</p>
            <h1>Your projects.</h1>
          </div>

          <Link href="/catalogue" className="create-button">
            + New Catalogue
          </Link>
        </header>

        <section className="welcome-panel">
          <div>
            <p className="dashboard-eyebrow">DIGITAL WORKSPACE</p>
            <h2>Everything you&apos;re building.</h2>
            <p>
              Manage your catalogues and future digital products from one
              workspace.
            </p>
          </div>
        </section>

        <section className="projects-section">
          <div className="section-top">
            <div>
              <p className="dashboard-eyebrow">ALL PROJECTS</p>
              <h2>Projects</h2>
            </div>

            <span>{catalogues.length} project(s)</span>
          </div>

          <div className="project-list">
            {loading ? (
              <article className="project-row">
                <div className="project-info">
                  <h3>Loading projects...</h3>
                  <p>Please wait.</p>
                </div>
              </article>
            ) : catalogues.length === 0 ? (
              <article className="project-row">
                <div className="project-index">01</div>

                <div className="project-info">
                  <h3>No projects yet</h3>
                  <p>Create your first digital catalogue.</p>
                </div>

                <Link href="/catalogue" className="project-arrow">
                  →
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

                  <div className="project-updated">
                    Catalogue
                  </div>

                  <Link
                    href={`/catalogue/${catalogue.id}`}
                    className="project-arrow"
                    aria-label={`Open ${catalogue.name}`}
                  >
                    ↗
                  </Link>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="builder-section">
          <div>
            <p className="dashboard-eyebrow">CREATE</p>
            <h2>Start another project.</h2>
          </div>

          <div className="builder-grid">
            <Link href="/catalogue" className="builder-card">
              <span>01</span>
              <h3>Catalogue</h3>
              <p>Create a shareable digital product catalogue.</p>
              <strong>→</strong>
            </Link>

            <a href="#" className="builder-card">
              <span>02</span>
              <h3>Website</h3>
              <p>Build a professional website for a business.</p>
              <strong>→</strong>
            </a>

            <a href="#" className="builder-card">
              <span>03</span>
              <h3>Online Shop</h3>
              <p>Turn products into a complete online storefront.</p>
              <strong>→</strong>
            </a>

            <a href="#" className="builder-card">
              <span>04</span>
              <h3>Software</h3>
              <p>Create a custom digital tool around a business need.</p>
              <strong>→</strong>
            </a>
          </div>
        </section>

        <footer className="builder-footer">
          BKM DIGITAL / PROJECTS v1
        </footer>
      </section>
    </main>
  );
}
