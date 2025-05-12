export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const apiKey = env.OPENAI_API_KEY;
      const userInput = await request.json();

      let requestBody;

      // Support both 'messages' and 'prompt' formats
      if (userInput.messages) {
        requestBody = {
          model: "gpt-4o",
          messages: userInput.messages,
          max_tokens: 500,
        };
      } else if (userInput.prompt) {
        requestBody = {
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content:
                "You are a helpful L'Oréal skincare routine advisor. You will be given a list of products and their details. Based on this information, create a personalized skincare routine. Include steps, time of day (AM/PM), and tips. Be concise and clear. Maintain a friendly and professional tone.",
            },
            { role: "user", content: userInput.prompt },
          ],
          max_tokens: 500,
        };
      } else {
        return new Response(
          JSON.stringify({ response: "Invalid input format." }),
          {
            headers: corsHeaders,
            status: 400,
          }
        );
      }

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      const data = await response.json();

      // Optional: Log for debugging
      console.log(JSON.stringify(data));

      const aiReply = data?.choices?.[0]?.message?.content;

      if (!aiReply) {
        return new Response(
          JSON.stringify({ response: "OpenAI returned no content." }),
          {
            headers: corsHeaders,
            status: 502,
          }
        );
      }

      return new Response(JSON.stringify({ response: aiReply }), {
        headers: corsHeaders,
      });
    } catch (error) {
      console.error("Error calling OpenAI:", error);

      return new Response(
        JSON.stringify({ response: "Server error when contacting OpenAI." }),
        {
          headers: corsHeaders,
          status: 500,
        }
      );
    }
  },
};
