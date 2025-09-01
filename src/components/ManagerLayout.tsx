import React, { useState } from "react";
import { ManagerSidebar } from "@/components/ManagerSidebar";
import { cn } from "@/lib/utils";

interface ManagerLayoutProps {
    children: React.ReactNode;
}

export default function ManagerLayout({ children }: ManagerLayoutProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleToggle = () => {
        setIsCollapsed(!isCollapsed);
    };

    return (
        <div className="flex min-h-screen w-full bg-gray-50">
            <ManagerSidebar isCollapsed={isCollapsed} onToggle={handleToggle} />

            <div className={cn(
                "flex-1 flex flex-col transition-all duration-300",
                isCollapsed ? "ml-16" : "ml-64"
            )}>
                {/* Remove the simple header - let pages handle their own headers */}
                <main className="flex-1">
                    {children}
                </main>
            </div>
        </div>
    );
}