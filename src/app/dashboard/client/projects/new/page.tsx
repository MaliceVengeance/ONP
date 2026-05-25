import { requireRole } from "@/lib/auth/requireRole";
import { PROJECT_CATEGORIES } from "@/lib/projects/categories";
import { getEmergencyRequestStatus } from "@/lib/emergency/rateLimit";
import NewProjectForm from "./NewProjectForm";

export default async function NewDraftProjectPage() {
  const { user } = await requireRole(["CLIENT", "ADMIN"]);
  const rateLimit = await getEmergencyRequestStatus(user.id);

  return (
    <NewProjectForm
      categories={[...PROJECT_CATEGORIES]}
      rateLimit={rateLimit}
    />
  );
}
