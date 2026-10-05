"use client";

import { whatsAppHref } from "../lib/catalogue";
import type { WebsitePayload } from "../lib/studio";

export default function PublicWebsiteView({
  site,
  mode = "live",
}: {
  site: WebsitePayload;
  mode?: "live" | "preview";
}) {
  const contactText = `Hello ${site.business}, I visited your website and would like to talk.`;
  const whatsapp = site.whatsapp.trim()
    ? whatsAppHref(site.whatsapp, contactText)
    : "";

  return (
    <div className={`public-site ${mode === "preview" ? "is-preview" : ""}`}>
      <header className="public-site-nav">
        <strong>{site.business}</strong>
        <a href="#contact">Contact</a>
      </header>

      <section className="public-site-hero">
        <p>BKM DIGITAL WEBSITE</p>
        <h1>{site.headline}</h1>
        {site.introduction ? <p className="public-site-lead">{site.introduction}</p> : null}
        <div className="public-site-actions">
          {whatsapp ? (
            <a className="primary-button" href={whatsapp} target="_blank" rel="noreferrer">
              Message on WhatsApp
            </a>
          ) : null}
          <a className="secondary-button" href="#contact">
            Get in touch
          </a>
        </div>
      </section>

      {site.sections.map((section) => (
        <section className="public-site-section" key={section.id} id={`section-${section.id}`}>
          <p>{section.type}</p>
          <h2>{section.title}</h2>
          {section.description ? <p>{section.description}</p> : null}
        </section>
      ))}

      <section className="public-site-contact" id="contact">
        <div>
          <p>CONTACT</p>
          <h2>Talk to {site.business}.</h2>
          {site.location ? <span>{site.location}</span> : null}
        </div>
        <div className="public-site-links">
          {site.phone ? <a href={`tel:${site.phone.replace(/\s/g, "")}`}>{site.phone}</a> : null}
          {site.email ? <a href={`mailto:${site.email}`}>{site.email}</a> : null}
          {whatsapp ? (
            <a href={whatsapp} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          ) : null}
        </div>
      </section>

      <footer className="public-site-footer">
        <strong>{site.business}</strong>
        <span>Built with BKM DIGITAL</span>
      </footer>
    </div>
  );
}
