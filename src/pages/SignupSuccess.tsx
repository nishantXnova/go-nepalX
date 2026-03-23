import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const SignupSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmationStatus, setConfirmationStatus] = useState<'pending' | 'success' | 'error'>('pending');

  const email = searchParams.get('email');
  const role = searchParams.get('role');
  const isGuideSignup = role === 'guide';

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    if (accessToken && refreshToken) handleConfirmation(accessToken, refreshToken);
  }, [searchParams]);

  const handleConfirmation = async (accessToken: string, refreshToken: string) => {
    setIsConfirming(true);
    try {
      const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      if (error) {
        setConfirmationStatus('error');
        toast({ variant: 'destructive', title: 'Confirmation failed', description: error.message });
      } else {
        setConfirmationStatus('success');
        setTimeout(() => navigate(isGuideSignup ? '/guide/kyc' : '/'), 2000);
      }
    } catch (err) { setConfirmationStatus('error'); } finally { setIsConfirming(false); }
  };

  const handleContinue = () => navigate(isGuideSignup ? '/guide/kyc' : '/');

  if (isConfirming) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#f5f5f7]">
        <div className="text-center"><Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" /><h2 className="text-2xl font-bold font-serif">Verifying identity...</h2></div>
      </div>
    );
  }

  if (confirmationStatus === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#f5f5f7]">
        <div className="text-center text-[#34c759]"><CheckCircle className="w-20 h-20 mx-auto mb-4" /><h2 className="text-4xl font-black font-serif tracking-tight">Verified!</h2><p className="text-slate-500 mt-2 font-medium">Redirecting you to {(isGuideSignup ? 'Guide KYC' : 'Home')}...</p></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7] p-6">
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md bg-white p-10 rounded-[40px] shadow-2xl shadow-slate-200/50 text-center border border-white">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 ${isGuideSignup ? 'bg-amber-100 text-amber-600' : 'bg-primary/10 text-primary'}`}>
          <Mail className="w-10 h-10" />
        </div>
        <h2 className="text-4xl font-bold text-slate-900 mb-4 font-serif leading-tight">{isGuideSignup ? 'Almost a Guide!' : 'Check Your Email'}</h2>
        <p className="text-slate-500 mb-8 font-medium leading-relaxed">
          {isGuideSignup 
            ? "We've sent a secure verification link. You must verify your account to start your professional KYC process." 
            : "We've sent a verification link to your email address. Please click it to continue."}
        </p>
        
        {email && (
          <div className="bg-slate-50 py-3 px-6 rounded-2xl text-slate-600 font-bold mb-8 text-sm border border-slate-100 tracking-tight transition-all hover:bg-white hover:border-slate-200">
            {email}
          </div>
        )}

        <div className="space-y-4">
          <Button onClick={handleContinue} className="w-full h-[60px] rounded-2xl bg-[#f04423] hover:bg-[#d93a1d] text-white font-bold text-lg shadow-lg shadow-red-500/20 transition-all active:scale-[0.98]">
            {isGuideSignup ? 'Start KYC Process' : 'Go to Home'}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <Button variant="ghost" onClick={() => navigate('/auth')} className="w-full h-[50px] text-slate-400 font-bold hover:text-slate-600 transition-colors">
            Back to Login
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default SignupSuccess;
