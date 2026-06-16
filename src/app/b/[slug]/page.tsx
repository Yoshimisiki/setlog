import SetlistEditor from '@/components/SetlistEditor'

function slugToBandName(slug: string): string {
  return decodeURIComponent(slug)
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

interface Props {
  params: Promise<{ slug: string }>
}

export default async function BandPage({ params }: Props) {
  const { slug } = await params
  const bandName = slugToBandName(slug)

  return <SetlistEditor initialBandName={bandName} />
}
