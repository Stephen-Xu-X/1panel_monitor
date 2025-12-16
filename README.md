---

# 1Panel Monitor for Scriptable

A beautiful, native iOS widget to monitor your 1Panel server status in real-time.

一款精美、原生的 iOS 小组件，用于实时监控您的 1Panel 服务器状态。

![Screenshot Placeholder: Cover Image showing Small, Medium, and Large widgets]

---

## 📖 Introduction | 简介

**1Panel Monitor** is a JavaScript script designed for the [Scriptable](https://scriptable.app/) app on iOS. It connects directly to your 1Panel server's API to fetch critical system metrics (CPU, RAM, Disk) and network information. It features a polished, Apple-native design that adapts seamlessly to your device's system theme.

**1Panel Monitor** 是专为 iOS 上的 [Scriptable](https://scriptable.app/) 应用设计的脚本。它直接连接到您的 1Panel 服务器 API，获取关键系统指标（CPU、内存、磁盘）和网络信息。它采用了精致的 Apple 原生设计风格，并能无缝适配设备的系统深色/浅色模式。

---

## ✨ Features | 功能特性

- **📊 Real-time Metrics**: Visualizes CPU, Memory, and Disk usage with dynamic progress rings and bars.
    - **实时指标**：通过动态进度环和进度条可视化 CPU、内存和磁盘使用率。
- **🎨 Adaptive Theming**: Automatically switches text and background colors based on iOS Dark/Light mode.
    - **自适应主题**：根据 iOS 深色/浅色模式自动切换文字和背景颜色。
- **🌈 Dynamic Gradients**: Progress indicators change color (Green → Red) based on load intensity.
    - **动态渐变**：进度指示器颜色根据负载强度变化（绿色 → 红色）。
- **🌍 Network Info**: Displays Host IP, ISP, Geo-location, and National Flag emoji.
    - **网络信息**：显示主机 IP、ISP、地理位置和国旗 Emoji。
- **📱 Multiple Sizes**: Supports Small (CPU focus), Medium (Detailed Bars), and Large (Grid View) widgets.
    - **多尺寸支持**：支持小号（专注 CPU）、中号（详细条形图）和大号（网格视图）组件。
- **💾 Offline Caching**: Caches data locally to ensure the widget remains visible even when the network fails.
    - **离线缓存**：本地缓存数据，确保即使网络故障，组件依然可见。

---

## ⚡ Quick Start | 快速开始

### Prerequisites | 前置要求

1. An iOS device with the **Scriptable** app installed.
    - 已安装 **Scriptable** 应用的 iOS 设备。
2. A server running **1Panel** (v1.10.0 or higher recommended).
    - 运行 **1Panel** 的服务器（建议 v1.10.0 或更高版本）。

### Installation | 安装步骤

1. **Enable API in 1Panel**:
    - Go to `1Panel Settings` -> `API Interface`.
    - Enable the API and create an `API Key`.
    - *Note: Ensure "Allow access from any IP" is checked or add your phone's IP to the whitelist.*
    - **在 1Panel 中启用 API**：
        - 进入 `1Panel 面板设置` -> `API 接口`。
        - 启用 API 并创建一个 `API Key`。
        - *注意：确保勾选“允许所有 IP 访问”，或者将手机 IP 加入白名单。*
2. **Add Script**:
    - Open Scriptable, tap `+` to create a new script.
    - Copy the code from `1panel_monitor_v10.js`.
    - Paste it into the editor and name it `1Panel Monitor`.
    - **添加脚本**：
        - 打开 Scriptable，点击 `+` 创建新脚本。
        - 复制 `1panel_monitor_v10.js` 的代码。
        - 粘贴到编辑器中，并命名为 `1Panel Monitor`。
3. **Configure**:
    - Locate the `CONFIG` object at the top of the script and update your server details.
    - **配置**：
        - 找到脚本顶部的 `CONFIG` 对象，更新您的服务器信息。

JavaScript

# 
```powershell
const CONFIG = {
  baseUrl: "http://your-server-ip:port", // e.g., http://1.2.3.4:2025
  apiKey: "YOUR_API_KEY_HERE",           // e.g., YS5XiYs1q6GTx...
  refreshInterval: 10                    // Refresh every 10 minutes (刷新间隔/分钟)
};
```

1. **Add to Home Screen**:
    - Go to your iOS Home Screen, long-press, and tap `+`.
    - Select **Scriptable**.
    - Tap the widget, choose `1Panel Monitor` in the **Script** option.
    - **添加到主屏幕**：
        - 回到 iOS 主屏幕，长按并点击 `+`。
        - 选择 **Scriptable**。
        - 点击组件，在 **Script** 选项中选择 `1Panel Monitor`。

---

## 🖼️ Widget Sizes | 组件尺寸预览

### Small Widget | 小号组件

Displays a focused CPU usage ring. Perfect for dense home screens.

显示核心 CPU 使用率圆环。非常适合紧凑的主屏幕布局。

`![Screenshot Small Widget]`

### Medium Widget | 中号组件

Displays CPU, RAM, and Disk usage bars alongside server IP.

显示 CPU、内存和磁盘使用率进度条，以及服务器 IP。

`![Screenshot Medium Widget]`

### Large Widget | 大号组件

The ultimate dashboard. Displays all metrics plus detailed ISP and location data.

终极仪表盘。显示所有指标以及详细的 ISP 和地理位置数据。

`![Screenshot Large Widget]`

---

## ⚙️ Configuration | 配置说明

You can customize the visual theme by modifying the THEME object in the code.

您可以通过修改代码中的 THEME 对象来自定义视觉主题。

| **Variable 变量** | **Description 描述** |
| --- | --- |
| `bgLight` | Background color for Light Mode (浅色模式背景) |
| `bgDark` | Background color for Dark Mode (深色模式背景) |
| `colorStart` | Start color for the healthy status gradient (健康状态渐变起始色) |
| `colorEnd` | End color for high load status gradient (高负载渐变结束色) |

---

## 🤝 Contributing | 贡献

Issues and Pull Requests are welcome! If you have ideas for new features (like Docker container monitoring), feel free to open a discussion.

欢迎提交 Issue 和 Pull Request！如果您有新功能的想法（比如 Docker 容器监控），欢迎开启讨论。

---

## 📄 License | 许可

This project is licensed under the MIT License - see the LICENSE file for details.

本项目采用 MIT 许可证 - 详情请参阅 LICENSE 文件。
