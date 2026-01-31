import { TranscriptsView } from "@/components/labasi/transcripts-view"

interface TranscriptsPageProps {
  params: Promise<{ id: string }>
}

export default async function TranscriptsPage({ params }: TranscriptsPageProps) {
  const { id } = await params
  return <TranscriptsView projectId={id} />
}
