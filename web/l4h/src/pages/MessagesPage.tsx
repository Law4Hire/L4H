import React, { useState } from 'react'
import { Container, Card, Button, EmptyState, Modal, Input, useToast, useQuery, useMutation, useQueryClient, cases } from '@l4h/shared-ui'
import { messages } from '@l4h/shared-ui'
import { MessageCircle, Plus, Send, Mail, Clock, Trash2, Forward, Reply } from 'lucide-react'
import { format } from 'date-fns'

interface MessageThread {
  threadId: string
  title: string
  messageCount: number
  unreadCount?: number
}

interface Message {
  id: string
  content: string
  sender: string
  timestamp: string
  isRead: boolean
}

interface RecipientOption {
  id: string | null
  label: string
  description: string
}

export default function MessagesPage() {
  const { success, error } = useToast()
  const queryClient = useQueryClient()
  const [selectedThread, setSelectedThread] = useState<string | null>(null)
  const [showComposeModal, setShowComposeModal] = useState(false)
  const [showForwardModal, setShowForwardModal] = useState(false)
  const [forwardingMessageId, setForwardingMessageId] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [newMessage, setNewMessage] = useState({
    title: '',
    initialMessage: '',
    recipientUserId: null as string | null
  })
  const [forwardMessage, setForwardMessage] = useState({
    title: '',
    recipientUserId: null as string | null
  })

  // Fetch user's cases first
  const { data: userCases = [], isLoading: casesLoading } = useQuery({
    queryKey: ['cases'],
    queryFn: cases.mine
  })

  // Get the first case (user's active case)
  const activeCase = userCases.length > 0 ? userCases[0] : null
  const activeCaseId = activeCase?.id || null
  const assignedStaffId = activeCase?.assignedStaffId || null

  // Fetch recipients list
  const { data: recipients = [] } = useQuery({
    queryKey: ['messaging-recipients'],
    queryFn: async () => {
      const response = await fetch('/api/v1/messaging/recipients', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        }
      })
      if (!response.ok) return []
      return response.json()
    }
  })

  // Build recipient options for dropdown
  const recipientOptions = [
    {
      id: '',
      label: 'General (All Admins)',
      description: 'Message visible to all administrators'
    },
    ...recipients.map((r: any) => ({
      id: r.id,
      label: r.label,
      description: r.description
    }))
  ]

  // Fetch all message threads (Unified Inbox)
  const { data: threadsData, isLoading: threadsLoading } = useQuery({
    queryKey: ['message-threads-unified'],
    queryFn: async () => {
      const response = await fetch('/api/v1/messaging/threads', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        }
      })
      if (!response.ok) throw new Error('Failed to fetch threads')
      return response.json()
    }
  })

  const threads: MessageThread[] = Array.isArray(threadsData) ? threadsData : (threadsData?.threads || [])

  // Fetch messages for selected thread
  const { data: messagesData, isLoading: messagesLoading, refetch: refetchMessages } = useQuery({
    queryKey: ['messages', selectedThread],
    queryFn: async () => {
      if (!selectedThread) return { messages: [] }
      const response = await fetch(`/api/v1/messaging/threads/${selectedThread}/messages`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        }
      })
      if (!response.ok) throw new Error('Failed to fetch messages')
      const data = await response.json()

      // Mark messages as read
      if (data.messages && data.messages.length > 0) {
        const unreadMessageIds = data.messages
          .filter((m: Message) => !m.isRead)
          .map((m: Message) => m.id)

        if (unreadMessageIds.length > 0) {
          // Mark as read in background
          fetch('/api/v1/messaging/read', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
            },
            body: JSON.stringify({ messageIds: unreadMessageIds })
          }).then(() => {
            queryClient.invalidateQueries({ queryKey: ['message-threads', activeCaseId] })
          })
        }
      }

      return data
    },
    enabled: !!selectedThread
  })

  const threadMessages = messagesData?.messages || []

  // Send message mutation (create new thread)
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { caseId: string; title: string; initialMessage: string; recipientUserId: string | null }) => {
      const response = await fetch('/api/v1/messaging/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        },
        body: JSON.stringify(data)
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || errorData.title || 'Failed to create thread')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-threads', activeCaseId] })
      setShowComposeModal(false)
      setNewMessage({ title: '', initialMessage: '', recipientUserId: null })
      success('Message sent successfully')
    },
    onError: (err) => {
      error('Error', err instanceof Error ? err.message : 'Failed to send message')
    }
  })

  // Reply mutation
  const replyMutation = useMutation({
    mutationFn: async (data: { threadId: string; content: string }) => {
      const response = await fetch(`/api/v1/messaging/threads/${data.threadId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        },
        body: JSON.stringify({ content: data.content })
      })
      if (!response.ok) throw new Error('Failed to send reply')
      return response.json()
    },
    onSuccess: () => {
      refetchMessages()
      setReplyContent('')
      success('Reply sent successfully')
    },
    onError: (err) => {
      error('Error', err instanceof Error ? err.message : 'Failed to send reply')
    }
  })

  // Delete thread mutation
  const deleteThreadMutation = useMutation({
    mutationFn: async (threadId: string) => {
      const response = await fetch(`/api/v1/messaging/threads/${threadId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        }
      })
      if (!response.ok) throw new Error('Failed to delete thread')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-threads', activeCaseId] })
      setSelectedThread(null)
      success('Thread deleted successfully')
    },
    onError: (err) => {
      error('Error', err instanceof Error ? err.message : 'Failed to delete thread')
    }
  })

  // Forward message mutation
  const forwardMessageMutation = useMutation({
    mutationFn: async (data: { messageId: string; caseId: string; title: string; recipientUserId: string | null }) => {
      const response = await fetch(`/api/v1/messaging/messages/${data.messageId}/forward`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        },
        body: JSON.stringify({
          caseId: data.caseId,
          title: data.title,
          recipientUserId: data.recipientUserId
        })
      })
      if (!response.ok) throw new Error('Failed to forward message')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-threads', activeCaseId] })
      setShowForwardModal(false)
      setForwardingMessageId(null)
      setForwardMessage({ title: '', recipientUserId: null })
      success('Message forwarded successfully')
    },
    onError: (err) => {
      error('Error', err instanceof Error ? err.message : 'Failed to forward message')
    }
  })

  const handleSendMessage = () => {
    if (!newMessage.title || !newMessage.initialMessage) {
      error('Error', 'Please fill in all required fields')
      return
    }

    if (!activeCaseId) {
      error('Error', 'No active case found. Please create a case first.')
      return
    }

    sendMessageMutation.mutate({
      caseId: activeCaseId,
      title: newMessage.title,
      initialMessage: newMessage.initialMessage,
      recipientUserId: newMessage.recipientUserId
    })
  }

  const handleReply = () => {
    if (!replyContent.trim()) {
      error('Error', 'Please enter a message')
      return
    }

    if (!selectedThread) return

    replyMutation.mutate({
      threadId: selectedThread,
      content: replyContent
    })
  }

  const handleDeleteThread = (threadId: string) => {
    if (confirm('Are you sure you want to delete this thread? This action cannot be undone.')) {
      deleteThreadMutation.mutate(threadId)
    }
  }

  const handleForwardMessage = (messageId: string) => {
    setForwardingMessageId(messageId)
    setShowForwardModal(true)
  }

  const handleSendForward = () => {
    if (!forwardMessage.title.trim()) {
      error('Error', 'Please enter a subject')
      return
    }

    if (!forwardingMessageId || !activeCaseId) return

    forwardMessageMutation.mutate({
      messageId: forwardingMessageId,
      caseId: activeCaseId,
      title: forwardMessage.title,
      recipientUserId: forwardMessage.recipientUserId
    })
  }

  const handleThreadSelect = (threadId: string) => {
    setSelectedThread(threadId)
  }

  if (casesLoading || threadsLoading) {
    return (
      <Container>
        <Card>
          <EmptyState
            icon={MessageCircle}
            title={'Loading...'}
          />
        </Card>
      </Container>
    )
  }

  if (!activeCaseId) {
    return (
      <Container>
        <Card>
          <EmptyState
            icon={MessageCircle}
            title={'No Case Found'}
            description={'You need to create a case before you can send messages. Please visit your dashboard to get started.'}
          />
        </Card>
      </Container>
    )
  }

  return (
    <Container>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{'Messages'}</h1>
        <Button onClick={() => setShowComposeModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {'Compose'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Threads List */}
        <div className="lg:col-span-1">
          <Card title={'Inbox'}>
            {threads.length === 0 ? (
              <EmptyState
                icon={MessageCircle}
                title={'No messages found'}
                description={'Start a conversation'}
                action={
                  <Button onClick={() => setShowComposeModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {'Compose'}
                  </Button>
                }
              />
            ) : (
              <div className="space-y-2">
                {threads.map((thread: MessageThread) => (
                  <div
                    key={thread.threadId}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedThread === thread.threadId
                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => handleThreadSelect(thread.threadId)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h3 className={`text-sm truncate ${thread.unreadCount && thread.unreadCount > 0 ? 'font-bold text-gray-900 dark:text-gray-100' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                        {thread.title}
                      </h3>
                      {thread.unreadCount && thread.unreadCount > 0 && (
                        <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center ml-2">
                          {thread.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {thread.messageCount} {thread.messageCount === 1 ? 'message' : 'messages'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Messages */}
        <div className="lg:col-span-2">
          {selectedThread ? (
            <Card>
              {/* Thread header with delete button */}
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {threads.find(t => t.threadId === selectedThread)?.title}
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteThread(selectedThread)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {messagesLoading ? (
                <EmptyState
                  icon={MessageCircle}
                  title={'Loading...'}
                />
              ) : (
                <>
                  <div className="space-y-4 mb-4 max-h-[500px] overflow-y-auto">
                    {threadMessages.map((message: Message, idx: number) => (
                      <div
                        key={idx}
                        className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                              {message.sender}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {message.timestamp ? format(new Date(message.timestamp), 'MMM d, h:mm a') : ''}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => message.id && handleForwardMessage(message.id)}
                              title="Forward message"
                            >
                              <Forward className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {message.content}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex space-x-2">
                      <textarea
                        className="flex-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm transition-colors bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 p-2"
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Type your reply..."
                        rows={2}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleReply()
                          }
                        }}
                      />
                      <Button
                        onClick={handleReply}
                        disabled={!replyContent.trim()}
                        loading={replyMutation.isPending}
                      >
                        <Reply className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </Card>
          ) : (
            <Card>
              <EmptyState
                icon={MessageCircle}
                title={'Select a conversation'}
                description={'Choose a message thread to view the conversation'}
              />
            </Card>
          )}
        </div>
      </div>

      {/* Compose Modal */}
      <Modal
        open={showComposeModal}
        onClose={() => setShowComposeModal(false)}
        title={'New Message Thread'}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              To
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              value={newMessage.recipientUserId || ''}
              onChange={(e) => setNewMessage(prev => ({ ...prev, recipientUserId: e.target.value || null }))}
            >
              {recipientOptions.map((option) => (
                <option key={option.id || 'general'} value={option.id || ''}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {recipientOptions.find(o => o.id === newMessage.recipientUserId || (!o.id && !newMessage.recipientUserId))?.description}
            </p>
          </div>

          <Input
            label={'Subject'}
            value={newMessage.title}
            onChange={(e) => setNewMessage(prev => ({ ...prev, title: e.target.value }))}
            placeholder={'Enter message subject'}
            required
          />

          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Message
            </label>
            <textarea
              className="block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm transition-colors bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 p-2"
              value={newMessage.initialMessage}
              onChange={(e) => setNewMessage(prev => ({ ...prev, initialMessage: e.target.value }))}
              rows={6}
              placeholder="Type your message here..."
              required
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowComposeModal(false)}
            >
              {'Cancel'}
            </Button>
            <Button
              onClick={handleSendMessage}
              loading={sendMessageMutation.isPending}
            >
              <Send className="h-4 w-4 mr-2" />
              {'Send'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Forward Modal */}
      <Modal
        open={showForwardModal}
        onClose={() => {
          setShowForwardModal(false)
          setForwardingMessageId(null)
          setForwardMessage({ title: '', recipientUserId: null })
        }}
        title={'Forward Message'}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              To
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              value={forwardMessage.recipientUserId || ''}
              onChange={(e) => setForwardMessage(prev => ({ ...prev, recipientUserId: e.target.value || null }))}
            >
              {recipientOptions.map((option) => (
                <option key={option.id || 'general'} value={option.id || ''}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <Input
            label={'Subject'}
            value={forwardMessage.title}
            onChange={(e) => setForwardMessage(prev => ({ ...prev, title: e.target.value }))}
            placeholder={'Enter new thread subject'}
            required
          />

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowForwardModal(false)
                setForwardingMessageId(null)
                setForwardMessage({ title: '', recipientUserId: null })
              }}
            >
              {'Cancel'}
            </Button>
            <Button
              onClick={handleSendForward}
              loading={forwardMessageMutation.isPending}
            >
              <Forward className="h-4 w-4 mr-2" />
              {'Forward'}
            </Button>
          </div>
        </div>
      </Modal>
    </Container>
  )
}
