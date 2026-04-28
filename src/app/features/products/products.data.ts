export type ProductCategory =
  | 'todos'
  | 'abarrotes'
  | 'bebidas'
  | 'lacteos'
  | 'snacks'
  | 'limpieza'
  | 'higiene'
  | 'panaderia'
  | 'carnes';

export interface Product {
  id: number;
  name: string;
  category: Exclude<ProductCategory, 'todos'>;
  imageUrl?: string;
  price: number;
  stock: number;
  unit: string;
  supplier?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  todos: 'Todos',
  abarrotes: 'Abarrotes',
  bebidas: 'Bebidas',
  lacteos: 'Lácteos',
  snacks: 'Snacks',
  limpieza: 'Limpieza',
  higiene: 'Higiene',
  panaderia: 'Panadería',
  carnes: 'Carnes',
};

export const CATEGORY_ICONS: Record<ProductCategory, string> = {
  todos:     '🏪',
  abarrotes: '🌾',
  bebidas:   '🥤',
  lacteos:   '🥛',
  snacks:    '🍿',
  limpieza:  '🧹',
  higiene:   '🧴',
  panaderia: '🍞',
  carnes:    '🥩',
};

const IMG = (keywords: string, id: number) =>
  `https://loremflickr.com/320/240/${keywords}?lock=${id}`;

export const MOCK_PRODUCTS: Product[] = [
  { id: 1,  name: 'Arroz Costeño 5kg',      category: 'abarrotes', price: 28.50, stock: 42,  unit: 'saco',    supplier: 'Costeño S.A.',          imageUrl: IMG('rice,grain',           1) },
  { id: 2,  name: 'Aceite Primor 1L',        category: 'abarrotes', price: 8.90,  stock: 30,  unit: 'botella', supplier: 'Alicorp S.A.A.',        imageUrl: IMG('cooking,oil,bottle',    2) },
  { id: 3,  name: 'Azúcar rubia 1kg',        category: 'abarrotes', price: 4.50,  stock: 55,  unit: 'bolsa',   supplier: 'Dist. Central S.A.C.',  imageUrl: IMG('sugar,brown',           3) },
  { id: 4,  name: 'Fideo Lavaggi 500g',      category: 'abarrotes', price: 3.20,  stock: 80,  unit: 'bolsa',   supplier: 'Alicorp S.A.A.',        imageUrl: IMG('pasta,noodles',         4) },
  { id: 5,  name: 'Lentejas 500g',           category: 'abarrotes', price: 3.80,  stock: 25,  unit: 'bolsa',                                      imageUrl: IMG('lentils,legumes',       5) },
  { id: 6,  name: 'Sal marina 1kg',          category: 'abarrotes', price: 1.50,  stock: 60,  unit: 'bolsa',                                      imageUrl: IMG('salt,sea',              6) },
  { id: 7,  name: 'Coca-Cola 1.5L',          category: 'bebidas',   price: 5.50,  stock: 36,  unit: 'botella', supplier: 'Coca-Cola FEMSA',       imageUrl: IMG('cola,soda,bottle',      7) },
  { id: 8,  name: 'Inca Kola 1.5L',          category: 'bebidas',   price: 5.50,  stock: 40,  unit: 'botella', supplier: 'Coca-Cola FEMSA',       imageUrl: IMG('soda,drink,bottle',     8) },
  { id: 9,  name: 'Agua San Luis 600ml',     category: 'bebidas',   price: 1.80,  stock: 120, unit: 'botella', supplier: 'Nestlé Perú S.A.',      imageUrl: IMG('water,bottle',          9) },
  { id: 10, name: 'Jugo Pulp Durazno 1L',    category: 'bebidas',   price: 6.00,  stock: 18,  unit: 'caja',                                       imageUrl: IMG('juice,peach,fruit',    10) },
  { id: 11, name: 'Leche Gloria Tarro',      category: 'lacteos',   price: 7.90,  stock: 48,  unit: 'tarro',   supplier: 'Gloria S.A.',           imageUrl: IMG('milk,can',             11) },
  { id: 12, name: 'Yogurt Gloria 1kg',       category: 'lacteos',   price: 9.50,  stock: 12,  unit: 'vaso',    supplier: 'Gloria S.A.',           imageUrl: IMG('yogurt,dairy',         12) },
  { id: 13, name: 'Mantequilla Laive 200g',  category: 'lacteos',   price: 8.20,  stock: 3,   unit: 'paquete', supplier: 'Laive S.A.',            imageUrl: IMG('butter,dairy',         13) },
  { id: 14, name: 'Queso Edam 250g',         category: 'lacteos',   price: 12.00, stock: 8,   unit: 'paquete', supplier: 'Laive S.A.',            imageUrl: IMG('cheese,edam',          14) },
  { id: 15, name: 'Cheetos 100g',            category: 'snacks',    price: 4.00,  stock: 50,  unit: 'bolsa',   supplier: 'Frito-Lay Perú',        imageUrl: IMG('cheetos,snack,chips',  15) },
  { id: 16, name: 'Doritos Nacho 150g',      category: 'snacks',    price: 5.50,  stock: 35,  unit: 'bolsa',   supplier: 'Frito-Lay Perú',        imageUrl: IMG('doritos,chips,nacho',  16) },
  { id: 17, name: 'Galletas Oreo 119g',      category: 'snacks',    price: 3.50,  stock: 45,  unit: 'paquete',                                    imageUrl: IMG('oreo,cookie,biscuit',  17) },
  { id: 18, name: 'Chocolate Sublime',       category: 'snacks',    price: 1.50,  stock: 90,  unit: 'unidad',  supplier: 'Nestlé Perú S.A.',      imageUrl: IMG('chocolate,bar',        18) },
  { id: 19, name: 'Jabón Bolivar 360g',      category: 'limpieza',  price: 4.80,  stock: 24,  unit: 'barra',   supplier: 'Alicorp S.A.A.',        imageUrl: IMG('soap,bar,laundry',     19) },
  { id: 20, name: 'Detergente Ariel 1kg',    category: 'limpieza',  price: 14.50, stock: 20,  unit: 'bolsa',   supplier: 'Procter & Gamble',      imageUrl: IMG('detergent,laundry',    20) },
  { id: 21, name: 'Lejía Clorox 1L',         category: 'limpieza',  price: 5.00,  stock: 30,  unit: 'botella', supplier: 'Clorox Perú S.A.',      imageUrl: IMG('bleach,cleaning',      21) },
  { id: 22, name: 'Esponja Limpiahogar',     category: 'limpieza',  price: 1.00,  stock: 0,   unit: 'unidad',                                     imageUrl: IMG('sponge,cleaning',      22) },
  { id: 23, name: 'Shampoo Head&Shoulders',  category: 'higiene',   price: 18.00, stock: 15,  unit: 'botella', supplier: 'Procter & Gamble',      imageUrl: IMG('shampoo,hair,bottle',  23) },
  { id: 24, name: 'Jabón Dove 90g',          category: 'higiene',   price: 3.50,  stock: 40,  unit: 'barra',   supplier: 'Unilever Perú S.A.',    imageUrl: IMG('soap,dove,body',       24) },
  { id: 25, name: 'Papel Higiénico Elite',   category: 'higiene',   price: 12.00, stock: 28,  unit: 'paquete', supplier: 'CMPC Tissue S.A.',      imageUrl: IMG('toilet,paper,roll',    25) },
  { id: 26, name: 'Pan de Molde Bimbo',      category: 'panaderia', price: 7.90,  stock: 6,   unit: 'bolsa',   supplier: 'Bimbo del Perú S.A.',   imageUrl: IMG('bread,sliced,loaf',    26) },
  { id: 27, name: 'Galleta Soda San Jorge',  category: 'panaderia', price: 2.50,  stock: 30,  unit: 'paquete', supplier: 'Alicorp S.A.A.',        imageUrl: IMG('crackers,soda,biscuit',27) },
  { id: 28, name: 'Pollo entero kg',         category: 'carnes',    price: 10.00, stock: 5,   unit: 'kg',      supplier: 'Avícola San Fernando',  imageUrl: IMG('chicken,meat,raw',     28) },
  { id: 29, name: 'Huevos blancos x12',      category: 'carnes',    price: 10.50, stock: 20,  unit: 'cartón',  supplier: 'Avícola San Fernando',  imageUrl: IMG('eggs,white,dozen',     29) },
];
