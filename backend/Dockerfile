FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copy csproj and restore dependencies
COPY StreamService/*.csproj ./StreamService/
RUN dotnet restore StreamService/

# Copy everything else and build
COPY StreamService/ ./StreamService/
WORKDIR /app/StreamService
RUN dotnet publish -c Release -o out

# Build runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime

# Install system dependencies
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    python3 \
    python3-pip \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp
RUN pip3 install --no-cache-dir yt-dlp

# Create app directory
WORKDIR /app

# Create videos directory
RUN mkdir -p /app/videos

# Copy published app
COPY --from=build /app/StreamService/out .

# Set permissions
RUN chmod +x /app/StreamService

EXPOSE 80

ENTRYPOINT ["dotnet", "StreamService.dll"] 