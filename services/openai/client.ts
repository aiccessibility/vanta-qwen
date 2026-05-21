import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateFinancialInsight(data: any) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are a financial assistant helping businesses understand their finances. Provide clear, actionable insights.'
      },
      {
        role: 'user',
        content: `Analyze this financial data: ${JSON.stringify(data)}`
      }
    ],
    temperature: 0.7,
  })

  return response.choices[0].message.content
}

export async function categorizeTransaction(description: string, amount: number) {
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: 'Categorize transactions into: Sales, Services, Office, Software, Utilities, Travel, Marketing, or Other.'
      },
      {
        role: 'user',
        content: `Categorize: ${description} ($${amount})`
      }
    ],
    temperature: 0.3,
  })

  return response.choices[0].message.content
}
