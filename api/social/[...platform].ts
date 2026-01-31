import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleTikTok } from './tiktok';
import { handleTwitter } from './twitter';
import { handleYouTube } from './youtube';
import { handleLinkedIn } from './linkedin';
import { handleFacebook } from './facebook';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { platform } = req.query;

  try {
    switch (platform) {
      case 'tiktok':
        return await handleTikTok(req, res);
      case 'twitter':
        return await handleTwitter(req, res);
      case 'youtube':
        return await handleYouTube(req, res);
      case 'linkedin':
        return await handleLinkedIn(req, res);
      case 'facebook':
        return await handleFacebook(req, res);
      default:
        return res.status(404).json({ error: 'Platform not found' });
    }
  } catch (error) {
    console.error(`Error in social API (${platform}):`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
