import Link from "next/link";
import { requireUser } from "@/lib/auth";
import {
  getOwnedCharacter,
  updateCharacterAction,
  addInventoryItemAction,
  deleteInventoryItemAction,
} from "@/lib/actions/characters";
import CharacterForm from "@/components/CharacterForm";
import StartCampaignForm from "@/components/StartCampaignForm";

export default async function CharacterSheetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const character = await getOwnedCharacter(user.id, id);

  const updateAction = updateCharacterAction.bind(null, character.id);
  const addItemAction = addInventoryItemAction.bind(null, character.id);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-stone-50">{character.name}</h1>
          <p className="text-sm text-stone-400">
            {character.race} {character.class} — Nível {character.level}
          </p>
        </div>
        <Link href="/dashboard" className="text-sm text-amber-400 hover:text-amber-300">
          Voltar ao painel
        </Link>
      </div>

      <section className="mb-10 rounded-lg border border-stone-800 bg-stone-900/40 p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-amber-400">
          Campanha
        </h2>
        {character.campaign ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-stone-100">{character.campaign.title}</p>
              <p className="text-xs text-stone-400">
                Status: {character.campaign.status === "ACTIVE" ? "Ativa" : "Encerrada"}
              </p>
            </div>
            <Link
              href={`/campaign/${character.campaign.id}`}
              className="rounded bg-amber-600 px-4 py-2 text-sm font-medium text-stone-950 hover:bg-amber-500"
            >
              Continuar campanha
            </Link>
          </div>
        ) : (
          <div>
            <p className="mb-3 text-sm text-stone-400">
              Este personagem ainda não iniciou uma campanha.
            </p>
            <StartCampaignForm characterId={character.id} characterName={character.name} />
          </div>
        )}
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-amber-400">
          Ficha
        </h2>
        <CharacterForm
          action={updateAction}
          submitLabel="Salvar alterações"
          defaultValues={{
            name: character.name,
            race: character.race,
            class: character.class,
            level: character.level,
            hpMax: character.hpMax,
            hpCurrent: character.hpCurrent,
            gold: character.gold,
            strength: character.strength,
            dexterity: character.dexterity,
            constitution: character.constitution,
            intelligence: character.intelligence,
            wisdom: character.wisdom,
            charisma: character.charisma,
          }}
        />
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-amber-400">
          Inventário
        </h2>

        {character.inventory.length > 0 ? (
          <ul className="mb-4 flex flex-col gap-2">
            {character.inventory.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded border border-stone-800 bg-stone-900/40 px-3 py-2 text-sm"
              >
                <div>
                  <span className="text-stone-100">
                    {item.name} {item.quantity > 1 ? `x${item.quantity}` : ""}
                  </span>
                  {item.description && (
                    <p className="text-xs text-stone-400">{item.description}</p>
                  )}
                </div>
                <form action={deleteInventoryItemAction.bind(null, character.id, item.id)}>
                  <button
                    type="submit"
                    className="text-xs text-stone-500 hover:text-red-400"
                    aria-label={`Remover ${item.name}`}
                  >
                    remover
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-4 text-sm text-stone-400">Inventário vazio.</p>
        )}

        <form action={addItemAction} className="flex flex-wrap gap-2">
          <input
            name="itemName"
            type="text"
            placeholder="Nome do item"
            required
            className="flex-1 rounded border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-stone-100 focus:border-amber-500 focus:outline-none"
          />
          <input
            name="itemQuantity"
            type="number"
            min={1}
            defaultValue={1}
            className="w-20 rounded border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-stone-100 focus:border-amber-500 focus:outline-none"
          />
          <input
            name="itemDescription"
            type="text"
            placeholder="Descrição (opcional)"
            className="flex-1 rounded border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-stone-100 focus:border-amber-500 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded border border-stone-700 px-4 py-2 text-sm font-medium text-stone-200 hover:border-amber-500 hover:text-amber-300"
          >
            Adicionar
          </button>
        </form>
      </section>
    </div>
  );
}
