import { useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { Loader2, Mail, Lock, BookOpen, Github } from 'lucide-react';
import { Captcha } from './captcha';
import { toast } from 'react-hot-toast';
import { Capacitor } from '@capacitor/core';

export function LoginForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  // ... rest of the code
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captchaVerified, setCaptchaVerified] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Check captcha only for sign up
    if (isSignUp && !captchaVerified) {
      setError('Please complete the security verification.');
      setLoading(false);
      return;
    }

    // Determine Redirect URL based on platform
    const redirectUrl = Capacitor.isNativePlatform() 
        ? 'com.echoes.app://login-callback' 
        : window.location.origin;

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl, 
          }
        });
        if (error) throw error;
        
        toast.success('Registration successful! Please check your email.', {
          duration: 5000,
          icon: '📧'
        });
        setIsSignUp(false); // Switch back to login
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    // Determine Redirect URL based on platform
    const redirectUrl = Capacitor.isNativePlatform() 
        ? 'com.echoes.app://login-callback' 
        : window.location.origin;

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl, 
          skipBrowserRedirect: false, 
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 font-display">Echoes</h1>
          <p className="text-gray-500 mt-2">Sign in to save your memories</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm border border-red-100 flex items-center gap-2">
            <span className="font-bold">Error:</span> {error}
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
          <button
            onClick={() => setIsSignUp(false)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              !isSignUp ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setIsSignUp(true)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              isSignUp ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="your@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          </div>

          {isSignUp && (
            <div className="pt-2 animate-in fade-in zoom-in duration-300">
              <Captcha onVerify={setCaptchaVerified} />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2.5 rounded-xl hover:opacity-90 transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              <button
                onClick={() => handleOAuthLogin('github')}
                className="w-full inline-flex justify-center items-center px-4 py-2.5 border border-gray-300 shadow-sm bg-white text-sm font-medium rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Github className="w-5 h-5 mr-2" />
                <span>GitHub</span>
              </button>
            </div>
          </div>
      </div>
    </div>
  );
}
