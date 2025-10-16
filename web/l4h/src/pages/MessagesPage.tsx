import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Container, Card, Button, EmptyState, Modal, Input, useToast } from '@l4h/shared-ui'
import { messages } from '@l4h/shared-ui'
import { useTranslation } from '@l4h/shared-ui'
import { MessageCircle, Plus, Send, Mail, Clock } from 'lucide-react'
import { format } from 'date-fns'

interface MessageThread {
  id: string
  subject: string
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
  participants: Array<{
    id: string
    name: string
    email: string
  }>
}

interface Message {
  id: string
  content: string
  senderId: string
  senderName: string
  sentAt: string
  read: boolean
}

export default function MessagesPage() {
  const { t } = useTranslation()
  const { success, error } = useToast()
  const queryClient = useQueryClient()
  const [selectedThread, setSelectedThread] = useState<string | null>(null)
  const [showComposeModal, setShowComposeModal] = useState(false)
  const [newMessage, setNewMessage] = useState({
    subject: '',
    content: '',
    recipientId: ''
  })

  // Fetch message threads
  const { data: threads = [], isLoading: threadsLoading } = useQuery({
    queryKey: ['message-threads'],
    queryFn: messages.threads
  })

  // Fetch messages for selected thread
  const { data: threadMessages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', selectedThread],
    queryFn: () => selectedThread ? messages.thread(selectedThread) : Promise.resolve([]),
    enabled: !!selectedThread
  })

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: messages.post,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-threads'] })
      queryClient.invalidateQueries({ queryKey: ['messages', selectedThread] })
      setShowComposeModal(false)
      setNewMessage({ subject: '', content: '', recipientId: '' })
      success(t('messages.messageSent'))
    },
    onError: (err) => {
      error(t('common.error'), err instanceof Error ? err.message : '')
    }
  })

  const handleSendMessage = () => {
    if (!newMessage.subject || !newMessage.content) {
      error(t('common.error'), t('validation.requiredFields', { defaultValue: 'Please fill in all required fields' }))
      return
    }

    sendMessageMutation.mutate(newMessage)
  }

  const handleThreadSelect = (threadId: string) => {
    setSelectedThread(threadId)
  }

  if (threadsLoading) {
    return (
      <Container>
        <Card>
          <EmptyState
            icon={MessageCircle}
            title={t('common.loading')}
          />
        </Card>
      </Container>
    )
  }

  return (
    <Container>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('messages.title')}</h1>
        <Button onClick={() => setShowComposeModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('messages.compose')}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Threads List */}
        <div className="lg:col-span-1">
          <Card title={t('messages.inbox')}>
            {threads.length === 0 ? (
              <EmptyState
                icon={MessageCircle}
                title={t('messages.noMessages')}
                description={t('messages.startConversation', { defaultValue: 'Start a conversation' })}
                action={
                  <Button onClick={() => setShowComposeModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('messages.compose')}
                  </Button>
                }
              />
            ) : (
              <div className="space-y-2">
                {threads.map((thread: MessageThread) => (
                  <div
                    key={thread.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedThread === thread.id
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleThreadSelect(thread.id)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-medium text-sm truncate">
                        {thread.subject}
                      </h3>
                      {thread.unreadCount > 0 && (
                        <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                          {thread.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 truncate mb-1">
                      {thread.lastMessage}
                    </p>
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      {format(new Date(thread.lastMessageAt), 'MMM d, h:mm a')}
                    </div>
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
              {messagesLoading ? (
                <EmptyState
                  icon={MessageCircle}
                  title={t('common.loading')}
                />
              ) : (
                <div className="space-y-4">
                  {threadMessages.map((message: Message) => (
                    <div
                      key={message.id}
                      className={`p-4 rounded-lg ${
                        message.read ? 'bg-gray-50' : 'bg-blue-50'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-sm">
                            {message.senderName}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {format(new Date(message.sentAt), 'MMM d, h:mm a')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">
                        {message.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ) : (
            <Card>
              <EmptyState
                icon={MessageCircle}
                title={t('messages.selectConversation', { defaultValue: 'Select a conversation' })}
                description={t('messages.chooseThread', { defaultValue: 'Choose a message thread to view the conversation' })}
              />
            </Card>
          )}
        </div>
      </div>

      {/* Compose Modal */}
      <Modal
        open={showComposeModal}
        onClose={() => setShowComposeModal(false)}
        title={t('messages.newMessage')}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label={t('messages.subject')}
            value={newMessage.subject}
            onChange={(e) => setNewMessage(prev => ({ ...prev, subject: e.target.value }))}
            required
          />

          <Input
            label={t('messages.recipient')}
            value={newMessage.recipientId}
            onChange={(e) => setNewMessage(prev => ({ ...prev, recipientId: e.target.value }))}
            placeholder={t('messages.recipientPlaceholder', { defaultValue: 'Enter recipient email or ID' })}
            required
          />

          <Input
            label={t('messages.message')}
            value={newMessage.content}
            onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
            multiline
            rows={6}
            required
          />

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowComposeModal(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSendMessage}
              loading={sendMessageMutation.isPending}
            >
              <Send className="h-4 w-4 mr-2" />
              {t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>
    </Container>
  )
}

