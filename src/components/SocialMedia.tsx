import React, { useState } from 'react';
import { Facebook, Instagram, Twitter, Youtube, Linkedin, Music } from 'lucide-react';
import FacebookConnection from './FacebookConnection';
import InstagramConnection from './InstagramConnection';
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
      component: <InstagramConnection />
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
      icon: <Music size={24} />,
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

      {/* 3 Cards in a Row - Modern Design */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {platforms.slice(0, 3).map((platform) => (
          <div className="group relative bg-white border border-gray-200 rounded-xl p-6 max-w-md mx-auto text-center shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            {/* Icon Container with Gradient Background */}
            <div className={`w-20 h-20 ${platform.color} rounded-2xl flex items-center justify-center text-white mx-auto mb-6 relative overflow-hidden group-hover:scale-110 transition-transform duration-300`}>
              {/* Shine Effect */}
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-2xl"></div>
              {platform.icon}
            </div>
            
            {/* Platform Name */}
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-brand-600 transition-colors duration-300">
              {platform.name}
            </h3>
            
            {/* Status Badge */}
            <div className="flex items-center justify-center mb-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                platform.connected 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-gray-100 text-gray-600 border border-gray-200'
              }`}>
                {platform.connected ? (
                  <span className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Connected
                  </span>
                ) : (
                  <span className="flex items-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                    Not connected
                  </span>
                )}
              </div>
            </div>
            
            {/* Connect Button */}
            <button
              className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                platform.connected
                  ? 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 hover:from-gray-200 hover:to-gray-300 border border-gray-300'
                  : 'bg-gradient-to-r from-brand-600 to-brand-700 text-white hover:from-brand-700 hover:to-brand-800 shadow-lg shadow-brand-500/25 hover:shadow-brand-600/40'
              }`}
            >
              {platform.connected ? (
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.989 2.599-1.989 1.989s1.989.426 1.989c1.989 1.426 0 0-.993-.352-1.989-1.989C8.972 15.581 4.317 19.437 3.998 19.437c0 .553.089 1.069.089 1.069s1.069-.553 1.069-1.069c0-.553-.089-1.069-.089-1.069-.553.089-1.069-1.069-1.989-.426-1.989-1.989C8.972 4.317 10.325 4.317 10.325c0 1.558.089 3.11.089 3.11s3.11-.089 4.317-3.11 4.317c0 1.558-.089 2.11-.089 2.11s2.11-.089 3.11-3.11c0-1.558.089-2.11.089-2.11-2.11-.089-3.11 3.11-2.11-1.558.089-4.317-4.317-4.317-1.558.089-2.11-2.11-2.11-.089-3.11 3.11-2.11-1.558.089-4.317-4.317-4.317z" />
                  </svg>
                  Manage
                </span>
              ) : (
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 2L3 9v9l9-9V2M18 9l-9 9v9M13 22l9-9" />
                  </svg>
                  Connect
                </span>
              )}
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
