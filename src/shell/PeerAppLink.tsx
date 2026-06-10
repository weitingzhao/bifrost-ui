import type { PeerAppLink } from './types'

export function PeerAppLinkCard({ peer }: { peer: PeerAppLink }) {
  return (
    <a
      href={peer.href}
      target="_blank"
      rel="noopener noreferrer"
      className="shell-peer-link"
    >
      <span className="shell-peer-link-title">{peer.label}</span>
      {peer.description != null && peer.description !== '' && (
        <span className="shell-peer-link-desc">{peer.description}</span>
      )}
    </a>
  )
}
