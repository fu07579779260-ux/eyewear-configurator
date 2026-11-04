// The design a user builds in the configurator, with its defaults and ranges.
// Values and ranges follow PLAN.md §4. Lengths are in millimetres.

export const FRAME_SHAPES = ['round', 'roundedSquare', 'catEye'] as const
export type FrameShape = (typeof FRAME_SHAPES)[number]

/** The five dyed PA12 colours (PLAN.md §4.3). */
export const DYE_COLOURS = ['sage', 'burgundy', 'sand', 'navy', 'charcoal'] as const
export type DyeColour = (typeof DYE_COLOURS)[number]

/** Temples can follow the frame colour or have their own. */
export const TEMPLE_COLOURS = ['same', ...DYE_COLOURS] as const
export type TempleColour = (typeof TEMPLE_COLOURS)[number]

export const TEXTURES = ['smooth', 'ribbed', 'perforated'] as const
export type Texture = (typeof TEXTURES)[number]

export const RIB_DIRECTIONS = ['across', 'along'] as const
export type RibDirection = (typeof RIB_DIRECTIONS)[number]

export const PLACEMENTS = ['left', 'right', 'both'] as const
export type Placement = (typeof PLACEMENTS)[number]

export interface EyewearConfig {
  shape: {
    frame: FrameShape
    /** Rounded Square only */
    cornerRadius: number
    /** Cat-Eye only: how far the outer top corner rises */
    wingLift: number
  }
  fit: {
    /** Total width of the front frame, hinge to hinge */
    frameWidth: number
    bridge: number
    templeLength: number
    lensHeight: number
    frontThickness: number
    rimWidth: number
    templeWidth: number
  }
  colour: {
    frame: DyeColour
    temple: TempleColour
  }
  texture: {
    type: Texture
    ribPitch: number
    ribDepth: number
    ribDirection: RibDirection
    /** 0 – 1 */
    holeDensity: number
    /** Seed for the organic perforation pattern */
    seed: number
  }
  personal: {
    inscription: string
    placement: Placement
    textSize: number
    engravingDepth: number
    /** Engrave the design number inside the right temple */
    designNumber: boolean
  }
}

export type Section = keyof EyewearConfig

export interface NumberRange {
  min: number
  max: number
  step: number
}

/** Ranges for every numeric field (PLAN.md §4). Sliders and sanitising both use these. */
export const RANGES = {
  shape: {
    cornerRadius: { min: 3, max: 15, step: 0.5 },
    wingLift: { min: 2, max: 10, step: 0.5 },
  },
  fit: {
    frameWidth: { min: 124, max: 150, step: 0.5 },
    bridge: { min: 14, max: 24, step: 0.5 },
    templeLength: { min: 130, max: 155, step: 5 },
    lensHeight: { min: 30, max: 50, step: 0.5 },
    frontThickness: { min: 4, max: 7, step: 0.1 },
    rimWidth: { min: 3, max: 8, step: 0.1 },
    templeWidth: { min: 4, max: 10, step: 0.1 },
  },
  texture: {
    ribPitch: { min: 0.8, max: 2.5, step: 0.1 },
    ribDepth: { min: 0.2, max: 0.6, step: 0.05 },
    holeDensity: { min: 0, max: 1, step: 0.05 },
    seed: { min: 0, max: 9999, step: 1 },
  },
  personal: {
    textSize: { min: 2, max: 4, step: 0.1 },
    engravingDepth: { min: 0.3, max: 0.6, step: 0.05 },
  },
} as const satisfies Partial<Record<Section, Record<string, NumberRange>>>

/** Longest inscription, counted in characters (a Chinese character counts as one). */
export const MAX_INSCRIPTION_LENGTH = 20

/** Lens heights that suit each shape; applied when the shape changes. */
export const SHAPE_LENS_HEIGHT: Record<FrameShape, number> = {
  round: 44,
  roundedSquare: 40,
  catEye: 38,
}

export const DEFAULT_CONFIG: EyewearConfig = {
  shape: { frame: 'roundedSquare', cornerRadius: 8, wingLift: 5 },
  fit: {
    frameWidth: 136,
    bridge: 18,
    templeLength: 145,
    lensHeight: SHAPE_LENS_HEIGHT.roundedSquare,
    frontThickness: 5,
    rimWidth: 4.5,
    templeWidth: 6,
  },
  colour: { frame: 'sand', temple: 'same' },
  texture: {
    type: 'smooth',
    ribPitch: 1.2,
    ribDepth: 0.35,
    ribDirection: 'across',
    holeDensity: 0.5,
    seed: 2026,
  },
  personal: {
    inscription: '',
    placement: 'left',
    textSize: 2.5,
    engravingDepth: 0.4,
    designNumber: true,
  },
}

/** Placeholder dye swatches until they are matched to dyed samples (PLAN.md §4.3). */
export const DYE_HEX: Record<DyeColour, string> = {
  sage: '#8c9a84',
  burgundy: '#6b2e35',
  sand: '#c8b597',
  navy: '#2f3a52',
  charcoal: '#3a3a3c',
}

export const templeColour = (config: EyewearConfig): DyeColour =>
  config.colour.temple === 'same' ? config.colour.frame : config.colour.temple
