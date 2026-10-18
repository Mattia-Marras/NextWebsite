import { translate, useLanguage } from "@/i18n";
import { Loader2Icon } from "lucide-react"

import { cn } from "@/lib/utils"

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  useLanguage();
  return (
    <Loader2Icon
      role="status"
      aria-label={translate("Loading")}
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}

export { Spinner }
