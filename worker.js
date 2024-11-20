// Import Ultraviolet
importScripts('https://cdn.jsdelivr.net/gh/titaniumnetwork-dev/Ultraviolet@main/dist/uv.bundle.js');

// Configure Ultraviolet
const uv = new Ultraviolet({
  prefix: '/service/',
  bare: 'https://bare.aarush-ric.workers.dev/',
  encodeUrl: Ultraviolet.codec.xor.encode,
  decodeUrl: Ultraviolet.codec.xor.decode,
  handler: '/uv.handler.js',
  bundle: '/uv.bundle.js',
  config: '/uv.config.js',
  sw: '/uv.sw.js',
});

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get('url');
  const word = url.searchParams.get('word');

  // Handle dictionary lookup
  if (word) {
    try {
      const dictResponse = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
      const data = await dictResponse.json();
      return new Response(JSON.stringify(data), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Dictionary lookup failed' }), { status: 500 });
    }
  }

  // Handle proxy request using Ultraviolet
  if (targetUrl) {
    try {
      return await uv.fetch(request);
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch URL',
        details: error.message 
      }), { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }

  return new Response('Missing URL or word parameter', { status: 400 });
} 