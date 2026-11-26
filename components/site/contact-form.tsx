"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface ContactFormLabels {
  name: string;
  email: string;
  message: string;
  send: string;
  sending: string;
  success: string;
}

// Labels come from Admin > Site Content > Contact page.
export function ContactForm({ labels }: { labels: ContactFormLabels }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, website }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to send");
      toast.success(labels.success);
      setName("");
      setEmail("");
      setMessage("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative max-w-md space-y-4">
      <div className="space-y-2">
        <Label htmlFor="contact-name">{labels.name}</Label>
        <Input id="contact-name" autoComplete="name" maxLength={100} value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-email">{labels.email}</Label>
        <Input id="contact-email" type="email" autoComplete="email" maxLength={200} value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-message">{labels.message}</Label>
        <Textarea id="contact-message" minLength={10} maxLength={5000} value={message} onChange={(e) => setMessage(e.target.value)} required rows={5} />
      </div>
      <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>
      <Button type="submit" disabled={submitting}>
        {submitting ? labels.sending : labels.send}
      </Button>
    </form>
  );
}
