import * as React from "react";
import { cn } from "@/lib/utils";
import { DivideIcon as LucideIcon } from "lucide-react";

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  change?: {
    value: string;
    trend: "up" | "down" | "neutral";
  };
  icon?: LucideIcon;
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ className, title, value, change, icon: Icon, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "stat-card",
          className
        )}
        {...props}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="stat-card-title">{title}</p>
            <p className="stat-card-value">{value}</p>
          </div>
          {Icon && (
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icon className="icon-md text-primary" />
            </div>
          )}
        </div>
        
        {change && (
          <p className={cn(
            "stat-card-change",
            change.trend === "up" && "text-success",
            change.trend === "down" && "text-destructive", 
            change.trend === "neutral" && "text-muted-foreground"
          )}>
            {change.value}
          </p>
        )}
      </div>
    );
  }
);

StatCard.displayName = "StatCard";

export { StatCard };