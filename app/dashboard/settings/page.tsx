import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/data/current-user";
import { SettingsForm } from "@/components/dashboard/settings-form";

export const metadata: Metadata = { title: "Account Settings" };

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div>
      <h1 className="text-xl font-bold">Account Settings</h1>
      <div className="mt-4">
        <SettingsForm profile={user.profile} />
      </div>
    </div>
  );
}
