import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Mail, Lock, User, Loader2, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getSafeErrorMessage } from '@/utils/errorUtils';
import gonepallogo from '@/assets/gonepallogo.png';

const loginSchema = z.object({
  email: z.string().trim().email({ message: 'Valid email is required' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

const signupSchema = z.object({
  fullName: z.string().trim().min(2, { message: 'Full name is required' }),
  email: z.string().trim().email({ message: 'Valid email is required' }),
  password: z.string().min(8, { message: 'Min 8 characters' })
    .regex(/[A-Z]/, { message: 'Uppercase required' })
    .regex(/[0-9]/, { message: 'Number required' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [authRole, setAuthRole] = useState<'traveller' | 'guide'>('traveller');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { signIn, signUp, user, profile } = useAuth();
  
  // Auto-redirect if already logged in
  useEffect(() => {
    if (user) {
      const isAdminEmail = user.email === 'paudelnishant15@gmail.com';
      
      // If we are already on the /admin path, don't redirect away
      if (location.pathname.startsWith('/admin')) return;

      // Note: Admin redirection was removed per user request. 
      // Admins will land on Home/Profile and click the Shield icon manually.

      if (profile) {
        const role = profile.role?.toLowerCase();
        // Skip auto-redirect for Admin to fulfill "only in the admin dashboard" request
        if (role === 'admin' || isAdminEmail) return; 

        if (role === 'guide') {
          const kycStatus = profile.guide_applications?.[0]?.status;
          if (!kycStatus) navigate('/guide/kyc');
          else if (kycStatus === 'pending') navigate('/guide/pending');
          else navigate('/guide/dashboard');
        } else {
          navigate('/');
        }
      }
    }
  }, [user, profile, navigate, location.pathname]);
  
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
        toast({ variant: 'destructive', title: 'Sign In Failed', description: getSafeErrorMessage(error) });
      } else {
        setTimeout(async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: profileCheck } = await (supabase.from('profiles' as any) as any).select('*, guide_applications(status)').eq('id', user.id).single();
            const role = (profileCheck as any)?.role?.toLowerCase();
            if (role === 'guide') {
              const kycStatus = profileCheck?.guide_applications?.[0]?.status;
              if (!kycStatus) navigate('/guide/kyc');
              else if (kycStatus === 'pending') navigate('/guide/pending');
              else if (kycStatus === 'approved') navigate('/guide/dashboard');
              else if (kycStatus === 'rejected') navigate('/guide/kyc?status=rejected');
            } else if (role === 'admin') navigate('/admin');
            else navigate('/');
          }
        }, 500);
      }
    } finally { setIsLoading(false); }
  };

  const onSignupSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      const { error } = await signUp(data.email, data.password, data.fullName, authRole);
      if (error) toast({ variant: 'destructive', title: 'Account Creation Failed', description: error.message });
      else navigate(`/auth/success?email=${encodeURIComponent(data.email)}&role=${authRole}`);
    } finally { setIsLoading(false); }
  };

  const watchPassword = signupForm.watch('password', '');
  const hasMinLength = watchPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(watchPassword);
  const hasNumber = /[0-9]/.test(watchPassword);

  return (
    <div className="min-h-screen flex bg-white antialiased">
      {/* LEFT SECTION - VIBRANT MOCKUP STYLE */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-black">
        <motion.img 
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          src="/loginimg.png" 
          alt="Nepal Mountains" 
          className="w-full h-full object-cover opacity-90 brightness-75" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Logo */}
        <div className="absolute top-12 left-12 flex items-center gap-3">
          <img src={gonepallogo} alt="GoNepal Logo" className="h-10 w-auto" />
          <span className="text-2xl font-bold text-white tracking-tight">GoNepal</span>
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-20 left-12 right-12">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-xl border border-white/20 px-4 py-2 rounded-full mb-8 shadow-2xl">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white">Start Your Journey</span>
            </div>
            <h1 className="text-7xl font-bold text-white leading-[1.1] mb-6 font-serif tracking-tight">
              Discover the Magic of Nepal
            </h1>
            <p className="text-lg text-white/90 max-w-lg leading-relaxed font-sans font-light">
              From the majestic Himalayas to ancient temples, explore breathtaking destinations and create unforgettable memories.
            </p>
          </motion.div>
        </div>
      </div>

      {/* RIGHT SECTION - GLASSMORPHISM & VIBRANT ACTIONS */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-8 sm:px-16 py-12 bg-white">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-sm">
          
          <header className="mb-10 text-center">
            <h2 className="text-4xl font-bold text-slate-900 font-serif mb-2">{isLogin ? 'Welcome Back' : 'Join GoNepal'}</h2>
            <p className="text-slate-500 font-medium text-sm">
              {isLogin ? 'Sign in to continue your adventure' : 'Create an account to start exploring'}
            </p>
          </header>

          {/* Glassmorphism Toggle */}
          <div className="bg-slate-100/80 backdrop-blur-md p-1.5 rounded-2xl flex mb-10 w-full border border-slate-200/50">
            <button 
              onClick={() => setIsLogin(true)} 
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${isLogin ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => setIsLogin(false)} 
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${!isLogin ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Sign Up
            </button>
          </div>

          {/* Role Selection (Apple style refined) */}
          {/* {!isLogin && (
            <div className="flex bg-slate-50 p-1 rounded-xl mb-6 border border-slate-100">
               <button onClick={() => setAuthRole('traveller')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${authRole === 'traveller' ? 'bg-white shadow-sm text-primary' : 'text-slate-400'}`}>Traveller</button>
               <button onClick={() => setAuthRole('guide')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${authRole === 'guide' ? 'bg-white shadow-sm text-primary' : 'text-slate-400'}`}>Guide Onboarding</button>
            </div>
          )} */}

          <AnimatePresence mode="wait">
            <motion.div key={isLogin ? 'login' : 'signup'} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <Form {...(isLogin ? loginForm : signupForm)}>
                <form onSubmit={(isLogin ? loginForm : signupForm).handleSubmit(isLogin ? onLoginSubmit : onSignupSubmit)} className="space-y-5">
                  
                  {/* Role Selection inside the Form for clarity */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Identify As</span>
                    <div className="flex gap-4">
                      <button type="button" onClick={() => setAuthRole('traveller')} className={`text-xs font-bold transition-colors ${authRole === 'traveller' ? 'text-primary underline underline-offset-4' : 'text-slate-300'}`}>Traveller</button>
                      <button type="button" onClick={() => setAuthRole('guide')} className={`text-xs font-bold transition-colors ${authRole === 'guide' ? 'text-primary underline underline-offset-4' : 'text-slate-300'}`}>Guide</button>
                    </div>
                  </div>

                  {!isLogin && (
                    <FormField control={signupForm.control} name="fullName" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-600 font-bold text-xs uppercase ml-1">Full Name</FormLabel>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <FormControl><Input placeholder="John Doe" className="bg-slate-50 border-slate-200/60 rounded-xl py-6 pl-12 shadow-none focus:bg-white" {...field} /></FormControl>
                        </div>
                      </FormItem>
                    )} />
                  )}
                  
                  <FormField control={(isLogin ? loginForm : signupForm).control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-600 font-bold text-xs uppercase ml-1">Email</FormLabel>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <FormControl><Input placeholder="you@example.com" className="bg-slate-50 border-slate-200/60 rounded-xl py-6 pl-12 shadow-none focus:bg-white" {...field} /></FormControl>
                      </div>
                    </FormItem>
                  )} />

                  <FormField control={(isLogin ? loginForm : signupForm).control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-600 font-bold text-xs uppercase ml-1">Password</FormLabel>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <FormControl><Input type={showPassword ? "text" : "password"} placeholder="••••••••" className="bg-slate-50 border-slate-200/60 rounded-xl py-6 pl-12 pr-12 shadow-none focus:bg-white" {...field} /></FormControl>
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {!isLogin && (
                        <div className="grid grid-cols-3 gap-1 mt-2 px-1">
                          <div className={`h-1 rounded-full ${hasMinLength ? 'bg-green-500' : 'bg-slate-200'}`} />
                          <div className={`h-1 rounded-full ${hasUppercase ? 'bg-green-500' : 'bg-slate-200'}`} />
                          <div className={`h-1 rounded-full ${hasNumber ? 'bg-green-500' : 'bg-slate-200'}`} />
                        </div>
                      )}
                    </FormItem>
                  )} />

                  {!isLogin && (
                    <FormField control={signupForm.control} name="confirmPassword" render={({ field }) => (
                      <FormItem>
                        <FormControl><Input type="password" placeholder="Confirm Password" className="bg-slate-50 border-slate-200/60 rounded-xl py-6 px-4 shadow-none focus:bg-white" {...field} /></FormControl>
                      </FormItem>
                    )} />
                  )}

                  <div className="pt-6">
                    <Button type="submit" disabled={isLoading} className="w-full h-[60px] rounded-2xl bg-gradient-to-r from-[#f04423] to-[#ff6b2b] text-white text-[17px] font-bold shadow-xl shadow-red-500/30 transition-all active:scale-[0.98] border-t border-white/20">
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'Sign In' : 'Create Account')}
                    </Button>
                  </div>
                </form>
              </Form>
            </motion.div>
          </AnimatePresence>

          <footer className="mt-12 text-center">
            <p className="text-[12px] text-slate-400 max-w-[280px] mx-auto leading-relaxed">
              By continuing, you agree to our <br />
              <Link to="/terms" className="text-slate-900 font-bold hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-slate-900 font-bold hover:underline">Privacy Policy</Link>
            </p>
          </footer>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
