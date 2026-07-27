function extractOutputText(responseData) {
  return (
    responseData.output_text ||
    responseData.output
      ?.flatMap((item) => item.content || [])
      ?.filter((item) => item.type === "output_text")
      ?.map((item) => item.text)
      ?.join("\n") ||
    ""
  );
}

function extractJson(text) {
  const match = text.match(/\{[\s\S]*\}/);

  if (!match) {
    throw new Error("Cavab JSON formatında alınmadı: " + text);
  }

  return JSON.parse(match[0]);
}

module.exports = { extractOutputText, extractJson };
