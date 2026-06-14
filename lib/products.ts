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
    imageUrl: "/shop/champion-tie-dye-hoodie.png",
  },
  {
    id: "prod_2",
    slug: "verzatv-mug",
    name: "VerzaTV Mug",
    price: 15.00,
    priceConfirmed: true,
    category: "Drinkware",
    imageUrl: "/shop/verzatv-mug.png",
  },
  {
    id: "prod_3",
    slug: "embroidered-socks",
    name: "VerzaTV Embroidered Socks",
    price: 30.00,
    priceConfirmed: true,
    category: "Apparel",
    imageUrl: "/shop/embroidered-socks.png",
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
    imageUrl: "/shop/verzatv-joggers.png",
  },
  {
    id: "prod_6",
    slug: "verzatv-hoodie",
    name: "VerzaTV Champion Hoodie",
    price: 95.00, // TODO: confirm price
    priceConfirmed: false,
    category: "Apparel",
    imageUrl: "/shop/verzatv-hoodie.png",
  },
  {
    id: "prod_7",
    slug: "verzatv-logo-hoodie",
    name: "VerzaTV Logo Hoodie",
    price: 85.00, // TODO: confirm price
    priceConfirmed: false,
    category: "Apparel",
    imageUrl: "/shop/verzatv-logo-hoodie.png",
  },
  {
    id: "prod_8",
    slug: "verzatv-fleece-jacket",
    name: "VerzaTV Columbia Fleece Jacket",
    price: 110.00, // TODO: confirm price
    priceConfirmed: false,
    category: "Apparel",
    imageUrl: "/shop/verzatv-fleece-jacket.png",
  },
  {
    id: "prod_9",
    slug: "verzatv-cap",
    name: "VerzaTV Cap",
    price: 35.00, // TODO: confirm price
    priceConfirmed: false,
    category: "Accessories",
    imageUrl: "/shop/verzatv-cap.png",
  },
  {
    id: "prod_10",
    slug: "verzatv-tshirt",
    name: "VerzaTV T-Shirt",
    price: 45.00, // TODO: confirm price
    priceConfirmed: false,
    category: "Apparel",
    imageUrl: "/shop/verzatv-tshirt.png",
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}
