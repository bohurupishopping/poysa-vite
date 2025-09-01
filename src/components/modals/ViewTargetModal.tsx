import { useState, useEffect } from "react";
import { Eye, Target, Calendar, TrendingUp, TrendingDown, Package, User, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PerformanceTargetWithProgress, TargetStatus, TargetMetric, TargetPeriod } from "@/integrations/supabase/manager-types";

interface ViewTargetModalProps {
  target: PerformanceTargetWithProgress;
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
}

export function ViewTargetModal({ target, trigger, isOpen, onClose }: ViewTargetModalProps) {
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatValue = (value: number, metric: TargetMetric) => {
    switch (metric) {
      case 'REVENUE':
      case 'PROFIT':
        return formatCurrency(value);
      case 'QUANTITY_SOLD':
        return value.toLocaleString() + ' units';
      default:
        return value.toString();
    }
  };

  const getStatusColor = (status: TargetStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-blue-100 text-blue-800';
      case 'ACHIEVED':
        return 'bg-green-100 text-green-800';
      case 'MISSED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMetricColor = (metric: TargetMetric) => {
    switch (metric) {
      case 'REVENUE':
        return 'bg-green-100 text-green-800';
      case 'PROFIT':
        return 'bg-blue-100 text-blue-800';
      case 'QUANTITY_SOLD':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPeriodColor = (period: TargetPeriod) => {
    switch (period) {
      case 'MONTHLY':
        return 'bg-orange-100 text-orange-800';
      case 'QUARTERLY':
        return 'bg-blue-100 text-blue-800';
      case 'YEARLY':
        return 'bg-purple-100 text-purple-800';
      case 'CUSTOM':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDaysRemaining = () => {
    const today = new Date();
    const endDate = new Date(target.end_date);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDaysElapsed = () => {
    const today = new Date();
    const startDate = new Date(target.start_date);
    const endDate = new Date(target.end_date);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return { elapsed: Math.max(0, elapsedDays), total: totalDays };
  };

  const getProgressStatus = () => {
    const daysInfo = getDaysElapsed();
    const timeProgress = (daysInfo.elapsed / daysInfo.total) * 100;
    const valueProgress = target.progress_percentage;
    
    if (valueProgress > timeProgress + 10) {
      return { status: 'ahead', color: 'text-green-600', icon: TrendingUp };
    } else if (valueProgress < timeProgress - 10) {
      return { status: 'behind', color: 'text-red-600', icon: TrendingDown };
    } else {
      return { status: 'on-track', color: 'text-blue-600', icon: Target };
    }
  };

  const daysRemaining = getDaysRemaining();
  const daysInfo = getDaysElapsed();
  const progressStatus = getProgressStatus();
  const ProgressIcon = progressStatus.icon;

  return (
    <Dialog open={modalOpen} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Target Details
          </DialogTitle>
          <DialogDescription>
            View detailed information about this performance target
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Target Header */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{target.name}</h3>
              {target.notes && (
                <p className="text-gray-600 mt-1">{target.notes}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className={`text-xs rounded-full ${getStatusColor(target.status)}`}>
                {target.status}
              </Badge>
              <Badge variant="outline" className={`text-xs rounded-full ${getMetricColor(target.metric)}`}>
                {target.metric.replace('_', ' ')}
              </Badge>
              <Badge variant="outline" className={`text-xs rounded-full ${getPeriodColor(target.period)}`}>
                {target.period}
              </Badge>
            </div>
          </div>

          {/* Progress Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ProgressIcon className={`h-5 w-5 ${progressStatus.color}`} />
                Progress Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Target Progress</span>
                  <span className="font-medium">{Math.round(target.progress_percentage)}%</span>
                </div>
                <Progress value={target.progress_percentage} className="h-3" />
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Current Value</span>
                  <div className="font-semibold text-lg">
                    {formatValue(target.current_value, target.metric)}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Target Value</span>
                  <div className="font-semibold text-lg">
                    {formatValue(target.target_value, target.metric)}
                  </div>
                </div>
              </div>

              <div className={`text-sm ${progressStatus.color} font-medium`}>
                Status: {progressStatus.status.replace('-', ' ').toUpperCase()}
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Start Date</span>
                  <div className="font-medium">
                    {new Date(target.start_date).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">End Date</span>
                  <div className="font-medium">
                    {new Date(target.end_date).toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Days Elapsed</span>
                  <div className="font-medium">
                    {daysInfo.elapsed} of {daysInfo.total} days
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Days Remaining</span>
                  <div className={`font-medium ${
                    daysRemaining < 0 ? 'text-red-600' : 
                    daysRemaining < 7 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {daysRemaining < 0 ? 'Overdue' : `${daysRemaining} days`}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Information */}
          {target.product && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5 text-purple-600" />
                  Product Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-600 text-sm">Product Name</span>
                    <div className="font-medium">{target.product.name}</div>
                  </div>
                  {target.product.sku && (
                    <div>
                      <span className="text-gray-600 text-sm">SKU</span>
                      <div className="font-mono text-sm">{target.product.sku}</div>
                    </div>
                  )}
                  {target.product.description && (
                    <div>
                      <span className="text-gray-600 text-sm">Description</span>
                      <div className="text-sm">{target.product.description}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}