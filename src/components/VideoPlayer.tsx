import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

interface VideoPlayerProps {
  src: string;
  title?: string;
  onTimeUpdate?: (currentTime: number) => void;
  onEnded?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  src, 
  title, 
  onTimeUpdate, 
  onEnded 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const loadVideo = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (Hls.isSupported()) {
          // Use HLS.js for HLS streams
          if (hlsRef.current) {
            hlsRef.current.destroy();
          }

          hlsRef.current = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
          });

          hlsRef.current.loadSource(src);
          hlsRef.current.attachMedia(video);

          hlsRef.current.on(Hls.Events.MANIFEST_PARSED, () => {
            setIsLoading(false);
            video.play().catch(console.error);
          });

          hlsRef.current.on(Hls.Events.ERROR, (event, data) => {
            console.error('HLS error:', data);
            setError('Failed to load video stream');
            setIsLoading(false);
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          // Native HLS support (Safari)
          video.src = src;
          video.addEventListener('loadedmetadata', () => {
            setIsLoading(false);
            video.play().catch(console.error);
          });
          video.addEventListener('error', () => {
            setError('Failed to load video');
            setIsLoading(false);
          });
        } else {
          setError('HLS is not supported in this browser');
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error loading video:', err);
        setError('Failed to load video');
        setIsLoading(false);
      }
    };

    loadVideo();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      onTimeUpdate?.(video.currentTime);
    };

    const handleEnded = () => {
      onEnded?.();
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [onTimeUpdate, onEnded]);

  return (
    <div className="video-player-container">
      {title && <h3 className="video-title">{title}</h3>}
      
      <div className="video-wrapper">
        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner">Loading...</div>
          </div>
        )}
        
        {error && (
          <div className="error-overlay">
            <div className="error-message">{error}</div>
          </div>
        )}
        
        <video
          ref={videoRef}
          controls
          className="video-element"
          style={{ width: '100%', maxHeight: '70vh' }}
        >
          Your browser does not support the video tag.
        </video>
      </div>

      <style jsx>{`
        .video-player-container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .video-title {
          margin-bottom: 15px;
          font-size: 1.5rem;
          font-weight: 600;
          color: #333;
        }

        .video-wrapper {
          position: relative;
          background: #000;
          border-radius: 8px;
          overflow: hidden;
        }

        .video-element {
          display: block;
          width: 100%;
          height: auto;
        }

        .loading-overlay,
        .error-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          z-index: 10;
        }

        .loading-spinner {
          font-size: 1.2rem;
          animation: pulse 1.5s ease-in-out infinite;
        }

        .error-message {
          font-size: 1.1rem;
          text-align: center;
          padding: 20px;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default VideoPlayer; 