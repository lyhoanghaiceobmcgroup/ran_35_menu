import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, Users, PhoneCall, Check } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
  tableCode: string;
  onConfirmed: () => void;
  onAddMore?: () => void;
  orderStatus?: 'pending' | 'confirmed' | 'rejected' | null;
  onRefreshStatus?: () => void;
}
export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  orderNumber,
  tableCode,
  onConfirmed,
  onAddMore,
  orderStatus = 'pending',
  onRefreshStatus
}) => {
  const [countdown, setCountdown] = useState(300); // 5 minutes = 300 seconds
  useEffect(() => {
    if (!isOpen || orderStatus !== 'pending') return;
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [isOpen, orderStatus]);

  // Reset countdown when modal opens
  useEffect(() => {
    if (isOpen && orderStatus === 'pending') {
      setCountdown(300);
    }
  }, [isOpen, orderStatus]);
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  const progressValue = (300 - countdown) / 300 * 100;
  
  const getStatusDisplay = () => {
    switch (orderStatus) {
      case 'confirmed':
        return {
          title: 'Đã xác nhận!',
          description: 'Đơn hàng của bạn đã được xác nhận'
        };
      case 'rejected':
        return {
          title: 'Đơn hàng bị từ chối',
          description: 'Rất tiếc, đơn hàng của bạn đã bị từ chối'
        };
      default:
        return {
          title: 'Chờ xác nhận',
          description: 'Vui lòng chờ nhân viên xác nhận đơn hàng của bạn'
        };
    }
  };
  
  const statusDisplay = getStatusDisplay();
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {statusDisplay.title}
          </DialogTitle>
          <DialogDescription className="text-center">
            {statusDisplay.description}
          </DialogDescription>
        </DialogHeader>

        <div className="text-center space-y-6 py-4">
          {orderStatus === 'pending' ? <>
              <div className="w-20 h-20 mx-auto bg-bistro-cream rounded-full flex items-center justify-center animate-pulse">
                <Clock className="w-10 h-10 text-bistro-primary" />
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Đơn hàng đã gửi tới quầy</h3>
                <p className="text-muted-foreground">
                  Vui lòng chờ nhân viên xác nhận đơn hàng của bạn
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Thời gian chờ tối đa:</span>
                  <span className="font-semibold text-bistro-primary">
                    {formatTime(countdown)}
                  </span>
                </div>
                <Progress value={progressValue} className="h-2" />
              </div>

              <div className="bg-bistro-cream rounded-lg p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Mã đơn hàng:</span>
                  <span className="font-mono font-semibold">{orderNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Bàn:</span>
                  <span className="font-semibold">{tableCode}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => window.open('tel:0908138885', '_self')}
                >
                  <PhoneCall className="w-4 h-4 mr-2" />
                  Hotline
                </Button>
                <Button 
                  variant="default" 
                  className="flex-1"
                  onClick={onConfirmed}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Xác nhận
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    onClose();
                    onAddMore?.();
                  }}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Thêm món
                </Button>
              </div>
            </> : orderStatus === 'confirmed' ? <>
              <div className="w-20 h-20 mx-auto bg-bistro-success/10 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-bistro-success" />
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg text-bistro-success">
                  Đơn hàng đã được xác nhận!
                </h3>
                <p className="text-muted-foreground">
                  Nhân viên đã xác nhận đơn hàng của bạn
                </p>
              </div>

              <div className="bg-bistro-success/10 rounded-lg p-4">
                <p className="text-sm text-bistro-success font-medium">
                  Đang chuyển đến bước thanh toán...
                </p>
              </div>
            </> : orderStatus === 'rejected' ? <>
              <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">❌</span>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg text-red-600">
                  Đơn hàng bị từ chối
                </h3>
                <p className="text-muted-foreground">
                  Rất tiếc, đơn hàng của bạn đã bị từ chối
                </p>
              </div>

              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-sm text-red-600 font-medium">
                  Vui lòng liên hệ nhân viên hoặc thử đặt lại
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => window.open('tel:0908138885', '_self')}
                >
                  <PhoneCall className="w-4 h-4 mr-2" />
                  Hotline
                </Button>
                <Button 
                  variant="default" 
                  className="flex-1"
                  onClick={() => {
                    onClose();
                    onAddMore?.();
                  }}
                >
                  Đặt lại
                </Button>
              </div>
            </> : null}
        </div>
      </DialogContent>
    </Dialog>;
};