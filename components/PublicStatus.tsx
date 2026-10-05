import Link from "next/link";

export default function PublicStatus({
  eyebrow,
  title,
  detail,
}: {
  eyebrow: string;
  title: string;
  detail?: string;
}) {
  return (
    <div className="public-catalogue-error">
      <p>{eyebrow}</p>
      <h1>{title}</h1>
      {detail ? <span>{detail}</span> : null}
      <Link href="/" className="secondary-button quiet-link">
        BKM DIGITAL
      </Link>
    </div>
  );
}
