import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Building2, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { CashBankAccountService } from "@/services/cashBankAccountService";
import { CashBankAccount } from "@/types/cashBankAccount";
import { supabase } from "@/integrations/supabase/client";

interface ChartOfAccount {
  id: string;
  account_name: string;
  account_type: string;
}

export default function CreateCashBankAccount() {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = Boolean(id);
    
    const [loading, setLoading] = useState(false);
    const [chartAccounts, setChartAccounts] = useState<ChartOfAccount[]>([]);
    const [formData, setFormData] = useState({
        account_name: "",
        account_type: "Bank" as "Bank" | "Cash",
        chart_of_account_id: "",
        account_details: {} as Record<string, any>,
        is_active: true,
    });
    const [bankDetails, setBankDetails] = useState({
        bank_name: "",
        account_number: "",
        ifsc_code: "",
        branch_name: "",
        account_holder_name: "",
    });

    useEffect(() => {
        fetchChartAccounts();
        if (isEditing && id) {
            fetchAccountData(id);
        }
    }, [id, isEditing]);

    const fetchChartAccounts = async () => {
        if (!profile?.company_id) return;

        try {
            const { data, error } = await supabase
                .from('chart_of_accounts')
                .select('id, account_name, account_type')
                .eq('company_id', profile.company_id)
                .in('account_type', ['ASSET', 'CURRENT_ASSET'])
                .eq('is_active', true)
                .is('deleted_at', null)
                .order('account_name');

            if (error) throw error;
            setChartAccounts(data || []);
        } catch (error) {
            console.error('Error fetching chart of accounts:', error);
        }
    };

    const fetchAccountData = async (accountId: string) => {
        try {
            const account = await CashBankAccountService.getAccountById(accountId);
            if (account) {
                // Convert account_details to Record<string, any> for form state
                const accountDetails = (account.account_details as any) || {};

                setFormData({
                    account_name: account.account_name,
                    account_type: account.account_type,
                    chart_of_account_id: account.chart_of_account_id,
                    account_details: accountDetails,
                    is_active: account.is_active,
                });

                // If it's a bank account, populate bank details
                if (account.account_type === 'Bank' && account.account_details) {
                    const details = account.account_details as any;
                    setBankDetails({
                        bank_name: details.bank_name || "",
                        account_number: details.account_number || "",
                        ifsc_code: details.ifsc_code || "",
                        branch_name: details.branch_name || "",
                        account_holder_name: details.account_holder_name || "",
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching account data:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile?.company_id) return;

        setLoading(true);
        try {
            const accountDetails = formData.account_type === 'Bank' ? bankDetails : {};
            
            if (isEditing && id) {
                await CashBankAccountService.updateAccount(id, {
                    account_name: formData.account_name,
                    account_type: formData.account_type,
                    account_details: accountDetails,
                    is_active: formData.is_active,
                });
            } else {
                await CashBankAccountService.createAccount({
                    company_id: profile.company_id,
                    chart_of_account_id: formData.chart_of_account_id,
                    account_name: formData.account_name,
                    account_type: formData.account_type,
                    account_details: accountDetails,
                });
            }

            navigate('/manager/operations/cash-bank');
        } catch (error) {
            console.error('Error saving account:', error);
            alert('Failed to save account. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleBankDetailsChange = (field: string, value: string) => {
        setBankDetails(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="p-6 lg:p-8">
            <div className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                    <Button
                        onClick={() => navigate('/manager/operations/cash-bank')}
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                </div>
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                        {isEditing ? 'Edit Cash/Bank Account' : 'Create Cash/Bank Account'}
                    </h1>
                    <p className="text-gray-600">
                        {isEditing ? 'Update account information' : 'Add a new cash or bank account to your system'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="max-w-2xl">
                <Card className="rounded-xl border border-gray-100/50 bg-white">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            {formData.account_type === 'Bank' ? (
                                <Building2 className="h-5 w-5 text-blue-600" />
                            ) : (
                                <Banknote className="h-5 w-5 text-green-600" />
                            )}
                            Account Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Account Name */}
                        <div className="space-y-2">
                            <Label htmlFor="account_name">Account Name *</Label>
                            <Input
                                id="account_name"
                                value={formData.account_name}
                                onChange={(e) => handleInputChange('account_name', e.target.value)}
                                placeholder="Enter account name"
                                required
                                className="rounded-lg"
                            />
                        </div>

                        {/* Account Type */}
                        <div className="space-y-2">
                            <Label htmlFor="account_type">Account Type *</Label>
                            <Select
                                value={formData.account_type}
                                onValueChange={(value) => handleInputChange('account_type', value)}
                            >
                                <SelectTrigger className="rounded-lg">
                                    <SelectValue placeholder="Select account type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Bank">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-4 w-4" />
                                            Bank Account
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="Cash">
                                        <div className="flex items-center gap-2">
                                            <Banknote className="h-4 w-4" />
                                            Cash Account
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Chart of Account */}
                        {!isEditing && (
                            <div className="space-y-2">
                                <Label htmlFor="chart_of_account_id">Linked Chart Account *</Label>
                                <Select
                                    value={formData.chart_of_account_id}
                                    onValueChange={(value) => handleInputChange('chart_of_account_id', value)}
                                >
                                    <SelectTrigger className="rounded-lg">
                                        <SelectValue placeholder="Select chart of account" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {chartAccounts.map((account) => (
                                            <SelectItem key={account.id} value={account.id}>
                                                {account.account_name} ({account.account_type})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Bank Details (only for Bank accounts) */}
                        {formData.account_type === 'Bank' && (
                            <div className="space-y-4 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                                <h3 className="font-semibold text-blue-900 mb-3">Bank Details</h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="bank_name">Bank Name</Label>
                                        <Input
                                            id="bank_name"
                                            value={bankDetails.bank_name}
                                            onChange={(e) => handleBankDetailsChange('bank_name', e.target.value)}
                                            placeholder="Enter bank name"
                                            className="rounded-lg"
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="account_number">Account Number</Label>
                                        <Input
                                            id="account_number"
                                            value={bankDetails.account_number}
                                            onChange={(e) => handleBankDetailsChange('account_number', e.target.value)}
                                            placeholder="Enter account number"
                                            className="rounded-lg"
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="ifsc_code">IFSC Code</Label>
                                        <Input
                                            id="ifsc_code"
                                            value={bankDetails.ifsc_code}
                                            onChange={(e) => handleBankDetailsChange('ifsc_code', e.target.value)}
                                            placeholder="Enter IFSC code"
                                            className="rounded-lg"
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="branch_name">Branch Name</Label>
                                        <Input
                                            id="branch_name"
                                            value={bankDetails.branch_name}
                                            onChange={(e) => handleBankDetailsChange('branch_name', e.target.value)}
                                            placeholder="Enter branch name"
                                            className="rounded-lg"
                                        />
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="account_holder_name">Account Holder Name</Label>
                                    <Input
                                        id="account_holder_name"
                                        value={bankDetails.account_holder_name}
                                        onChange={(e) => handleBankDetailsChange('account_holder_name', e.target.value)}
                                        placeholder="Enter account holder name"
                                        className="rounded-lg"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Active Status (only for editing) */}
                        {isEditing && (
                            <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-lg border border-gray-100">
                                <div>
                                    <Label htmlFor="is_active" className="text-sm font-medium">
                                        Account Status
                                    </Label>
                                    <p className="text-sm text-gray-600">
                                        {formData.is_active ? 'Account is active and can be used' : 'Account is inactive'}
                                    </p>
                                </div>
                                <Switch
                                    id="is_active"
                                    checked={formData.is_active}
                                    onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 mt-8">
                    <Button
                        type="submit"
                        disabled={loading || !formData.account_name || (!isEditing && !formData.chart_of_account_id)}
                        className="bg-blue-600 hover:bg-blue-700 rounded-full px-6"
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                            <Save className="mr-2 h-4 w-4" />
                        )}
                        {isEditing ? 'Update Account' : 'Create Account'}
                    </Button>
                    
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/manager/operations/cash-bank')}
                        className="rounded-full px-6"
                    >
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    );
}
