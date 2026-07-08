import React, { ReactNode } from "react";
import { Inbox } from "lucide-react";

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = <Inbox className="h-10 w-10 text-slate-400" />,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl max-w-md mx-auto w-full select-none">
      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-full mb-4">
        {icon}
      </div>
      <h3 className="text-base font-bold text-slate-850 dark:text-slate-150 mb-1.5">
        {title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
        {description}
      </p>
      {action}
    </div>
  );
};

export default EmptyState;
