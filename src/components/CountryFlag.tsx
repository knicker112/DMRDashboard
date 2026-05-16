import Flags from 'country-flag-icons/react/3x2'
import type { CountryInfo } from '../utils/callsignCountry'

interface Props {
  country: CountryInfo
  className?: string
}

export function CountryFlag({ country, className = 'w-7 h-auto rounded-sm' }: Props) {
  const iso = country.iso.toUpperCase() as keyof typeof Flags
  const Flag = Flags[iso]
  if (!Flag) return null
  return <Flag className={className} title={country.name} />
}
