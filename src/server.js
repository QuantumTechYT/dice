const express = require('express');
const cors = require('cors');
const Unblocker = require('unblocker');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('src'));

// Create Unblocker instance with specific site handling
const unblocker = new Unblocker({
    prefix: '/proxy/',
    requestMiddleware: [
        function(data) {
            // Add common browser headers
            data.headers['user-agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
            data.headers['accept-language'] = 'en-US,en;q=0.9';
            
            // Special handling for specific sites
            const url = data.url.toLowerCase();
            if (url.includes('youtube.com') || url.includes('discord.com')) {
                data.headers['origin'] = new URL(data.url).origin;
                data.headers['referer'] = data.url;
            }
        }
    ],
    // Increase timeout for video streaming
    standardHeaders: true,
    processContentTypes: [
        'text/html',
        'text/javascript',
        'text/css',
        'application/javascript',
        'application/x-javascript',
        'application/json',
        'image/*',
        'video/*'
    ]
});

// Dictionary proxy handler
class DictionaryProxy {
    constructor() {
        this.cache = new Map();
    }

    async get(word) {
        if (this.cache.has(word)) {
            return this.cache.get(word);
        }

        try {
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
            const data = await response.json();
            this.cache.set(word, data);
            return data;
        } catch (error) {
            console.error('Dictionary API Error:', error);
            return null;
        }
    }
}

// Combined proxy handler
class CombinedProxy {
    constructor() {
        this.dictionary = new DictionaryProxy();
        this.commonSites = [
            'youtube.com',
            'discord.com',
            'poki.com',
            'crazygames.com',
            'google.com'
        ];
    }

    async get(key) {
        // Check if it's one of our common sites
        const matchedSite = this.commonSites.find(site => 
            key.toLowerCase().includes(site.toLowerCase())
        );

        if (matchedSite || (key.includes('.') && !key.includes(' '))) {
            return { type: 'url', url: key };
        }

        return { type: 'dictionary', data: await this.dictionary.get(key) };
    }
}

const proxy = new CombinedProxy();

// Routes
app.get('/lookup/:key', async (req, res) => {
    try {
        const { key } = req.params;
        const result = await proxy.get(decodeURIComponent(key));
        
        if (result.type === 'url') {
            let url = result.url;
            if (!url.startsWith('http')) {
                url = 'https://' + url;
            }
            res.redirect(`/proxy/${url}`);
        } else if (result.data) {
            res.json(result.data);
        } else {
            res.status(404).json({ error: 'No definition found' });
        }
    } catch (error) {
        console.error('Error handling request:', error);
        res.status(500).json({ error: 'No definition found' });
    }
});

// Apply unblocker middleware
app.use(unblocker);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 