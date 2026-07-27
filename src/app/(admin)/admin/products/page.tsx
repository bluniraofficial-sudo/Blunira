'use client';

import { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  Box, 
  Layers, 
  Upload,
  FileImage,
  ImageIcon
} from 'lucide-react';
import Swal from 'sweetalert2';

interface Product {
  id: string;
  name: string;
  description: string;
  capacity: string;
  moq: number;
  bottlesPerPack: number;
  pricePerPack?: number;
  imageUrl?: string;
  status: string;
  createdAt: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    capacity: '',
    moq: 0,
    bottlesPerPack: 12,
    pricePerPack: 0,
    imageUrl: '',
    status: 'ACTIVE',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setFormData({
      id: product.id,
      name: product.name,
      description: product.description,
      capacity: product.capacity,
      moq: product.moq,
      bottlesPerPack: product.bottlesPerPack,
      pricePerPack: product.pricePerPack ? Number(product.pricePerPack) : 0,
      imageUrl: product.imageUrl || '',
      status: product.status,
    });
    setImagePreview(product.imageUrl || '/blunira-bottle-light.png');
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDelete = async (product: Product) => {
    const result = await Swal.fire({
      title: 'Delete Product?',
      html: `Are you sure you want to delete <strong>${product.name}</strong>?<br><br>This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/products/${product.id}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to delete product');
        }

        Swal.fire('Deleted!', 'Product has been deleted.', 'success');
        fetchProducts();
      } catch (error: any) {
        Swal.fire('Error', error.message, 'error');
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      Swal.fire('Error', 'Please select a valid image file', 'error');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire('Error', 'Image size should be less than 5MB', 'error');
      return;
    }

    setUploadingImage(true);

    try {
      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);

      // Upload to Vercel Blob
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('folder', 'products');

      const res = await fetch('/api/upload', {
        method: 'POST',
        credentials: 'include',
        body: uploadFormData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload image');
      }

      setFormData({ ...formData, imageUrl: data.url });
      Swal.fire({
        icon: 'success',
        title: 'Image Uploaded',
        text: 'Product image uploaded successfully',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error: any) {
      Swal.fire('Error', error.message, 'error');
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.imageUrl) {
      Swal.fire({
        icon: 'warning',
        title: 'Image Required',
        text: 'Please upload a product image',
      });
      return;
    }

    try {
      const url = editingProduct ? `/api/products/${formData.id}` : '/api/products';
      const method = editingProduct ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Failed to ${editingProduct ? 'update' : 'create'} product`);
      }

      Swal.fire('Success', `Product ${editingProduct ? 'updated' : 'created'} successfully`, 'success');
      fetchProducts();
      setShowForm(false);
      resetForm();
    } catch (error: any) {
      Swal.fire('Error', error.message, 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      description: '',
      capacity: '',
      moq: 0,
      bottlesPerPack: 12,
      pricePerPack: 0,
      imageUrl: '',
      status: 'ACTIVE',
    });
    setImagePreview(null);
    setEditingProduct(null);
  };

  const getPackInfo = (quantity: number, bottlesPerPack: number) => {
    const packs = Math.floor(quantity / bottlesPerPack);
    const remaining = quantity % bottlesPerPack;
    return { packs, remaining, total: quantity };
  };

  const getProductPacks = (product: Product) => {
    return getPackInfo(product.moq * product.bottlesPerPack, product.bottlesPerPack);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)]">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-[var(--text-primary)] mb-2">Product Management</h1>
            <p className="text-[var(--text-secondary)]">Manage water bottle products and pricing</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold hover:scale-105 transition-all shadow-lg shadow-cyan-500/20"
          >
            <Plus className="w-5 h-5 inline mr-2" />
            Add Product
          </button>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product, index) => {
            const productPacks = getProductPacks(product);
            return (
              <div
                key={product.id}
                className="group relative bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:border-cyan-400/40 transition-all duration-500 hover:shadow-[0_20px_60px_rgba(0,255,255,0.12)] hover:-translate-y-2 backdrop-blur-xl"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                {/* Product Image */}
                <div className="relative w-full h-56 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 overflow-hidden">
                  <img
                    src={product.imageUrl || '/blunira-bottle-light.png'}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/blunira-bottle-light.png';
                    }}
                  />
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md border ${
                        product.status === 'ACTIVE'
                          ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-500 border-rose-500/30'
                      }`}
                    >
                      {product.status}
                    </span>
                  </div>
                  {/* Pack Badge */}
                  <div className="absolute bottom-3 left-3">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-500 border border-cyan-500/30 backdrop-blur-md">
                      📦 {productPacks.packs} pack{productPacks.packs !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Product Details */}
                <div className="relative p-5 space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1 line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  {/* Specs Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <div className="flex items-center gap-2 mb-1">
                        <Box className="w-3.5 h-3.5 text-cyan-500" />
                        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Capacity</p>
                      </div>
                      <p className="text-sm font-bold text-[var(--text-primary)]">{product.capacity}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <div className="flex items-center gap-2 mb-1">
                        <Layers className="w-3.5 h-3.5 text-indigo-500" />
                        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">MOQ</p>
                      </div>
                      <p className="text-sm font-bold text-[var(--text-primary)]">{product.moq.toLocaleString()} packs</p>
                      <p className="text-[10px] text-[var(--text-muted)]">
                        {productPacks.packs * product.bottlesPerPack + productPacks.remaining} bottles total
                      </p>
                    </div>
                  </div>

                  {/* Price Section */}
                  <div className="relative bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl p-4 border border-cyan-500/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Price per Pack ({product.bottlesPerPack})</p>
                        <p className="text-2xl font-black text-cyan-500">₹{Number(product.pricePerPack || 0).toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Per Bottle</p>
                        <p className="text-lg font-bold text-[var(--text-primary)]">
                          ₹{(Number(product.pricePerPack || 0) / product.bottlesPerPack).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-3 border-t border-white/10">
                    <button
                      onClick={() => handleEdit(product)}
                      className="flex-1 py-2.5 bg-blue-500/10 text-blue-500 rounded-xl text-sm font-bold hover:bg-blue-500/20 transition-all flex items-center justify-center gap-2 border border-blue-500/10"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product)}
                      className="flex-1 py-2.5 bg-rose-500/10 text-rose-500 rounded-xl text-sm font-bold hover:bg-rose-500/20 transition-all flex items-center justify-center gap-2 border border-rose-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {products.length === 0 && (
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-16 text-center">
            <Package className="w-20 h-20 text-[var(--text-muted)] mx-auto mb-4 opacity-50" />
            <p className="text-[var(--text-secondary)] text-lg">No products found</p>
            <p className="text-[var(--text-muted)] text-sm mt-2">Add your first product to get started</p>
          </div>
        )}
      </div>

      {/* Add/Edit Product Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="relative bg-[#12141c] border border-white/5 rounded-[2rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-purple-500/10 pointer-events-none" />
            <div className="sticky top-0 bg-white/5 border-b border-white/10 p-6 flex items-center justify-between backdrop-blur-xl z-10">
              <div>
                <h2 className="text-2xl font-black text-[var(--text-primary)]">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  {editingProduct ? 'Update product details and pricing' : 'Create a new premium product listing'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-all"
              >
                <X className="w-5 h-5 text-[var(--text-muted)]" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="relative p-6 space-y-6">
              {/* Product Image Upload */}
              <div>
                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">
                  Product Image *
                </label>
                <div className="flex gap-4 items-start">
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className={`flex items-center justify-center gap-2 w-full px-4 py-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                        uploadingImage
                          ? 'border-cyan-500/50 bg-cyan-500/5'
                          : 'border-white/10 hover:border-cyan-500/30 bg-white/5'
                      }`}
                    >
                      {uploadingImage ? (
                        <>
                          <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                          <span className="text-sm text-cyan-500">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-[var(--text-muted)]" />
                          <div>
                            <p className="text-sm font-bold text-[var(--text-primary)]">
                              Click to upload image
                            </p>
                            <p className="text-xs text-[var(--text-muted)]">
                              PNG, JPG up to 5MB
                            </p>
                          </div>
                        </>
                      )}
                    </label>
                  </div>
                  {(imagePreview || formData.imageUrl) && (
                    <div className="w-32 h-32 rounded-2xl overflow-hidden border border-white/10 flex-shrink-0 shadow-lg">
                      <img
                        src={imagePreview || formData.imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
                {!formData.imageUrl && !imagePreview && (
                  <p className="text-xs text-amber-500 mt-2">
                    Please upload an image. Default will be used if not provided.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[var(--text-primary)] focus:border-cyan-500 focus:outline-none transition-all"
                    placeholder="Blunira Premium 500ml"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">
                    Capacity *
                  </label>
                  <input
                    type="text"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[var(--text-primary)] focus:border-cyan-500 focus:outline-none transition-all"
                    placeholder="500ml"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[var(--text-primary)] focus:border-cyan-500 focus:outline-none resize-none transition-all"
                  placeholder="Premium spring water in 500ml bottles with QR-enabled labels"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">
                    MOQ (Minimum Packets) *
                  </label>
                  <input
                    type="number"
                    value={formData.moq}
                    onChange={(e) => setFormData({ ...formData, moq: parseInt(e.target.value) || 0 })}
                    required
                    min="1"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[var(--text-primary)] focus:border-cyan-500 focus:outline-none transition-all"
                    placeholder="50"
                  />
                  {/* Packet Info */}
                  {formData.moq > 0 && (
                    <div className="mt-3 p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl backdrop-blur-md">
                      <div className="flex items-center gap-2 mb-2">
                        <Box className="w-4 h-4 text-cyan-500" />
                        <p className="text-xs font-bold text-cyan-500 uppercase tracking-wider">Order Summary</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-[var(--text-muted)]">MOQ</p>
                          <p className="text-lg font-black text-[var(--text-primary)]">{formData.moq} pack{formData.moq === 1 ? '' : 's'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-[var(--text-muted)]">Total Bottles</p>
                          <p className="text-lg font-black text-cyan-500">{(formData.moq * formData.bottlesPerPack).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">
                    Bottles per Packet *
                  </label>
                  <input
                    type="number"
                    value={formData.bottlesPerPack}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1;
                      setFormData({ ...formData, bottlesPerPack: value });
                    }}
                    required
                    min="1"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[var(--text-primary)] focus:border-cyan-500 focus:outline-none transition-all"
                    placeholder="12"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">
                  Price per Packet (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.pricePerPack}
                  onChange={(e) => setFormData({ ...formData, pricePerPack: parseFloat(e.target.value) || 0 })}
                  required
                  min="0"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[var(--text-primary)] focus:border-cyan-500 focus:outline-none transition-all"
                  placeholder="150.00"
                />
                {formData.pricePerPack > 0 && (
                  <div className="mt-3 p-3 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl">
                    <p className="text-xs text-[var(--text-muted)] mb-1">Pricing Summary</p>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs text-[var(--text-muted)]">Per Pack</p>
                        <p className="text-sm font-bold text-[var(--text-primary)]">₹{Number(formData.pricePerPack).toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-[var(--text-muted)]">Per Bottle</p>
                        <p className="text-sm font-black text-emerald-500">
                          ₹{(Number(formData.pricePerPack) / formData.bottlesPerPack).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">
                  Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[var(--text-primary)] focus:border-cyan-500 focus:outline-none transition-all"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={uploadingImage}
                  className="flex-1 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold hover:scale-[1.02] transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10"
                >
                  <Save className="w-4 h-4 inline mr-2" />
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="px-6 py-3.5 bg-white/5 border border-white/10 text-[var(--text-secondary)] rounded-xl font-bold hover:border-cyan-500/30 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
