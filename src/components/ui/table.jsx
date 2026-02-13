import { cn } from "../../utils/className";

const Table = ({ className, ref, ...props }) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
);

const TableHeader = ({ className, ref, ...props }) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
);

const TableBody = ({ className, ref, ...props }) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
);

const TableRow = ({ className, ref, ...props }) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className,
    )}
    {...props}
  />
);

const TableHead = ({ className, ref, ...props }) => (
  <th
    ref={ref}
    className={cn(
      "h-10 px-2 text-right align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5",
      className,
    )}
    {...props}
  />
);

const TableCell = ({ className, ref, ...props }) => (
  <td
    ref={ref}
    className={cn(
      "p-2 align-middle [&:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5",
      className,
    )}
    {...props}
  />
);

export { Table, TableHeader, TableBody, TableHead, TableRow, TableCell };
