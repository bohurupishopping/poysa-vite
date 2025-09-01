import { FC } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Clock } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DateFilterProps {
    date: string;
    onDateChange: (date: string) => void;
}

export const DateFilter: FC<DateFilterProps> = ({ date, onDateChange }) => {
    const getPresetDate = (daysAgo: number): string => {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        return date.toISOString().split('T')[0];
    };

    const getMonthEnd = (): string => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    };

    const getQuarterEnd = (): string => {
        const now = new Date();
        const quarter = Math.floor(now.getMonth() / 3);
        return new Date(now.getFullYear(), (quarter + 1) * 3, 0).toISOString().split('T')[0];
    };

    const presets = [
        { label: 'Today', value: getPresetDate(0) },
        { label: 'Yesterday', value: getPresetDate(1) },
        { label: 'Last Week', value: getPresetDate(7) },
        { label: 'Last Month', value: getPresetDate(30) },
        { label: 'Month End', value: getMonthEnd() },
        { label: 'Quarter End', value: getQuarterEnd() },
    ];

    const formatDisplayDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className="flex items-center gap-3">
            {/* Quick Preset Buttons */}
            <div className="hidden lg:flex items-center gap-2">
                {presets.slice(0, 4).map((preset) => (
                    <Button
                        key={preset.label}
                        variant={date === preset.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => onDateChange(preset.value)}
                        className={cn(
                            "h-9 px-3 rounded-lg text-xs font-medium transition-all",
                            date === preset.value 
                                ? "bg-blue-600 text-white shadow-md" 
                                : "bg-white hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700"
                        )}
                    >
                        {preset.label}
                    </Button>
                ))}
            </div>

            {/* Custom Date Picker */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button 
                        variant="outline" 
                        className="h-10 px-4 bg-white hover:bg-gray-50 border-gray-200 rounded-xl shadow-sm"
                    >
                        <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="font-medium">{formatDisplayDate(date)}</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                    <Card className="border-0 shadow-lg">
                        <div className="p-4 space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                                <Clock className="h-4 w-4 text-blue-600" />
                                <span className="font-medium text-gray-900">Select Date</span>
                            </div>
                            
                            {/* Custom Date Input */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Custom Date</label>
                                <Input
                                    type="date"
                                    value={date}
                                    onChange={(e) => onDateChange(e.target.value)}
                                    className="w-full"
                                />
                            </div>

                            {/* All Presets */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Quick Select</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {presets.map((preset) => (
                                        <Button
                                            key={preset.label}
                                            variant={date === preset.value ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => onDateChange(preset.value)}
                                            className="h-8 text-xs justify-start"
                                        >
                                            {preset.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>
                </PopoverContent>
            </Popover>
        </div>
    );
};