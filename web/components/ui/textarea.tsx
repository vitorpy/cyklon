import * as React from 'react';

import { cn } from '@/utils';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface InputProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const TextArea = React.forwardRef<HTMLTextAreaElement, InputProps>(
  ({ className, rows, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        rows={rows}
        {...props}
      />
    );
  }
);
TextArea.displayName = 'TextArea';

export { TextArea };
