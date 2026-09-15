const express = require('express');
const cors = require('cors');
const axios = require('axios'); // <-- ⚠️ នេះជាកន្លែងដែលខ្វះកាលពីមុន (ត្រូវតែមានកូដនេះ)
const getFBInfo = require('@xaviabot/fb-downloader'); 
const app = express();

app.use(cors());
app.use(express.json());

// API Endpoint សម្រាប់ទាញយកវីដេអូពិតប្រាកដ
app.post('/api/download', async (req, res) => {
    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ error: 'សូមបញ្ចូល Link វីដេអូ Facebook!' });
    }

    try {
        const data = await getFBInfo(url);

        if (!data || (!data.sd && !data.hd)) {
            return res.status(404).json({ error: 'រកមិនឃើញវីដេអូ ឬ Link មិនត្រឹមត្រូវ!' });
        }

        const videoDownloadUrl = data.hd || data.sd;

        res.json({
            success: true,
            title: data.title || "វីដេអូ Facebook របស់អ្នក",
            downloadUrl: videoDownloadUrl 
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'មានបញ្ហាក្នុងការទាញយកវីដេអូ សូមព្យាយាមម្ដងទៀត!' });
    }
});

// API Proxy សម្រាប់ទាញយកវីដេអូកាត់ផ្តាច់បញ្ហា CORS របស់ Facebook
app.get('/api/proxy-download', async (req, res) => {
    try {
        const videoUrl = req.query.url;
        // ទាញយក filename ពី Frontend មក (បើគ្មាន ប្រើ facebook-video ជំនួស)
        let filename = req.query.filename ? req.query.filename + '.mp4' : 'facebook-video.mp4';
        
        // Encode ឈ្មោះ file ដើម្បីការពារបញ្ហាអក្សរខ្មែរ
        const encodedFilename = encodeURIComponent(filename);

        const response = await fetch(videoUrl);
        if (!response.ok) throw new Error('Failed to fetch video');

        // កំណត់ Header ឱ្យ Browser ចាំបាច់ត្រូវ Save តាមឈ្មោះនេះ
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
        res.setHeader('Content-Type', 'video/mp4');

        const reader = response.body.getReader();
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
        }
        res.end();
    } catch (error) {
        console.error(error);
        res.status(500).send('Download failed');
    }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
