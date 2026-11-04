import type { StringKey } from '@/i18n/strings'

// The six design steps of the configurator, in order (PLAN.md §7)
export const STEPS = ['shape', 'dimensions', 'colours', 'texture', 'personal', 'preview'] as const
export type StepId = (typeof STEPS)[number]

export const STEP_LABEL: Record<StepId, StringKey> = {
  shape: 'step.shape.label',
  dimensions: 'step.dimensions.label',
  colours: 'step.colours.label',
  texture: 'step.texture.label',
  personal: 'step.personal.label',
  preview: 'step.preview.label',
}

export const STEP_TITLE: Record<StepId, StringKey> = {
  shape: 'step.shape.title',
  dimensions: 'step.dimensions.title',
  colours: 'step.colours.title',
  texture: 'step.texture.title',
  personal: 'step.personal.title',
  preview: 'step.preview.title',
}

export const STEP_DESCRIPTION: Record<StepId, StringKey> = {
  shape: 'step.shape.description',
  dimensions: 'step.dimensions.description',
  colours: 'step.colours.description',
  texture: 'step.texture.description',
  personal: 'step.personal.description',
  preview: 'step.preview.description',
}
