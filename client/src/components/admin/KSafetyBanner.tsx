import { AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface KSafetyBannerProps {
  kThreshold?: number;
  message?: string;
  variant?: 'warning' | 'info';
}

export function KSafetyBanner({ 
  kThreshold = 5, 
  message,
  variant = 'warning'
}: KSafetyBannerProps) {
  const defaultMessage = `Not enough data to protect anonymity (k-threshold not met). Try a broader filter or wait for more participants (minimum ${kThreshold} required).`;
  
  return (
    <Alert 
      className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950"
      data-testid="k-safety-banner"
    >
      {variant === 'warning' ? (
        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      ) : (
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      )}
      <AlertDescription className="text-amber-900 dark:text-amber-100">
        {message || defaultMessage}
      </AlertDescription>
    </Alert>
  );
}
