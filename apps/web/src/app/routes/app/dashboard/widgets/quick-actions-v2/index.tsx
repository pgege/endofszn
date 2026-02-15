import type { WidgetProps } from '../../types'
import { SmallVariant } from './variants/SmallVariant'
import { MediumVariant } from './variants/MediumVariant'

export function QuickActionsWidget({ size }: WidgetProps) {
  if (size === 'sm') return <SmallVariant />
  return <MediumVariant />
}
