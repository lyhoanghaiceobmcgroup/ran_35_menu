import React from 'react';
import { MapPin, Users } from 'lucide-react';
import { TableInfo } from '@/data/menuData';

interface TableHeaderProps {
  tableInfo: TableInfo;
}

export const TableHeader: React.FC<TableHeaderProps> = ({ tableInfo }) => {
  return (
    <div className="bg-card border-b sticky top-0 z-10 bistro-card-shadow">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bistro-gradient rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">RB</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">RanBistro</h1>
              <p className="text-sm text-muted-foreground">Bistro Việt Nam</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="w-4 h-4 text-bistro-primary" />
              <span>Bàn {tableInfo.table_code}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="w-3 h-3" />
              <span>{tableInfo.zone} • {tableInfo.seats} chỗ ngồi</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};