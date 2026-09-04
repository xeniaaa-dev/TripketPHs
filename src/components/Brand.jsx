import BrandMark from './BrandMark'
import { ROUTES } from '../data/content'

export default function Brand({ size = 26 }) {
  return (
    <a className="brand" href={ROUTES.home} aria-label="Tripket PH — home" translate="no">
      <BrandMark size={size} />
      <span className="brand-word">
        Tripket <span className="brand-word-accent">PH</span>
      </span>
    </a>
  )
}
