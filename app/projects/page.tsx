"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Project = {
  id: string;
  name: string;
  type: string;
  status: string;
  created_at: string;
  catalogue_id?: string | null;
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProjects() {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, type, status, created_at, catalogues(id)")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Projects error:", error);
      } else {
        setProjects((data || []).map((project) => {
          const related = project.catalogues as unknown;
          const catalogue = Array.isArray(related) ? related[0] as { id?: string } | undefined : related as { id?: string } | null;
          return {
            ...project,
            catalogue_id: catalogue?.id ?? null,
          };
        }));
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

          <Link href="/dashboard#new-project">
            <span>04</span>
            Templates
          </Link>

          <Link href="/dashboard#new-project">
            <span>05</span>
            Settings
          </Link>
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
              Manage catalogues, websites, online shops and software from one
              professional workspace.
            </p>
          </div>
        </section>

        <section className="projects-section">
          <div className="section-top">
            <div>
              <p className="dashboard-eyebrow">ALL PROJECTS</p>
              <h2>Projects</h2>
            </div>

            <span>{projects.length} project(s)</span>
          </div>

          <div className="project-list">
            {loading ? (
              <article className="project-row">
                <div className="project-info">
                  <h3>Loading projects...</h3>
                  <p>Please wait.</p>
                </div>
              </article>
            ) : projects.length === 0 ? (
              <article className="project-row">
                <div className="project-index">01</div>

                <div className="project-info">
                  <h3>No projects yet</h3>
                  <p>Create your first BKM DIGITAL project.</p>
                </div>

                <Link href="/catalogue" className="project-arrow">
                  →
                </Link>
              </article>
            ) : (
              projects.map((project, index) => (
                <article className="project-row" key={project.id}>
                  <div className="project-index">
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  <div className="project-info">
                    <h3>{project.name}</h3>
                    <p>{project.type}</p>
                  </div>

                  <div className="project-status">
                    <span>{project.status}</span>
                  </div>

                  <div className="project-updated">
                    {new Date(project.created_at).toLocaleDateString()}
                  </div>

                  <Link
                    href={
                      project.type.toLowerCase() === "catalogue" && project.catalogue_id
                        ? `/catalogue/${project.catalogue_id}`
                        : project.type.toLowerCase() === "website"
                        ? "/website"
                        : project.type.toLowerCase() === "shop" ||
                          project.type.toLowerCase() === "online shop"
                        ? "/shop"
                        : "/catalogue"
                    }
                    className="project-arrow"
                    aria-label={`Open ${project.name}`}
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

        <footer className="builder-footer">
          BKM DIGITAL / PROJECTS v2
        </footer>
      </section>
    </main>
  );
}
