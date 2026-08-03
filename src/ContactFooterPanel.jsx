import { Link } from 'react-router-dom'
import ArrowIcon from './ArrowIcon'
import logo from './assets/Logo.svg'

// Presentational navy footer panel, shared between the standalone
// ContactSection (used on interior pages, with a scroll-in reveal wired via
// the optional refs) and the home page's MissionVisionValues stack (rendered
// static as a rising cover layer, so the refs are omitted).
//
// The mobile ALCOVE wordmark is shared with the hero (HeroSustainable), which
// authors its mobile canvas at a 430px reference and scales it by width/430.
// The footer has no such wrapper, so it reproduces the same result directly:
// 75px tall at 430px+ and 75 × width/430 below it (22.4419vw), height-driven
// with the mask contained and centred — which also fixes the ink width, so both
// wordmarks land at the same size and the same centre line. The matching
// min(40px, 9.3023vw) bottom gap is on mainClass, home only (see mobilePad).
//
// The height cap is the one part that differs by placement: the home cover has
// the full 553px strip to spend, so it takes the hero-matching 165px, while the
// interior footer is a fit-content block in normal flow and caps at 105px. Both
// keep the same 29.4419vw slope, so below ~357px wide they render identically.
const MOBILE_ALCOVE_BASE = 'max-md:aspect-auto'
const MOBILE_ALCOVE_HOME = 'max-md:[height:min(165px,29.4419vw)]'
const MOBILE_ALCOVE_PAGE = 'max-md:[height:min(105px,29.4419vw)]'

// fitMobile: on interior pages the footer is a normal-flow section, so below
// the md breakpoint it collapses to a fit-content block (natural padding, a
// fixed gap above ALCOVE) instead of the full 100vh desktop canvas. The home
// cover leaves it off — there the panel must fill the rising full-screen layer,
// so it keeps h-full + the mt-auto bottom-pin at every width.
//
// fillMobile: on the home page the footer rides up over the Values card as the
// last layer of the MissionVisionValues cover, inside a strip fixed to the
// mobile spec's 553px. The panel has to fill that strip exactly — at h-auto it
// would come up short and leave the card showing through below it. The block
// keeps its 111px top inset and the wordmark stays bottom-pinned; the gap
// between them takes the difference.
function ContactFooterPanel({
  cta,
  titleRef,
  descRef,
  buttonRef,
  alcoveRef,
  rootRef,
  fitMobile = false,
  fillMobile = false,
  scale = 1,
  centerDesktop = false,
}) {
  // On wide desktops the parent ScaleLock zooms the whole panel up to MAX_SCALE,
  // which would drag the "Let's talk" block down and enlarge it. Counter-scale
  // the block by 1/scale (and shrink the top padding by the same factor) so it
  // stays locked to its 1440px position and size regardless of screen width.
  // Only engages above the 1440 reference (scale > 1); normal desktops are untouched.
  const lockScale = scale > 1
  const contentStyle = lockScale
    ? {
        transform: `scale(${1 / scale})`,
        // Interior section centres the block between the container top and the
        // logo, so shrink about its own centre — otherwise the top-origin
        // counter-scale leaves phantom space below the visual box and the gap
        // reads larger than the space above. The home cover keeps top-center,
        // which locks the block to its fixed 1440 position.
        transformOrigin: centerDesktop ? 'center' : 'top center',
      }
    : undefined
  // `centerDesktop` is the standalone interior /contact section (see
  // ContactSection). There the desktop (md+) vertical rhythm is a single rule:
  // the "Let's talk" block is centred vertically between the container top and
  // the ALCOVE logo (both spacers grow equally), never sitting closer than
  // 156px to the logo (the bottom spacer's min-height is the floor, which only
  // engages on short viewports). The desktop top padding is dropped (md:pt-0)
  // so the block centres from the true container top, and so wide-but-short
  // screens compress the top rather than pushing the gap + logo past the clip
  // edge. The home cover (MissionVisionValues) leaves centerDesktop off, so its
  // 13vh rhythm and the 150/scale lock padding are untouched.
  const mainStyle =
    !centerDesktop && lockScale ? { paddingTop: `${150 / scale}px` } : undefined
  // Mobile spec (≈402×553 fit-content frame): 16px text inset, 116px top pad,
  // 97.4px gap from the button down to the ALCOVE mask. The wordmark itself is
  // the shared mobile treatment described on MOBILE_ALCOVE_* above — on home,
  // same size, centring and bottom gap as the hero's (see HeroSustainable), so
  // the two wordmarks read as one element across the page.
  // Filling the mobile strip is purely a height change — the strip is authored
  // in real pixels, so every spec value below still applies unaltered.
  const mobileH = fillMobile ? 'h-full' : 'h-auto'
  // The home cover's 111px top inset is authored against its fixed 553px strip,
  // so it stays home-only. Interior pages are a fit-content block in normal flow
  // and get their own, smaller inset — but they still need one: at zero the
  // cap-trimmed "Let's talk" line box starts at the panel's top edge and the
  // section's overflow-hidden shaves the caps off. The bottom gap is shared (it
  // pairs the wordmark with the hero's, see MOBILE_ALCOVE_* above).
  const mobilePad = fillMobile
    ? 'pt-[111px] max-md:[padding-bottom:min(40px,9.3023vw)]'
    : 'max-md:pt-[72px] max-md:[padding-bottom:min(40px,9.3023vw)]'
  const mainClass = centerDesktop
    ? `relative ${mobileH} md:h-full max-w-[1440px] mx-auto flex flex-col bg-navy px-[16px] ${mobilePad} text-mist md:px-8 md:pb-[31px] md:pt-0`
    : fitMobile
      ? `relative ${mobileH} md:h-full max-w-[1440px] mx-auto flex flex-col bg-navy px-[16px] ${mobilePad} text-mist md:px-8 md:pb-[31px] md:pt-[150px]`
      : 'relative h-full max-w-[1440px] mx-auto flex flex-col bg-navy px-4 pb-[31px] pt-[150px] text-mist md:px-8'
  // Desktop rhythm for the interior section is driven by the two spacers below,
  // so the ALCOVE wrapper drops its own md gap (mt-0). On mobile the home cover
  // needs no margin — its flex-1 slack already stretches the gap to fill the
  // strip — but the interior block is fit-content, so the button would otherwise
  // sit flush against the wordmark; 60px is the home 97.4 scaled to the smaller
  // 105px wordmark.
  const alcoveWrapClass = centerDesktop
    ? `relative ${fillMobile ? '' : 'max-md:mt-[60px]'} md:mt-0`
    : fitMobile
      ? 'relative mt-[97.4px] md:mt-[13vh]'
      : 'relative mt-auto'
  // Bottom spacer (md+ only): grows equally with the top spacer to centre the
  // block, but never drops below 156px. The floor is ÷scale because the spacer
  // lives un-counter-scaled inside the ×scale wrapper, so 156/scale renders as
  // 156 visual px.
  const bottomSpacerStyle = { flex: '1 1 0%', minHeight: `${156 / scale}px` }
  return (
    <main ref={rootRef} className={mainClass} style={mainStyle}>
      {/* Top spacer: grows equally with the bottom spacer to centre the block
          between the container top and the logo. md+ only. */}
      {centerDesktop && <div aria-hidden className="hidden md:block md:flex-1" />}
      {/* An auto margin here would swallow the mobile slack before the spacer
          below it ever grows, so filling the strip drops it and lets the block
          sit at its 111px top inset. */}
      <div
        className={`${
          centerDesktop ? (fillMobile ? 'mt-0' : 'mt-auto md:mt-0') : 'mt-auto'
        } flex flex-col items-center text-center gap-[25px] md:gap-[37px]`}
        style={contentStyle}
      >
        <div className="overflow-hidden">
          <h2
            ref={titleRef}
            className="m-0 text-[34px] md:text-[47px] font-[420] leading-[100%] tracking-[-0.04em] text-mist"
            style={{
              fontFamily: "'Season Mix VF', serif",
              // Figma spec: leading-trim CAP_HEIGHT — without it the 47px
              // line box breaks the section's fixed vertical rhythm.
              textBox: 'trim-both cap alphabetic',
            }}
          >
            {cta.title}
          </h2>
        </div>

        <div className="overflow-hidden">
          <p
            ref={descRef}
            className="m-0 max-w-[356px] text-[13px] md:text-[16px] leading-[100%] text-mist tracking-[0.4px] md:tracking-normal"
          >
            {cta.description}
          </p>
        </div>

        <div className="overflow-hidden">
          <Link
            ref={buttonRef}
            to="/contact"
            className="group inline-flex h-[40px] md:h-[46px] items-center gap-[5px] rounded-[48px] border border-mist bg-mist px-[14px] font-['Akkurat_Mono',monospace] text-[9px] md:text-[10px] font-medium uppercase leading-none text-navy no-underline transition-colors duration-300 ease-out hover:bg-navy hover:text-mist mt-3 md:mt-0"
          >
            <span className="relative top-[1px]">{cta.buttonLabel}</span>
            <ArrowIcon
              size={14}
              className="transition-transform duration-300 ease-out group-hover:translate-x-[3px]"
            />
          </Link>
        </div>
      </div>

      {/* Bottom spacer (md+ only): the fixed / minimum 156px gap between the
          "Let's talk" block and the ALCOVE logo. */}
      {centerDesktop && (
        <div aria-hidden className="hidden md:block" style={bottomSpacerStyle} />
      )}

      {/* Mobile slack (fillMobile only): takes the difference between the 553px
          strip and the block's natural height, so the wordmark bottom-pins. It
          sits above the wrapper's own mt-[97.4px], so the gap stretches from
          that spec value rather than replacing it. */}
      {fillMobile && <div aria-hidden className="md:hidden flex-1" />}

      {/* mt-auto bottom-pins the logo; no fixed top gap, or on
          short/wide viewports the 161px gap would push the ALCOVE
          mask past the section's overflow-hidden edge and clip it. */}
      <div className={alcoveWrapClass}>
        <div
          ref={alcoveRef}
          className={`w-full aspect-[64/13] ${MOBILE_ALCOVE_BASE} ${
            fillMobile ? MOBILE_ALCOVE_HOME : MOBILE_ALCOVE_PAGE
          }`}
          style={{
            WebkitMaskImage: `url("${logo}")`,
            maskImage: `url("${logo}")`,
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
            backgroundColor: 'var(--color-gold)',
          }}
          role="img"
          aria-label="Alcove"
        />
      </div>
    </main>
  )
}

export default ContactFooterPanel