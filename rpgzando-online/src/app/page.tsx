import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto flex max-w-3xl flex-1 flex-col items-center justify-center gap-8 px-4 py-24 text-center">
      <span className="rounded-full border border-amber-700/50 px-3 py-1 text-xs uppercase tracking-widest text-amber-400">
        MVP
      </span>

      <h1 className="text-4xl font-bold tracking-tight text-stone-50 sm:text-5xl">
        RPGzando Online
      </h1>

      <p className="max-w-xl text-lg text-stone-300">
        Uma plataforma de RPG de mesa digital com um{" "}
        <strong className="text-amber-400">Mestre de IA persistente</strong>,
        capaz de conduzir aventuras solo de D&amp;D 5ª edição e lembrar das
        consequências das suas escolhas ao longo do tempo.
      </p>

      <ul className="grid w-full gap-3 text-left text-sm text-stone-300 sm:grid-cols-2">
        <li className="rounded-lg border border-stone-800 bg-stone-900/50 p-4">
          Crie seu personagem e acompanhe sua ficha completa.
        </li>
        <li className="rounded-lg border border-stone-800 bg-stone-900/50 p-4">
          Converse com o Mestre e tome decisões que moldam a campanha.
        </li>
        <li className="rounded-lg border border-stone-800 bg-stone-900/50 p-4">
          Role d4, d6, d8, d10, d12, d20 e d100 com histórico salvo.
        </li>
        <li className="rounded-lg border border-stone-800 bg-stone-900/50 p-4">
          Retome sua campanha exatamente de onde parou.
        </li>
      </ul>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {user ? (
          <Link
            href="/dashboard"
            className="rounded bg-amber-600 px-5 py-2.5 font-medium text-stone-950 hover:bg-amber-500"
          >
            Ir para o painel
          </Link>
        ) : (
          <>
            <Link
              href="/register"
              className="rounded bg-amber-600 px-5 py-2.5 font-medium text-stone-950 hover:bg-amber-500"
            >
              Criar conta
            </Link>
            <Link
              href="/login"
              className="rounded border border-stone-700 px-5 py-2.5 font-medium text-stone-200 hover:border-amber-500 hover:text-amber-300"
            >
              Entrar
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
