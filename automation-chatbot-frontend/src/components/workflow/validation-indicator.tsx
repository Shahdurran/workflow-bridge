import { AlertCircle, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ValidationIndicatorProps {
  isValid: boolean;
  errors: Array<{
    message: string;
    nodeId?: string;
    field?: string;
  }>;
  warnings: Array<{
    message: string;
    nodeId?: string;
    field?: string;
  }>;
  isValidating: boolean;
  position?: 'node' | 'corner';
  className?: string;
}

export default function ValidationIndicator({
  isValid,
  errors,
  warnings,
  isValidating,
  position = 'corner',
  className = '',
}: ValidationIndicatorProps) {
  // Don't show anything if valid and no warnings
  if (isValid && warnings.length === 0 && !isValidating) {
    return null;
  }

  const getStatusIcon = () => {
    if (isValidating) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    }
    if (!isValid) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    if (warnings.length > 0) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getStatusColor = () => {
    if (isValidating) return 'bg-blue-100 border-blue-300';
    if (!isValid) return 'bg-red-100 border-red-300';
    if (warnings.length > 0) return 'bg-yellow-100 border-yellow-300';
    return 'bg-green-100 border-green-300';
  };

  const getTooltipContent = () => {
    if (isValidating) {
      return <div className="text-sm">Validating workflow...</div>;
    }

    return (
      <div className="space-y-2 max-w-sm">
        {errors.length > 0 && (
          <div>
            <div className="font-semibold text-red-600 mb-1">Errors ({errors.length})</div>
            <ul className="space-y-1 text-sm">
              {errors.slice(0, 5).map((error, idx) => (
                <li key={idx} className="flex items-start gap-1">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>{error.message}</span>
                </li>
              ))}
              {errors.length > 5 && (
                <li className="text-gray-500 italic">...and {errors.length - 5} more</li>
              )}
            </ul>
          </div>
        )}

        {warnings.length > 0 && (
          <div>
            <div className="font-semibold text-yellow-600 mb-1">Warnings ({warnings.length})</div>
            <ul className="space-y-1 text-sm">
              {warnings.slice(0, 5).map((warning, idx) => (
                <li key={idx} className="flex items-start gap-1">
                  <span className="text-yellow-500 mt-0.5">•</span>
                  <span>{warning.message}</span>
                </li>
              ))}
              {warnings.length > 5 && (
                <li className="text-gray-500 italic">...and {warnings.length - 5} more</li>
              )}
            </ul>
          </div>
        )}
      </div>
    );
  };

  if (position === 'node') {
    // Small badge for individual nodes
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={`absolute -top-2 -right-2 p-1 rounded-full border-2 ${getStatusColor()} ${className}`}
            >
              {getStatusIcon()}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-md">
            {getTooltipContent()}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Larger indicator for corner display
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 ${getStatusColor()} cursor-pointer transition-all hover:shadow-md ${className}`}
          >
            {getStatusIcon()}
            <div className="text-sm font-medium">
              {isValidating && 'Validating...'}
              {!isValidating && !isValid && `${errors.length} Error${errors.length !== 1 ? 's' : ''}`}
              {!isValidating && isValid && warnings.length > 0 && `${warnings.length} Warning${warnings.length !== 1 ? 's' : ''}`}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-md">
          {getTooltipContent()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

