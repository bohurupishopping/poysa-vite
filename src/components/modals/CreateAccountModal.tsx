import { useState, useEffect } from "react";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CreateAccountModalProps {
  companyId: string;
  onAccountCreated?: () => void;
  trigger?: React.ReactNode;
}

interface Account {
  id: string;
  account_name: string;
  account_code: string | null;
}

export function CreateAccountModal({ companyId, onAccountCreated, trigger }: CreateAccountModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [parentAccounts, setParentAccounts] = useState<Account[]>([]);
  const [formData, setFormData] = useState({
    account_code: "",
    account_name: "",
    account_type: "",
    account_class: "",
    parent_account_id: "",
    description: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    const fetchParentAccounts = async () => {
      if (!open) return;

      const { data } = await supabase
        .from('chart_of_accounts')
        .select('id, account_name, account_code')
        .eq('company_id', companyId)
        .is('deleted_at', null)
        .eq('is_active', true)
        .order('account_code');
      
      if (data) setParentAccounts(data);
    };

    fetchParentAccounts();
  }, [open, companyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.account_name.trim() || !formData.account_class) return;

    setLoading(true);
    try {
      const accountData: any = {
        company_id: companyId,
        account_name: formData.account_name.trim(),
        account_class: formData.account_class,
        account_code: formData.account_code.trim() || null,
        account_type: formData.account_type.trim() || null,
        parent_account_id: formData.parent_account_id || null,
        description: formData.description.trim() || null,
      };

      const { error } = await supabase
        .from('chart_of_accounts')
        .insert([accountData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Account created successfully",
      });
      
      setFormData({
        account_code: "",
        account_name: "",
        account_type: "",
        account_class: "",
        parent_account_id: "",
        description: ""
      });
      setOpen(false);
      onAccountCreated?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="brand">
            <BookOpen className="mr-2 h-4 w-4" />
            New Account
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Account</DialogTitle>
            <DialogDescription>
              Add a new account to the chart of accounts.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="account_code" className="text-right">Code</Label>
              <Input
                id="account_code"
                value={formData.account_code}
                onChange={(e) => setFormData({...formData, account_code: e.target.value})}
                className="col-span-3"
                placeholder="Account code (optional)"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="account_name" className="text-right">Name *</Label>
              <Input
                id="account_name"
                value={formData.account_name}
                onChange={(e) => setFormData({...formData, account_name: e.target.value})}
                className="col-span-3"
                placeholder="Account name"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="account_class" className="text-right">Class *</Label>
              <Select value={formData.account_class} onValueChange={(value) => setFormData({...formData, account_class: value})}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select account class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asset">Asset</SelectItem>
                  <SelectItem value="liability">Liability</SelectItem>
                  <SelectItem value="equity">Equity</SelectItem>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="account_type" className="text-right">Type</Label>
              <Input
                id="account_type"
                value={formData.account_type}
                onChange={(e) => setFormData({...formData, account_type: e.target.value})}
                className="col-span-3"
                placeholder="Account type (optional)"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="parent_account" className="text-right">Parent Account</Label>
              <Select value={formData.parent_account_id} onValueChange={(value) => setFormData({...formData, parent_account_id: value})}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select parent account (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {parentAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.account_code ? `${account.account_code} - ` : ''}{account.account_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="col-span-3"
                placeholder="Account description"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.account_name.trim() || !formData.account_class}>
              {loading ? "Creating..." : "Create Account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}