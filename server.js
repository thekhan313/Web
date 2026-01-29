/**
 * server.js
 * 
 * A single-file Node.js server using Express that serves a premium 
 * video gallery website. Contains both Backend API and Frontend (HTML/CSS/JS).
 */

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// 1. Hardcoded Video Data
const videos = [
    {
        id: "1",
        title: "Mountain Serenity",
        video_url: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        thumbnail_url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=60"
    },
    {
        id: "2",
        title: "Ocean Waves",
        video_url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        thumbnail_url: "https://images.unsplash.com/photo-1505118380757-91f5f5832de0?w=800&auto=format&fit=crop&q=60"
    },
    {
        id: "3",
        title: "City Lights",
        video_url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        thumbnail_url: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&auto=format&fit=crop&q=60"
    },
    {
        id: "4",
        title: "Nature Trails",
        video_url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        thumbnail_url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&auto=format&fit=crop&q=60"
    },
    {
        id: "5",
        title: "Space Journey",
        video_url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
        thumbnail_url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=60"
    },
    {
        id: "6",
        title: "Night Sky",
        video_url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
        thumbnail_url: "https://images.unsplash.com/photo-1532667449560-72a95c8d381b?w=800&auto=format&fit=crop&q=60"
    }
];

// 2. API Endpoint: Returns video list as JSON
app.get('/videos', (req, res) => {
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
