import WebsiteStudio from "../../../components/WebsiteStudio";

export default async function EditWebsitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <WebsiteStudio documentId={id} />;
}
