import { getRequestConfig } from 'next-intl/server'
import { headers } from 'next/headers'

export default getRequestConfig(async () => {
  const headersList = await headers()
  const acceptLanguage = headersList.get('accept-language') ?? 'en'
  const locale = acceptLanguage.toLowerCase().includes('ja') ? 'ja' : 'en'
  const messages = (await import(`../../messages/${locale}.json`)).default
  return { locale, messages }
})
