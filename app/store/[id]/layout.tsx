import type { Metadata } from "next";
import { loadStudioDocument, normalizeShop } from "../../../lib/studio";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  try {
    const { id } = await params;
    const document = await loadStudioDocument(id);
    const shop = normalizeShop(document.payload);
    const title = `${shop.shopName} · ${shop.business}`;
    const description = shop.description || shop.headline;
    const image = shop.products.find((product) => product.image)?.image;

    return {
      title,
      description,
      openGraph: {
        title: shop.shopName,
        description,
        type: "website",
        images: image ? [{ url: image }] : undefined,
      },
    };
  } catch {
    return { title: "Shop · BKM DIGITAL" };
  }
}

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
