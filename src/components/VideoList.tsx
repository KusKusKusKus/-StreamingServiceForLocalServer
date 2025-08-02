import React, { useState, useEffect } from 'react';
import axios from 'axios';

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

interface VideoListResponse {
  videos: Video[];
  totalCount: number;
  page: number;
  pageSize: number;
}

interface VideoListProps {
  onVideoSelect: (video: Video) => void;
  refreshTrigger: number;
}

const VideoList: React.FC<VideoListProps> = ({ onVideoSelect, refreshTrigger }) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '20'
      });

      if (statusFilter) {
        params.append('status', statusFilter);
      }

      const response = await axios.get<VideoListResponse>(`/api/videos?${params}`);
      setVideos(response.data.videos);
      setTotalCount(response.data.totalCount);
    } catch (err: any) {
      console.error('Error fetching videos:', err);
      setError('Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [page, statusFilter, refreshTrigger]);

  const handleDelete = async (videoId: number) => {
    if (!window.confirm('Are you sure you want to delete this video?')) {
      return;
    }

    try {
      await axios.delete(`/api/videos/${videoId}`);
      fetchVideos(); // Refresh the list
    } catch (err: any) {
      console.error('Error deleting video:', err);
      alert('Failed to delete video');
    }
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return 'Unknown';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Ready': return '#28a745';
      case 'Queued': return '#ffc107';
      case 'Downloading': return '#17a2b8';
      case 'Processing': return '#fd7e14';
      case 'Failed': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const totalPages = Math.ceil(totalCount / 20);

  return (
    <div className="video-list">
      <div className="list-header">
        <h2>Video Library</h2>
        <div className="filters">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-filter"
          >
            <option value="">All Status</option>
            <option value="Ready">Ready</option>
            <option value="Queued">Queued</option>
            <option value="Downloading">Downloading</option>
            <option value="Processing">Processing</option>
            <option value="Failed">Failed</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="loading">
          Loading videos...
        </div>
      )}

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {!loading && !error && videos.length === 0 && (
        <div className="empty-state">
          <p>No videos found. Add your first video to get started!</p>
        </div>
      )}

      <div className="videos-grid">
        {videos.map((video) => (
          <div key={video.id} className="video-card">
            <div className="video-thumbnail">
              {video.thumbnailUrl ? (
                <img src={video.thumbnailUrl} alt={video.title} />
              ) : (
                <div className="placeholder-thumbnail">
                  <span>No Preview</span>
                </div>
              )}
              <div 
                className="status-badge"
                style={{ backgroundColor: getStatusColor(video.status) }}
              >
                {video.status}
              </div>
            </div>

            <div className="video-info">
              <h3 className="video-title" onClick={() => onVideoSelect(video)}>
                {video.title}
              </h3>
              
              <div className="video-meta">
                <span className="source">{video.source}</span>
                {video.duration && (
                  <span className="duration">{formatDuration(video.duration)}</span>
                )}
                {video.fileSize && (
                  <span className="file-size">{formatFileSize(video.fileSize)}</span>
                )}
              </div>

              <div className="video-actions">
                {video.status === 'Ready' && video.streamUrl && (
                  <button 
                    className="play-button"
                    onClick={() => onVideoSelect(video)}
                  >
                    Play
                  </button>
                )}
                <button 
                  className="delete-button"
                  onClick={() => handleDelete(video.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="page-button"
          >
            Previous
          </button>
          
          <span className="page-info">
            Page {page} of {totalPages}
          </span>
          
          <button 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="page-button"
          >
            Next
          </button>
        </div>
      )}

      <style jsx>{`
        .video-list {
          padding: 20px;
        }

        .list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .list-header h2 {
          margin: 0;
          color: #333;
        }

        .status-filter {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
        }

        .loading, .error, .empty-state {
          text-align: center;
          padding: 40px;
          color: #666;
        }

        .error {
          color: #dc3545;
        }

        .videos-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }

        .video-card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          transition: transform 0.2s;
        }

        .video-card:hover {
          transform: translateY(-2px);
        }

        .video-thumbnail {
          position: relative;
          height: 180px;
          background: #f5f5f5;
        }

        .video-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .placeholder-thumbnail {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #999;
        }

        .status-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          padding: 4px 8px;
          border-radius: 4px;
          color: white;
          font-size: 12px;
          font-weight: 600;
        }

        .video-info {
          padding: 15px;
        }

        .video-title {
          margin: 0 0 10px 0;
          font-size: 16px;
          color: #333;
          cursor: pointer;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .video-title:hover {
          color: #007bff;
        }

        .video-meta {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
          font-size: 12px;
          color: #666;
        }

        .video-actions {
          display: flex;
          gap: 10px;
        }

        .play-button, .delete-button {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .play-button {
          background: #28a745;
          color: white;
        }

        .play-button:hover {
          background: #218838;
        }

        .delete-button {
          background: #dc3545;
          color: white;
        }

        .delete-button:hover {
          background: #c82333;
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 15px;
          margin-top: 20px;
        }

        .page-button {
          padding: 8px 16px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 4px;
          cursor: pointer;
        }

        .page-button:hover:not(:disabled) {
          background: #f8f9fa;
        }

        .page-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .page-info {
          color: #666;
        }
      `}</style>
    </div>
  );
};

export default VideoList; 