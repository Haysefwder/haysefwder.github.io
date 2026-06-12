"use client";

import { useActionState } from "react";
import { loginAction, type AuthFormState } from "@/lib/actions/auth";

const initialState: AuthFormState = {};

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
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
          autoComplete="current-password"
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
        {isPending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
