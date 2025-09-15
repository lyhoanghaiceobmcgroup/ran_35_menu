import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DatabaseSetupProps {
  children: React.ReactNode;
}

export const DatabaseSetup: React.FC<DatabaseSetupProps> = ({ children }) => {
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);

  useEffect(() => {
    const setupDatabase = async () => {
      try {
        // Try a simple test query to check if customers table exists
        const { data, error } = await supabase
          .from('customers')
          .select('id')
          .limit(1);

        if (error) {
          console.log('Customers table may not exist or has access issues:', error.message);
          console.log('App will continue with fallback customer handling');
        } else {
          console.log('Customers table is accessible');
        }

        setIsSetupComplete(true);
      } catch (error) {
        console.error('Database setup error:', error);
        // Continue anyway - the app should work with fallback
        setIsSetupComplete(true);
      }
    };

    setupDatabase();
  }, []);

  if (!isSetupComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bistro-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang khởi tạo hệ thống...</p>
        </div>
      </div>
    );
  }

  if (setupError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Lỗi kết nối database: {setupError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-bistro-primary text-white rounded hover:bg-bistro-primary/90"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};