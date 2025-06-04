import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Categories
  const categories = await prisma.category.createMany({
    data: [
      { name: "Laptops" },
      { name: "Phones" },
      { name: "TVs" },
      { name: "Audio" },
      { name: "Accessories" },
    ],
    skipDuplicates: true,
  });

  // Get category IDs
  const allCategories = await prisma.category.findMany();

  // Helper to get categoryId by name
  const getCategoryId = (name: string) =>
    allCategories.find((c) => c.name === name)?.id ?? "";

  // Products
  await prisma.product.createMany({
    data: [
      {
        name: 'Apple MacBook Pro 16"',
        description: "Apple M3 Pro, 16GB RAM, 1TB SSD, Space Black",
        price: 3499.99,
        quantity: 20,
        image:
          "https://m.media-amazon.com/images/I/71jG+e7roXL._AC_SL1500_.jpg",
        brand: "Apple",
        categoryId: getCategoryId("Laptops"),
      },
      {
        name: "Dell XPS 13",
        description: '13.4" FHD+, Intel i7, 16GB RAM, 512GB SSD',
        price: 1299.99,
        quantity: 30,
        image:
          "https://m.media-amazon.com/images/I/71w4kR1QFSL._AC_SL1500_.jpg",
        brand: "Dell",
        categoryId: getCategoryId("Laptops"),
      },
      {
        name: "iPhone 15 Pro",
        description: '6.1" Super Retina XDR, 256GB, Titanium',
        price: 1199.99,
        quantity: 50,
        image:
          "https://m.media-amazon.com/images/I/81CgtwSII3L._AC_SL1500_.jpg",
        brand: "Apple",
        categoryId: getCategoryId("Phones"),
      },
      {
        name: "Samsung Galaxy S24 Ultra",
        description: '6.8" QHD+, 512GB, Phantom Black',
        price: 1399.99,
        quantity: 40,
        image:
          "https://m.media-amazon.com/images/I/71qZyM4jRGL._AC_SL1500_.jpg",
        brand: "Samsung",
        categoryId: getCategoryId("Phones"),
      },
      {
        name: 'Sony Bravia 65" 4K OLED',
        description: "Smart TV, Google TV, HDR, 120Hz",
        price: 1999.99,
        quantity: 15,
        image:
          "https://m.media-amazon.com/images/I/91Q5dCjc2KL._AC_SL1500_.jpg",
        brand: "Sony",
        categoryId: getCategoryId("TVs"),
      },
      {
        name: "Bose QuietComfort 45",
        description: "Wireless Noise Cancelling Headphones, Black",
        price: 329.99,
        quantity: 60,
        image:
          "https://m.media-amazon.com/images/I/81+jNVOUsJL._AC_SL1500_.jpg",
        brand: "Bose",
        categoryId: getCategoryId("Audio"),
      },
      {
        name: "Apple AirPods Pro (2nd Gen)",
        description: "Active Noise Cancellation, MagSafe Charging Case",
        price: 249.99,
        quantity: 80,
        image:
          "https://m.media-amazon.com/images/I/61SUj2aKoEL._AC_SL1500_.jpg",
        brand: "Apple",
        categoryId: getCategoryId("Audio"),
      },
      {
        name: "Logitech MX Master 3S",
        description: "Wireless Mouse, Graphite",
        price: 99.99,
        quantity: 100,
        image:
          "https://m.media-amazon.com/images/I/61ni3t1ryQL._AC_SL1500_.jpg",
        brand: "Logitech",
        categoryId: getCategoryId("Accessories"),
      },
      {
        name: "Anker PowerCore 20000",
        description: "Portable Charger, 20000mAh, Black",
        price: 49.99,
        quantity: 120,
        image:
          "https://m.media-amazon.com/images/I/61r5K6p8X+L._AC_SL1500_.jpg",
        brand: "Anker",
        categoryId: getCategoryId("Accessories"),
      },
    ],
    skipDuplicates: true,
  });

  console.log("Database seeded with categories and products!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
