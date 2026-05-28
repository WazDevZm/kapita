import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader } from 'lucide-react'
import Card from '../components/Card'
import { chatAPI } from '../services/api'

export default function Chat() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I\'m your business assistant. I have access to your real-time business data. Ask me anything about your sales, inventory, customers, or finances!'
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const response = await chatAPI.sendMessage(userMessage)
      
      // Add assistant response
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.data.response
      }])
    } catch (error) {
      console.error('Failed to get response:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }])
    } finally {
      setLoading(false)
    }
  }

  const suggestedQuestions = [
    'Who owes me the most money?',
    'Am I profitable this month?',
    'What are my top selling products?',
    'How much cash do I have available?',
    'Which products are low on stock?',
    'What are my biggest expenses?'
  ]

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)]">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Business Assistant</h1>
        <p className="text-gray-600">Ask questions about your business data</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
        {/* Suggested Questions */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Suggested Questions
            </h3>
            <div className="space-y-2">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInput(question)}
                  className="w-full text-left p-3 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-gray-700"
                >
                  {question}
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-3">
          <Card className="h-full flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex items-start space-x-3 ${
                    message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  <div className={`p-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-primary-100'
                      : 'bg-gray-100'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="w-5 h-5 text-primary-600" />
                    ) : (
                      <Bot className="w-5 h-5 text-gray-600" />
                    )}
                  </div>
                  <div className={`flex-1 p-4 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-primary-50'
                      : 'bg-gray-50'
                  }`}>
                    <p className="text-gray-900 whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-lg bg-gray-100">
                    <Bot className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1 p-4 rounded-lg bg-gray-50">
                    <Loader className="w-5 h-5 animate-spin text-gray-600" />
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything about your business..."
                className="input flex-1"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="btn btn-primary flex items-center space-x-2"
              >
                <Send className="w-5 h-5" />
                <span>Send</span>
              </button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}
