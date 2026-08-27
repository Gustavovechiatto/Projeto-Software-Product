import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import ActivitiesApp from "@/components/ActivitiesApp";

export const metadata = { title: "Atividades - TaskControl" };

export default async function AtividadesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <ActivitiesApp user={user} />;
}
