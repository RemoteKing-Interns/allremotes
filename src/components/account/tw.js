export const tw = {
  page: "py-6 md:py-10",
  header:
    "mb-6 grid justify-items-center border-y border-neutral-200/80 bg-transparent py-14 md:py-20",
  headerCopy: "w-full max-w-4xl text-center",
  headerTitle:
    "m-0 text-[clamp(2.2rem,5.2vw,4.6rem)] font-extrabold leading-[1.04] tracking-[-0.03em] text-neutral-900",
  headerSubtitle:
    "mx-auto mt-4 max-w-2xl text-[clamp(1rem,1.6vw,1.25rem)] leading-relaxed text-neutral-600",
  content:
    "grid items-start gap-4 xl:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]",
  sidebar: "grid gap-4 xl:sticky xl:top-[6.2rem]",
  profileSummary:
    "flex items-center gap-3 rounded-2xl border border-neutral-200/80 bg-white/95 p-4 shadow-sm max-sm:flex-col max-sm:items-start",
  profileAvatar:
    "flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100",
  profileAvatarImg: "h-full w-full object-cover",
  profileAvatarFallback:
    "flex h-full w-full items-center justify-center bg-gradient-to-br from-accent/20 to-accent-light/35 text-lg font-extrabold text-neutral-700",
  profileText: "min-w-0",
  profileName: "truncate text-base font-bold text-neutral-900",
  profileEmail: "truncate text-xs text-neutral-600",
  nav:
    "grid gap-2 rounded-2xl border border-neutral-200/80 bg-white/95 p-2 shadow-sm max-xl:grid-cols-2 max-sm:grid-cols-1",
  navItem:
    "flex w-full items-center gap-2 rounded-xl border border-transparent px-3 py-2.5 text-left text-sm font-semibold text-neutral-700 transition hover:border-neutral-200 hover:bg-neutral-100",
  navItemActive:
    "border-primary/20 bg-primary/10 text-primary-dark shadow-sm",
  navIcon:
    "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-white text-[11px] font-bold",
  navIconActive: "border-primary/20 text-primary-dark",
  navLabel: "text-sm font-semibold",
  main: "min-w-0",

  section:
    "overflow-hidden rounded-2xl border border-neutral-200/80 bg-white/95 shadow-sm",
  sectionTitle:
    "border-b border-neutral-200 px-5 py-4 text-xl font-extrabold tracking-tight text-neutral-900 max-sm:px-4 max-sm:py-4 max-sm:text-[1.15rem]",
  sectionContent: "grid gap-5 p-5 max-sm:gap-4 max-sm:p-4",
  sectionHeader: "flex flex-wrap items-center justify-between gap-3",
  sectionH3:
    "relative m-0 pl-3 text-lg font-extrabold tracking-tight text-neutral-900 before:absolute before:bottom-[0.18rem] before:left-0 before:top-[0.18rem] before:w-1 before:rounded-full before:bg-gradient-to-b before:from-primary before:to-primary-light",
  divider: "h-px w-full bg-neutral-200",

  form: "grid gap-3",
  formSpaced: "grid gap-4",
  formRow2: "grid gap-3 md:grid-cols-2",
  formRow3: "grid gap-3 md:grid-cols-3",
  formRowSearch: "grid gap-3 items-end md:grid-cols-[minmax(0,1fr)_auto]",
  formGroup: "grid gap-2",
  label:
    "text-[0.78rem] font-bold uppercase tracking-[0.06em] text-neutral-700",
  input:
    "h-11 w-full rounded-xl border border-neutral-300 bg-white px-3.5 text-[0.97rem] text-neutral-900 placeholder:text-neutral-500 shadow-sm transition-colors transition-shadow hover:border-neutral-400 focus:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-1 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500",
  textarea:
    "min-h-28 w-full resize-y rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-[0.97rem] text-neutral-900 placeholder:text-neutral-500 shadow-sm transition-colors transition-shadow hover:border-neutral-400 focus:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-1 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500",
  checkboxLabel: "inline-flex items-center gap-2 text-sm font-semibold text-neutral-700",
  fileInput: "sr-only",

  success:
    "rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 text-sm font-semibold text-accent-dark",
  error:
    "rounded-xl border border-primary/35 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary-dark",
  emptyState:
    "grid gap-3 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-600",

  gridList: "grid gap-3",
  card: "rounded-xl border border-neutral-200 bg-white p-4 shadow-sm",
  cardHeader: "flex flex-wrap items-center justify-between gap-3",
  muted: "text-xs text-neutral-500",
  strongText: "text-sm font-semibold text-neutral-900",

  badgeDefault:
    "inline-flex rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.07em] text-accent-dark",
  badgeStatus:
    "inline-flex rounded-full border border-neutral-300 bg-neutral-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.07em] text-neutral-700",
  badgePending: "border-amber-300 bg-amber-100 text-amber-900",
  badgeProcessing: "border-sky-300 bg-sky-100 text-sky-900",
  badgeShipped: "border-violet-300 bg-violet-100 text-violet-900",
  badgeDelivered: "border-emerald-300 bg-emerald-100 text-emerald-900",
  badgeCancelled: "border-primary/35 bg-primary/10 text-primary-dark",

  toggleWrap: "relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center",
  toggleInput: "peer sr-only",
  toggleTrack:
    "absolute inset-0 rounded-full border border-neutral-300 bg-neutral-200 transition-all duration-200 peer-checked:border-accent/45 peer-checked:bg-accent",
  toggleThumb:
    "absolute left-1 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-white shadow-[0_1px_3px_rgba(8,22,25,0.25)] transition-transform duration-200 peer-checked:translate-x-6",
};

export const btn = {
  gradient:
    "inline-flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-light px-6 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/20 disabled:pointer-events-none disabled:opacity-50",
  gradientSm:
    "inline-flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-light px-4 py-2 text-xs font-semibold text-white shadow-soft transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/20 disabled:pointer-events-none disabled:opacity-50",
  secondary:
    "inline-flex items-center justify-center rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-accent-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/20 disabled:pointer-events-none disabled:opacity-50",
  secondarySm:
    "inline-flex items-center justify-center rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-accent-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/20 disabled:pointer-events-none disabled:opacity-50",
  outline:
    "inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-6 py-2.5 text-sm font-semibold text-neutral-800 transition hover:border-accent/30 hover:bg-accent/5 hover:text-accent-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/20 disabled:pointer-events-none disabled:opacity-50",
  outlineSm:
    "inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-800 transition hover:border-accent/30 hover:bg-accent/5 hover:text-accent-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/20 disabled:pointer-events-none disabled:opacity-50",
  outlineDangerSm:
    "inline-flex items-center justify-center rounded-full border border-primary/35 bg-white px-4 py-2 text-xs font-semibold text-primary-dark transition hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/20 disabled:pointer-events-none disabled:opacity-50",
};
