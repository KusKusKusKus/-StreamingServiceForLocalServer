using Microsoft.EntityFrameworkCore;
using StreamService.Models;

namespace StreamService.Data
{
    public class StreamServiceContext : DbContext
    {
        public StreamServiceContext(DbContextOptions<StreamServiceContext> options)
            : base(options)
        {
        }

        public DbSet<Video> Videos { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Video>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).UseIdentityColumn();
                
                entity.Property(e => e.Title).IsRequired().HasMaxLength(255);
                entity.Property(e => e.Url).IsRequired();
                entity.Property(e => e.Source).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Status).HasMaxLength(20);
                
                entity.HasIndex(e => e.Status);
                entity.HasIndex(e => e.Source);
                entity.HasIndex(e => e.CreatedAt);
                
                // Add check constraint for status
                entity.HasCheckConstraint("CK_Videos_Status", 
                    "Status IN ('Queued', 'Downloading', 'Processing', 'Ready', 'Failed')");
            });
        }
    }
} 