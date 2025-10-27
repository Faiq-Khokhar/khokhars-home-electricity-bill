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
    // Extract the path after /api/lesco/
    const urlPath = req.url.split('/api/lesco/')[1] || 'Bill.aspx';
    const targetUrl = `https://www.lesco.gov.pk:36260/${urlPath}`;
    
    console.log('Proxying to:', targetUrl);
    console.log('Request body:', req.body);

    // Convert body to URLSearchParams format
    let bodyString;
    if (typeof req.body === 'string') {
      bodyString = req.body;
    } else {
      bodyString = new URLSearchParams(req.body).toString();
    }

    console.log('Body string:', bodyString);

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

    console.log('Response status:', response.status);

    if (!response.ok) {
      throw new Error(`LESCO server returned status: ${response.status}`);
    }

    const html = await response.text();
    
    console.log('Response length:', html.length);

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