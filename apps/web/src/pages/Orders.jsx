import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, ChevronRight, Loader2 } from 'lucide-react';
import { ordersService } from '../services/orders.service';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async (pageNum = 1) => {
    try {
      const { orders: data, meta } = await ordersService.getOrderHistory({ page: pageNum });
      if (pageNum === 1) {
        setOrders(data);
      } else {
        setOrders([...orders, ...data]);
      }
      setHasMore(meta.page < meta.totalPages);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-500/20 text-yellow-500',
      confirmed: 'bg-blue-500/20 text-blue-500',
      preparing: 'bg-orange-500/20 text-orange-500',
      ready: 'bg-purple-500/20 text-purple-500',
      delivered: 'bg-green-500/20 text-green-500',
      cancelled: 'bg-red-500/20 text-red-500'
    };
    return colors[status] || 'bg-dark-700 text-dark-400';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-dark-950/95 backdrop-blur-lg border-b border-dark-800 z-10">
        <div className="flex items-center gap-4 p-4">
          <Link to="/profile" className="p-2 hover:bg-dark-800 rounded-full">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-semibold">Order History</h1>
        </div>
      </div>

      {/* Orders list */}
      <div className="p-4 space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag size={48} className="mx-auto text-dark-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
            <p className="text-dark-400 mb-4">Your order history will appear here</p>
            <Link to="/feed" className="btn-primary">
              Browse Food Reels
            </Link>
          </div>
        ) : (
          orders.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="block bg-dark-900 rounded-xl p-4 hover:bg-dark-800 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {order.restaurant.logoUrl ? (
                    <img
                      src={order.restaurant.logoUrl}
                      alt={order.restaurant.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-dark-700 rounded-lg flex items-center justify-center">
                      <ShoppingBag size={20} className="text-dark-400" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium">{order.restaurant.name}</h3>
                    <p className="text-sm text-dark-400">{formatDate(order.createdAt)}</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-dark-500" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-dark-400">
                    {order.itemCount} item{order.itemCount > 1 ? 's' : ''} • ${order.totalAmount.toFixed(2)}
                  </p>
                  <p className="text-xs text-dark-500 truncate max-w-[200px]">
                    {order.itemsSummary}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
            </Link>
          ))
        )}

        {/* Load more */}
        {hasMore && (
          <button
            onClick={() => loadOrders(page + 1)}
            className="w-full py-3 text-primary-500 hover:bg-dark-900 rounded-lg"
          >
            Load More
          </button>
        )}
      </div>
    </div>
  );
}