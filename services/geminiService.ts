import { GoogleGenAI } from "@google/genai";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_NAME = 'gemini-2.5-flash';

export const getMathHint = async (num1: number, num2: number): Promise<string> => {
  try {
    const prompt = `You are a friendly, magical math owl talking to a 7-year-old child. 
    The child is stuck on the multiplication problem: ${num1} x ${num2}.
    Provide a short, fun hint to help them solve it. 
    Rules:
    1. DO NOT give the answer (${num1 * num2}).
    2. Use a rhyme, a visual metaphor (like "imagine ${num1} baskets with ${num2} apples"), or a repeated addition trick.
    3. Keep it under 25 words.
    4. Be encouraging and cute.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text || "Try adding the numbers together!";
  } catch (error) {
    console.error("Error generating hint:", error);
    return "Remember, multiplication is just adding the same number over and over!";
  }
};

export const getFunExplanation = async (num1: number, num2: number, wrongAnswer: number): Promise<string> => {
  try {
    const correctAnswer = num1 * num2;
    const prompt = `You are a funny, kind robot teaching math to a 7-year-old.
    The child answered ${wrongAnswer} for the problem ${num1} x ${num2}. The correct answer is ${correctAnswer}.
    
    Task:
    1. Gently explain why ${correctAnswer} is right.
    2. Be humorous or silly (maybe blame a "math gremlin" for the confusion).
    3. Keep it under 30 words.
    4. Use an emoji.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text || `Oops! ${num1} times ${num2} is actually ${correctAnswer}. Keep going! 🚀`;
  } catch (error) {
    console.error("Error generating explanation:", error);
    return `Nice try! The answer is ${num1 * num2}. Let's try the next one!`;
  }
};

export const getEncouragement = async (streak: number): Promise<string> => {
   try {
    const prompt = `Give a super short, high-energy 5-word praise for a kid who just got ${streak} math questions right in a row! Use emojis.`;
     const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    return response.text || "Superstar! 🌟";
   } catch (e) {
     return "Awesome job! 🎉";
   }
}