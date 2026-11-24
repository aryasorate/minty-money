import { Navigate, Route, Routes } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { Toaster } from '@/components/Toaster'
import { ProfilePicker } from '@/features/profiles/ProfilePicker'
import { Onboarding } from '@/features/onboarding/Onboarding'
import { AppShell } from './AppShell'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { JarsPage } from '@/features/jars/JarsPage'
import { SplitPage } from '@/features/split/SplitPage'
import { GoalsPage } from '@/features/goals/GoalsPage'
import { InsightsPage } from '@/features/insights/InsightsPage'
import { AlertsPage } from '@/features/alerts/AlertsPage'
import { LearnPage } from '@/features/learn/LearnPage'

export default function App() {
  const activeId = useStore((s) => s.activeId)
  const onboarded = useStore((s) => (s.activeId ? s.profiles[s.activeId]?.onboarded : false))

  return (
    <>
      {!activeId ? (
        <ProfilePicker />
      ) : !onboarded ? (
        <Onboarding />
      ) : (
        <AppShell>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/jars" element={<JarsPage />} />
            <Route path="/split" element={<SplitPage />} />
            <Route path="/goals" element={<GoalsPage />} />
            <Route path="/insights" element={<InsightsPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/learn" element={<LearnPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      )}
      <Toaster />
    </>
  )
}
