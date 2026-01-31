import { LabasiAssistant } from "@/components/labasi/labasi-assistant"

export default function Home() {
  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID

  if (!agentId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Configuration Error
          </h1>
          <p className="text-muted-foreground">
            Missing NEXT_PUBLIC_ELEVENLABS_AGENT_ID environment variable
          </p>
        </div>
      </div>
    )
  }

  return <LabasiAssistant agentId={agentId} />
}
