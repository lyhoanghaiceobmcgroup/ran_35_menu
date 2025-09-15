import React from 'react';
import { Badge } from '@/components/ui/badge';
import { MenuCategory } from '@/data/menuData';
import { cn } from '@/lib/utils';

interface MenuCategoriesProps {
  categories: MenuCategory[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

export const MenuCategories: React.FC<MenuCategoriesProps> = ({
  categories,
  activeCategory,
  onCategoryChange
}) => {
  return (
    <div className="sticky top-[88px] bg-background/95 backdrop-blur-sm border-b z-10">
      <div className="container mx-auto px-4 py-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {categories.map((category) => (
            <Badge
              key={category.id}
              variant={activeCategory === category.id ? "default" : "outline"}
              className={cn(
                "cursor-pointer whitespace-nowrap px-4 py-2 text-sm font-medium bistro-transition",
                activeCategory === category.id 
                  ? "bistro-gradient text-white bistro-shadow" 
                  : "hover:bg-bistro-cream hover:border-bistro-primary"
              )}
              onClick={() => onCategoryChange(category.id)}
            >
              <span className="mr-1">{category.icon}</span>
              {category.name}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
};