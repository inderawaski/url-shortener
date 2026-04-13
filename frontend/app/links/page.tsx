import { LinksListPage } from "@/modules/links/pages/LinksListPage";

type LinksPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LinksPage({ searchParams }: LinksPageProps) {
  const { error } = await searchParams;
  return <LinksListPage errorMessage={error} />;
}
