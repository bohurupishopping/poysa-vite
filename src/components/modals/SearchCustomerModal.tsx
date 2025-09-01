import { useState, useEffect } from "react";
import { Search, Users, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { Customer } from "@/integrations/supabase/manager-types";
import { CustomerService } from "@/services/customerService";

interface SearchCustomerModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelectCustomer: (customer: Customer) => void;
}

export function SearchCustomerModal({ open, onOpenChange, onSelectCustomer }: SearchCustomerModalProps) {
    const { profile } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

    const searchCustomers = async (query: string) => {
        if (!profile?.company_id || query.length < 2) {
            setCustomers([]);
            return;
        }

        setLoading(true);
        try {
            const results = await CustomerService.searchCustomers(profile.company_id, query);
            setCustomers(results);
        } catch (error) {
            console.error('Error searching customers:', error);
            setCustomers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        if (searchTerm.trim()) {
            const timeout = setTimeout(() => {
                searchCustomers(searchTerm.trim());
            }, 300);
            setSearchTimeout(timeout);
        } else {
            setCustomers([]);
        }

        return () => {
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
        };
    }, [searchTerm]);

    const handleSelectCustomer = (customer: Customer) => {
        onSelectCustomer(customer);
        onOpenChange(false);
        setSearchTerm("");
        setCustomers([]);
    };

    const getCustomerDetails = (details: any) => {
        if (!details) return { email: null, phone: null };
        return {
            email: details.email || null,
            phone: details.phone || null,
        };
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Search Customers</DialogTitle>
                </DialogHeader>
                
                <div className="flex items-center gap-3 py-4 border-b">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            placeholder="Search by customer name, email, or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 h-10 rounded-full border-gray-200 focus:border-blue-300 focus:ring-blue-200"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            <span className="ml-2 text-gray-600">Searching...</span>
                        </div>
                    ) : customers.length > 0 ? (
                        <div className="overflow-y-auto h-full">
                            <Table>
                                <TableHeader className="bg-gray-50 sticky top-0">
                                    <TableRow>
                                        <TableHead className="font-semibold text-gray-700 py-3">Customer</TableHead>
                                        <TableHead className="font-semibold text-gray-700 py-3">Contact</TableHead>
                                        <TableHead className="font-semibold text-gray-700 py-3 text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {customers.map((customer) => {
                                        const details = getCustomerDetails(customer.details);
                                        return (
                                            <TableRow 
                                                key={customer.id} 
                                                className="hover:bg-gray-50 cursor-pointer"
                                                onClick={() => handleSelectCustomer(customer)}
                                            >
                                                <TableCell className="py-3">
                                                    <div>
                                                        <div className="font-medium text-gray-900">{customer.name}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-3">
                                                    <div className="space-y-1">
                                                        {details.email && (
                                                            <div className="flex items-center text-sm text-gray-600">
                                                                <Mail className="h-3 w-3 mr-1" />
                                                                {details.email}
                                                            </div>
                                                        )}
                                                        {details.phone && (
                                                            <div className="flex items-center text-sm text-gray-600">
                                                                <Phone className="h-3 w-3 mr-1" />
                                                                {details.phone}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-3 text-right">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSelectCustomer(customer);
                                                        }}
                                                        className="h-8 px-3 rounded-full border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
                                                    >
                                                        Select
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    ) : searchTerm.trim() ? (
                        <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-gray-50 to-gray-100/50">
                            <CardContent className="text-center py-12">
                                <div className="max-w-md mx-auto">
                                    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
                                        <Users className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No customers found</h3>
                                    <p className="text-gray-600">
                                        No customers match your search for "{searchTerm}"
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-blue-50 to-blue-100/50">
                            <CardContent className="text-center py-12">
                                <div className="max-w-md mx-auto">
                                    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-blue-200 flex items-center justify-center">
                                        <Search className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Search Customers</h3>
                                    <p className="text-gray-600">
                                        Enter a customer name, email, or phone number to search
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
