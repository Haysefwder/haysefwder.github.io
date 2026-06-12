import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const user = await requireUser();

  const characters = await prisma.character.findMany({
    where: { userId: user.id },
    include: { campaign: { select: { id: true, title: true, status: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-stone-50">Seus personagens</h1>
        <Link
          href="/characters/new"
          className="rounded bg-amber-600 px-4 py-2 text-sm font-medium text-stone-950 hover:bg-amber-500"
        >
          Criar personagem
        </Link>
      </div>

      {characters.length === 0 ? (
        <div className="rounded-lg border border-dashed border-stone-800 bg-stone-900/30 p-8 text-center text-stone-400">
          <p className="mb-4">Você ainda não tem nenhum personagem.</p>
          <Link
            href="/characters/new"
            className="rounded bg-amber-600 px-4 py-2 text-sm font-medium text-stone-950 hover:bg-amber-500"
          >
            Criar meu primeiro personagem
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {characters.map((character) => (
            <li
              key={character.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-stone-800 bg-stone-900/40 p-4"
            >
              <div>
                <p className="font-medium text-stone-100">{character.name}</p>
                <p className="text-sm text-stone-400">
                  {character.race} {character.class} — Nível {character.level} ·{" "}
                  {character.hpCurrent}/{character.hpMax} PV · {character.gold} ouro
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/characters/${character.id}`}
                  className="rounded border border-stone-700 px-3 py-1.5 text-sm text-stone-200 hover:border-amber-500 hover:text-amber-300"
                >
                  Ver ficha
                </Link>
                {character.campaign ? (
                  <Link
                    href={`/campaign/${character.campaign.id}`}
                    className="rounded bg-amber-600 px-3 py-1.5 text-sm font-medium text-stone-950 hover:bg-amber-500"
                  >
                    Continuar campanha
                  </Link>
                ) : (
                  <Link
                    href={`/characters/${character.id}`}
                    className="rounded bg-amber-600 px-3 py-1.5 text-sm font-medium text-stone-950 hover:bg-amber-500"
                  >
                    Iniciar campanha
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
