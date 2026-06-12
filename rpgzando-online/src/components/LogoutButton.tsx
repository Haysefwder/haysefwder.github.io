"use client";

import { logoutAction } from "@/lib/actions/auth";

export default function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="rounded border border-stone-700 px-3 py-1.5 text-stone-300 hover:border-amber-500 hover:text-amber-300"
      >
        Encerrar sessão
      </button>
    </form>
  );
}
