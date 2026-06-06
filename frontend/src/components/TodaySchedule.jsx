import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, ExternalLink, Users, ChevronRight } from 'lucide-react'
import { campusApi } from '../services/api'
import { Spinner } from './ui'

function ScheduleItem({ item }) {
  const isGroup   = item.type === 'group'
  const isLive    = item.status === 'live'
  const isPast    = false // vaqt o'tgan bo'lsa belgilash mumkin

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 ${
      isLive
        ? 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-900/50'
        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'
    }`}>
      {/* Vaqt */}
      <div className="flex-shrink-0 text-center w-10">
        <p className="text-sm font-black text-slate-900 dark:text-white leading-none">{item.time}</p>
        <p className="text-[9px] text-slate-400 mt-0.5">{item.duration}</p>
      </div>

      {/* Chiziq */}
      <div className={`w-0.5 self-stretch rounded-full mt-1 ${
        isLive ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'
      }`} />

      {/* Kontent */}
      <div className="flex-1 min-w-0">
        {isGroup ? (
          <>
            <div className="flex items-center gap-1.5 mb-0.5">
              <Users size={11} className="text-indigo-500 flex-shrink-0" />
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                Group Session
              </span>
              {isLive && (
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-full">
                  LIVE
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{item.title}</p>
            <p className="text-xs text-slate-400 mt-0.5">#{item.skill} · {item.host}</p>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                1-to-1 Session
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
              {item.with} bilan
            </p>
            {item.skill && (
              <p className="text-xs text-slate-400 mt-0.5">#{item.skill}</p>
            )}
          </>
        )}
      </div>

      {/* Action */}
      {item.meet_link ? (
        <a
          href={item.meet_link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          title="Sessiyaga qo'shilish"
        >
          <ExternalLink size={13} />
        </a>
      ) : (
        <Link
          to={isGroup ? '/group-sessions' : '/sessions'}
          className="flex-shrink-0 p-1.5 rounded-lg text-slate-300 dark:text-slate-600 hover:text-slate-500 transition-colors"
        >
          <ChevronRight size={13} />
        </Link>
      )}
    </div>
  )
}

export default function TodaySchedule({ greeting }) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    campusApi.today()
      .then(r => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 flex justify-center py-10">
        <Spinner size={20} />
      </div>
    )
  }

  const today    = data?.today || []
  const greet    = data?.greeting || greeting

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar size={15} className="text-indigo-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Bugungi jadval</h3>
        </div>
        <Link
          to="/sessions"
          className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline no-underline"
        >
          Barchasi →
        </Link>
      </div>

      {today.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-3xl mb-2">📭</p>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Bugun jadal bo'sh</p>
          <p className="text-xs text-slate-400 mt-1 mb-4">Session rejalashtirib, o'qishni boshlang!</p>
          <div className="flex gap-2 justify-center">
            <Link
              to="/sessions"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-colors no-underline"
            >
              Session yaratish
            </Link>
            <Link
              to="/group-sessions"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors no-underline"
            >
              Group session
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {today.map((item, i) => (
            <ScheduleItem key={i} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
