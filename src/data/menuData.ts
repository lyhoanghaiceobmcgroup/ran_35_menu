export interface MenuItem {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category_id: string;
  available: boolean;
  tags: string[];
  modifiers?: Modifier[];
}

export interface Modifier {
  id: string;
  name: string;
  type: 'single' | 'multiple';
  required: boolean;
  options: ModifierOption[];
}

export interface ModifierOption {
  id: string;
  name: string;
  price_delta: number;
}

export interface MenuCategory {
  id: string;
  name: string;
  sort_order: number;
  icon?: string;
}

export interface CartItem {
  id: string;
  item_id: string;
  quantity: number;
  modifiers: { [key: string]: string };
  note?: string;
  price: number;
}

export interface OrderStatus {
  status: 'DRAFT' | 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'PAYING_CASH' | 'PAYING_ONLINE' | 'PAID' | 'IN_KITCHEN' | 'SERVED' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';
  updatedAt: Date;
  message?: string;
}

// Mock data for categories
export const menuCategories: MenuCategory[] = [
  { id: 'new', name: 'Món mới', sort_order: 1, icon: '🆕' },
  { id: 'bestseller', name: 'Best-seller', sort_order: 2, icon: '⭐' },
  { id: 'combo', name: 'Combo/Set', sort_order: 3, icon: '🍽️' },
  { id: 'appetizer', name: 'Khai vị', sort_order: 4, icon: '🥗' },
  { id: 'main', name: 'Món chính', sort_order: 5, icon: '🍖' },
  { id: 'salad', name: 'Salad', sort_order: 6, icon: '🥬' },
  { id: 'pasta', name: 'Pizza-Pasta', sort_order: 7, icon: '🍝' },
  { id: 'drinks', name: 'Đồ uống', sort_order: 8, icon: '☕' },
  { id: 'dessert', name: 'Tráng miệng', sort_order: 9, icon: '🍰' }
];

// Mock data for menu items
export const menuItems: MenuItem[] = [
  {
    id: '1',
    sku: 'GC001',
    name: 'Gỏi Cuốn Tôm Thịt',
    description: 'Cuốn tươi với tôm, thịt heo, bún, rau thơm, chấm nước mắm chua ngọt',
    price: 89000,
    image: '/src/assets/food-spring-rolls.jpg',
    category_id: 'appetizer',
    available: true,
    tags: ['new', 'healthy'],
    modifiers: [
      {
        id: 'size',
        name: 'Kích cỡ',
        type: 'single',
        required: true,
        options: [
          { id: 'normal', name: 'Bình thường (2 cuốn)', price_delta: 0 },
          { id: 'large', name: 'Lớn (3 cuốn)', price_delta: 30000 }
        ]
      }
    ]
  },
  {
    id: '2',
    sku: 'NOM001',
    name: 'Nộm Bò Sấy Dẻo Xoài Xanh',
    description: 'Xoài xanh thái sợi trộn bò sấy dẻo, đậu phộng rang, rau thơm',
    price: 119000,
    image: '/src/assets/food-mango-salad.jpg',
    category_id: 'salad',
    available: true,
    tags: ['bestseller', 'spicy'],
    modifiers: [
      {
        id: 'spice',
        name: 'Độ cay',
        type: 'single',
        required: false,
        options: [
          { id: 'mild', name: 'Ít cay', price_delta: 0 },
          { id: 'medium', name: 'Vừa cay', price_delta: 0 },
          { id: 'hot', name: 'Cay', price_delta: 0 }
        ]
      }
    ]
  },
  {
    id: '3',
    sku: 'PHO001',
    name: 'Phở Bò Đặc Biệt',
    description: 'Phở bò với thịt bò tái, chín, gân, sách. Nước dùng niêu 24h',
    price: 95000,
    image: '/src/assets/food-pho-bo.jpg',
    category_id: 'main',
    available: true,
    tags: ['bestseller', 'traditional'],
    modifiers: [
      {
        id: 'beef_type',
        name: 'Loại thịt bò',
        type: 'multiple',
        required: false,
        options: [
          { id: 'tai', name: 'Bò tái', price_delta: 0 },
          { id: 'chin', name: 'Bò chín', price_delta: 0 },
          { id: 'gan', name: 'Gân', price_delta: 10000 },
          { id: 'sach', name: 'Sách', price_delta: 15000 }
        ]
      }
    ]
  },
  {
    id: '4',
    sku: 'BO001',
    name: 'Bò Úc Sốt Tiêu Đen',
    description: 'Thịt bò Úc thăn nội thượng hạng, sốt tiêu đen đậm đà',
    price: 239000,
    image: '/src/assets/food-beef-pepper.jpg',
    category_id: 'main',
    available: true,
    tags: ['premium', 'new'],
    modifiers: [
      {
        id: 'doneness',
        name: 'Độ chín',
        type: 'single',
        required: true,
        options: [
          { id: 'rare', name: 'Tái (Rare)', price_delta: 0 },
          { id: 'medium_rare', name: 'Tái giữa (Medium Rare)', price_delta: 0 },
          { id: 'medium', name: 'Vừa (Medium)', price_delta: 0 },
          { id: 'well_done', name: 'Chín kỹ (Well Done)', price_delta: 0 }
        ]
      },
      {
        id: 'size',
        name: 'Kích cỡ',
        type: 'single',
        required: true,
        options: [
          { id: 'small', name: 'Nhỏ (150g)', price_delta: -40000 },
          { id: 'medium', name: 'Vừa (200g)', price_delta: 0 },
          { id: 'large', name: 'Lớn (250g)', price_delta: 60000 }
        ]
      }
    ]
  },
  {
    id: '5',
    sku: 'CF001',
    name: 'Cà Phê Sữa Đá',
    description: 'Cà phê phin truyền thống với sữa đặc, đá viên',
    price: 35000,
    image: '/src/assets/drink-vietnamese-coffee.jpg',
    category_id: 'drinks',
    available: true,
    tags: ['traditional', 'popular'],
    modifiers: [
      {
        id: 'ice',
        name: 'Đá',
        type: 'single',
        required: false,
        options: [
          { id: 'normal', name: 'Bình thường', price_delta: 0 },
          { id: 'less', name: 'Ít đá', price_delta: 0 },
          { id: 'no_ice', name: 'Không đá', price_delta: 0 }
        ]
      },
      {
        id: 'sweetness',
        name: 'Độ ngọt',
        type: 'single',
        required: false,
        options: [
          { id: 'normal', name: 'Bình thường', price_delta: 0 },
          { id: 'less_sweet', name: 'Ít ngọt', price_delta: 0 },
          { id: 'extra_sweet', name: 'Thêm ngọt', price_delta: 5000 }
        ]
      }
    ]
  },
  {
    id: '6',
    sku: 'WTR001',
    name: 'Nước lọc',
    description: 'Nước lọc tinh khiết, mát lạnh',
    price: 10000,
    image: '/src/assets/placeholder.svg',
    category_id: 'drinks',
    available: true,
    tags: ['healthy', 'basic'],
    modifiers: [
      {
        id: 'temperature',
        name: 'Nhiệt độ',
        type: 'single',
        required: false,
        options: [
          { id: 'cold', name: 'Lạnh', price_delta: 0 },
          { id: 'room_temp', name: 'Thường', price_delta: 0 }
        ]
      }
    ]
  }
];

// Table data
export interface TableInfo {
  table_code: string;
  zone: string;
  seats: number;
  status: 'available' | 'occupied' | 'reserved';
}

export const tableInfo: TableInfo = {
  table_code: 'NT01',
  zone: 'Tầng 1',
  seats: 4,
  status: 'occupied'
};