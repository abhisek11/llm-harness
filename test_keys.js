require('dotenv').config();
console.log('GROQ:', !!process.env.GROQ_API_KEY, process.env.GROQ_API_KEY)
console.log('KIMI:', !!(process.env.MOONSHOT_API_KEY || process.env.KIMI_API_KEY))
