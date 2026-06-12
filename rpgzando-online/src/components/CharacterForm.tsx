"use client";

import { useActionState } from "react";
import type { CharacterFormState } from "@/lib/actions/characters";

const RACES = [
  "Humano",
  "Elfo",
  "Anão",
  "Halfling",
  "Meio-Orc",
  "Meio-Elfo",
  "Gnomo",
  "Tiefling",
  "Draconato",
];

const CLASSES = [
  "Guerreiro",
  "Mago",
  "Clérigo",
  "Ladino",
  "Bárbaro",
  "Druida",
  "Bardo",
  "Monge",
  "Paladino",
  "Patrulheiro",
  "Feiticeiro",
  "Bruxo",
];

export interface CharacterFormValues {
  name: string;
  race: string;
  class: string;
  level: number;
  hpMax: number;
  hpCurrent: number;
  gold: number;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

interface CharacterFormProps {
  action: (prevState: CharacterFormState, formData: FormData) => Promise<CharacterFormState>;
  defaultValues?: Partial<CharacterFormValues>;
  submitLabel: string;
}

const initialState: CharacterFormState = {};

const ATTRIBUTES: { field: keyof CharacterFormValues; label: string }[] = [
  { field: "strength", label: "Força" },
  { field: "dexterity", label: "Destreza" },
  { field: "constitution", label: "Constituição" },
  { field: "intelligence", label: "Inteligência" },
  { field: "wisdom", label: "Sabedoria" },
  { field: "charisma", label: "Carisma" },
];

export default function CharacterForm({
  action,
  defaultValues,
  submitLabel,
}: CharacterFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  const v: CharacterFormValues = {
    name: "",
    race: "",
    class: "",
    level: 1,
    hpMax: 10,
    hpCurrent: 10,
    gold: 0,
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
    ...defaultValues,
  };

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-sm font-semibold uppercase tracking-wide text-amber-400">
          Identidade
        </legend>

        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-sm text-stone-300">Nome do personagem</span>
          <input
            name="name"
            type="text"
            required
            defaultValue={v.name}
            className="rounded border border-stone-700 bg-stone-900 px-3 py-2 text-stone-100 focus:border-amber-500 focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-stone-300">Raça</span>
          <input
            name="race"
            type="text"
            required
            list="races"
            defaultValue={v.race}
            className="rounded border border-stone-700 bg-stone-900 px-3 py-2 text-stone-100 focus:border-amber-500 focus:outline-none"
          />
          <datalist id="races">
            {RACES.map((race) => (
              <option key={race} value={race} />
            ))}
          </datalist>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-stone-300">Classe</span>
          <input
            name="class"
            type="text"
            required
            list="classes"
            defaultValue={v.class}
            className="rounded border border-stone-700 bg-stone-900 px-3 py-2 text-stone-100 focus:border-amber-500 focus:outline-none"
          />
          <datalist id="classes">
            {CLASSES.map((klass) => (
              <option key={klass} value={klass} />
            ))}
          </datalist>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-stone-300">Nível</span>
          <input
            name="level"
            type="number"
            min={1}
            max={20}
            required
            defaultValue={v.level}
            className="rounded border border-stone-700 bg-stone-900 px-3 py-2 text-stone-100 focus:border-amber-500 focus:outline-none"
          />
        </label>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-3">
        <legend className="mb-2 text-sm font-semibold uppercase tracking-wide text-amber-400">
          Combate &amp; Recursos
        </legend>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-stone-300">Pontos de vida máximos</span>
          <input
            name="hpMax"
            type="number"
            min={1}
            max={999}
            required
            defaultValue={v.hpMax}
            className="rounded border border-stone-700 bg-stone-900 px-3 py-2 text-stone-100 focus:border-amber-500 focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-stone-300">Pontos de vida atuais</span>
          <input
            name="hpCurrent"
            type="number"
            min={0}
            max={999}
            required
            defaultValue={v.hpCurrent}
            className="rounded border border-stone-700 bg-stone-900 px-3 py-2 text-stone-100 focus:border-amber-500 focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-stone-300">Ouro</span>
          <input
            name="gold"
            type="number"
            min={0}
            required
            defaultValue={v.gold}
            className="rounded border border-stone-700 bg-stone-900 px-3 py-2 text-stone-100 focus:border-amber-500 focus:outline-none"
          />
        </label>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-3">
        <legend className="mb-2 text-sm font-semibold uppercase tracking-wide text-amber-400">
          Atributos
        </legend>

        {ATTRIBUTES.map(({ field, label }) => (
          <label key={field} className="flex flex-col gap-1">
            <span className="text-sm text-stone-300">{label}</span>
            <input
              name={field}
              type="number"
              min={1}
              max={30}
              required
              defaultValue={v[field]}
              className="rounded border border-stone-700 bg-stone-900 px-3 py-2 text-stone-100 focus:border-amber-500 focus:outline-none"
            />
          </label>
        ))}
      </fieldset>

      {state?.error && (
        <p className="rounded border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded bg-amber-600 px-5 py-2.5 font-medium text-stone-950 hover:bg-amber-500 disabled:opacity-60"
      >
        {isPending ? "Salvando..." : submitLabel}
      </button>
    </form>
  );
}
