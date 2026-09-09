const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");

try {
  const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
  if (ffmpegInstaller && ffmpegInstaller.path) {
    ffmpeg.setFfmpegPath(ffmpegInstaller.path);
  }
} catch (e) {
  // System ffmpeg fallback
}
const reelTranscodeQueue = require("../queues/reelTranscode.queue");
const S3Client = require("../integrations/s3/s3.client");
const ReelsRepository = require("../modules/reels/reels.repository");
const { TRANSCODING_STATUS } = require("../constants/enums");

const TEMP_DIR = path.join(__dirname, "../../temp");

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

async function processReelTranscode({ reelId, s3Key, clientId }) {
  let targetClientId = clientId;
  if (!targetClientId) {
    const match = s3Key && s3Key.match(/^clients\/client_(\d+)\//);
    if (match) {
      targetClientId = Number(match[1]);
    } else {
      try {
        const reel = await ReelsRepository.findReelById(reelId);
        targetClientId = reel?.client_id || 1;
      } catch (e) {
        targetClientId = 1;
      }
    }
  }

  const clientFolder = `clients/client_${targetClientId}`;
  const ext = path.extname(s3Key) || ".mp4";
  const rawLocalPath = path.join(TEMP_DIR, `${reelId}_raw${ext}`);
  const thumbLocalPath = path.join(TEMP_DIR, `${reelId}_thumb.jpg`);
  const hlsOutputDir = path.join(TEMP_DIR, `${reelId}_hls`);

  try {
    console.log(`[Transcoder] Processing reel ${reelId} for client ${targetClientId}...`);

    // Step 1: Download raw video from S3
    await S3Client.downloadFile(s3Key, rawLocalPath);

    // Step 2: Generate thumbnail
    await generateThumbnail(rawLocalPath, thumbLocalPath);

    // Step 3: Generate HLS
    if (!fs.existsSync(hlsOutputDir)) {
      fs.mkdirSync(hlsOutputDir, { recursive: true });
    }
    
    await generateHLS(rawLocalPath, hlsOutputDir);

    // Step 4: Upload thumbnail to S3 under client folder
    const thumbS3Key = `${clientFolder}/thumbnails/${reelId}/thumb.jpg`;
    await S3Client.uploadFile(thumbLocalPath, thumbS3Key, "image/jpeg");

    // Step 5: Upload HLS files to S3 under client folder
    const hlsS3Key = await uploadHLSFolder(hlsOutputDir, reelId, clientFolder);

    // Step 6: Update DB
    await ReelsRepository.updateTranscodingResult(reelId, {
      thumbS3Key,
      hlsS3Key,
      status: TRANSCODING_STATUS.COMPLETED,
    });

    console.log(`[Transcoder] Reel ${reelId} processed successfully!`);
  } catch (error) {
    console.error(`[Transcoder] Failed to process reel ${reelId}:`, error.message);
    await ReelsRepository.updateTranscodingResult(reelId, {
      thumbS3Key: null,
      hlsS3Key: null,
      status: TRANSCODING_STATUS.FAILED,
    });
  } finally {
    // Cleanup local temp files
    cleanupFiles([rawLocalPath, thumbLocalPath]);
    cleanupFolder(hlsOutputDir);
  }
}

try {
  reelTranscodeQueue.process(async (job) => {
    await processReelTranscode(job.data);
  });
} catch (e) {
  console.warn("[Queue Warning] Redis queue process failed to bind:", e.message);
}

module.exports = {
  processReelTranscodeDirectly: processReelTranscode,
};


function generateThumbnail(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        "-map 0:v:0",
        "-dn",
      ])
      .screenshots({
        timestamps: ["1"],
        filename: path.basename(outputPath),
        folder: path.dirname(outputPath),
      })
      .on("end", resolve)
      .on("error", reject);
  });
}

function generateHLS(inputPath, outputDir) {
  return new Promise((resolve, reject) => {
    // Generate 360p (Low network), 480p (Medium network), 720p (HD)
    const p360 = path.join(outputDir, "360p.m3u8");
    const p480 = path.join(outputDir, "480p.m3u8");
    const p720 = path.join(outputDir, "720p.m3u8");

    ffmpeg(inputPath)
      // 360p Stream (Optimized for Low Mobile Networks)
      .output(p360)
      .outputOptions([
        "-map 0:v:0",
        "-map 0:a:0?",
        "-dn",
        "-vf scale=-2:360,format=yuv420p",
        "-c:v libx264",
        "-b:v 800k",
        "-maxrate 856k",
        "-bufsize 1200k",
        "-c:a aac",
        "-b:a 96k",
        "-hls_time 6",
        "-hls_playlist_type vod",
        "-hls_segment_filename",
        path.join(outputDir, "360p_%03d.ts"),
      ])
      // 480p Stream (Medium Mobile Network)
      .output(p480)
      .outputOptions([
        "-map 0:v:0",
        "-map 0:a:0?",
        "-dn",
        "-vf scale=-2:480,format=yuv420p",
        "-c:v libx264",
        "-b:v 1400k",
        "-maxrate 1498k",
        "-bufsize 2100k",
        "-c:a aac",
        "-b:a 128k",
        "-hls_time 6",
        "-hls_playlist_type vod",
        "-hls_segment_filename",
        path.join(outputDir, "480p_%03d.ts"),
      ])
      // 720p Stream (HD)
      .output(p720)
      .outputOptions([
        "-map 0:v:0",
        "-map 0:a:0?",
        "-dn",
        "-vf scale=-2:720,format=yuv420p",
        "-c:v libx264",
        "-b:v 2800k",
        "-maxrate 2996k",
        "-bufsize 4200k",
        "-c:a aac",
        "-b:a 128k",
        "-hls_time 6",
        "-hls_playlist_type vod",
        "-hls_segment_filename",
        path.join(outputDir, "720p_%03d.ts"),
      ])
      .on("end", () => {
        // Create Master Playlist (master.m3u8) linking all variants
        const masterPlaylistContent = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360
360p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1400000,RESOLUTION=854x480
480p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720
720p.m3u8
`;
        fs.writeFileSync(path.join(outputDir, "master.m3u8"), masterPlaylistContent);
        resolve();
      })
      .on("error", reject)
      .run();
  });
}

async function uploadHLSFolder(hlsOutputDir, reelId, clientFolder) {
  const files = fs.readdirSync(hlsOutputDir);
  const s3BaseKey = clientFolder ? `${clientFolder}/hls/${reelId}` : `hls/${reelId}`;

  for (const file of files) {
    const localFilePath = path.join(hlsOutputDir, file);
    const s3Key = `${s3BaseKey}/${file}`;
    const contentType = file.endsWith(".m3u8")
      ? "application/vnd.apple.mpegurl"
      : "video/mp2t";
    await S3Client.uploadFile(localFilePath, s3Key, contentType);
  }

  return `${s3BaseKey}/master.m3u8`;
}

function cleanupFiles(filePaths) {
  filePaths.forEach((filePath) => {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });
}

function cleanupFolder(folderPath) {
  if (fs.existsSync(folderPath)) {
    fs.rmSync(folderPath, { recursive: true, force: true });
  }
}

module.exports = {
  processReelTranscodeDirectly: processReelTranscode,
};