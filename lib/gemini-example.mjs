import {
  GoogleGenAI,
} from '@google/genai';
import * as fs from 'fs';

// Get file path from command line arguments
let args = [...process.argv];
args.shift(); // Remove node executable path
args.shift(); // Remove script path
const filePath = args[0];

if (!filePath) {
  console.error('Please provide a file path as an argument');
  process.exit(1);
}

async function main() {
  // Read the input file
  const fileContent = fs.readFileSync(filePath, 'utf8');
  console.log(`Processing file: ${filePath}`);

  const ai = new GoogleGenAI({
    apiKey: 'AIzaSyDl_of3M_KCHastfbykn5VshC8nwxps4eU',
  });

  const model = 'gemini-2.5-flash';

  // Step 1: Generate questions without tools and without structured output
  const questionsConfig = {
    thinkingConfig: {
      thinkingBudget: -1,
    },
  };

  const questionsContents = [
    {
      role: 'user',
      parts: [
        {
          text: `Based on the following content, generate 5 relevant questions. Format your response as a JSON object with a "questions" array containing the questions. The content is:\n\n${fileContent}`,
        },
      ],
    },
  ];

  console.log('Generating questions...');
  const questionsResponse = await ai.models.generateContent({
    model,
    config: questionsConfig,
    contents: questionsContents,
  });

  // Extract JSON from the response text (it might be wrapped in markdown code blocks)
  let responseText = questionsResponse.text;
  
  // Try to extract JSON if it's wrapped in code blocks
  const jsonMatch = responseText.match(/\`\`\`json\n([\s\S]*?)\n\`\`\`/) || responseText.match(/\`\`\`\n([\s\S]*?)\n\`\`\`/);
  if (jsonMatch) {
    responseText = jsonMatch[1];
  }
  
  // Parse the JSON
  let questions;
  try {
    const questionsData = JSON.parse(responseText);
    questions = questionsData.questions;
  } catch (error) {
    console.error('Failed to parse questions as JSON:', error);
    console.log('Raw response:', responseText);
    // Fallback: split by newlines and filter out non-question lines
    questions = responseText.split('\n')
      .filter(line => line.trim().endsWith('?'))
      .map(line => line.replace(/^\d+\.\s*/, '').trim());
  }
  
  console.log(`Generated ${questions.length} questions`);

  // Step 2: Process each question and generate answers
  const tools = [
    {
      googleSearch: {}
    },
  ];

  const answerConfig = {
    thinkingConfig: {
      thinkingBudget: -1,
    },
    tools,
  };

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    console.log(`Processing question ${i + 1}: ${question}`);
    
    const answerContents = [
      {
        role: 'user',
        parts: [
          {
            text: question,
          },
        ],
      },
    ];

    const answerResponse = await ai.models.generateContentStream({
      model,
      config: answerConfig,
      contents: answerContents,
    });

    // Write question and answer to a file
    const fileName = `answer_${i + 1}.txt`;
    const writeStream = fs.createWriteStream(fileName);
    
    writeStream.write(`Question: ${question}\n\nAnswer: `);
    
    for await (const chunk of answerResponse) {
      writeStream.write(chunk.text);
    }
    
    writeStream.end();
    console.log(`Saved answer to ${fileName}`);
  }
}

main().catch(console.error);
