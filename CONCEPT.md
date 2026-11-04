# Configurable Modular Eyewear — Concept (source brief)

Team design proposal, copied as given. PLAN.md is built from this.

## English

"Configurable Modular Eyewear" is a proposed mobile and web configurator for
personalised 3D-printed glasses, designed for people who want to express their
individual style and find a more suitable fit. The product combines 3D-printed
frames and interchangeable temples with standard metal hinges, screws, and
conventional optical lenses. Users can choose from round, rounded-square, and
cat-eye frames, with hexagonal and bold-frame designs planned as additional
options; adjust frame width, bridge size, and temple length; select sage green,
burgundy, sand, navy, or charcoal, with separate colours for the frame and
temples; choose smooth, finely ribbed, or organically perforated temple
designs; and add initials or a short inscription inside the temples.
Decorative textures are concentrated on the outer temple surfaces, while areas
touching the nose and ears remain smooth, and perforations avoid the hinge
connections. The app guides users through a clear sequence: choose a frame
shape, adjust the dimensions, select colours, choose a temple texture, add
personal details, and preview and confirm the design. An interactive 3D model
updates as users make changes, and configurations can be saved. Users can
refer to measurements from their existing glasses, while physical prototypes
are used to check the final fit; virtual try-on is a possible future feature.
The proposed manufacturing method is Selective Laser Sintering using PA12
nylon, with frames and temples printed separately before depowdering, surface
smoothing, dyeing, and assembly. The complete production process is parametric
modelling, printability checks, component printing, finishing and colouring,
installation of metal hinges and optical lenses, and final fitting and
adjustment. A standardised temple connection would allow users to replace
temple colours or textures while keeping the existing frame, with the
screw-based connection and replacement process validated through prototype
testing. Each confirmed configuration would correspond to a set of production
files for on-demand manufacturing. For the workshop, the initial scope is
three frame shapes, three temple textures, and five colours. The visual
direction uses warm neutral backgrounds, muted colours, and a tactile matte
nylon appearance, illustrated through three concept images showing the frame
collection, modular components and surface textures, and a smartphone
configurator beside the physical glasses. The presentation should bring these
elements together on one curated slide, clearly explaining what users can
personalise, how their choices change the digital model, and how the
configured product would be manufactured.

## 中文

建议把方案定为 **“可配置的模块化 3D 打印眼镜”——Configurable Modular Eyewear**，核心是让用户同时定制眼镜的**外观、尺寸和镜腿组合**。

**1. 产品定位**

面向希望表达个人风格、又难以找到合适镜框尺寸的消费者。用户通过手机或网页配置眼镜，确认设计后，再按个人参数制造。

产品由三部分组成：**3D 打印镜框、3D 打印镜腿，以及标准金属铰链和常规光学镜片**。

**2. 可以定制什么**

| 定制项目 | 设计选项 | 作用 |
|---|---|---|
| 镜框造型 | 圆形、圆角方形、猫眼形；后续增加六边形和粗框 | 表达不同风格 |
| 佩戴尺寸 | 镜框宽度、鼻桥尺寸、镜腿长度 | 调整佩戴适配 |
| 配色 | 鼠尾草绿、酒红、沙色、深蓝、炭黑 | 镜框与镜腿可分别选色 |
| 镜腿纹理 | 光滑、细条纹、有机镂空 | 提供不同视觉和触感 |
| 个性标记 | 镜腿内侧的姓名缩写或短文字 | 增加个人识别 |

纹理主要放在**镜腿外侧**，鼻桥、耳后等接触区域保持平滑。镂空区域避开铰链连接处。

**3. 用户如何完成设计**

**选择造型 → 调整尺寸 → 搭配颜色 → 选择镜腿纹理 → 添加文字 → 预览并确认**

配置器每次只引导用户完成一类选择，同时实时更新 3D 模型。尺寸可以参考现有眼镜填写；最终适配通过样件试戴确认。

首版先实现 **3D 旋转预览和配置保存**，手机虚拟试戴可以作为后续扩展功能。

**4. 如何制造**

拟采用 **SLS 选择性激光烧结技术，以 PA12 尼龙制造镜框和镜腿**，再进行清粉、表面平滑处理、染色和装配。SLS 尼龙已有眼镜制造应用，也支持纹理结构及多种后处理方式。[Formlabs 官方眼镜制造指南](https://formlabs.com/blog/3d-printed-glasses-frames-eyewear/)

制造流程为：

**参数化建模 → 打印检查 → 分件打印 → 表面处理与染色 → 安装铰链和镜片 → 试戴调整**

镜腿采用统一连接接口，设计为可拆换结构；首版使用金属铰链与螺钉连接，具体更换方式通过样件验证。

**5. 这个方案的设计亮点**

- **外观与尺寸共同定制**：用户既能选择风格，也能调整佩戴参数。
- **模块化镜腿**：更换颜色或纹理时，可以保留原有镜框。
- **按需制造**：每份配置对应一套生产文件，适合展示个性化产品的制造过程。

考虑到工作坊时间有限，建议首版控制在 **3 种镜框 × 3 种镜腿纹理 × 5 种颜色**。汇报的一页可以使用刚才的产品系列图作为主图，搭配定制流程和制造方式，重点讲清楚：**用户改什么、模型如何变化、最后怎样制造出来。**
