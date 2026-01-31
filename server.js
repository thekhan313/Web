/**
 * server.js
 * 
 * A single-file Node.js server using Express that serves a premium 
 * video gallery website. Contains both Backend API and Frontend (HTML/CSS/JS).
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Data file path
const VIDEOS_FILE = path.join(__dirname, 'videos.json');

/**
 * Reusable functions to manage video data
 */
function getAllVideos() {
    try {
        const data = fs.readFileSync(VIDEOS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Error reading videos file:", err);
        return [];
    }
}

function getVideoById(id) {
    const videos = getAllVideos();
    return videos.find(v => v.id === id);
}

function getVideosByCategory(category) {
    const videos = getAllVideos();
    return videos.filter(v => v.category.toLowerCase() === category.toLowerCase());
}

// API Endpoint for dynamic frontend
const SUBMISSIONS_FILE = path.join(__dirname, 'submissions.json');

function saveSubmission(submission) {
    try {
        let submissions = [];
        if (fs.existsSync(SUBMISSIONS_FILE)) {
            const data = fs.readFileSync(SUBMISSIONS_FILE, 'utf8');
            submissions = JSON.parse(data);
        }
        submissions.push(submission);
        fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(submissions, null, 2));
        return true;
    } catch (err) {
        console.error("Error saving submission:", err);
        return false;
    }
}

app.post('/api/submit-video', express.json(), (req, res) => {
    const { title, filename, category, description, email } = req.body;

    if (!title || !category || !email) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const newSubmission = {
        id: Date.now().toString(),
        title,
        filename: filename || 'pending_upload',
        category,
        description: description || '',
        contactEmail: email,
        status: 'pending',
        createdAt: new Date().toISOString()
    };

    if (saveSubmission(newSubmission)) {
        res.status(201).json({ message: "Submission received" });
    } else {
        res.status(500).json({ error: "Internal Server Error" });
    }
});
app.get('/api/videos', (req, res) => {
    const videos = getAllVideos();
    res.json(videos);
});

// Get single video detail
app.get('/api/video/:id', (req, res) => {
    const video = getVideoById(req.params.id);
    if (video) {
        res.json(video);
    } else {
        res.status(404).json({ error: "Video not found" });
    }
});

// Get recommended videos based on category
app.get('/api/video/:id/recommended', (req, res) => {
    const currentVideo = getVideoById(req.params.id);
    if (!currentVideo) {
        return res.status(404).json({ error: "Video not found" });
    }

    const allVideos = getAllVideos();
    const recommended = allVideos.filter(v =>
        v.category === currentVideo.category && v.id !== currentVideo.id
    ).slice(0, 20);

    res.json(recommended);
});

// Get videos by category
app.get('/api/category/:name', (req, res) => {
    const category = req.params.name;
    const videos = getVideosByCategory(category);
    res.json(videos);
});

// Search videos
app.get('/api/search', (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.json([]);
    }
    const videos = getAllVideos();
    const results = videos.filter(v =>
        v.title.toLowerCase().includes(query.toLowerCase())
    );
    res.json(results);
});

// ============================================
// ADMIN API ENDPOINTS
// ============================================

const REPORTS_FILE = path.join(__dirname, 'reports.json');

// Helper functions for admin operations
function saveVideos(videos) {
    try {
        fs.writeFileSync(VIDEOS_FILE, JSON.stringify(videos, null, 2));
        return true;
    } catch (err) {
        console.error("Error saving videos:", err);
        return false;
    }
}

function getAllSubmissions() {
    try {
        if (!fs.existsSync(SUBMISSIONS_FILE)) {
            return [];
        }
        const data = fs.readFileSync(SUBMISSIONS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Error reading submissions:", err);
        return [];
    }
}

function saveSubmissions(submissions) {
    try {
        fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(submissions, null, 2));
        return true;
    } catch (err) {
        console.error("Error saving submissions:", err);
        return false;
    }
}

function getAllReports() {
    try {
        if (!fs.existsSync(REPORTS_FILE)) {
            return [];
        }
        const data = fs.readFileSync(REPORTS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Error reading reports:", err);
        return [];
    }
}

function saveReports(reports) {
    try {
        fs.writeFileSync(REPORTS_FILE, JSON.stringify(reports, null, 2));
        return true;
    } catch (err) {
        console.error("Error saving reports:", err);
        return false;
    }
}

// GET /api/admin/videos - Return all videos
app.get('/api/admin/videos', (req, res) => {
    const videos = getAllVideos();
    res.json(videos);
});

// PUT /api/admin/videos/:id - Update video details
app.put('/api/admin/videos/:id', express.json(), (req, res) => {
    const { id } = req.params;
    const { title, category, thumbnail, videoUrl } = req.body;

    const videos = getAllVideos();
    const index = videos.findIndex(v => v.id === id);

    if (index === -1) {
        return res.status(404).json({ error: "Video not found" });
    }

    // Update video properties
    if (title) videos[index].title = title;
    if (category) videos[index].category = category;
    if (thumbnail) videos[index].thumbnail = thumbnail;
    if (videoUrl) videos[index].videoUrl = videoUrl;

    if (saveVideos(videos)) {
        res.json({ message: "Video updated successfully", video: videos[index] });
    } else {
        res.status(500).json({ error: "Failed to save video" });
    }
});

// DELETE /api/admin/videos/:id - Delete video
app.delete('/api/admin/videos/:id', (req, res) => {
    const { id } = req.params;
    const videos = getAllVideos();
    const filteredVideos = videos.filter(v => v.id !== id);

    if (filteredVideos.length === videos.length) {
        return res.status(404).json({ error: "Video not found" });
    }

    if (saveVideos(filteredVideos)) {
        res.json({ message: "Video deleted successfully" });
    } else {
        res.status(500).json({ error: "Failed to delete video" });
    }
});

// GET /api/admin/submissions - Return pending submissions
app.get('/api/admin/submissions', (req, res) => {
    const submissions = getAllSubmissions();
    const pending = submissions.filter(s => s.status === 'pending');
    res.json(pending);
});

// POST /api/admin/submissions/:id/approve - Approve submission
app.post('/api/admin/submissions/:id/approve', express.json(), (req, res) => {
    const { id } = req.params;
    const submissions = getAllSubmissions();
    const submissionIndex = submissions.findIndex(s => s.id === id);

    if (submissionIndex === -1) {
        return res.status(404).json({ error: "Submission not found" });
    }

    const submission = submissions[submissionIndex];

    // Create new video from submission
    const videos = getAllVideos();
    const newVideo = {
        id: Date.now().toString(),
        title: submission.title,
        category: submission.category,
        thumbnail: submission.thumbnail || 'https://picsum.photos/seed/' + Date.now() + '/400/225',
        videoUrl: submission.videoUrl || submission.filename,
        views: 0,
        createdAt: new Date().toISOString()
    };

    videos.unshift(newVideo);

    // Mark submission as approved
    submissions[submissionIndex].status = 'approved';
    submissions[submissionIndex].approvedAt = new Date().toISOString();

    if (saveVideos(videos) && saveSubmissions(submissions)) {
        res.json({ message: "Submission approved and published", video: newVideo });
    } else {
        res.status(500).json({ error: "Failed to approve submission" });
    }
});

// POST /api/admin/submissions/:id/reject - Reject submission
app.post('/api/admin/submissions/:id/reject', express.json(), (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const submissions = getAllSubmissions();
    const submissionIndex = submissions.findIndex(s => s.id === id);

    if (submissionIndex === -1) {
        return res.status(404).json({ error: "Submission not found" });
    }

    submissions[submissionIndex].status = 'rejected';
    submissions[submissionIndex].rejectedAt = new Date().toISOString();
    if (reason) submissions[submissionIndex].rejectionReason = reason;

    if (saveSubmissions(submissions)) {
        res.json({ message: "Submission rejected" });
    } else {
        res.status(500).json({ error: "Failed to reject submission" });
    }
});

// GET /api/admin/notifications - Return all notifications
app.get('/api/admin/notifications', (req, res) => {
    const submissions = getAllSubmissions();
    const reports = getAllReports();

    // Convert pending submissions to notifications
    const submissionNotifications = submissions
        .filter(s => s.status === 'pending')
        .map(s => ({
            id: `submission_${s.id}`,
            type: 'video',
            title: `New Video Submission: ${s.title}`,
            description: `User "${s.contactEmail}" submitted "${s.title}" for review.`,
            submissionId: s.id,
            videoTitle: s.title,
            category: s.category,
            email: s.contactEmail,
            videoDescription: s.description,
            videoUrl: s.videoUrl || s.filename,
            thumbnail: s.thumbnail,
            createdAt: s.createdAt,
            status: 'unread'
        }));

    // Combine with reports
    const allNotifications = [...submissionNotifications, ...reports];

    // Sort by date (newest first)
    allNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(allNotifications);
});

// POST /api/admin/notifications/:id/read - Mark notification as read
app.post('/api/admin/notifications/:id/read', (req, res) => {
    const { id } = req.params;

    // Check if it's a report notification
    if (id.startsWith('report_') || id.startsWith('system_')) {
        const reports = getAllReports();
        const reportIndex = reports.findIndex(r => r.id === id);

        if (reportIndex !== -1) {
            reports[reportIndex].status = 'read';
            if (saveReports(reports)) {
                return res.json({ message: "Notification marked as read" });
            }
        }
    }

    res.json({ message: "Notification marked as read" });
});


// 2. API Endpoint: Returns video list as JSON
app.get('/videos', (req, res) => {
    const videos = getAllVideos();
    res.json(videos);
});

// 3. Frontend Route: Serves embedded HTML/CSS/JS
app.get('/', (req, res) => {
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>VideoStream - Premium Gallery</title>
        <style>
            :root {
                --primary: #6366f1;
                --bg: #0f172a;
                --card-bg: rgba(30, 41, 59, 0.7);
                --text: #f8fafc;
                --text-muted: #94a3b8;
            }

            * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }

            body {
                background-color: var(--bg);
                color: var(--text);
                min-height: 100vh;
                padding: 2rem;
            }

            header {
                max-width: 1200px;
                margin: 0 auto 3rem;
                text-align: center;
            }

            header h1 {
                font-size: 2.5rem;
                font-weight: 800;
                background: linear-gradient(to right, #818cf8, #c084fc);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                margin-bottom: 0.5rem;
            }

            header p {
                color: var(--text-muted);
            }

            #video-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 2rem;
                max-width: 1200px;
                margin: 0 auto;
            }

            .video-card {
                background: var(--card-bg);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                overflow: hidden;
                cursor: pointer;
                transition: transform 0.3s ease, box-shadow 0.3s ease;
            }

            .video-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
            }

            .thumbnail-container {
                position: relative;
                aspect-ratio: 16/9;
                overflow: hidden;
            }

            .thumbnail-container img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }

            .play-overlay {
                position: absolute;
                inset: 0;
                background: rgba(0, 0, 0, 0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .video-card:hover .play-overlay {
                opacity: 1;
            }

            .play-icon {
                width: 50px;
                height: 50px;
                background: var(--primary);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .video-info {
                padding: 1rem;
            }

            .video-info h3 {
                font-size: 1.1rem;
                margin-bottom: 0.25rem;
            }

            #player-modal {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.9);
                backdrop-filter: blur(5px);
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                padding: 1rem;
            }

            .modal-content {
                width: 100%;
                max-width: 900px;
                position: relative;
            }

            video {
                width: 100%;
                border-radius: 12px;
                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
            }

            .close-btn {
                position: absolute;
                top: -40px;
                right: 0;
                background: none;
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
            }
        </style>
    </head>
    <body>
        <header>
            <h1>VideoStream.</h1>
            <p>Your curated premium video experience</p>
        </header>

        <main id="video-grid"></main>

        <div id="player-modal">
            <div class="modal-content">
                <button class="close-btn" onclick="closePlayer()">&times; Close</button>
                <video id="main-player" controls>
                    Your browser does not support the video tag.
                </video>
            </div>
        </div>

        <script>
            const videoGrid = document.getElementById('video-grid');
            const playerModal = document.getElementById('player-modal');
            const mainPlayer = document.getElementById('main-player');

            async function loadVideos() {
                try {
                    const response = await fetch('/videos');
                    const videos = await response.json();
                    renderVideos(videos);
                } catch (error) {
                    console.error('Error fetching videos:', error);
                }
            }

            function renderVideos(videos) {
                videoGrid.innerHTML = '';
                videos.forEach(video => {
                    const card = document.createElement('div');
                    card.className = 'video-card';
                    card.onclick = () => openPlayer(video.video_url);
                    card.innerHTML = '<div class="thumbnail-container">' +
                            '<img src="' + video.thumbnail_url + '" alt="' + video.title + '">' +
                            '<div class="play-overlay">' +
                                '<div class="play-icon">' +
                                    '<svg width="24" height="24" viewBox="0 0 24 24" fill="white">' +
                                        '<path d="M8 5v14l11-7z" />' +
                                    '</svg>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                        '<div class="video-info">' +
                            '<h3>' + video.title + '</h3>' +
                        '</div>';
                    videoGrid.appendChild(card);
                });
            }

            function openPlayer(url) {
                mainPlayer.src = url;
                playerModal.style.display = 'flex';
                mainPlayer.play();
            }

            function closePlayer() {
                playerModal.style.display = 'none';
                mainPlayer.pause();
                mainPlayer.src = '';
            }

            playerModal.addEventListener('click', (e) => {
                if (e.target === playerModal) closePlayer();
            });

            loadVideos();
        </script>
    </body>
    </html>
    `;
    res.send(htmlContent);
});

app.listen(PORT, () => {
    console.log("Server running at http://localhost:" + PORT);
});
