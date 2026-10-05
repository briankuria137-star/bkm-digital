"use client";

import {
  accentOptions,
  layoutOptions,
  radiusOptions,
  themeOptions,
  type CatalogueDesign,
} from "../lib/catalogue";

export default function CatalogueDesignControls({
  design,
  onChange,
}: {
  design: CatalogueDesign;
  onChange: (design: CatalogueDesign) => void;
}) {
  return (
    <div className="design-builder">
      <div className="design-control">
        <span className="design-control-label">Style</span>
        <div className="design-choice-grid">
          {themeOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`design-choice ${design.theme === option.id ? "active" : ""}`}
              onClick={() => onChange({ ...design, theme: option.id })}
              aria-pressed={design.theme === option.id}
            >
              <strong>{option.title}</strong>
              <span>{option.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="design-control">
        <span className="design-control-label">Layout</span>
        <div className="design-choice-grid">
          {layoutOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`design-choice ${design.layout === option.id ? "active" : ""}`}
              onClick={() => onChange({ ...design, layout: option.id })}
              aria-pressed={design.layout === option.id}
            >
              <strong>{option.title}</strong>
              <span>{option.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="design-control">
        <span className="design-control-label">Accent</span>
        <div className="accent-options" role="listbox" aria-label="Accent colour">
          {accentOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`accent-swatch ${design.accent === option.value ? "active" : ""}`}
              style={{ background: option.value }}
              onClick={() => onChange({ ...design, accent: option.value })}
              aria-label={option.name}
              aria-pressed={design.accent === option.value}
              title={option.name}
            />
          ))}
        </div>
      </div>

      <div className="design-control">
        <span className="design-control-label">Corners</span>
        <div className="radius-options">
          {radiusOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`radius-option ${design.radius === option.id ? "active" : ""}`}
              onClick={() => onChange({ ...design, radius: option.id })}
              aria-pressed={design.radius === option.id}
            >
              {option.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
