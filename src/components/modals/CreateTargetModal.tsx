import { useState, useEffect } from "react";
import { Plus, Target, Calendar, TrendingUp } from "lucide-react";
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
import { useAuth } from "@/hooks/useAuth";
import { TargetMetric, TargetPeriod, Product } from "@/integrations/supabase/manager-types";

interface CreateTargetModalProps {
    onTargetCreated?: () => void;
    trigger?: React.ReactNode;
    isOpen?: boolean;
    onClose?: () => void;
}

interface TargetFormData {
    name: string;
    period: TargetPeriod | '';
    start_date: string;
    end_date: string;
    metric: TargetMetric | '';
    target_value: string;
    product_id: string;
    notes: string;
}

export function CreateTargetModal({ onTargetCreated, trigger, isOpen, onClose }: CreateTargetModalProps) {
    const { profile } = useAuth();
    const [open, setOpen] = useState(false);

    // Use external control if isOpen and onClose are provided
    const modalOpen = isOpen !== undefined ? isOpen : open;
    const handleOpenChange = (newOpen: boolean) => {
        if (onClose && !newOpen) {
            onClose();
        } else {
            setOpen(newOpen);
        }
    };
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<{ id: string; name: string; type: 'GOOD' | 'SERVICE' }[]>([]);
    const [formData, setFormData] = useState<TargetFormData>({
        name: "",
        period: "",
        start_date: "",
        end_date: "",
        metric: "",
        target_value: "",
        product_id: "all",
        notes: ""
    });
    const { toast } = useToast();

    useEffect(() => {
        if (modalOpen) {
            fetchProducts();
        }
    }, [modalOpen, profile?.company_id]);

    const fetchProducts = async () => {
        if (!profile?.company_id) return;

        try {
            const { data, error } = await supabase
                .from('products')
                .select('id, name, type')
                .eq('company_id', profile.company_id)
                .eq('is_active', true)
                .is('deleted_at', null)
                .order('name');

            if (error) throw error;
            setProducts(data || []);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const handleInputChange = (field: keyof TargetFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // Auto-calculate end date based on period
        if (field === 'period' || field === 'start_date') {
            const startDate = field === 'start_date' ? value : formData.start_date;
            const period = field === 'period' ? value : formData.period;

            if (startDate && period) {
                const start = new Date(startDate);
                let end = new Date(start);

                switch (period) {
                    case 'MONTHLY':
                        end.setMonth(end.getMonth() + 1);
                        end.setDate(end.getDate() - 1);
                        break;
                    case 'QUARTERLY':
                        end.setMonth(end.getMonth() + 3);
                        end.setDate(end.getDate() - 1);
                        break;
                    case 'YEARLY':
                        end.setFullYear(end.getFullYear() + 1);
                        end.setDate(end.getDate() - 1);
                        break;
                }

                if (period !== 'CUSTOM') {
                    setFormData(prev => ({
                        ...prev,
                        end_date: end.toISOString().split('T')[0]
                    }));
                }
            }
        }
    };

    const validateForm = (): boolean => {
        if (!formData.name.trim()) {
            toast({
                title: "Validation Error",
                description: "Target name is required",
                variant: "destructive",
            });
            return false;
        }

        if (!formData.period) {
            toast({
                title: "Validation Error",
                description: "Please select a target period",
                variant: "destructive",
            });
            return false;
        }

        if (!formData.start_date) {
            toast({
                title: "Validation Error",
                description: "Start date is required",
                variant: "destructive",
            });
            return false;
        }

        if (!formData.end_date) {
            toast({
                title: "Validation Error",
                description: "End date is required",
                variant: "destructive",
            });
            return false;
        }

        if (new Date(formData.end_date) <= new Date(formData.start_date)) {
            toast({
                title: "Validation Error",
                description: "End date must be after start date",
                variant: "destructive",
            });
            return false;
        }

        if (!formData.metric) {
            toast({
                title: "Validation Error",
                description: "Please select a target metric",
                variant: "destructive",
            });
            return false;
        }

        if (!formData.target_value || parseFloat(formData.target_value) <= 0) {
            toast({
                title: "Validation Error",
                description: "Target value must be greater than 0",
                variant: "destructive",
            });
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm() || !profile?.company_id) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('sales_targets')
                .insert([{
                    company_id: profile.company_id,
                    name: formData.name.trim(),
                    period: formData.period as TargetPeriod,
                    start_date: formData.start_date,
                    end_date: formData.end_date,
                    metric: formData.metric as TargetMetric,
                    target_value: parseFloat(formData.target_value),
                    product_id: formData.product_id === "all" ? null : formData.product_id || null,
                    notes: formData.notes.trim() || null,
                    created_by: 'MANAGER',
                    status: 'ACTIVE'
                }]);

            if (error) throw error;

            toast({
                title: "Success",
                description: "Performance target created successfully",
            });

            // Reset form
            setFormData({
                name: "",
                period: "",
                start_date: "",
                end_date: "",
                metric: "",
                target_value: "",
                product_id: "all",
                notes: ""
            });
            handleOpenChange(false);
            onTargetCreated?.();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to create target",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: string) => {
        if (!value) return '';
        const num = parseFloat(value);
        if (isNaN(num)) return value;
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(num);
    };

    return (
        <Dialog open={modalOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>

            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5" />
                            Create Performance Target
                        </DialogTitle>
                        <DialogDescription>
                            Set a new performance goal to track your business progress
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        {/* Basic Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Target Details</h3>

                            <div className="grid gap-2">
                                <Label htmlFor="name">
                                    Target Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange("name", e.target.value)}
                                    placeholder="e.g., Q1 Sales Target, Monthly Revenue Goal"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="period">
                                        Period <span className="text-red-500">*</span>
                                    </Label>
                                    <Select value={formData.period} onValueChange={(value) => handleInputChange("period", value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select period" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="MONTHLY">Monthly</SelectItem>
                                            <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                                            <SelectItem value="YEARLY">Yearly</SelectItem>
                                            <SelectItem value="CUSTOM">Custom Period</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="metric">
                                        Metric <span className="text-red-500">*</span>
                                    </Label>
                                    <Select value={formData.metric} onValueChange={(value) => handleInputChange("metric", value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select metric" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="REVENUE">Revenue</SelectItem>
                                            <SelectItem value="PROFIT">Profit</SelectItem>
                                            <SelectItem value="QUANTITY_SOLD">Quantity Sold</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="start_date">
                                        Start Date <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="start_date"
                                        type="date"
                                        value={formData.start_date}
                                        onChange={(e) => handleInputChange("start_date", e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="end_date">
                                        End Date <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="end_date"
                                        type="date"
                                        value={formData.end_date}
                                        onChange={(e) => handleInputChange("end_date", e.target.value)}
                                        disabled={formData.period && formData.period !== 'CUSTOM'}
                                        required
                                    />
                                    {formData.period && formData.period !== 'CUSTOM' && (
                                        <p className="text-xs text-gray-500">
                                            Auto-calculated based on selected period
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="target_value">
                                    Target Value <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="target_value"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.target_value}
                                    onChange={(e) => handleInputChange("target_value", e.target.value)}
                                    placeholder="Enter target value"
                                    required
                                />
                                {formData.target_value && (formData.metric === 'REVENUE' || formData.metric === 'PROFIT') && (
                                    <p className="text-xs text-gray-500">
                                        {formatCurrency(formData.target_value)}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="product_id">Product (Optional)</Label>
                                <Select value={formData.product_id || "all"} onValueChange={(value) => handleInputChange("product_id", value === "all" ? "" : value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a specific product (optional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Products</SelectItem>
                                        {products.map((product) => (
                                            <SelectItem key={product.id} value={product.id}>
                                                {product.name} ({product.type})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-gray-500">
                                    Leave empty to track across all products
                                </p>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    value={formData.notes}
                                    onChange={(e) => handleInputChange("notes", e.target.value)}
                                    placeholder="Additional notes or context for this target..."
                                    rows={3}
                                />
                            </div>
                        </div>

                        {/* Target Preview */}
                        {formData.name && formData.metric && formData.target_value && (
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp className="h-4 w-4 text-blue-600" />
                                    <h4 className="font-medium text-blue-900">Target Preview</h4>
                                </div>
                                <p className="text-sm text-blue-800">
                                    <strong>{formData.name}</strong> - Achieve{' '}
                                    {formData.metric === 'REVENUE' || formData.metric === 'PROFIT'
                                        ? formatCurrency(formData.target_value)
                                        : `${formData.target_value} units`
                                    } in {formData.metric.toLowerCase().replace('_', ' ')}
                                    {formData.start_date && formData.end_date && (
                                        <> from {new Date(formData.start_date).toLocaleDateString()} to {new Date(formData.end_date).toLocaleDateString()}</>
                                    )}
                                    {formData.product_id && formData.product_id !== "all" && products.find(p => p.id === formData.product_id) && (
                                        <> for {products.find(p => p.id === formData.product_id)?.name}</>
                                    )}
                                </p>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Creating..." : "Create Target"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}