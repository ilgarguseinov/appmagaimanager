function analyzeTopVideos({ videos }, topN = 10) {
  if (!videos || videos.length === 0) {
    throw new Error("Analiz üçün video tapılmadı");
  }

  const sorted = [...videos].sort((a, b) => b.viewCount - a.viewCount);
  const topVideos = sorted.slice(0, topN);

  const avgViews = Math.round(
    videos.reduce((sum, v) => sum + v.viewCount, 0) / videos.length
  );

  const tagCounts = {};
  for (const video of topVideos) {
    for (const tag of video.tags) {
      const key = tag.toLowerCase();
      tagCounts[key] = (tagCounts[key] || 0) + 1;
    }
  }

  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([tag]) => tag);

  const avgTopEngagement = Math.round(
    topVideos.reduce((sum, v) => sum + v.likeCount + v.commentCount, 0) / topVideos.length
  );

  return {
    topVideos,
    insights: {
      avgViews,
      avgTopEngagement,
      topTags,
      topTitles: topVideos.map((v) => v.title)
    }
  };
}

module.exports = { analyzeTopVideos };
