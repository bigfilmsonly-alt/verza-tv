export type ProductCategory = "Apparel" | "Drinkware" | "Accessories" | "Digital" | "Experiences";

export interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  priceConfirmed: boolean;
  category: ProductCategory;
  imageUrl: string;
}

export const products: Product[] = [
  {
    id: "prod_1",
    slug: "champion-tie-dye-hoodie",
    name: "VerzaTV Champion Tie-Dye Hoodie",
    price: 90.00,
    priceConfirmed: true,
    category: "Apparel",
    imageUrl: "",
  },
  {
    id: "prod_2",
    slug: "verzatv-mug",
    name: "VerzaTV Mug",
    price: 15.00,
    priceConfirmed: true,
    category: "Drinkware",
    imageUrl: "",
  },
  {
    id: "prod_3",
    slug: "embroidered-socks",
    name: "VerzaTV Embroidered Socks",
    price: 30.00,
    priceConfirmed: true,
    category: "Apparel",
    imageUrl: "",
  },
  {
    id: "prod_4",
    slug: "flip-straw-water-bottle",
    name: "VerzaTV Flip Straw Water Bottle",
    price: 35.00,
    priceConfirmed: true,
    category: "Drinkware",
    imageUrl: "",
  },
  {
    id: "prod_5",
    slug: "verzatv-joggers",
    name: "VerzaTV Joggers",
    price: 70.00, // TODO: confirm price
    priceConfirmed: false,
    category: "Apparel",
    imageUrl: "",
  },
  {
    id: "prod_6",
    slug: "verzatv-hoodie",
    name: "VerzaTV Hoodie",
    price: 95.00, // TODO: confirm price
    priceConfirmed: false,
    category: "Apparel",
    imageUrl: "",
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}
