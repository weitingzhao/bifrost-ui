import type { ReactNode } from 'react'
import type { ShellNavGroup, ShellNavItem } from './types'

function navItemClass(active?: boolean) {
  return active ? 'shell-nav-item shell-nav-item--active' : 'shell-nav-item'
}

function NavItemButton({ item }: { item: ShellNavItem }) {
  const className = navItemClass(item.active)
  const shortLabel = item.shortLabel ?? item.label.slice(0, 1).toUpperCase()

  const content = (
    <>
      <span className="shell-nav-item-text">{item.label}</span>
      <span className="shell-nav-item-short" aria-hidden="true">
        {shortLabel}
      </span>
    </>
  )

  if (item.onClick) {
    return (
      <button type="button" className={className} title={item.label} onClick={item.onClick}>
        {content}
      </button>
    )
  }

  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        title={item.label}
      >
        {content}
      </a>
    )
  }

  return (
    <a href={item.href} className={className} title={item.label}>
      {content}
    </a>
  )
}

export function ShellSidebar({
  productName,
  productTagline,
  productBadge,
  navGroups = [],
  footer,
}: {
  productName: string
  productTagline?: string
  productBadge?: string
  navGroups?: ShellNavGroup[]
  footer?: ReactNode
}) {
  const productShort = productName.slice(0, 1).toUpperCase()

  return (
    <aside className="shell-sidebar" aria-label="Application navigation">
      <div className="shell-sidebar-header">
        <div className="shell-sidebar-title-row">
          <span className="shell-sidebar-title">{productName}</span>
          <span className="shell-sidebar-title-short" aria-hidden="true">
            {productShort}
          </span>
          {productBadge != null && productBadge !== '' && (
            <span className="badge-ui shell-sidebar-badge">{productBadge}</span>
          )}
        </div>
        {productTagline != null && productTagline !== '' && (
          <p className="shell-sidebar-tagline">{productTagline}</p>
        )}
      </div>

      <nav className="shell-nav">
        {navGroups.map(group => (
          <div key={group.label} className="shell-nav-group">
            <p className="shell-nav-group-label">{group.label}</p>
            <ul className="shell-nav-list">
              {group.items.map(item => (
                <li key={item.id}>
                  <NavItemButton item={item} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {footer != null && <div className="shell-sidebar-footer">{footer}</div>}
    </aside>
  )
}
