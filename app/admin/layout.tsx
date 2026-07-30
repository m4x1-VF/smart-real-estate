import { type ReactNode } from 'react';
import AdminNav from '@/components/admin/AdminNav';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getDb } from '@/lib/db/client';

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  // Check admin role against Neon
  const sql = getDb();
  const admins = await sql<
    { email: string }[]
  >`SELECT u.email FROM user_roles ur JOIN public."user" u ON u.id = ur.user_id WHERE ur.role = 'admin'`;
  const isAdmin = admins.some((a) => a.email === session.user.email);

  if (!isAdmin) {
    return (
      <div className="bg-clear-day text-nordic font-display min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">403</h1>
          <p className="text-nordic-muted">
            You do not have permission to access this area.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-clear-day text-nordic font-display min-h-screen flex flex-col antialiased">
      {/* Navbar */}
      <AdminNav user={session.user} />

      {/* Main content */}
      <div className="grow flex flex-col w-full">{children}</div>

      {/* Footer */}
      <footer className="mt-auto border-t border-nordic/5 bg-clear-day py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <p className="text-center text-sm text-nordic/60 w-full md:text-left md:w-auto">
            © {new Date().getFullYear()} LuxeEstate Properties. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
