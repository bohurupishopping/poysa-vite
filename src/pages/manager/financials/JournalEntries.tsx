import { useEffect, useState } from "react";
import { Plus, Search, Eye, FileText, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { JournalEntryWithLines } from "@/integrations/supabase/manager-types";
import { useNavigate } from "react-router-dom";

export default function ManagerJournalEntries() {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [journalEntries, setJournalEntries] = useState<JournalEntryWithLines[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchJournalEntries = async () => {
            if (!profile?.company_id) return;

            try {
                const { data, error } = await supabase
                    .from('journal_entries')
                    .select(`
            *,
            lines:journal_lines(
              *,
              account:chart_of_accounts(*)
            )
          `)
                    .eq('company_id', profile.company_id)
                    .order('entry_date', { ascending: false })
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setJournalEntries(data || []);
            } catch (error) {
                console.error('Error fetching journal entries:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchJournalEntries();
    }, [profile?.company_id]);

    const filteredEntries = journalEntries.filter(entry =>
        entry.narration.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.source_document_type?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getEntryTotal = (lines: any[]) => {
        return lines.reduce((sum, line) => sum + (line.debit || 0), 0);
    };

    const getDocumentTypeColor = (type: string | null) => {
        switch (type) {
            case 'sales_invoice':
                return 'bg-green-100 text-green-800';
            case 'purchase_bill':
                return 'bg-orange-100 text-orange-800';
            case 'invoice_payment':
                return 'bg-blue-100 text-blue-800';
            case 'bill_payment':
                return 'bg-purple-100 text-purple-800';
            case 'journal_voucher':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getDocumentTypeLabel = (type: string | null) => {
        switch (type) {
            case 'sales_invoice':
                return 'Sales Invoice';
            case 'purchase_bill':
                return 'Purchase Bill';
            case 'invoice_payment':
                return 'Invoice Payment';
            case 'bill_payment':
                return 'Bill Payment';
            case 'journal_voucher':
                return 'Journal Voucher';
            default:
                return 'Manual Entry';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Loading journal entries...</span>
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-8">
            <div className="mb-8 flex flex-col gap-6">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Journal Entries</h1>
                        <p className="text-gray-600">View all accounting transactions and entries</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
                        {/* Search */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1 lg:flex-none">
                            <div className="relative w-full sm:w-auto">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    placeholder="Search entries..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 h-9 lg:h-10 w-full sm:w-64 rounded-full border-gray-200 focus:border-blue-300 focus:ring-blue-200"
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 lg:gap-3">
                            <Button
                                className="h-9 lg:h-10 px-3 lg:px-4 bg-green-600 hover:bg-green-700 rounded-full transition-colors"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                <span className="hidden sm:inline">New Entry</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-blue-50 to-blue-100/50 hover:shadow-sm transition-all duration-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-semibold text-blue-700">Total Entries</CardTitle>
                        <FileText className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-2xl lg:text-3xl font-bold text-blue-900 mb-1">{filteredEntries.length}</div>
                        <p className="text-xs text-blue-600/70">All time</p>
                    </CardContent>
                </Card>

                <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-green-50 to-green-100/50 hover:shadow-sm transition-all duration-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-semibold text-green-700">This Month</CardTitle>
                        <Calendar className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-2xl lg:text-3xl font-bold text-green-900 mb-1">
                            {filteredEntries.filter(entry => {
                                const entryDate = new Date(entry.entry_date);
                                const now = new Date();
                                return entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
                            }).length}
                        </div>
                        <p className="text-xs text-green-600/70">Current month</p>
                    </CardContent>
                </Card>

                <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-purple-50 to-purple-100/50 hover:shadow-sm transition-all duration-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-semibold text-purple-700">Auto Generated</CardTitle>
                        <FileText className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-2xl lg:text-3xl font-bold text-purple-900 mb-1">
                            {filteredEntries.filter(entry => entry.source_document_type).length}
                        </div>
                        <p className="text-xs text-purple-600/70">From transactions</p>
                    </CardContent>
                </Card>

                <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-orange-50 to-orange-100/50 hover:shadow-sm transition-all duration-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-semibold text-orange-700">Manual Entries</CardTitle>
                        <FileText className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-2xl lg:text-3xl font-bold text-orange-900 mb-1">
                            {filteredEntries.filter(entry => !entry.source_document_type).length}
                        </div>
                        <p className="text-xs text-orange-600/70">Manual vouchers</p>
                    </CardContent>
                </Card>
            </div>

            {/* Journal Entries Table */}
            <Card className="rounded-xl border border-gray-100/50 bg-white overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-gray-50/30">
                                <TableRow className="hover:bg-gray-50/30">
                                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Date</TableHead>
                                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Narration</TableHead>
                                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Source</TableHead>
                                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Amount</TableHead>
                                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Lines</TableHead>
                                    <TableHead className="text-right font-semibold text-gray-700 py-4 px-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredEntries.map((entry) => (
                                    <TableRow key={entry.id} className="hover:bg-gray-50/20 transition-colors">
                                        <TableCell className="py-4 px-6">
                                            <div className="font-medium">
                                                {new Date(entry.entry_date).toLocaleDateString()}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {new Date(entry.created_at).toLocaleTimeString()}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <div className="font-medium text-gray-900 max-w-xs truncate">
                                                {entry.narration}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <Badge
                                                variant="outline"
                                                className={`text-xs rounded-full px-3 py-1 ${getDocumentTypeColor(entry.source_document_type)}`}
                                            >
                                                {getDocumentTypeLabel(entry.source_document_type)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <div className="font-semibold text-gray-900">
                                                {formatCurrency(getEntryTotal(entry.lines))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <div className="text-sm text-gray-600">
                                                {entry.lines.length} line{entry.lines.length !== 1 ? 's' : ''}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right py-4 px-6">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 px-3 rounded-full border-gray-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all duration-200 text-xs"
                                                onClick={() => navigate(`/manager/financials/journal/${entry.id}`)}
                                            >
                                                <Eye className="h-3 w-3 mr-1" />
                                                View
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {filteredEntries.length === 0 && (
                <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-gray-50 to-gray-100/50">
                    <CardContent className="text-center py-16 px-8">
                        <div className="max-w-md mx-auto">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
                                <FileText className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No journal entries found</h3>
                            <p className="text-gray-600 mb-6">
                                {searchTerm ? 'Try adjusting your search criteria or clear filters to see all entries' : 'Journal entries will appear here as transactions are processed'}
                            </p>
                            {(!searchTerm) && (
                                <Button
                                    className="bg-green-600 hover:bg-green-700 rounded-full px-6 transition-colors"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create First Entry
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
