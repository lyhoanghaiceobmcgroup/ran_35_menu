import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, ArrowRight, Gift } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { handleCustomerVisit } from '@/utils/createCustomersTable';
interface PhoneVerificationProps {
  tableCode: string;
  onVerified: (phone: string) => void;
}
export const PhoneVerification: React.FC<PhoneVerificationProps> = ({
  tableCode,
  onVerified
}) => {
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const {
    toast
  } = useToast();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.match(/^(\+84|84|0)[3|5|7|8|9][0-9]{8}$/)) {
      toast({
        title: "Số điện thoại không hợp lệ",
        description: "Vui lòng nhập số điện thoại Việt Nam hợp lệ",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);

    try {
      // Save customer information to Supabase
      const result = await handleCustomerVisit(phone, tableCode);

      if (!result.success) {
        console.error('Error saving customer:', result.error);
        // Continue anyway - the main functionality should still work
        console.log('Continuing without saving customer data to database');
      }

      toast({
        title: "Xác thực thành công!",
        description: result.success && result.isNewCustomer ? "Chào mừng bạn đến RanBistro lần đầu!" : "Chào mừng bạn đến RanBistro!"
      });
      onVerified(phone);
    } catch (error) {
      console.error('Unexpected error:', error);
      // Continue anyway - don't block the user experience
      toast({
        title: "Xác thực thành công!",
        description: "Chào mừng bạn đến RanBistro!"
      });
      onVerified(phone);
    } finally {
      setIsLoading(false);
    }
  };
  return <div className="min-h-screen bistro-hero-gradient flex items-center justify-center p-4">
      <Card className="w-full max-w-md bistro-card-shadow">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bistro-gradient rounded-full mx-auto mb-4 flex items-center justify-center">
            <Phone className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Xin chào!</CardTitle>
          <CardDescription className="text-base">
            Bạn đang ở <span className="font-semibold text-bistro-primary">Ran Bitro</span>
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-2">
                Số điện thoại
              </label>
              <Input id="phone" type="tel" placeholder="điền số điện thoại" value={phone} onChange={e => setPhone(e.target.value)} className="text-center text-lg" required />
            </div>
            
            
            
            <Button type="submit" className="w-full" size="lg" disabled={isLoading} variant="bistro">
              {isLoading ? "Đang xác thực..." : <>
                  Vào Menu
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>}
            </Button>
          </form>
          
          <p className="text-xs text-muted-foreground text-center mt-4">
            Thông tin của bạn được bảo mật theo chính sách riêng tư RanBistro
          </p>
        </CardContent>
      </Card>
    </div>;
};