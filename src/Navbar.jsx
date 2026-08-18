import { useLayoutEffect, useRef, useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { gsap } from 'gsap'
import { IoChevronDownOutline } from 'react-icons/io5'
import logo from './assets/Logo.svg'
import arrowRight from './assets/arrow-right.svg'
import { cubicEase } from './easings'
import { HERO_INTRO, offscreenAbove } from './motion'
import { PROJECTS_DATA } from './projects'
import { useProjects, useContent } from './api'
import { useScale, useIsDesktop, useIsTabletPortrait, useHasHover } from './useScale'
import BurgerIcon from './BurgerIcon'
import MobileMenu from './MobileMenu'

const NAVBAR_FALLBACK = {
  links: [
    { label: 'ABOUT', to: '/about' },
    { label: 'SUBSIDIARIES', to: '/subsidiaries' },
  ],
  projectsLabel: 'PROJECTS',
  contactLabel: 'CONTACT',
  dropdownHeading: ['Projects', 'Portfolio'],
}

function ProjectsDropdown({ open, onClose, projects, heading, onMouseEnter, onMouseLeave, hasHover }) {
  const panelRef = useRef(null)
  const [shouldRender, setShouldRender] = useState(open)
  const [hoveredItem, setHoveredItem] = useState(null)

  useEffect(() => {
    if (open) {
      setShouldRender(true)
      return
    }
    if (!panelRef.current) {
      setShouldRender(false)
      return
    }
    const tween = gsap.to(panelRef.current, {
      y: -20,
      opacity: 0,
      duration: 0.45,
      ease: cubicEase,
      onComplete: () => setShouldRender(false),
    })
    return () => tween.kill()
  }, [open])

  useLayoutEffect(() => {
    if (!shouldRender || !open || !panelRef.current) return
    const tween = gsap.fromTo(
      panelRef.current,
      { y: -20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.45, ease: cubicEase }
    )
    return () => tween.kill()
  }, [shouldRender, open])

  useEffect(() => {
    if (!open) return
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!shouldRender) return null

  return (
    <div
      ref={panelRef}
      className="pointer-events-auto fixed left-1/2 -translate-x-1/2 top-[86px] w-[932px] max-w-[calc(100vw-48px)] rounded-[4px] border border-[#FFFFFF0F] bg-navy px-[45px] py-[55px] text-mist"
      style={{ fontFamily: "'Season Sans-TRIAL', sans-serif" }}
      role="dialog"
      aria-label="Projects portfolio"
      onMouseEnter={hasHover ? onMouseEnter : undefined}
      onMouseLeave={hasHover ? onMouseLeave : undefined}
    >
      <div className="flex flex-col navdesk:flex-row gap-[58px]">
        <div className="flex shrink-0 flex-col">
          <h3
            className="m-0 text-[27px] leading-[100%] tracking-[-0.02em] text-mist"
            style={{ fontFamily: "'Season Mix VF', serif", fontWeight: 420 }}
          >
            {heading[0]}
            <br />
            {heading[1]}
          </h3>
          <Link
            to="/projects"
            onClick={() => onClose()}
            className="group mt-[18px] inline-flex w-fit shrink-0 self-start items-center gap-[8px] font-['Akkurat_Mono',monospace] text-[8px] font-medium uppercase tracking-normal leading-none text-mist no-underline"
            aria-label="See all projects"
          >
            <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-[0.25px] border-solid border-mist transition-colors duration-300 ease-out group-hover:bg-mist">
              <img
                src={arrowRight}
                alt=""
                className="h-[10px] w-[10px] transition-[filter] duration-300 ease-out group-hover:invert"
                aria-hidden="true"
              />
            </span>
            <span className="relative top-[0.5px]">Check all</span>
          </Link>
        </div>

        <div
          className="flex-1 grid grid-cols-1 navdesk:grid-cols-3 gap-[44px]"
          onMouseLeave={hasHover ? () => setHoveredItem(null) : undefined}
        >
          {projects.map((project, i) => (
            <Link
              key={`${project.slug}-${i}`}
              to={`/projects/${project.slug}`}
              onClick={() => onClose()}
              onMouseEnter={hasHover ? () => setHoveredItem(i) : undefined}
              className={`group flex flex-col text-inherit no-underline transition-opacity duration-200 ${
                hoveredItem !== null && hoveredItem !== i ? 'opacity-30' : ''
              }`}
            >
              <h4
                className="m-0 text-[16px] font-normal leading-[100%] tracking-[0] text-mist"
                style={{ fontFamily: "'Season Sans-TRIAL', sans-serif" }}
              >
                {project.title}
              </h4>
              <p className="mt-[15px] text-[10px] leading-[120%] tracking-[0] text-[#E2EAF280]">
                {project.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

function Navbar() {
  const navbarRef = useRef(null)
  // Locked to the same canvas as the page content so the header scales in step
  // with the rest of the site. The scale sits on the <header> (not the <nav>,
  // whose transform the entrance animation owns); it scales the pill and the
  // projects dropdown together so they stay aligned. scale is 1 on phones
  // (mobile untouched).
  const rawScale = useScale()
  const isDesktop = useIsDesktop()
  // Tablet portrait shows the desktop pill (the `navdesk:` variant) at its
  // authored size, so it must opt out of the mobile canvas zoom the rest of the
  // page runs at there — width/430 is ~1.9x, which would render a header twice
  // the size of the design. Scale 1 also means no transform on the <header>,
  // which is what keeps the fixed-position dropdown anchored to the viewport.
  const isTabletPortrait = useIsTabletPortrait()
  const scale = isTabletPortrait ? 1 : rawScale
  // Tablets get the desktop pill (navdesk starts at 481px) but have no hover, so
  // every hover handler below is attached only where a real pointer exists —
  // see useHasHover for why attaching them on touch breaks the first tap.
  const hasHover = useHasHover()
  const hoverProps = (onEnter, onLeave) =>
    hasHover ? { onMouseEnter: onEnter, onMouseLeave: onLeave } : null
  const scaleHeader = isDesktop && scale !== 1
  const [projectsOpen, setProjectsOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [hoveredLink, setHoveredLink] = useState(null)
  const projectsTriggerRef = useRef(null)
  const closeTimerRef = useRef(null)
  const { pathname } = useLocation()

  // Close the mobile menu on any navigation (link tap or browser back/forward).
  useEffect(() => setMenuOpen(false), [pathname])

  const openProjects = () => {
    clearTimeout(closeTimerRef.current)
    setProjectsOpen(true)
  }
  // Delay closing so the pointer can cross the gap between the navbar and the panel.
  const scheduleCloseProjects = () => {
    clearTimeout(closeTimerRef.current)
    closeTimerRef.current = setTimeout(() => setProjectsOpen(false), 180)
  }

  useEffect(() => () => clearTimeout(closeTimerRef.current), [])

  // An item stays full color while hovered (or while its dropdown is open); the rest mute.
  const isMuted = (key) =>
    hoveredLink ? hoveredLink !== key : projectsOpen && key !== 'projects'

  const allProjects = useProjects(PROJECTS_DATA)
  const nav = useContent('navbar', NAVBAR_FALLBACK)
  // The dropdown mirrors the home portfolio: the featured projects (fall back to
  // all so it's never empty).
  const featured = allProjects.filter((p) => p.featured)
  const dropdownProjects = (featured.length ? featured : allProjects)
    .slice(0, 6)
    .map((p) => ({
      slug: p.slug,
      title: p.title,
      description: p.short,
      coverImage: p.coverImage,
    }))

  // Pure slide, no fade: the bar starts fully above the top edge of the screen
  // and drops in. Runs the shared HERO_INTRO values so it travels in parallel
  // with the hero wordmark rising from the bottom edge.
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(navbarRef.current, { y: offscreenAbove(navbarRef.current) })
      gsap.to(navbarRef.current, { y: 0, ...HERO_INTRO })
    })
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    if (!projectsOpen) return
    const handleClick = (e) => {
      const trigger = projectsTriggerRef.current
      if (trigger && trigger.contains(e.target)) return
      const panel = document.querySelector('[role="dialog"][aria-label="Projects portfolio"]')
      if (panel && panel.contains(e.target)) return
      setProjectsOpen(false)
    }
    // pointerdown, not mousedown: on touch the mouse events are synthesised and
    // WebKit can withhold them, which would leave the panel open with no way to
    // dismiss it by tapping the page.
    document.addEventListener('pointerdown', handleClick)
    return () => document.removeEventListener('pointerdown', handleClick)
  }, [projectsOpen])

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex flex-col items-center px-4 pt-4 navdesk:px-8 navdesk:pt-5 pointer-events-none"
      // Only the desktop layout scales the header itself. At scale 1 (phones and
      // tablet portrait) a `transform` here would still establish a containing
      // block for fixed-position descendants, trapping the full-screen
      // MobileMenu inside the header box.
      style={scaleHeader ? { transform: `scale(${scale})`, transformOrigin: 'top center' } : { transformOrigin: 'top center' }}
      aria-label="Site header"
    >
      <nav
        ref={navbarRef}
        className="pointer-events-auto relative z-50 flex h-[55px] w-full justify-between items-center gap-[5px] rounded-[4px] border border-[#FFFFFF1A] navdesk:border-[#FFFFFF0D] bg-navy p-2 navdesk:min-w-[420px] navdesk:w-max"
        aria-label="Main navigation"
      >
        <Link to="/" className="flex h-9 items-center justify-between p-2 no-underline">
          <img src={logo} alt="Alcove" className="h-[13px] w-auto" />
        </Link>

        <ul className="hidden list-none items-center gap-[5px] p-0 m-0 navdesk:flex">
          {nav.links.map((link) => (
            <li
              key={link.to}
              {...hoverProps(
                () => setHoveredLink(link.to),
                () => setHoveredLink(null)
              )}
            >
              <Link
                to={link.to}
                className={`inline-flex h-[39px] items-center whitespace-nowrap rounded-[3px] px-3 font-['Akkurat_Mono',monospace] text-[10px] font-medium uppercase leading-none text-[#d5dee9] no-underline transition-opacity duration-200 ${
                  isMuted(link.to) ? 'opacity-30' : ''
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li
            ref={projectsTriggerRef}
            {...hoverProps(
              () => {
                setHoveredLink('projects')
                openProjects()
              },
              () => {
                setHoveredLink(null)
                scheduleCloseProjects()
              }
            )}
          >
            <button
              type="button"
              onClick={() => setProjectsOpen((v) => !v)}
              className={`inline-flex h-[39px] items-center gap-[5px] whitespace-nowrap rounded-[3px] px-3 font-['Akkurat_Mono',monospace] text-[10px] font-medium uppercase leading-none text-[#d5dee9] no-underline bg-transparent border-0 cursor-pointer transition-opacity duration-200 ${
                isMuted('projects') ? 'opacity-30' : ''
              }`}
              aria-expanded={projectsOpen}
              aria-haspopup="dialog"
            >
              {nav.projectsLabel}{' '}
              <IoChevronDownOutline
                className={`translate-y-[-1px] text-[0.9em] leading-none transition-transform duration-200 ${
                  projectsOpen ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </button>
          </li>
        </ul>

        <Link
          to="/contact"
          {...hoverProps(
            () => setHoveredLink('contact'),
            () => setHoveredLink(null)
          )}
          className="hidden navdesk:inline-flex h-9 items-center whitespace-nowrap rounded-[22px] border border-transparent bg-mist px-[10px] font-['Akkurat_Mono',monospace] text-[10px] font-medium uppercase leading-none tracking-[0] text-[#191f2f] no-underline gap-[10px] transition-colors duration-300 ease-out hover:bg-transparent hover:border-mist hover:text-mist"
        >
          <p className="m-0 font-['Akkurat_Mono',monospace] relative top-[1px]">{nav.contactLabel}</p>
        </Link>

        {/* Phone-only burger (tablet portrait gets the pill); morphs to an X
            while the overlay is open. */}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-[3px] border-0 bg-transparent p-0 cursor-pointer navdesk:hidden"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          <BurgerIcon open={menuOpen} />
        </button>
      </nav>

      <ProjectsDropdown
        open={projectsOpen}
        onClose={() => setProjectsOpen(false)}
        projects={dropdownProjects}
        heading={nav.dropdownHeading}
        hasHover={hasHover}
        onMouseEnter={openProjects}
        onMouseLeave={scheduleCloseProjects}
      />

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        links={nav.links}
        projects={dropdownProjects}
        projectsLabel={nav.projectsLabel}
        contactLabel={nav.contactLabel}
      />
    </header>
  )
}

export default Navbar
