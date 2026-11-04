import { printChecks } from '@/geometry/checks'
import { HINGE } from '@/geometry/hinge'
import { fill } from '@/i18n/language'
import { STRINGS, type Language, type StringKey } from '@/i18n/strings'
import { templeColour, type EyewearConfig } from '@/model/config'
import { designCode } from '@/model/serialize'
import { derivedSizes } from '@/model/sizes'

// The design described in words, for the design card and the spec sheet.

export interface Summary {
  code: string
  title: string
  sizeCode: string
  rows: [label: string, value: string][]
  printTips: string[]
  finishing: string[]
  assembly: string[]
  /** Print checks that need attention, as sentences */
  checks: string[]
}

const mm = (v: number) => `${Number(v.toFixed(1))} mm`

export function designSummary(config: EyewearConfig, lang: Language): Summary {
  const s = STRINGS[lang]
  const t = (k: StringKey) => s[k]
  const { shape, fit, colour, texture, personal } = config
  const sizes = derivedSizes(config)

  const shapeName = t(`shape.${shape.frame}`)
  const shapeDetail =
    shape.frame === 'roundedSquare'
      ? `${shapeName} · ${t('field.cornerRadius')} ${mm(shape.cornerRadius)}`
      : shape.frame === 'catEye'
        ? `${shapeName} · ${t('field.wingLift')} ${mm(shape.wingLift)}`
        : shapeName
  const textureDetail =
    texture.type === 'ribbed'
      ? `${t('texture.ribbed')} · ${t(`texture.direction.${texture.ribDirection}`)} · ${t('field.ribPitch')} ${mm(texture.ribPitch)} · ${t('field.ribDepth')} ${mm(texture.ribDepth)}`
      : texture.type === 'perforated'
        ? `${t('texture.perforated')} · ${t('field.holeDensity')} ${Math.round(texture.holeDensity * 100)} % · ${fill(t('texture.pattern'), { seed: String(texture.seed) })}`
        : t('texture.smooth')
  const inscription = personal.inscription.trim()
    ? `“${personal.inscription}” · ${t(`personal.placement.${personal.placement}`)} · ${mm(personal.textSize)}`
    : t('summary.none')

  const rows: [string, string][] = [
    [t('summary.shape'), shapeDetail],
    [t('fit.sizeCode'), sizes.sizeCode],
    [t('field.frameWidth'), mm(fit.frameWidth)],
    [t('fit.lensWidth'), mm(sizes.lensWidth)],
    [t('field.bridge'), mm(fit.bridge)],
    [t('field.templeLength'), mm(fit.templeLength)],
    [t('field.lensHeight'), mm(fit.lensHeight)],
    [t('field.frontThickness'), mm(fit.frontThickness)],
    [t('field.rimWidth'), mm(fit.rimWidth)],
    [t('field.templeWidth'), mm(fit.templeWidth)],
    [t('colours.frame'), t(`colour.${colour.frame}`)],
    [t('colours.temples'), t(`colour.${templeColour(config)}`)],
    [t('summary.texture'), textureDetail],
    [t('summary.inscription'), inscription],
    [t('viewport.designNumber'), personal.designNumber ? `${designCode(config)} (${t('personal.placement.right')})` : t('summary.none')],
  ]

  const checks = printChecks(config)
    .filter((c) => !c.ok)
    .map((c) => `${fill(t(`check.${c.id}.warn`), c.values)} ${fill(t(`check.${c.id}.fix`), c.values)}`)

  return {
    code: designCode(config),
    title: fill(t('sheet.name'), { shape: shapeName }),
    sizeCode: sizes.sizeCode,
    rows,
    printTips: [t('sheet.print.1'), t('sheet.print.2'), t('sheet.print.3')],
    finishing: [t('sheet.finish.1'), t('sheet.finish.2'), t('sheet.finish.3')],
    assembly: [
      fill(t('sheet.assembly.1'), { leaf: `${HINGE.leafLength} × ${HINGE.leafHeight} × ${HINGE.leafThickness} mm` }),
      t('sheet.assembly.2'),
      t('sheet.assembly.3'),
    ],
    checks,
  }
}
