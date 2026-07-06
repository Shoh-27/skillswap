import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Check, X, MessageSquare, Clock, Users } from 'lucide-react'
import { connectionsApi } from '../services/api'
import { Avatar, Card, Tabs, Badge, Button, Spinner, EmptyState, SkillTag } from '../components/ui'

const STATUS_BADGE = {
  pending:  { variant: 'amber',   label: 'Pending' },
  accepted: { variant: 'emerald', label: 'Connected' },
  rejected: { variant: 'rose',    label: 'Rejected' },
}

function ConnectionCard({ conn, viewerIsReceiver, onAccept, onReject }) {
  // Local state — darhol UI yangilanishi uchun
  const [localStatus, setLocalStatus] = useState(conn.status)
  const [loading, setLoading] = useState(null) // 'accept' | 'reject'

  const handle = async (action) => {
    setLoading(action)
    try {
      if (action === 'accept') {
        await onAccept(conn.id)
        setLocalStatus('accepted') // ✅ darhol yangilash
      } else {
        await onReject(conn.id)
        setLocalStatus('rejected') // ✅ darhol yangilash
      }
    } catch {
      // Xato bo'lsa asl statusni qaytarish
      setLocalStatus(conn.status)
    } finally {
      setLoading(null)
    }
  }

  const other  = viewerIsReceiver ? conn.sender : conn.receiver
  const status = STATUS_BADGE[localStatus] ?? STATUS_BADGE.pending

  return (
    <Card className="p-5 flex flex-col gap-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <Avatar name={other?.name || '?'} size="md" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 dark:text-white truncate">{other?.name}</p>
          <p className="text-xs text-slate-400 truncate">{other?.email}</p>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      {/* Skills preview */}
      {other?.skills_can_teach?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {other.skills_can_teach.slice(0, 3).map(s => (
            <SkillTag key={s.id} name={s.name} type="teach" />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        {/* Accept/Reject faqat pending va receiver bo'lsa ko'rinadi */}
        {viewerIsReceiver && localStatus === 'pending' && (
          <>
            <Button
              variant="success" size="sm"
              loading={loading === 'accept'}
              disabled={!!loading}
              onClick={() => handle('accept')}
              className="flex-1"
            >
              <Check size={14} /> Accept
            </Button>
            <Button
              variant="danger" size="sm"
              loading={loading === 'reject'}
              disabled={!!loading}
              onClick={() => handle('reject')}
            >
              <X size={14} />
            </Button>
          </>
        )}

        {localStatus === 'accepted' && (
          <Link
            to="/chat"
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 no-underline"
          >
            <MessageSquare size={14} /> Message
          </Link>
        )}

        {!viewerIsReceiver && localStatus === 'pending' && (
          <div className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400">
            <Clock size={14} /> Waiting for response…
          </div>
        )}

        {localStatus === 'rejected' && (
          <p className="text-sm text-slate-400">Request was declined.</p>
        )}
      </div>
    </Card>
  )
}

export default function ConnectionsPage() {
  const [tab, setTab]           = useState(0)
  const [received, setReceived] = useState([])
  const [sent, setSent]         = useState([])
  const [accepted, setAccepted] = useState([])
  const [loading, setLoading]   = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      connectionsApi.list('received'),
      connectionsApi.list('sent'),
      connectionsApi.list('accepted'),
    ]).then(([r, s, a]) => {
      setReceived(r.data.data)
      setSent(s.data.data)
      setAccepted(a.data.data)
    }).catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  // Accept: UI darhol yangilanadi (ConnectionCard ichida),
  // keyin background da ro'yxat ham yangilanadi
  const handleAccept = async (id) => {
    await connectionsApi.accept(id)
    // Background refresh — karta allaqachon yangilangan bo'ladi
    setTimeout(load, 800)
  }

  const handleReject = async (id) => {
    await connectionsApi.reject(id)
    setTimeout(load, 800)
  }

  const tabs = [
    `Received${received.length ? ` (${received.length})` : ''}`,
    `Sent${sent.length ? ` (${sent.length})` : ''}`,
    `Accepted${accepted.length ? ` (${accepted.length})` : ''}`,
  ]

  const lists   = [received, sent, accepted]
  const empties = [
    { icon: '📭', title: 'No pending requests',   description: 'When someone wants to connect with you, it will appear here.' },
    { icon: '📤', title: 'No sent requests',       description: 'Discover people and send connection requests to get started.' },
    { icon: '🌐', title: 'No connections yet',     description: 'Accept a request or send one to build your network.' },
  ]
  const current = lists[tab]

  return (
    <div className="p-6 md:p-8 max-w-4xl animate-fade-in">
      <div className="mb-7">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Connections</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your network and connection requests</p>
      </div>

      <div className="max-w-sm mb-7">
        <Tabs tabs={tabs} active={tab} onChange={setTab} />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={28} /></div>
      ) : current.length === 0 ? (
        <EmptyState
          icon={empties[tab].icon}
          title={empties[tab].title}
          description={empties[tab].description}
          action={tab === 2 ? (
            <Link to="/discover">
              <Button>Discover People</Button>
            </Link>
          ) : null}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {current.map(conn => (
            <ConnectionCard
              key={conn.id}
              conn={conn}
              viewerIsReceiver={tab === 0}
              onAccept={handleAccept}
              onReject={handleReject}
            />
          ))}
        </div>
      )}
    </div>
  )
}
