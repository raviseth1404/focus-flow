import { AuthGuard } from '@/components/auth/AuthGuard'
import { AppShell } from '@/components/layout/AppShell'
import { SearchModal } from '@/components/search/SearchModal'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AppShell>
        {children}
        <SearchModal />
      </AppShell>
    </AuthGuard>
  )
}
