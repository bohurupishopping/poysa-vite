import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DateRange } from '@/services/accountingService';
import { AccountDetail } from '@/integrations/supabase/manager-types';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface ProfitLossAccountSectionProps {
    profitLossAccount: {
        otherIncome: {
            total: number;
            accounts: AccountDetail[];
        };
        totalIncome: number;
        indirectExpenses: {
            employeeBenefits: {
                total: number;
                accounts: AccountDetail[];
            };
            financeCosts: {
                total: number;
                accounts: AccountDetail[];
            };
            depreciationAmortization: {
                total: number;
                accounts: AccountDetail[];
            };
            otherExpenses: {
                total: number;
                accounts: AccountDetail[];
            };
        };
        totalIndirectExpenses: number;
    };
    grossProfit: number;
    profitBeforeTax: number;
    dateRange: DateRange;
}

export function ProfitLossAccountSection({
    profitLossAccount,
    grossProfit,
    profitBeforeTax,
    dateRange
}: ProfitLossAccountSectionProps) {
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

    const formatCurrency = (amount: number) => {
        return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const AccountDetailsList = ({ accounts, sectionKey }: { accounts: AccountDetail[], sectionKey: string }) => {
        if (accounts.length === 0) return null;

        const isExpanded = expandedSections[sectionKey];

        return (
            <div className="ml-4 mt-1">
                <button
                    onClick={() => toggleSection(sectionKey)}
                    className="flex items-center text-xs text-muted-foreground hover:text-foreground mb-1 transition-colors"
                    aria-label={isExpanded ? "Collapse accounts" : "Expand accounts"}
                >
                    {isExpanded ? <ChevronDown className="w-3 h-3 mr-1" /> : <ChevronRight className="w-3 h-3 mr-1" />}
                    View {accounts.length} account{accounts.length > 1 ? 's' : ''}
                </button>
                {isExpanded && (
                    <div className="space-y-1 pl-4 border-l-2 border-border/30 ml-1.5">
                        {accounts.map((account) => (
                            <div key={account.accountId} className="flex justify-between items-center text-xs py-1">
                                <span className="text-muted-foreground">{account.accountCode} - {account.accountName}</span>
                                <span className="font-mono">{formatCurrency(account.amount)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const expenseItems = [
        {
            label: 'Employee Benefits Expense',
            value: profitLossAccount.indirectExpenses.employeeBenefits.total,
            accounts: profitLossAccount.indirectExpenses.employeeBenefits.accounts,
            key: 'empBenefits'
        },
        {
            label: 'Finance Costs',
            value: profitLossAccount.indirectExpenses.financeCosts.total,
            accounts: profitLossAccount.indirectExpenses.financeCosts.accounts,
            key: 'financeCosts'
        },
        {
            label: 'Depreciation & Amortization',
            value: profitLossAccount.indirectExpenses.depreciationAmortization.total,
            accounts: profitLossAccount.indirectExpenses.depreciationAmortization.accounts,
            key: 'depreciation'
        },
        {
            label: 'Other Expenses',
            value: profitLossAccount.indirectExpenses.otherExpenses.total,
            accounts: profitLossAccount.indirectExpenses.otherExpenses.accounts,
            key: 'otherExp'
        }
    ];

    const isNetProfit = profitBeforeTax >= 0;
    const isGrossProfit = grossProfit >= 0;

    return (
        <Card className="shadow-sm">
            <CardHeader className="border-b border-border/50 pb-4">
                <CardTitle className="text-xl font-semibold text-foreground flex items-center justify-between">
                    <span>Profit & Loss Account</span>
                    <span className={`text-lg font-bold ${isNetProfit ? 'text-green-600' : 'text-red-600'}`}>
                        {isNetProfit ? 'Profit' : 'Loss'}: {formatCurrency(Math.abs(profitBeforeTax))}
                    </span>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                    For the period from {formatDate(dateRange.startDate)} to {formatDate(dateRange.endDate)}
                </p>
            </CardHeader>
            <CardContent className="p-0">
                <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Debit Side - Expenses */}
                        <div>
                            <h3 className="font-semibold text-foreground mb-4 pb-2 border-b border-border/50">Debit</h3>
                            <div className="space-y-4">
                                {/* Indirect Expenses */}
                                <div className="space-y-3">
                                    <h4 className="font-medium text-muted-foreground text-sm">Indirect Expenses:</h4>
                                    {expenseItems.map((item, index) => (
                                        item.value > 0 && (
                                            <div key={index} className="pl-4">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-muted-foreground text-sm">{item.label}</span>
                                                    <span className="font-mono font-medium">{formatCurrency(item.value)}</span>
                                                </div>
                                                <AccountDetailsList accounts={item.accounts} sectionKey={item.key} />
                                            </div>
                                        )
                                    ))}
                                </div>

                                {/* Net Profit */}
                                {isNetProfit && (
                                    <div className="flex justify-between items-center pt-3 border-t border-border/50 mt-2">
                                        <span className="text-green-700 font-medium">Net Profit</span>
                                        <span className="font-mono font-semibold text-green-600">{formatCurrency(profitBeforeTax)}</span>
                                    </div>
                                )}
                            </div>
                            <div className="mt-4 pt-3 border-t border-border/50">
                                <div className="flex justify-between items-center font-bold text-foreground">
                                    <span>Total</span>
                                    <span className="font-mono">{formatCurrency(profitLossAccount.totalIncome)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Credit Side - Income */}
                        <div>
                            <h3 className="font-semibold text-foreground mb-4 pb-2 border-b border-border/50">Credit</h3>
                            <div className="space-y-4">
                                {isGrossProfit ? (
                                    <div className="flex justify-between items-center">
                                        <span className="text-green-700 font-medium">Gross Profit b/d</span>
                                        <span className="font-mono font-semibold text-green-600">{formatCurrency(grossProfit)}</span>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-center">
                                        <span className="text-red-700 font-medium">Gross Loss b/d</span>
                                        <span className="font-mono font-semibold text-red-600">{formatCurrency(Math.abs(grossProfit))}</span>
                                    </div>
                                )}

                                {profitLossAccount.otherIncome.total > 0 && (
                                    <div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">Other Income</span>
                                            <span className="font-mono font-medium">{formatCurrency(profitLossAccount.otherIncome.total)}</span>
                                        </div>
                                        <AccountDetailsList accounts={profitLossAccount.otherIncome.accounts} sectionKey="otherIncome" />
                                    </div>
                                )}

                                {/* Net Loss */}
                                {!isNetProfit && (
                                    <div className="flex justify-between items-center pt-3 border-t border-border/50 mt-2">
                                        <span className="text-red-700 font-medium">Net Loss</span>
                                        <span className="font-mono font-semibold text-red-600">{formatCurrency(Math.abs(profitBeforeTax))}</span>
                                    </div>
                                )}
                            </div>
                            <div className="mt-4 pt-3 border-t border-border/50">
                                <div className="flex justify-between items-center font-bold text-foreground">
                                    <span>Total</span>
                                    <span className="font-mono">{formatCurrency(profitLossAccount.totalIncome)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Expense Breakdown */}
                    <div className="mt-8 p-5 bg-card border border-border rounded-lg">
                        <h4 className="font-semibold text-foreground mb-4">Expense Breakdown</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {expenseItems.map((item, index) => (
                                item.value > 0 && (
                                    <div key={index} className="flex justify-between text-sm py-1.5">
                                        <span className="text-muted-foreground">{item.label}</span>
                                        <span className="font-mono font-medium">{formatCurrency(item.value)}</span>
                                    </div>
                                )
                            ))}
                            <div className="flex justify-between font-semibold pt-3 border-t border-border/50 col-span-full text-base">
                                <span>Total Indirect Expenses</span>
                                <span className="font-mono">{formatCurrency(profitLossAccount.totalIndirectExpenses)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Profit Margin Analysis */}
                    <div className="mt-6 p-5 bg-card border border-border rounded-lg">
                        <h4 className="font-semibold text-foreground mb-4">Key Ratios</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="text-center p-3 bg-muted/30 rounded-lg">
                                <p className="text-muted-foreground">Gross Profit Margin</p>
                                <p className="font-semibold text-foreground mt-1">
                                    {profitLossAccount.totalIncome > 0
                                        ? `${((Math.abs(grossProfit) / profitLossAccount.totalIncome) * 100).toFixed(2)}%`
                                        : 'N/A'
                                    }
                                </p>
                            </div>
                            <div className="text-center p-3 bg-muted/30 rounded-lg">
                                <p className="text-muted-foreground">Net Profit Margin</p>
                                <p className={`font-semibold mt-1 ${isNetProfit ? 'text-green-600' : 'text-red-600'}`}>
                                    {profitLossAccount.totalIncome > 0
                                        ? `${((Math.abs(profitBeforeTax) / profitLossAccount.totalIncome) * 100).toFixed(2)}%`
                                        : 'N/A'
                                    }
                                </p>
                            </div>
                            <div className="text-center p-3 bg-muted/30 rounded-lg">
                                <p className="text-muted-foreground">Expense Ratio</p>
                                <p className="font-semibold text-foreground mt-1">
                                    {profitLossAccount.totalIncome > 0
                                        ? `${((profitLossAccount.totalIndirectExpenses / profitLossAccount.totalIncome) * 100).toFixed(2)}%`
                                        : 'N/A'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}