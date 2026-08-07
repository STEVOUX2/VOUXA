import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Header } from "@/components/ui/Header";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Check authentication
  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Check admin role
  if (!(session.user as any).isAdmin) {
    redirect("/"); // Redirect non-admins to home
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-background text-vtext font-sans">
      <Header isAdmin={true} />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
