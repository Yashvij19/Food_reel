import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Edit2, Trash2, Play, 
  Upload, Loader2, Save, X
} from 'lucide-react';
import { restaurantsService } from '../services/restaurants.service';
import { reelsService } from '../services/reels.service';
import { useUIStore } from '../store/uiStore';

export default function RestaurantManage() {
  const { showSuccess, showError } = useUIStore();

  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [menu, setMenu] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('menu'); // 'menu' | 'reels' | 'settings'

  // Modal states
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showAddReelModal, setShowAddReelModal] = useState(false);
  const [showCreateRestaurantModal, setShowCreateRestaurantModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    loadRestaurants();
  }, []);

  useEffect(() => {
    if (selectedRestaurant) {
      loadMenu();
    }
  }, [selectedRestaurant]);

  const loadRestaurants = async () => {
    try {
      const data = await restaurantsService.getMyRestaurants();
      setRestaurants(data);
      if (data.length > 0) {
        setSelectedRestaurant(data[0]);
      }
    } catch (error) {
      showError('Failed to load restaurants');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMenu = async () => {
    try {
      const data = await restaurantsService.getMenu(selectedRestaurant.id);
      setMenu(data);
    } catch (error) {
      showError('Failed to load menu');
    }
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
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Link to="/profile" className="p-2 hover:bg-dark-800 rounded-full">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-xl font-semibold">Manage Restaurant</h1>
          </div>
          <button
            onClick={() => setShowCreateRestaurantModal(true)}
            className="p-2 bg-primary-500 rounded-lg"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Restaurant selector */}
        {restaurants.length > 0 && (
          <div className="flex gap-2 overflow-x-auto hide-scrollbar px-4 pb-4">
            {restaurants.map((restaurant) => (
              <button
                key={restaurant.id}
                onClick={() => setSelectedRestaurant(restaurant)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedRestaurant?.id === restaurant.id
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
                }`}
              >
                {restaurant.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {restaurants.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-12">
          <Plus size={64} className="text-dark-600 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No restaurants yet</h2>
          <p className="text-dark-400 text-center mb-6">
            Create your first restaurant to start selling
          </p>
          <button 
            onClick={() => setShowCreateRestaurantModal(true)}
            className="btn-primary"
          >
            Create Restaurant
          </button>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex border-b border-dark-800">
            {['menu', 'reels', 'settings'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'text-primary-500 border-b-2 border-primary-500'
                    : 'text-dark-400'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-4">
            {activeTab === 'menu' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="font-semibold">Menu Items</h2>
                  <button
                    onClick={() => {
                      setEditingItem(null);
                      setShowAddItemModal(true);
                    }}
                    className="flex items-center gap-2 text-sm text-primary-500"
                  >
                    <Plus size={18} />
                    Add Item
                  </button>
                </div>

                {menu?.items?.length === 0 ? (
                  <div className="text-center py-8 text-dark-400">
                    <p>No menu items yet</p>
                    <p className="text-sm">Add your first item to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {menu?.items?.map((item) => (
                      <div 
                        key={item.id}
                        className="bg-dark-900 rounded-xl p-4 flex items-center gap-4"
                      >
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${
                              item.isVeg ? 'bg-green-500' : 'bg-red-500'
                            }`} />
                            <span className="font-medium">{item.name}</span>
                            {!item.isAvailable && (
                              <span className="text-xs bg-red-500/20 text-red-500 px-2 py-0.5 rounded">
                                Unavailable
                              </span>
                            )}
                          </div>
                          <p className="text-primary-500 font-semibold">
                            ${item.price.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setShowAddItemModal(true);
                            }}
                            className="p-2 bg-dark-800 rounded-lg hover:bg-dark-700"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm('Delete this item?')) {
                                await restaurantsService.deleteMenuItem(
                                  selectedRestaurant.id,
                                  item.id
                                );
                                loadMenu();
                                showSuccess('Item deleted');
                              }
                            }}
                            className="p-2 bg-dark-800 rounded-lg hover:bg-red-500/20 text-red-500"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reels' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="font-semibold">Your Reels</h2>
                  <button
                    onClick={() => setShowAddReelModal(true)}
                    className="flex items-center gap-2 text-sm text-primary-500"
                  >
                    <Upload size={18} />
                    Upload Reel
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {selectedRestaurant?.recentReels?.map((reel) => (
                    <Link
                      key={reel.id}
                      to={`/reel/${reel.id}`}
                      className="aspect-[9/16] rounded-lg overflow-hidden relative"
                    >
                      {reel.thumbnailUrl ? (
                        <img
                          src={reel.thumbnailUrl}
                          alt={reel.caption}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-dark-800 flex items-center justify-center">
                          <Play size={24} className="text-dark-500" />
                        </div>
                      )}
                    </Link>
                  )) || (
                    <div className="col-span-3 text-center py-8 text-dark-400">
                      <p>No reels yet</p>
                      <p className="text-sm">Upload your first reel</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="bg-dark-900 rounded-xl p-4">
                  <h3 className="font-medium mb-4">Restaurant Details</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-dark-400">Name</span>
                      <span>{selectedRestaurant?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-400">Category</span>
                      <span className="capitalize">{selectedRestaurant?.category?.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-400">Address</span>
                      <span className="text-right max-w-[200px]">{selectedRestaurant?.address}</span>
                    </div>
                  </div>
                </div>

                <button className="w-full btn-secondary">
                  Edit Restaurant Details
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Add/Edit Item Modal */}
      {showAddItemModal && (
        <MenuItemModal
          restaurantId={selectedRestaurant?.id}
          item={editingItem}
          onClose={() => {
            setShowAddItemModal(false);
            setEditingItem(null);
          }}
          onSave={() => {
            loadMenu();
            setShowAddItemModal(false);
            setEditingItem(null);
          }}
        />
      )}

      {/* Add Reel Modal */}
      {showAddReelModal && (
        <ReelModal
          restaurantId={selectedRestaurant?.id}
          menuItems={menu?.items || []}
          onClose={() => setShowAddReelModal(false)}
          onSave={() => {
            loadRestaurants();
            setShowAddReelModal(false);
          }}
        />
      )}

      {/* Create Restaurant Modal */}
      {showCreateRestaurantModal && (
        <CreateRestaurantModal
          onClose={() => setShowCreateRestaurantModal(false)}
          onSave={() => {
            loadRestaurants();
            setShowCreateRestaurantModal(false);
          }}
        />
      )}
    </div>
  );
}

// Menu Item Modal Component
function MenuItemModal({ restaurantId, item, onClose, onSave }) {
  const { showSuccess, showError } = useUIStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: item?.name || '',
    description: item?.description || '',
    price: item?.price?.toString() || '',
    category: item?.category || '',
    isVeg: item?.isVeg || false,
    imageUrl: item?.imageUrl || '',
    isAvailable: item?.isAvailable ?? true
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = {
        ...formData,
        price: parseFloat(formData.price)
      };

      if (item) {
        await restaurantsService.updateMenuItem(restaurantId, item.id, data);
        showSuccess('Item updated');
      } else {
        await restaurantsService.addMenuItem(restaurantId, data);
        showSuccess('Item added');
      }
      onSave();
    } catch (error) {
      showError('Failed to save item');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-dark-900 rounded-2xl z-50 max-w-md mx-auto max-h-[80vh] overflow-y-auto animate-scale-in">
        <div className="flex items-center justify-between p-4 border-b border-dark-800">
          <h3 className="font-semibold">{item ? 'Edit Item' : 'Add Item'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-dark-800 rounded-full">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="input-field resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Starters"
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Image URL</label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="https://..."
              className="input-field"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isVeg}
                onChange={(e) => setFormData({ ...formData, isVeg: e.target.checked })}
                className="w-4 h-4 rounded bg-dark-800 border-dark-700"
              />
              <span className="text-sm">Vegetarian</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isAvailable}
                onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                className="w-4 h-4 rounded bg-dark-800 border-dark-700"
              />
              <span className="text-sm">Available</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary py-3 flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
            {item ? 'Update Item' : 'Add Item'}
          </button>
        </form>
      </div>
    </>
  );
}

// Reel Modal Component
function ReelModal({ restaurantId, menuItems, onClose, onSave }) {
  const { showSuccess, showError } = useUIStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    videoUrl: '',
    thumbnailUrl: '',
    caption: '',
    foodItemId: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await reelsService.createReel({
        restaurantId,
        ...formData,
        foodItemId: formData.foodItemId || null
      });
      showSuccess('Reel uploaded!');
      onSave();
    } catch (error) {
      showError('Failed to upload reel');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-dark-900 rounded-2xl z-50 max-w-md mx-auto animate-scale-in">
        <div className="flex items-center justify-between p-4 border-b border-dark-800">
          <h3 className="font-semibold">Upload Reel</h3>
          <button onClick={onClose} className="p-1 hover:bg-dark-800 rounded-full">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Video URL</label>
            <input
              type="url"
              value={formData.videoUrl}
              onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
              required
              placeholder="https://..."
              className="input-field"
            />
            <p className="text-xs text-dark-500 mt-1">
              Enter a direct link to your video file
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Thumbnail URL</label>
            <input
              type="url"
              value={formData.thumbnailUrl}
              onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
              placeholder="https://..."
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Caption</label>
            <textarea
              value={formData.caption}
              onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
              rows={2}
              maxLength={500}
              placeholder="Describe your food..."
              className="input-field resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Link to Menu Item (Optional)</label>
            <select
              value={formData.foodItemId}
              onChange={(e) => setFormData({ ...formData, foodItemId: e.target.value })}
              className="input-field"
            >
              <option value="">None</option>
              {menuItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} - ${item.price.toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary py-3 flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
            Upload Reel
          </button>
        </form>
      </div>
    </>
  );
}

// Create Restaurant Modal
function CreateRestaurantModal({ onClose, onSave }) {
  const { showSuccess, showError } = useUIStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    category: 'other'
  });

  const categories = [
    'indian', 'chinese', 'italian', 'mexican', 'japanese',
    'thai', 'american', 'fast_food', 'cafe', 'bakery',
    'desserts', 'beverages', 'healthy', 'other'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await restaurantsService.createRestaurant(formData);
      showSuccess('Restaurant created!');
      onSave();
    } catch (error) {
      showError('Failed to create restaurant');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-dark-900 rounded-2xl z-50 max-w-md mx-auto max-h-[80vh] overflow-y-auto animate-scale-in">
        <div className="flex items-center justify-between p-4 border-b border-dark-800">
          <h3 className="font-semibold">Create Restaurant</h3>
          <button onClick={onClose} className="p-1 hover:bg-dark-800 rounded-full">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Restaurant Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="input-field resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">City</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="input-field"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace('_', ' ').charAt(0).toUpperCase() + cat.replace('_', ' ').slice(1)}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary py-3 flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
            Create Restaurant
          </button>
        </form>
      </div>
    </>
  );
}