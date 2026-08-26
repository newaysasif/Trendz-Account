import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  Plus,
  Printer,
  Search,
  Filter,
  Trash2,
  Edit2,
  Eye,
  Send,
  Calendar,
  Layers,
  FileSpreadsheet,
  HardHat,
  Hammer,
  Truck,
  Fuel,
  ShieldCheck,
  Building2,
  DollarSign,
  AlertCircle,
  TrendingUp,
  FolderPlus,
} from 'lucide-react';
import { Project, ProjectExpense, Bank } from '../types';

interface ProjectExpensesViewProps {
  projects: Project[];
  projectExpenses: ProjectExpense[];
  banks: Bank[];
  onAddProjectExpense: (expense: Omit<ProjectExpense, 'id'>) => void;
  onUpdateProjectExpense: (id: number, expense: Partial<ProjectExpense>) => void;
  onDeleteProjectExpense: (id: number) => void;
  onAddProject: (project: Omit<Project, 'id'>) => void;
  onOpenWhatsApp: (message: string) => void;
}

const EXPENSE_TYPES = [
  'Raw Materials',
  'Labor & Subcontractors',
  'Equipment & Machinery',
  'Site Logistics & Fuel',
  'Permits & Compliance',
  'Safety & PPE',
  'Site Overhead',
] as const;

export const ProjectExpensesView: React.FC<ProjectExpensesViewProps> = ({
  projects,
  projectExpenses,
  banks,
  onAddProjectExpense,
  onUpdateProjectExpense,
  onDeleteProjectExpense,
  onAddProject,
  onOpenWhatsApp,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Modals
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ProjectExpense | null>(null);
  const [viewingExpense, setViewingExpense] = useState<ProjectExpense | null>(null);

  // Form State for Project Expense
  const [formData, setFormData] = useState<{
    project_id: string;
    expense_date: string;
    expense_type: (typeof EXPENSE_TYPES)[number];
    description: string;
    contractor_supplier: string;
    voucher_no: string;
    payment_method: 'Bank Transfer' | 'Cash / Petty Cash' | 'Cheque' | 'Online Transfer';
    bank_id: string;
    amount: string;
    notes: string;
  }>({
    project_id: projects[0]?.id.toString() || '',
    expense_date: new Date().toISOString().split('T')[0],
    expense_type: 'Raw Materials',
    description: '',
    contractor_supplier: '',
    voucher_no: '',
    payment_method: 'Bank Transfer',
    bank_id: banks[0]?.id.toString() || '',
    amount: '',
    notes: '',
  });

  // Form State for New Project
  const [newProjectData, setNewProjectData] = useState({
    name: '',
    client_name: '',
    location: '',
    budget: '',
    start_date: new Date().toISOString().split('T')[0],
    status: 'In Progress' as const,
  });

  // Active Project (if single selected)
  const currentProject = useMemo(() => {
    if (selectedProjectId === 'ALL') return null;
    return projects.find((p) => p.id.toString() === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return projectExpenses.filter((exp) => {
      const matchProject =
        selectedProjectId === 'ALL' ||
        exp.project_id.toString() === selectedProjectId;

      const matchSearch =
        exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.contractor_supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (exp.voucher_no && exp.voucher_no.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (exp.project_name && exp.project_name.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchType =
        selectedType === 'ALL' || exp.expense_type === selectedType;

      const matchDate = !dateFilter || exp.expense_date === dateFilter;

      return matchProject && matchSearch && matchType && matchDate;
    });
  }, [projectExpenses, selectedProjectId, searchTerm, selectedType, dateFilter]);

  // Calculations
  const totalProjectExpenses = useMemo(
    () => projectExpenses.reduce((sum, e) => sum + e.amount, 0),
    [projectExpenses]
  );

  const selectedProjectExpenseSum = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
    [filteredExpenses]
  );

  const totalProjectsBudget = useMemo(
    () => projects.reduce((sum, p) => sum + p.budget, 0),
    [projects]
  );

  // Type Breakdown
  const typeStats = useMemo(() => {
    const map: Record<string, number> = {};
    filteredExpenses.forEach((e) => {
      map[e.expense_type] = (map[e.expense_type] || 0) + e.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filteredExpenses]);

  const materialsTotal = useMemo(
    () =>
      filteredExpenses
        .filter((e) => e.expense_type === 'Raw Materials')
        .reduce((s, e) => s + e.amount, 0),
    [filteredExpenses]
  );

  const laborTotal = useMemo(
    () =>
      filteredExpenses
        .filter((e) => e.expense_type === 'Labor & Subcontractors')
        .reduce((s, e) => s + e.amount, 0),
    [filteredExpenses]
  );

  const equipmentLogisticsTotal = useMemo(
    () =>
      filteredExpenses
        .filter(
          (e) =>
            e.expense_type === 'Equipment & Machinery' ||
            e.expense_type === 'Site Logistics & Fuel'
        )
        .reduce((s, e) => s + e.amount, 0),
    [filteredExpenses]
  );

  const handleOpenAddExpense = () => {
    setFormData({
      project_id:
        selectedProjectId !== 'ALL'
          ? selectedProjectId
          : projects[0]?.id.toString() || '',
      expense_date: new Date().toISOString().split('T')[0],
      expense_type: 'Raw Materials',
      description: '',
      contractor_supplier: '',
      voucher_no: '',
      payment_method: 'Bank Transfer',
      bank_id: banks[0]?.id.toString() || '',
      amount: '',
      notes: '',
    });
    setIsAddExpenseModalOpen(true);
  };

  const handleOpenEdit = (exp: ProjectExpense) => {
    setEditingExpense(exp);
    setFormData({
      project_id: exp.project_id.toString(),
      expense_date: exp.expense_date,
      expense_type: exp.expense_type,
      description: exp.description,
      contractor_supplier: exp.contractor_supplier,
      voucher_no: exp.voucher_no || '',
      payment_method: exp.payment_method,
      bank_id: exp.bank_id?.toString() || (banks[0]?.id.toString() || ''),
      amount: exp.amount.toString(),
      notes: exp.notes || '',
    });
  };

  const handleSubmitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(formData.amount);
    const projId = parseInt(formData.project_id, 10);
    const targetProj = projects.find((p) => p.id === projId);

    if (isNaN(amountNum) || amountNum <= 0 || !targetProj) {
      alert('Please enter valid amount and select a project');
      return;
    }

    const payload = {
      project_id: projId,
      project_name: targetProj.name,
      expense_date: formData.expense_date,
      expense_type: formData.expense_type,
      description: formData.description,
      contractor_supplier: formData.contractor_supplier,
      voucher_no: formData.voucher_no.trim() || undefined,
      payment_method: formData.payment_method,
      bank_id:
        formData.payment_method !== 'Cash / Petty Cash' && formData.bank_id
          ? parseInt(formData.bank_id, 10)
          : undefined,
      amount: amountNum,
      notes: formData.notes.trim() || undefined,
    };

    if (editingExpense) {
      onUpdateProjectExpense(editingExpense.id, payload);
      setEditingExpense(null);
    } else {
      onAddProjectExpense(payload);
      setIsAddExpenseModalOpen(false);
    }
  };

  const handleSubmitNewProject = (e: React.FormEvent) => {
    e.preventDefault();
    const budgetNum = parseFloat(newProjectData.budget);
    if (!newProjectData.name || isNaN(budgetNum) || budgetNum <= 0) {
      alert('Please provide valid project name and budget');
      return;
    }

    onAddProject({
      name: newProjectData.name,
      client_name: newProjectData.client_name || 'Direct Client',
      location: newProjectData.location || 'Site Project',
      budget: budgetNum,
      start_date: newProjectData.start_date,
      status: newProjectData.status,
    });

    setIsAddProjectModalOpen(false);
    setNewProjectData({
      name: '',
      client_name: '',
      location: '',
      budget: '',
      start_date: new Date().toISOString().split('T')[0],
      status: 'In Progress',
    });
  };

  const handleSendWhatsAppSummary = () => {
    let msg = `*TRENDZ INTERIOR*\n`;
    msg += `*PROJECT EXPENDITURES SUMMARY*\n`;
    msg += `Suite # LG - 11 Continental Shopping Mall\n`;
    msg += `------------------------------------\n`;
    if (currentProject) {
      msg += `*Project:* ${currentProject.name}\n`;
      msg += `Client: ${currentProject.client_name}\n`;
      msg += `Location: ${currentProject.location}\n`;
      msg += `Budget: Rs. ${currentProject.budget.toLocaleString()}\n`;
      msg += `Expenditure: Rs. ${selectedProjectExpenseSum.toLocaleString()} (${((selectedProjectExpenseSum / currentProject.budget) * 100).toFixed(1)}%)\n`;
    } else {
      msg += `*Scope:* All Projects (${projects.length} Active)\n`;
      msg += `*Total Project Budget:* Rs. ${totalProjectsBudget.toLocaleString()}\n`;
      msg += `*Total Project Expenses:* Rs. ${totalProjectExpenses.toLocaleString()}\n`;
    }
    msg += `------------------------------------\n`;
    msg += `*Cost Breakdown:*\n`;
    typeStats.forEach(([type, amt]) => {
      msg += `• ${type}: Rs. ${amt.toLocaleString()}\n`;
    });
    msg += `------------------------------------\n`;
    msg += `Recent Project Vouchers:\n`;
    filteredExpenses.slice(0, 5).forEach((e, idx) => {
      msg += `${idx + 1}. [${e.expense_date}] ${e.expense_type} - Rs. ${e.amount.toLocaleString()}\n   ${e.description} (${e.contractor_supplier})\n`;
    });
    msg += `\n*TRENDZ INTERIOR*\n`;
    msg += `Suite # LG - 11 Continental Shopping Mall | Contact: +92 300 8594210`;

    onOpenWhatsApp(msg);
  };

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'Raw Materials':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Labor & Subcontractors':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Equipment & Machinery':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Site Logistics & Fuel':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Permits & Compliance':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Safety & PPE':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <Briefcase className="w-7 h-7 text-amber-600" />
            <span>Projects Expenses Sheet</span>
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Track site construction materials, labor wages, machinery rentals, logistics, and project budgets
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 no-print">
          <button
            onClick={handleOpenAddExpense}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-lg font-semibold text-sm shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Project Expense</span>
          </button>
          <button
            onClick={() => setIsAddProjectModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2.5 rounded-lg font-semibold text-sm shadow-sm transition-colors"
          >
            <FolderPlus className="w-4 h-4" />
            <span>New Project</span>
          </button>
          <button
            onClick={handleSendWhatsAppSummary}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-lg font-semibold text-sm shadow-sm transition-colors"
          >
            <Send className="w-4 h-4" />
            <span>WhatsApp Ledger</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white px-3.5 py-2.5 rounded-lg font-semibold text-sm shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Sheet</span>
          </button>
        </div>
      </div>

      {/* Project Selector Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Building2 className="w-5 h-5 text-amber-600" />
          <span className="text-sm font-bold text-slate-700 whitespace-nowrap">
            Select Active Project:
          </span>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3 py-2 text-sm font-semibold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50/50 text-slate-800 w-full md:w-80"
          >
            <option value="ALL">🏢 All Projects Overview ({projects.length})</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id.toString()}>
                {p.name} (Budget: Rs. {p.budget.toLocaleString()})
              </option>
            ))}
          </select>
        </div>

        {currentProject && (
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
            <div>
              <span className="text-slate-400">Client:</span> {currentProject.client_name}
            </div>
            <div>
              <span className="text-slate-400">Location:</span> {currentProject.location}
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
              {currentProject.status}
            </span>
          </div>
        )}
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl p-5 text-white shadow-sm transition-transform hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-100">
              {currentProject ? 'Project Expenditure' : 'Total Projects Spend'}
            </span>
            <DollarSign className="w-6 h-6 opacity-60" />
          </div>
          <div className="text-2xl font-bold mt-2">
            Rs. {selectedProjectExpenseSum.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-purple-200 mt-1 font-medium">
            {filteredExpenses.length} Site Vouchers Recorded
          </div>
        </div>

        <div className="rounded-xl p-5 text-white shadow-sm transition-transform hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-100">
              Raw Materials Cost
            </span>
            <Hammer className="w-6 h-6 opacity-60" />
          </div>
          <div className="text-2xl font-bold mt-2">
            Rs. {materialsTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-emerald-100 mt-1 font-medium">
            Steel, cables, cement & conduits
          </div>
        </div>

        <div className="rounded-xl p-5 text-white shadow-sm transition-transform hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-100">
              Labor & Contractors
            </span>
            <HardHat className="w-6 h-6 opacity-60" />
          </div>
          <div className="text-2xl font-bold mt-2">
            Rs. {laborTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-rose-200 mt-1 font-medium">
            Subcontractors & technicians
          </div>
        </div>

        <div className="rounded-xl p-5 text-white shadow-sm transition-transform hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-950">
              Machinery & Logistics
            </span>
            <Truck className="w-6 h-6 opacity-60 text-amber-950" />
          </div>
          <div className="text-2xl font-bold mt-2 text-slate-900">
            Rs. {equipmentLogisticsTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-amber-950 mt-1 font-medium">
            Crane rental, fuel, site logistics
          </div>
        </div>
      </div>

      {/* Budget Progress Bar */}
      {currentProject ? (
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-sm font-bold text-slate-700 mb-2">
            <span className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Budget Utilization: {currentProject.name}
            </span>
            <span>
              Spent: Rs. {selectedProjectExpenseSum.toLocaleString()} / Budget: Rs. {currentProject.budget.toLocaleString()} (
              {((selectedProjectExpenseSum / currentProject.budget) * 100).toFixed(1)}%)
            </span>
          </div>
          <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                (selectedProjectExpenseSum / currentProject.budget) * 100 > 90
                  ? 'bg-rose-500'
                  : (selectedProjectExpenseSum / currentProject.budget) * 100 > 70
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{
                width: `${Math.min(
                  100,
                  (selectedProjectExpenseSum / currentProject.budget) * 100
                )}%`,
              }}
            />
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-sm font-bold text-slate-700 mb-3">
            <span>Overall Projects Budget Tracker</span>
            <span className="text-xs text-slate-500 font-normal">
              Total Portfolio Budget: Rs. {totalProjectsBudget.toLocaleString()}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {projects.map((proj) => {
              const spent = projectExpenses
                .filter((e) => e.project_id === proj.id)
                .reduce((s, e) => s + e.amount, 0);
              const pct = ((spent / proj.budget) * 100).toFixed(1);
              return (
                <div
                  key={proj.id}
                  onClick={() => setSelectedProjectId(proj.id.toString())}
                  className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-amber-50/50 hover:border-amber-300 cursor-pointer transition-all"
                >
                  <div className="text-xs font-bold text-slate-800 truncate mb-1">
                    {proj.name}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                    <span>Rs. {spent.toLocaleString()}</span>
                    <span className="font-semibold text-slate-700">{pct}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full"
                      style={{ width: `${Math.min(100, parseFloat(pct))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-3 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search description, contractor, voucher #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Expense Type Selector */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            >
              <option value="ALL">All Expense Types ({EXPENSE_TYPES.length})</option>
              {EXPENSE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker Filter */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="px-2 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Projects Expense Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-slate-800 text-base m-0">
              {currentProject ? `${currentProject.name} Expense Ledger` : 'All Projects Expenses'}
            </h3>
            <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full">
              {filteredExpenses.length} Vouchers
            </span>
          </div>
          <div className="text-sm font-bold text-slate-700">
            Total Amount:{' '}
            <span className="text-amber-700">
              Rs. {selectedProjectExpenseSum.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100/80 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                <th className="py-3.5 px-4">#</th>
                <th className="py-3.5 px-4">Project</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Cost Center</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4">Contractor / Supplier</th>
                <th className="py-3.5 px-4">Voucher #</th>
                <th className="py-3.5 px-4 text-right">Amount (Rs.)</th>
                <th className="py-3.5 px-4 text-center no-print">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((exp, idx) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                      {exp.project_name || 'Project Site'}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium whitespace-nowrap">
                      {exp.expense_date}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getTypeBadgeClass(
                          exp.expense_type
                        )}`}
                      >
                        {exp.expense_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 max-w-xs">
                      <div>{exp.description}</div>
                      {exp.notes && (
                        <div className="text-xs text-slate-500 mt-0.5 italic">
                          {exp.notes}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {exp.contractor_supplier}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-600">
                      {exp.voucher_no || '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                      Rs. {exp.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center no-print">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setViewingExpense(exp)}
                          title="View Details"
                          className="p-1.5 text-sky-600 hover:bg-sky-50 rounded transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(exp)}
                          title="Edit"
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete project expense: "${exp.description}"?`)) {
                              onDeleteProjectExpense(exp.id);
                            }
                          }}
                          title="Delete"
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <AlertCircle className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                    <div className="font-semibold">No project expenses found</div>
                    <div className="text-xs text-slate-400 mt-1">
                      Click "Add Project Expense" to register material, labor, or site machinery costs.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            {filteredExpenses.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                  <td colSpan={7} className="py-3 px-4 text-right">
                    Total Project Expenditure:
                  </td>
                  <td className="py-3 px-4 text-right text-amber-700 text-base">
                    Rs. {selectedProjectExpenseSum.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="no-print"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Add / Edit Project Expense Modal */}
      {(isAddExpenseModalOpen || editingExpense) && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#1a252f] text-white px-6 py-4 flex items-center justify-between">
              <h4 className="font-bold text-lg flex items-center gap-2 m-0">
                <Briefcase className="w-5 h-5 text-amber-400" />
                <span>{editingExpense ? 'Edit Project Expense' : 'Add Project Expense'}</span>
              </h4>
              <button
                onClick={() => {
                  setIsAddExpenseModalOpen(false);
                  setEditingExpense(null);
                }}
                className="text-slate-400 hover:text-white text-xl font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitExpense} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Select Project *
                  </label>
                  <select
                    required
                    value={formData.project_id}
                    onChange={(e) =>
                      setFormData({ ...formData, project_id: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white font-semibold"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Cost Center / Type *
                  </label>
                  <select
                    required
                    value={formData.expense_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        expense_type: e.target.value as (typeof EXPENSE_TYPES)[number],
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  >
                    {EXPENSE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Expense Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.expense_date}
                    onChange={(e) =>
                      setFormData({ ...formData, expense_date: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Voucher / Reference #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PVCH-PRJ1-009"
                    value={formData.voucher_no}
                    onChange={(e) =>
                      setFormData({ ...formData, voucher_no: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Description / Specification *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 50-Ton Crane Rental for Substation Transformer Mounting"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Contractor / Supplier / Payee *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fast Track Machinery Rentals"
                    value={formData.contractor_supplier}
                    onChange={(e) =>
                      setFormData({ ...formData, contractor_supplier: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Amount (Rs.) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Payment Method
                  </label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        payment_method: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash / Petty Cash">Cash / Site Petty Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Online Transfer">Online Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Bank Account (if applicable)
                  </label>
                  <select
                    value={formData.bank_id}
                    onChange={(e) =>
                      setFormData({ ...formData, bank_id: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  >
                    {banks.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bank_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Site Engineer Notes / Inspection Info
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional site inspection notes, delivery verification, invoice ref..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddExpenseModalOpen(false);
                    setEditingExpense(null);
                  }}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm"
                >
                  {editingExpense ? 'Update Project Expense' : 'Save Project Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Project Modal */}
      {isAddProjectModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in">
            <div className="bg-[#1a252f] text-white px-6 py-4 flex items-center justify-between">
              <h4 className="font-bold text-lg flex items-center gap-2 m-0">
                <FolderPlus className="w-5 h-5 text-blue-400" />
                <span>Register New Engineering Project</span>
              </h4>
              <button
                onClick={() => setIsAddProjectModalOpen(false)}
                className="text-slate-400 hover:text-white text-xl font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitNewProject} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Industrial Food Processing Plant Electrification"
                  value={newProjectData.name}
                  onChange={(e) =>
                    setNewProjectData({ ...newProjectData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Client Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Nestle Pakistan Ltd"
                    value={newProjectData.client_name}
                    onChange={(e) =>
                      setNewProjectData({ ...newProjectData, client_name: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sheikhupura Road"
                    value={newProjectData.location}
                    onChange={(e) =>
                      setNewProjectData({ ...newProjectData, location: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Total Budget (Rs.) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="e.g. 5000000"
                    value={newProjectData.budget}
                    onChange={(e) =>
                      setNewProjectData({ ...newProjectData, budget: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={newProjectData.start_date}
                    onChange={(e) =>
                      setNewProjectData({ ...newProjectData, start_date: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddProjectModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Project Expense Modal */}
      {viewingExpense && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in">
            <div className="bg-amber-600 text-white px-6 py-4 flex items-center justify-between">
              <h4 className="font-bold text-lg flex items-center gap-2 m-0">
                <Eye className="w-5 h-5" />
                <span>Project Expense Voucher #{viewingExpense.id}</span>
              </h4>
              <button
                onClick={() => setViewingExpense(null)}
                className="text-amber-100 hover:text-white text-xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="pb-3 border-b border-slate-100">
                <span className="text-xs text-slate-400 uppercase font-semibold">Project</span>
                <div className="text-base font-bold text-slate-900 mt-0.5">
                  {viewingExpense.project_name}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold">Date</span>
                  <div className="font-bold text-slate-800">{viewingExpense.expense_date}</div>
                </div>
                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold">Cost Center</span>
                  <div>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold border ${getTypeBadgeClass(viewingExpense.expense_type)}`}>
                      {viewingExpense.expense_type}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold">Description</span>
                <div className="text-sm font-semibold text-slate-900 mt-0.5">
                  {viewingExpense.description}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold">Contractor / Supplier</span>
                  <div className="font-semibold text-slate-800">{viewingExpense.contractor_supplier}</div>
                </div>
                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold">Voucher #</span>
                  <div className="font-mono text-slate-800">{viewingExpense.voucher_no || 'N/A'}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold">Payment Method</span>
                  <div className="font-semibold text-slate-800">{viewingExpense.payment_method}</div>
                </div>
                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold">Total Amount</span>
                  <div className="text-xl font-bold text-amber-600">
                    Rs. {viewingExpense.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {viewingExpense.notes && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-xs text-slate-500 uppercase font-bold">Site Audit Notes:</span>
                  <p className="text-xs text-slate-700 mt-1 m-0">{viewingExpense.notes}</p>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end">
                <button
                  onClick={() => setViewingExpense(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-sm font-semibold"
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
