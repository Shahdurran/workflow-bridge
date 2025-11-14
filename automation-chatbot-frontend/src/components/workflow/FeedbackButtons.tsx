import { useState } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { submitFeedback } from '@/services/api';
import { FeedbackModal } from './FeedbackModal';
import { cn } from '@/lib/utils';

interface FeedbackButtonsProps {
  interactionId: string;
  workflowData?: Record<string, any>;
  platform?: string;
  className?: string;
  onFeedbackSubmitted?: () => void;
}

export function FeedbackButtons({
  interactionId,
  workflowData,
  platform,
  className,
  onFeedbackSubmitted,
}: FeedbackButtonsProps) {
  const [feedbackGiven, setFeedbackGiven] = useState<'thumbs_up' | 'thumbs_down' | null>(null);
  const [showDetailedFeedback, setShowDetailedFeedback] = useState(false);
  const [detailedFeedbackText, setDetailedFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const { toast } = useToast();

  const handleThumbsUp = async () => {
    if (feedbackGiven) return; // Already submitted

    setIsSubmitting(true);
    try {
      await submitFeedback(
        interactionId,
        'thumbs_up',
        undefined,
        undefined,
        undefined,
        undefined,
        5 // High sentiment score for thumbs up
      );

      setFeedbackGiven('thumbs_up');
      setShowThankYou(true);
      
      toast({
        title: 'Thank you! 🎉',
        description: 'Your feedback helps us improve our AI.',
        duration: 3000,
      });

      // Hide thank you message after 3 seconds
      setTimeout(() => setShowThankYou(false), 3000);
      
      onFeedbackSubmitted?.();
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit feedback. Please try again.',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleThumbsDown = () => {
    if (feedbackGiven) return; // Already submitted
    setShowDetailedFeedback(true);
  };

  const submitNegativeFeedback = async () => {
    setIsSubmitting(true);
    try {
      await submitFeedback(
        interactionId,
        'thumbs_down',
        detailedFeedbackText || undefined,
        undefined,
        undefined,
        undefined,
        2 // Low sentiment score for thumbs down
      );

      setFeedbackGiven('thumbs_down');
      setShowDetailedFeedback(false);
      setShowThankYou(true);
      
      toast({
        title: 'Thank you for your feedback',
        description: 'We\'ll use this to improve our workflow generation.',
        duration: 3000,
      });

      // Hide thank you message after 3 seconds
      setTimeout(() => setShowThankYou(false), 3000);
      
      onFeedbackSubmitted?.();
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit feedback. Please try again.',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportIssue = () => {
    setShowFeedbackModal(true);
  };

  if (showThankYou) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-green-600 dark:text-green-400 animate-in fade-in", className)}>
        <ThumbsUp className="h-4 w-4" />
        <span>Thanks for your feedback! This helps us improve.</span>
      </div>
    );
  }

  if (showDetailedFeedback) {
    return (
      <div className={cn("space-y-3 animate-in slide-in-from-top-2", className)}>
        <div className="text-sm font-medium">
          What could we improve?
        </div>
        <Textarea
          placeholder="Tell us what went wrong or what we could do better..."
          value={detailedFeedbackText}
          onChange={(e) => setDetailedFeedbackText(e.target.value)}
          rows={3}
          className="resize-none"
        />
        <div className="flex gap-2">
          <Button
            onClick={submitNegativeFeedback}
            disabled={isSubmitting}
            size="sm"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
          <Button
            onClick={() => setShowDetailedFeedback(false)}
            variant="outline"
            size="sm"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleReportIssue}
            variant="ghost"
            size="sm"
            disabled={isSubmitting}
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            Report Issue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={cn("flex items-center gap-4", className)}>
        <div className="text-sm text-muted-foreground">
          Was this workflow helpful?
        </div>
        <div className="flex gap-2">
          <Button
            variant={feedbackGiven === 'thumbs_up' ? 'default' : 'outline'}
            size="sm"
            onClick={handleThumbsUp}
            disabled={isSubmitting || feedbackGiven !== null}
            className={cn(
              "transition-all",
              feedbackGiven === 'thumbs_up' && "bg-green-500 hover:bg-green-600 text-white"
            )}
          >
            <ThumbsUp className="h-4 w-4 mr-1" />
            Yes
          </Button>
          <Button
            variant={feedbackGiven === 'thumbs_down' ? 'default' : 'outline'}
            size="sm"
            onClick={handleThumbsDown}
            disabled={isSubmitting || feedbackGiven !== null}
            className={cn(
              "transition-all",
              feedbackGiven === 'thumbs_down' && "bg-red-500 hover:bg-red-600 text-white"
            )}
          >
            <ThumbsDown className="h-4 w-4 mr-1" />
            No
          </Button>
        </div>
        {!feedbackGiven && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReportIssue}
            className="text-muted-foreground"
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            Report Issue
          </Button>
        )}
      </div>

      {showFeedbackModal && (
        <FeedbackModal
          open={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          interactionId={interactionId}
          workflowData={workflowData}
          platform={platform}
          onSubmitted={() => {
            setFeedbackGiven('thumbs_down');
            setShowFeedbackModal(false);
            onFeedbackSubmitted?.();
          }}
        />
      )}
    </>
  );
}

