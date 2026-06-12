import { NavLink } from 'react-router-dom'
import { ClipboardList, Database, GitCompare, MessageSquare, FileBarChart } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { label: '需求录入', icon: ClipboardList, to: '/demands' },
  { label: '产品库浏览', icon: Database, to: '/products' },
  { label: '匹配工作台', icon: GitCompare, to: '/matching' },
  { label: '沟通记录', icon: MessageSquare, to: '/communications' },
  { label: '撮合报告', icon: FileBarChart, to: '/report' },
]

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-60 flex-col bg-navy-950">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <span className="text-xl font-bold text-amber-500">数据撮合</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 pt-2">
        {navItems.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-150',
                isActive
                  ? 'border-l-[3px] border-amber-500 bg-navy-900/60 text-amber-500'
                  : 'border-l-[3px] border-transparent text-navy-400 hover:bg-navy-900/40 hover:text-navy-300'
              )
            }
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-navy-800 px-5 py-4">
        <span className="text-xs text-navy-600">数据交易顾问</span>
      </div>
    </aside>
  )
}
