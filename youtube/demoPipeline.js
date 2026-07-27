const { findBestTimeToPost } = require("./agents/publisher");

function sample1x1PngBase64() {
  return "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
}

function buildDemoChannel() {
  const now = Date.now();
  const day = 86400000;

  const videos = [
    { id: "demo1", title: "5 Mətbəx Hiylsi Vaxtına Qənaət Edir", publishedAt: new Date(now - 40 * day).toISOString(), viewCount: 128000, likeCount: 6400, commentCount: 320, tags: ["mətbəx", "hiylə", "vaxta qənaət"] },
    { id: "demo2", title: "Ev Şəraitində 10 Dəqiqəyə Nahar", publishedAt: new Date(now - 33 * day).toISOString(), viewCount: 95000, likeCount: 4100, commentCount: 210, tags: ["yemək", "sürətli resept"] },
    { id: "demo3", title: "Bunu Bilmirdinizsə, İndiyə Qədər Səhv Edirdiniz", publishedAt: new Date(now - 26 * day).toISOString(), viewCount: 210000, likeCount: 11200, commentCount: 540, tags: ["hiylə", "məsləhət"] },
    { id: "demo4", title: "3 Ədəd Ərzağı Belə Saxlayın, Xarab Olmasın", publishedAt: new Date(now - 19 * day).toISOString(), viewCount: 76000, likeCount: 3000, commentCount: 140, tags: ["saxlama", "mətbəx"] },
    { id: "demo5", title: "Qonaqlar Üçün 15 Dəqiqəlik Fərqli Fikir", publishedAt: new Date(now - 12 * day).toISOString(), viewCount: 143000, likeCount: 7100, commentCount: 380, tags: ["qonaq", "resept"] },
    { id: "demo6", title: "Bu Səhvi Hər Kəs Edir", publishedAt: new Date(now - 5 * day).toISOString(), viewCount: 54000, likeCount: 2200, commentCount: 95, tags: ["hiylə", "məsləhət"] }
  ];

  return {
    channel: {
      id: "UCDEMO000000000000000",
      title: "Nümunə Kanal (demo)",
      subscriberCount: 18400,
      viewCount: 2100000,
      videoCount: videos.length
    },
    videos
  };
}

function buildDemoInsights(videos) {
  const sorted = [...videos].sort((a, b) => b.viewCount - a.viewCount);
  const topVideos = sorted.slice(0, 3);
  const avgViews = Math.round(videos.reduce((sum, v) => sum + v.viewCount, 0) / videos.length);

  return {
    topVideos,
    insights: {
      avgViews,
      avgTopEngagement: Math.round(topVideos.reduce((sum, v) => sum + v.likeCount + v.commentCount, 0) / topVideos.length),
      topTags: ["hiylə", "məsləhət", "mətbəx", "vaxta qənaət"],
      topTitles: topVideos.map((v) => v.title)
    }
  };
}

function buildDemoScript(referenceVideoUrl) {
  return {
    title: "Kanalınızda Ən Çox İşləyən 4 Video Hiyləsi (Analiz Nəticəsi)",
    hook: "Bu kanalda ən çox baxılan videoların ortaq bir sirri var — bunu 60 saniyəyə deyirəm.",
    script: {
      intro: `Bu video, "${referenceVideoUrl}" linkindəki referens video və kanalınızın öz ən yaxşı performans göstərən videoları analiz edilərək hazırlanmış nümunə ssenaridir.`,
      body: "Analiz göstərir ki, auditoriyanız qısa, praktik 'hiylə' formatlı videolara üstünlük verir. Bu bölmədə eyni formatda, lakin fərqli mövzuda tam orijinal məzmun təqdim olunur.",
      outro: "Əgər bu format sizə uyğun gəlirsə, abunə olun və növbəti videoda görüşərik."
    },
    description: "Bu, demo rejimində generasiya olunmuş nümunə video təsviridir. Real API açarları qoşulanda burada OpenAI tərəfindən yazılmış həqiqi təsvir olacaq.",
    tags: ["hiylə", "məsləhət", "demo"]
  };
}

function buildDemoContent() {
  const scenes = [
    { sceneNumber: 1, visual: "Hook mətni ekranda böyük şriftlə görünür", voiceover: "Here is the one trick your top videos have in common.", durationSeconds: 6, audioBase64: null, audioFormat: "mp3 (demo rejimində generasiya olunmur)" },
    { sceneNumber: 2, visual: "Analiz nəticələrinin qısa qrafiki", voiceover: "Short, practical tips consistently outperform everything else on this channel.", durationSeconds: 10, audioBase64: null, audioFormat: "mp3 (demo rejimində generasiya olunmur)" },
    { sceneNumber: 3, visual: "Yeni video ideyasının nümayişi", voiceover: "So here's a brand new video, built the same way — but on a topic you haven't covered yet.", durationSeconds: 12, audioBase64: null, audioFormat: "mp3 (demo rejimində generasiya olunmur)" }
  ];

  return {
    scenes,
    thumbnailPrompt: "A bold, high-contrast YouTube thumbnail with bright text overlay, demo placeholder",
    thumbnailBase64: sample1x1PngBase64(),
    note: "Demo rejimində thumbnail 1x1 nümunə şəkillə, voiceover audiosu isə boş qoyulub — real rejimdə Pollinations.ai (şəkil) və Edge TTS (səs) real fayllar yaradır."
  };
}

async function runDemoPipeline({ referenceVideoUrl } = {}) {
  const trace = [];

  const channelData = buildDemoChannel();
  trace.push({
    node: "1. YouTube Kanal Analiz Agenti (DEMO)",
    output: { channel: channelData.channel, videoCount: channelData.videos.length, note: "Nümunə/mock məlumat, real kanal deyil" }
  });

  const topVideosData = buildDemoInsights(channelData.videos);
  trace.push({ node: "2. Ən Çox İzlənən Videolar Agenti (DEMO)", output: topVideosData.insights });

  const script = buildDemoScript(referenceVideoUrl || "https://youtu.be/fXbFT5Oz1bU");
  trace.push({ node: "3. Mətn/Ssenari Hazırlama Agenti (DEMO)", output: script });

  const content = buildDemoContent();
  trace.push({
    node: "4. Kontent Generasiya Agenti (DEMO)",
    output: { scenes: content.scenes, thumbnailPrompt: content.thumbnailPrompt, hasThumbnail: true, note: content.note }
  });

  const bestTime = findBestTimeToPost(channelData.videos);
  const publishResult = {
    bestTime,
    status: "gözləmədə",
    message: "DEMO rejimi: real yükləmə edilmədi, yalnız format nümayiş etdirilir"
  };
  trace.push({ node: "5. Ən Yaxşı Vaxtda Yükləmə Agenti (DEMO)", output: publishResult });

  return {
    demo: true,
    disclaimer: "Bu tam demo/nümunə məlumatdır — heç bir xarici API çağırılmayıb, heç bir real kanala toxunulmayıb.",
    trace,
    channel: channelData.channel,
    insights: topVideosData.insights,
    script,
    content,
    publishResult
  };
}

module.exports = { runDemoPipeline };
