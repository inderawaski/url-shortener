import { LinkEditorPage } from "@/modules/links/pages/LinkEditorPage";

type EditLinkPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function EditLinkPage({ params }: EditLinkPageProps) {
  const { slug } = await params;
  return <LinkEditorPage slug={slug} />;
}
