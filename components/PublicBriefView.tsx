import type { SoftwarePayload } from "../lib/studio";

export default function PublicBriefView({
  brief,
  mode = "live",
}: {
  brief: SoftwarePayload;
  mode?: "live" | "preview";
}) {
  return (
    <article className={`software-brief public-brief ${mode === "preview" ? "is-preview" : ""}`}>
      <p>{brief.business}</p>
      <h3>{brief.productName}</h3>
      <p className="public-brief-problem">{brief.problem}</p>
      <ol>
        {brief.features.map((feature) => (
          <li key={feature.id}>
            <strong>{feature.title}</strong>
            <span>{feature.detail}</span>
          </li>
        ))}
      </ol>
      <footer>
        <span>Prepared with BKM DIGITAL</span>
      </footer>
    </article>
  );
}
