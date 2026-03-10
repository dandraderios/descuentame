import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Descuenta.me | Iniciar Sesión"
        description="Inicia sesión con Google para acceder al panel de gestión de productos y contenido de Descuenta.me."
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
