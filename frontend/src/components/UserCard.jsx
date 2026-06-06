import { useState } from 'react'
import { UserPlus, Check, Clock, MessageSquare } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Avatar, SkillTag, Card, Button, StarRating, Badge } from './ui'
import { connectionsApi } from '../services/api'

export default function UserCard({ user, connectionStatus, connectionId, onConnect }) {
  const [status, setStatus]   = useState(connectionStatus)
  const [loading, setLoading] = useState(false)

  const handleConnect = async (e) => {
    e.stopPropagation()
    setLoading(true)
    try {
      await connectionsApi.send(user.id)
      setStatus('pending')
      onConnect?.()
    } catch (err) {
      if (err.response?.status === 422) setStatus('pending')
    } finally { setLoading(false) }
  }

  return (
    <Card hover className="p-5 flex flex-col gap-3.5 animate-fade-up">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Avatar name={user.name} size="md" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 truncate leading-tight">{user.name}</p>
          {user.city && <p className="text-xs text-slate-400 mt-0.5">📍 {user.city}</p>}
          <div className="mt-1">
            <StarRating rating={user.avg_rating} count={user.total_reviews} />
          </div>
        </div>
        {user.total_sessions > 0 && (
          <Badge variant="gray" className="flex-shrink-0 text-[10px]">
            {user.total_sessions} sessions
          </Badge>
        )}
      </div>

      {/* Bio */}
      {user.bio && (
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{user.bio}</p>
      )}

      {/* Teaches */}
      {user.skills_can_teach?.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Teaches</p>
          <div className="flex flex-wrap gap-1">
            {user.skills_can_teach.slice(0, 3).map(s => (
              <SkillTag key={s.id} name={s.name} type="teach" />
            ))}
            {user.skills_can_teach.length > 3 && (
              <span className="text-xs text-slate-400 self-center">+{user.skills_can_teach.length - 3} more</span>
            )}
          </div>
        </div>
      )}

      {/* Wants to learn */}
      {user.skills_want_to_learn?.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Wants to learn</p>
          <div className="flex flex-wrap gap-1">
            {user.skills_want_to_learn.slice(0, 3).map(s => (
              <SkillTag key={s.id} name={s.name} type="learn" />
            ))}
            {user.skills_want_to_learn.length > 3 && (
              <span className="text-xs text-slate-400 self-center">+{user.skills_want_to_learn.length - 3} more</span>
            )}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="flex gap-2 pt-0.5">
        {!status && (
          <Button onClick={handleConnect} loading={loading} className="flex-1" size="sm">
            <UserPlus size={13} /> Connect
          </Button>
        )}
        {status === 'pending' && (
          <div className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-sm font-medium">
            <Clock size={13} /> Pending
          </div>
        )}
        {status === 'accepted' && (
          <div className="flex items-center gap-2 w-full">
            <div className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-medium">
              <Check size={13} /> Connected
            </div>
            {connectionId && (
              <Link
                to="/chat"
                className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 transition-colors"
                onClick={e => e.stopPropagation()}
              >
                <MessageSquare size={15} />
              </Link>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
