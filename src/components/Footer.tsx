import React, { useEffect, useState } from 'react';
import { Facebook, Instagram, Twitter, Linkedin, Youtube, Music, CheckCircle2, AlertCircle, Link as LinkIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ConnectedProfile {
  platform: string;
  username?: string;
  avatar?: string;
  followerCount?: number;
  connected: boolean;
  error?: string;
}

const platformIcons = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
  tiktok: Music,
};

const platformColors = {
  facebook: 'text-[#1877F2]',
  instagram: 'text-[#E4405F]',
  twitter: 'text-[#1DA1F2]',
  linkedin: 'text-[#0A66C2]',
  youtube: 'text-[#FF0000]',
  tiktok: 'text-[#000000]',
};

export default function Footer() {
  const [profiles, setProfiles] = useState<Record<string, ConnectedProfile>>({});

  useEffect(() => {
    const fetchProfiles = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch social_accounts for the current workspace
      const { data: workspaces } = await supabase
        .from('workspaces')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1);
      if (!workspaces?.length) return;
      const workspaceId = workspaces[0].id;

      const { data: accounts } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('is_active', true);

      const init: Record<string, ConnectedProfile> = {};
      for (const platform of ['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok']) {
        init[platform] = { platform, connected: false };
      }

      if (accounts) {
        for (const acc of accounts) {
          const platform = acc.platform.toLowerCase();
          if (platform in init) {
            init[platform] = {
              platform,
              username: acc.username || acc.display_name || undefined,
              avatar: acc.avatar_url || undefined,
              followerCount: acc.follower_count ? Number(acc.follower_count) : undefined,
              connected: true,
            };
          }
        }
      }

      // TODO: Add YouTube from youtube_accounts table
      const { data: ytAcc } = await supabase
        .from('youtube_accounts')
        .select('channel_id')
        .eq('workspace_id', workspaceId)
        .single();
      if (ytAcc) {
        init.youtube.connected = true;
        // TODO: Fetch channel details (name, avatar, subscriber count) via YouTube API
      }

      setProfiles(init);
    };
    fetchProfiles();
  }, []);

  const handleConnect = (platform: string) => {
    const baseUrl = window.location.origin;
    const workspaceId = 'YOUR_WORKSPACE_ID'; // TODO: get from context
    const returnUrl = encodeURIComponent(baseUrl);

    const oauthUrls = {
      facebook: `https://zourlqrkoyugzymxkbgn.functions.supabase.co/facebook-oauth/start?workspaceId=${workspaceId}&returnUrl=${returnUrl}`,
      instagram: `https://zourlqrkoyugzymxkbgn.functions.supabase.co/instagram-oauth/start?workspaceId=${workspaceId}&returnUrl=${returnUrl}`,
      twitter: `https://zourlqrkoyugzymxkbgn.functions.supabase.co/twitter-oauth/start?workspaceId=${workspaceId}&returnUrl=${returnUrl}`,
      linkedin: `https://zourlqrkoyugzymxkbgn.functions.supabase.co/linkedin-oauth/start?workspaceId=${workspaceId}&returnUrl=${returnUrl}`,
      tiktok: `https://zourlqrkoyugzymxkbgn.functions.supabase.co/tiktok-oauth/start?workspaceId=${workspaceId}&returnUrl=${returnUrl}`,
    };

    const url = oauthUrls[platform as keyof typeof oauthUrls];
    if (url) {
      window.open(url, '_blank');
    } else {
      console.error(`Unsupported platform: ${platform}`);
    }
  };

  return (
    <footer className="bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(profiles).map(([platform, profile]) => {
            const Icon = platformIcons[platform as keyof typeof platformIcons];
            const colorClass = platformColors[platform as keyof typeof platformColors];
            return (
              <div
                key={platform}
                className="flex flex-col items-center p-3 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-md transition-shadow"
              >
                <Icon className={`w-6 h-6 mb-2 ${colorClass}`} />
                <span className="text-xs font-medium capitalize text-gray-900 dark:text-white mb-1">
                  {platform}
                </span>
                {profile.connected ? (
                  <>
                    <div className="flex items-center gap-1 text-green-600 text-xs">
                      <CheckCircle2 size={12} />
                      Connected
                    </div>
                    {profile.username && (
                      <span className="text-xs text-gray-600 dark:text-slate-400 truncate w-full text-center">
                        {profile.username}
                      </span>
                    )}
                    {profile.followerCount && (
                      <span className="text-xs text-gray-500">
                        {profile.followerCount.toLocaleString()} followers
                      </span>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => handleConnect(platform)}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-medium"
                  >
                    <LinkIcon size={12} />
                    Connect
                  </button>
                )}
                {profile.error && (
                  <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                    <AlertCircle size={12} />
                    {profile.error}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </footer>
  );
}
