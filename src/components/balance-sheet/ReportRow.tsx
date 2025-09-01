import { BalanceSheetNode } from '@/integrations/supabase/manager-types';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface ReportRowProps {
    label?: string;
    value?: number;
    node?: BalanceSheetNode;
    isTotal?: boolean;
    isSubtotal?: boolean;
    level?: number;
}

export function ReportRow({
    label,
    value,
    node,
    isTotal = false,
    isSubtotal = false,
    level = 0
}: ReportRowProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const formatCurrency = (amount: number) => {
        return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const getRowClasses = () => {
        if (isTotal) {
            return "flex justify-between items-center font-bold text-foreground text-lg py-2";
        }
        if (isSubtotal) {
            return "flex justify-between items-center font-semibold text-foreground py-2";
        }
        return "flex justify-between items-center text-muted-foreground py-1.5";
    };

    const getIndentStyle = () => {
        return level > 0 ? { marginLeft: `${level * 20}px` } : {};
    };

    // If using the new node structure
    if (node) {
        const hasChildren = node.accounts && node.accounts.length > 0;

        return (
            <div>
                <div className={getRowClasses()} style={getIndentStyle()}>
                    <div className="flex items-center w-full">
                        {hasChildren && (
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="mr-2 p-1 hover:bg-accent rounded transition-colors"
                                aria-label={isExpanded ? "Collapse" : "Expand"}
                            >
                                {isExpanded ?
                                    <ChevronDown className="w-4 h-4 text-muted-foreground" /> :
                                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                }
                            </button>
                        )}
                        {!hasChildren && <div className="w-6" />}
                        <span className={`${isTotal ? 'font-bold' : isSubtotal ? 'font-semibold' : ''} flex-1`}>
                            {node.accountName}
                        </span>
                    </div>
                    <span className={`text-right font-mono ${node.total < 0 ? 'text-red-600' : isTotal ? 'font-bold' : isSubtotal ? 'font-semibold' : ''}`}>
                        {formatCurrency(Math.abs(node.total))}
                        {node.total < 0 && ' (Dr)'}
                    </span>
                </div>

                {hasChildren && isExpanded && (
                    <div className="mt-1 space-y-1 border-l-2 border-border/30 pl-2 ml-3">
                        {node.accounts.map((childNode, index) => (
                            <ReportRow
                                key={childNode.accountId || index}
                                node={childNode}
                                level={level + 1}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Fallback to old structure
    return (
        <div className={getRowClasses()} style={getIndentStyle()}>
            <span className={`${isTotal ? 'font-bold' : isSubtotal ? 'font-semibold' : ''}`}>
                {label}
            </span>
            <span className={`text-right font-mono ${value && value < 0 ? 'text-red-600' : isTotal ? 'font-bold' : isSubtotal ? 'font-semibold' : ''}`}>
                {formatCurrency(Math.abs(value || 0))}
                {value && value < 0 && ' (Dr)'}
            </span>
        </div>
    );
}