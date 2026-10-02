import React from 'react'
import { Trash2 } from 'lucide-react'
import './team-chat.css'
import { deleteTeamChatMessage, getCurrentUser, getUserProfile, sendTeamChatMessage, subscribeToTeamChat } from '../services/firebase.js'

function TeamChat() {
  const [messages, setMessages] = React.useState([])
  const [message, setMessage] = React.useState('')
  const [profile, setProfile] = React.useState(null)
  const [isSending, setIsSending] = React.useState(false)
  const [deletingMessageId, setDeletingMessageId] = React.useState('')
  const [error, setError] = React.useState('')
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) return undefined
    getUserProfile(currentUser.uid).then(setProfile).catch(() => setError('Unable to load your chat profile.'))
    return subscribeToTeamChat(setMessages, (chatError) => setError(chatError.message || 'Unable to load team chat.'))
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!message.trim() || isSending) return
    setIsSending(true)
    setError('')
    try {
      await sendTeamChatMessage(message)
      setMessage('')
    } catch (chatError) {
      setError(chatError.message || 'Unable to send message.')
    } finally {
      setIsSending(false)
    }
  }

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Delete this message?')) return
    setDeletingMessageId(messageId)
    setError('')
    try {
      await deleteTeamChatMessage(messageId)
    } catch (chatError) {
      setError(chatError.message || 'Unable to delete message.')
    } finally {
      setDeletingMessageId('')
    }
  }

  return (
    <div className={`team-chat-widget${isOpen ? ' team-chat-widget--open' : ''}`}>
      {isOpen && (
        <section className="team-chat-panel" aria-label="Team chat messages">
          <header className="team-chat-panel__header">
            <div>
              <strong>Team Chat</strong>
              <span>Admin + Staff only</span>
            </div>
            <button className="team-chat-panel__close" type="button" onClick={() => setIsOpen(false)} aria-label="Close team chat">x</button>
          </header>
          {error && <p className="team-chat-page__error" role="alert">{error}</p>}
          <div className="team-chat-box__messages">
            {messages.length === 0 ? (
              <div className="team-chat-box__empty">No messages yet. Start the team conversation.</div>
            ) : messages.map((chatMessage) => (
              <article className={`team-chat-message${chatMessage.authorUid === profile?.uid ? ' team-chat-message--own' : ''}`} key={chatMessage.id}>
                <div className="team-chat-message__meta">
                  <strong>{chatMessage.authorName || 'Team member'}</strong>
                  <span>{chatMessage.authorRole === 'admin' ? 'Admin' : `Staff${chatMessage.barangay ? ` · ${chatMessage.barangay}` : ''}`}</span>
                  {chatMessage.authorUid === profile?.uid && (
                    <button className="team-chat-message__delete" type="button" onClick={() => handleDeleteMessage(chatMessage.id)} disabled={deletingMessageId === chatMessage.id} aria-label="Delete your message" title="Delete message">
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  )}
                </div>
                <p>{chatMessage.text}</p>
                <time>{chatMessage.createdAt?.toDate ? chatMessage.createdAt.toDate().toLocaleString() : 'Sending...'}</time>
              </article>
            ))}
          </div>
          <form className="team-chat-box__composer" onSubmit={handleSubmit}>
            <label htmlFor="team-chat-message">Message</label>
            <div className="team-chat-box__input-row">
              <input id="team-chat-message" type="text" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write a message..." maxLength={1000} disabled={isSending} />
              <button type="submit" disabled={!message.trim() || isSending}>{isSending ? '...' : 'Send'}</button>
            </div>
          </form>
        </section>
      )}
      <button className="team-chat-launcher" type="button" onClick={() => setIsOpen((open) => !open)} aria-expanded={isOpen} aria-label={isOpen ? 'Close team chat' : 'Open team chat'}>
        <span aria-hidden="true">💬</span>
        <span>Chat</span>
      </button>
    </div>
  )
}

export default TeamChat