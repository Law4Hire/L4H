import React, { useState, useEffect } from 'react'
import { Card, Button, useToast } from '@l4h/shared-ui'
import { MessageSquare, Send, User, Search, Clock, ChevronRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface MessageThread {
  id: string
  subject: string
  lastMessageSnippet: string
  lastMessageTime: string
  participantName: string
  unreadCount: number
}

interface Message {
  id: string
  body: string
  sentAt: string
  senderName: string
  isMe: boolean
}

interface Recipient {
  id: string
  label: string
  description: string
}

const MessagesPage: React.FC = () => {
  const { error, success } = useToast()
  const [threads, setThreads] = useState<MessageThread[]>([])
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [selectedThread, setSelectedThread] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [showNewThreadModal, setShowNewThreadModal] = useState(false)
  const [newThreadData, setNewThreadData] = useState({
    recipientId: '',
    subject: '',
    body: ''
  })

  useEffect(() => {
    fetchThreads()
    fetchRecipients()
  }, [])

  useEffect(() => {
    if (selectedThread) {
      fetchMessages(selectedThread)
    }
  }, [selectedThread])

  const fetchThreads = async () => {
    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch('/api/v1/messaging/threads', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        setThreads(await response.json())
      }
    } catch (err) {
      console.error('Error fetching threads:', err)
      error('Failed to load message threads')
    } finally {
      setLoading(false)
    }
  }

  const fetchRecipients = async () => {
    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch('/api/v1/messaging/recipients', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        setRecipients(await response.json())
      }
    } catch (err) {
      console.error('Error fetching recipients:', err)
    }
  }

  const handleCreateThread = async () => {
    if (!newThreadData.recipientId || !newThreadData.subject || !newThreadData.body) return

    try {
      const token = localStorage.getItem('jwt_token')
      // We need a caseId to create a thread in the current system. 
      // For now, let's find the first case for the recipient or use a dummy case if needed.
      // Better: Update the backend to allow creating threads without explicit case if it's staff-to-staff.
      // But for now, let's look for a case associated with the recipient if they are a client.
      
      const response = await fetch('/api/v1/messaging/threads', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          caseId: '00000000-0000-0000-0000-000000000000', // Backend will need to handle this or find case
          title: newThreadData.subject,
          initialMessage: newThreadData.body,
          recipientUserId: newThreadData.recipientId
        })
      })

      if (response.ok) {
        success('Conversation started')
        setShowNewThreadModal(false)
        setNewThreadData({ recipientId: '', subject: '', body: '' })
        fetchThreads()
      }
    } catch (err) {
      error('Failed to start conversation')
    }
  }

  const fetchMessages = async (threadId: string) => {
    try {
      setMessagesLoading(true)
      const token = localStorage.getItem('jwt_token')
      const response = await fetch(`/api/v1/messaging/threads/${threadId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (err) {
      console.error('Error fetching messages:', err)
      error('Failed to load messages')
    } finally {
      setMessagesLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!selectedThread || !newMessage.trim()) return

    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch(`/api/v1/messaging/threads/${selectedThread}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ body: newMessage })
      })

      if (response.ok) {
        setNewMessage('')
        fetchMessages(selectedThread)
        fetchThreads() // Update snippets
      } else {
        error('Failed to send message')
      }
    } catch (err) {
      console.error('Error sending message:', err)
      error('Error sending message')
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
  }

  return (
    <div className="h-[calc(100vh-12rem)] flex overflow-hidden bg-white dark:bg-navy-900 rounded-lg shadow-lg border border-gray-200 dark:border-navy-800">
      {/* Sidebar - Thread List */}
      <div className="w-full md:w-80 flex flex-col border-r border-gray-200 dark:border-navy-800">
        <div className="p-4 border-b border-gray-200 dark:border-navy-800 bg-gray-50 dark:bg-navy-950 flex justify-between items-center">
          <h2 className="text-xl font-bold text-navy-900 dark:text-white flex items-center">
            <MessageSquare size={20} className="mr-2 text-blue-600" />
            Messages
          </h2>
          <Button 
            variant="primary" 
            size="sm" 
            className="rounded-full !p-2" 
            onClick={() => setShowNewThreadModal(true)}
            title="New Message"
          >
            <Plus size={18} />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {threads.length === 0 ? (
            <div className="p-8 text-center text-gray-500 italic">No messages yet.</div>
          ) : (
            threads.map((thread) => (
              <div
                key={thread.id}
                onClick={() => setSelectedThread(thread.id)}
                className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-navy-800 transition-colors border-b border-gray-100 dark:border-navy-800 ${
                  selectedThread === thread.id ? 'bg-blue-50 dark:bg-navy-800 border-l-4 border-l-blue-600' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-navy-900 dark:text-white truncate">{thread.participantName}</span>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                    {formatDistanceToNow(new Date(thread.lastMessageTime))} ago
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 truncate font-medium">{thread.subject}</div>
                <div className="text-xs text-gray-400 dark:text-gray-500 truncate mt-1">{thread.lastMessageSnippet}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="hidden md:flex flex-1 flex-col bg-gray-50 dark:bg-navy-950">
        {selectedThread ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white dark:bg-navy-900 border-b border-gray-200 dark:border-navy-800 flex justify-between items-center shadow-sm">
              <div>
                <h3 className="font-bold text-navy-900 dark:text-white">
                  {threads.find(t => t.id === selectedThread)?.participantName}
                </h3>
                <p className="text-xs text-gray-500">{threads.find(t => t.id === selectedThread)?.subject}</p>
              </div>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messagesLoading ? (
                <div className="flex justify-center py-8"><div className="animate-spin h-6 w-6 border-b-2 border-blue-600 rounded-full"></div></div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${
                      msg.isMe 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'bg-white dark:bg-navy-800 text-gray-900 dark:text-white border border-gray-100 dark:border-navy-700 rounded-tl-none'
                    }`}>
                      <p className="text-sm leading-relaxed">{msg.body}</p>
                      <p className={`text-[10px] mt-1 ${msg.isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                        {formatDistanceToNow(new Date(msg.sentAt))} ago
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-navy-900 border-t border-gray-200 dark:border-navy-800">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-navy-700 rounded-full bg-white dark:bg-navy-950 text-navy-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <Button 
                  onClick={handleSendMessage}
                  className="rounded-full bg-blue-600 hover:bg-blue-700 !p-2"
                  disabled={!newMessage.trim()}
                >
                  <Send size={20} />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <div className="bg-gray-100 dark:bg-navy-900 p-6 rounded-full mb-4">
              <MessageSquare size={48} />
            </div>
            <p className="text-lg font-medium">Select a thread to start messaging</p>
          </div>
        )}
      </div>
      {/* New Thread Modal */}
      {showNewThreadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-6 dark:bg-navy-900 shadow-2xl border dark:border-navy-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-navy-900 dark:text-white">New Message</h3>
              <button onClick={() => setShowNewThreadModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">To</label>
                <select 
                  className="w-full p-2 border rounded bg-white dark:bg-navy-950 dark:border-navy-700 dark:text-white"
                  value={newThreadData.recipientId}
                  onChange={(e) => setNewThreadData({...newThreadData, recipientId: e.target.value})}
                >
                  <option value="">Select recipient...</option>
                  <option value="">General (All Admins)</option>
                  {recipients.map(r => (
                    <option key={r.id} value={r.id}>{r.label} ({r.description})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                <input 
                  type="text"
                  className="w-full p-2 border rounded bg-white dark:bg-navy-950 dark:border-navy-700 dark:text-white"
                  placeholder="Case #123 / General Inquiry"
                  value={newThreadData.subject}
                  onChange={(e) => setNewThreadData({...newThreadData, subject: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Message</label>
                <textarea 
                  rows={4}
                  className="w-full p-2 border rounded bg-white dark:bg-navy-950 dark:border-navy-700 dark:text-white"
                  placeholder="How can we help?"
                  value={newThreadData.body}
                  onChange={(e) => setNewThreadData({...newThreadData, body: e.target.value})}
                />
              </div>

              <Button 
                variant="primary" 
                className="w-full mt-4" 
                disabled={!newThreadData.subject || !newThreadData.body}
                onClick={handleCreateThread}
              >
                Send Message
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

export default MessagesPage
