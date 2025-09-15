import React from 'react';
import { MenuItemCard } from './MenuItemCard';
import { MenuItem } from '@/data/menuData';

interface MenuGridProps {
  items: MenuItem[];
  onAddToCart: (item: MenuItem) => void;
}

export const MenuGrid: React.FC<MenuGridProps> = ({ items, onAddToCart }) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">🍽️</span>
        </div>
        <p className="text-muted-foreground">Không có món ăn nào trong danh mục này</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {items.map((item) => (
        <MenuItemCard 
          key={item.id} 
          item={item} 
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  );
};