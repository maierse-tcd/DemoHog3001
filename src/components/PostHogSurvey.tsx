import { useState, useEffect } from 'react';
import { usePostHog, useFeatureFlagEnabled } from 'posthog-js/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { X, Star } from 'lucide-react';

interface SurveyProps {
  trigger?: string;
  onClose?: () => void;
}

export const PostHogSurvey = ({ trigger = 'content_engagement', onClose }: SurveyProps) => {
  const posthog = usePostHog();
  const showSurvey = useFeatureFlagEnabled('show_feedback_survey');
  const [isVisible, setIsVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (showSurvey && trigger === 'content_engagement') {
      // Show survey after 30 seconds of content engagement
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 30000);

      return () => clearTimeout(timer);
    }
  }, [showSurvey, trigger]);

  const handleSubmit = () => {
    if (posthog) {
      posthog.capture('survey_feedback_submitted', {
        rating,
        feedback,
        trigger,
        timestamp: new Date().toISOString()
      });
    }
    setSubmitted(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 2000);
  };

  const handleClose = () => {
    if (posthog) {
      posthog.capture('survey_dismissed', {
        trigger,
        timestamp: new Date().toISOString()
      });
    }
    setIsVisible(false);
    onClose?.();
  };

  if (!showSurvey || !isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">How was your experience?</CardTitle>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="text-center py-4">
              <div className="text-2xl mb-2">🎉</div>
              <p className="text-sm text-muted-foreground">Thank you for your feedback!</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm mb-3">Rate your experience:</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-1"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <p className="text-sm mb-2">Additional feedback (optional):</p>
                <Textarea
                  placeholder="Tell us what you think..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Skip
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={rating === 0}
                  className="flex-1"
                >
                  Submit
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};