import type { ExportTarget } from './types'
import { slackTarget } from './targets/slack'
import { discordTarget } from './targets/discord'

const registry = new Map<string, ExportTarget>([
  [slackTarget.id, slackTarget],
  [discordTarget.id, discordTarget],
])

export function getExportTarget(id: string): ExportTarget | undefined {
  return registry.get(id)
}

export function getAllExportTargets(): ExportTarget[] {
  return Array.from(registry.values())
}

export function registerExportTarget(target: ExportTarget): void {
  registry.set(target.id, target)
}
