import React, { useState } from 'react';
import { Landmark, Plus, Trash2, Building, Calendar, Wallet, CheckCircle } from 'lucide-react';
import { Bank } from '../types';

interface ManageBanksViewProps {
  banks: Bank[];
  onAddBank: (bank: Omit<Bank, 'id'>) => void;
  onDeleteBank: (id: number) => void;
}

export const ManageBanksView: React.FC<ManageBanksViewProps> = ({
  banks,
  onAddBank,
  onDeleteBank,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    bank_name: '',
    account_no: '',
    branch: '',
    holder_name: 'Neways Engineering & Tech Corp',
    open_date: new Date().toISOString().split('T')[0],
    opening_balance: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const bal = parseFloat(formData.opening_balance || '0');
    if (!formData.bank_name || !formData.account_no) {
      alert('Please fill bank name and account number');
      return;
    }

    onAddBank({
      bank_name: formData.bank_name.trim(),
      account_no: formData.account_no.trim(),
      branch: formData.branch.trim() || 'Main Branch',
      holder_name: formData.holder_name.trim(),
      open_date: formData.open_date,
      opening_balance: isNaN(bal) ? 0 : bal,
    });

    setIsAddModalOpen(false);
    setFormData({
      bank_name: '',
      account_no: '',
      branch: '',
      holder_name: 'Neways Engineering & Tech Corp',
      open_date: new Date().toISOString().split('T')[0],
      opening_balance: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <Plus className="w-7 h-7 text-emerald-600" />
            <span>Manage Bank Accounts & Profiles</span>
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Register official corporate bank accounts, branch details, and initial balances
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg font-semibold text-sm shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Bank Profile</span>
        </button>
      </div>

      {/* Bank Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {banks.map((bank) => (
          <div
            key={bank.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -z-0 opacity-60"></div>
            <div className="relative z-10 space-y-3">
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                  <Landmark className="w-5 h-5" />
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Delete bank profile: "${bank.bank_name}"?`)) {
                      onDeleteBank(bank.id);
                    }
                  }}
                  className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Delete Bank Profile"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h4 className="font-bold text-base text-slate-900 leading-snug">
                  {bank.bank_name}
                </h4>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  A/C: {bank.account_no}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Branch:</span>
                  <span className="font-semibold text-slate-700">{bank.branch}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Account Title:</span>
                  <span className="font-semibold text-slate-700">{bank.holder_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Opening Date:</span>
                  <span className="font-semibold text-slate-700">{bank.open_date}</span>
                </div>
              </div>
            </div>

            <div className="relative z-10 mt-4 pt-3 border-t border-slate-100 flex items-center justify-between bg-slate-50 -mx-5 -mb-5 px-5 py-3">
              <span className="text-xs font-semibold text-slate-500">Opening Balance:</span>
              <span className="text-sm font-bold text-emerald-600">
                Rs. {bank.opening_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Bank Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in">
            <div className="bg-[#1a252f] text-white px-6 py-4 flex items-center justify-between">
              <h4 className="font-bold text-lg flex items-center gap-2 m-0">
                <Landmark className="w-5 h-5 text-emerald-400" />
                <span>Register Bank Profile</span>
              </h4>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white text-xl font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Bank Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Meezan Bank Ltd / HBL Commercial"
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="0102-XXXXXXXXXX"
                    value={formData.account_no}
                    onChange={(e) => setFormData({ ...formData, account_no: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Branch Name
                  </label>
                  <input
                    type="text"
                    placeholder="Main Commercial Branch"
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Account Holder / Company Title
                </label>
                <input
                  type="text"
                  value={formData.holder_name}
                  onChange={(e) => setFormData({ ...formData, holder_name: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Opening Date
                  </label>
                  <input
                    type="date"
                    value={formData.open_date}
                    onChange={(e) => setFormData({ ...formData, open_date: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Opening Balance (Rs.)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.opening_balance}
                    onChange={(e) =>
                      setFormData({ ...formData, opening_balance: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm"
                >
                  Save Bank Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
