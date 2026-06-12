import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import RegisterForm from "@/components/RegisterForm";

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
      <h1 className="mb-6 text-2xl font-bold text-stone-50">Criar conta</h1>
      <RegisterForm />
      <p className="mt-6 text-center text-sm text-stone-400">
        Já tem uma conta?{" "}
        <Link href="/login" className="text-amber-400 hover:text-amber-300">
          Entrar
        </Link>
      </p>
    </div>
  );
}
