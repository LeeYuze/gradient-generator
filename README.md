# **Gradient Pro | 极致渐变工坊**

一个拥有极光背景与玻璃拟态设计的现代化在线渐变生成器。

Gradient Pro 不仅仅是一个工具，更是一种视觉享受。它采用了最新的 Web 设计趋势（玻璃拟态、流体背景），配合直观的物理交互控件，帮助设计师和开发者快速创建、预览并下载 4K 级的高清渐变壁纸。

预览地址：[https://bg.diyun.site/](https://bg.diyun.site/)

## **✨ 核心特性**

### **🎨 沉浸式视觉体验**

* **动态极光背景 (Aurora Ambient)**：背景光效会跟随你调整的渐变色实时流动与变化，营造沉浸式创作氛围。  
* **微光陶瓷质感**: 界面采用高精度的磨砂玻璃与微光陶瓷材质，配合细腻的光影与投影。  
* **噪点纹理 (Noise Overlay)**: 全局叠加细微的胶片噪点，提升画面质感。

### **🎛 极简交互设计**

* **可视化角度罗盘**: 摒弃传统的数字输入，使用物理拟真的角度盘，拖拽即可直观改变光影方向。  
* **悬浮操作岛**: 桌面端采用类似 macOS 的悬浮工具栏，移动端底栏自动吸附，最大化预览空间。  
* **智能遮罩**: 列表滚动时的边缘渐隐处理，让界面始终保持纯净通透。

### **🛠 强大功能支持**

* **素材叠加编辑**: 直接将 Logo 或素材拖入面板即可叠加，支持画布内拖拽、拉角缩放、旋转和圆角控制。
* **吸附参考线**: 拖动或缩放素材时，可自动吸附到画布边缘与中心线，辅助快速完成对齐排版。
* **多格式导出**: 支持 PNG (HQ)、JPG、WebP、SVG 多种格式，自定义分辨率（最高支持 8K）。
* **随机灵感**: 智能算法生成和谐的配色方案。  
* **国际化**: 内置中英文双语支持。

## **🚀 快速开始**

### **1\. 克隆项目**
```
git clone https://github.com/DemoJ/gradient-generator.git
```

### **2\. 进入目录**
```
cd gradient-generator
```

### **3\. 配置 (可选)**

如果需要启用百度统计，请修改根目录下的 config.json 文件：
```

{  
    "baiduAnalytics": "你的百度统计ID"  
}
```

### **4\. 运行**

由于项目使用了 ES Modules 和 Fetch API 读取配置，建议使用本地服务器运行：

* 使用 VS Code 的 **Live Server** 插件（推荐）。  
* 或使用 Python: python \-m http.server 8000  
* 或使用 Node: npx serve .

## **🛠️ 技术栈**

* **HTML5**: 语义化标签结构。  
* **CSS3**:  
  * CSS Variables (主题管理)  
  * Backdrop Filter (毛玻璃特效)  
  * CSS Mask & Gradients (高级遮罩与流体背景)  
  * Flexbox & Grid (响应式布局)  
* **JavaScript (Vanilla)**:  
  * 基于状态 (State-Based) 的架构设计  
  * 无构建工具依赖，使用原生 DOM API 驱动核心逻辑
  * 原生 Canvas 渲染引擎
* **Moveable**:
  * 通过 CDN 引入，用于素材的拖拽、缩放、旋转控制框
  * 项目自身保留吸附计算与导出渲染逻辑，确保预览和下载结果一致

## **🌍 浏览器支持**

建议使用支持 backdrop-filter 和 mask-image 的现代浏览器以获得最佳体验：

* Chrome 80+  
* Safari 14+ (iOS & macOS)  
* Edge 80+  
* Firefox 100+

## **👤 作者**

**diyun**

* Website: [diyun.site](https://www.diyun.site)  
* GitHub: [@DemoJ](https://github.com/DemoJ)

## **🙏 致谢**

感谢 AI 编程辅助重构与设计优化。
