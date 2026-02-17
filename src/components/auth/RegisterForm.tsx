import React, { useState } from 'react';
import { Mail, Lock, User, UserPlus, AlertCircle, CheckCircle, Eye, EyeOff, ArrowRight, Facebook, Twitter, Linkedin, Instagram, Youtube, MessageCircle, BarChart3, Users, Calendar, Zap, Shield, Globe, Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

// SVG Icons for social login
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

// Features to showcase on the register page
const features = [
  {
    icon: <MessageCircle className="w-6 h-6" />,
    title: 'Social Media Management',
    description: 'Manage all your social accounts from one powerful dashboard'
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: 'Advanced Analytics',
    description: 'Track engagement, reach, and growth with detailed insights'
  },
  {
    icon: <Calendar className="w-6 h-6" />,
    title: 'Smart Scheduling',
    description: 'Schedule posts at optimal times across all platforms'
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: 'CRM & Lead Management',
    description: 'Track customers and convert leads into loyal clients'
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'AI-Powered Content',
    description: 'Generate engaging content with AI studio tools'
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Enterprise Security',
    description: 'Bank-level security to protect your data'
  }
];

// Animated background shapes
const BackgroundShapes = () => (
  <div className="absolute inset-0 overflow-hidden">
    <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-purple-400/30 to-pink-500/30 rounded-full blur-3xl animate-pulse"></div>
    <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-400/30 to-indigo-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
    <div className="absolute top-1/3 right-[10%] w-72 h-72 bg-pink-500/10 rounded-full blur-2xl animate-float"></div>
    <div className="absolute bottom-1/3 left-[15%] w-80 h-80 bg-blue-500/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }}></div>
    
    {/* Floating gradient orbs */}
    <div className="absolute top-32 left-[15%] animate-float">
      <div className="w-14 h-14 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-full blur-xl"></div>
    </div>
    <div className="absolute top-1/2 right-[20%] animate-float" style={{ animationDelay: '0.8s' }}>
      <div className="w-20 h-20 bg-gradient-to-br from-blue-500/30 to-indigo-500/30 rounded-full blur-xl"></div>
    </div>
    <div className="absolute bottom-40 left-[25%] animate-float" style={{ animationDelay: '1.5s' }}>
      <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/30 to-teal-500/30 rounded-full blur-xl"></div>
    </div>
  </div>
);

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address format');
      return;
    }

    setLoading(true);

    const { error: signUpError } = await signUp(email.trim(), password, fullName.trim());

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <BackgroundShapes />
        <div className="relative z-10 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-10 max-w-md w-full text-center border border-white/20">
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <CheckCircle className="text-white" size={40} />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-3">
            Welcome to EngageHub! 🎉
          </h2>
          <p className="text-slate-600 mb-8">
            We've sent a confirmation email to <strong className="text-purple-600">{email}</strong>. 
            Please check your inbox and click the link to verify your account.
          </p>
          <button
            onClick={onSwitchToLogin}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-2xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all hover:shadow-lg hover:shadow-purple-500/25 flex items-center justify-center gap-2"
          >
            Back to Login
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Top Navigation */}
      <nav className="relative z-20 px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Globe className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">EngageHub</span>
          </a>
          
          <div className="hidden md:flex items-center gap-6">
            <a href="/features" className="text-slate-300 hover:text-white transition-colors font-medium">Features</a>
            <a href="/pricing" className="text-slate-300 hover:text-white transition-colors font-medium">Pricing</a>
            <a href="/about" className="text-slate-300 hover:text-white transition-colors font-medium">About</a>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onSwitchToLogin}
              className="px-5 py-2.5 text-white font-semibold hover:text-purple-300 transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content - Split Screen */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left Side - Features Showcase */}
        <div className="relative hidden lg:flex lg:w-1/2 xl:w-[55%] p-8 xl:p-12 items-center justify-center">
          <BackgroundShapes />
          
          <div className="relative z-10 max-w-lg">
            <div className="mb-8">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm text-pink-300 text-sm font-semibold rounded-full mb-4 border border-white/20">
                <Sparkles className="w-4 h-4" />
                Start Free Today
              </span>
              <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
                Join Thousands of
                <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent"> Growing Businesses</span>
              </h1>
              <p className="text-lg text-slate-300 leading-relaxed">
                Get started for free and transform how you manage your social media. 
                No credit card required.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-2 gap-4">
              {features.slice(0, 4).map((feature, index) => (
                <div 
                  key={index}
                  className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 hover:bg-white/20 transition-all duration-300 hover:scale-105 cursor-pointer group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500/30 to-blue-500/30 rounded-xl flex items-center justify-center text-pink-300 mb-3 group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <h3 className="text-white font-semibold mb-1">{feature.title}</h3>
                  <p className="text-slate-400 text-sm">{feature.description}</p>
                </div>
              ))}
            </div>

            {/* CTA Badge */}
            <div className="mt-8 flex items-center gap-4">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 border-2 border-slate-900 flex items-center justify-center text-white text-xs font-bold">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-white font-semibold">10,000+ happy users</p>
                <p className="text-slate-400 text-sm">and growing every day</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Register Form */}
        <div className="w-full lg:w-1/2 xl:w-[45%] flex items-center justify-center p-6 xl:p-12 bg-white/5 backdrop-blur-sm">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <a href="/" className="inline-flex items-center gap-3">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <span className="text-3xl font-bold text-white">EngageHub</span>
              </a>
            </div>

            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 xl:p-10 border border-white/20">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
                  Create Your Account
                </h2>
                <p className="text-slate-500">Start your 14-day free trial</p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 animate-shake">
                  <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors">
                      <User size={20} />
                    </div>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all text-slate-700 placeholder:text-slate-400"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors">
                      <Mail size={20} />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all text-slate-700 placeholder:text-slate-400"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors">
                      <Lock size={20} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-14 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all text-slate-700 placeholder:text-slate-400"
                      placeholder="Create a password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-purple-500 focus:outline-none transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors">
                      <Lock size={20} />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-12 pr-14 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all text-slate-700 placeholder:text-slate-400"
                      placeholder="Confirm your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-purple-500 focus:outline-none transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-2 pt-2">
                  <input type="checkbox" className="w-4 h-4 mt-1 text-purple-600 rounded border-slate-300 focus:ring-purple-500" required />
                  <span className="text-sm text-slate-600">
                    I agree to the <a href="#" className="text-purple-600 font-semibold hover:underline">Terms of Service</a> and <a href="#" className="text-purple-600 font-semibold hover:underline">Privacy Policy</a>
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-2xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-purple-500/25 flex items-center justify-center gap-2 group"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              <div className="my-6 flex items-center gap-4">
                <div className="flex-1 h-px bg-slate-200"></div>
                <span className="text-sm text-slate-500 font-medium">OR</span>
                <div className="flex-1 h-px bg-slate-200"></div>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => {}}
                  disabled={loading}
                  className="w-full bg-white border-2 border-slate-200 text-slate-700 py-3.5 rounded-2xl font-semibold hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow-md"
                >
                  <GoogleIcon />
                  Sign up with Google
                </button>

                <button
                  type="button"
                  onClick={() => {}}
                  disabled={loading}
                  className="w-full bg-white border-2 border-slate-200 text-slate-700 py-3.5 rounded-2xl font-semibold hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow-md"
                >
                  <Facebook size={20} className="text-blue-600" />
                  Sign up with Facebook
                </button>
              </div>

              <div className="mt-8 text-center">
                <p className="text-slate-600">
                  Already have an account?{' '}
                  <button
                    onClick={onSwitchToLogin}
                    className="text-purple-600 font-bold hover:text-purple-700 transition-colors"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </div>

            {/* Mobile Features */}
            <div className="lg:hidden mt-8">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <h3 className="text-white font-bold text-lg mb-4 text-center">What you can do with EngageHub</h3>
                <div className="grid grid-cols-2 gap-3">
                  {features.slice(0, 4).map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                        {React.cloneElement(feature.icon, { size: 16 })}
                      </div>
                      <div>
                        <h4 className="text-white text-sm font-semibold">{feature.title}</h4>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <p className="mt-6 text-center text-slate-400 text-sm">
              © 2024 EngageHub. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};
