
import React, { useState, useEffect } from 'react';
import {
  Building2,
  User,
  Palette,
  Share2,
  Bell,
  ShieldCheck,
  CreditCard,
  Lock,
  History,
  ChevronRight,
  ArrowRight,
  LogOut,
  Moon,
  Sun,
  Monitor,
  Globe,
  Mail,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Check,
  Layout,
  RefreshCw,
  Columns,
  Upload,
  MapPin,
  Phone,
  Users,
  Briefcase,
  Clock,
  Link2,
  Instagram,
  Twitter,
  Facebook,
  Youtube,
  Linkedin,
  Music,
  ExternalLink,
  BellRing,
  MessageSquare,
  Heart,
  TrendingUp,
  Calendar,
  Shield,
  Key,
  Laptop,
  Trash2,
  Download,
  FileText,
  Eye,
  EyeOff,
  Search,
  Filter,
  ChevronDown,
  Copy,
  RotateCcw,
  Database,
  UserCheck,
  Settings as SettingsIcon,
  LogIn,
  BarChart2
} from 'lucide-react';
import { useAuth } from '../src/hooks/useAuth';
import { supabase } from '../src/lib/supabase';
import { useTheme } from '../src/hooks/useTheme';
import { useCurrency } from '../src/hooks/useCurrency';
import { PLAN_CONFIGS } from '../src/lib/payfast';

type SettingsTab = 'company' | 'profile' | 'branding' | 'social' | 'notifications' | 'privacy' | 'billing' | 'security' | 'audit';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  company_name: string | null;
  role: string;
  created_at: string;
  updated_at: string;
  subscription_tier?: 'free' | 'starter' | 'professional' | 'business' | null;
  subscription_status?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'paused' | null;
  trial_ends_at?: string | null;
}

interface CompanyProfile {
  company_name: string;
  company_logo: string;
  industry: string;
  company_size: string;
  website: string;
  address: string;
  phone: string;
  contact_email: string;
  timezone: string;
  business_hours: string;
}

interface NotificationSettings {
  email_post_published: boolean;
  email_engagement_alerts: boolean;
  email_weekly_report: boolean;
  email_new_followers: boolean;
  email_mentions: boolean;
  push_enabled: boolean;
  push_engagement: boolean;
  push_mentions: boolean;
  push_reminders: boolean;
}

interface SocialAccount {
  id: string;
  platform: string;
  account_name: string;
  account_id: string;
  is_active: boolean;
  created_at: string;
  last_synced?: string;
  profile_image_url?: string;
}

interface AuditLog {
  id: string;
  action: string;
  description: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

interface Session {
  id: string;
  device: string;
  browser: string;
  location: string;
  ip_address: string;
  last_active: string;
  is_current: boolean;
}

const Settings: React.FC = () => {
    // Disconnect social account
    const handleDisconnectAccount = async (account: SocialAccount) => {
      if (!window.confirm(`Disconnect ${account.platform} account (${account.account_name})?`)) return;
      setLoadingSocial(true);
      try {
        const { error } = await supabase
          .from('social_accounts')
          .update({ is_active: false })
          .eq('id', account.id);
        if (error) {
          alert('Failed to disconnect account.');
        } else {
          setSocialAccounts(prev => prev.filter(a => a.id !== account.id));
        }
      } catch (err) {
        alert('Error disconnecting account.');
      }
      setLoadingSocial(false);
    };
  const {
    themeMode,
    setThemeMode,
    primaryColor,
    setPrimaryColor,
    sidebarColor,
    setSidebarColor
  } = useTheme();
  const { currency, setCurrency, availableCurrencies, isLoading: isLoadingCurrency } = useCurrency();
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // listen for navigation events so other parts of the app can request a specific tab
  useEffect(() => {
    const handler = (e: any) => {
      const detail = e.detail;
      if (detail?.section === 'Settings' && detail.tab) {
        setActiveTab(detail.tab);
      }
    };
    window.addEventListener('navigate', handler as EventListener);
    return () => window.removeEventListener('navigate', handler as EventListener);
  }, []);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Company Profile State
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>({
    company_name: '',
    company_logo: '',
    industry: '',
    company_size: '',
    website: '',
    address: '',
    phone: '',
    contact_email: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    business_hours: '9:00 AM - 5:00 PM'
  });
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null);
  const [companyLogoPreview, setCompanyLogoPreview] = useState<string | null>(null);

  // Social Accounts State
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [loadingSocial, setLoadingSocial] = useState(false);
  // Social Connect Modal
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  const supportedPlatforms = [
    { name: 'Facebook', id: 'facebook', icon: <Facebook size={24} className="text-blue-600" /> },
    { name: 'Instagram', id: 'instagram', icon: <Instagram size={24} className="text-pink-600" /> },
    { name: 'Twitter/X', id: 'twitter', icon: <Twitter size={24} className="text-sky-500" /> },
    { name: 'YouTube', id: 'youtube', icon: <Youtube size={24} className="text-red-600" /> },
    { name: 'LinkedIn', id: 'linkedin', icon: <Linkedin size={24} className="text-blue-700" /> },
    { name: 'TikTok', id: 'tiktok', icon: <Music size={24} className="text-black dark:text-white" /> },
  ];

  const handleConnectNew = () => setShowConnectModal(true);
  const handlePlatformSelect = (platformId: string) => {
    setSelectedPlatform(platformId);
    // Example OAuth redirect logic (replace URLs with your backend endpoints)
    let oauthUrl = '';
    switch (platformId) {
      case 'facebook':
        oauthUrl = '/api/oauth/facebook'; break;
      case 'instagram':
        oauthUrl = '/api/oauth/instagram'; break;
      case 'twitter':
        oauthUrl = '/api/oauth/twitter'; break;
      case 'youtube':
        oauthUrl = '/api/oauth/youtube'; break;
      case 'linkedin':
        oauthUrl = '/api/oauth/linkedin'; break;
      case 'tiktok':
        oauthUrl = '/api/oauth/tiktok'; break;
      default:
        break;
    }
    if (oauthUrl) {
      window.location.href = oauthUrl;
    }
  };

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email_post_published: true,
    email_engagement_alerts: true,
    email_weekly_report: true,
    email_new_followers: false,
    email_mentions: true,
    push_enabled: false,
    push_engagement: true,
    push_mentions: true,
    push_reminders: true
  });
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);

  // Security State
  const [sessions, setSessions] = useState<Session[]>([]);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditFilter, setAuditFilter] = useState('all');
  const [auditSearch, setAuditSearch] = useState('');

  // Privacy State
  const [dataRetentionDays, setDataRetentionDays] = useState(365);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [marketingConsent, setMarketingConsent] = useState(false);

  // Fetch user profile from Supabase
  // Fetch user profile from Supabase
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;

      setLoadingProfile(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data);
        // Also populate company profile from profile data
        if (data) {
          setCompanyProfile(prev => ({
            ...prev,
            company_name: data.company_name || '',
          }));
        }
      }
      setLoadingProfile(false);
    };

    fetchProfile();
  }, [user?.id]);

  // Fetch social accounts
  useEffect(() => {
    const fetchSocialAccounts = async () => {
      if (!user?.id) return;
      setLoadingSocial(true);
      
      const { data, error } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setSocialAccounts(data.map(acc => ({
          id: acc.id,
          platform: acc.platform,
          account_name: acc.account_name || acc.username || acc.page_name || 'Connected Account',
          account_id: acc.account_id || acc.page_id || '',
          is_active: acc.is_active,
          created_at: acc.created_at,
          last_synced: acc.updated_at,
          profile_image_url: acc.profile_image_url
        })));
      }
      setLoadingSocial(false);
    };

    if (activeTab === 'social') {
      fetchSocialAccounts();
    }
  }, [user?.id, activeTab]);

  // Generate mock audit logs (in production, fetch from database)
  useEffect(() => {
    if (activeTab === 'audit' && user?.id) {
      setLoadingAudit(true);
      // Simulate audit logs - in production, this would come from a database table
      const mockLogs: AuditLog[] = [
        { id: '1', action: 'login', description: 'User logged in successfully', ip_address: '102.89.45.123', user_agent: 'Chrome/120 Windows', created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
        { id: '2', action: 'post_created', description: 'Created new social media post', ip_address: '102.89.45.123', user_agent: 'Chrome/120 Windows', created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
        { id: '3', action: 'settings_changed', description: 'Updated notification preferences', ip_address: '102.89.45.123', user_agent: 'Chrome/120 Windows', created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
        { id: '4', action: 'social_connected', description: 'Connected Facebook Page', ip_address: '102.89.45.123', user_agent: 'Chrome/120 Windows', created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
        { id: '5', action: 'post_published', description: 'Published post to Instagram', ip_address: '102.89.45.123', user_agent: 'Chrome/120 Windows', created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() },
        { id: '6', action: 'login', description: 'User logged in successfully', ip_address: '41.150.62.88', user_agent: 'Safari/17 macOS', created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString() },
        { id: '7', action: 'password_changed', description: 'Password was changed', ip_address: '102.89.45.123', user_agent: 'Chrome/120 Windows', created_at: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString() },
        { id: '8', action: 'post_scheduled', description: 'Scheduled post for future publishing', ip_address: '102.89.45.123', user_agent: 'Chrome/120 Windows', created_at: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString() },
      ];
      setTimeout(() => {
        setAuditLogs(mockLogs);
        setLoadingAudit(false);
      }, 500);
    }
  }, [activeTab, user?.id]);

  // Generate mock sessions
  useEffect(() => {
    if (activeTab === 'security') {
      setSessions([
        { id: '1', device: 'Windows PC', browser: 'Chrome 120', location: 'Johannesburg, SA', ip_address: '102.89.45.123', last_active: new Date().toISOString(), is_current: true },
        { id: '2', device: 'iPhone 15', browser: 'Safari Mobile', location: 'Cape Town, SA', ip_address: '41.150.62.88', last_active: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), is_current: false },
      ]);
    }
  }, [activeTab]);

  // Handle logout
  const handleLogout = async () => {
    await signOut();
  };

  // Handle edit mode
  const handleEditProfile = () => {
    if (profile) {
      setEditedProfile({
        full_name: profile.full_name,
        company_name: profile.company_name,
        avatar_url: profile.avatar_url,
      });
      setAvatarPreview(profile.avatar_url);
    }
    setIsEditingProfile(true);
  };

  // Handle avatar file selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle save profile
  const handleSaveProfile = async () => {
    if (!user || !profile) return;

    setIsSavingProfile(true);

    try {
      let avatarUrl = editedProfile.avatar_url;

      // Upload avatar if a new file was selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile);

        if (!uploadError) {
          const { data } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);
          avatarUrl = data.publicUrl;
        }
      }

      // Update profile in database
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: editedProfile.full_name,
          company_name: editedProfile.company_name,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        alert('Failed to update profile. Please try again.');
      } else {
        setProfile(data);
        setIsEditingProfile(false);
        setAvatarFile(null);
        setAvatarPreview(null);
      }
    } catch (err) {
      console.error('Error:', err);
      alert('An error occurred. Please try again.');
    }

    setIsSavingProfile(false);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setEditedProfile({});
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  // Handle company logo file selection
  const handleCompanyLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCompanyLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompanyLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle save company profile
  const handleSaveCompany = async () => {
    if (!user) return;
    setIsSavingCompany(true);

    try {
      let logoUrl = companyProfile.company_logo;

      if (companyLogoFile) {
        const fileExt = companyLogoFile.name.split('.').pop();
        const fileName = `company-${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `logos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, companyLogoFile);

        if (!uploadError) {
          const { data } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);
          logoUrl = data.publicUrl;
        }
      }

      // Update profile with company name
      await supabase
        .from('profiles')
        .update({
          company_name: companyProfile.company_name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      setCompanyProfile(prev => ({ ...prev, company_logo: logoUrl }));
      setIsEditingCompany(false);
      setCompanyLogoFile(null);
      setCompanyLogoPreview(null);
    } catch (err) {
      console.error('Error saving company:', err);
      alert('Failed to save company profile');
    }

    setIsSavingCompany(false);
  };

  // Handle notification toggle
  const handleNotificationToggle = async (key: keyof NotificationSettings) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Handle password change
  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) {
      alert('Please fill in all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      alert('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      alert(err.message || 'Failed to update password');
    }
    setIsChangingPassword(false);
  };

  // Handle session revoke
  const handleRevokeSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
  };

  // Get platform icon
  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, React.ReactNode> = {
      facebook: <Facebook size={18} className="text-blue-600" />,
      instagram: <Instagram size={18} className="text-pink-600" />,
      twitter: <Twitter size={18} className="text-sky-500" />,
      youtube: <Youtube size={18} className="text-red-600" />,
      linkedin: <Linkedin size={18} className="text-blue-700" />,
      tiktok: <Music size={18} className="text-black dark:text-white" />,
    };
    return icons[platform.toLowerCase()] || <Share2 size={18} />;
  };

  // Get audit action icon
  const getAuditIcon = (action: string) => {
    const icons: Record<string, React.ReactNode> = {
      login: <LogIn size={16} className="text-green-600" />,
      logout: <LogOut size={16} className="text-gray-500" />,
      post_created: <FileText size={16} className="text-blue-600" />,
      post_published: <CheckCircle2 size={16} className="text-green-600" />,
      post_scheduled: <Calendar size={16} className="text-purple-600" />,
      settings_changed: <SettingsIcon size={16} className="text-orange-600" />,
      social_connected: <Link2 size={16} className="text-brand-600" />,
      password_changed: <Key size={16} className="text-red-600" />,
    };
    return icons[action] || <History size={16} className="text-gray-400" />;
  };

  // Filter audit logs
  const filteredAuditLogs = auditLogs.filter(log => {
    const matchesFilter = auditFilter === 'all' || log.action === auditFilter;
    const matchesSearch = !auditSearch || 
      log.description.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.action.toLowerCase().includes(auditSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Local temporary state for the "Interactive Preview" logic before "Apply"
  const [tempMode, setTempMode] = useState(themeMode);
  const [tempColor, setTempColor] = useState(primaryColor);
  const [tempSidebarColor, setTempSidebarColor] = useState(sidebarColor);
  const [isApplying, setIsApplying] = useState(false);

  // Derived subscription details (used in Billing tab)
  const subscriptionTier = (profile?.subscription_tier || 'free') as
    | 'free'
    | 'starter'
    | 'professional'
    | 'business';
  const subscriptionPlan =
    subscriptionTier !== 'free' ? PLAN_CONFIGS[subscriptionTier] : null;
  const subscriptionStatus = profile?.subscription_status || 'active';
  const trialEndsAt = profile?.trial_ends_at
    ? new Date(profile.trial_ends_at)
    : null;

  const themeColors = [
    { name: 'Default Blue', hex: '#2563EB' },
    { name: 'Royal Purple', hex: '#7C3AED' },
    { name: 'Forest Green', hex: '#059669' },
    { name: 'Sunset Orange', hex: '#EA580C' },
    { name: 'Crimson Red', hex: '#DC2626' },
    { name: 'Deep Teal', hex: '#0D9488' },
    { name: 'Midnight Black', hex: '#111827' },
    { name: 'Soft Indigo', hex: '#6366F1' },
  ];

  const sidebarColors = [
    { name: 'Snow White', hex: '#ffffff' },
    { name: 'Ghost White', hex: '#f8fafc' },
    { name: 'Slate Gray', hex: '#334155' },
    { name: 'Midnight Blue', hex: '#0f172a' },
    { name: 'Brand Primary', hex: primaryColor },
  ];

  const handleApply = () => {
    setIsApplying(true);
    // Simulate a brief apply delay for better UX feel
    setTimeout(() => {
      setThemeMode(tempMode);
      setPrimaryColor(tempColor);
      setSidebarColor(tempSidebarColor);
      setIsApplying(false);
    }, 400);
  };

  const menuItems: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'company', label: 'Company profile', icon: <Building2 size={18} /> },
    { id: 'profile', label: 'User profile', icon: <User size={18} /> },
    { id: 'branding', label: 'App branding', icon: <Palette size={18} /> },
    { id: 'social', label: 'Social accounts', icon: <Share2 size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'privacy', label: 'Privacy & compliance', icon: <ShieldCheck size={18} /> },
    { id: 'billing', label: 'Billing & subscription', icon: <CreditCard size={18} /> },
    { id: 'security', label: 'Security & login', icon: <Lock size={18} /> },
    { id: 'audit', label: 'Audit logs', icon: <History size={18} /> },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {loadingProfile ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 p-20 text-center">
                <RefreshCw className="w-8 h-8 mx-auto animate-spin text-brand-600" />
                <p className="mt-4 text-sm text-gray-500">Loading profile...</p>
              </div>
            ) : profile ? (
              <>
                {/* Profile Header */}
                <div className="bg-gradient-to-br from-brand-50 to-purple-50 dark:from-brand-900/20 dark:to-purple-900/20 rounded-3xl border border-brand-100 dark:border-brand-800 p-8">
                  <div className="flex items-start gap-6">
                    <div className="relative">
                      <div className="w-20 h-20 bg-brand-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-xl overflow-hidden">
                        {isEditingProfile && avatarPreview ? (
                          <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                        ) : profile.avatar_url ? (
                          <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User size={32} />
                        )}
                      </div>
                      {isEditingProfile && (
                        <>
                          <input
                            type="file"
                            id="avatar-upload"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            className="hidden"
                          />
                          <label
                            htmlFor="avatar-upload"
                            className="absolute -bottom-2 -right-2 w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-brand-700 transition-all shadow-lg"
                          >
                            <Palette size={16} />
                          </label>
                        </>
                      )}
                    </div>
                    <div className="flex-1">
                      {isEditingProfile ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={editedProfile.full_name || ''}
                            onChange={(e) => setEditedProfile({ ...editedProfile, full_name: e.target.value })}
                            placeholder="Full name"
                            className="w-full px-4 py-2 text-2xl font-black text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:border-brand-600 focus:outline-none"
                          />
                          <input
                            type="text"
                            value={editedProfile.company_name || ''}
                            onChange={(e) => setEditedProfile({ ...editedProfile, company_name: e.target.value })}
                            placeholder="Company name (optional)"
                            className="w-full px-4 py-2 text-sm text-gray-600 dark:text-slate-400 bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:border-brand-600 focus:outline-none"
                          />
                        </div>
                      ) : (
                        <>
                          <h3 className="text-2xl font-black text-gray-900 dark:text-slate-100">
                            {profile.full_name || 'No name set'}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-slate-400 font-medium mt-1">{profile.email}</p>
                          <div className="flex items-center gap-3 mt-3">
                            <span className="px-3 py-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-full text-xs font-bold text-brand-600 uppercase tracking-wider">
                              {profile.role}
                            </span>
                            {profile.company_name && (
                              <span className="px-3 py-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-full text-xs font-medium text-gray-600 dark:text-slate-400">
                                {profile.company_name}
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    {!isEditingProfile && (
                      <button
                        onClick={handleEditProfile}
                        className="px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-gray-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2"
                      >
                        <Palette size={14} /> Edit Profile
                      </button>
                    )}
                  </div>

                  {isEditingProfile && (
                    <div className="flex items-center gap-3 mt-6 pt-6 border-t border-brand-200 dark:border-brand-800">
                      <button
                        onClick={handleCancelEdit}
                        disabled={isSavingProfile}
                        className="px-6 py-2.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-gray-200 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        disabled={isSavingProfile}
                        className="flex-1 px-6 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isSavingProfile ? (
                          <>
                            <RefreshCw size={14} className="animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={14} />
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Profile Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 space-y-3">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Mail size={16} />
                      <span className="text-xs font-black uppercase tracking-widest">Email Address</span>
                    </div>
                    <p className="text-gray-900 dark:text-slate-100 font-semibold">{profile.email}</p>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 space-y-3">
                    <div className="flex items-center gap-2 text-gray-400">
                      <User size={16} />
                      <span className="text-xs font-black uppercase tracking-widest">Full Name</span>
                    </div>
                    <p className="text-gray-900 dark:text-slate-100 font-semibold">
                      {profile.full_name || 'Not set'}
                    </p>
                  </div>

                  {profile.company_name && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 space-y-3">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Building2 size={16} />
                        <span className="text-xs font-black uppercase tracking-widest">Company</span>
                      </div>
                      <p className="text-gray-900 dark:text-slate-100 font-semibold">{profile.company_name}</p>
                    </div>
                  )}

                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 space-y-3">
                    <div className="flex items-center gap-2 text-gray-400">
                      <CheckCircle2 size={16} />
                      <span className="text-xs font-black uppercase tracking-widest">Account Status</span>
                    </div>
                    <p className="text-green-600 dark:text-green-400 font-semibold flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                      Active
                    </p>
                  </div>
                </div>

                {/* Account Info */}
                <div className="bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 space-y-4">
                  <h4 className="text-sm font-black text-gray-800 dark:text-slate-100 uppercase tracking-widest">Account Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-slate-400 font-medium">User ID:</span>
                      <p className="text-gray-900 dark:text-slate-100 font-mono text-xs mt-1 break-all">{profile.id}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-slate-400 font-medium">Member since:</span>
                      <p className="text-gray-900 dark:text-slate-100 font-semibold mt-1">
                        {new Date(profile.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 p-20 text-center">
                <AlertCircle className="w-12 h-12 mx-auto text-red-500" />
                <p className="mt-4 text-sm text-gray-500">Unable to load profile data</p>
              </div>
            )}
          </div>
        );

      case 'branding':
        return (
          <div className="space-y-10 animate-in fade-in duration-500 pb-10">
            {/* Appearance Mode */}
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-black text-gray-800 dark:text-slate-100 uppercase tracking-widest">Appearance Mode</h4>
                <p className="text-xs text-gray-400 font-medium">Customize how Engagehub looks for you.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { id: 'light', label: 'Light', icon: <Sun size={20} /> },
                  { id: 'dark', label: 'Dark', icon: <Moon size={20} /> },
                  { id: 'system', label: 'System', icon: <Monitor size={20} /> },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setTempMode(mode.id as any)}
                    className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${tempMode === mode.id
                      ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/20 shadow-lg shadow-brand-100/20'
                      : 'border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-gray-200 dark:hover:border-slate-700'
                      }`}
                  >
                    <div className={`${tempMode === mode.id ? 'text-brand-600' : 'text-gray-400'}`}>
                      {mode.icon}
                    </div>
                    <span className={`text-xs font-black uppercase tracking-widest ${tempMode === mode.id ? 'text-brand-700' : 'text-gray-500'}`}>
                      {mode.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Primary Theme Color */}
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-black text-gray-800 dark:text-slate-100 uppercase tracking-widest">Primary Brand Color</h4>
                <p className="text-xs text-gray-400 font-medium">This color will be used for primary buttons, active states, and highlights.</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {themeColors.map((color) => (
                  <button
                    key={color.hex}
                    onClick={() => setTempColor(color.hex)}
                    className={`p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${tempColor === color.hex
                      ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/20 ring-4 ring-brand-50/50'
                      : 'border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-gray-200 dark:hover:border-slate-700'
                      }`}
                  >
                    <div
                      className="w-6 h-6 rounded-lg shadow-sm flex items-center justify-center shrink-0"
                      style={{ backgroundColor: color.hex }}
                    >
                      {tempColor === color.hex && <Check size={14} className="text-white" />}
                    </div>
                    <div className="text-left overflow-hidden">
                      <p className="text-[10px] font-black text-gray-800 dark:text-slate-200 uppercase truncate">{color.name}</p>
                      <p className="text-[9px] font-mono text-gray-400">{color.hex}</p>
                    </div>
                  </button>
                ))}
                <div className="p-3 rounded-xl border-2 border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2">
                  <input
                    type="color"
                    value={tempColor}
                    onChange={(e) => setTempColor(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
                  />
                  <input
                    type="text"
                    value={tempColor}
                    onChange={(e) => setTempColor(e.target.value)}
                    className="flex-1 min-w-0 bg-transparent text-[9px] font-mono font-bold text-gray-600 dark:text-slate-400 uppercase outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Sidebar Background Color */}
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-black text-gray-800 dark:text-slate-100 uppercase tracking-widest">Sidebar Background Color</h4>
                <p className="text-xs text-gray-400 font-medium">Choose a color for the left navigation background to match your brand style.</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {sidebarColors.map((color) => (
                  <button
                    key={color.hex}
                    onClick={() => setTempSidebarColor(color.hex)}
                    className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${tempSidebarColor === color.hex
                      ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/20'
                      : 'border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-gray-200'
                      }`}
                  >
                    <div
                      className="w-10 h-6 rounded border border-gray-200 shadow-sm"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className="text-[9px] font-black uppercase text-gray-500 truncate w-full text-center">
                      {color.name}
                    </span>
                  </button>
                ))}
                <div className="p-3 rounded-xl border-2 border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2">
                  <input
                    type="color"
                    value={tempSidebarColor}
                    onChange={(e) => setTempSidebarColor(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Live Preview Section */}
            <div className="bg-gray-100/50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 rounded-3xl p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Workspace Layout Preview</h4>
                <div className="px-3 py-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-full text-[9px] font-black text-gray-400 uppercase tracking-tighter shadow-sm">Real-time Preview</div>
              </div>

              <div className="flex flex-col lg:flex-row gap-8 items-start justify-center py-6">
                {/* Full App Layout Mockup */}
                <div className="w-full max-w-lg bg-gray-50 dark:bg-slate-950 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-2xl overflow-hidden flex h-64 scale-90 md:scale-100 transition-transform origin-top">
                  {/* Sidebar Mock */}
                  <div
                    className="w-16 flex flex-col items-center py-4 gap-4 border-r border-gray-100 dark:border-slate-800"
                    style={{ backgroundColor: tempSidebarColor }}
                  >
                    <div className="w-8 h-8 rounded-lg bg-brand-600 shadow-lg shadow-brand-100/20" style={{ backgroundColor: tempColor }} />
                    <div className="space-y-3 pt-4">
                      <div className="w-8 h-8 rounded-lg opacity-20" style={{ backgroundColor: tempColor }} />
                      <div className="w-8 h-2 bg-gray-200 dark:bg-slate-700 rounded-full" />
                      <div className="w-8 h-2 bg-gray-200 dark:bg-slate-700 rounded-full opacity-50" />
                    </div>
                  </div>
                  {/* Content Mock */}
                  <div className="flex-1 flex flex-col">
                    <div className="h-10 bg-white dark:bg-slate-900 border-b border-gray-50 dark:border-slate-800 flex items-center justify-between px-4">
                      <div className="w-24 h-2 bg-gray-100 dark:bg-slate-700 rounded-full" />
                      <div className="flex gap-2">
                        <div className="w-4 h-4 rounded-full bg-gray-100 dark:bg-slate-700" />
                        <div className="w-4 h-4 rounded-full bg-gray-100 dark:bg-slate-700" />
                      </div>
                    </div>
                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="h-16 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 p-3 flex flex-col gap-2">
                          <div className="w-8 h-2 bg-gray-100 dark:bg-slate-700 rounded-full" />
                          <div className="w-12 h-4 rounded" style={{ backgroundColor: tempColor }} />
                        </div>
                        <div className="h-16 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 p-3" />
                      </div>
                      <button
                        className="w-full py-2.5 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg"
                        style={{ backgroundColor: tempColor }}
                      >
                        Primary Action
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 gap-4">
              <button
                onClick={() => {
                  setTempMode(themeMode);
                  setTempColor(primaryColor);
                  setTempSidebarColor(sidebarColor);
                }}
                className="px-6 py-3 text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-100 font-black uppercase tracking-widest text-xs"
              >
                Reset Changes
              </button>
              <button
                onClick={handleApply}
                disabled={isApplying}
                className="px-10 py-3 bg-brand-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-brand-700 transition-all text-xs shadow-xl shadow-brand-100/30 flex items-center gap-2 disabled:opacity-70"
                style={{ backgroundColor: tempColor }}
              >
                {isApplying ? <RefreshCw size={14} className="animate-spin" /> : null}
                {isApplying ? 'Applying Theme...' : 'Apply Theme Settings'}
              </button>
            </div>
          </div>
        );

      case 'billing':
        return (
          <div className="space-y-10 animate-in fade-in duration-500 pb-10">
            {/* Currency Settings */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-8 space-y-6">
              <div>
                <h4 className="text-sm font-black text-gray-800 dark:text-slate-100 uppercase tracking-widest">System Currency</h4>
                <p className="text-xs text-gray-400 font-medium mt-1">Select the default currency for all financial data, reports, and campaign budgets.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableCurrencies.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => setCurrency(c.code)}
                    className={`relative p-5 rounded-2xl border-2 text-left transition-all ${currency === c.code
                      ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/20 shadow-lg shadow-brand-100/10'
                      : 'border-gray-100 dark:border-slate-800 hover:border-brand-200 dark:hover:border-slate-700'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-2xl font-black ${currency === c.code ? 'text-brand-600' : 'text-gray-900 dark:text-white'}`}>
                        {c.symbol}
                      </span>
                      {currency === c.code && (
                        <div className="w-5 h-5 rounded-full bg-brand-600 flex items-center justify-center text-white">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <p className={`text-sm font-bold ${currency === c.code ? 'text-brand-800 dark:text-brand-200' : 'text-gray-700 dark:text-slate-300'}`}>
                      {c.name}
                    </p>
                    <p className="text-xs text-gray-400 font-mono mt-1">{c.code}</p>
                  </button>
                ))}
              </div>

              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/20 rounded-xl flex gap-3">
                <AlertCircle size={20} className="text-yellow-600 dark:text-yellow-500 shrink-0" />
                <div>
                  <h5 className="text-xs font-bold text-yellow-800 dark:text-yellow-400 uppercase tracking-wide">Important Note</h5>
                  <p className="text-xs text-yellow-700 dark:text-yellow-500/80 mt-1 leading-relaxed">
                    Changing your currency will update how all monetary values are displayed across the system. It does not automatically convert historical data values.
                  </p>
                </div>
              </div>
            </div>

            {/* Subscription Details */}
            <div className="bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-800 p-8 space-y-6">
              <div className="flex items-start justify-between gap-6 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-600/10 flex items-center justify-center text-brand-600">
                    <CreditCard size={22} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                      Subscription Management
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                      View your current plan, status, and trial information.
                    </p>
                  </div>
                </div>

                {/* Status pill */}
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                    {subscriptionStatus === 'trialing'
                      ? 'On Trial'
                      : subscriptionStatus === 'past_due'
                      ? 'Payment Issue'
                      : subscriptionStatus === 'canceled'
                      ? 'Canceled'
                      : subscriptionStatus === 'paused'
                      ? 'Paused'
                      : 'Active'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Current Plan */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Current Plan
                  </p>
                  <p className="text-lg font-black text-gray-900 dark:text-white">
                    {subscriptionPlan ? subscriptionPlan.name : 'Free'}
                  </p>
                  {subscriptionPlan ? (
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      R{subscriptionPlan.price.toLocaleString()} / month •{' '}
                      {subscriptionPlan.monthlyPosts} AI posts •{' '}
                      {subscriptionPlan.crmContacts.toLocaleString()} contacts
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      You are currently on the free plan.
                    </p>
                  )}
                </div>

                {/* Trial / renewal */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    {trialEndsAt && subscriptionStatus === 'trialing'
                      ? 'Trial Ends'
                      : 'Next Billing'}
                  </p>
                  {trialEndsAt && subscriptionStatus === 'trialing' ? (
                    <>
                      <p className="text-lg font-black text-gray-900 dark:text-white">
                        {trialEndsAt.toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        You will only be charged after your trial ends.
                      </p>
                    </>
                  ) : subscriptionPlan ? (
                    <>
                      <p className="text-lg font-black text-gray-900 dark:text-white">
                        Monthly on your billing date
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        Billing handled via PayFast subscription.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-black text-gray-900 dark:text-white">
                        Not applicable
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        Upgrade to a paid plan to start billing.
                      </p>
                    </>
                  )}
                </div>

                {/* Account owner */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Account Owner
                  </p>
                  <p className="text-lg font-black text-gray-900 dark:text-white">
                    {profile?.full_name || 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {profile?.email}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <p className="text-xs text-gray-500 dark:text-slate-400 max-w-md">
                  {subscriptionPlan
                    ? 'To change plans or update payment details, use the subscription management link below. Payments are processed securely via PayFast.'
                    : 'You are on the free plan. Upgrade to a paid plan to unlock higher usage limits and advanced features.'}
                </p>
                <button
                  onClick={() => {
                    if (typeof window === 'undefined') return;

                    if (!subscriptionPlan) {
                      // On free plan: send user to pricing and open subscription flow for Starter by default
                      const planTier = 'starter';
                      window.sessionStorage.setItem('pending_subscription_plan', planTier);
                      window.dispatchEvent(
                        new CustomEvent('subscription:intent', { detail: { planTier } })
                      );
                      if (window.location.pathname !== '/pricing') {
                        window.history.pushState({}, '', '/pricing');
                        window.dispatchEvent(new PopStateEvent('popstate'));
                      }
                    } else {
                      // Paid plan: for now, just inform user how to manage in PayFast
                      alert(
                        'To change or cancel your subscription, please use your PayFast account or contact EngageHub support.\n\nA direct self-service portal link will appear here in a future update.'
                      );
                    }
                  }}
                  className="px-6 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700 transition-all"
                >
                  {subscriptionPlan ? 'Manage Subscription' : 'Upgrade Plan'}
                </button>
              </div>
            </div>
          </div>
        );

      case 'company':
        return (
          <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Company Header */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-3xl border border-blue-100 dark:border-blue-800 p-8">
              <div className="flex items-start gap-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-xl overflow-hidden">
                    {companyLogoPreview || companyProfile.company_logo ? (
                      <img src={companyLogoPreview || companyProfile.company_logo} alt="Company logo" className="w-full h-full object-cover" />
                    ) : (
                      <Building2 size={32} />
                    )}
                  </div>
                  {isEditingCompany && (
                    <>
                      <input type="file" id="company-logo-upload" accept="image/*" onChange={handleCompanyLogoChange} className="hidden" />
                      <label htmlFor="company-logo-upload" className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-blue-700 transition-all shadow-lg">
                        <Upload size={16} />
                      </label>
                    </>
                  )}
                </div>
                <div className="flex-1">
                  {isEditingCompany ? (
                    <input
                      type="text"
                      value={companyProfile.company_name}
                      onChange={(e) => setCompanyProfile({ ...companyProfile, company_name: e.target.value })}
                      placeholder="Company Name"
                      className="w-full px-4 py-2 text-2xl font-black text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:border-blue-600 focus:outline-none"
                    />
                  ) : (
                    <>
                      <h3 className="text-2xl font-black text-gray-900 dark:text-slate-100">
                        {companyProfile.company_name || profile?.company_name || 'Your Company'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-slate-400 font-medium mt-1">{companyProfile.industry || 'Add your industry'}</p>
                    </>
                  )}
                </div>
                {!isEditingCompany ? (
                  <button onClick={() => setIsEditingCompany(true)} className="px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-gray-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2">
                    <Palette size={14} /> Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => { setIsEditingCompany(false); setCompanyLogoFile(null); setCompanyLogoPreview(null); }} className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-xl text-xs font-bold">Cancel</button>
                    <button onClick={handleSaveCompany} disabled={isSavingCompany} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-2">
                      {isSavingCompany ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                      Save
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Company Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 space-y-4">
                <div className="flex items-center gap-2 text-gray-400">
                  <Briefcase size={16} />
                  <span className="text-xs font-black uppercase tracking-widest">Industry</span>
                </div>
                {isEditingCompany ? (
                  <select
                    value={companyProfile.industry}
                    onChange={(e) => setCompanyProfile({ ...companyProfile, industry: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100"
                  >
                    <option value="">Select Industry</option>
                    <option value="Technology">Technology</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Finance">Finance</option>
                    <option value="Retail">Retail</option>
                    <option value="Education">Education</option>
                    <option value="Marketing">Marketing & Advertising</option>
                    <option value="Media">Media & Entertainment</option>
                    <option value="Real Estate">Real Estate</option>
                    <option value="Other">Other</option>
                  </select>
                ) : (
                  <p className="text-gray-900 dark:text-slate-100 font-semibold">{companyProfile.industry || 'Not set'}</p>
                )}
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 space-y-4">
                <div className="flex items-center gap-2 text-gray-400">
                  <Users size={16} />
                  <span className="text-xs font-black uppercase tracking-widest">Company Size</span>
                </div>
                {isEditingCompany ? (
                  <select
                    value={companyProfile.company_size}
                    onChange={(e) => setCompanyProfile({ ...companyProfile, company_size: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100"
                  >
                    <option value="">Select Size</option>
                    <option value="1">Solo (1 person)</option>
                    <option value="2-10">Small (2-10)</option>
                    <option value="11-50">Medium (11-50)</option>
                    <option value="51-200">Large (51-200)</option>
                    <option value="200+">Enterprise (200+)</option>
                  </select>
                ) : (
                  <p className="text-gray-900 dark:text-slate-100 font-semibold">{companyProfile.company_size || 'Not set'}</p>
                )}
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 space-y-4">
                <div className="flex items-center gap-2 text-gray-400">
                  <Globe size={16} />
                  <span className="text-xs font-black uppercase tracking-widest">Website</span>
                </div>
                {isEditingCompany ? (
                  <input
                    type="url"
                    value={companyProfile.website}
                    onChange={(e) => setCompanyProfile({ ...companyProfile, website: e.target.value })}
                    placeholder="https://example.com"
                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-slate-100 font-semibold">{companyProfile.website || 'Not set'}</p>
                )}
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 space-y-4">
                <div className="flex items-center gap-2 text-gray-400">
                  <Clock size={16} />
                  <span className="text-xs font-black uppercase tracking-widest">Timezone</span>
                </div>
                {isEditingCompany ? (
                  <select
                    value={companyProfile.timezone}
                    onChange={(e) => setCompanyProfile({ ...companyProfile, timezone: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100"
                  >
                    <option value="Africa/Johannesburg">Africa/Johannesburg (SAST)</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                    <option value="Europe/Paris">Europe/Paris (CET)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                  </select>
                ) : (
                  <p className="text-gray-900 dark:text-slate-100 font-semibold">{companyProfile.timezone}</p>
                )}
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 space-y-4">
                <div className="flex items-center gap-2 text-gray-400">
                  <Phone size={16} />
                  <span className="text-xs font-black uppercase tracking-widest">Phone</span>
                </div>
                {isEditingCompany ? (
                  <input
                    type="tel"
                    value={companyProfile.phone}
                    onChange={(e) => setCompanyProfile({ ...companyProfile, phone: e.target.value })}
                    placeholder="+27 12 345 6789"
                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-slate-100 font-semibold">{companyProfile.phone || 'Not set'}</p>
                )}
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 space-y-4">
                <div className="flex items-center gap-2 text-gray-400">
                  <Mail size={16} />
                  <span className="text-xs font-black uppercase tracking-widest">Contact Email</span>
                </div>
                {isEditingCompany ? (
                  <input
                    type="email"
                    value={companyProfile.contact_email}
                    onChange={(e) => setCompanyProfile({ ...companyProfile, contact_email: e.target.value })}
                    placeholder="contact@company.com"
                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-slate-100 font-semibold">{companyProfile.contact_email || profile?.email || 'Not set'}</p>
                )}
              </div>
            </div>

            {/* Address */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 space-y-4">
              <div className="flex items-center gap-2 text-gray-400">
                <MapPin size={16} />
                <span className="text-xs font-black uppercase tracking-widest">Business Address</span>
              </div>
              {isEditingCompany ? (
                <textarea
                  value={companyProfile.address}
                  onChange={(e) => setCompanyProfile({ ...companyProfile, address: e.target.value })}
                  placeholder="123 Business Street, City, Country"
                  rows={3}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100 resize-none"
                />
              ) : (
                <p className="text-gray-900 dark:text-slate-100 font-semibold">{companyProfile.address || 'Not set'}</p>
              )}
            </div>
          </div>
        );

      case 'social':
        return (
          <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Social Accounts Overview */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-3xl border border-purple-100 dark:border-purple-800 p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="text-lg font-black text-gray-900 dark:text-slate-100">Connected Accounts</h4>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Manage your linked social media platforms</p>
                </div>
                <button
                  onClick={handleConnectNew}
                  className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-brand-700 transition-all"
                >
                  <Link2 size={14} /> Connect New
                </button>
              </div>

              {loadingSocial ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-6 h-6 animate-spin text-brand-600" />
                </div>
              ) : (
                <div className="grid gap-4">
                  {supportedPlatforms.map((platform) => {
                    const account = socialAccounts.find(acc => acc.platform.toLowerCase() === platform.id);
                    return (
                      <div key={platform.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                            {platform.icon}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-slate-100">{platform.name}</p>
                            {account ? (
                              <>
                                <p className="text-xs text-gray-500 dark:text-slate-400">{account.account_name}</p>
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 mt-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                  Connected
                                </span>
                                {account.last_synced && (
                                  <p className="text-[10px] text-gray-400 mt-1">Last synced: {new Date(account.last_synced).toLocaleDateString()}</p>
                                )}
                              </>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400 mt-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                                Not Connected
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {account ? (
                            <button
                              className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                              title="Disconnect"
                              onClick={() => handleDisconnectAccount(account)}
                              disabled={loadingSocial}
                            >
                              <Trash2 size={16} />
                            </button>
                          ) : (
                            <button className="p-2 text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-xl font-bold" onClick={handleConnectNew} title="Connect">
                              <Link2 size={16} /> Connect
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {/* Social Connect Modal */}
                  {showConnectModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 w-full max-w-md relative">
                        <button onClick={() => setShowConnectModal(false)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-slate-100">
                          <span aria-hidden>×</span>
                        </button>
                        <h3 className="text-lg font-black mb-4 text-gray-900 dark:text-slate-100">Connect a Social Account</h3>
                        <div className="grid grid-cols-2 gap-4">
                          {supportedPlatforms.map((platform) => (
                            <button
                              key={platform.id}
                              onClick={() => handlePlatformSelect(platform.id)}
                              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 dark:border-slate-800 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all"
                            >
                              {platform.icon}
                              <span className="text-xs font-bold text-gray-700 dark:text-slate-200">{platform.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Platform Guide */}
            <div className="bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-800 p-6">
              <h5 className="text-sm font-black text-gray-800 dark:text-slate-100 uppercase tracking-widest mb-4">Supported Platforms</h5>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { name: 'Facebook', icon: <Facebook size={24} />, color: 'text-blue-600' },
                  { name: 'Instagram', icon: <Instagram size={24} />, color: 'text-pink-600' },
                  { name: 'Twitter/X', icon: <Twitter size={24} />, color: 'text-sky-500' },
                  { name: 'YouTube', icon: <Youtube size={24} />, color: 'text-red-600' },
                  { name: 'LinkedIn', icon: <Linkedin size={24} />, color: 'text-blue-700' },
                  { name: 'TikTok', icon: <Music size={24} />, color: 'text-black dark:text-white' },
                ].map((platform) => (
                  <div key={platform.name} className="bg-white dark:bg-slate-900 rounded-xl p-4 text-center border border-gray-100 dark:border-slate-800">
                    <div className={`${platform.color} mx-auto mb-2`}>{platform.icon}</div>
                    <p className="text-xs font-bold text-gray-700 dark:text-slate-300">{platform.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Email Notifications */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-8 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                  <Mail size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-gray-800 dark:text-slate-100 uppercase tracking-widest">Email Notifications</h4>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">Manage email alerts and digests</p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { key: 'email_post_published', label: 'Post Published', desc: 'Get notified when a scheduled post is published', icon: <CheckCircle2 size={18} /> },
                  { key: 'email_engagement_alerts', label: 'Engagement Alerts', desc: 'Receive alerts for significant engagement spikes', icon: <TrendingUp size={18} /> },
                  { key: 'email_weekly_report', label: 'Weekly Report', desc: 'Get a weekly summary of your social performance', icon: <BarChart2 size={18} /> },
                  { key: 'email_new_followers', label: 'New Followers', desc: 'Be notified about new follower milestones', icon: <UserCheck size={18} /> },
                  { key: 'email_mentions', label: 'Mentions & Tags', desc: 'Get alerts when you\'re mentioned or tagged', icon: <MessageSquare size={18} /> },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="text-gray-400">{item.icon}</div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-slate-100 text-sm">{item.label}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">{item.desc}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleNotificationToggle(item.key as keyof NotificationSettings)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${notifications[item.key as keyof NotificationSettings] ? 'bg-brand-600' : 'bg-gray-300 dark:bg-slate-600'}`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notifications[item.key as keyof NotificationSettings] ? 'left-6' : 'left-0.5'}`}></span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Push Notifications */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-8 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
                  <BellRing size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-gray-800 dark:text-slate-100 uppercase tracking-widest">Push Notifications</h4>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">Browser and mobile push alerts</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
                <div className="flex items-center gap-4">
                  <Smartphone className="text-purple-600" size={20} />
                  <div>
                    <p className="font-bold text-gray-900 dark:text-slate-100 text-sm">Enable Push Notifications</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Allow browser notifications</p>
                  </div>
                </div>
                <button
                  onClick={() => handleNotificationToggle('push_enabled')}
                  className={`relative w-12 h-6 rounded-full transition-colors ${notifications.push_enabled ? 'bg-brand-600' : 'bg-gray-300 dark:bg-slate-600'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notifications.push_enabled ? 'left-6' : 'left-0.5'}`}></span>
                </button>
              </div>

              <div className={`space-y-4 transition-opacity ${notifications.push_enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                {[
                  { key: 'push_engagement', label: 'Real-time Engagement', desc: 'Instant alerts for likes, comments, shares' },
                  { key: 'push_mentions', label: 'Mentions', desc: 'Push when someone mentions you' },
                  { key: 'push_reminders', label: 'Post Reminders', desc: 'Reminders for scheduled posts' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                    <div>
                      <p className="font-bold text-gray-900 dark:text-slate-100 text-sm">{item.label}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => handleNotificationToggle(item.key as keyof NotificationSettings)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${notifications[item.key as keyof NotificationSettings] ? 'bg-brand-600' : 'bg-gray-300 dark:bg-slate-600'}`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notifications[item.key as keyof NotificationSettings] ? 'left-6' : 'left-0.5'}`}></span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Data & Privacy */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-8 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                  <Shield size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-gray-800 dark:text-slate-100 uppercase tracking-widest">Data & Privacy</h4>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">Manage how your data is handled</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                  <div className="flex items-center gap-4">
                    <Database className="text-gray-400" size={20} />
                    <div>
                      <p className="font-bold text-gray-900 dark:text-slate-100 text-sm">Data Retention Period</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">How long we keep your historical data</p>
                    </div>
                  </div>
                  <select
                    value={dataRetentionDays}
                    onChange={(e) => setDataRetentionDays(Number(e.target.value))}
                    className="px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-slate-100"
                  >
                    <option value={90}>90 days</option>
                    <option value={180}>180 days</option>
                    <option value={365}>1 year</option>
                    <option value={730}>2 years</option>
                    <option value={0}>Forever</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                  <div className="flex items-center gap-4">
                    <TrendingUp className="text-gray-400" size={20} />
                    <div>
                      <p className="font-bold text-gray-900 dark:text-slate-100 text-sm">Analytics Collection</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">Allow us to collect usage analytics</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setAnalyticsEnabled(!analyticsEnabled)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${analyticsEnabled ? 'bg-brand-600' : 'bg-gray-300 dark:bg-slate-600'}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${analyticsEnabled ? 'left-6' : 'left-0.5'}`}></span>
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                  <div className="flex items-center gap-4">
                    <Mail className="text-gray-400" size={20} />
                    <div>
                      <p className="font-bold text-gray-900 dark:text-slate-100 text-sm">Marketing Communications</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">Receive product updates and offers</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setMarketingConsent(!marketingConsent)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${marketingConsent ? 'bg-brand-600' : 'bg-gray-300 dark:bg-slate-600'}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${marketingConsent ? 'left-6' : 'left-0.5'}`}></span>
                  </button>
                </div>
              </div>
            </div>

            {/* Data Export */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-8 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                  <Download size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-gray-800 dark:text-slate-100 uppercase tracking-widest">Data Export</h4>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">Download your data (POPIA/GDPR)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-all text-left">
                  <FileText className="text-blue-600" size={24} />
                  <div>
                    <p className="font-bold text-gray-900 dark:text-slate-100 text-sm">Export Posts</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Download all your posts as CSV</p>
                  </div>
                </button>
                <button className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-all text-left">
                  <Database className="text-green-600" size={24} />
                  <div>
                    <p className="font-bold text-gray-900 dark:text-slate-100 text-sm">Export Analytics</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Download engagement metrics</p>
                  </div>
                </button>
                <button className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-all text-left">
                  <User className="text-purple-600" size={24} />
                  <div>
                    <p className="font-bold text-gray-900 dark:text-slate-100 text-sm">Export Profile</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Download your account data</p>
                  </div>
                </button>
                <button className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-all text-left">
                  <Download className="text-orange-600" size={24} />
                  <div>
                    <p className="font-bold text-gray-900 dark:text-slate-100 text-sm">Export All Data</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Complete data archive (ZIP)</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Compliance */}
            <div className="bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-800 p-6">
              <h5 className="text-sm font-black text-gray-800 dark:text-slate-100 uppercase tracking-widest mb-4">Compliance & Legal</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <a href="#" className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 hover:border-brand-300 transition-all">
                  <FileText className="text-gray-400" size={20} />
                  <span className="text-sm font-bold text-gray-700 dark:text-slate-300">Privacy Policy</span>
                </a>
                <a href="#" className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 hover:border-brand-300 transition-all">
                  <FileText className="text-gray-400" size={20} />
                  <span className="text-sm font-bold text-gray-700 dark:text-slate-300">Terms of Service</span>
                </a>
                <a href="#" className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 hover:border-brand-300 transition-all">
                  <Shield className="text-gray-400" size={20} />
                  <span className="text-sm font-bold text-gray-700 dark:text-slate-300">POPIA Compliance</span>
                </a>
              </div>
            </div>

            {/* Delete Account */}
            <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-200 dark:border-red-900/30 p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 shrink-0">
                  <Trash2 size={20} />
                </div>
                <div className="flex-1">
                  <h5 className="text-sm font-black text-red-800 dark:text-red-400 uppercase tracking-widest">Delete Account</h5>
                  <p className="text-xs text-red-600 dark:text-red-400/80 mt-1 leading-relaxed">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <button className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-all">
                    Request Account Deletion
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Two-Factor Authentication */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-8 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                  <Shield size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-gray-800 dark:text-slate-100 uppercase tracking-widest">Two-Factor Authentication</h4>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">Add an extra layer of security</p>
                </div>
              </div>

              <div className={`p-4 rounded-xl border-2 ${twoFactorEnabled ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Key className={twoFactorEnabled ? 'text-green-600' : 'text-gray-400'} size={24} />
                    <div>
                      <p className="font-bold text-gray-900 dark:text-slate-100 text-sm">
                        {twoFactorEnabled ? '2FA is Enabled' : '2FA is Disabled'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        {twoFactorEnabled ? 'Your account is protected' : 'Enable for better security'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${twoFactorEnabled ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-brand-600 text-white hover:bg-brand-700'}`}
                  >
                    {twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                  </button>
                </div>
              </div>
            </div>

            {/* Change Password */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-8 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600">
                  <Lock size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-gray-800 dark:text-slate-100 uppercase tracking-widest">Change Password</h4>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">Update your account password</p>
                </div>
              </div>

              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-600 dark:text-slate-400 uppercase tracking-widest">Current Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-600 dark:text-slate-400 uppercase tracking-widest">New Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100"
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-600 dark:text-slate-400 uppercase tracking-widest">Confirm New Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100"
                    placeholder="••••••••"
                  />
                </div>
                <button
                  onClick={handlePasswordChange}
                  disabled={isChangingPassword}
                  className="px-6 py-3 bg-brand-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-brand-700 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isChangingPassword ? <RefreshCw size={14} className="animate-spin" /> : <Lock size={14} />}
                  {isChangingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </div>

            {/* Active Sessions */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-8 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                  <Laptop size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-gray-800 dark:text-slate-100 uppercase tracking-widest">Active Sessions</h4>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">Devices currently logged in</p>
                </div>
              </div>

              <div className="space-y-3">
                {sessions.map((session) => (
                  <div key={session.id} className={`flex items-center justify-between p-4 rounded-xl ${session.is_current ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-slate-800/50'}`}>
                    <div className="flex items-center gap-4">
                      <Laptop className={session.is_current ? 'text-green-600' : 'text-gray-400'} size={20} />
                      <div>
                        <p className="font-bold text-gray-900 dark:text-slate-100 text-sm flex items-center gap-2">
                          {session.device} • {session.browser}
                          {session.is_current && <span className="text-[10px] px-2 py-0.5 bg-green-600 text-white rounded-full">Current</span>}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">{session.location} • {session.ip_address}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          Last active: {new Date(session.last_active).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {!session.is_current && (
                      <button
                        onClick={() => handleRevokeSession(session.id)}
                        className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-bold hover:bg-red-200 transition-all"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'audit':
        return (
          <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  placeholder="Search audit logs..."
                  className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-gray-900 dark:text-slate-100"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <select
                  value={auditFilter}
                  onChange={(e) => setAuditFilter(e.target.value)}
                  className="pl-12 pr-10 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-gray-900 dark:text-slate-100 appearance-none cursor-pointer"
                >
                  <option value="all">All Activities</option>
                  <option value="login">Logins</option>
                  <option value="post_created">Posts Created</option>
                  <option value="post_published">Posts Published</option>
                  <option value="settings_changed">Settings Changes</option>
                  <option value="social_connected">Social Connections</option>
                  <option value="password_changed">Password Changes</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
              </div>
            </div>

            {/* Audit Log Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-slate-800">
                <h4 className="text-sm font-black text-gray-800 dark:text-slate-100 uppercase tracking-widest">Activity Log</h4>
              </div>

              {loadingAudit ? (
                <div className="flex items-center justify-center py-20">
                  <RefreshCw className="w-6 h-6 animate-spin text-brand-600" />
                </div>
              ) : filteredAuditLogs.length === 0 ? (
                <div className="text-center py-20">
                  <History className="w-12 h-12 mx-auto text-gray-300 dark:text-slate-600 mb-4" />
                  <p className="text-gray-500 dark:text-slate-400">No audit logs found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-slate-800">
                  {filteredAuditLogs.map((log) => (
                    <div key={log.id} className="p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                          {getAuditIcon(log.action)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-bold text-gray-900 dark:text-slate-100 text-sm">{log.description}</p>
                              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 capitalize">{log.action.replace(/_/g, ' ')}</p>
                            </div>
                            <p className="text-xs text-gray-400 whitespace-nowrap">
                              {new Date(log.created_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-[10px] text-gray-400">
                            <span className="flex items-center gap-1">
                              <Globe size={12} />
                              {log.ip_address}
                            </span>
                            <span className="flex items-center gap-1">
                              <Laptop size={12} />
                              {log.user_agent}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Export Button */}
              <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
                <button className="flex items-center gap-2 text-sm font-bold text-brand-600 hover:text-brand-700">
                  <Download size={16} />
                  Export Audit Log (CSV)
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 p-20 text-center space-y-6 animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-brand-50 dark:bg-brand-900/20 rounded-full flex items-center justify-center text-brand-600 mx-auto">
              {menuItems.find(t => t.id === activeTab)?.icon}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-slate-100">{menuItems.find(t => t.id === activeTab)?.label}</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 max-w-xs mx-auto mt-2 leading-relaxed">
                Settings for this category are being updated for better solo-operator security.
              </p>
            </div>
            <button className="px-8 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all text-sm shadow-xl shadow-brand-100/30">
              Refresh Module
            </button>
          </div>
        );
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-slate-100 tracking-tight">System Settings</h2>
          <p className="text-gray-500 dark:text-slate-400 text-sm font-medium">Manage your account, preferences, and workspace.</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 transition-all"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Nav */}
        <div className="lg:col-span-3 space-y-1 sticky top-32">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all group ${activeTab === item.id
                ? 'bg-brand-600 text-white shadow-xl shadow-brand-100/30'
                : 'text-gray-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900 hover:text-gray-900 dark:hover:text-slate-100 border border-transparent hover:border-gray-100 dark:hover:border-slate-800'
                }`}
            >
              <div className="flex items-center gap-3">
                <span className={activeTab === item.id ? 'text-white' : 'text-gray-400 dark:text-slate-500 group-hover:text-brand-600'}>{item.icon}</span>
                <span className="text-sm font-bold">{item.label}</span>
              </div>
              {activeTab === item.id && <ChevronRight size={16} />}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9 bg-white dark:bg-slate-900 min-h-[600px] rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-sm p-10">
          <div className="mb-10 pb-6 border-b border-gray-50 dark:border-slate-800">
            <h3 className="text-lg font-black text-gray-900 dark:text-slate-100">{menuItems.find(i => i.id === activeTab)?.label}</h3>
            <p className="text-sm text-gray-400 font-medium">Manage details and settings for your {activeTab.toLowerCase()}.</p>
          </div>
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default Settings;
