import { getPublicProducts } from "@/lib/public-site";
import FeaturedProducts from "./FeaturedProducts";

export default async function FeaturedProductsData() {
  const products = await getPublicProducts();
  return <FeaturedProducts products={products} />;
}
