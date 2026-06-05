/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  iconName: string;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  iconClassName?: string;
}

export function StatsCard({
  title,
  value,
  iconName,
  description,
  trend,
  className,
  iconClassName,
}: StatsCardProps) {
  // Dynamically get the icon component
  const Icon = (Icons as any)[iconName] || Icons.HelpCircle;

  // Extract base color name from the iconClassName string to apply matching gradients
  const getCardThemeColor = () => {
    if (!iconClassName) return "primary";
    const colors = ["violet", "blue", "emerald", "amber", "rose", "pink", "teal"];
    for (const color of colors) {
      if (iconClassName.includes(color)) {
        return color;
      }
    }
    return "primary";
  };

  const themeColor = getCardThemeColor();

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg bg-card/65 dark:bg-slate-900/50 backdrop-blur-md border border-border/70 dark:border-slate-800/80 group",
        className
      )}
    >
      {/* Dynamic top accent line */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r transition-all duration-300",
          themeColor === "violet" && "from-violet-500 to-fuchsia-500",
          themeColor === "blue" && "from-blue-500 to-cyan-500",
          themeColor === "emerald" && "from-emerald-500 to-teal-500",
          themeColor === "amber" && "from-amber-500 to-yellow-500",
          themeColor === "rose" && "from-rose-500 to-pink-500",
          themeColor === "pink" && "from-pink-500 to-rose-500",
          themeColor === "teal" && "from-teal-500 to-emerald-500",
          themeColor === "primary" && "from-primary to-indigo-500"
        )}
      />

      {/* Dynamic hover background glow */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-b opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none -z-10",
          themeColor === "violet" && "from-violet-500/5 to-transparent",
          themeColor === "blue" && "from-blue-500/5 to-transparent",
          themeColor === "emerald" && "from-emerald-500/5 to-transparent",
          themeColor === "amber" && "from-amber-500/5 to-transparent",
          themeColor === "rose" && "from-rose-500/5 to-transparent",
          themeColor === "pink" && "from-pink-500/5 to-transparent",
          themeColor === "teal" && "from-teal-500/5 to-transparent",
          themeColor === "primary" && "from-primary/5 to-transparent"
        )}
      />

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors duration-200">
          {title}
        </CardTitle>
        <div
          className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110",
            iconClassName
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight text-foreground">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground/80 mt-1 font-medium">{description}</p>
        )}
        {trend && (
          <div className="flex items-center gap-1.5 mt-2">
            <span
              className={cn(
                "text-xs font-semibold px-1.5 py-0.5 rounded-md",
                trend.isPositive
                  ? "text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/20"
                  : "text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/20"
              )}
            >
              {trend.isPositive ? "+" : ""}
              {trend.value}%
            </span>
            <span className="text-[10px] text-muted-foreground font-medium">
              from last month
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
