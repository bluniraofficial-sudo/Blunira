import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdvertiserService } from "@/services/advertiser";
import { AdvertisersClient } from "@/components/advertisers-client";

export default async function AdminAdvertisersPage() {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    redirect("/auth/login");
  }

  // Fetch all active advertisers
  const advertisers = await AdvertiserService.getAll(session);

  return <AdvertisersClient initialAdvertisers={advertisers} />;
}
