import { useDashboardStore } from '../store/useDashboardStore'
import { SessionSetup } from '../components/SessionSetup'
import { MarksEntryTable } from '../components/MarksEntryTable'

export function Dashboard() {
    const { sessionData } = useDashboardStore()

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-primary">Notify ED Dashboard</h1>
                <p className="text-muted-foreground mt-2 text-lg">
                    {!sessionData
                        ? "Upload new semester lists and launch a new mark entry session."
                        : "Enter student marks and instantly notify them upon completion."}
                </p>
            </div>

            {!sessionData ? (
                <SessionSetup />
            ) : (
                <MarksEntryTable />
            )}
        </div>
    )
}
