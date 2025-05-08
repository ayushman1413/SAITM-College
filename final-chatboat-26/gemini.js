import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI("AIzaSyAvdNFfC-ZuBzwXNWgG25A8Om2xuFeh_TM")

const runChat = async (prompt) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" })

    const chat = await model.startChat({
      history: [],
      generationConfig: {
        temperature: 0.9,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
      },
    })

    const result = await chat.sendMessage(prompt)
    const response = await result.response.text()

    return response
  } catch (err) {
    console.error("API Error:", err)
    return "Something went wrong. Please try again."
  }
}

export { runChat }
