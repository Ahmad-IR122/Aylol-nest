
import type { ReactNode } from "react";

import { Navbar } from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

type Props = {
  children: ReactNode;
};

export default function StoreLayout({ children }: Props) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
