import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Clock, CheckCircle, 
  XCircle, Loader2, Phone
} from 'lucide-react';
import { ordersService } from '../services/orders.service';
import { useUIStore } from '../store/uiStore';

export default function OrderDetail() {
  const { id } = useParams();
  const { showSuccess, showError } = useUIStore();
  
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      const data = await ordersService.getOrderById(id);
      setOrder(data);
    } catch (error) {
      showError('Failed to load order details');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusSteps = () => {
    const steps = ['pending', 'confirmed', 'preparing', 'ready', 'delivered'];
    const currentIndex = steps.indexOf(order?.status);
    
    return steps.map((step, index) => ({
      name: step,
      completed: index <= currentIndex && order?.status !== 'cancelled',
      current: index === currentIndex
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <XCircle size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Order not found</h2>
          <Link to="/orders" className="text-primary-500 hover:underline">
            Back to orders
          </Link>
        </div>
      </div>
    );
  }

  const statusSteps = getStatusSteps();

  return (
    <div className="min-h-screen bg-dark-950 pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-dark-950/95 backdrop-blur-lg border-b border-dark-800 z-10">
        <div className="flex items-center gap-4 p-4">
          <Link to="/orders" className="p-2 hover:bg-dark-800 rounded-full">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="font-semibold">Order Details</h1>
            <p className="text-xs text-dark-400">#{order.id.slice(0, 8)}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Status tracker */}
        {order.status !== 'cancelled' ? (
          <div className="bg-dark-900 rounded-xl p-4">
            <h3 className="font-medium mb-4">Order Status</h3>
            <div className="relative">
              {/* Progress line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-dark-700" />
              
              {/* Steps */}
              <div className="space-y-4">
                {statusSteps.map((step, index) => (
                  <div key={step.name} className="flex items-center gap-4 relative">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                      step.completed 
                        ? 'bg-green-500' 
                        : 'bg-dark-700'
                    }`}>
                      {step.completed ? (
                        <CheckCircle size={16} />
                      ) : (
                        <span className="w-2 h-2 bg-dark-500 rounded-full" />
                      )}
                    </div>
                    <span className={`capitalize ${
                      step.current ? 'font-semibold text-primary-500' : ''
                    }`}>
                      {step.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
            <XCircle size={32} className="mx-auto text-red-500 mb-2" />
            <p className="font-medium text-red-500">Order Cancelled</p>
          </div>
        )}

        {/* Restaurant info */}
        <div className="bg-dark-900 rounded-xl p-4">
          <div className="flex items-center gap-3">
            {order.restaurant.logoUrl && (
              <img
                src={order.restaurant.logoUrl}
                alt={order.restaurant.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
            )}
            <div>
              <h3 className="font-medium">{order.restaurant.name}</h3>
              <p className="text-sm text-dark-400">Restaurant</p>
            </div>
          </div>
        </div>

        {/* Delivery address */}
        <div className="bg-dark-900 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <MapPin size={20} className="text-primary-500 mt-0.5" />
            <div>
              <h3 className="font-medium mb-1">Delivery Address</h3>
              <p className="text-sm text-dark-400">{order.deliveryAddress}</p>
            </div>
          </div>
        </div>

        {/* Order items */}
        <div className="bg-dark-900 rounded-xl p-4">
          <h3 className="font-medium mb-4">Order Items</h3>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    item.isVeg ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span>{item.quantity}x {item.name}</span>
                </div>
                <span className="text-dark-400">${item.subtotal.toFixed(2)}</span>
              </div>
            ))}
          </div>
          
          <div className="border-t border-dark-800 mt-4 pt-4">
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-primary-500">${order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment status */}
        <div className="bg-dark-900 rounded-xl p-4">
          <div className="flex justify-between items-center">
            <span className="text-dark-400">Payment Status</span>
            <span className={`px-2 py-1 rounded text-sm font-medium capitalize ${
              order.paymentStatus === 'paid' 
                ? 'bg-green-500/20 text-green-500'
                : 'bg-yellow-500/20 text-yellow-500'
            }`}>
              {order.paymentStatus}
            </span>
          </div>
        </div>

        {/* Order time */}
        <div className="flex items-center gap-2 text-sm text-dark-400">
          <Clock size={16} />
          <span>
            Ordered on {new Date(order.createdAt).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
      </div>
    </div>
  );
}