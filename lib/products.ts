export type ProductCategory = "Apparel" | "Drinkware" | "Accessories" | "Digital" | "Experiences";

export interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  priceConfirmed: boolean;
  category: ProductCategory;
  images: string[];
}

export const products: Product[] = [
  {
    id: "prod_1",
    slug: "champion-tie-dye-hoodie",
    name: "VerzaTV Champion Tie-Dye Hoodie",
    price: 90.00,
    priceConfirmed: true,
    category: "Apparel",
    images: [
      "/shop/champion-tie-dye-hoodie.png",
      "/shop/champion-tie-dye-hoodie-navy.png",
      "/shop/champion-tie-dye-hoodie-red.png",
    ],
  },
  {
    id: "prod_2",
    slug: "verzatv-mug",
    name: "VerzaTV Mug",
    price: 15.00,
    priceConfirmed: true,
    category: "Drinkware",
    images: [
      "/shop/verzatv-mug.png",
      "/shop/verzatv-mug-2.png",
    ],
  },
  {
    id: "prod_3",
    slug: "embroidered-socks",
    name: "VerzaTV Embroidered Socks",
    price: 30.00,
    priceConfirmed: true,
    category: "Apparel",
    images: [
      "/shop/embroidered-socks.png",
      "/shop/embroidered-socks-black.png",
    ],
  },
  {
    id: "prod_4",
    slug: "flip-straw-water-bottle",
    name: "VerzaTV Flip Straw Water Bottle",
    price: 35.00,
    priceConfirmed: true,
    category: "Drinkware",
    images: ["/shop/flip-straw-water-bottle.png"],
  },
  {
    id: "prod_5",
    slug: "verzatv-joggers",
    name: "VerzaTV Joggers",
    price: 70.00, // TODO: confirm price
    priceConfirmed: false,
    category: "Apparel",
    images: [
      "/shop/verzatv-joggers.png",
      "/shop/verzatv-joggers-black.png",
    ],
  },
  {
    id: "prod_6",
    slug: "verzatv-hoodie",
    name: "VerzaTV Champion Hoodie",
    price: 95.00, // TODO: confirm price
    priceConfirmed: false,
    category: "Apparel",
    images: ["/shop/verzatv-hoodie.png"],
  },
  {
    id: "prod_7",
    slug: "verzatv-logo-hoodie",
    name: "VerzaTV Logo Hoodie",
    price: 85.00, // TODO: confirm price
    priceConfirmed: false,
    category: "Apparel",
    images: ["/shop/verzatv-logo-hoodie.png"],
  },
  {
    id: "prod_8",
    slug: "verzatv-fleece-jacket",
    name: "VerzaTV Columbia Fleece Jacket",
    price: 110.00, // TODO: confirm price
    priceConfirmed: false,
    category: "Apparel",
    images: [
      "/shop/verzatv-fleece-jacket.png",
      "/shop/verzatv-fleece-jacket-navy.png",
    ],
  },
  {
    id: "prod_9",
    slug: "verzatv-cap",
    name: "VerzaTV Cap",
    price: 35.00, // TODO: confirm price
    priceConfirmed: false,
    category: "Accessories",
    images: ["/shop/verzatv-cap.png"],
  },
  {
    id: "prod_10",
    slug: "verzatv-tshirt",
    name: "VerzaTV T-Shirt",
    price: 45.00, // TODO: confirm price
    priceConfirmed: false,
    category: "Apparel",
    images: ["/shop/verzatv-tshirt.png"],
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}
