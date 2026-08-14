'use client'

import { useEffect, useState } from 'react'

const SESSION_STORAGE_KEY = 'sg_splash_seen'

export default function SplashScreen({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const alreadySeen = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (alreadySeen) return

    setVisible(true)
    setMounted(true)

    const timer = setTimeout(() => {
      setVisible(false)
      sessionStorage.setItem(SESSION_STORAGE_KEY, '1')
    }, 1800)

    return () => clearTimeout(timer)
  }, [])

  if (!mounted) return <>{children}</>

  return (
    <>
      {visible && (
        <div
          role="status"
          aria-label="Loading Soroban Guard"
          className="splash-overlay"
        >
          <div className="splash-content">
            <div className="splash-logo">
              <div className="splash-logo-icon">
                <svg
                  className="splash-shield"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <span className="splash-wordmark">Soroban Guard</span>
            </div>
            <div className="splash-progress">
              <div className="splash-progress-bar" />
            </div>
          </div>
        </div>
      )}
      <div
        className={visible ? 'splash-content-hidden' : 'splash-content-visible'}
      >
        {children}
      </div>
    </>
  )
}
