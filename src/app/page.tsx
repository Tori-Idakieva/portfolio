import { Portfolio } from "@/components/Portfolio";
import { parseRole } from "@/content/profile";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { role } = await searchParams;
  return <Portfolio initialRole={parseRole(role)} />;
}
