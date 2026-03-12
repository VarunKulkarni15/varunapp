const ytdl = require('@distube/ytdl-core');

export default async function handler(req, res) {
    // 1. Setup CORS so your GitHub Pages frontend is allowed to talk to this backend
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 2. Get the YouTube Video ID from the request URL
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ error: 'Missing YouTube ID. Provide an ?id= parameter.' });
    }

    try {
        // 3. Trick YouTube into giving us the raw media streams
        const info = await ytdl.getInfo(id);
        
        // 4. Filter out the video, we ONLY want the audio (specifically M4A for mobile background play)
        const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
        const format = audioFormats.find(f => f.container === 'm4a') || audioFormats[0];

        if (!format) {
            return res.status(404).json({ error: 'No audio format found for this video.' });
        }

        // 5. Send the raw, ad-free audio URL back to your Blossom Frontend
        return res.status(200).json({
            success: true,
            url: format.url,
            duration: info.videoDetails.lengthSeconds,
            title: info.videoDetails.title
        });

    } catch (error) {
        console.error("Extraction Error:", error.message);
        return res.status(500).json({ success: false, error: 'Extraction failed: ' + error.message });
    }
}