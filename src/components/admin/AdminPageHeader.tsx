import React from "react";

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  kicker?: string;
  actions?: React.ReactNode;
  breadcrumb?: React.ReactNode;
}

export function AdminPageHeader({
  title,
  subtitle,
  kicker,
  actions,
  breadcrumb,
}: AdminPageHeaderProps) {
  return (
    <div className="mb-8 md:mb-10 border-b border-surface-high pb-6 md:pb-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-8">
        <div className="space-y-2">
          {breadcrumb ? <div className="text-xs text-gray-400">{breadcrumb}</div> : null}
          <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-900 tracking-tighter">
            {title}
          </h1>
          {subtitle ? (
            <p className="text-sm text-gray-500 font-medium">{subtitle}</p>
          ) : null}
          {kicker ? (
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/80">
              {kicker}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
