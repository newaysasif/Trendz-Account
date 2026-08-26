import React, { useMemo } from 'react';
import {
  PieChart,
  Landmark,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Building,
  CreditCard,
} from 'lucide-react';
import { Bank, BankTransaction } from '../types';

interface BankDashboardViewProps {
  banks: Bank[];
  bankTransactions: BankTransaction[];
}

export const BankDashboardView: React.FC<BankDashboardViewProps> = ({
  banks,
  bankTransactions,
}) => {
  const bankStats = useMemo(() => {
    return banks.map((bank) => {
      const txs = bankTransactions.filter((t) => t.bank_id === bank.id);
      let balance = bank.opening_balance;
      let totalIn = 0;
      let totalOut = 0;
      txs.forEach((t) => {
        balance += t.debit - t.credit;
        totalIn += t.debit;
        totalOut += t.credit;
      });
      return {
        bank,
        balance,
        totalIn,
        totalOut,
        txCount: txs.length,
      };
    });
  }, [banks, bankTransactions]);

  const totalLiquidity = useMemo(
    () => bankStats.reduce((sum, b) => sum + b.balance, 0),
    [bankStats]
  );

  const totalLifetimeDeposits = useMemo(
    () => bankStats.reduce((sum, b) => sum + b.totalIn, 0),
    [bankStats]
  );

  const totalLifetimeWithdrawals = useMemo(
    () => bankStats.reduce((sum, b) => sum + b.totalOut, 0),
    [bankStats]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
          <PieChart className="w-7 h-7 text-purple-600" />
          <span>Bank Accounts Dashboard</span>
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Multi-bank liquidity overview, cash reserves, and consolidated financial standing
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className="rounded-xl p-5 text-white shadow-sm"
          style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-100">
              Total Liquid Cash Reserves
            </span>
            <Landmark className="w-6 h-6 opacity-60" />
          </div>
          <div className="text-2xl font-bold mt-2">
            Rs. {totalLiquidity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-emerald-100 mt-1 font-medium">
            Across {banks.length} Active Bank Accounts
          </div>
        </div>

        <div
          className="rounded-xl p-5 text-white shadow-sm"
          style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-100">
              Total Deposits (Inflows)
            </span>
            <ArrowUpRight className="w-6 h-6 opacity-60" />
          </div>
          <div className="text-2xl font-bold mt-2">
            Rs. {totalLifetimeDeposits.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-purple-200 mt-1 font-medium">
            Client Collections & Receivables
          </div>
        </div>

        <div
          className="rounded-xl p-5 text-white shadow-sm"
          style={{ background: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-100">
              Total Withdrawals (Outflows)
            </span>
            <ArrowDownLeft className="w-6 h-6 opacity-60" />
          </div>
          <div className="text-2xl font-bold mt-2">
            Rs. {totalLifetimeWithdrawals.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-rose-200 mt-1 font-medium">
            Vendor & Operational Payments
          </div>
        </div>
      </div>

      {/* Individual Bank Breakdown Cards */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 text-lg m-0">
          Bank Account Balance Distribution
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {bankStats.map((item) => {
            const share =
              totalLiquidity > 0
                ? ((item.balance / totalLiquidity) * 100).toFixed(1)
                : '0';

            return (
              <div
                key={item.bank.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-sm">{item.bank.bank_name}</div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    {share}% of reserves
                  </span>
                </div>

                <div className="text-xl font-bold text-slate-800">
                  Rs. {item.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>

                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full"
                    style={{ width: `${Math.max(0, Math.min(100, parseFloat(share)))}%` }}
                  />
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>A/C: {item.bank.account_no}</span>
                  <span>{item.txCount} txs</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
