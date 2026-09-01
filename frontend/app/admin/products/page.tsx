'use client';

import { AdminProtectedLayout } from '@/components/admin-protected-layout';
import { getAdminToken } from '@/lib/admin-auth';
import { useEffect, useState } from 'react';
import { Trash2, Edit2, X, Check } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

type ProductType = 'rental' | 'sale';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: ProductType;
  category: string | null;
  base_price: number;
  images: string[];
  personalization_label: string | null;
  active: boolean;
}

interface ProductForm {
  name: string;
  base_price: number;
  description: string;
  category: string;
  type: ProductType;
  image: string;
  personalization_label: string;
  active: boolean;
}

const emptyForm: ProductForm = {
  name: '',
  base_price: 0,
  description: '',
  category: '',
  type: 'rental',
  image: '',
  personalization_label: '',
  active: true,
};

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<ProductForm | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState<ProductForm>(emptyForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploadingFor, setUploadingFor] = useState<'new' | 'edit' | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const authHeaders = () => {
    const token = getAdminToken();
    return token ? { Authorization: `Bearer ${token}` } : null;
  };

  /** Pulls the backend's own error message out of a failed response instead
   * of always showing a generic "Failed to X" string. */
  const describeError = async (res: Response, fallback: string) => {
    try {
      const body = await res.json();
      return body.error || fallback;
    } catch {
      return fallback;
    }
  };

  const fetchProducts = async () => {
    try {
      const headers = authHeaders();
      if (!headers) return;

      const response = await fetch(`${API_BASE}/admin/products`, { headers });

      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      } else {
        setError(await describeError(response, 'Failed to load products'));
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError('Could not reach the server. Check your connection and try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  const toProductPayload = (form: ProductForm) => ({
    name: form.name,
    base_price: Number(form.base_price) || 0,
    description: form.description || null,
    category: form.category || null,
    type: form.type,
    images: form.image ? [form.image] : [],
    personalization_label: form.personalization_label || null,
    active: form.active,
  });

  const uploadImage = async (file: File): Promise<string | null> => {
    const headers = authHeaders();
    if (!headers) return null;

    const body = new FormData();
    body.append('image', file);

    try {
      const response = await fetch(`${API_BASE}/admin/products/upload-image`, {
        method: 'POST',
        headers, // no Content-Type - the browser sets the multipart boundary itself
        body,
      });
      if (response.ok) {
        return (await response.json()).url as string;
      }
      setError(await describeError(response, 'Failed to upload image'));
      return null;
    } catch (err) {
      setError('Could not reach the server while uploading the image.');
      return null;
    }
  };

  const handleNewProductImage = async (file: File) => {
    setError('');
    setUploadingFor('new');
    const url = await uploadImage(file);
    setUploadingFor(null);
    if (url) setNewProduct((prev) => ({ ...prev, image: url }));
  };

  const handleEditImage = async (file: File) => {
    setError('');
    setUploadingFor('edit');
    const url = await uploadImage(file);
    setUploadingFor(null);
    if (url) setEditData((prev) => (prev ? { ...prev, image: url } : prev));
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setEditData({
      name: product.name,
      base_price: product.base_price,
      description: product.description || '',
      category: product.category || '',
      type: product.type,
      image: product.images?.[0] || '',
      personalization_label: product.personalization_label || '',
      active: product.active,
    });
  };

  const handleSaveEdit = async () => {
    if (!editData || !editingId) return;
    setError('');
    setSaving(true);

    try {
      const headers = authHeaders();
      if (!headers) return;

      const response = await fetch(`${API_BASE}/admin/products/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(toProductPayload(editData)),
      });

      if (response.ok) {
        setSuccess('Product updated successfully');
        setEditingId(null);
        setEditData(null);
        fetchProducts();
      } else {
        setError(await describeError(response, 'Failed to update product'));
      }
    } catch (err) {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This can't be undone - it will disappear from the site immediately.`)) return;
    setError('');
    setDeletingId(id);

    try {
      const headers = authHeaders();
      if (!headers) return;

      const response = await fetch(`${API_BASE}/admin/products/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (response.ok) {
        setSuccess('Product deleted successfully');
        fetchProducts();
      } else {
        setError(await describeError(response, 'Failed to delete product'));
      }
    } catch (err) {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newProduct.name || !newProduct.base_price) {
      setError('Name and price are required');
      return;
    }

    setSaving(true);
    try {
      const headers = authHeaders();
      if (!headers) return;

      const response = await fetch(`${API_BASE}/admin/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(toProductPayload(newProduct)),
      });

      if (response.ok) {
        setSuccess('Product added successfully');
        setNewProduct(emptyForm);
        setShowAddForm(false);
        fetchProducts();
      } else {
        setError(await describeError(response, 'Failed to add product'));
      }
    } catch (err) {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminProtectedLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Products</h1>
          <p className="text-slate-600 mt-2">Manage your product inventory and listings</p>
        </div>

        {error && (
          <div className="p-4 rounded bg-red-50 border border-red-200 text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 rounded bg-green-50 border border-green-200 text-green-700">
            {success}
          </div>
        )}

        {showAddForm && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Add New Product</h2>
              <button onClick={() => setShowAddForm(false)} className="text-slate-500 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Product name"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="number"
                step="0.01"
                placeholder="Price"
                value={newProduct.base_price}
                onChange={(e) => setNewProduct({ ...newProduct, base_price: parseFloat(e.target.value) || 0 })}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <select
                value={newProduct.type}
                onChange={(e) => setNewProduct({ ...newProduct, type: e.target.value as ProductType })}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="rental">Rental</option>
                <option value="sale">Shop item (for sale)</option>
              </select>
              <input
                type="text"
                placeholder="Category"
                value={newProduct.category}
                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex items-center gap-3">
                {newProduct.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={newProduct.image} alt="" className="w-12 h-12 object-cover rounded border border-slate-200" />
                )}
                <label className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 cursor-pointer hover:bg-slate-50 text-center">
                  {uploadingFor === 'new' ? 'Uploading...' : newProduct.image ? 'Change image' : 'Upload image'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    disabled={uploadingFor === 'new'}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleNewProductImage(file);
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
              <input
                type="text"
                placeholder="Personalization label (shop items only, optional)"
                value={newProduct.personalization_label}
                onChange={(e) => setNewProduct({ ...newProduct, personalization_label: e.target.value })}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                placeholder="Description"
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                className="col-span-2 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <label className="col-span-2 flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={newProduct.active}
                  onChange={(e) => setNewProduct({ ...newProduct, active: e.target.checked })}
                />
                Active (visible on the site)
              </label>
              <button
                type="submit"
                disabled={saving || uploadingFor === 'new'}
                className="col-span-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-60"
              >
                {saving ? 'Adding...' : 'Add Product'}
              </button>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-slate-900">All Products ({products.length})</h2>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                {showAddForm ? 'Cancel' : 'Add Product'}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="px-6 py-8 text-center">
              <p className="text-slate-500">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-slate-500">No products yet. Add your first product to get started!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Image</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Type</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Price</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Category</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Active</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50">
                      {editingId === product.id ? (
                        <>
                          <td className="px-6 py-4">
                            <div className="flex flex-col items-start gap-1">
                              {editData?.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={editData.image} alt="" className="w-12 h-12 object-cover rounded border border-slate-200" />
                              ) : (
                                <div className="w-12 h-12 rounded border border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400">None</div>
                              )}
                              <label className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer">
                                {uploadingFor === 'edit' ? 'Uploading...' : 'Change'}
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp,image/gif"
                                  className="hidden"
                                  disabled={uploadingFor === 'edit'}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleEditImage(file);
                                    e.target.value = '';
                                  }}
                                />
                              </label>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={editData?.name || ''}
                              onChange={(e) => setEditData({ ...editData!, name: e.target.value })}
                              className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={editData?.type}
                              onChange={(e) => setEditData({ ...editData!, type: e.target.value as ProductType })}
                              className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                            >
                              <option value="rental">Rental</option>
                              <option value="sale">Shop</option>
                            </select>
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="number"
                              step="0.01"
                              value={editData?.base_price ?? 0}
                              onChange={(e) => setEditData({ ...editData!, base_price: parseFloat(e.target.value) || 0 })}
                              className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={editData?.category || ''}
                              onChange={(e) => setEditData({ ...editData!, category: e.target.value })}
                              className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={editData?.active ?? true}
                              onChange={(e) => setEditData({ ...editData!, active: e.target.checked })}
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={handleSaveEdit}
                                disabled={saving || uploadingFor === 'edit'}
                                className="text-green-600 hover:text-green-800 disabled:opacity-50"
                                title="Save"
                              >
                                <Check size={18} />
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                disabled={saving}
                                className="text-slate-600 hover:text-slate-800 disabled:opacity-50"
                                title="Cancel"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4">
                            {product.images?.[0] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={product.images[0]} alt="" className="w-12 h-12 object-cover rounded border border-slate-200" />
                            ) : (
                              <div className="w-12 h-12 rounded border border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400">None</div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-900">{product.name}</td>
                          <td className="px-6 py-4 text-sm text-slate-600 capitalize">{product.type}</td>
                          <td className="px-6 py-4 text-sm text-slate-900">${Number(product.base_price).toFixed(2)}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{product.category || '-'}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${product.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                              {product.active ? 'Active' : 'Hidden'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-3">
                              <button
                                onClick={() => handleEdit(product)}
                                disabled={deletingId === product.id}
                                className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                                title="Edit"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button
                                onClick={() => handleDelete(product.id, product.name)}
                                disabled={deletingId === product.id}
                                className="text-red-600 hover:text-red-800 disabled:opacity-50"
                                title="Delete"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminProtectedLayout>
  );
}
