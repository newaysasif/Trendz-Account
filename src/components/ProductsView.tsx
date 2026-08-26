import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Plus,
  Printer,
  Search,
  Eye,
  Edit2,
  Trash2,
  ArrowUpDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Package,
  Layers,
  Barcode,
  Building,
} from 'lucide-react';
import { Product, StockMovement, Vendor } from '../types';

interface ProductsViewProps {
  products: Product[];
  stockMovements: StockMovement[];
  vendors: Vendor[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (id: number, product: Partial<Product>) => void;
  onDeleteProduct: (id: number) => void;
  onAdjustStock: (productId: number, quantity: number, notes: string) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  stockMovements,
  vendors,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onAdjustStock,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustNotes, setAdjustNotes] = useState<string>('');

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    unit: 'pcs',
    purchase_price: '0',
    sale_price: '0',
    current_stock: '0',
    min_stock_level: '0',
    max_stock_level: '0',
    reorder_level: '0',
    location: '',
    supplier_id: '',
    barcode: '',
  });

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchTerm))
    );
  }, [products, searchTerm]);

  // Statistics
  const totalProducts = products.length;
  const totalUnits = useMemo(
    () => products.reduce((sum, p) => sum + p.current_stock, 0),
    [products]
  );
  const lowStockItems = useMemo(
    () =>
      products.filter(
        (p) => p.current_stock > 0 && p.current_stock <= p.reorder_level
      ),
    [products]
  );
  const outOfStockItems = useMemo(
    () => products.filter((p) => p.current_stock <= 0),
    [products]
  );

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      category: '',
      description: '',
      unit: 'pcs',
      purchase_price: '0',
      sale_price: '0',
      current_stock: '0',
      min_stock_level: '5',
      max_stock_level: '100',
      reorder_level: '10',
      location: '',
      supplier_id: vendors[0]?.id.toString() || '',
      barcode: '',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      category: p.category,
      description: p.description,
      unit: p.unit,
      purchase_price: p.purchase_price.toString(),
      sale_price: p.sale_price.toString(),
      current_stock: p.current_stock.toString(),
      min_stock_level: p.min_stock_level.toString(),
      max_stock_level: p.max_stock_level.toString(),
      reorder_level: p.reorder_level.toString(),
      location: p.location,
      supplier_id: p.supplier_id ? p.supplier_id.toString() : '',
      barcode: p.barcode,
    });
  };

  const handleOpenAdjust = (p: Product) => {
    setAdjustingProduct(p);
    setAdjustQty(0);
    setAdjustNotes('');
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Product name is required');
      return;
    }

    const supplierIdNum = formData.supplier_id
      ? parseInt(formData.supplier_id, 10)
      : null;
    const matchedVendor = vendors.find((v) => v.id === supplierIdNum);

    const payload = {
      name: formData.name.trim(),
      category: formData.category.trim() || 'General',
      description: formData.description.trim(),
      unit: formData.unit.trim() || 'pcs',
      purchase_price: parseFloat(formData.purchase_price) || 0,
      sale_price: parseFloat(formData.sale_price) || 0,
      current_stock: parseFloat(formData.current_stock) || 0,
      min_stock_level: parseFloat(formData.min_stock_level) || 0,
      max_stock_level: parseFloat(formData.max_stock_level) || 0,
      reorder_level: parseFloat(formData.reorder_level) || 0,
      location: formData.location.trim(),
      supplier_id: supplierIdNum,
      supplier_name: matchedVendor ? matchedVendor.company_name : undefined,
      barcode: formData.barcode.trim(),
      last_updated: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };

    if (editingProduct) {
      onUpdateProduct(editingProduct.id, payload);
      setEditingProduct(null);
    } else {
      onAddProduct({
        ...payload,
        created_date: new Date().toISOString().replace('T', ' ').slice(0, 19),
      });
      setIsAddModalOpen(false);
    }
  };

  const handleApplyAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct || adjustQty === 0) {
      alert('Please specify a non-zero adjustment quantity');
      return;
    }

    onAdjustStock(adjustingProduct.id, adjustQty, adjustNotes);
    setAdjustingProduct(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <Boxes className="w-7 h-7 text-indigo-600" />
            <span>Stock & Inventory Management</span>
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time warehouse stock, reorder levels, automatic deduction on invoices, and movement logs
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 no-print">
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-semibold text-sm shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white px-3.5 py-2.5 rounded-lg font-semibold text-sm shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Stock Report</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards with exact gradients from user template */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className="rounded-xl p-5 text-white shadow-sm transition-transform hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-100">
              Total Products
            </span>
            <Boxes className="w-6 h-6 opacity-60" />
          </div>
          <div className="text-2xl font-bold mt-2">{totalProducts}</div>
          <div className="text-xs text-purple-200 mt-1 font-medium">Catalog items</div>
        </div>

        <div
          className="rounded-xl p-5 text-white shadow-sm transition-transform hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-100">
              Total Units in Stock
            </span>
            <Package className="w-6 h-6 opacity-60" />
          </div>
          <div className="text-2xl font-bold mt-2">{totalUnits}</div>
          <div className="text-xs text-emerald-100 mt-1 font-medium">
            Across all warehouses
          </div>
        </div>

        <div
          className="rounded-xl p-5 text-white shadow-sm transition-transform hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-100">
              Low Stock Items
            </span>
            <AlertTriangle className="w-6 h-6 opacity-60" />
          </div>
          <div className="text-2xl font-bold mt-2">{lowStockItems.length}</div>
          <div className="text-xs text-rose-200 mt-1 font-medium">Needs replenishment</div>
        </div>

        <div
          className="rounded-xl p-5 text-white shadow-sm transition-transform hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-950">
              Out of Stock
            </span>
            <XCircle className="w-6 h-6 opacity-60 text-amber-950" />
          </div>
          <div className="text-2xl font-bold mt-2 text-slate-900">
            {outOfStockItems.length}
          </div>
          <div className="text-xs text-amber-950 mt-1 font-medium">Zero quantity</div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between no-print">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search products by title, category, location, barcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <span className="text-xs text-slate-500 font-semibold">
          {filteredProducts.length} Items Listed
        </span>
      </div>

      {/* Product List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100/80 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                <th className="py-3.5 px-4">#</th>
                <th className="py-3.5 px-4">Product</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Unit</th>
                <th className="py-3.5 px-4 text-right">Purchase Price</th>
                <th className="py-3.5 px-4 text-right">Sale Price</th>
                <th className="py-3.5 px-4 text-right">Stock</th>
                <th className="py-3.5 px-4 text-right">Reorder Level</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center no-print">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p) => {
                  let statusBadge = (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      In Stock
                    </span>
                  );
                  let stockColor = 'text-emerald-600';

                  if (p.current_stock <= 0) {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                        Out of Stock
                      </span>
                    );
                    stockColor = 'text-rose-600';
                  } else if (p.current_stock <= p.reorder_level) {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                        Low Stock
                      </span>
                    );
                    stockColor = 'text-amber-600';
                  }

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-slate-500">{p.id}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 max-w-xs">
                        <div>{p.name}</div>
                        {p.location && (
                          <div className="text-xs text-slate-400 font-normal">
                            Loc: {p.location}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{p.category || '-'}</td>
                      <td className="py-3 px-4 text-slate-600">{p.unit || 'pcs'}</td>
                      <td className="py-3 px-4 text-right text-slate-700">
                        Rs. {p.purchase_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-900">
                        Rs. {p.sale_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`py-3 px-4 text-right font-black text-base ${stockColor}`}>
                        {p.current_stock}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500 font-mono">
                        {p.reorder_level}
                      </td>
                      <td className="py-3 px-4 text-center">{statusBadge}</td>
                      <td className="py-3 px-4 text-center no-print">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setViewingProduct(p)}
                            title="View Product & Movements"
                            className="p-1.5 text-sky-600 hover:bg-sky-50 rounded"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(p)}
                            title="Edit Product"
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenAdjust(p)}
                            title="Adjust Stock"
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded"
                          >
                            <ArrowUpDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete product: "${p.name}"?`)) {
                                onDeleteProduct(p.id);
                              }
                            }}
                            title="Delete Product"
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No products added yet. Click "Add New Product" to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {(isAddModalOpen || editingProduct) && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in">
            <div className="bg-[#1a252f] text-white px-6 py-4 flex items-center justify-between">
              <h4 className="font-bold text-lg flex items-center gap-2 m-0">
                <Boxes className="w-5 h-5 text-indigo-400" />
                <span>{editingProduct ? 'Edit Product Catalog' : 'Add New Product'}</span>
              </h4>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingProduct(null);
                }}
                className="text-slate-400 hover:text-white text-xl font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 32A Industrial Circuit Breaker"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Switchgear, Cabling, Civil"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    placeholder="Specifications, model number, rating..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    placeholder="pcs, coil, tons, meter"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Purchase Price (Rs.)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.purchase_price}
                    onChange={(e) =>
                      setFormData({ ...formData, purchase_price: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Sale Price (Rs.)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.sale_price}
                    onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Initial Current Stock
                  </label>
                  <input
                    type="number"
                    step="any"
                    disabled={!!editingProduct}
                    value={formData.current_stock}
                    onChange={(e) =>
                      setFormData({ ...formData, current_stock: e.target.value })
                    }
                    className={`w-full px-3 py-2 text-sm rounded-lg border border-slate-300 ${
                      editingProduct ? 'bg-slate-100 text-slate-500' : ''
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Min Stock Level
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.min_stock_level}
                    onChange={(e) =>
                      setFormData({ ...formData, min_stock_level: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Max Stock Level
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.max_stock_level}
                    onChange={(e) =>
                      setFormData({ ...formData, max_stock_level: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Reorder Alert Level
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.reorder_level}
                    onChange={(e) =>
                      setFormData({ ...formData, reorder_level: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Storage Location
                  </label>
                  <input
                    type="text"
                    placeholder="Warehouse A, Rack 3"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Supplier / Vendor
                  </label>
                  <select
                    value={formData.supplier_id}
                    onChange={(e) =>
                      setFormData({ ...formData, supplier_id: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">None / Open Market</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.company_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Barcode / SKU
                  </label>
                  <input
                    type="text"
                    placeholder="8901234..."
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingProduct(null);
                  }}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
                >
                  {editingProduct ? 'Update Product' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal with exact +10/+1/-1/-10 buttons from template */}
      {adjustingProduct && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in">
            <div className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between">
              <h4 className="font-bold text-base flex items-center gap-2 m-0">
                <ArrowUpDown className="w-5 h-5 text-indigo-400" />
                <span>Adjust Stock Quantity</span>
              </h4>
              <button
                onClick={() => setAdjustingProduct(null)}
                className="text-slate-400 hover:text-white text-xl font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleApplyAdjustment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Product
                </label>
                <div className="p-2.5 bg-slate-100 rounded-lg text-sm font-bold text-slate-800">
                  {adjustingProduct.name}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Current Stock Level
                </label>
                <div className="text-xl font-bold text-slate-900">
                  {adjustingProduct.current_stock} {adjustingProduct.unit}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Adjustment Quantity (+ to Add, - to Deduct)
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAdjustQty((prev) => prev - 10)}
                    className="px-2.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs"
                  >
                    -10
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustQty((prev) => prev - 1)}
                    className="px-2.5 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-lg text-xs"
                  >
                    -1
                  </button>
                  <input
                    type="number"
                    step="any"
                    required
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(parseFloat(e.target.value) || 0)}
                    className="w-full text-center px-3 py-2 text-base font-bold rounded-lg border border-slate-300"
                  />
                  <button
                    type="button"
                    onClick={() => setAdjustQty((prev) => prev + 1)}
                    className="px-2.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustQty((prev) => prev + 10)}
                    className="px-2.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs"
                  >
                    +10
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  New resulting stock:{' '}
                  <strong className="text-slate-800">
                    {adjustingProduct.current_stock + adjustQty}
                  </strong>{' '}
                  {adjustingProduct.unit}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Audit Notes / Reason
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Physical inventory count correction, damaged goods..."
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
                >
                  Apply Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Product Details & Stock Movement History Modal */}
      {viewingProduct && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in">
            <div className="bg-sky-600 text-white px-6 py-4 flex items-center justify-between">
              <h4 className="font-bold text-lg flex items-center gap-2 m-0">
                <Eye className="w-5 h-5" />
                <span>Product Details & Stock History</span>
              </h4>
              <button
                onClick={() => setViewingProduct(null)}
                className="text-sky-100 hover:text-white text-xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold">Product</span>
                  <div className="font-bold text-slate-900 text-base">
                    {viewingProduct.name}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold">Category</span>
                  <div className="font-semibold text-slate-700">
                    {viewingProduct.category || '-'}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold">Description</span>
                <div className="text-xs text-slate-600 mt-0.5">
                  {viewingProduct.description || 'No description provided.'}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[11px] text-slate-400 font-semibold uppercase">Stock</span>
                  <div className="text-base font-bold text-emerald-600">
                    {viewingProduct.current_stock} {viewingProduct.unit}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-semibold uppercase">Purchase</span>
                  <div className="text-sm font-semibold text-slate-800">
                    Rs. {viewingProduct.purchase_price.toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-semibold uppercase">Sale</span>
                  <div className="text-sm font-semibold text-slate-800">
                    Rs. {viewingProduct.sale_price.toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-semibold uppercase">Reorder Level</span>
                  <div className="text-sm font-semibold text-slate-800">
                    {viewingProduct.reorder_level}
                  </div>
                </div>
              </div>

              {/* Movement History */}
              <div className="pt-2">
                <h5 className="font-bold text-slate-800 text-sm mb-2">
                  Stock Movements Audit Trail
                </h5>
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 font-semibold text-slate-600 sticky top-0">
                      <tr>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Type</th>
                        <th className="py-2 px-3 text-right">Qty</th>
                        <th className="py-2 px-3 text-right">Prev</th>
                        <th className="py-2 px-3 text-right">New</th>
                        <th className="py-2 px-3">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {stockMovements.filter((m) => m.product_id === viewingProduct.id).length >
                      0 ? (
                        stockMovements
                          .filter((m) => m.product_id === viewingProduct.id)
                          .map((m) => (
                            <tr key={m.id} className="hover:bg-slate-50">
                              <td className="py-2 px-3 whitespace-nowrap">{m.movement_date}</td>
                              <td className="py-2 px-3">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                    m.quantity > 0
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {m.movement_type}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right font-bold">
                                {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                              </td>
                              <td className="py-2 px-3 text-right text-slate-500">
                                {m.previous_stock}
                              </td>
                              <td className="py-2 px-3 text-right font-bold text-slate-900">
                                {m.new_stock}
                              </td>
                              <td className="py-2 px-3 text-slate-600">{m.notes || '-'}</td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-4 text-center text-slate-400">
                            No movements recorded for this item.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setViewingProduct(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
