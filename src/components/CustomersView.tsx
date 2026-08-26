import React, { useState } from 'react';
import { Users, Plus, Trash2, Edit2, Search, Phone, Mail, MapPin } from 'lucide-react';
import { Customer } from '../types';

interface CustomersViewProps {
  customers: Customer[];
  onAddCustomer: (customer: Omit<Customer, 'id'>) => void;
  onUpdateCustomer: (id: number, customer: Partial<Customer>) => void;
  onDeleteCustomer: (id: number) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    email: '',
  });

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAdd = () => {
    setFormData({ name: '', phone: '', address: '', email: '' });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name,
      phone: c.phone,
      address: c.address,
      email: c.email,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Customer name is required');
      return;
    }

    if (editingCustomer) {
      onUpdateCustomer(editingCustomer.id, formData);
      setEditingCustomer(null);
    } else {
      onAddCustomer(formData);
      setIsAddModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <Users className="w-7 h-7 text-cyan-600" />
            <span>Customers & Clients Directory</span>
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage corporate client accounts, billing addresses, and contact info
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2.5 rounded-lg font-semibold text-sm shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between no-print">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search customers by name, phone, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
        <span className="text-xs text-slate-500 font-semibold">
          {filtered.length} Customers Listed
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100/80 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                <th className="py-3.5 px-4">#</th>
                <th className="py-3.5 px-4">Customer / Client Name</th>
                <th className="py-3.5 px-4">Contact Phone</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Address</th>
                <th className="py-3.5 px-4 text-center no-print">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.map((cust, idx) => (
                <tr key={cust.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono text-xs text-slate-500">{idx + 1}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{cust.name}</td>
                  <td className="py-3 px-4 text-slate-700 font-medium whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-cyan-600" />
                      {cust.phone}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {cust.email}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 text-xs">{cust.address}</td>
                  <td className="py-3 px-4 text-center no-print">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(cust)}
                        title="Edit Customer"
                        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete customer: "${cust.name}"?`)) {
                            onDeleteCustomer(cust.id);
                          }
                        }}
                        title="Delete Customer"
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {(isAddModalOpen || editingCustomer) && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in">
            <div className="bg-[#1a252f] text-white px-6 py-4 flex items-center justify-between">
              <h4 className="font-bold text-lg flex items-center gap-2 m-0">
                <Users className="w-5 h-5 text-cyan-400" />
                <span>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</span>
              </h4>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingCustomer(null);
                }}
                className="text-slate-400 hover:text-white text-xl font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Customer / Company Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Builders & Developers Ltd"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="+92 300 1234567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="accounts@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Office / Delivery Address
                </label>
                <textarea
                  rows={2}
                  placeholder="Plot #, Street, City"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingCustomer(null);
                  }}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg shadow-sm"
                >
                  {editingCustomer ? 'Update Customer' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
