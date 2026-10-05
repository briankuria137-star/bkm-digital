import type { Metadata } from "next";
import { fetchCatalogue } from "../../../lib/catalogue";
import { supabase } from "../../../lib/supabase";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  try {
    const { id } = await params;
    const catalogue = await fetchCatalogue(id);
    const title = `${catalogue.name} · ${catalogue.business_name}`;
    const description = `Browse ${catalogue.name} from ${catalogue.business_name} and order on WhatsApp.`;

    const { data } = await supabase
      .from("catalogue_products")
      .select("image")
      .eq("catalogue_id", id)
      .limit(8);

    const image = (data || []).find((product) => product.image)?.image;

    return {
      title,
      description,
      openGraph: {
        title: catalogue.name,
        description,
        type: "website",
        images: image ? [{ url: image }] : undefined,
      },
    };
  } catch {
    return {
      title: "Catalogue · BKM DIGITAL",
      description: "A product catalogue built with BKM DIGITAL.",
    };
  }
}

export default function CatalogueLayout({ children }: { children: React.ReactNode }) {
  return children;
}
