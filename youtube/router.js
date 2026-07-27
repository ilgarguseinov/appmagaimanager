const express = require("express");
const { analyzeChannel } = require("./agents/channelAnalyzer");
const { analyzeTopVideos } = require("./agents/topVideosAnalyzer");
const { writeScript } = require("./agents/scriptWriter");
const { generateContent } = require("./agents/contentGenerator");
const { publish } = require("./agents/publisher");
const { runPipeline } = require("./pipeline");
const { runDemoPipeline } = require("./demoPipeline");

const router = express.Router();

router.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="az">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>YouTube AI Avtomatlaşdırma - AppMag AI Manager</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f6f6f7; margin: 0; padding: 40px; color: #202223; }
    .container { max-width: 1100px; margin: 0 auto; }
    h1 { font-size: 32px; margin-bottom: 10px; }
    .subtitle { color: #6d7175; margin-bottom: 25px; }
    .back { text-decoration: none; color: #008060; font-weight: bold; }
    .flow { display: flex; flex-wrap: wrap; gap: 15px; align-items: stretch; margin: 25px 0 35px; }
    .node { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.1); flex: 1; min-width: 180px; }
    .node h3 { margin-top: 0; font-size: 16px; }
    .node p { color: #6d7175; font-size: 13px; }
    .arrow { align-self: center; font-size: 24px; color: #008060; }
    .button { display: inline-block; margin-top: 15px; padding: 12px 20px; background: #008060; color: white; text-decoration: none; border-radius: 7px; border: none; cursor: pointer; font-size: 15px; }
    .button:disabled { background: #a3a3a3; cursor: not-allowed; }
    pre { background: #1e1e1e; color: #d4d4d4; padding: 20px; border-radius: 12px; overflow-x: auto; max-height: 500px; white-space: pre-wrap; word-break: break-word; }
    @media (max-width: 900px) { .flow { flex-direction: column; } .arrow { transform: rotate(90deg); } }
  </style>
</head>
<body>
  <div class="container">
    <a class="back" href="/">← Dashboard</a>
    <h1>YouTube AI Avtomatlaşdırma</h1>
    <p class="subtitle">n8n stilində zəncirlənmiş 5 AI agenti: kanal analizi → top videolar → ssenari → kontent generasiya → ən yaxşı vaxtda yükləmə</p>

    <div class="flow">
      <div class="node"><h3>1. Kanal Analiz</h3><p>Kanalın statistikası və bütün videoları YouTube Data API ilə çəkilir</p></div>
      <div class="arrow">→</div>
      <div class="node"><h3>2. Top Videolar</h3><p>Ən çox izlənən videolar, ortaq taglar və mövzular analiz olunur</p></div>
      <div class="arrow">→</div>
      <div class="node"><h3>3. Ssenari</h3><p>OpenAI ilə yeni video üçün başlıq, hook, ssenari və təsvir yazılır</p></div>
      <div class="arrow">→</div>
      <div class="node"><h3>4. Kontent Generasiya</h3><p>Səhnə planı, səsləndirmə mətni və thumbnail generasiya olunur</p></div>
      <div class="arrow">→</div>
      <div class="node"><h3>5. Ən Yaxşı Vaxt / Yükləmə</h3><p>Tarixi məlumata görə ən yaxşı vaxt hesablanır, video faylı verilibsə planlaşdırılmış yüklənir</p></div>
    </div>

    <button class="button" id="runBtn" onclick="runPipeline('/youtube/api/run', 'runBtn')">Pipeline-i işə sal</button>
    <button class="button" id="demoBtn" style="background:#6d7175" onclick="runPipeline('/youtube/api/run-demo', 'demoBtn')">Demo rejimində göstər (API açarı lazım deyil)</button>

    <div id="result"></div>
  </div>

<script>
async function runPipeline(endpoint, btnId) {
  const btn = document.getElementById(btnId);
  const resultDiv = document.getElementById("result");
  const originalText = btn.textContent;

  btn.disabled = true;
  btn.textContent = "İşləyir...";
  resultDiv.innerHTML = "";

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });

    const data = await response.json();

    resultDiv.innerHTML = "<h2>Nəticə</h2><pre>" + JSON.stringify(data, null, 2).replace(/</g, "&lt;") + "</pre>";
  } catch (error) {
    resultDiv.innerHTML = "<p>Xəta: " + error.message + "</p>";
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}
</script>
</body>
</html>
  `);
});

router.post("/api/analyze-channel", async (req, res) => {
  try {
    const data = await analyzeChannel(req.body.channelId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/api/analyze-top-videos", async (req, res) => {
  try {
    const channelData = req.body.channelData || (await analyzeChannel(req.body.channelId));
    const data = analyzeTopVideos(channelData);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/api/write-script", async (req, res) => {
  try {
    const data = await writeScript(req.body);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/api/generate-content", async (req, res) => {
  try {
    const data = await generateContent(req.body.script);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/api/publish", async (req, res) => {
  try {
    const data = await publish(req.body);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/api/run", async (req, res) => {
  try {
    const data = await runPipeline(req.body || {});
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/api/run-demo", async (req, res) => {
  const data = await runDemoPipeline(req.body || {});
  res.json({ success: true, data });
});

module.exports = router;
