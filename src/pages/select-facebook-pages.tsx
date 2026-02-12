import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Facebook } from 'lucide-react';

interface FacebookPage {
    pageId: string;
    pageName: string;
    pageAccessToken: string;
    category?: string;
    hasInstagram: boolean;
    instagramBusinessAccountId?: string;
}

export default function SelectFacebookPages() {
    const { user } = useAuth();
    const [pages, setPages] = useState<FacebookPage[]>([]);
    const [selectedPageIds, setSelectedPageIds] = useState<Set<string>>(new Set());
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        // Load pages from sessionStorage
        const pagesData = sessionStorage.getItem('facebook_pages_pending');
        if (pagesData) {
            const parsedPages = JSON.parse(pagesData);
            setPages(parsedPages);
            // Auto-select all by default
            const pageIds = parsedPages.map((p: FacebookPage) => p.pageId);
            setSelectedPageIds(new Set(pageIds));
        } else {
            // No pages found, redirect home
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
        }
    }, []);

    const togglePage = (pageId: string) => {
        const newSelected = new Set(selectedPageIds);
        if (newSelected.has(pageId)) {
            newSelected.delete(pageId);
        } else {
            newSelected.add(pageId);
        }
        setSelectedPageIds(newSelected);
    };

    const handleSave = async () => {
        if (selectedPageIds.size === 0) {
            alert('Please select at least one page to connect.');
            return;
        }

        setIsSaving(true);
        try {
            // Get workspace
            const { data: workspaces } = await supabase
                .from('workspaces')
                .select('id')
                .eq('owner_id', user!.id)
                .limit(1);

            if (!workspaces?.length) throw new Error('No workspace found');
            const workspaceId = workspaces[0].id;

            // Save each selected page as a separate social_accounts entry
            for (const page of pages) {
                if (selectedPageIds.has(page.pageId)) {
                    await supabase.from('social_accounts').upsert({
                        workspace_id: workspaceId,
                        connected_by: user!.id,
                        platform: 'facebook',
                        account_id: page.pageId,
                        display_name: page.pageName,
                        account_type: 'page',
                        access_token: page.pageAccessToken,
                        is_active: true,
                        connection_status: 'connected',
                        platform_data: {
                            category: page.category,
                            hasInstagram: page.hasInstagram,
                            instagramBusinessAccountId: page.instagramBusinessAccountId,
                        },
                    }, { onConflict: 'workspace_id,platform,account_id' });
                }
            }

            // Clear sessionStorage
            sessionStorage.removeItem('facebook_pages_pending');
            sessionStorage.removeItem('facebook_connection_id');

            // Show success message
            const pageNames = pages
                .filter(p => selectedPageIds.has(p.pageId))
                .map(p => p.pageName)
                .join(', ');

            alert(`✅ Connected to Facebook Pages: ${pageNames}!`);

            // Redirect to Social Media settings
            window.location.href = '/#social';
        } catch (error: any) {
            console.error('Error saving pages:', error);
            alert(`Failed to save pages: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (pages.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading pages...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <Facebook className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Select Facebook Pages</h1>
                            <p className="text-gray-600">
                                Choose which Facebook Pages you want to connect
                            </p>
                        </div>
                    </div>

                    <div className="mb-6">
                        <p className="text-sm text-gray-600">
                            You can publish posts from EngageHub to the pages you select below.
                            Page tokens never expire, so your connection will remain active.
                        </p>
                    </div>

                    <div className="space-y-3 mb-6">
                        {pages.map((page) => (
                            <div
                                key={page.pageId}
                                className={`border rounded-lg p-4 cursor-pointer transition-all ${selectedPageIds.has(page.pageId)
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                onClick={() => togglePage(page.pageId)}
                            >
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedPageIds.has(page.pageId)}
                                        onChange={() => togglePage(page.pageId)}
                                        className="mr-3 h-5 w-5 text-blue-600 cursor-pointer"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-800">{page.pageName}</h3>
                                        <div className="flex items-center gap-3 mt-1">
                                            {page.category && (
                                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                                    {page.category}
                                                </span>
                                            )}
                                            {page.hasInstagram && (
                                                <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded font-medium">
                                                    📸 Instagram Linked
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t">
                        <p className="text-sm text-gray-600">
                            <span className="font-semibold">{selectedPageIds.size}</span> of {pages.length} page(s) selected
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => window.location.href = '/'}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors font-medium"
                            >
                                Skip for Now
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving || selectedPageIds.size === 0}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                            >
                                {isSaving ? 'Connecting...' : `Connect ${selectedPageIds.size} Page${selectedPageIds.size !== 1 ? 's' : ''}`}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
