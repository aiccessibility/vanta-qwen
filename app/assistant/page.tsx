'use client'

import { useState } from 'react'

export default function AssistantPage() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I\'m your Vanta AI assistant. How can I help you with your finances today?' }
  ])
  const [input, setInput] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    setMessages([...messages, { role: 'user', content: input }])
    setInput('')
    
    // Simulated AI response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'I can help you analyze your financial data. Based on your recent transactions, I notice your expenses are down 15% compared to last month. Would you like me to provide a detailed breakdown?' 
      }])
    }, 1000)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-[calc(100vh-8rem)]">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">AI Financial Assistant</h1>
      
      <div className="bg-white shadow rounded-lg overflow-hidden h-[calc(100%-5rem)] flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-lg px-4 py-3 ${
                message.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-900'
              }`}>
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="border-t p-4">
          <div className="flex gap-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about your finances..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-medium"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
