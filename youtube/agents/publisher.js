const axios = require("axios");
const fs = require("fs");

const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const YOUTUBE_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
const YOUTUBE_REFRESH_TOKEN = process.env.YOUTUBE_REFRESH_TOKEN;

const DAY_NAMES = ["Bazar", "Bazar ertəsi", "Çərşənbə axşamı", "Çərşənbə", "Cümə axşamı", "Cümə", "Şənbə"];

function findBestTimeToPost(videos) {
  const buckets = {};

  for (const video of videos) {
    const publishedAt = new Date(video.publishedAt);
    const ageDays = Math.max(1, (Date.now() - publishedAt.getTime()) / 86400000);
    const viewsPerDay = video.viewCount / ageDays;
    const key = publishedAt.getUTCDay() + "-" + publishedAt.getUTCHours();

    if (!buckets[key]) {
      buckets[key] = {
        dayOfWeekIndex: publishedAt.getUTCDay(),
        hourUTC: publishedAt.getUTCHours(),
        total: 0,
        count: 0
      };
    }

    buckets[key].total += viewsPerDay;
    buckets[key].count += 1;
  }

  const ranked = Object.values(buckets)
    .map((b) => ({ ...b, avgViewsPerDay: b.total / b.count }))
    .sort((a, b) => b.avgViewsPerDay - a.avgViewsPerDay);

  const best = ranked[0];

  if (!best) {
    return {
      dayOfWeekIndex: 5,
      dayOfWeek: "Cümə",
      hourUTC: 16,
      reasoning: "Kifayət qədər tarixi məlumat yoxdur, ümumi tövsiyə istifadə olundu"
    };
  }

  return {
    dayOfWeekIndex: best.dayOfWeekIndex,
    dayOfWeek: DAY_NAMES[best.dayOfWeekIndex],
    hourUTC: best.hourUTC,
    avgViewsPerDay: Math.round(best.avgViewsPerDay),
    sampleSize: best.count,
    reasoning: `Keçmiş ${best.count} video bu vaxt aralığında dərc olunanda gündəlik orta ${Math.round(best.avgViewsPerDay)} baxış toplayıb`
  };
}

function nextOccurrence(dayOfWeekIndex, hourUTC) {
  const now = new Date();
  const result = new Date(now);

  result.setUTCHours(hourUTC, 0, 0, 0);

  let diff = (dayOfWeekIndex - now.getUTCDay() + 7) % 7;
  if (diff === 0 && result <= now) {
    diff = 7;
  }

  result.setUTCDate(result.getUTCDate() + diff);
  return result;
}

async function getAccessToken() {
  const { data } = await axios.post(
    "https://oauth2.googleapis.com/token",
    new URLSearchParams({
      grant_type: "refresh_token",
      client_id: YOUTUBE_CLIENT_ID,
      client_secret: YOUTUBE_CLIENT_SECRET,
      refresh_token: YOUTUBE_REFRESH_TOKEN
    }).toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  return data.access_token;
}

async function uploadScheduledVideo({ filePath, title, description, tags, publishAt }) {
  const accessToken = await getAccessToken();
  const fileSize = fs.statSync(filePath).size;

  const initResponse = await axios.post(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    {
      snippet: { title, description, tags },
      status: { privacyStatus: "private", publishAt, selfDeclaredMadeForKids: false }
    },
    {
      headers: {
        Authorization: "Bearer " + accessToken,
        "Content-Type": "application/json",
        "X-Upload-Content-Type": "video/*",
        "X-Upload-Content-Length": fileSize
      }
    }
  );

  const uploadUrl = initResponse.headers.location;

  const uploadResponse = await axios.put(uploadUrl, fs.createReadStream(filePath), {
    headers: {
      "Content-Type": "video/*",
      "Content-Length": fileSize
    },
    maxBodyLength: Infinity,
    maxContentLength: Infinity
  });

  return uploadResponse.data;
}

async function publish({ videos, script, videoFilePath }) {
  const bestTime = findBestTimeToPost(videos || []);
  const publishAt = nextOccurrence(bestTime.dayOfWeekIndex, bestTime.hourUTC).toISOString();

  if (!videoFilePath) {
    return {
      bestTime,
      publishAt,
      status: "gözləmədə",
      message: "Video fayl yolu (videoFilePath) verilmədiyi üçün yükləmə icra olunmadı, yalnız ən yaxşı vaxt hesablandı"
    };
  }

  if (!YOUTUBE_CLIENT_ID || !YOUTUBE_CLIENT_SECRET || !YOUTUBE_REFRESH_TOKEN) {
    return {
      bestTime,
      publishAt,
      status: "gözləmədə",
      message: "YouTube OAuth məlumatları (YOUTUBE_CLIENT_ID/YOUTUBE_CLIENT_SECRET/YOUTUBE_REFRESH_TOKEN) tapılmadı, yükləmə icra olunmadı"
    };
  }

  const result = await uploadScheduledVideo({
    filePath: videoFilePath,
    title: script.title,
    description: script.description,
    tags: script.tags,
    publishAt
  });

  return {
    bestTime,
    publishAt,
    status: "planlaşdırıldı",
    youtubeVideoId: result.id
  };
}

module.exports = { publish, findBestTimeToPost };
