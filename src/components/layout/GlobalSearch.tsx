import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Search, X, User,
  LayoutDashboard, PlusCircle, ClipboardList,
  Users, Settings, ShieldCheck, Flame, Dumbbell,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { hasCargoPermission } from '../../lib/permissions'
import { Chamado, Cargo } from '../../types'

const NAV_ITEMS: { label: string; to: string; icon: React.ReactNode; minCargo?: Cargo }[] = [
  { label: 'Novo Atendimento', to: '/chamados/novo', icon: <PlusCircle size={15} /> },
  { label: 'Ginástica Laboral', to: '/ginastica-laboral', icon: <Dumbbell size={15} /> },
  { label: 'Relatórios', to: '/chamados/historico', icon: <ClipboardList size={15} />, minCargo: 'Coordenador' },
  { label: 'Dashboard', to: '/dashboard', icon: <LayoutDashboard size={15} /> },
  { label: 'Usuários', to: '/usuarios', icon: <Users size={15} />, minCargo: 'Coordenador' },
  { label: 'Controle de Extintores', to: '/extintores', icon: <Flame size={15} /> },
  { label: 'Configurações', to: '/configuracoes', icon: <Settings size={15} /> },
  { label: 'Minha Privacidade', to: '/privacidade', icon: <ShieldCheck size={15} /> },
]

export function GlobalSearch() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [patients, setPatients] = useState<Chamado[]>([])
  const [loadingPatients, setLoadingPatients] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const canSeeFullHistory = hasCargoPermission(profile?.cargo, 'Supervisor')

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const searchPatients = useCallback(async (q: string) => {
    if (!profile || q.length < 2) { setPatients([]); return }
    setLoadingPatients(true)
    const { data } = await supabase
      .from('chamados_brigada')
      .select('id, colaborador_atendido, situacao, created_at')
      .ilike('colaborador_atendido', `%${q}%`)
      .order('created_at', { ascending: false })
      .limit(5)
    setPatients((data as Chamado[]) || [])
    setLoadingPatients(false)
  }, [profile])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.length >= 2) debounceRef.current = setTimeout(() => searchPatients(query), 300)
    else setPatients([])
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, searchPatients])

  const filteredNav = NAV_ITEMS.filter(item => {
    if (!query) return false
    if (item.minCargo && !hasCargoPermission(profile?.cargo, item.minCargo)) return false
    return item.label.toLowerCase().includes(query.toLowerCase())
  })

  const hasResults = filteredNav.length > 0 || patients.length > 0

  const go = (to: string) => { navigate(to); setQuery(''); setOpen(false) }
  const goPatient = (name: string) => {
    const dest = canSeeFullHistory ? '/chamados/historico' : '/relatorio-gerencial'
    navigate(dest, { state: { searchTerm: name } })
    setQuery(''); setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
          <Search size={14} />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar ferramenta ou paciente..."
          className="w-full bg-brand-gray-800 border border-brand-gray-600 rounded-xl text-sm text-white placeholder-gray-600 pl-9 pr-16 py-2 h-9 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red/50 transition-all duration-200"
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {query ? (
            <button onClick={() => { setQuery(''); setPatients([]) }} className="text-gray-500 hover:text-white transition-colors">
              <X size={13} />
            </button>
          ) : (
            <kbd className="text-[10px] text-gray-600 bg-brand-gray-700 border border-brand-gray-600 rounded px-1 py-0.5 font-mono">
              Ctrl K
            </kbd>
          )}
        </div>
      </div>

      {open && query.length >= 1 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-brand-gray-800 border border-brand-gray-600 rounded-xl shadow-card overflow-hidden z-50 animate-fade-in">
          {!hasResults && !loadingPatients && (
            <p className="px-4 py-4 text-center text-sm text-gray-500">Nenhum resultado para "{query}"</p>
          )}
          {filteredNav.length > 0 && (
            <div>
              <p className="px-3 pt-2.5 pb-1 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Ferramentas</p>
              {filteredNav.map(item => (
                <button key={item.to} onClick={() => go(item.to)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-all text-left">
                  <span className="text-brand-red shrink-0">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          )}
          {patients.length > 0 && (
            <div className={filteredNav.length > 0 ? 'border-t border-brand-gray-700' : ''}>
              <p className="px-3 pt-2.5 pb-1 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Pacientes</p>
              {patients.map(p => (
                <button key={p.id} onClick={() => goPatient(p.colaborador_atendido)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-all text-left">
                  <span className="w-5 h-5 rounded-full bg-brand-gray-700 flex items-center justify-center shrink-0">
                    <User size={10} className="text-gray-400" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-white text-xs">{p.colaborador_atendido}</p>
                  </div>
                  <span className="text-[10px] text-brand-red shrink-0">Ver →</span>
                </button>
              ))}
            </div>
          )}
          {loadingPatients && <div className="px-4 py-3 text-sm text-gray-500">Buscando...</div>}
        </div>
      )}
    </div>
  )
}
