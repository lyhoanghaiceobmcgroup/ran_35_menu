import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Copy, CheckCircle, ArrowLeft, Clock, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SepayService } from '@/utils/sepayService';

interface QRPaymentProps {
  orderTotal: number;
  orderId: string;
  onBack: () => void;
  onPaymentComplete: () => void;
}

export const QRPayment: React.FC<QRPaymentProps> = ({
  orderTotal,
  orderId,
  onBack,
  onPaymentComplete
}) => {
  const { toast } = useToast();
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 phút
  const [qrData, setQrData] = useState<{
    qrUrl: string;
    paymentCode: string;
    bankInfo: any;
  } | null>(null);

  // Tạo QR code và thông tin thanh toán sử dụng SepayService
  useEffect(() => {
    const qrInfo = SepayService.createOrderQRCode(orderId, orderTotal);
    setQrData(qrInfo);
  }, [orderId, orderTotal]);

  // Đếm ngược thời gian
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Đã sao chép!",
      description: `${label} đã được sao chép vào clipboard`,
      duration: 2000,
    });
  };

  // Kiểm tra nếu chưa có dữ liệu QR
  if (!qrData) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bistro-primary mx-auto mb-4"></div>
          <p>Đang tạo mã QR thanh toán...</p>
        </div>
      </div>
    );
  }

  const { qrUrl, paymentCode, bankInfo } = qrData;

  return (
    <div className="min-h-screen bg-background p-4">
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Button>
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTime(timeLeft)}
            </Badge>
          </div>
          
          <div className="w-16 h-16 bistro-gradient rounded-full mx-auto mb-4 flex items-center justify-center">
            <QrCode className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-xl">Thanh toán chuyển khoản</CardTitle>
          <CardDescription>
            Quét mã QR hoặc chuyển khoản theo thông tin bên dưới
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* QR Code */}
          <div className="flex justify-center">
            <div className="p-4 bg-white rounded-lg border-2 border-dashed border-bistro-primary">
              <img 
                src={qrUrl} 
                alt="QR Code thanh toán" 
                className="w-48 h-48 object-contain"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0xMDAgNTBWMTUwTTUwIDEwMEgxNTAiIHN0cm9rZT0iIzk5OTk5OSIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTcwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5OTk5IiBmb250LXNpemU9IjEyIj5RUiBDb2RlPC90ZXh0Pgo8L3N2Zz4=';
                }}
              />
            </div>
          </div>

          {/* Thông tin thanh toán */}
          <div className="bg-bistro-cream rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">Số tiền:</span>
              <span className="text-xl font-bold text-bistro-primary">
                {formatPrice(orderTotal)}đ
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-medium">Mã nội dung:</span>
              <div className="flex items-center gap-2">
                <code className="bg-white px-2 py-1 rounded text-sm font-mono">
                  {paymentCode}
                </code>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => copyToClipboard(paymentCode, 'Mã nội dung')}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Thông tin ngân hàng */}
          <div className="space-y-4">
            <h3 className="font-semibold text-center">Thông tin chuyển khoản</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-sm text-blue-700 font-medium">Ngân hàng:</span>
                <div className="text-right">
                  <div className="font-semibold text-blue-900">{bankInfo.bankCode} - {bankInfo.bankName.split('(')[0].trim()}</div>
                  <div className="text-xs text-blue-600">({bankInfo.bankCode})</div>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                <span className="text-sm text-green-700 font-medium">Số tài khoản:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-green-900 text-lg">{bankInfo.accountNumber}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-green-600 hover:text-green-800 hover:bg-green-100"
                    onClick={() => copyToClipboard(bankInfo.accountNumber, 'Đã sao chép số tài khoản')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                <span className="text-sm text-purple-700 font-medium">Chủ tài khoản:</span>
                <div className="text-right">
                  <div className="font-semibold text-purple-900">{bankInfo.accountName}</div>
                  <div className="text-xs text-purple-600">Công ty TNHH</div>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                <span className="text-sm text-orange-700 font-medium">Chi nhánh:</span>
                <span className="font-medium text-orange-900">{bankInfo.branch}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-sm text-gray-700 font-medium">SWIFT Code:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium text-gray-900">{bankInfo.swiftCode}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                    onClick={() => copyToClipboard(bankInfo.swiftCode, 'Đã sao chép SWIFT Code')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Hướng dẫn */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Hướng dẫn thanh toán:</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Quét mã QR bằng app ngân hàng của bạn</li>
              <li>Hoặc chuyển khoản theo thông tin trên</li>
              <li>Nhập đúng mã nội dung: <strong>{paymentCode}</strong></li>
              <li>Sau khi chuyển khoản, nhấn "Đã thanh toán"</li>
            </ol>
          </div>

          <Button 
            onClick={onPaymentComplete}
            className="w-full h-12 text-base font-semibold"
            variant="bistro"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Đã thanh toán
          </Button>

          <div className="text-center">
            <Button 
              variant="link" 
              className="text-sm text-muted-foreground"
              onClick={() => window.open('tel:0908138885', '_self')}
            >
              Cần hỗ trợ? Gọi Hotline: 0908 138 885
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};