export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { explanation, taskTitle, subject } = req.body;

  if (!explanation || !taskTitle) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const prompt = `You are evaluating a child's "teach back" explanation for a learning task. The child just completed "${taskTitle}" (subject: ${subject || 'general'}) and is explaining what they learned.

Their explanation: "${explanation}"

Evaluate if this shows genuine understanding. Be encouraging but fair. Kids are ages 9-13.

Respond in this exact JSON format:
{
  "passed": true or false,
  "feedback": "A short, encouraging message (1-2 sentences). If they passed, celebrate their understanding. If not, gently suggest what they could add or explain better.",
  "score": a number from 1-10 representing depth of understanding
}

Guidelines:
- Pass if they demonstrate ANY real understanding of the topic (score 5+)
- Be generous - they're kids learning
- A vague or too-short answer (less than 10 words) should not pass
- "I don't know" or gibberish should not pass
- Encourage them even if they don't pass`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 256,
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', errorData);
      return res.status(500).json({ error: 'Failed to evaluate response' });
    }

    const data = await response.json();

    // Extract the text response
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) {
      return res.status(500).json({ error: 'No response from AI' });
    }

    // Parse the JSON from the response
    const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: 'Invalid AI response format' });
    }

    const evaluation = JSON.parse(jsonMatch[0]);

    return res.status(200).json(evaluation);
  } catch (error) {
    console.error('Error calling Gemini:', error);
    return res.status(500).json({ error: 'Failed to evaluate response' });
  }
}
