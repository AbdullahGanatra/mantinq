import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(date: string | Date) {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    ACTIVE: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    INACTIVE: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    PENDING: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    SUSPENDED: 'bg-red-500/10 text-red-500 border-red-500/20',
    OPERATIONAL: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    UNDER_MAINTENANCE: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    OUT_OF_ORDER: 'bg-red-500/10 text-red-500 border-red-500/20',
    DECOMMISSIONED: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    RESERVED: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    OPEN: 'bg-red-500/10 text-red-500 border-red-500/20',
    IN_PROGRESS: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    RESOLVED: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    CLOSED: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    REOPENED: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    PENDING: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    ASSIGNED: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    COMPLETED: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    CANCELLED: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    ON_HOLD: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    LOW: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    MEDIUM: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    HIGH: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    CRITICAL: 'bg-red-500/10 text-red-500 border-red-500/20',
  }
  return colors[status] || 'bg-slate-500/10 text-slate-500 border-slate-500/20'
}

export function getPriorityIcon(priority: string) {
  const icons: Record<string, string> = {
    LOW: '↓',
    MEDIUM: '→',
    HIGH: '↑',
    CRITICAL: '⚠',
  }
  return icons[priority] || '•'
}

export function getInitials(firstName: string, lastName: string) {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()
}
