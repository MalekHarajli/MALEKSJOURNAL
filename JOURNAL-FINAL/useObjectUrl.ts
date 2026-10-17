import { useEffect, useState } from 'react'
import { fetchShot } from './cloud'

export function useObjectUrl(blob: Blob | undefined): string | undefined {
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    if (!blob) {
      setUrl(undefined)
      return
    }
    const u = URL.createObjectURL(blob)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [blob])
  return url
}

/**
 * Screenshot source for a slot holding either a File the user just picked or
 * a storage path already saved to the account.
 */
export function useShotUrl(value: File | string | undefined): string | undefined {
  const [url, setUrl] = useState<string>()

  useEffect(() => {
    let cancelled = false
    let objectUrl: string | undefined

    if (!value) {
      setUrl(undefined)
      return
    }

    if (typeof value !== 'string') {
      objectUrl = URL.createObjectURL(value)
      setUrl(objectUrl)
      return () => {
        if (objectUrl) URL.revokeObjectURL(objectUrl)
      }
    }

    setUrl(undefined)
    void fetchShot(value).then((blob) => {
      if (cancelled || !blob) return
      objectUrl = URL.createObjectURL(blob)
      setUrl(objectUrl)
    })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [value])

  return url
}
