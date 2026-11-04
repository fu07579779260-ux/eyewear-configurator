// UI strings. English is the source; every key must exist in both languages.
const en = {
  'app.title': 'Eyewear Configurator',
  'app.skip': 'Skip to content',
  'nav.label': 'Main',
  'nav.home': 'Home',
  'nav.configure': 'Configure',
  'nav.inspiration': 'Inspiration',
  'nav.guide': 'Making guide',
  'nav.myDesigns': 'My designs',
  'lang.label': 'Language',

  'home.kicker': 'Configurable Modular Eyewear',
  'home.title': 'Glasses shaped to your face and your style',
  'home.lead':
    'Choose a frame shape, set the fit, pick colours and a temple texture, and add your initials. The printed frame and temples combine with standard metal hinges, screws and lenses.',
  'home.start': 'Start designing',
  'home.flow': 'Shape → Dimensions → Colours → Texture → Personal details → Preview & confirm',

  'configure.title': 'Configure your glasses',
  'inspiration.title': 'Inspiration',
  'guide.title': 'Making guide',
  'myDesigns.title': 'My designs',
  'page.comingSoon': 'This page is being built.',

  'footer.tagline': 'Printed frame, standard parts, your fit.',
  'footer.units': 'All dimensions in mm',
  'footer.workshop': 'Configurable 3D-printed products workshop',
}

const zh: Record<keyof typeof en, string> = {
  'app.title': '眼镜配置器',
  'app.skip': '跳到正文',
  'nav.label': '主导航',
  'nav.home': '首页',
  'nav.configure': '开始配置',
  'nav.inspiration': '灵感',
  'nav.guide': '制作指南',
  'nav.myDesigns': '我的设计',
  'lang.label': '语言',

  'home.kicker': '可配置的模块化眼镜',
  'home.title': '贴合你的脸型，也表达你的风格',
  'home.lead':
    '选择镜框造型，调整佩戴尺寸，搭配颜色和镜腿纹理，再刻上你的名字缩写。打印的镜框和镜腿配上标准金属铰链、螺丝和镜片即可组装。',
  'home.start': '开始设计',
  'home.flow': '造型 → 尺寸 → 颜色 → 纹理 → 个人信息 → 预览确认',

  'configure.title': '配置你的眼镜',
  'inspiration.title': '灵感',
  'guide.title': '制作指南',
  'myDesigns.title': '我的设计',
  'page.comingSoon': '这个页面正在制作中。',

  'footer.tagline': '打印镜框，标准零件，合你尺寸。',
  'footer.units': '所有尺寸单位为 mm',
  'footer.workshop': '可配置 3D 打印产品工作坊',
}

export type StringKey = keyof typeof en

export const LANGUAGES = ['en', 'zh'] as const
export type Language = (typeof LANGUAGES)[number]

export const STRINGS: Record<Language, Record<StringKey, string>> = { en, zh }
