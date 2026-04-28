import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Minus, Plus, Trash2, ShoppingBag, Loader2 } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { ordersService } from '../../services/orders.service';
import { usersService } from '../../services/users.service';
import { useEffect } from 'react';

export default function CartDrawer() {
  const navigate = useNavigate();
  const { 
    items, 
    restaurantName, 
    updateQuantity, 
    removeItem, 
    clearCart,
    getOrderPayload 
  } = useCartStore();
  const { 
    closeCartDrawer, 
    openQRPaymentModal, 
    showSuccess, 
    showError 
  } = useUIStore();
  const { isAuthenticated } = useAuthStore();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [newAddress, setNewAddress] = useState('');
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [step, setStep] = useState('cart'); // 'cart' | 'address' | 'confirm'

  const total = items.reduce(
    (sum, item) => sum + item.foodItem.price * item.quantity,
    0
  );

  // Load addresses when moving to address step
  useEffect(() => {
    if (step === 'address' && isAuthenticated) {
      loadAddresses();
    }
  }, [step, isAuthenticated]);

  const loadAddresses = async () => {
    setIsLoadingAddresses(true);
    try {
      const data = await usersService.getAddresses();
      setAddresses(data);
      const defaultAddr = data.find(a => a.isDefault);
      if (defaultAddr) {
        setSelectedAddress(defaultAddr.id);
      }
    } catch (error) {
      showError('Failed to load addresses');
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!isAuthenticated) {
      closeCartDrawer();
      navigate('/login');
      return;
    }

    const deliveryAddress = selectedAddress 
      ? addresses.find(a => a.id === selectedAddress)?.fullAddress
      : newAddress;

    if (!deliveryAddress) {
      showError('Please provide a delivery address');
      return;
    }

    setIsPlacingOrder(true);
    try {
      const orderPayload = getOrderPayload();
      const { order, qrPayload } = await ordersService.createOrder({
        ...orderPayload,
        deliveryAddress
      });

      clearCart();
      closeCartDrawer();
      openQRPaymentModal(order.id, qrPayload);
      showSuccess('Order placed successfully!');
    } catch (error) {
      showError(error.response?.data?.error?.message || 'Failed to place order');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (items.length === 0) {
    return (
      <>
        <div className="modal-backdrop" onClick={closeCartDrawer} />
        <div className="drawer max-h-[60vh] animate-slide-up">
          <div className="drawer-handle" />
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <ShoppingBag size={48} className="text-dark-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
            <p className="text-dark-400 text-sm text-center mb-4">
              Add items from reels to get started
            </p>
            <button
              onClick={closeCartDrawer}
              className="btn-primary"
            >
              Browse Reels
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="modal-backdrop" onClick={closeCartDrawer} />
      <div className="drawer max-h-[85vh] animate-slide-up flex flex-col">
        <div className="drawer-handle" />
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-dark-800">
          <div>
            <h3 className="font-semibold">Your Cart</h3>
            <p className="text-sm text-dark-400">{restaurantName}</p>
          </div>
          <button 
            onClick={closeCartDrawer}
            className="p-1 hover:bg-dark-800 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content based on step */}
        {step === 'cart' && (
          <>
            {/* Cart items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {items.map((item) => (
                <div key={item.foodItem.id} className="flex items-center gap-3">
                  {item.foodItem.imageUrl && (
                    <img
                      src={item.foodItem.imageUrl}
                      alt={item.foodItem.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        item.foodItem.isVeg ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <span className="font-medium">{item.foodItem.name}</span>
                    </div>
                    <p className="text-primary-500 font-semibold">
                      ${item.foodItem.price.toFixed(2)}
                    </p>
                  </div>
                  
                  {/* Quantity controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.foodItem.id, item.quantity - 1)}
                      className="p-1 bg-dark-800 rounded-md hover:bg-dark-700"
                    >
                      {item.quantity === 1 ? <Trash2 size={16} /> : <Minus size={16} />}
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.foodItem.id, item.quantity + 1)}
                      className="p-1 bg-dark-800 rounded-md hover:bg-dark-700"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-dark-800 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-dark-400">Subtotal</span>
                <span className="font-semibold">${total.toFixed(2)}</span>
              </div>
              <button
                onClick={() => setStep('address')}
                className="w-full btn-primary py-3"
              >
                Continue to Address
              </button>
            </div>
          </>
        )}

        {step === 'address' && (
          <>
            {/* Address selection */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <h4 className="font-medium">Delivery Address</h4>
              
              {isLoadingAddresses ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                </div>
              ) : (
                <>
                  {/* Saved addresses */}
                  {addresses.map((address) => (
                    <label
                      key={address.id}
                      className={`block p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedAddress === address.id
                          ? 'border-primary-500 bg-primary-500/10'
                          : 'border-dark-700 hover:border-dark-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        value={address.id}
                        checked={selectedAddress === address.id}
                        onChange={() => {
                          setSelectedAddress(address.id);
                          setNewAddress('');
                        }}
                        className="sr-only"
                      />
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-medium">{address.label || 'Address'}</span>
                          <p className="text-sm text-dark-400 mt-1">{address.fullAddress}</p>
                        </div>
                        {address.isDefault && (
                          <span className="text-xs bg-primary-500/20 text-primary-500 px-2 py-1 rounded">
                            Default
                          </span>
                        )}
                      </div>
                    </label>
                  ))}

                  {/* New address input */}
                  <div className="space-y-2">
                    <label className="text-sm text-dark-400">Or enter a new address</label>
                    <textarea
                      value={newAddress}
                      onChange={(e) => {
                        setNewAddress(e.target.value);
                        setSelectedAddress(null);
                      }}
                      placeholder="Enter your full delivery address..."
                      rows={3}
                      className="input-field resize-none"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-dark-800 space-y-3">
              <button
                onClick={() => setStep('cart')}
                className="w-full btn-secondary py-3"
              >
                Back to Cart
              </button>
              <button
                onClick={() => setStep('confirm')}
                disabled={!selectedAddress && !newAddress}
                className="w-full btn-primary py-3 disabled:opacity-50"
              >
                Review Order
              </button>
            </div>
          </>
        )}

        {step === 'confirm' && (
          <>
            {/* Order summary */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <h4 className="font-medium">Order Summary</h4>
              
              {/* Items */}
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.foodItem.id} className="flex justify-between text-sm">
                    <span>
                      {item.quantity}x {item.foodItem.name}
                    </span>
                    <span>${(item.foodItem.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dark-800 pt-4">
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-primary-500">${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Delivery address */}
              <div className="bg-dark-800 rounded-lg p-4">
                <h5 className="text-sm font-medium mb-2">Delivering to</h5>
                <p className="text-sm text-dark-300">
                  {selectedAddress 
                    ? addresses.find(a => a.id === selectedAddress)?.fullAddress
                    : newAddress
                  }
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-dark-800 space-y-3">
              <button
                onClick={() => setStep('address')}
                className="w-full btn-secondary py-3"
              >
                Change Address
              </button>
              <button
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder}
                className="w-full btn-primary py-3 disabled:opacity-50"
              >
                {isPlacingOrder ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={20} className="animate-spin" />
                    Placing Order...
                  </span>
                ) : (
                  `Place Order • $${total.toFixed(2)}`
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}