class ProxyClient {
    constructor(baseUrl = window.location.origin) {
        this.baseUrl = baseUrl;
    }

    async get(key) {
        console.log('Looking up:', key);
        const encodedKey = encodeURIComponent(key);
        const response = await fetch(`${this.baseUrl}/lookup/${encodedKey}`);
        
        if (!response.ok) {
            throw new Error(`Request failed: ${response.statusText}`);
        }

        // If response is a redirect, it's a URL proxy request
        if (response.redirected) {
            window.location.href = response.url;
            return null;
        }
        
        // Otherwise it's a dictionary result
        return await response.json();
    }
}

// Remove the test function since we're using the UI now
console.log('ProxyClient class loaded'); 