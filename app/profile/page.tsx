import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import ProfileForm from '@/components/ProfileForm';

export default async function ProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-clear-day">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold text-nordic mb-8">My Profile</h1>
          <ProfileForm
            user={{
              name: session.user.name || '',
              email: session.user.email || '',
              image: session.user.image || null,
            }}
          />
        </div>
      </main>
    </>
  );
}
