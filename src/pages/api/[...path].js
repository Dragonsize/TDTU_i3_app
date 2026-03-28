/**
 * Next.js Pages-Router API Route — catch-all proxy to FastAPI backend.
 *
 * Lives in src/pages/api/ because the project uses the src/ directory
 * convention (src/app/ for App Router). Next.js requires Pages Router
 * files to be under the same src/ root.
 *
 * This proxy reliably forwards ALL response headers (especially
 * Set-Cookie) from FastAPI back to the browser — critical for
 * HttpOnly cookie-based authentication.
 */

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

function streamToBuffer(readable) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readable.on('data', (chunk) => chunks.push(chunk));
    readable.on('end', () => resolve(Buffer.concat(chunks)));
    readable.on('error', reject);
  });
}

export default async function handler(req, res) {
  const pathSegments = req.query.path ?? [];
  const path = Array.isArray(pathSegments) ? pathSegments.join('/') : pathSegments;

  const queryString = req.url.includes('?') ? '?' + req.url.split('?').slice(1).join('?') : '';
  const backendUrl = `${BACKEND_URL}/api/${path}${queryString}`;

  // Forward headers, strip host
  const forwardHeaders = { ...req.headers };
  delete forwardHeaders['host'];
  delete forwardHeaders['connection'];

  let body = undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    body = await streamToBuffer(req);
  }

  let backendRes;
  try {
    backendRes = await fetch(backendUrl, {
      method: req.method,
      headers: forwardHeaders,
      body: body && body.length > 0 ? body : undefined,
    });
  } catch (err) {
    return res.status(502).json({ detail: 'Backend unreachable', error: String(err) });
  }

  // Forward status code
  res.status(backendRes.status);

  // Forward ALL response headers — crucially Set-Cookie
  backendRes.headers.forEach((value, key) => {
    if (['transfer-encoding', 'content-encoding'].includes(key.toLowerCase())) return;
    // Use appendHeader for Set-Cookie so multiple cookies are preserved
    if (key.toLowerCase() === 'set-cookie') {
      res.appendHeader('Set-Cookie', value);
    } else {
      res.setHeader(key, value);
    }
  });

  const responseBuffer = Buffer.from(await backendRes.arrayBuffer());
  res.end(responseBuffer);
}
