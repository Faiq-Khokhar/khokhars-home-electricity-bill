import https from 'https';

// Create a custom HTTPS agent that accepts self-signed certificates
const httpsAgent = new https.Agent({
  rejectUnauthorized: false, // Accept self-signed certificates
});

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Figure out the upstream path. Support both:
    // - Rewrites that preserve the path (/api/lesco/Bill.aspx -> /api/lesco-proxy)
    // - Direct calls (/api/lesco-proxy?path=Bill.aspx)
    let urlPath = 'Bill.aspx';
    try {
      const parsedUrl = new URL(
        req.url || '',
        `http://${req.headers.host || 'localhost'}`
      );
      const queryPath = parsedUrl.searchParams.get('path');
      const rewritePath =
        req.url && req.url.includes('/api/lesco/')
          ? req.url.split('/api/lesco/')[1]
          : null;

      urlPath = (queryPath || rewritePath || 'Bill.aspx').replace(/^\//, '');
    } catch (e) {
      console.error('Failed to parse request URL, falling back:', e);
    }
    const targetUrl = `https://www.lesco.gov.pk:36260/${urlPath}`;
    
    // Convert body to URLSearchParams format
    let bodyString = '';
    try {
      if (typeof req.body === 'string') {
        bodyString = req.body;
      } else if (req.body && typeof req.body === 'object') {
        bodyString = new URLSearchParams(req.body).toString();
      } else {
        bodyString = '';
      }
    } catch (e) {
      console.error('Failed to parse request body, sending empty body:', e);
      bodyString = '';
    }

    // Use node-fetch with custom agent
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en-US,en;q=0.9',
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      },
      body: bodyString,
      agent: httpsAgent,
      timeout: 30000, // 30 second timeout
    });

    if (!response.ok) {
      throw new Error(`LESCO server returned status: ${response.status}`);
    }

    const html = await response.text();
    
    // Return the HTML response
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).send(html);
    
  } catch (error) {
    console.error('Proxy error:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({ 
      error: 'Failed to fetch bill data',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// Increase the function timeout and body size limit
export const config = {
  api: {
    bodyParser: true,
    responseLimit: '8mb',
    externalResolver: true,
  },
};
