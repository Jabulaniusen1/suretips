import { redirect } from "next/navigation";
import { PLAN_SLUGS } from "@/lib/constants";

export default function AddCorrectScorePage() {
  redirect(`/admin/predictions/add?plan=${PLAN_SLUGS.CORRECT_SCORES}`);
}
