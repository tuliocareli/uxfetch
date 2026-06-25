require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
    const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
    if (!genAI) {
        console.log("No key found.");
        return;
    }
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const result = await model.generateContent("Diga 'Oi'");
        console.log("Success:", result.response.text());
    } catch (error) {
        console.error("Error:", error.message);
    }
}
test();
