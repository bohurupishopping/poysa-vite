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

interface DateFilterProps {
    asOfDate: string;
    onDateChange: (date: string) => void;
}

export function DateFilter({ asOfDate, onDateChange }: DateFilterProps) {
    const [isCustomOpen, setIsCustomOpen] = useState(false);
    const [tempDate, setTempDate] = useState(asOfDate);

    const getPresetDates = () => {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();

        return [
            {
                label: 'Today',
                value: today.toISOString().split('T')[0]
            },
            {
                label: 'End of Current Month',
                value: new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0]
            },
            {
                label: 'End of Current Quarter',
                value: new Date(currentYear, Math.floor(currentMonth / 3) * 3 + 3, 0).toISOString().split('T')[0]
            },
            {
                label: 'End of Financial Year',
                value: currentMonth < 3
                    ? new Date(currentYear, 2, 31).toISOString().split('T')[0]
                    : new Date(currentYear + 1, 2, 31).toISOString().split('T')[0]
            },
            {
                label: 'End of Previous Financial Year',
                value: currentMonth < 3
                    ? new Date(currentYear - 1, 2, 31).toISOString().split('T')[0]
                    : new Date(currentYear, 2, 31).toISOString().split('T')[0]
            }
        ];
    };

    const handlePresetSelect = (date: string) => {
        onDateChange(date);
    };

    const handleCustomApply = () => {
        onDateChange(tempDate);
        setIsCustomOpen(false);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className="flex items-center gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="min-w-[180px] justify-between shadow-sm hover:shadow">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{formatDate(asOfDate)}</span>
                        </div>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-2" sideOffset={8}>
                    <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">Select Date</div>
                    {getPresetDates().map((preset) => (
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
                        Custom Date...
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
                            <div className="font-medium text-foreground">Custom Date</div>
                            <div className="space-y-2">
                                <Label htmlFor="as-of-date" className="text-muted-foreground">As of Date</Label>
                                <Input
                                    id="as-of-date"
                                    type="date"
                                    value={tempDate}
                                    onChange={(e) => setTempDate(e.target.value)}
                                    className="w-full"
                                />
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