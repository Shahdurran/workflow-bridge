import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { submitFeedback } from '@/services/api';
import { AlertCircle, Upload } from 'lucide-react';
import type { IssueCategoryType } from '@/types/workflow.types';

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
  interactionId: string;
  workflowData?: Record<string, any>;
  platform?: string;
  onSubmitted?: () => void;
}

const issueCategoriesOptions: { value: IssueCategoryType; label: string; description: string }[] = [
  {
    value: 'incorrect_workflow',
    label: 'Wrong platform format',
    description: 'The workflow doesn\'t match the platform\'s expected format'
  },
  {
    value: 'missing_steps',
    label: 'Missing required fields',
    description: 'Important steps or fields are missing from the workflow'
  },
  {
    value: 'wrong_platform',
    label: 'Incorrect logic',
    description: 'The workflow logic doesn\'t match my requirements'
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Something else is wrong'
  },
];

export function FeedbackModal({
  open,
  onClose,
  interactionId,
  workflowData,
  platform,
  onSubmitted,
}: FeedbackModalProps) {
  const [issueCategory, setIssueCategory] = useState<IssueCategoryType>('other');
  const [feedbackText, setFeedbackText] = useState('');
  const [correctedWorkflow, setCorrectedWorkflow] = useState<Record<string, any> | null>(null);
  const [correctionNotes, setCorrectionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        setCorrectedWorkflow(json);
        toast({
          title: 'File uploaded',
          description: 'Your corrected workflow has been loaded successfully.',
        });
      } catch (error) {
        toast({
          title: 'Invalid JSON',
          description: 'The uploaded file is not valid JSON. Please check the format.',
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    if (!feedbackText.trim() && !correctedWorkflow) {
      toast({
        title: 'Feedback required',
        description: 'Please provide either feedback text or a corrected workflow.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await submitFeedback(
        interactionId,
        'report',
        feedbackText,
        correctedWorkflow || undefined,
        correctionNotes || undefined,
        issueCategory,
        1 // Low sentiment for issue report
      );

      toast({
        title: 'Issue reported',
        description: 'Thank you for helping us improve! We\'ll review your feedback.',
      });

      // Clear form
      setFeedbackText('');
      setCorrectedWorkflow(null);
      setCorrectionNotes('');
      setIssueCategory('other');
      
      onSubmitted?.();
      onClose();
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit feedback. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Report an Issue
          </DialogTitle>
          <DialogDescription>
            Help us improve by describing what went wrong with this workflow generation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Issue Category */}
          <div className="space-y-3">
            <Label>What type of issue did you encounter?</Label>
            <RadioGroup value={issueCategory} onValueChange={(value) => setIssueCategory(value as IssueCategoryType)}>
              {issueCategoriesOptions.map((option) => (
                <div key={option.value} className="flex items-start space-x-3 space-y-0">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <div className="space-y-1 leading-none">
                    <Label
                      htmlFor={option.value}
                      className="font-medium cursor-pointer"
                    >
                      {option.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Detailed Explanation */}
          <div className="space-y-2">
            <Label htmlFor="feedback-text">
              Detailed explanation <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="feedback-text"
              placeholder="Please describe the issue in detail. What did you expect vs. what did you get?"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Corrected Workflow Upload */}
          <div className="space-y-2">
            <Label htmlFor="corrected-workflow">
              Upload corrected workflow <span className="text-muted-foreground">(advanced, optional)</span>
            </Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('workflow-upload')?.click()}
                type="button"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload JSON
              </Button>
              {correctedWorkflow && (
                <span className="text-sm text-green-600 dark:text-green-400">
                  ✓ Workflow uploaded
                </span>
              )}
            </div>
            <input
              id="workflow-upload"
              type="file"
              accept=".json,application/json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <p className="text-xs text-muted-foreground">
              If you've manually fixed the workflow, you can upload the corrected JSON here.
            </p>
          </div>

          {/* Correction Notes */}
          {correctedWorkflow && (
            <div className="space-y-2 animate-in slide-in-from-top-2">
              <Label htmlFor="correction-notes">
                What did you change? <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="correction-notes"
                placeholder="Describe the changes you made to fix the workflow..."
                value={correctionNotes}
                onChange={(e) => setCorrectionNotes(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          )}

          {/* Platform Info */}
          {platform && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <span className="font-medium">Platform:</span> {platform.toUpperCase()}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

