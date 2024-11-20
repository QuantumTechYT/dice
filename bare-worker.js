// Import Bare Server
importScripts('https://cdn.jsdelivr.net/gh/titaniumnetwork-dev/Ultraviolet@main/dist/bare.bundle.js');

// Create Bare Server instance
const bare = new Bare.Server();

addEventListener('fetch', event => {
  event.respondWith(handleBareRequest(event.request));
});

async function handleBareRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

  const response = await bare.handle(request);
  
  // Add CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*');
  
  return response;
} 