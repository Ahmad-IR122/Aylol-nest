import type { ReactNode } from "react";

import { Navbar } from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { getCurrentUser } from "@/lib/auth/current-user";
import { CartProvider } from "@/components/cart/CartProvider";

type Props = {
  children: ReactNode;
};

export default async function StoreLayout({ children }: Props) {
  const user = await getCurrentUser();

  const isAdmin = user?.role === "admin" && user.isActive === true;

  return (
    <CartProvider>
      <Navbar isAdmin={isAdmin} />
      {children}
      <Footer />
    </CartProvider>
  );
}
