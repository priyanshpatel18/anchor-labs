import { Code } from 'lucide-react'

export default function ProgramNotFound() {
  return (
    <div className="w-full h-full flex items-center justify-center p-8">
      <div className="text-center">
        <Code className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
        <h2 className="text-2xl font-semibold mb-3">No Program Initialized</h2>
        <p className="text-muted-foreground">
          Please initialize a program to view the dashboard.
        </p>
      </div>
    </div>

  )
}
