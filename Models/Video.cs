using System.ComponentModel.DataAnnotations;

namespace StreamService.Models
{
    public class Video
    {
        public int Id { get; set; }
        
        [Required]
        [MaxLength(255)]
        public string Title { get; set; } = string.Empty;
        
        [Required]
        public string Url { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(50)]
        public string Source { get; set; } = string.Empty; // youtube, rutube, vk, kinopoisk, etc.
        
        [MaxLength(20)]
        public string Status { get; set; } = "Queued"; // Queued, Downloading, Processing, Ready, Failed
        
        public string? LocalPath { get; set; }
        
        public int? Duration { get; set; } // in seconds
        
        public long? FileSize { get; set; } // in bytes
        
        public string? ThumbnailUrl { get; set; }
        
        public string? Description { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
} 