import React, { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";

export const Skeleton = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-slate-200 dark:bg-slate-800", className)}
      {...props}
    />
  );
};

export default Skeleton;
