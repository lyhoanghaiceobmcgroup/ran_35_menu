import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CreditCard, Wallet, Banknote, QrCode, CheckCircle } from 'lucide-react';

interface PaymentOptionsProps {
  orderTotal: number;
  onPaymentMethodSelect: (method: 'CASH' | 'BANK_TRANSFER') => void;
}

export const PaymentOptions: React.FC<PaymentOptionsProps> = ({
  orderTotal,
  onPaymentMethodSelect
}) => {
  const [selectedMethod, setSelectedMethod] = useState<string>('');

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const paymentMethods = [
    {
      id: 'CASH',
      name: 'Thanh toán tiền mặt',
      description: 'Thanh toán tiền mặt khi nhân viên mang hóa đơn đến bàn',
      icon: <Banknote className="w-5 h-5" />,
      badge: 'Phổ biến',
      badgeColor: 'bg-bistro-success'
    },
    {
      id: 'BANK_TRANSFER',
      name: 'Thanh toán chuyển khoản',
      description: 'Chuyển khoản ngân hàng với QR code và mã nội dung tự động',
      icon: <QrCode className="w-5 h-5" />,
      badge: 'Nhanh chóng',
      badgeColor: 'bg-bistro-primary'
    }
  ];

  const handleProceed = () => {
    if (selectedMethod) {
      onPaymentMethodSelect(selectedMethod as any);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bistro-gradient rounded-full mx-auto mb-4 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-xl">Đơn hàng đã xác nhận!</CardTitle>
          <CardDescription>
            Vui lòng chọn phương thức thanh toán
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-bistro-cream rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Tổng thanh toán:</span>
              <span className="text-xl font-bold text-bistro-primary">
                {formatPrice(orderTotal)}đ
              </span>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Chọn phương thức thanh toán</h3>
            <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod}>
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <div key={method.id}>
                    <Label 
                      htmlFor={method.id}
                      className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 bistro-transition"
                    >
                      <RadioGroupItem value={method.id} id={method.id} />
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-bistro-cream rounded-lg flex items-center justify-center">
                          {method.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{method.name}</span>
                            <Badge className={`${method.badgeColor} text-white text-xs`}>
                              {method.badge}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {method.description}
                          </p>
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          <Separator />

          <Button 
            onClick={handleProceed}
            disabled={!selectedMethod}
            className="w-full h-12 text-base font-semibold"
            variant="bistro"
          >
            Tiếp tục thanh toán
          </Button>

          <div className="text-center">
            <Button 
              variant="link" 
              className="text-sm text-muted-foreground"
              onClick={() => window.open('tel:0908138885', '_self')}
            >
              Cần hỗ trợ? Gọi Hotline
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};