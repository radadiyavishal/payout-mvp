'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Nav() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (!user) return null;

  const navLink = (href: string, label: string) => {
    const active = pathname.startsWith(href);
    return (
      <Link
        href={href}
        className={`text-sm px-3 py-1.5 rounded-md font-medium transition-colors ${
          active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-0 flex items-center h-14 gap-2">
      <Link href="/payouts" className="font-bold text-blue-700 text-base mr-4 tracking-tight">
        PayoutMVP
      </Link>
      {navLink('/vendors', 'Vendors')}
      {navLink('/payouts', 'Payouts')}
      <div className="ml-auto flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500 hidden sm:inline">{user.email}</span>
          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${user.role === 'OPS' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
            {user.role}
          </span>
        </div>
        <button
          onClick={() => { logout(); router.push('/login'); }}
          className="text-sm text-gray-500 hover:text-red-600 transition-colors border border-gray-200 px-3 py-1 rounded-md hover:border-red-200"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
