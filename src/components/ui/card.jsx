import { cn } from "../../utils/className";

const Card = ({ className, ref, ...props }) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border bg-card text-card-foreground shadow",
      className,
    )}
    {...props}
  />
);

const CardHeader = ({ className, ref, ...props }) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
);

const CardTitle = ({ className, ref, ...props }) => (
  <h3
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  />
);

const CardContent = ({ className, ref, ...props }) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
);

export { Card, CardHeader, CardTitle, CardContent };
