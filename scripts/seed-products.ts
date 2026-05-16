import { existsSync, readFileSync } from 'fs';
import mongoose, { Types } from 'mongoose';
import { randomBytes } from 'crypto';

type CategorySeed = {
  name: string;
  slug: string;
};

type ProductSeed = {
  name: string;
  categorySlug: string;
  description: string;
  price?: number;
  stock?: number;
  genre?: 'niña' | 'niño' | 'unisex';
  variants?: Array<{
    name: string;
    stock: number;
    price: number;
  }>;
};

const SEED_BRAND = 'SEMILLA DEMO';
const SEED_IMAGE_URL = '/placeholder.webp';
const SEED_IMAGE_PUBLIC_ID = 'seed-placeholder';

const categories: CategorySeed[] = [
  { name: 'Ropa Bebe', slug: 'ropa-bebe' },
  { name: 'Ropa Infantil', slug: 'ropa-infantil' },
  { name: 'Juguetes', slug: 'juguetes' },
  { name: 'Accesorios', slug: 'accesorios' },
  { name: 'Alimentacion', slug: 'alimentacion' },
  { name: 'Perfumes', slug: 'perfumes' },
  { name: 'Hogar', slug: 'hogar' },
  { name: 'Electronica', slug: 'electronica' },
];

const products: ProductSeed[] = [
  {
    name: 'Body Algodon Estrellitas',
    categorySlug: 'ropa-bebe',
    genre: 'unisex',
    description: 'Body suave para uso diario.',
    variants: [
      { name: 'RN', stock: 8, price: 8.99 },
      { name: 'M3', stock: 12, price: 8.99 },
      { name: 'M6', stock: 10, price: 9.49 },
    ],
  },
  {
    name: 'Conjunto Bebe Nubes',
    categorySlug: 'ropa-bebe',
    genre: 'unisex',
    description: 'Set comodo de dos piezas.',
    variants: [
      { name: 'M3', stock: 7, price: 18.5 },
      { name: 'M6', stock: 9, price: 18.5 },
      { name: 'M9', stock: 6, price: 19.9 },
    ],
  },
  {
    name: 'Pijama Animalitos',
    categorySlug: 'ropa-bebe',
    genre: 'unisex',
    description: 'Pijama fresca con estampado infantil.',
    variants: [
      { name: 'M6', stock: 9, price: 14.99 },
      { name: 'M12', stock: 8, price: 15.99 },
      { name: 'M18', stock: 5, price: 15.99 },
    ],
  },
  {
    name: 'Vestido Flores Rosas',
    categorySlug: 'ropa-infantil',
    genre: 'niña',
    description: 'Vestido ligero para salidas y celebraciones.',
    variants: [
      { name: 'T2', stock: 5, price: 24.9 },
      { name: 'T4', stock: 6, price: 25.9 },
      { name: 'T6', stock: 4, price: 26.9 },
    ],
  },
  {
    name: 'Camisa Dino Verde',
    categorySlug: 'ropa-infantil',
    genre: 'niño',
    description: 'Camisa casual con estampado de dinosaurios.',
    variants: [
      { name: 'T3', stock: 8, price: 13.5 },
      { name: 'T5', stock: 7, price: 14.5 },
      { name: 'T7', stock: 5, price: 15.5 },
    ],
  },
  {
    name: 'Short Denim Infantil',
    categorySlug: 'ropa-infantil',
    genre: 'unisex',
    description: 'Short resistente para juego diario.',
    variants: [
      { name: 'T4', stock: 10, price: 16.9 },
      { name: 'T6', stock: 8, price: 17.9 },
      { name: 'T8', stock: 6, price: 18.9 },
    ],
  },
  {
    name: 'Zapatos Primeros Pasos',
    categorySlug: 'accesorios',
    description: 'Zapatos flexibles para bebe.',
    variants: [
      { name: '18', stock: 6, price: 22.9 },
      { name: '19', stock: 7, price: 22.9 },
      { name: '20', stock: 5, price: 23.9 },
    ],
  },
  {
    name: 'Gorro Orejitas',
    categorySlug: 'accesorios',
    description: 'Gorro suave para dias frescos.',
    price: 7.5,
    stock: 18,
  },
  {
    name: 'Medias Pack Colores',
    categorySlug: 'accesorios',
    description: 'Pack de medias infantiles variadas.',
    price: 9.99,
    stock: 25,
  },
  {
    name: 'Babero Impermeable',
    categorySlug: 'alimentacion',
    description: 'Babero facil de limpiar.',
    price: 6.99,
    stock: 30,
  },
  {
    name: 'Set Cucharas Silicona',
    categorySlug: 'alimentacion',
    description: 'Cucharas suaves para primeras comidas.',
    price: 8.75,
    stock: 22,
  },
  {
    name: 'Vaso Antiderrame',
    categorySlug: 'alimentacion',
    description: 'Vaso infantil con tapa segura.',
    price: 11.5,
    stock: 20,
  },
  {
    name: 'Plato Dividido Infantil',
    categorySlug: 'alimentacion',
    description: 'Plato con divisiones para comidas.',
    price: 12.9,
    stock: 16,
  },
  {
    name: 'Sonajero Conejito',
    categorySlug: 'juguetes',
    description: 'Sonajero liviano para estimulacion temprana.',
    price: 7.25,
    stock: 18,
  },
  {
    name: 'Cubos Blandos Numeros',
    categorySlug: 'juguetes',
    description: 'Cubos suaves con numeros y colores.',
    price: 14.75,
    stock: 14,
  },
  {
    name: 'Peluche Osito Beige',
    categorySlug: 'juguetes',
    description: 'Peluche clasico de tacto suave.',
    price: 16.99,
    stock: 12,
  },
  {
    name: 'Carrito Didactico',
    categorySlug: 'juguetes',
    description: 'Juguete con ruedas para motricidad.',
    price: 13.5,
    stock: 15,
  },
  {
    name: 'Puzzle Animales',
    categorySlug: 'juguetes',
    description: 'Puzzle simple de madera.',
    price: 10.99,
    stock: 13,
  },
  {
    name: 'Manta Muselina Arcoiris',
    categorySlug: 'hogar',
    description: 'Manta ligera multiuso.',
    price: 17.9,
    stock: 15,
  },
  {
    name: 'Toalla Capucha Bebe',
    categorySlug: 'hogar',
    description: 'Toalla absorbente con capucha.',
    price: 19.99,
    stock: 12,
  },
  {
    name: 'Organizador Pañales',
    categorySlug: 'hogar',
    description: 'Cesta organizadora para cambiador.',
    price: 21.5,
    stock: 10,
  },
  {
    name: 'Lampara Noche Luna',
    categorySlug: 'electronica',
    description: 'Lampara suave para dormitorio infantil.',
    price: 18.9,
    stock: 9,
  },
  {
    name: 'Termometro Digital Infantil',
    categorySlug: 'electronica',
    description: 'Termometro rapido para uso familiar.',
    price: 12.99,
    stock: 17,
  },
  {
    name: 'Monitor Audio Bebe',
    categorySlug: 'electronica',
    description: 'Monitor de audio compacto.',
    price: 34.9,
    stock: 6,
  },
  {
    name: 'Colonia Bebe Suave',
    categorySlug: 'perfumes',
    description: 'Fragancia suave para bebe.',
    price: 10.5,
    stock: 20,
  },
  {
    name: 'Perfume Infantil Dulce',
    categorySlug: 'perfumes',
    description: 'Fragancia ligera para niños.',
    price: 13.99,
    stock: 14,
  },
  {
    name: 'Set Peine y Cepillo',
    categorySlug: 'accesorios',
    description: 'Set basico para cuidado diario.',
    price: 8.9,
    stock: 18,
  },
  {
    name: 'Cinta Cabello Mariposas',
    categorySlug: 'accesorios',
    description: 'Accesorio delicado para niñas.',
    price: 5.5,
    stock: 22,
  },
  {
    name: 'Mochila Mini Safari',
    categorySlug: 'accesorios',
    description: 'Mochila pequeña para guarderia.',
    price: 24.9,
    stock: 11,
  },
  {
    name: 'Impermeable Amarillo',
    categorySlug: 'ropa-infantil',
    genre: 'unisex',
    description: 'Chaqueta impermeable ligera.',
    variants: [
      { name: 'T4', stock: 4, price: 27.9 },
      { name: 'T6', stock: 5, price: 28.9 },
      { name: 'T8', stock: 4, price: 29.9 },
    ],
  },
  {
    name: 'Leggings Corazones',
    categorySlug: 'ropa-infantil',
    genre: 'niña',
    description: 'Leggings elasticos para uso diario.',
    variants: [
      { name: 'T3', stock: 7, price: 11.9 },
      { name: 'T5', stock: 6, price: 12.9 },
      { name: 'T7', stock: 5, price: 13.9 },
    ],
  },
  {
    name: 'Jogger Azul Marino',
    categorySlug: 'ropa-infantil',
    genre: 'niño',
    description: 'Pantalon comodo estilo jogger.',
    variants: [
      { name: 'T4', stock: 7, price: 15.9 },
      { name: 'T6', stock: 6, price: 16.9 },
      { name: 'T8', stock: 5, price: 17.9 },
    ],
  },
  {
    name: 'Enterizo Rayas',
    categorySlug: 'ropa-bebe',
    genre: 'unisex',
    description: 'Enterizo suave de algodon.',
    variants: [
      { name: 'M3', stock: 8, price: 16.5 },
      { name: 'M6', stock: 7, price: 16.5 },
      { name: 'M9', stock: 6, price: 17.5 },
    ],
  },
  {
    name: 'Chaqueta Tejida Crema',
    categorySlug: 'ropa-bebe',
    genre: 'unisex',
    description: 'Chaqueta calida para bebe.',
    variants: [
      { name: 'M6', stock: 5, price: 22.5 },
      { name: 'M12', stock: 5, price: 23.5 },
      { name: 'M18', stock: 4, price: 24.5 },
    ],
  },
  {
    name: 'Set Bloques Construccion',
    categorySlug: 'juguetes',
    description: 'Bloques coloridos para creatividad.',
    price: 19.9,
    stock: 13,
  },
  {
    name: 'Libro Tela Sensorial',
    categorySlug: 'juguetes',
    description: 'Libro suave con texturas.',
    price: 12.5,
    stock: 16,
  },
  {
    name: 'Mordedor Frutas',
    categorySlug: 'juguetes',
    description: 'Mordedor de silicona para bebe.',
    price: 6.9,
    stock: 24,
  },
  {
    name: 'Almohada Antivuelco',
    categorySlug: 'hogar',
    description: 'Almohada de apoyo para bebe.',
    price: 15.9,
    stock: 10,
  },
  {
    name: 'Sabana Cuna Algodon',
    categorySlug: 'hogar',
    description: 'Sabana ajustable para cuna.',
    price: 13.99,
    stock: 14,
  },
  {
    name: 'Bolso Pañalero Gris',
    categorySlug: 'accesorios',
    description: 'Bolso amplio con compartimentos.',
    price: 31.9,
    stock: 8,
  },
  {
    name: 'Chupon Ortodontico Pack',
    categorySlug: 'alimentacion',
    description: 'Pack de chupones para bebe.',
    price: 9.5,
    stock: 18,
  },
  {
    name: 'Biberon Anticolicos',
    categorySlug: 'alimentacion',
    description: 'Biberon con sistema anticolic.',
    price: 12.75,
    stock: 16,
  },
  {
    name: 'Esterilizador Portatil',
    categorySlug: 'electronica',
    description: 'Esterilizador compacto para accesorios.',
    price: 39.9,
    stock: 5,
  },
  {
    name: 'Proyector Estrellas',
    categorySlug: 'electronica',
    description: 'Proyector de luz para dormitorio.',
    price: 28.9,
    stock: 7,
  },
  {
    name: 'Colonia Manzanilla',
    categorySlug: 'perfumes',
    description: 'Fragancia fresca de uso diario.',
    price: 11.9,
    stock: 18,
  },
  {
    name: 'Perfume Algodon Kids',
    categorySlug: 'perfumes',
    description: 'Aroma delicado para niños.',
    price: 14.5,
    stock: 13,
  },
  {
    name: 'Sandalias Playa Infantil',
    categorySlug: 'accesorios',
    description: 'Sandalias ligeras para verano.',
    variants: [
      { name: '22', stock: 7, price: 12.9 },
      { name: '23', stock: 8, price: 12.9 },
      { name: '24', stock: 6, price: 13.9 },
    ],
  },
  {
    name: 'Traje Baño Tiburon',
    categorySlug: 'ropa-infantil',
    genre: 'niño',
    description: 'Traje de baño con diseño divertido.',
    variants: [
      { name: 'T4', stock: 5, price: 18.9 },
      { name: 'T6', stock: 5, price: 19.9 },
      { name: 'T8', stock: 4, price: 20.9 },
    ],
  },
  {
    name: 'Traje Baño Sirena',
    categorySlug: 'ropa-infantil',
    genre: 'niña',
    description: 'Traje de baño con estampado sirena.',
    variants: [
      { name: 'T4', stock: 5, price: 18.9 },
      { name: 'T6', stock: 5, price: 19.9 },
      { name: 'T8', stock: 4, price: 20.9 },
    ],
  },
  {
    name: 'Set Regalo Recien Nacido',
    categorySlug: 'ropa-bebe',
    genre: 'unisex',
    description: 'Set de bienvenida con piezas basicas.',
    variants: [
      { name: 'RN', stock: 6, price: 32.9 },
      { name: 'M3', stock: 5, price: 33.9 },
    ],
  },
];

const loadEnv = () => {
  const envPath = '.env';
  if (!existsSync(envPath)) return;

  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
};

const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const randomCode = () =>
  randomBytes(5)
    .toString('base64url')
    .replace(/[^a-z0-9]/gi, '')
    .slice(0, 6)
    .toUpperCase()
    .padEnd(6, 'X');

const buildSku = (categorySlug: string, index: number) => {
  const prefix = categorySlug
    .replace(/[^a-z0-9]/gi, '')
    .slice(0, 3)
    .toUpperCase()
    .padEnd(3, 'X');
  return `${prefix}-S${String(index + 1).padStart(2, '0')}${randomCode().slice(
    0,
    3,
  )}`;
};

const getAvailability = (product: ProductSeed) => {
  if (product.variants?.length) {
    return product.variants.some((variant) => variant.stock > 0)
      ? 'disponible'
      : 'agotado';
  }

  return (product.stock ?? 0) > 0 ? 'disponible' : 'agotado';
};

const buildImage = (product: ProductSeed, index: number) => {
  return {
    url: SEED_IMAGE_URL,
    publicId: `${SEED_IMAGE_PUBLIC_ID}-${product.categorySlug}-${index + 1}`,
  };
};

const ensureCategories = async () => {
  const collection = mongoose.connection.collection('categories');
  const categoryMap = new Map<string, Types.ObjectId>();

  for (const category of categories) {
    const existing = await collection.findOne<{ _id: Types.ObjectId }>({
      slug: category.slug,
    });

    if (existing?._id) {
      categoryMap.set(category.slug, existing._id);
      continue;
    }

    const now = new Date();
    const inserted = await collection.insertOne({
      name: category.name,
      slug: category.slug,
      parent: null,
      createdAt: now,
      updatedAt: now,
    });
    categoryMap.set(category.slug, inserted.insertedId);
  }

  return categoryMap;
};

const seedProducts = async () => {
  const categoryMap = await ensureCategories();
  const collection = mongoose.connection.collection('products');
  const now = new Date();

  const docs = products.map((product, index) => {
    const categoryId = categoryMap.get(product.categorySlug);
    if (!categoryId) {
      throw new Error(`Categoria no encontrada: ${product.categorySlug}`);
    }

    const slug = `seed-demo-${String(index + 1).padStart(2, '0')}-${slugify(
      product.name,
    )}`;
    const image = buildImage(product, index);

    return {
      sku: buildSku(product.categorySlug, index),
      slug,
      categoryId,
      name: product.name,
      description: `${product.description} Producto de demostracion.`,
      brand: SEED_BRAND,
      thumbnail: image.url,
      images: [image],
      state: 'activo',
      availability: getAvailability(product),
      genre: product.genre,
      variants: product.variants,
      stock: product.variants?.length ? undefined : product.stock,
      price: product.variants?.length ? undefined : product.price,
      stats: {
        views: Math.floor(index * 7 + 5),
        favorites: Math.floor(index % 9),
        cartAdds: Math.floor(index % 6),
        purchases: Math.floor(index % 5),
        searches: Math.floor(index * 3 + 2),
      },
      createdAt: now,
      updatedAt: now,
    };
  });

  await collection.deleteMany({ brand: SEED_BRAND });
  const result = await collection.insertMany(docs);
  console.log(`Seed creada: ${result.insertedCount} productos demo.`);
};

const clearProducts = async () => {
  const result = await mongoose.connection
    .collection('products')
    .deleteMany({ brand: SEED_BRAND });
  console.log(`Seed eliminada: ${result.deletedCount} productos demo.`);
};

const main = async () => {
  loadEnv();
  const command = process.argv[2] ?? 'seed';
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('Falta MONGO_URI en .env');
  }

  await mongoose.connect(uri);

  try {
    if (command === 'clear') {
      await clearProducts();
      return;
    }

    if (command !== 'seed') {
      throw new Error('Comando invalido. Usa: seed o clear');
    }

    await seedProducts();
  } finally {
    await mongoose.disconnect();
  }
};

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
