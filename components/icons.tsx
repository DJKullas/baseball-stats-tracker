import type { SVGProps } from "react"
import { ArrowRight, BarChart, Bot, Check, Mail, Menu, Smartphone, BeerIcon as Baseball } from "lucide-react"

/**
 * Wrapper helpers so we can tree–shake unused icons if needed.
 * Feel free to replace these with custom SVGs later.
 */
export const BaseballIcon = Baseball
export const BarChartIcon = BarChart
export const BotIcon = Bot
export const CheckIcon = Check
export const SmartphoneIcon = Smartphone

/* ---------- Aggregated mapping ---------- */
export const Icons = {
  // Branding
  logo: BaseballIcon,
  // Generic UI
  menu: Menu,
  arrowRight: ArrowRight,
  mail: Mail,
  check: CheckIcon,
  // Themed / custom
  barChart: BarChartIcon,
  bot: BotIcon,
  smartphone: SmartphoneIcon,
}

export type IconName = keyof typeof Icons

/**
 * Convenience component: <AppIcon name="arrowRight" className="h-4 w-4" />
 */
export function AppIcon({ name, ...props }: { name: IconName } & SVGProps<SVGSVGElement>) {
  const Icon = Icons[name]
  return <Icon {...props} aria-hidden />
}
