import { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Card } from '@/components/ui/card';
import { DateRange } from '@/services/accountingService';

interface DateRangeFilterProps {
    dateRange: DateRange;
    onDateRangeChange: (dateRange: DateRange) => void;
}

export function DateRangeFilter({ dateRange, onDateRangeChange }: DateRangeFilterProps) {
    const [isCustomOpen, setIsCustomOpen] = useState(false);
    const [tempDateRange, setTempDateRange] = useState(dateRange);

    const getPresetRanges = () => {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();

        return [
            {
                label: 'Current Financial Year',
                value: {
                    startDate: currentMonth < 3
                        ? new Date(currentYear - 1, 3, 1).toISOString().split('T')[0]
                        : new Date(currentYear, 3, 1).toISOString().split('T')[0],
                    endDate: today.toISOString().split('T')[0]
                }
            },
            {
                label: 'Previous Financial Year',
                value: {
                    startDate: currentMonth < 3
                        ? new Date(currentYear - 2, 3, 1).toISOString().split('T')[0]
                        : new Date(currentYear - 1, 3, 1).toISOString().split('T')[0],
                    endDate: currentMonth < 3
                        ? new Date(currentYear - 1, 2, 31).toISOString().split('T')[0]
                        : new Date(currentYear, 2, 31).toISOString().split('T')[0]
                }
            },
            {
                label: 'Current Quarter',
                value: {
                    startDate: new Date(currentYear, Math.floor(currentMonth / 3) * 3, 1).toISOString().split('T')[0],
                    endDate: today.toISOString().split('T')[0]
                }
            },
            {
                label: 'Current Month',
                value: {
                    startDate: new Date(currentYear, currentMonth, 1).toISOString().split('T')[0],
                    endDate: today.toISOString().split('T')[0]
                }
            }
        ];
    };

    const handlePresetSelect = (preset: DateRange) => {
        onDateRangeChange(preset);
    };

    const handleCustomApply = () => {
        onDateRangeChange(tempDateRange);
        setIsCustomOpen(false);
    };

    const formatDateRange = (range: DateRange) => {
        const start = new Date(range.startDate).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short'
        });
        const end = new Date(range.endDate).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
        return `${start} - ${end}`;
    };

    return (
        <div className="flex items-center gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="min-w-[180px] justify-between shadow-sm hover:shadow">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{formatDateRange(dateRange)}</span>
                        </div>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-2" sideOffset={8}>
                    <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">Select Period</div>
                    {getPresetRanges().map((preset) => (
                        <DropdownMenuItem
                            key={preset.label}
                            onClick={() => handlePresetSelect(preset.value)}
                            className="py-2"
                        >
                            {preset.label}
                        </DropdownMenuItem>
                    ))}
                    <DropdownMenuItem 
                        onClick={() => setIsCustomOpen(true)}
                        className="py-2 focus:bg-accent focus:text-accent-foreground"
                    >
                        Custom Range...
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Popover open={isCustomOpen} onOpenChange={setIsCustomOpen}>
                <PopoverTrigger asChild>
                    <div />
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
                    <Card className="border-0 shadow-none">
                        <div className="p-4 space-y-4">
                            <div className="font-medium text-foreground">Custom Date Range</div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="start-date" className="text-muted-foreground">Start Date</Label>
                                    <Input
                                        id="start-date"
                                        type="date"
                                        value={tempDateRange.startDate}
                                        onChange={(e) => setTempDateRange(prev => ({
                                            ...prev,
                                            startDate: e.target.value
                                        }))}
                                        className="w-full"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="end-date" className="text-muted-foreground">End Date</Label>
                                    <Input
                                        id="end-date"
                                        type="date"
                                        value={tempDateRange.endDate}
                                        onChange={(e) => setTempDateRange(prev => ({
                                            ...prev,
                                            endDate: e.target.value
                                        }))}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsCustomOpen(false)}
                                    className="shadow-sm"
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    size="sm" 
                                    onClick={handleCustomApply}
                                    className="shadow-sm"
                                >
                                    Apply
                                </Button>
                            </div>
                        </div>
                    </Card>
                </PopoverContent>
            </Popover>
        </div>
    );
}