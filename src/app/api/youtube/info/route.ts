import { NextRequest, NextResponse } from 'next/server'
import ytdl from '@distube/ytdl-core'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 })

  if (!ytdl.validateURL(url)) {
    return NextResponse.json({ error: 'invalid youtube url' }, { status: 400 })
  }

  try {
    const info = await ytdl.getBasicInfo(url)
    const details = info.videoDetails
    return NextResponse.json({
      title: details.title,
      duration_seconds: parseInt(details.lengthSeconds, 10),
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
