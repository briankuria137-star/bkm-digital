import type { Metadata } from "next";
import { loadStudioDocument, normalizeWebsite } from "../../../lib/studio";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  try {
    const { id } = await params;
    const document = await loadStudioDocument(id);
    const site = normalizeWebsite(document.payload);
    const title = `${site.business} · BKM DIGITAL`;
    const description = site.introduction || site.headline;

    return {
      title,
      description,
      openGraph: { title: site.business, description, type: "website" },
    };
  } catch {
    return { title: "Website · BKM DIGITAL" };
  }
}

export default function WebsiteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
