import { withAuth } from "next-auth/middleware";

export default withAuth({
  // Se o usuário não estiver logado, ele será redirecionado para esta página:
  pages: {
    signIn: "/login",
  },
});

// 🛡️ Áreas Protegidas:
// Aqui listamos quais rotas precisam de login.
// O matcher "/((?!api|login|_next/static|_next/image|favicon.ico).*)"
// protege TUDO, exceto login, APIs públicas e arquivos estáticos.
export const config = {
  matcher: ["/", "/inventory/:path*", "/categorias/:path*", "/settings/:path*"],
};
