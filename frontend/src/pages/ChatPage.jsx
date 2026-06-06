import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Send, MessageSquare, ArrowLeft, ChevronLeft } from 'lucide-react'
import { connectionsApi, messagesApi } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { Avatar, Spinner, EmptyState } from '../components/ui'
import ChatResourcesPanel from '../components/ChatResourcesPanel'

/* ── Helpers ── */
function fmtTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  if (isNaN(d)) return ts
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function groupMessages(messages) {
  const groups = []
  let lastSenderId = null
  let lastDate     = null

  messages.forEach(msg => {
    const msgDate = new Date(msg.created_at).toDateString()
    if (msgDate !== lastDate) {
      groups.push({ type: 'date', label: new Date(msg.created_at).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }) })
      lastDate = msgDate
    }
    const isSameGroup = msg.sender?.id === lastSenderId
    groups.push({ type: 'message', msg, isSameGroup })
    lastSenderId = msg.sender?.id
  })

  return groups
}

/* ── Contact Item in Sidebar ── */
function ContactItem({ conn, otherUser, isActive, onClick, lastMessage }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all border-l-[3px] ${
        isActive
          ? 'bg-indigo-50/80 dark:bg-indigo-950/30 border-l-indigo-500'
          : 'border-l-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'
      }`}
    >
      <div className="relative flex-shrink-0">
        <Avatar name={otherUser?.name || '?'} size="sm" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${isActive ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-800 dark:text-slate-200'}`}>
          {otherUser?.name}
        </p>
        {lastMessage && (
          <p className="text-[11px] text-slate-400 truncate mt-0.5">{lastMessage}</p>
        )}
      </div>
    </button>
  )
}

/* ── Message Bubble ── */
function MessageBubble({ msg, isMine, showAvatar, otherName }) {
  return (
    <div className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : ''}`}>
      {!isMine && (
        <div className="w-7 flex-shrink-0">
          {showAvatar && <Avatar name={otherName || '?'} size="xs" />}
        </div>
      )}
      <div className={`max-w-[72%] sm:max-w-[68%] flex flex-col gap-0.5 ${isMine ? 'items-end' : 'items-start'}`}>
        <div className={`px-4 py-2.5 text-sm leading-relaxed ${
          isMine ? 'bubble-mine text-white' : 'bubble-them text-slate-800'
        }`}
          style={{ borderRadius: '18px' }}
        >
          {msg.message}
        </div>
        <p className="text-[10px] text-slate-400 px-1">{fmtTime(msg.created_at)}</p>
      </div>
    </div>
  )
}

/* ── Main Page ── */
export default function ChatPage() {
  const { user }        = useAuth()
  const { id: paramId } = useParams()
  const navigate        = useNavigate()

  const [contacts, setContacts]     = useState([])
  const [activeId, setActiveId]     = useState(paramId ? Number(paramId) : null)
  const [messages, setMessages]     = useState([])
  const [text, setText]             = useState('')
  const [loadingConns, setLoadingConns] = useState(true)
  const [loadingMsgs, setLoadingMsgs]   = useState(false)
  const [sending, setSending]           = useState(false)
  const [lastMessages, setLastMessages] = useState({})
  // Mobile: show sidebar or chat panel
  const [showSidebar, setShowSidebar] = useState(!paramId)

  const bottomRef   = useRef(null)
  const textareaRef = useRef(null)
  const pollRef     = useRef(null)

  /* Load accepted connections */
  useEffect(() => {
    connectionsApi.list('accepted')
      .then(r => {
        const conns = r.data.data || []
        setContacts(conns)
        if (!activeId && conns.length > 0) {
          setActiveId(conns[0].id)
          setShowSidebar(true)
        }
      })
      .catch(() => {})
      .finally(() => setLoadingConns(false))
  }, [])

  /* Load messages for active connection */
  const loadMessages = useCallback(() => {
    if (!activeId) return
    messagesApi.list(activeId)
      .then(r => {
        const msgs = (r.data.data || []).slice().reverse()
        setMessages(msgs)
        if (msgs.length) {
          setLastMessages(prev => ({ ...prev, [activeId]: msgs[msgs.length - 1].message }))
        }
      })
      .catch(() => {})
      .finally(() => setLoadingMsgs(false))
  }, [activeId])

  useEffect(() => {
    if (!activeId) return
    setLoadingMsgs(true)
    loadMessages()
    clearInterval(pollRef.current)
    pollRef.current = setInterval(loadMessages, 5000)
    return () => clearInterval(pollRef.current)
  }, [loadMessages])

  /* Scroll to bottom when messages update */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const selectContact = (connId) => {
    setActiveId(connId)
    setMessages([])
    navigate(`/chat/${connId}`, { replace: true })
    setShowSidebar(false) // mobile: switch to chat view
    textareaRef.current?.focus()
  }

  const handleSend = async () => {
    const msg = text.trim()
    if (!msg || !activeId || sending) return
    setSending(true)
    setText('')
    try {
      const res = await messagesApi.send(activeId, msg)
      setMessages(prev => [...prev, res.data.data])
    } catch {}
    finally { setSending(false) }
    textareaRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const activeConn = contacts.find(c => c.id === activeId)
  const otherUser  = activeConn
    ? (activeConn.sender?.id === user?.id ? activeConn.receiver : activeConn.sender)
    : null

  const grouped = groupMessages(messages)

  return (
    // Mobile: full height minus header (56px) and bottom nav (56px on mobile)
    // Desktop: full height minus header only
    <div className="flex h-[calc(100vh-56px-56px)] lg:h-[calc(100vh-56px)] overflow-hidden bg-slate-50 dark:bg-slate-950">

      {/* ── Sidebar ── */}
      {/* Mobile: show/hide based on showSidebar state. Desktop: always visible */}
      <aside className={`
        ${showSidebar ? 'flex' : 'hidden'} lg:flex
        w-full lg:w-72 flex-shrink-0 bg-white dark:bg-slate-900
        border-r border-slate-100 dark:border-slate-800
        flex-col overflow-hidden absolute lg:relative inset-0 z-10 lg:z-auto
      `}>
        {/* Sidebar header */}
        <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">Messages</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">{contacts.length} connection{contacts.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Contact list */}
        <div className="flex-1 overflow-y-auto">
          {loadingConns ? (
            <div className="flex justify-center py-10"><Spinner size={20} /></div>
          ) : contacts.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-2xl mb-2">💬</p>
              <p className="text-xs text-slate-400">No connections yet.</p>
              <Link to="/connections" className="text-xs text-indigo-600 font-medium hover:underline">
                Find people to connect with
              </Link>
            </div>
          ) : (
            contacts.map(conn => {
              const other = conn.sender?.id === user?.id ? conn.receiver : conn.sender
              return (
                <ContactItem
                  key={conn.id}
                  conn={conn}
                  otherUser={other}
                  isActive={conn.id === activeId}
                  onClick={() => selectContact(conn.id)}
                  lastMessage={lastMessages[conn.id]}
                />
              )
            })
          )}
        </div>
      </aside>

      {/* ── Main chat area ── */}
      <div className={`
        ${!showSidebar ? 'flex' : 'hidden'} lg:flex
        flex-1 flex-col min-w-0 w-full
      `}>
        {!activeConn ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon="💬"
              title="Select a conversation"
              description="Choose a connection from the sidebar to start chatting."
            />
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3.5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-sm flex-shrink-0">
              {/* Back button — mobile only */}
              <button
                onClick={() => setShowSidebar(true)}
                className="lg:hidden p-1.5 -ml-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>

              <Avatar name={otherUser?.name || '?'} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 dark:text-white text-sm leading-tight">{otherUser?.name}</p>
              </div>
              <Link
                to="/sessions"
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900 hover:bg-indigo-100 transition-all no-underline whitespace-nowrap"
              >
                Schedule
              </Link>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 flex flex-col gap-1.5">
              {loadingMsgs && messages.length === 0 ? (
                <div className="flex justify-center py-12"><Spinner size={24} /></div>
              ) : messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center py-16">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center mx-auto mb-4">
                      <MessageSquare size={28} className="text-indigo-300" />
                    </div>
                    <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Start the conversation!</p>
                    <p className="text-xs text-slate-400">Say hi to {otherUser?.name} 👋</p>
                  </div>
                </div>
              ) : (
                grouped.map((item, i) => {
                  if (item.type === 'date') {
                    return (
                      <div key={i} className="flex items-center gap-3 my-3">
                        <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                        <span className="text-[10px] text-slate-400 font-medium px-2">{item.label}</span>
                        <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                      </div>
                    )
                  }
                  const { msg, isSameGroup } = item
                  const isMine = msg.sender?.id === user?.id
                  return (
                    <div key={msg.id} className={isSameGroup ? 'mt-0.5' : 'mt-2'}>
                      <MessageBubble
                        msg={msg}
                        isMine={isMine}
                        showAvatar={!isSameGroup}
                        otherName={otherUser?.name}
                      />
                    </div>
                  )
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Resources Panel */}
            <ChatResourcesPanel connectionId={activeId} />

            {/* Input bar */}
            <div className="flex items-end gap-2.5 px-4 py-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex-shrink-0">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${otherUser?.name}…`}
                rows={1}
                style={{ resize: 'none', lineHeight: '1.5' }}
                onInput={e => {
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                }}
                className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-800 transition-all max-h-[120px] overflow-y-auto"
              />
              <button
                onClick={handleSend}
                disabled={!text.trim() || sending}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center flex-shrink-0 hover:opacity-90 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-md shadow-indigo-200/50"
              >
                {sending
                  ? <Spinner size={15} className="text-white" />
                  : <Send size={16} className="ml-0.5" />
                }
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
