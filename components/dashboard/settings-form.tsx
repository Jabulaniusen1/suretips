"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { updateProfile } from "@/lib/actions/settings";
import { COUNTRIES } from "@/lib/constants";
import type { Tables } from "@/types/database";

export function SettingsForm({ profile }: { profile: Tables<"users"> }) {
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [country, setCountry] = useState(profile.country);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  async function handleAvatarUpload(file: File) {
    const supabase = createClient();
    const path = `${profile.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file);
    if (error) return toast.error(error.message);
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatarUrl(data.publicUrl);
  }

  async function handleSaveProfile() {
    setSavingProfile(true);
    try {
      await updateProfile({ full_name: fullName, country, avatar_url: avatarUrl });
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword() {
    if (newPassword.length < 6) return toast.error("Password must be at least 6 characters");
    setSavingPassword(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password updated");
      setNewPassword("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update password");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="max-w-xl space-y-8">
      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-bold">Profile</h2>
        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            <AvatarImage src={avatarUrl || undefined} />
            <AvatarFallback>{(fullName || profile.email).slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <label className="cursor-pointer text-sm font-medium text-brand hover:underline">
            Change avatar
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleAvatarUpload(file);
              }}
            />
          </label>
        </div>
        <div className="space-y-2">
          <Label>Full Name</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={profile.email} disabled />
        </div>
        <div className="space-y-2">
          <Label>Country</Label>
          <SearchableSelect value={country} onChange={setCountry} options={COUNTRIES} searchPlaceholder="Search countries…" />
        </div>
        <Button onClick={handleSaveProfile} disabled={savingProfile}>
          {savingProfile ? "Saving…" : "Save Profile"}
        </Button>
      </section>

      <Separator />

      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-bold">Change Password</h2>
        <div className="space-y-2">
          <Label>New Password</Label>
          <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
        <Button onClick={handleChangePassword} disabled={savingPassword}>
          {savingPassword ? "Updating…" : "Update Password"}
        </Button>
      </section>
    </div>
  );
}
