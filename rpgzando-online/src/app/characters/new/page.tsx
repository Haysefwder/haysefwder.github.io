import { requireUser } from "@/lib/auth";
import { createCharacterAction } from "@/lib/actions/characters";
import CharacterForm from "@/components/CharacterForm";

export default async function NewCharacterPage() {
  await requireUser();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-bold text-stone-50">Criar personagem</h1>
      <p className="mb-8 text-sm text-stone-400">
        Defina os dados principais da sua ficha de D&amp;D 5ª edição. Você poderá
        editar tudo isso depois.
      </p>
      <CharacterForm action={createCharacterAction} submitLabel="Criar personagem" />
    </div>
  );
}
