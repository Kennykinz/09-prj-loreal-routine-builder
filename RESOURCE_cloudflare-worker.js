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

      // Handle both messages and prompt
      if (userInput.messages) {
        requestBody = {
          model: "gpt-4o",
          messages: userInput.messages,
          max_tokens: 300,
        };
      } else if (userInput.prompt) {
        requestBody = {
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content:
                "You are a helpful L'Oréal skincare routine advisor. Create a personalized skincare routine from provided product details. Be concise and clear.",
            },
            { role: "user", content: userInput.prompt },
          ],
          max_tokens: 300,
        };
      } else {
        return new Response(JSON.stringify({ response: "Invalid input" }), {
          headers: corsHeaders,
        });
      }

      const openaiRes = await fetch(
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

      const data = await openaiRes.json();

      const aiReply = data?.choices?.[0]?.message?.content;

      if (!aiReply) {
        return new Response(
          JSON.stringify({ response: "OpenAI returned no content." }),
          { headers: corsHeaders }
        );
      }

      return new Response(JSON.stringify({ response: aiReply }), {
        headers: corsHeaders,
      });
    } catch (error) {
      return new Response(
        JSON.stringify({ response: "Server error when contacting OpenAI." }),
        { headers: corsHeaders, status: 500 }
      );
    }
  },
};
