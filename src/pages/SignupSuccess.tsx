import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getSafeErrorMessage } from '@/utils/errorUtils';

const SignupSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmationStatus, setConfirmationStatus] = useState<'pending' | 'success' | 'error'>('pending');

  // Get email from search params if passed
  const email = searchParams.get('email');

  useEffect(() => {
    // Check if this is a confirmation URL (from email link click)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    const token = searchParams.get('token');
    const type = searchParams.get('type');
    const emailParam = searchParams.get('email');

    if (accessToken && refreshToken) {
      handleConfirmation(accessToken, refreshToken);
    } else if (token && type) {
      handleOldConfirmation(token, type, emailParam);
    }
  }, [searchParams]);

  const handleConfirmation = async (accessToken: string, refreshToken: string) => {
    setIsConfirming(true);
    try {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        setConfirmationStatus('error');
        toast({
          variant: 'destructive',
          title: 'Confirmation failed',
          description: error.message,
        });
      } else {
        setConfirmationStatus('success');
        toast({
          title: 'Email confirmed!',
          description: 'Your account has been successfully verified.',
        });
        setTimeout(() => navigate('/'), 2000);
      }
    } catch (err) {
      setConfirmationStatus('error');
      toast({
        variant: 'destructive',
        title: 'Confirmation failed',
        description: 'An unexpected error occurred.',
      });
    } finally {
      setIsConfirming(false);
    }
  };

  const handleOldConfirmation = async (token: string, type: string, emailParam?: string | null) => {
    setIsConfirming(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        token,
        type: type as 'signup' | 'email_change' | 'recovery' | 'magiclink',
        email: emailParam || undefined,
      });

      if (error) {
        setConfirmationStatus('error');
        toast({
          variant: 'destructive',
          title: 'Confirmation failed',
          description: error.message,
        });
      } else {
        setConfirmationStatus('success');
        toast({
          title: 'Email confirmed!',
          description: 'Your account has been successfully verified.',
        });
        setTimeout(() => navigate('/'), 2000);
      }
    } catch (err) {
      setConfirmationStatus('error');
      toast({
        variant: 'destructive',
        title: 'Confirmation failed',
        description: 'An unexpected error occurred.',
      });
    } finally {
      setIsConfirming(false);
    }
  };

  const handleContinue = () => {
    navigate('/');
  };

  // Show loading state while confirming
  if (isConfirming) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-background p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="bg-card rounded-2xl p-8 text-center shadow-lg border">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </motion.div>
            <h2 className="text-2xl font-bold mb-4">Confirming Email</h2>
            <p className="text-muted-foreground">
              Please wait while we verify your email address...
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Show success state after confirmation
  if (confirmationStatus === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-background p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="bg-card rounded-2xl p-8 text-center shadow-lg border">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </motion.div>
            <h2 className="text-2xl font-bold mb-4">Email Confirmed!</h2>
            <p className="text-muted-foreground mb-6">
              Your account has been successfully verified. Redirecting you to home...
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Show error state after failed confirmation
  if (confirmationStatus === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-background p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="bg-card rounded-2xl p-8 text-center shadow-lg border">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
            </motion.div>
            <h2 className="text-2xl font-bold mb-4">Confirmation Failed</h2>
            <p className="text-muted-foreground mb-6">
              There was a problem confirming your email. The link may be expired or invalid.
            </p>
            <Button
              variant="outline"
              onClick={() => navigate('/auth')}
              className="w-full"
            >
              Back to Login
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Default: Show "Check your email" message
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-background p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="bg-card rounded-2xl p-8 text-center shadow-lg border">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Mail className="w-10 h-10 text-primary" />
          </motion.div>
          <h2 className="text-2xl font-bold mb-4">Check Your Email</h2>
          <p className="text-muted-foreground mb-2">
            We've sent a confirmation link to your email address.
          </p>
          {email && (
            <p className="text-sm font-medium text-foreground mb-4">
              {email}
            </p>
          )}
          <p className="text-sm text-muted-foreground mb-6">
            Please click the link to verify your account and complete the signup process.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Didn't receive the email? Check your spam folder or try signing up again.
          </p>

          <div className="space-y-3 mt-6">
            <Button
              onClick={handleContinue}
              className="w-full"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Continue to Home
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/auth')}
              className="w-full"
            >
              Back to Login
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SignupSuccess;
