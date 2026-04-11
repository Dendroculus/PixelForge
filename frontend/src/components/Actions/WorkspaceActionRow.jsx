/**
 * Renders a reusable action button row for primary/secondary workspace actions.
 * @param {{
 *   primaryLabel: string,
 *   secondaryLabel?: string,
 *   onPrimaryClick: () => void,
 *   onSecondaryClick?: () => void,
 *   primaryDisabled?: boolean,
 *   secondaryDisabled?: boolean,
 *   primaryType?: 'button' | 'submit' | 'reset',
 *   secondaryType?: 'button' | 'submit' | 'reset',
 *   className?: string
 * }} props
 * @returns {JSX.Element}
 */
export default function WorkspaceActionRow({
  primaryLabel,
  secondaryLabel,
  onPrimaryClick,
  onSecondaryClick,
  primaryDisabled = false,
  secondaryDisabled = false,
  primaryType = 'button',
  secondaryType = 'button',
  className = 'flex gap-3',
}) {
  return (
    <div className={className}>
      <button
        type={primaryType}
        onClick={onPrimaryClick}
        disabled={primaryDisabled}
        className="inline-flex flex-1 items-center justify-center rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none"
      >
        {primaryLabel}
      </button>

      {secondaryLabel && onSecondaryClick ? (
        <button
          type={secondaryType}
          onClick={onSecondaryClick}
          disabled={secondaryDisabled}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200/60 bg-white/50 px-5 py-3.5 text-sm font-bold text-slate-600 shadow-sm transition-all hover:bg-white hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {secondaryLabel}
        </button>
      ) : null}
    </div>
  );
}