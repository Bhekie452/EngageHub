import React, { useState } from 'react';
import { Facebook, Instagram, Twitter, Youtube, Linkedin, Tiktok } from 'lucide-react';
import FacebookConnection from './FacebookConnection';
import FacebookPageConnection from './FacebookPageConnection';

interface SocialPlatform {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  connected: boolean;
  component?: React.ReactNode;
}

export default function SocialMedia() {
  const [activeTab, setActiveTab] = useState<'connections' | 'pages'>('connections');

  const platforms: SocialPlatform[] = [
    {
      id: 'facebook',
      name: 'Facebook',
      icon: <Facebook size={24} />,
      color: 'bg-blue-500',
      connected: false, // This would come from your state/API
      component: <FacebookConnection />
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: <Instagram size={24} />,
      color: 'bg-pink-500',
      connected: false,
    },
    {
      id: 'twitter',
      name: 'Twitter',
      icon: <Twitter size={24} />,
      color: 'bg-sky-500',
      connected: false,
    },
    {
      id: 'youtube',
      name: 'YouTube',
      icon: <Youtube size={24} />,
      color: 'bg-red-500',
      connected: false,
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: <Linkedin size={24} />,
      color: 'bg-blue-700',
      connected: false,
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      icon: <Tiktok size={24} />,
      color: 'bg-black',
      connected: false,
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Social Media Integrations</h1>
        <p className="text-gray-600 dark:text-gray-400">Connect your social media accounts to manage content across platforms</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-8 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('connections')}
          className={`pb-3 px-4 font-medium transition-colors ${
            activeTab === 'connections'
              ? 'text-brand-600 border-b-2 border-brand-600'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          Connections
        </button>
        <button
          onClick={() => setActiveTab('pages')}
          className={`pb-3 px-4 font-medium transition-colors ${
            activeTab === 'pages'
              ? 'text-brand-600 border-b-2 border-brand-600'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          Pages
        </button>
      </div>

      {/* 3 Cards in a Row - Same Size with Requested Class */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {platforms.slice(0, 3).map((platform) => (
          <div key={platform.id} className="bg-white border rounded-lg p-6 max-w-md mx-auto text-center">
            <div className={`w-16 h-16 ${platform.color} rounded-full flex items-center justify-center text-white mx-auto mb-4`}>
              {platform.icon}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {platform.name}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {platform.connected ? 'Connected' : 'Not connected'}
            </p>
            <button
              className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                platform.connected
                  ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  : 'bg-brand-600 text-white hover:bg-brand-700'
              }`}
            >
              {platform.connected ? 'Manage' : 'Connect'}
            </button>
          </div>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-8">
        {activeTab === 'connections' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Active Connections</h2>
            <FacebookConnection />
          </div>
        )}
        
        {activeTab === 'pages' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Connected Pages</h2>
            <FacebookPageConnection />
          </div>
        )}
      </div>
    </div>
  );
}
