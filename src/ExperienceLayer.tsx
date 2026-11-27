import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Lightweight shared interaction layer for the PMP editorial experience.
 * Uses native browser primitives so the publication stays fast on mobile networks.
 */
export function ExperienceLayer() {
  const { pathname } = useLocation()
  useEffect(() => {
    const root = document.documentElement
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    root.dataset.motion = reduced ? 'reduced' : 'ready'

    const progress = document.querySelector<HTMLElement>('.pmp-scroll-progress')
    const cursor = document.querySelector<HTMLElement>('.pmp-cursor')
    const cursorLabel = cursor?.querySelector<HTMLElement>('[data-cursor-label]')
    const desktopPointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    let lastY = window.scrollY
    let ticking = false

    const updateScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      if (progress) progress.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`
      const y = window.scrollY
      if (Math.abs(y - lastY) > 5) {
        document.body.classList.toggle('pmp-scrolling-down', y > lastY && y > 110)
        document.body.classList.toggle('pmp-scrolling-up', y < lastY || y <= 110)
        lastY = y
      }
      ticking = false
    }
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScroll)
        ticking = true
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    updateScroll()

    let observer: IntersectionObserver | undefined
    if (!reduced && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed')
            observer?.unobserve(entry.target)
          }
        })
      }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' })
      document.querySelectorAll<HTMLElement>('.opening-note,.portrait-tile,.journal-top,.cover-feature,.journal-card,.world-card,.manifesto-long,.invitation-cinema,.contact-hero,.contact-aside,.contact-form-panel,.article-heading,.article-cover,.article-body,.related-stories').forEach((node) => {
        node.classList.add('pmp-reveal')
        observer?.observe(node)
      })
    }

    let pointerFrame = 0
    const onPointerMove = (event: PointerEvent) => {
      if (!cursor || !desktopPointer) return
      if (pointerFrame) cancelAnimationFrame(pointerFrame)
      pointerFrame = requestAnimationFrame(() => {
        cursor.style.setProperty('--cursor-x', `${event.clientX}px`)
        cursor.style.setProperty('--cursor-y', `${event.clientY}px`)
      })
    }
    const onPointerOver = (event: PointerEvent) => {
      const target = (event.target as HTMLElement | null)?.closest('a,button,[role="button"],input,textarea,select')
      cursor?.classList.toggle('is-active', Boolean(target))
      if (cursorLabel) cursorLabel.textContent = target?.getAttribute('data-cursor') || (target?.tagName === 'A' ? 'OPEN' : 'SELECT')
    }
    if (desktopPointer && !reduced) {
      window.addEventListener('pointermove', onPointerMove, { passive: true })
      document.addEventListener('pointerover', onPointerOver, { passive: true })
    }

    // A short, once-per-tab wordmark reveal. Content remains usable underneath it.
    let introTimer = 0
    try {
      if (!reduced && !sessionStorage.getItem('pmp-intro-seen')) {
        root.classList.add('pmp-intro-playing')
        sessionStorage.setItem('pmp-intro-seen', '1')
        introTimer = window.setTimeout(() => root.classList.remove('pmp-intro-playing'), 1350)
      }
    } catch {
      // Private browsing may disable session storage; skip the intro safely.
    }

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('pointerover', onPointerOver)
      if (observer) observer.disconnect()
      if (pointerFrame) cancelAnimationFrame(pointerFrame)
      if (introTimer) window.clearTimeout(introTimer)
      root.classList.remove('pmp-intro-playing')
    }
  }, [pathname])

  return <>
    <div className="pmp-scroll-progress" aria-hidden="true" />
    <div className="pmp-cursor" aria-hidden="true"><span data-cursor-label>VIEW</span></div>
    <div className="pmp-intro" aria-hidden="true"><span className="pmp-intro-mark">P.</span><span>PHOTOGRAPHING<br />MONUMENTAL PEOPLE</span></div>
    {pathname === '/' && <nav className="pmp-section-index" aria-label="Page sections">
      <a href="#perspective" aria-label="Editorial premise">01</a>
      <a href="#journal" aria-label="Journal">02</a>
      <a href="#archive" aria-label="Archive">03</a>
      <a href="#about-pmp" aria-label="Editorial position">04</a>
      <a href="#submit" aria-label="Nominate a person">05</a>
    </nav>}
  </>
}
