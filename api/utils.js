// Basic API handler for /api/utils
// Supports ?endpoint=publish-post

export default async function handler(req, res) {
  const { endpoint } = req.query;

  if (endpoint === 'publish-post') {
    // TODO: Implement your publish-post logic here
    return res.status(200).json({ message: 'publish-post endpoint hit', success: true });
  }

  return res.status(404).json({ error: 'Endpoint not found' });
}
