import type { Language } from '@/i18n/strings'

// Inspiration page content (PLAN.md §7): the team's concept images and the
// reference cases, each with what this configurator took from it.

export interface ConceptImage {
  file: string
  title: string
  shows: string
  used: string
}

export interface ReferenceCase {
  title: string
  kind: string
  summary: string
  used: string
  notUsed?: string
  link?: string
}

interface InspirationContent {
  concepts: ConceptImage[]
  cases: ReferenceCase[]
}

const en: InspirationContent = {
  concepts: [
    {
      file: 'collection.jpg',
      title: 'Frame collection',
      shows: 'Round, rounded-square, cat-eye and hexagonal frames in the five dye colours, with close-ups of the metal hinge, ribbed and perforated temples and the fine grain of dyed nylon.',
      used: 'The palette (sage, burgundy, sand, navy, charcoal), the matte nylon look in the 3D preview, and the three shapes of the first version. Hexagonal is kept for later.',
    },
    {
      file: 'modular.jpg',
      title: 'Modular parts and textures',
      shows: 'One printed front frame with pairs of interchangeable temples in different colours and textures, the standard hinges and pins, and texture samples.',
      used: 'Swappable temples on one shared hinge connection, the three temple textures, and the "New temples" action in My designs.',
    },
    {
      file: 'configurator.jpg',
      title: 'Configurator on a phone',
      shows: 'The design flow on a phone (shape, colour, fit sliders, preview) next to the printed glasses and their first sketches.',
      used: 'A phone-first layout with one step at a time, shape cards, colour swatches and fit sliders with a live preview.',
    },
  ],
  cases: [
    {
      title: 'Materialise custom eyewear',
      kind: 'Industry case',
      summary: 'Frames configured around a scan of the face and printed in nylon, linking personal data, configurable frame geometry and additive manufacturing in one workflow.',
      used: 'Fit as a set of parametric dimensions, and printing each pair on demand from its own production files.',
      notUsed: 'Face scanning: users here start from the size code of their own glasses instead, and the fit is checked on a printed prototype.',
    },
    {
      title: 'SLS nylon eyewear (Formlabs guide)',
      kind: 'Manufacturing guide',
      summary: 'How eyewear frames are made by selective laser sintering in PA12 nylon: printing without supports, then depowdering, smoothing, dyeing and assembly.',
      used: 'SLS in PA12 as the process, the finishing steps on the spec sheet, and the minimum wall, hole and strut sizes behind the print check.',
      link: 'https://formlabs.com/blog/3d-printed-glasses-frames-eyewear/',
    },
    {
      title: 'The optical size code',
      kind: 'Industry standard',
      summary: 'Most frames carry three numbers inside a temple, such as 52□18-145: lens width, bridge and temple length, measured with the boxing system.',
      used: 'The "Enter from my glasses" input, the size code shown in the preview, and lens outlines that fill their box exactly.',
    },
  ],
}

const zh: InspirationContent = {
  concepts: [
    {
      file: 'collection.jpg',
      title: '镜框系列',
      shows: '圆形、圆角方形、猫眼形和六边形镜框，五种染色颜色，并近拍了金属铰链、条纹和镂空镜腿，以及染色尼龙的细腻颗粒。',
      used: '配色（鼠尾草绿、酒红、沙色、深蓝、炭黑）、3D 预览中的哑光尼龙质感，以及首版的三种造型。六边形留到之后的版本。',
    },
    {
      file: 'modular.jpg',
      title: '模块化零件与纹理',
      shows: '一个打印前框，配几副颜色和纹理各不相同的可换镜腿，还有标准铰链、销钉和纹理样片。',
      used: '共用同一种铰链接口的可换镜腿、三种镜腿纹理，以及“我的设计”里的“换一副镜腿”。',
    },
    {
      file: 'configurator.jpg',
      title: '手机上的配置器',
      shows: '手机上的设计流程（造型、颜色、尺寸滑块、预览），旁边是打印好的眼镜和最初的草图。',
      used: '以手机为先、一次只做一步的布局，造型卡片、颜色色块和带实时预览的尺寸滑块。',
    },
  ],
  cases: [
    {
      title: 'Materialise 定制眼镜',
      kind: '行业案例',
      summary: '根据面部扫描配置镜框并用尼龙打印，把个人数据、可配置的镜框几何和增材制造连成一条流程。',
      used: '把佩戴尺寸做成一组参数，并按每副眼镜自己的生产文件按需打印。',
      notUsed: '面部扫描：这里改为从用户现有眼镜的尺寸码开始，最终适配靠打印样件试戴确认。',
    },
    {
      title: 'SLS 尼龙眼镜（Formlabs 指南）',
      kind: '制造指南',
      summary: '介绍如何用选择性激光烧结以 PA12 尼龙制造眼镜框：无需支撑打印，然后清粉、打磨、染色和组装。',
      used: '采用 PA12 尼龙 SLS 工艺、规格单上的后处理步骤，以及打印检查背后的最小壁厚、孔径和隔条尺寸。',
      link: 'https://formlabs.com/blog/3d-printed-glasses-frames-eyewear/',
    },
    {
      title: '眼镜尺寸码',
      kind: '行业标准',
      summary: '大多数镜框的镜腿内侧印着三个数字，比如 52□18-145：镜片宽度、鼻梁宽度和镜腿长度，按方框法测量。',
      used: '“按我的眼镜填写”、预览里显示的尺寸码，以及正好填满方框的镜片轮廓。',
    },
  ],
}

export const INSPIRATION: Record<Language, InspirationContent> = { en, zh }
