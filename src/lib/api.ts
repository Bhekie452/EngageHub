/**
 * API Client Utility
 * Centralized API client for making requests to the backend
 */

const API_BASE = typeof window !== 'undefined' ? window.location.origin : '';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
}

/**
 * Make an API request
 */
async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'An error occurred');
    }

    return { data };
  } catch (error) {
    console.error(`API request failed: ${endpoint}`, error);
    return { 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    };
  }
}

// Social Media API
export const socialApi = {
  /**
   * Publish a post to a social media platform
   */
  async publishPost(postData: any) {
    return apiRequest('/api/social/publish', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  },

  /**
   * Get engagement metrics for a post
   */
  async getPostEngagement(postId: string) {
    return apiRequest(`/api/utils?endpoint=post-engagement&postId=${postId}`);
  },
};

// Payments API
export const paymentsApi = {
  /**
   * Create a checkout session
   */
  async createCheckoutSession(checkoutData: {
    priceId: string;
    userId: string;
    successUrl: string;
    cancelUrl: string;
  }) {
    return apiRequest('/api/payments?provider=stripe', {
      method: 'POST',
      body: JSON.stringify(checkoutData),
    });
  },
};

// Content API
export const contentApi = {
  /**
   * Process scheduled posts
   */
  async processScheduledPosts() {
    return apiRequest('/api/utils?endpoint=process-scheduled-posts', {
      method: 'POST',
    });
  },

  /**
   * Publish a campaign
   */
  async publishCampaign(campaignId: string, message: string) {
    return apiRequest('/api/utils?endpoint=publish-campaign', {
      method: 'POST',
      body: JSON.stringify({ campaignId, message }),
    });
  },

  /**
   * Publish a post
   */
  async publishPost(postData: any) {
    return apiRequest('/api/publish-post', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  },
};

// Auth API
export const authApi = {
  /**
   * Exchange OAuth code for tokens
   */
  async exchangeCode(provider: string, params: any) {
    return apiRequest(`/api/auth?provider=${provider}&action=token`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  /**
   * Get user profile
   */
  async getProfile(provider: string, accessToken: string) {
    return apiRequest(`/api/auth?provider=${provider}&action=profile`, {
      method: 'POST',
      body: JSON.stringify({ accessToken }),
    });
  },

  /**
   * Refresh access token
   */
  async refreshToken(provider: string, refreshToken: string) {
    return apiRequest(`/api/auth?provider=${provider}&action=refresh`, {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  },

  /**
   * Get organization details (for LinkedIn)
   */
  async getOrganizationDetails(accessToken: string, organizationUrn: string) {
    return apiRequest('/api/auth?provider=linkedin&action=organization-details', {
      method: 'POST',
      body: JSON.stringify({ accessToken, organizationUrn }),
    });
  },

  /**
   * Get YouTube channel info
   */
  async getYouTubeChannel(accessToken: string) {
    return apiRequest('/api/auth?provider=youtube&action=channel', {
      method: 'POST',
      body: JSON.stringify({ accessToken }),
    });
  },
};
