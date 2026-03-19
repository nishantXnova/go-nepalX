import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Mail, Lock, User, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getSafeErrorMessage } from '@/utils/errorUtils';
import gonepallogo from '@/assets/gonepallogo.png';

// Validation schemas
const loginSchema = z.object({
  email: z.string().trim().email({ message: 'Please enter a valid email' }).max(255),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }).max(128),
});

const signupSchema = z.object({
  fullName: z.string().trim().min(2, { message: 'Name must be at least 2 characters' }).max(100),
  email: z.string().trim().email({ message: 'Please enter a valid email' }).max(255),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }).max(128)
    .regex(/[A-Z]/, { message: 'Password must contain an uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain a lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain a number' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmationStatus, setConfirmationStatus] = useState<'success' | 'error' | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { signIn, signUp } = useAuth();

  // Handle email confirmation on page load
  useEffect(() => {
    const handleEmailConfirmation = async () => {
      // Check for token in query params (Supabase older flow)
      const token = searchParams.get('token');
      const type = searchParams.get('type');
      const email = searchParams.get('email');

      // Check for token in hash fragment (Supabase newer flow)
      const hashParams = new URLSearchParams(location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (accessToken && refreshToken) {
        // Handle hash-based confirmation (newer Supabase flow)
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
            // Redirect to home after a short delay
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
      } else if (token && type) {
        // Handle query parameter confirmation (older Supabase flow)
        setIsConfirming(true);
        try {
          const { error } = await supabase.auth.verifyOtp({
            token,
            type: type as 'signup' | 'email_change' | 'recovery' | 'magiclink',
            email: email || undefined,
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
            // Redirect to home after a short delay
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
      }
    };

    handleEmailConfirmation();
  }, [searchParams, location, navigate, toast]);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  });

  const onLoginSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const { error } = await signIn(data.email, data.password);
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Login failed',
          description: getSafeErrorMessage(error),
        });
      } else {
        toast({
          title: 'Welcome back!',
          description: 'You have successfully logged in.',
        });
        navigate('/');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onSignupSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      const { error } = await signUp(data.email, data.password, data.fullName);
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Signup failed',
          description: getSafeErrorMessage(error),
        });
      } else {
        navigate(`/auth/success?email=${encodeURIComponent(data.email)}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while confirming email
  if (isConfirming) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-background p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="glass-effect rounded-2xl p-8 text-center shadow-elevated">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <Loader2 className="w-10 h-10 text-accent animate-spin" />
            </motion.div>
            <h2 className="heading-section text-2xl mb-4">Confirming Email</h2>
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
          <div className="glass-effect rounded-2xl p-8 text-center shadow-elevated">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </motion.div>
            <h2 className="heading-section text-2xl mb-4">Email Confirmed!</h2>
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
          <div className="glass-effect rounded-2xl p-8 text-center shadow-elevated">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
            </motion.div>
            <h2 className="heading-section text-2xl mb-4">Confirmation Failed</h2>
            <p className="text-muted-foreground mb-6">
              There was a problem confirming your email. The link may be expired or invalid.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setConfirmationStatus(null);
              }}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Premium Image Background */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
      >
        {/* Background Image with slight scale animation for premium feel */}
        <motion.div 
          className="absolute inset-0"
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          transition={{ duration: 10, ease: "easeOut" }}
        >
          <img 
            src="/loginimg.png" 
            alt="Nepal Mountains at Sunrise" 
            className="w-full h-full object-cover"
          />
        </motion.div>

        {/* Premium Gradient Overlays */}
        {/* Dark vignette effect to frame the image securely */}
        <div className="absolute inset-0 bg-black/20" />
        {/* Deep gradient at the top for the logo and bottom for the text */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/5 to-black" />
        
        {/* Subtle color grading accent */}
        <div className="absolute inset-0 bg-primary/10 mix-blend-overlay" />

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 text-white h-full w-full">
          {/* Top Section: Logo */}
          <Link to="/" className="flex items-center gap-3 w-fit group">
            <img src={gonepallogo} alt="GoNepal" className="h-10 w-auto opacity-90 group-hover:opacity-100 transition-opacity" />
            <span className="text-2xl font-bold tracking-tight drop-shadow-lg">GoNepal</span>
          </Link>

          {/* Bottom Section: Text */}
          <div className="mt-auto max-w-lg mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-bold uppercase tracking-[0.2em] mb-6 shadow-xl">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFB800] animate-pulse" />
                Start Your Journey
              </div>
              <h1 className="text-5xl xl:text-6xl font-black mb-6 leading-[1.1] tracking-tight text-white drop-shadow-2xl" style={{ fontFamily: '"Playfair Display", serif' }}>
                Discover the Magic of Nepal
              </h1>
              <p className="text-lg text-white/80 leading-relaxed font-medium drop-shadow-md">
                From the majestic Himalayas to ancient temples, explore breathtaking destinations and create unforgettable memories.
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-background via-secondary/20 to-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="lg:hidden flex items-center gap-2 text-primary mb-8">
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </Link>

          <div className="text-center mb-8">
            <h2 className="heading-section text-3xl mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-muted-foreground">
              {isLogin
                ? 'Sign in to continue your adventure'
                : 'Join us and start exploring Nepal'}
            </p>
          </div>



          {/* Toggle buttons */}
          <div className="flex bg-muted/50 p-1.5 rounded-2xl mb-8 border border-border/50 shadow-inner">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 ${isLogin
                ? 'bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] text-foreground scale-[1.02]'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 ${!isLogin
                ? 'bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] text-foreground scale-[1.02]'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                }`}
            >
              Sign Up
            </button>
          </div>

          {isLogin ? (
            <Form key="login" {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-5">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <FormControl>
                          <Input
                            placeholder="you@example.com"
                            type="email"
                            autoComplete="email"
                            className="pl-10"
                            {...field}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <FormControl>
                          <Input
                            placeholder="••••••••"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            className="pl-10 pr-10"
                            {...field}
                          />
                        </FormControl>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-[#e35a26] to-[#E41B17] hover:from-[#d64e1c] hover:to-[#c0151a] text-white shadow-lg shadow-red-500/25 rounded-xl py-6 font-bold text-base transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </Form>
          ) : (
            <Form key="signup" {...signupForm}>
              <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-5">
                <FormField
                  control={signupForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <FormControl>
                          <Input
                            placeholder="John Doe"
                            autoComplete="name"
                            className="pl-10"
                            {...field}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={signupForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <FormControl>
                          <Input
                            placeholder="you@example.com"
                            type="email"
                            autoComplete="email"
                            className="pl-10"
                            {...field}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={signupForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <FormControl>
                          <Input
                            placeholder="••••••••"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            className="pl-10 pr-10"
                            {...field}
                          />
                        </FormControl>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={signupForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <FormControl>
                          <Input
                            placeholder="••••••••"
                            type={showConfirmPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            className="pl-10 pr-10"
                            {...field}
                          />
                        </FormControl>
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <p className="text-xs text-muted-foreground">
                  Password must be at least 8 characters with uppercase, lowercase, and a number.
                </p>

                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-[#e35a26] to-[#E41B17] hover:from-[#d64e1c] hover:to-[#c0151a] text-white shadow-lg shadow-red-500/25 rounded-xl py-6 font-bold text-base transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isLoading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </Form>
          )}

          <p className="text-center text-sm text-muted-foreground mt-8">
            By continuing, you agree to our{' '}
            <Link to="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
