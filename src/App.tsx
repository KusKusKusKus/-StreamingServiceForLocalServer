import React, { useState } from 'react';
import VideoPlayer from './components/VideoPlayer';
import VideoList from './components/VideoList';
import AddVideoForm from './components/AddVideoForm';
import './App.css';

interface Video {
  id: number;
  title: string;
  url: string;
  source: string;
  status: string;
  duration?: number;
  fileSize?: number;
  thumbnailUrl?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  streamUrl?: string;
}

function App() {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [currentView, setCurrentView] = useState<'list' | 'add' | 'player'>('list');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleVideoSelect = (video: Video) => {
    setSelectedVideo(video);
    setCurrentView('player');
  };

  const handleVideoAdded = () => {
    setRefreshTrigger(prev => prev + 1);
    setCurrentView('list');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedVideo(null);
  };

  const handleBackToPlayer = () => {
    setCurrentView('player');
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Streaming Service</h1>
        <nav className="nav-menu">
          <button 
            onClick={() => setCurrentView('list')}
            className={currentView === 'list' ? 'active' : ''}
          >
            Library
          </button>
          <button 
            onClick={() => setCurrentView('add')}
            className={currentView === 'add' ? 'active' : ''}
          >
            Add Video
          </button>
          {selectedVideo && (
            <button 
              onClick={handleBackToPlayer}
              className={currentView === 'player' ? 'active' : ''}
            >
              Now Playing
            </button>
          )}
        </nav>
      </header>

      <main className="App-main">
        {currentView === 'list' && (
          <VideoList 
            onVideoSelect={handleVideoSelect}
            refreshTrigger={refreshTrigger}
          />
        )}

        {currentView === 'add' && (
          <div className="add-video-container">
            <AddVideoForm onVideoAdded={handleVideoAdded} />
          </div>
        )}

        {currentView === 'player' && selectedVideo && (
          <div className="player-container">
            <div className="player-header">
              <button onClick={handleBackToList} className="back-button">
                ← Back to Library
              </button>
            </div>
            <VideoPlayer 
              src={selectedVideo.streamUrl || ''}
              title={selectedVideo.title}
            />
            <div className="video-details">
              <h3>Video Details</h3>
              <p><strong>Source:</strong> {selectedVideo.source}</p>
              <p><strong>Status:</strong> {selectedVideo.status}</p>
              {selectedVideo.duration && (
                <p><strong>Duration:</strong> {Math.floor(selectedVideo.duration / 60)}:{(selectedVideo.duration % 60).toString().padStart(2, '0')}</p>
              )}
              {selectedVideo.fileSize && (
                <p><strong>File Size:</strong> {(selectedVideo.fileSize / (1024 * 1024)).toFixed(1)} MB</p>
              )}
              {selectedVideo.description && (
                <p><strong>Description:</strong> {selectedVideo.description}</p>
              )}
            </div>
          </div>
        )}
      </main>

      <style jsx>{`
        .App {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .App-header {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          padding: 1rem 2rem;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .App-header h1 {
          margin: 0 0 1rem 0;
          color: #333;
          text-align: center;
          font-size: 2rem;
        }

        .nav-menu {
          display: flex;
          justify-content: center;
          gap: 1rem;
        }

        .nav-menu button {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          background: #f8f9fa;
          color: #333;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .nav-menu button:hover {
          background: #e9ecef;
          transform: translateY(-1px);
        }

        .nav-menu button.active {
          background: #007bff;
          color: white;
        }

        .App-main {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .add-video-container {
          max-width: 800px;
          margin: 0 auto;
        }

        .player-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .player-header {
          margin-bottom: 1rem;
        }

        .back-button {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 6px;
          background: #6c757d;
          color: white;
          cursor: pointer;
          font-weight: 600;
          transition: background-color 0.3s;
        }

        .back-button:hover {
          background: #5a6268;
        }

        .video-details {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          margin-top: 1rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .video-details h3 {
          margin: 0 0 1rem 0;
          color: #333;
        }

        .video-details p {
          margin: 0.5rem 0;
          color: #666;
        }

        .video-details strong {
          color: #333;
        }
      `}</style>
    </div>
  );
}

export default App; 