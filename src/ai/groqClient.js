import Groq from 'groq-sdk';

let groqInstance = null;

export const groq = () => {
  if (!groqInstance) {
    groqInstance = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
  }
  return groqInstance;
};
