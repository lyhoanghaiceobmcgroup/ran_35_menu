import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Copy, CheckCircle, ArrowLeft, Clock, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SepayService } from '@/utils/sepayService';
import { useOrderStatus } from '@/hooks/useOrderStatus';

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
  const [showSuccess, setShowSuccess] = useState(false);
  const [qrData, setQrData] = useState<{
    qrUrl: string;
    paymentCode: string;
    bankInfo: any;
  } | null>(null);
  
  // Sử dụng hook để theo dõi trạng thái thanh toán realtime
  const { orderStatus, isLoading: statusLoading, refreshStatus } = useOrderStatus(orderId);

  // Tạo QR code và thông tin thanh toán sử dụng SepayService
  useEffect(() => {
    const qrInfo = SepayService.createOrderQRCode(orderId, orderTotal);
    setQrData(qrInfo);
  }, [orderId, orderTotal]);
  
  // Xử lý khi trạng thái thanh toán thay đổi
  useEffect(() => {
    if (orderStatus === 'confirmed') {
      // Phát âm thanh thông báo thành công
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
        audio.volume = 0.3;
        audio.play().catch(() => {});
      } catch (error) {
        // Ignore audio errors
      }
      
      // Hiển thị hiệu ứng thành công
      setShowSuccess(true);
      
      toast({
        title: "🎉 Thanh toán thành công!",
        description: "Đơn hàng của bạn đã được xác nhận. Cảm ơn bạn!",
        duration: 5000,
      });
      
      // Tự động chuyển về trang chính sau 3 giây
      setTimeout(() => {
        onPaymentComplete();
      }, 3000);
    } else if (orderStatus === 'rejected') {
      toast({
        title: "❌ Thanh toán thất bại",
        description: "Đơn hàng đã bị từ chối. Vui lòng liên hệ hỗ trợ.",
        duration: 5000,
      });
    }
  }, [orderStatus, toast, onPaymentComplete]);

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
    <div className="min-h-screen bg-background p-4 relative">
      {/* Hiệu ứng thành công */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-8 text-center animate-bounce">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">Thanh toán thành công!</h2>
            <p className="text-gray-600">Đơn hàng đã được xác nhận</p>
          </div>
        </div>
      )}
      
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-between items-center mb-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Button>
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTime(timeLeft)}
            </Badge>
          </div>
          
          <div className="w-12 h-12 bistro-gradient rounded-full mx-auto mb-3 flex items-center justify-center">
            <QrCode className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-lg mb-2">Thanh toán chuyển khoản</CardTitle>
          <CardDescription className="text-sm">
            Quét mã QR hoặc chuyển khoản theo thông tin bên dưới
          </CardDescription>
          
          {/* Trạng thái realtime */}
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className={`w-2 h-2 rounded-full ${
              orderStatus === 'confirmed' ? 'bg-green-500' :
              orderStatus === 'rejected' ? 'bg-red-500' :
              statusLoading ? 'bg-yellow-500 animate-pulse' :
              'bg-blue-500 animate-pulse'
            }`}></div>
            <span className="text-xs text-gray-600">
              {orderStatus === 'confirmed' ? 'Thanh toán đã xác nhận' :
               orderStatus === 'rejected' ? 'Thanh toán bị từ chối' :
               statusLoading ? 'Đang kiểm tra...' :
               'Đang chờ thanh toán'}
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* QR Code */}
          <div className="flex justify-center">
            <div className="p-3 bg-white rounded-lg border border-bistro-primary/20">
              <img 
                src={qrUrl} 
                alt="QR Code thanh toán" 
                className="w-40 h-40 sm:w-48 sm:h-48 object-contain"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0xMDAgNTBWMTUwTTUwIDEwMEgxNTAiIHN0cm9rZT0iIzk5OTk5OSIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTcwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5OTk5IiBmb250LXNpemU9IjEyIj5RUiBDb2RlPC90ZXh0Pgo8L3N2Zz4=';
                }}
              />
            </div>
          </div>

          {/* Thông tin thanh toán */}
          <div className="bg-bistro-cream/50 rounded-lg p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Số tiền:</span>
              <span className="text-lg font-bold text-bistro-primary">
                {formatPrice(orderTotal)}đ
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Mã nội dung:</span>
              <div className="flex items-center gap-1">
                <code className="bg-white px-2 py-1 rounded text-xs font-mono">
                  {paymentCode}
                </code>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-6 w-6 p-0"
                  onClick={() => copyToClipboard(paymentCode, 'Mã nội dung')}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>

          {/* Thông tin ngân hàng */}
          <div className="bg-gray-50 rounded-lg p-3">
            <h3 className="text-sm font-semibold text-center mb-3 text-gray-700">Thông tin chuyển khoản</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Ngân hàng:</span>
                <span className="text-sm font-medium text-gray-900">{bankInfo.bankCode} - {bankInfo.bankName}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Số tài khoản:</span>
                <div className="flex items-center gap-1">
                  <span className="font-mono font-bold text-sm text-gray-900">{bankInfo.accountNumber}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                    onClick={() => copyToClipboard(bankInfo.accountNumber, 'Đã sao chép số tài khoản')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Chủ tài khoản:</span>
                <span className="text-sm font-medium text-gray-900">{bankInfo.accountName}</span>
              </div>
            </div>
          </div>

          {/* Hướng dẫn */}
          <div className="bg-blue-50/50 rounded-lg p-3">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Hướng dẫn thanh toán:</h4>
            <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
              <li>Quét mã QR bằng app ngân hàng</li>
              <li>Hoặc chuyển khoản theo thông tin trên</li>
              <li>Nhập đúng mã: <strong>{paymentCode}</strong></li>
              <li>Sau đó nhấn "Đã thanh toán"</li>
            </ol>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => {
                refreshStatus(); // Kiểm tra trạng thái ngay lập tức
                onPaymentComplete();
              }}
              className="w-full h-11 text-sm font-semibold"
              variant="bistro"
              disabled={statusLoading || orderStatus === 'confirmed'}
            >
                {statusLoading ? 'Đang kiểm tra...' : 
                 orderStatus === 'confirmed' ? '✅ Đã xác nhận' : 
                 'Đã thanh toán'}
              </Button>

            <div className="text-center">
              <Button 
                variant="link" 
                className="text-xs text-muted-foreground h-auto p-0"
                onClick={() => window.open('tel:0908138885', '_self')}
              >
                Cần hỗ trợ? Gọi: 0908 138 885
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};