import { getSession } from "@/lib/auth";
import { NotFoundClient } from "@/components/not-found-client";

export default async function Custom404Page() {
  const session = await getSession();
  const role = session?.role || null;

  return <NotFoundClient role={role} />;
}
