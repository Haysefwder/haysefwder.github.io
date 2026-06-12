"use client";

import { useActionState } from "react";
import { registerAction, type AuthFormState } from "@/lib/actions/auth";

const initialState: AuthFormState = {};

export default function RegisterForm() {
  const [state, formAction, isPending] = useActionState(registerAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm text-stone-300">
          Nome
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          autoComplete="name"
          className="rounded border border-stone-700 bg-stone-900 px-3 py-2 text-stone-100 focus:border-amber-500 focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm text-stone-300">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="rounded border border-stone-700 bg-stone-900 px-3 py-2 text-stone-100 focus:border-amber-500 focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm text-stone-300">
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          className="rounded border border-stone-700 bg-stone-900 px-3 py-2 text-stone-100 focus:border-amber-500 focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="confirmPassword" className="text-sm text-stone-300">
          Confirmar senha
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          className="rounded border border-stone-700 bg-stone-900 px-3 py-2 text-stone-100 focus:border-amber-500 focus:outline-none"
        />
      </div>

      {state?.error && (
        <p className="rounded border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded bg-amber-600 px-4 py-2 font-medium text-stone-950 hover:bg-amber-500 disabled:opacity-60"
      >
        {isPending ? "Criando conta..." : "Criar conta"}
      </button>
    </form>
  );
}
