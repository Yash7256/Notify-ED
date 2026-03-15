import { useDashboardStore } from '../store/useDashboardStore'
import { SessionSetup } from '../components/SessionSetup'
import { MarksEntryTable } from '../components/MarksEntryTable'

export function Dashboard() {
    const { sessionData } = useDashboardStore()

    return !sessionData ? <SessionSetup /> : <MarksEntryTable />
}