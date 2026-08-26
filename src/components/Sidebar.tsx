import React, { useState } from 'react';
import {
  Landmark,
  PlusCircle,
  PieChart,
  Users,
  Truck,
  Boxes,
  FileSpreadsheet,
  Receipt,
  Building,
  Briefcase,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Calculator,
  CreditCard,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { ActiveTab } from '../types';
import { TrendzLogoMark, TrendzLogo } from './TrendzLogo';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  officeExpenseCount: number;
  projectExpenseCount: number;
  lowStockCount: number;
  totalBanksCount: number;
  receiptsCount?: number;
  onLock?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  officeExpenseCount,
  projectExpenseCount,
  lowStockCount,
  totalBanksCount,
  receiptsCount = 0,
  onLock,
}) => {
  const [expenseDropdownOpen, setExpenseDropdownOpen] = useState(
    activeTab === 'office_expenses' || activeTab === 'project_expenses'
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  const isExpenseActive =
    activeTab === 'office_expenses' || activeTab === 'project_expenses';

  const handleNavClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Topbar */}
      <div className="md:hidden flex items-center justify-between bg-[#0e1319] border-b border-amber-900/30 text-white px-4 py-3 sticky top-0 z-50 shadow-md no-print">
        <div className="flex items-center gap-2">
          <TrendzLogoMark size={28} />
          <span className="font-extrabold tracking-widest text-sm font-serif text-amber-200">
            TRENDZ INTERIOR
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded hover:bg-slate-800 text-gray-200 cursor-pointer"
          aria-label="Toggle Navigation Menu"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Overlay on Mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden no-print"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen w-64 bg-[#0d1218] border-r border-slate-800/80 text-white flex flex-col z-50 transition-transform duration-200 ease-in-out no-print ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header Centered in between the sidebar */}
        <div className="pt-6 pb-5 px-4 border-b border-amber-900/30 bg-gradient-to-b from-[#141b24] via-[#101620] to-[#0d1218] flex flex-col items-center justify-center text-center">
          <TrendzLogo
            variant="vertical"
            theme="dark"
            size="md"
            subtitleText="Architecture • Turnkey • Accounts"
            className="w-full"
          />
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 text-sm">
          {/* Bank Statements */}
          <button
            onClick={() => handleNavClick('banks')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-colors font-medium text-left cursor-pointer ${
              activeTab === 'banks'
                ? 'bg-[#0d6efd] text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Landmark className="w-4 h-4 text-blue-400" />
              <span>Bank Statements</span>
            </div>
          </button>

          {/* Manage Banks */}
          <button
            onClick={() => handleNavClick('manage_banks')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-colors font-medium text-left cursor-pointer ${
              activeTab === 'manage_banks'
                ? 'bg-[#0d6efd] text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>Manage Banks</span>
            </div>
            {totalBanksCount > 0 && (
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 font-semibold">
                {totalBanksCount}
              </span>
            )}
          </button>

          {/* Bank Dashboard */}
          <button
            onClick={() => handleNavClick('bank_dashboard')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-colors font-medium text-left cursor-pointer ${
              activeTab === 'bank_dashboard'
                ? 'bg-[#0d6efd] text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <PieChart className="w-4 h-4 text-purple-400" />
              <span>Bank Dashboard</span>
            </div>
          </button>

          {/* Invoices */}
          <button
            onClick={() => handleNavClick('invoices')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-colors font-medium text-left cursor-pointer ${
              activeTab === 'invoices'
                ? 'bg-[#0d6efd] text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Invoices & Billing</span>
            </div>
          </button>

          {/* Payment Receipt Memos */}
          <button
            onClick={() => handleNavClick('receipts')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-colors font-medium text-left cursor-pointer ${
              activeTab === 'receipts'
                ? 'bg-[#0d6efd] text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Receipt className="w-4 h-4 text-purple-400" />
              <span>Receipt Memos</span>
            </div>
            {receiptsCount > 0 && (
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/50 font-semibold">
                {receiptsCount}
              </span>
            )}
          </button>

          {/* Customers */}
          <button
            onClick={() => handleNavClick('customers')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-colors font-medium text-left cursor-pointer ${
              activeTab === 'customers'
                ? 'bg-[#0d6efd] text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Customers</span>
            </div>
          </button>

          {/* Vendors */}
          <button
            onClick={() => handleNavClick('vendors')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-colors font-medium text-left cursor-pointer ${
              activeTab === 'vendors'
                ? 'bg-[#0d6efd] text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Truck className="w-4 h-4 text-amber-400" />
              <span>Vendors</span>
            </div>
          </button>

          {/* Stock / Products */}
          <button
            onClick={() => handleNavClick('products')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-colors font-medium text-left cursor-pointer ${
              activeTab === 'products'
                ? 'bg-[#0d6efd] text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Boxes className="w-4 h-4 text-indigo-400" />
              <span>Stock / Materials</span>
            </div>
            {lowStockCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                {lowStockCount} alert
              </span>
            )}
          </button>

          {/* ============ EXPENSE SHEET DROPDOWN ============ */}
          <div className="pt-2">
            <div className="px-3 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Expenditures
            </div>

            {/* Parent Dropdown Button */}
            <button
              onClick={() => setExpenseDropdownOpen(!expenseDropdownOpen)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-colors font-medium text-left cursor-pointer ${
                isExpenseActive
                  ? 'bg-slate-800 text-white border-l-4 border-blue-500'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Briefcase className="w-4 h-4 text-rose-400" />
                <span>Expense Sheet</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/50 font-semibold">
                  {officeExpenseCount + projectExpenseCount}
                </span>
                {expenseDropdownOpen ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>

            {/* Dropdown Menu Sub-Items */}
            {expenseDropdownOpen && (
              <div className="mt-1 pl-4 space-y-1 border-l-2 border-slate-700/70 ml-4 py-1">
                {/* Office Expenses Sub-Item */}
                <button
                  onClick={() => handleNavClick('office_expenses')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors text-xs font-medium text-left cursor-pointer ${
                    activeTab === 'office_expenses'
                      ? 'bg-[#0d6efd] text-white shadow-sm font-semibold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Building className="w-3.5 h-3.5 text-sky-400" />
                    <span>Office Expenses</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/20 text-slate-300">
                    {officeExpenseCount}
                  </span>
                </button>

                {/* Projects Expenses Sub-Item */}
                <button
                  onClick={() => handleNavClick('project_expenses')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors text-xs font-medium text-left cursor-pointer ${
                    activeTab === 'project_expenses'
                      ? 'bg-[#0d6efd] text-white shadow-sm font-semibold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                    <span>Projects Expenses</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/20 text-slate-300">
                    {projectExpenseCount}
                  </span>
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Sidebar Footer Info */}
        <div className="p-4 border-t border-slate-800 text-xs text-slate-400 bg-[#141d24] space-y-2.5">
          <div className="flex items-center justify-between text-slate-300 font-semibold">
            <span>TRENDZ INTERIOR</span>
            <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-normal">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Secure Session
            </span>
          </div>
          <p className="text-[11px] text-slate-500 m-0">Suite # LG - 11 Continental Shopping Mall</p>

          {onLock && (
            <button
              onClick={onLock}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-slate-900/90 hover:bg-rose-950/40 border border-slate-700/60 hover:border-rose-700/50 text-slate-300 hover:text-rose-300 text-xs font-semibold transition-all cursor-pointer shadow-xs"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock Accounts Portal</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
