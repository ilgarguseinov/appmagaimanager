import { WbApiError } from "./wbClient.js";

export function jsonResult(data) {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    structuredContent: isPlainRecord(data) ? data : { result: data }
  };
}

export function errorResult(error) {
  if (error instanceof WbApiError) {
    const details = error.body ? `\nDetails: ${JSON.stringify(error.body)}` : "";
    return {
      isError: true,
      content: [{ type: "text", text: `${error.message}${details}` }]
    };
  }

  return {
    isError: true,
    content: [{ type: "text", text: `Unexpected error: ${error.message || String(error)}` }]
  };
}

function isPlainRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
