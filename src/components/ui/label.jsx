import { Root } from "@radix-ui/react-label";
import { cva } from "class-variance-authority";

import { cn } from "../../utils/className";

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
);

const Label = ({ className, ref, ...props }) => (
  <Root ref={ref} className={cn(labelVariants(), className)} {...props} />
);

export { Label };
