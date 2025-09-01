import React, { useState } from "react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
 children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleToggle = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AdminSidebar isCollapsed={isCollapsed} onToggle={handleToggle} />

      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300",
        isCollapsed ? "ml-16" : "ml-64"
      )}>
        <main className="flex-1 bg-gray-50 pt-4">
          {children}
        </main>
      </div>
    </div>
  );
}
