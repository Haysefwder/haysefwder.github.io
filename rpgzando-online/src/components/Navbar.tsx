import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

export default async function Navbar() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-stone-800 bg-stone-950">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 text-sm">
        <Link href="/" className="font-semibold tracking-wide text-amber-400">
          RPGzando Online
        </Link>

        <div className="flex items-center gap-4 text-stone-300">
          {user ? (
            <>
              <Link href="/dashboard" className="hover:text-amber-300">
                Painel
              </Link>
              <span className="hidden text-stone-500 sm:inline">
                Olá, {user.name}
              </span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-amber-300">
                Entrar
              </Link>
              <Link
                href="/register"
                className="rounded bg-amber-600 px-3 py-1.5 font-medium text-stone-950 hover:bg-amber-500"
              >
                Criar conta
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
