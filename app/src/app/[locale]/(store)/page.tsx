import HeroSection from "@/components/home/HeroSection";
import CategorySection from "@/components/home/CategorySection";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import PromoBanner from "@/components/home/PromoBanner";
import NewArrivals from "@/components/home/NewArrivals";
import { getHomeProducts } from "@/lib/products/storefront";

export default async function HomePage() {
  const { featured, arrivals } = await getHomeProducts();
  return (
    <main>
      <HeroSection />
      <CategorySection />
      <FeaturedProducts {...featured} />
      <PromoBanner />
      <NewArrivals {...arrivals} />
    </main>
  );
}
