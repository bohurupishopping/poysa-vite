import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DateRange } from '@/services/accountingService';
import { AccountDetail } from '@/integrations/supabase/manager-types';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface TradingAccountSectionProps {
    tradingAccount: {
        sales: {
            total: number;
            accounts: AccountDetail[];
        };
        costOfGoodsSold: {
            total: number;
            accounts: AccountDetail[];
        };
        directExpenses: {
            total: number;
            accounts: AccountDetail[];
        };
    };
    grossProfit: number;
    dateRange: DateRange;
}

export function TradingAccountSection({ tradingAccount, grossProfit, dateRange }: TradingAccountSectionProps) {
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

    const isGrossProfit = grossProfit >= 0;

    return (
        <Card className="shadow-sm">
            <CardHeader className="border-b border-border/50 pb-4">
                <CardTitle className="text-xl font-semibold text-foreground flex items-center justify-between">
                    <span>Trading Account</span>
                    <span className={`text-lg font-bold ${isGrossProfit ? 'text-green-600' : 'text-red-600'}`}>
                        {isGrossProfit ? 'Profit' : 'Loss'}: {formatCurrency(Math.abs(grossProfit))}
                    </span>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                    For the period from {formatDate(dateRange.startDate)} to {formatDate(dateRange.endDate)}
                </p>
            </CardHeader>
            <CardContent className="p-0">
                <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Debit Side */}
                        <div>
                            <h3 className="font-semibold text-foreground mb-4 pb-2 border-b border-border/50">Debit</h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Cost of Goods Sold</span>
                                        <span className="font-mono font-medium">{formatCurrency(tradingAccount.costOfGoodsSold.total)}</span>
                                    </div>
                                    <AccountDetailsList accounts={tradingAccount.costOfGoodsSold.accounts} sectionKey="cogs" />
                                </div>
                                <div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Direct Expenses</span>
                                        <span className="font-mono font-medium">{formatCurrency(tradingAccount.directExpenses.total)}</span>
                                    </div>
                                    <AccountDetailsList accounts={tradingAccount.directExpenses.accounts} sectionKey="directExp" />
                                </div>
                                {isGrossProfit && (
                                    <div className="flex justify-between items-center pt-3 border-t border-border/50 mt-2">
                                        <span className="text-green-700 font-medium">Gross Profit c/d</span>
                                        <span className="font-mono font-semibold text-green-600">{formatCurrency(grossProfit)}</span>
                                    </div>
                                )}
                            </div>
                            <div className="mt-4 pt-3 border-t border-border/50">
                                <div className="flex justify-between items-center font-bold text-foreground">
                                    <span>Total</span>
                                    <span className="font-mono">{formatCurrency(tradingAccount.costOfGoodsSold.total + tradingAccount.directExpenses.total + (isGrossProfit ? grossProfit : 0))}</span>
                                </div>
                            </div>
                        </div>

                        {/* Credit Side */}
                        <div>
                            <h3 className="font-semibold text-foreground mb-4 pb-2 border-b border-border/50">Credit</h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Sales</span>
                                        <span className="font-mono font-medium">{formatCurrency(tradingAccount.sales.total)}</span>
                                    </div>
                                    <AccountDetailsList accounts={tradingAccount.sales.accounts} sectionKey="sales" />
                                </div>
                                {!isGrossProfit && (
                                    <div className="flex justify-between items-center pt-3 border-t border-border/50 mt-2">
                                        <span className="text-red-700 font-medium">Gross Loss c/d</span>
                                        <span className="font-mono font-semibold text-red-600">{formatCurrency(Math.abs(grossProfit))}</span>
                                    </div>
                                )}
                            </div>
                            <div className="mt-4 pt-3 border-t border-border/50">
                                <div className="flex justify-between items-center font-bold text-foreground">
                                    <span>Total</span>
                                    <span className="font-mono">{formatCurrency(tradingAccount.sales.total + (!isGrossProfit ? Math.abs(grossProfit) : 0))}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Trading Summary */}
                    <div className="mt-8 p-5 bg-card border border-border rounded-lg">
                        <h4 className="font-semibold text-foreground mb-4">Trading Summary</h4>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Sales Revenue</span>
                                <span className="font-mono">{formatCurrency(tradingAccount.sales.total)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Less: Cost of Goods Sold</span>
                                <span className="font-mono">({formatCurrency(tradingAccount.costOfGoodsSold.total)})</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Less: Direct Expenses</span>
                                <span className="font-mono">({formatCurrency(tradingAccount.directExpenses.total)})</span>
                            </div>
                            <div className="flex justify-between font-semibold pt-3 border-t border-border/50 text-base">
                                <span>Gross {isGrossProfit ? 'Profit' : 'Loss'}</span>
                                <span className={`font-mono ${isGrossProfit ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(Math.abs(grossProfit))}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}