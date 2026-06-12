import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
      <h1 className="mb-6 text-2xl font-bold text-stone-50">Entrar</h1>
      <LoginForm />
      <p className="mt-6 text-center text-sm text-stone-400">
        Ainda não tem uma conta?{" "}
        <Link href="/register" className="text-amber-400 hover:text-amber-300">
          Criar conta
        </Link>
      </p>
    </div>
  );
}
