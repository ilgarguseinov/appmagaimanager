const axios = require("axios");

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;

async function fetchAllUploadIds(uploadsPlaylistId) {
  const videoIds = [];
  let pageToken = "";

  do {
    const { data } = await axios.get("https://www.googleapis.com/youtube/v3/playlistItems", {
      params: {
        part: "contentDetails",
        playlistId: uploadsPlaylistId,
        maxResults: 50,
        pageToken: pageToken || undefined,
        key: YOUTUBE_API_KEY
      }
    });

    for (const item of data.items || []) {
      videoIds.push(item.contentDetails.videoId);
    }

    pageToken = data.nextPageToken || "";
  } while (pageToken && videoIds.length < 200);

  return videoIds;
}

async function fetchVideoDetails(videoIds) {
  const videos = [];

  for (let i = 0; i < videoIds.length; i += 50) {
    const chunk = videoIds.slice(i, i + 50);

    const { data } = await axios.get("https://www.googleapis.com/youtube/v3/videos", {
      params: {
        part: "snippet,statistics,contentDetails",
        id: chunk.join(","),
        key: YOUTUBE_API_KEY
      }
    });

    for (const item of data.items || []) {
      videos.push({
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        publishedAt: item.snippet.publishedAt,
        tags: item.snippet.tags || [],
        duration: item.contentDetails.duration,
        viewCount: Number(item.statistics.viewCount || 0),
        likeCount: Number(item.statistics.likeCount || 0),
        commentCount: Number(item.statistics.commentCount || 0)
      });
    }
  }

  return videos;
}

async function analyzeChannel(channelId = YOUTUBE_CHANNEL_ID) {
  if (!YOUTUBE_API_KEY) {
    throw new Error("YOUTUBE_API_KEY tapılmadı");
  }

  if (!channelId) {
    throw new Error("YOUTUBE_CHANNEL_ID tapılmadı");
  }

  const { data } = await axios.get("https://www.googleapis.com/youtube/v3/channels", {
    params: {
      part: "snippet,statistics,contentDetails",
      id: channelId,
      key: YOUTUBE_API_KEY
    }
  });

  const channel = data.items && data.items[0];

  if (!channel) {
    throw new Error("Kanal tapılmadı: " + channelId);
  }

  const uploadsPlaylistId = channel.contentDetails.relatedPlaylists.uploads;
  const videoIds = await fetchAllUploadIds(uploadsPlaylistId);
  const videos = await fetchVideoDetails(videoIds);

  videos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  return {
    channel: {
      id: channel.id,
      title: channel.snippet.title,
      description: channel.snippet.description,
      subscriberCount: Number(channel.statistics.subscriberCount || 0),
      viewCount: Number(channel.statistics.viewCount || 0),
      videoCount: Number(channel.statistics.videoCount || 0)
    },
    videos
  };
}

module.exports = { analyzeChannel };
