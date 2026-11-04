import { GROOVE_DEPTH, GROOVE_WIDTH } from '@/geometry/front'
import { HINGE } from '@/geometry/hinge'
import type { Language } from '@/i18n/strings'

// Making guide content (PLAN.md §7): from the production files to a pair of
// glasses, following the workflow in the concept: printability checks →
// separate printing → finishing and dyeing → hinges and lenses → fitting.

export interface GuideSection {
  id: string
  title: string
  intro: string
  steps: string[]
  note?: string
}

const leaf = `${HINGE.leafLength} × ${HINGE.leafHeight} × ${HINGE.leafThickness} mm`
const groove = `${GROOVE_WIDTH} × ${GROOVE_DEPTH} mm`

const en: GuideSection[] = [
  {
    id: 'before',
    title: 'Before printing',
    intro: 'Check the design once more, then gather the files.',
    steps: [
      'Open the last step, Preview, and read the print check. Notes in red print poorly; follow their fix first.',
      'Download all production files. The ZIP holds the STL and 3MF files to print, the lens outlines, the Rhino file and the spec sheet.',
      'For a first pair, print one frame and one temple as a test, and try them on before printing the rest.',
    ],
  },
  {
    id: 'print',
    title: 'Printing (SLS, PA12 nylon)',
    intro: 'Selective laser sintering melts nylon powder layer by layer. The loose powder holds the parts, so no supports are needed.',
    steps: [
      'Send the front frame and both temple files to the print service, or load the 3MF, which nests all three parts on one bed.',
      'Print one left and one right temple: the left file is the mirror image of the right one and carries its own engraving.',
      'Ask for PA12 in its natural white or grey, ready for dyeing.',
    ],
    note: 'The parts are drawn flat, in millimetres. The longest part fits small SLS printers (about 165 × 165 mm).',
  },
  {
    id: 'finish',
    title: 'Depowdering and smoothing',
    intro: 'Fresh SLS parts come out of a block of powder and feel slightly rough.',
    steps: [
      'Brush and blow the powder off, paying attention to the lens groove, the hinge pockets, the pilot holes and any perforations.',
      'Bead-blast the parts for an even surface.',
      'Smooth them further by vibratory tumbling until the surface feels soft and matte. Areas that touch the nose and ears are already designed smooth.',
    ],
  },
  {
    id: 'dye',
    title: 'Dyeing',
    intro: 'PA12 takes textile dyes well, all the way into the surface, so scratches do not show white.',
    steps: [
      'Dye the frame and the temples separately in their chosen colours, in a hot dye bath as the dye maker describes.',
      'Rinse, dry and check the colour against a dyed sample. The colours on screen are a guide only.',
      'Check that the engraving and textures are clean, and that the hinge pockets still take the hinge leaves.',
    ],
  },
  {
    id: 'assemble',
    title: 'Hinges and lenses',
    intro: 'Every frame and temple has the same standard hinge connection, so any temple fits any frame of the system.',
    steps: [
      `Press one hinge leaf (${leaf}) into each pocket: one in the back of each end piece, one on the inside of each temple.`,
      'Fix each leaf with an M1.4 self-tapping screw in its pilot hole.',
      `Have the lenses cut to the lens outline file (DXF). The lens edge sits in the ${groove} groove inside the rim; warm the rim slightly and snap each lens in.`,
      'Join each temple to the frame with the M1.4 pivot screw through the barrels.',
    ],
    note: 'Hinge, screw and groove sizes are first estimates. Measure the parts you buy and adjust them after the first test print.',
  },
  {
    id: 'swap',
    title: 'Swapping temples',
    intro: 'Temples are separate parts, so a frame can be worn with several pairs.',
    steps: [
      'In My designs, choose "New temples" on a saved design: it keeps the frame and lets you choose new temple colours and textures.',
      'Designs that share a frame are marked with the same frame letter. Print only the new temples.',
      'To swap, undo the pivot screws, change the temples and tighten the screws again.',
    ],
  },
  {
    id: 'fit',
    title: 'Trying on and adjusting',
    intro: 'The sizes in the configurator are a starting point; the printed prototype shows the real fit.',
    steps: [
      'Check that the bridge rests on the nose without pinching, and that the frame width matches your face at the temples.',
      'Check that the temples reach behind the ears and the ear bend sits comfortably.',
      'If the fit is off, change the sizes in the configurator, save a new design and print again. Nylon can only be bent a little.',
    ],
  },
]

const zh: GuideSection[] = [
  {
    id: 'before',
    title: '打印之前',
    intro: '再检查一遍设计，然后准备好文件。',
    steps: [
      '打开最后一步“预览”，看一下打印检查。红色提醒的项目打印效果不好，先按建议修改。',
      '下载全部生产文件。ZIP 里有用来打印的 STL 和 3MF、镜片轮廓、Rhino 文件和规格单。',
      '第一副眼镜可以先打印一个镜框和一条镜腿试戴，合适了再打印其余零件。',
    ],
  },
  {
    id: 'print',
    title: '打印（SLS，PA12 尼龙）',
    intro: '选择性激光烧结把尼龙粉末一层层熔合。周围未烧结的粉末托住零件，所以不需要支撑。',
    steps: [
      '把前框和两条镜腿的文件发给打印服务，或者直接用 3MF，它已经把三个零件排在同一个打印平台上。',
      '左右镜腿各打印一条：左镜腿文件是右镜腿的镜像，带着它自己的刻字。',
      '选用本色（白色或灰色）的 PA12，方便之后染色。',
    ],
    note: '零件已经平放摆好，单位毫米。最长的零件放得进小型 SLS 打印机（约 165 × 165 mm）。',
  },
  {
    id: 'finish',
    title: '清粉和打磨',
    intro: '刚打印好的 SLS 零件从粉块里取出来，表面略微粗糙。',
    steps: [
      '刷掉并吹净粉末，尤其注意镜片槽、铰链安装槽、预钻孔和镂空凹孔。',
      '喷砂处理，让表面均匀。',
      '再用振动研磨打磨，直到表面摸起来柔和、哑光。碰到鼻子和耳朵的部位在设计时就已经是光滑的。',
    ],
  },
  {
    id: 'dye',
    title: '染色',
    intro: 'PA12 很容易被织物染料染透表层，所以刮花了也不会露白。',
    steps: [
      '镜框和镜腿按各自选的颜色分开染色，按染料说明在热染浴中进行。',
      '冲洗、晾干，并和染色样片对比颜色。屏幕上的颜色只作参考。',
      '检查刻字和纹理是否清楚，铰链安装槽是否还能放进铰链片。',
    ],
  },
  {
    id: 'assemble',
    title: '铰链和镜片',
    intro: '所有镜框和镜腿都用同一种标准铰链接口，所以这套系统里的任何镜腿都能装到任何镜框上。',
    steps: [
      `把铰链片（${leaf}）压进每个安装槽：两边端头背面各一个，两条镜腿内侧各一个。`,
      '每个铰链片用一颗 M1.4 自攻螺丝拧进预钻孔固定。',
      `请眼镜店按镜片轮廓文件（DXF）切割镜片。镜片边缘卡在镜框内侧 ${groove} 的镜片槽里；稍微加热镜框边，把镜片卡进去。`,
      '用 M1.4 转轴螺丝穿过转筒，把镜腿装到镜框上。',
    ],
    note: '铰链、螺丝和镜片槽的尺寸目前是估计值。请测量你买到的零件，在第一次试打印后再调整。',
  },
  {
    id: 'swap',
    title: '更换镜腿',
    intro: '镜腿是独立的零件，一个镜框可以配好几副镜腿。',
    steps: [
      '在“我的设计”里，对一个已保存的设计点“换一副镜腿”：镜框保持不变，可以重新选择镜腿的颜色和纹理。',
      '共用同一个镜框的设计会标上同一个镜框字母，只需要打印新的镜腿。',
      '更换时拧下转轴螺丝，换上新镜腿，再把螺丝拧紧。',
    ],
  },
  {
    id: 'fit',
    title: '试戴和调整',
    intro: '配置器里的尺寸只是起点，打印出来的样件才能体现真实的佩戴感。',
    steps: [
      '检查鼻梁是否架得稳又不夹鼻子，镜框宽度是否和太阳穴处的脸宽相符。',
      '检查镜腿是否能绕到耳后，耳弯处是否舒适。',
      '如果不合适，就在配置器里改尺寸，另存一个新设计再打印。尼龙只能稍微弯折。',
    ],
  },
]

export const GUIDE: Record<Language, GuideSection[]> = { en, zh }
