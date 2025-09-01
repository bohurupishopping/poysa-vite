import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FileText, ArrowLeft, Calendar, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface JournalEntryDetail {
    id: string;
    entry_date: string;
    narration: string;
    source_document_type: string | null;
    source_document_id: string | null;
    created_at: string;
    journal_lines: Array<{
        id: string;
        account_id: string;
        debit: number;
        credit: number;
        chart_of_accounts: {
            account_name: string;
            account_code: string | null;
            account_class: string;
        };
    }>;
}

export default function JournalInfo() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [journalEntry, setJournalEntry] = useState<JournalEntryDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchJournalEntryDetail = async () => {
            if (!id) return;

            try {
                const { data } = await supabase
                    .from('journal_entries')
                    .select(`
            *,
            journal_lines (
              id,
              account_id,
              debit,
              credit,
              chart_of_accounts (
                account_name,
                account_code,
                account_class
              )
            )
          `)
                    .eq('id', id)
                    .single();

                if (data) setJournalEntry(data);
            } catch (error) {
                console.error('Error fetching journal entry detail:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchJournalEntryDetail();
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Loading journal entry details...</span>
            </div>
        );
    }

    if (!journalEntry) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Journal Entry not found</h3>
                    <p className="text-gray-500">The journal entry you're looking for doesn't exist.</p>
                </div>
            </div>
        );
    }

    const totalDebits = journalEntry.journal_lines.reduce((sum, line) => sum + Number(line.debit), 0);
    const totalCredits = journalEntry.journal_lines.reduce((sum, line) => sum + Number(line.credit), 0);

    const getAccountClassBadge = (accountClass: string) => {
        const classColors: Record<string, string> = {
            'asset': 'bg-blue-100 text-blue-800',
            'liability': 'bg-red-100 text-red-800',
            'equity': 'bg-purple-100 text-purple-800',
            'revenue': 'bg-green-100 text-green-800',
            'expense': 'bg-orange-100 text-orange-800'
        };
        return classColors[accountClass] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="p-8">
            <div className="mb-8 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/admin/financials/journal')}
                        className="h-10 px-4 rounded-full"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Journal Entries
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Journal Entry Details</h1>
                        <p className="text-gray-600">Double-entry bookkeeping record information</p>
                    </div>
                </div>
            </div>

            {/* Journal Entry Header */}
            <div className="grid gap-6 md:grid-cols-2 mb-8">
                <Card className="rounded-lg border-0 shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                            <FileText className="h-5 w-5 text-blue-600" />
                            Entry Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-500">Entry Date</p>
                                <p className="font-medium text-gray-900">{new Date(journalEntry.entry_date).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-500">Created Date</p>
                                <p className="font-medium text-gray-900">{new Date(journalEntry.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <FileText className="h-4 w-4 text-gray-400 mt-1" />
                            <div>
                                <p className="text-sm text-gray-500">Narration</p>
                                <p className="font-medium text-gray-900">{journalEntry.narration}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-lg border-0 shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                            <Building2 className="h-5 w-5 text-green-600" />
                            Source Document
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <div>
                                <p className="text-sm text-gray-500">Document Type</p>
                                <p className="font-medium text-gray-900">{journalEntry.source_document_type || 'Manual Entry'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <div>
                                <p className="text-sm text-gray-500">Document ID</p>
                                <p className="font-mono text-sm text-gray-900">{journalEntry.source_document_id || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t">
                            <span className="text-sm text-gray-500">Total Debits</span>
                            <span className="font-semibold text-green-600">₹{totalDebits.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Total Credits</span>
                            <span className="font-semibold text-blue-600">₹{totalCredits.toLocaleString()}</span>
                        </div>
                        <div className="pt-2">
                            <Badge
                                variant={totalDebits === totalCredits ? "default" : "destructive"}
                                className="rounded-full"
                            >
                                {totalDebits === totalCredits ? "Balanced" : "Unbalanced"}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Journal Entry Lines */}
            <div className="bg-white rounded-lg border shadow-sm">
                <div className="p-6 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">Journal Entry Lines</h3>
                    <p className="text-sm text-gray-600 mt-1">Detailed breakdown of debits and credits</p>
                </div>
                <div className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Account Code</TableHead>
                                <TableHead>Account Name</TableHead>
                                <TableHead>Account Class</TableHead>
                                <TableHead className="text-right">Debit Amount</TableHead>
                                <TableHead className="text-right">Credit Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {journalEntry.journal_lines.map((line) => (
                                <TableRow key={line.id}>
                                    <TableCell className="font-mono text-sm">
                                        {line.chart_of_accounts.account_code || '-'}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {line.chart_of_accounts.account_name}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            className={`rounded-full ${getAccountClassBadge(line.chart_of_accounts.account_class)}`}
                                        >
                                            {line.chart_of_accounts.account_class}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">
                                        {Number(line.debit) > 0 ? `₹${Number(line.debit).toLocaleString()}` : '-'}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">
                                        {Number(line.credit) > 0 ? `₹${Number(line.credit).toLocaleString()}` : '-'}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {/* Totals Row */}
                            <TableRow className="bg-gray-50 font-semibold">
                                <TableCell colSpan={3} className="text-right">
                                    <strong>Totals:</strong>
                                </TableCell>
                                <TableCell className="text-right">
                                    <strong>₹{totalDebits.toLocaleString()}</strong>
                                </TableCell>
                                <TableCell className="text-right">
                                    <strong>₹{totalCredits.toLocaleString()}</strong>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}