using System.Diagnostics;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;
using StreamService.Data;
using StreamService.Models;

namespace StreamService.Services
{
    public class VideoDownloadService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<VideoDownloadService> _logger;
        private readonly IConfiguration _configuration;

        public VideoDownloadService(
            IServiceProvider serviceProvider,
            ILogger<VideoDownloadService> logger,
            IConfiguration configuration)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
            _configuration = configuration;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var context = scope.ServiceProvider.GetRequiredService<StreamServiceContext>();

                    var nextVideo = await context.Videos
                        .FirstOrDefaultAsync(v => v.Status == "Queued", stoppingToken);

                    if (nextVideo != null)
                    {
                        await ProcessVideo(nextVideo, context, stoppingToken);
                    }
                    else
                    {
                        await Task.Delay(5000, stoppingToken); // Wait 5 seconds before checking again
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in video download service");
                    await Task.Delay(10000, stoppingToken); // Wait 10 seconds on error
                }
            }
        }

        private async Task ProcessVideo(Video video, StreamServiceContext context, CancellationToken stoppingToken)
        {
            try
            {
                _logger.LogInformation("Starting download for video {VideoId}: {Title}", video.Id, video.Title);
                
                // Update status to Downloading
                video.Status = "Downloading";
                video.UpdatedAt = DateTime.UtcNow;
                await context.SaveChangesAsync(stoppingToken);

                // Detect source and get video info
                var source = DetectVideoSource(video.Url);
                video.Source = source;

                // Get video info using yt-dlp
                var videoInfo = await GetVideoInfo(video.Url, stoppingToken);
                if (videoInfo != null)
                {
                    video.Title = videoInfo.Title ?? video.Title;
                    video.Duration = videoInfo.Duration;
                    video.ThumbnailUrl = videoInfo.Thumbnail;
                    video.Description = videoInfo.Description;
                }

                // Update status to Processing
                video.Status = "Processing";
                video.UpdatedAt = DateTime.UtcNow;
                await context.SaveChangesAsync(stoppingToken);

                // Download and convert video
                var videoPath = await DownloadAndConvertVideo(video.Url, video.Id, stoppingToken);
                
                if (!string.IsNullOrEmpty(videoPath))
                {
                    video.LocalPath = videoPath;
                    video.Status = "Ready";
                    video.FileSize = new FileInfo(videoPath).Length;
                    video.UpdatedAt = DateTime.UtcNow;
                    
                    _logger.LogInformation("Successfully processed video {VideoId}", video.Id);
                }
                else
                {
                    video.Status = "Failed";
                    video.UpdatedAt = DateTime.UtcNow;
                    _logger.LogError("Failed to process video {VideoId}", video.Id);
                }

                await context.SaveChangesAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing video {VideoId}", video.Id);
                video.Status = "Failed";
                video.UpdatedAt = DateTime.UtcNow;
                await context.SaveChangesAsync(stoppingToken);
            }
        }

        private string DetectVideoSource(string url)
        {
            if (url.Contains("youtube.com") || url.Contains("youtu.be"))
                return "youtube";
            if (url.Contains("rutube.ru"))
                return "rutube";
            if (url.Contains("vk.com"))
                return "vk";
            if (url.Contains("kinopoisk.ru"))
                return "kinopoisk";
            
            return "unknown";
        }

        private async Task<VideoInfo?> GetVideoInfo(string url, CancellationToken stoppingToken)
        {
            try
            {
                var startInfo = new ProcessStartInfo
                {
                    FileName = "yt-dlp",
                    Arguments = $"--dump-json \"{url}\"",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                using var process = Process.Start(startInfo);
                if (process == null) return null;

                var output = await process.StandardOutput.ReadToEndAsync(stoppingToken);
                await process.WaitForExitAsync(stoppingToken);

                if (process.ExitCode == 0 && !string.IsNullOrEmpty(output))
                {
                    // Parse JSON output to extract video info
                    // This is a simplified version - you might want to use proper JSON parsing
                    var titleMatch = Regex.Match(output, "\"title\":\\s*\"([^\"]+)\"");
                    var durationMatch = Regex.Match(output, "\"duration\":\\s*(\\d+)");
                    var thumbnailMatch = Regex.Match(output, "\"thumbnail\":\\s*\"([^\"]+)\"");
                    var descriptionMatch = Regex.Match(output, "\"description\":\\s*\"([^\"]+)\"");

                    return new VideoInfo
                    {
                        Title = titleMatch.Success ? titleMatch.Groups[1].Value : null,
                        Duration = durationMatch.Success ? int.Parse(durationMatch.Groups[1].Value) : null,
                        Thumbnail = thumbnailMatch.Success ? thumbnailMatch.Groups[1].Value : null,
                        Description = descriptionMatch.Success ? descriptionMatch.Groups[1].Value : null
                    };
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting video info for {Url}", url);
            }

            return null;
        }

        private async Task<string?> DownloadAndConvertVideo(string url, int videoId, CancellationToken stoppingToken)
        {
            try
            {
                var videoDir = _configuration["Storage:VideoPath"] ?? "/app/videos";
                var outputPath = Path.Combine(videoDir, $"{videoId}");
                
                // Ensure directory exists
                Directory.CreateDirectory(outputPath);

                // Download video using yt-dlp
                var downloadArgs = $"--format \"best[height<=1080]\" --output \"{outputPath}/video.%(ext)s\" \"{url}\"";
                var downloadResult = await RunProcess("yt-dlp", downloadArgs, stoppingToken);
                
                if (downloadResult != 0)
                {
                    _logger.LogError("Failed to download video {VideoId}", videoId);
                    return null;
                }

                // Find downloaded file
                var videoFile = Directory.GetFiles(outputPath, "video.*").FirstOrDefault();
                if (string.IsNullOrEmpty(videoFile))
                {
                    _logger.LogError("No video file found after download for {VideoId}", videoId);
                    return null;
                }

                // Convert to HLS using FFmpeg
                var hlsOutputPath = Path.Combine(outputPath, "playlist.m3u8");
                var ffmpegArgs = $"-i \"{videoFile}\" -c:v libx264 -c:a aac -hls_time 10 -hls_list_size 0 -hls_segment_filename \"{outputPath}/segment_%03d.ts\" \"{hlsOutputPath}\"";
                var ffmpegResult = await RunProcess("ffmpeg", ffmpegArgs, stoppingToken);

                if (ffmpegResult == 0 && File.Exists(hlsOutputPath))
                {
                    // Clean up original video file
                    try { File.Delete(videoFile); } catch { }
                    return hlsOutputPath;
                }
                else
                {
                    _logger.LogError("Failed to convert video {VideoId} to HLS", videoId);
                    return null;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading and converting video {VideoId}", videoId);
                return null;
            }
        }

        private async Task<int> RunProcess(string fileName, string arguments, CancellationToken stoppingToken)
        {
            var startInfo = new ProcessStartInfo
            {
                FileName = fileName,
                Arguments = arguments,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = Process.Start(startInfo);
            if (process == null) return -1;

            await process.WaitForExitAsync(stoppingToken);
            return process.ExitCode;
        }
    }

    public class VideoInfo
    {
        public string? Title { get; set; }
        public int? Duration { get; set; }
        public string? Thumbnail { get; set; }
        public string? Description { get; set; }
    }
} 