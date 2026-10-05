import ShopStudio from "../../../components/ShopStudio";

export default async function EditShopPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ShopStudio documentId={id} />;
}
