import { z } from "zod";

const haikuStringSchema = z
  .string()
  .trim()
  .refine(
    (text) => {
      // split by /n or /r/n
      const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
      return lines.length === 3;
    },
    {
      // if refine function returns false, this error message will be used
      message: "Model failed to format: Haiku must be exactly 3 lines.",
    },
  );

const haikuResponseSchema = z.object({
  haiku: haikuStringSchema,
  title: z.string(),
  author: z.string(),
});

const payload = {
  model: "gemma-local",
  prompt:
    'Write a haiku about the ocean. Return valid json with the following format: {"haiku": "your haiku here", "title": "a title for the haiku", "author": "your model name"}. Do not return anything before or after the first and last curly braces. No commentary, no explanations, just the valid json.',
  stream: false,
  options: {
    num_ctx: 32768,
  },
};

const urlTarget = "http://localhost:11434/api/generate";

async function testOllama() {
  try {
    const response = await fetch(urlTarget, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    // Check if the response is successful (status code 2xx)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    // Parse the JSON response
    const data = await response.json();
    // Log the data to the console
    console.log(data);

    const jsonData = data.response;
    console.log("RAW MODEL OUTPUT:", jsonData);
    // Find the first and last curly braces in the response to extract the JSON string
    const firstBrace = jsonData.indexOf("{");
    const lastBrace = jsonData.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      throw new Error("Invalid JSON format in response");
    }

    // Grab just the JSON string from the response
    const jsonString = jsonData.substring(firstBrace, lastBrace + 1);
    const haikuData = haikuResponseSchema.safeParse(JSON.parse(jsonString));
    // Validate the extracted JSON against the schema
    if (!haikuData.success) {
      // If validation fails, log the error details
      console.error("Validation error:", haikuData.error);
      return;
    }
    // If validation is successful, log the haiku, title, and author to the console
    console.log("Haiku:", haikuData.data.haiku);
    console.log("Title:", haikuData.data.title);
    console.log("Author:", haikuData.data.author);

    // --- OLLAMA METRICS EXTRACTION ---

    // Calculate Tokens (fallback to 0 if the API omits them)
    const inputTokens = data.prompt_eval_count || 0;
    const outputTokens = data.eval_count || 0;
    const totalTokens = inputTokens + outputTokens;

    // Function to convert durations from Nanoseconds to Seconds
    const nanoToSeconds = (nanoseconds: number | undefined): string => {
      // If no nanoseconds supplied, just return 0.00
      if (!nanoseconds) return "0.00";
      // Convert to seconds and format to 2 decimal places
      return (nanoseconds / 1_000_000_000).toFixed(2);
    };
    const totalTime = nanoToSeconds(data.total_duration);
    const loadTime = nanoToSeconds(data.load_duration);
    const promptEvalTime = nanoToSeconds(data.prompt_eval_duration);
    const genTime = nanoToSeconds(data.eval_duration);

    // 3. Log the formatted output
    console.log(`\n📊 Generation Metrics:`);
    console.log(
      `Tokens:   ${totalTokens} Total (${inputTokens} Input / ${outputTokens} Output)`,
    );
    console.log(
      `Duration: ${totalTime}s Total (${loadTime}s Load / ${promptEvalTime}s Prompt Eval / ${genTime}s Generation)`,
    );
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

testOllama();
