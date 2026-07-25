import { getSession } from "@/lib/auth";
import { ServerErrorClient } from "@/components/server-error-client";

export default async function Custom500Page() {
  const session = await getSession();
  const role = session?.role || null;

  return <ServerErrorClient role={role} />;
}
