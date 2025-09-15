import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Star } from 'lucide-react';
import { MenuItem } from '@/data/menuData';

interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem) => void;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({ item, onAddToCart }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const getTagColor = (tag: string) => {
    switch (tag) {
      case 'new': return 'bg-bistro-success text-white';
      case 'bestseller': return 'bg-bistro-gold text-white';
      case 'premium': return 'bg-bistro-secondary text-white';
      case 'spicy': return 'bg-bistro-warning text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTagIcon = (tag: string) => {
    switch (tag) {
      case 'bestseller': return <Star className="w-3 h-3" />;
      default: return null;
    }
  };

  return (
    <Card className="overflow-hidden bistro-card-shadow hover:shadow-lg bistro-transition group">
      <div className="relative">
        <img 
          src={item.image} 
          alt={item.name}
          className="w-full h-48 object-cover group-hover:scale-105 bistro-transition"
        />
        {item.tags.length > 0 && (
          <div className="absolute top-2 left-2 flex gap-1">
            {item.tags.slice(0, 2).map((tag) => (
              <Badge 
                key={tag} 
                className={`${getTagColor(tag)} text-xs px-2 py-1`}
              >
                {getTagIcon(tag)}
                {tag === 'new' ? 'MỚI' : 
                 tag === 'bestseller' ? 'BÁN CHẠY' :
                 tag === 'premium' ? 'CAO CẤP' :
                 tag === 'spicy' ? 'CAY' : tag.toUpperCase()}
              </Badge>
            ))}
          </div>
        )}
        {!item.available && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="destructive" className="text-sm">Hết món</Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg leading-tight flex-1 pr-2">
            {item.name}
          </h3>
          <Button
            size="sm"
            variant="bistro"
            className="rounded-full w-8 h-8 p-0 shrink-0"
            onClick={() => onAddToCart(item)}
            disabled={!item.available}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {item.description}
        </p>
        
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-bistro-primary">
            {formatPrice(item.price)}đ
          </span>
          {item.modifiers && item.modifiers.length > 0 && (
            <span className="text-xs text-muted-foreground">
              Có tùy chọn
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};