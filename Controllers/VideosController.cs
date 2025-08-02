using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StreamService.Data;
using StreamService.Models;

namespace StreamService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VideosController : ControllerBase
    {
        private readonly StreamServiceContext _context;
        private readonly ILogger<VideosController> _logger;
        private readonly IConfiguration _configuration;

        public VideosController(
            StreamServiceContext context,
            ILogger<VideosController> logger,
            IConfiguration configuration)
        {
            _context = context;
            _logger = logger;
            _configuration = configuration;
        }

        // GET: api/videos
        [HttpGet]
        public async Task<ActionResult<VideoListResponse>> GetVideos(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string? status = null,
            [FromQuery] string? source = null)
        {
            try
            {
                var query = _context.Videos.AsQueryable();

                if (!string.IsNullOrEmpty(status))
                    query = query.Where(v => v.Status == status);

                if (!string.IsNullOrEmpty(source))
                    query = query.Where(v => v.Source == source);

                var totalCount = await query.CountAsync();
                var videos = await query
                    .OrderByDescending(v => v.CreatedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                var response = new VideoListResponse
                {
                    Videos = videos.Select(MapToResponse).ToList(),
                    TotalCount = totalCount,
                    Page = page,
                    PageSize = pageSize
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting videos");
                return StatusCode(500, "Internal server error");
            }
        }

        // GET: api/videos/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<VideoResponse>> GetVideo(int id)
        {
            try
            {
                var video = await _context.Videos.FindAsync(id);

                if (video == null)
                    return NotFound();

                return Ok(MapToResponse(video));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting video {Id}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        // POST: api/videos
        [HttpPost]
        public async Task<ActionResult<VideoResponse>> AddVideo(AddVideoRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var video = new Video
                {
                    Title = request.Title ?? "Untitled",
                    Url = request.Url,
                    Status = "Queued",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Videos.Add(video);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Added video to queue: {Url}", request.Url);

                return CreatedAtAction(nameof(GetVideo), new { id = video.Id }, MapToResponse(video));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding video {Url}", request.Url);
                return StatusCode(500, "Internal server error");
            }
        }

        // DELETE: api/videos/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteVideo(int id)
        {
            try
            {
                var video = await _context.Videos.FindAsync(id);

                if (video == null)
                    return NotFound();

                // Delete video file if it exists
                if (!string.IsNullOrEmpty(video.LocalPath) && File.Exists(video.LocalPath))
                {
                    try
                    {
                        var videoDir = Path.GetDirectoryName(video.LocalPath);
                        if (!string.IsNullOrEmpty(videoDir) && Directory.Exists(videoDir))
                        {
                            Directory.Delete(videoDir, true);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to delete video files for {Id}", id);
                    }
                }

                _context.Videos.Remove(video);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting video {Id}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        // GET: api/videos/{id}/stream
        [HttpGet("{id}/stream")]
        public async Task<IActionResult> StreamVideo(int id)
        {
            try
            {
                var video = await _context.Videos.FindAsync(id);

                if (video == null)
                    return NotFound();

                if (video.Status != "Ready" || string.IsNullOrEmpty(video.LocalPath))
                    return BadRequest("Video is not ready for streaming");

                if (!File.Exists(video.LocalPath))
                    return NotFound("Video file not found");

                var fileName = Path.GetFileName(video.LocalPath);
                var contentType = "application/vnd.apple.mpegurl";

                return PhysicalFile(video.LocalPath, contentType, fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error streaming video {Id}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        // GET: api/videos/status
        [HttpGet("status")]
        public async Task<ActionResult<object>> GetStatus()
        {
            try
            {
                var statusCounts = await _context.Videos
                    .GroupBy(v => v.Status)
                    .Select(g => new { Status = g.Key, Count = g.Count() })
                    .ToListAsync();

                var totalVideos = await _context.Videos.CountAsync();
                var readyVideos = await _context.Videos.CountAsync(v => v.Status == "Ready");
                var queuedVideos = await _context.Videos.CountAsync(v => v.Status == "Queued");
                var processingVideos = await _context.Videos.CountAsync(v => v.Status == "Downloading" || v.Status == "Processing");

                return Ok(new
                {
                    TotalVideos = totalVideos,
                    ReadyVideos = readyVideos,
                    QueuedVideos = queuedVideos,
                    ProcessingVideos = processingVideos,
                    StatusBreakdown = statusCounts
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting status");
                return StatusCode(500, "Internal server error");
            }
        }

        private VideoResponse MapToResponse(Video video)
        {
            return new VideoResponse
            {
                Id = video.Id,
                Title = video.Title,
                Url = video.Url,
                Source = video.Source,
                Status = video.Status,
                LocalPath = video.LocalPath,
                Duration = video.Duration,
                FileSize = video.FileSize,
                ThumbnailUrl = video.ThumbnailUrl,
                Description = video.Description,
                CreatedAt = video.CreatedAt,
                UpdatedAt = video.UpdatedAt,
                StreamUrl = video.Status == "Ready" ? $"/api/videos/{video.Id}/stream" : null
            };
        }
    }
} 