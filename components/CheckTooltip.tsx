import { checkDescriptions } from '@/lib/checkDescriptions'

interface Props {
  checkName: string
}

export default function CheckTooltip({ checkName }: Props) {
  const description = checkDescriptions[checkName]

  return (
    <span
      className="font-mono text-xs text-indigo-400 sm:text-sm"
      title={description}
      aria-describedby={description ? `check-${checkName}` : undefined}
    >
      {checkName}
    </span>
  )
}
