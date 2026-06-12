import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getOwnedCampaign, completeQuestAction } from "@/lib/actions/campaigns";
import { prisma } from "@/lib/prisma";

export default async function CampaignJournalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const campaign = await getOwnedCampaign(user.id, id);

  const [events, decisions, activeQuests, completedQuests] = await Promise.all([
    prisma.journalEntry.findMany({
      where: { campaignId: id, type: "EVENT" },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.journalEntry.findMany({
      where: { campaignId: id, type: "DECISION" },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.journalEntry.findMany({
      where: { campaignId: id, type: "QUEST", status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.journalEntry.findMany({
      where: { campaignId: id, type: "QUEST", status: "COMPLETED" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-stone-50">Diário da campanha</h1>
          <p className="text-sm text-stone-400">{campaign.title}</p>
        </div>
        <Link href={`/campaign/${id}`} className="text-sm text-amber-400 hover:text-amber-300">
          Voltar à campanha
        </Link>
      </div>

      <section className="mb-10">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-amber-400">
          Missões ativas
        </h2>
        {activeQuests.length === 0 ? (
          <p className="text-sm text-stone-400">Nenhuma missão ativa no momento.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {activeQuests.map((quest) => (
              <li
                key={quest.id}
                className="rounded-lg border border-stone-800 bg-stone-900/40 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-stone-100">{quest.title}</p>
                    <p className="text-sm text-stone-400">{quest.description}</p>
                  </div>
                  <form action={completeQuestAction.bind(null, id, quest.id)}>
                    <button
                      type="submit"
                      className="rounded border border-stone-700 px-3 py-1 text-xs text-stone-300 hover:border-amber-500 hover:text-amber-300"
                    >
                      Marcar como concluída
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}

        {completedQuests.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs uppercase tracking-wide text-stone-500">
              Missões concluídas
            </p>
            <ul className="flex flex-col gap-2">
              {completedQuests.map((quest) => (
                <li
                  key={quest.id}
                  className="rounded border border-stone-800 bg-stone-900/20 p-3 text-sm text-stone-500 line-through"
                >
                  {quest.title}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-amber-400">
          Últimos acontecimentos
        </h2>
        {events.length === 0 ? (
          <p className="text-sm text-stone-400">Nenhum acontecimento registrado ainda.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {events.map((event) => (
              <li key={event.id} className="rounded-lg border border-stone-800 bg-stone-900/40 p-4">
                <p className="font-medium text-stone-100">{event.title}</p>
                <p className="text-sm text-stone-400">{event.description}</p>
                <p className="mt-1 text-xs text-stone-500">
                  {event.createdAt.toLocaleString("pt-BR")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-amber-400">
          Decisões tomadas
        </h2>
        {decisions.length === 0 ? (
          <p className="text-sm text-stone-400">Nenhuma decisão registrada ainda.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {decisions.map((decision) => (
              <li key={decision.id} className="rounded-lg border border-stone-800 bg-stone-900/40 p-4">
                <p className="font-medium text-stone-100">{decision.title}</p>
                <p className="text-sm text-stone-400">{decision.description}</p>
                <p className="mt-1 text-xs text-stone-500">
                  {decision.createdAt.toLocaleString("pt-BR")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
