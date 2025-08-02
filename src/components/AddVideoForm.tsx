import React, { useState } from 'react';
import axios from 'axios';

interface AddVideoFormProps {
  onVideoAdded: () => void;
}

interface VideoResponse {
  id: number;
  title: string;
  url: string;
  source: string;
  status: string;
  createdAt: string;
}

const AddVideoForm: React.FC<AddVideoFormProps> = ({ onVideoAdded }) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      setError('Please enter a video URL');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post<VideoResponse>('/api/videos', {
        url: url.trim(),
        title: title.trim() || undefined
      });

      setSuccess(`Video "${response.data.title}" added to queue successfully!`);
      setUrl('');
      setTitle('');
      onVideoAdded();
    } catch (err: any) {
      console.error('Error adding video:', err);
      setError(err.response?.data?.message || 'Failed to add video. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const detectSource = (url: string): string => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
    if (url.includes('rutube.ru')) return 'Rutube';
    if (url.includes('vk.com')) return 'VK';
    if (url.includes('kinopoisk.ru')) return 'Kinopoisk';
    return 'Unknown';
  };

  return (
    <div className="add-video-form">
      <h2>Add New Video</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="url">Video URL:</label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            disabled={isLoading}
            required
          />
          {url && (
            <div className="source-indicator">
              Source: {detectSource(url)}
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="title">Title (optional):</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Custom title for the video"
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {success && (
          <div className="success-message">
            {success}
          </div>
        )}

        <button 
          type="submit" 
          disabled={isLoading || !url.trim()}
          className="submit-button"
        >
          {isLoading ? 'Adding...' : 'Add Video'}
        </button>
      </form>

      <div className="supported-sources">
        <h3>Supported Sources:</h3>
        <ul>
          <li>YouTube</li>
          <li>Rutube</li>
          <li>VK</li>
          <li>Kinopoisk</li>
          <li>And many more via yt-dlp</li>
        </ul>
      </div>

      <style jsx>{`
        .add-video-form {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        h2 {
          margin-bottom: 20px;
          color: #333;
          text-align: center;
        }

        .form-group {
          margin-bottom: 20px;
        }

        label {
          display: block;
          margin-bottom: 5px;
          font-weight: 600;
          color: #555;
        }

        input {
          width: 100%;
          padding: 12px;
          border: 2px solid #ddd;
          border-radius: 6px;
          font-size: 16px;
          transition: border-color 0.3s;
        }

        input:focus {
          outline: none;
          border-color: #007bff;
        }

        input:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
        }

        .source-indicator {
          margin-top: 5px;
          font-size: 14px;
          color: #666;
          font-style: italic;
        }

        .submit-button {
          width: 100%;
          padding: 12px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.3s;
        }

        .submit-button:hover:not(:disabled) {
          background: #0056b3;
        }

        .submit-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .error-message {
          padding: 10px;
          margin: 10px 0;
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
          border-radius: 4px;
        }

        .success-message {
          padding: 10px;
          margin: 10px 0;
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
          border-radius: 4px;
        }

        .supported-sources {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
        }

        .supported-sources h3 {
          margin-bottom: 10px;
          color: #333;
        }

        .supported-sources ul {
          list-style: none;
          padding: 0;
        }

        .supported-sources li {
          padding: 5px 0;
          color: #666;
        }

        .supported-sources li:before {
          content: "✓ ";
          color: #28a745;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
};

export default AddVideoForm; 