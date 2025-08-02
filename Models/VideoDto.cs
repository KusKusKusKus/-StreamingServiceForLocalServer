using System.ComponentModel.DataAnnotations;

namespace StreamService.Models
{
    public class AddVideoRequest
    {
        [Required]
        [Url]
        public string Url { get; set; } = string.Empty;
        
        public string? Title { get; set; }
    }
    
    public class VideoResponse
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Url { get; set; } = string.Empty;
        public string Source { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? LocalPath { get; set; }
        public int? Duration { get; set; }
        public long? FileSize { get; set; }
        public string? ThumbnailUrl { get; set; }
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string? StreamUrl { get; set; }
    }
    
    public class VideoListResponse
    {
        public List<VideoResponse> Videos { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
    }
} 