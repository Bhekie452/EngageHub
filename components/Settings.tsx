
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
  Columns
} from 'lucide-react';
import { useAuth } from '../src/hooks/useAuth';
import { supabase } from '../src/lib/supabase';
import { useTheme } from '../src/hooks/useTheme';
import { useCurrency } from '../src/hooks/useCurrency';

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
}

const Settings: React.FC = () => {
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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

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
      }
      setLoadingProfile(false);
    };

    fetchProfile();
  }, [user?.id]);

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

  // Local temporary state for the "Interactive Preview" logic before "Apply"
  const [tempMode, setTempMode] = useState(themeMode);
  const [tempColor, setTempColor] = useState(primaryColor);
  const [tempSidebarColor, setTempSidebarColor] = useState(sidebarColor);
  const [isApplying, setIsApplying] = useState(false);

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

            {/* Placeholder for actual billing info */}
            <div className="bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-800 p-8 text-center space-y-4">
              <CreditCard size={40} className="mx-auto text-gray-300" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Subscription Management</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 max-w-sm mx-auto">
                Manage your plan, payment methods, and billing history.
              </p>
              <button className="px-6 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700 transition-all">
                Manage Subscription
              </button>
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
