import type { Metadata } from "next";
import { loadStudioDocument, normalizeSoftware } from "../../../lib/studio";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  try {
    const { id } = await params;
    const document = await loadStudioDocument(id);
    const brief = normalizeSoftware(document.payload);
    const title = `${brief.productName} · ${brief.business}`;
    const description = brief.problem || `A software brief for ${brief.business}.`;

    return {
      title,
      description,
      openGraph: { title: brief.productName, description, type: "article" },
    };
  } catch {
    return { title: "Software brief · BKM DIGITAL" };
  }
}

export default function BriefLayout({ children }: { children: React.ReactNode }) {
  return children;
}