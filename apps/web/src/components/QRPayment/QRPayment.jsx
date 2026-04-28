import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, CheckCircle, Loader2, Copy } from 'lucide-react';
import QRCode from 'qrcode';
import { useUIStore } from '../../store/uiStore';
import { ordersService } from '../../services/orders.service';

export default function QRPayment() {
  const navigate = useNavigate();
  const { 
    qrPaymentModalOpen, 
    qrPayload, 
    currentOrderId,
    closeQRPaymentModal,
    showSuccess,
    showError 
  } = useUIStore();

  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const canvasRef = useRef(null);

  // Generate QR code
  useEffect(() => {
    if (qrPayload) {
      QRCode.toDataURL(qrPayload, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      }).then(setQrCodeUrl).catch(console.error);
    }
  }, [qrPayload]);

  const handleConfirmPayment = async () => {
    setIsConfirming(true);
    try {
      await ordersService.confirmPayment(currentOrderId);
      setIsConfirmed(true);
      showSuccess('Payment confirmed!');
      
      // Redirect to order details after delay
      setTimeout(() => {
        closeQRPaymentModal();
        navigate(`/orders/${currentOrderId}`);
      }, 2000);
    } catch (error) {
      showError('Failed to confirm payment');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(qrPayload);
    showSuccess('Payment details copied!');
  };

  const parsedPayload = qrPayload ? JSON.parse(qrPayload) : null;

  if (!qrPaymentModalOpen) return null;

  return (
    <>
      <div className="modal-backdrop" onClick={closeQRPaymentModal} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-dark-900 rounded-2xl z-50 max-w-md mx-auto animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-800">
          <h3 className="font-semibold">Complete Payment</h3>
          <button 
            onClick={closeQRPaymentModal}
            className="p-1 hover:bg-dark-800 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {isConfirmed ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-500" />
              </div>
              <h4 className="text-lg font-semibold mb-2">Payment Successful!</h4>
              <p className="text-dark-400">Redirecting to your order...</p>
            </div>
          ) : (
            <>
              {/* QR Code */}
              <div className="bg-white rounded-xl p-4 mb-6">
                {qrCodeUrl && (
                  <img 
                    src={qrCodeUrl} 
                    alt="Payment QR Code"
                    className="w-full max-w-[256px] mx-auto"
                  />
                )}
              </div>

              {/* Payment details */}
              {parsedPayload && (
                <div className="bg-dark-800 rounded-lg p-4 mb-6 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-400">Amount</span>
                    <span className="font-semibold text-primary-500">
                      ${parsedPayload.amount}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-400">Reference</span>
                    <span className="font-mono">{parsedPayload.ref}</span>
                  </div>
                </div>
              )}

              {/* Instructions */}
              <p className="text-sm text-dark-400 text-center mb-6">
                Scan this QR code with your payment app to complete the order.
                This is a mock payment for demo purposes.
              </p>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={handleConfirmPayment}
                  disabled={isConfirming}
                  className="w-full btn-primary py-3"
                >
                  {isConfirming ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={20} className="animate-spin" />
                      Confirming...
                    </span>
                  ) : (
                    'Mark as Paid (Demo)'
                  )}
                </button>
                
                <button
                  onClick={handleCopyPayload}
                  className="w-full btn-secondary py-3 flex items-center justify-center gap-2"
                >
                  <Copy size={18} />
                  Copy Payment Details
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}