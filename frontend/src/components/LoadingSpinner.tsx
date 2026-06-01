import { Loader2 } from "lucide-react";

export default function LoadingSpinner({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="text-sm">{text}</span>
    </div>
  );
}
