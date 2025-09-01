import React, { useState } from "react";
import {
    Building2, Users, BarChart3, Home, TrendingUp,
    DollarSign, BookOpen, ShoppingCart, Package, FileText,
    Warehouse, CreditCard, Receipt, ChevronLeft,
    ChevronRight, ChevronDown, ChevronUp, LogOut, Target,
    Calculator, Banknote
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const navigationGroups = [
    {
        title: "Overview",
        items: [
            { title: "Dashboard", href: "/manager/dashboard", icon: Home, color: "text-blue-600" },
        ]
    },
    {
        title: "Financial",
        items: [
            { title: "Financial Dashboard", href: "/manager/financials/dashboard", icon: TrendingUp, color: "text-purple-600" },
            { title: "Chart of Accounts", href: "/manager/financials/accounts", icon: BookOpen, color: "text-purple-600" },
        ]
    },
    {
        title: "Sales & Purchases",
        items: [
            { title: "Sales Invoices", href: "/manager/sales/invoices", icon: Receipt, color: "text-orange-600" },
            { title: "Estimates", href: "/manager/sales/estimates", icon: Calculator, color: "text-orange-600" },
            { title: "Purchase Orders", href: "/manager/purchases/purchase-orders", icon: ShoppingCart, color: "text-orange-600" },
            { title: "Purchase Bills", href: "/manager/purchases/bills", icon: CreditCard, color: "text-orange-600" },
        ]
    },
    {
        title: "Operations",
        items: [
            { title: "Products & Services", href: "/manager/operations/products", icon: Package, color: "text-indigo-600" },
            { title: "Cash & Bank", href: "/manager/operations/cash-bank", icon: Banknote, color: "text-indigo-600" },
            { title: "Customers", href: "/manager/customers", icon: Users, color: "text-indigo-600" },
            { title: "Suppliers", href: "/manager/suppliers", icon: Building2, color: "text-indigo-600" },
            { title: "Inventory", href: "/manager/operations/inventory", icon: Warehouse, color: "text-indigo-600" },
            { title: "Journal Entries", href: "/manager/financials/journal", icon: FileText, color: "text-indigo-600" },
        ]
    },
    {
        title: "Performance",
        items: [
            { title: "Targets & Goals", href: "/manager/performance/targets", icon: Target, color: "text-green-600" },
        ]
    },
    {
        title: "Reports",
        items: [
            { title: "Trial Balance", href: "/manager/financials/trial-balance", icon: BarChart3, color: "text-green-600" },
            { title: "Profit & Loss", href: "/manager/financials/profit-loss", icon: DollarSign, color: "text-green-600" },
            { title: "Balance Sheet", href: "/manager/financials/balance-sheet", icon: ShoppingCart, color: "text-green-600" },
        ]
    },
];

interface ManagerSidebarProps {
    isCollapsed: boolean;
    onToggle: () => void;
}

export function ManagerSidebar({ isCollapsed, onToggle }: ManagerSidebarProps) {
    const { profile, user, signOut } = useAuth();
    const { toast } = useToast();
    const location = useLocation();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
        "Overview": true,
        "Financial": true,
        "Sales & Purchases": true,
        "Operations": true,
        "Performance": true,
        "Reports": true,
    });
    const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);

    const handleSignOut = async () => {
        await signOut();
        toast({
            title: "Signed Out",
            description: "You have been successfully signed out.",
        });
        window.location.href = '/auth';
    };

    const getRoleBadgeColor = (role?: string) => {
        switch (role?.toLowerCase()) {
            case "admin":
                return "bg-purple-100 text-purple-800 border-purple-200";
            case "manager":
                return "bg-blue-100 text-blue-800 border-blue-200";
            case "staff":
                return "bg-green-100 text-green-800 border-green-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    return (
        <div className={cn(
            "bg-white border-r border-gray-200/60 flex flex-col transition-all duration-300 shadow-lg fixed left-0 top-0 h-screen z-40",
            isCollapsed ? "w-16" : "w-64"
        )}>
            {/* Header */}
            <div className="border-b border-gray-200/60 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                <div className="flex items-center justify-between p-3">
                    {!isCollapsed && (
                        <div className="flex items-center">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm mr-3">
                                <BarChart3 className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-base font-bold">Synergetics</h1>
                                <span className="text-xs text-white/70">Manager Panel</span>
                            </div>
                        </div>
                    )}
                    {isCollapsed && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm mx-auto">
                            <BarChart3 className="h-5 w-5 text-white" />
                        </div>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onToggle}
                        className="ml-auto rounded-lg hover:bg-white/20 p-1.5 h-7 w-7 text-white"
                    >
                        {isCollapsed ? (
                            <ChevronRight className="h-3.5 w-3.5" />
                        ) : (
                            <ChevronLeft className="h-3.5 w-3.5" />
                        )}
                    </Button>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-2 py-3 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                {navigationGroups.map((group) => {
                    const isGroupExpanded = expandedGroups[group.title] || hoveredGroup === group.title;
                    const hasActiveItem = group.items.some(item => location.pathname === item.href);

                    return (
                        <div
                            key={group.title}
                            className="mb-1.5 last:mb-0"
                            onMouseEnter={() => setHoveredGroup(group.title)}
                            onMouseLeave={() => setHoveredGroup(null)}
                        >
                            {/* Group Header */}
                            <div
                                className={cn(
                                    "flex items-center px-2.5 py-1.5 rounded-lg cursor-pointer transition-all duration-200",
                                    hasActiveItem ? "bg-green-50 border border-green-200" : "hover:bg-gray-50",
                                    isCollapsed ? "justify-center" : "justify-between"
                                )}
                                onClick={() => setExpandedGroups(prev => ({
                                    ...prev,
                                    [group.title]: !prev[group.title]
                                }))}
                            >
                                {!isCollapsed ? (
                                    <>
                                        <h3 className={cn(
                                            "text-xs font-semibold uppercase tracking-wide",
                                            hasActiveItem ? "text-green-700" : "text-gray-500"
                                        )}>
                                            {group.title}
                                        </h3>
                                        <ChevronDown className={cn(
                                            "h-3.5 w-3.5 transition-transform duration-200",
                                            isGroupExpanded ? "transform rotate-180" : "",
                                            hasActiveItem ? "text-green-600" : "text-gray-400"
                                        )} />
                                    </>
                                ) : (
                                    <div className={cn(
                                        "h-1.5 w-1.5 rounded-full",
                                        hasActiveItem ? "bg-green-500" : "bg-gray-300"
                                    )} />
                                )}
                            </div>

                            {/* Group Items */}
                            <div className={cn(
                                "overflow-hidden transition-all duration-300 ease-in-out",
                                isGroupExpanded ? "max-h-96 opacity-100 mt-1" : "max-h-0 opacity-0"
                            )}>
                                <ul className="space-y-1 pl-1">
                                    {group.items.map((item) => {
                                        const Icon = item.icon;
                                        const isActive = location.pathname === item.href;

                                        return (
                                            <li key={item.href}>
                                                <NavLink
                                                    to={item.href}
                                                    className={cn(
                                                        "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative group",
                                                        isActive
                                                            ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-sm"
                                                            : "text-gray-700 hover:bg-green-50 hover:text-green-900"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "flex items-center justify-center",
                                                        isActive ? "text-white" : item.color,
                                                        isCollapsed ? "mx-auto" : "mr-2.5"
                                                    )}>
                                                        <Icon className="h-4 w-4" />
                                                    </div>
                                                    {!isCollapsed && (
                                                        <span className={cn(
                                                            "transition-all duration-200",
                                                            isActive && "font-semibold"
                                                        )}>{item.title}</span>
                                                    )}
                                                    {isActive && (
                                                        <div className="absolute right-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-l-full bg-white" />
                                                    )}
                                                </NavLink>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        </div>
                    );
                })}
            </nav>

            {/* User Profile */}
            <div className="p-3 border-t border-gray-200/60 bg-slate-50/50">
                {!isCollapsed ? (
                    <div className="relative">
                        <div
                            className="bg-white p-2.5 rounded-lg shadow-sm border border-gray-200/60 hover:shadow-md transition-all duration-200 cursor-pointer"
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                        >
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-semibold shadow-sm">
                                    {profile?.full_name?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "M"}
                                </div>
                                <div className="flex flex-col flex-1">
                                    <p className="text-sm font-medium text-gray-900 truncate">{profile?.full_name || "Manager"}</p>
                                    <p className="text-xs text-gray-500 truncate">{user?.email || "manager@synergetics.com"}</p>
                                    <div className="mt-0.5">
                                        <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium capitalize border ${getRoleBadgeColor(profile?.role)}`}>
                                            {profile?.role || "Manager"}
                                        </span>
                                    </div>
                                </div>
                                <ChevronUp className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${isProfileOpen ? '' : 'transform rotate-180'}`} />
                            </div>
                        </div>

                        {isProfileOpen && (
                            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-10">
                                <button
                                    onClick={handleSignOut}
                                    className="w-full px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="relative">
                        <div
                            className="w-full flex items-center justify-center p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                        >
                            <div className="h-7 w-7 flex items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-semibold shadow-sm">
                                {profile?.full_name?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "M"}
                            </div>
                        </div>

                        {isProfileOpen && (
                            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-10 w-44">
                                <div className="p-2.5 border-b border-gray-100">
                                    <p className="text-sm font-medium text-gray-900 truncate">{profile?.full_name || "Manager"}</p>
                                    <p className="text-xs text-gray-500 truncate">{user?.email || "manager@synergetics.com"}</p>
                                </div>
                                <button
                                    onClick={handleSignOut}
                                    className="w-full px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
