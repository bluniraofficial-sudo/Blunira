import { getSession } from "@/lib/auth";
export const dynamic = "force-dynamic";
import { NotFoundClient } from "@/components/not-found-client";

export default async function NotFound() {
  const session = await getSession();
  const role = session?.role || null;

  return <NotFoundClient role={role} />;
}
