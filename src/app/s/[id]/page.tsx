import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import SetlistView from '@/components/SetlistView'
import type { Setlist } from '@/types'

export const revalidate = 3600

export default async function SharedSetlistPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase
    .from('shared_setlists')
    .select('data')
    .eq('id', id)
    .single()

  if (error || !data) {
    notFound()
  }

  return <SetlistView setlist={data.data as Setlist} />
}
