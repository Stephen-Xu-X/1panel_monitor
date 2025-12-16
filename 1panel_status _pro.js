// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: layer-group;

/**
 * 1Panel Monitor (Stacking Supported v11)
 * 特性: 支持通过组件参数 (Parameter) 切换显示内容
 * 适用: 小组件 (Small Widget)
 * 参数: "cpu" / "ram" / "disk" (不填默认显示 CPU)
 */

const CONFIG = {
  baseUrl: "http://38.244.18.176:2025",
  apiKey: "YS5XiYs1q6GTx5LimbvxJVcda7jDbpin",
  refreshInterval: 10 
};

const THEME = {
  // 浅色背景
  bgLight: new Color("#F2F2F7"), 
  // 深色背景
  bgDark: new Color("#1C1C1E"),
  
  // 文字颜色 (自动适配)
  textLight: new Color("#000000"),
  textDark: new Color("#FFFFFF"),
  
  // 渐变色定义 (绿 -> 红)
  colorStart: new Color("#30d158"), 
  colorEnd: new Color("#FF453A"),   
  
  // 轨道颜色
  trackLight: new Color("#E5E5EA"),
  trackDark: new Color("#2C2C2E")
};

// =================================================
// 🚀 主程序
// =================================================

try {
  let data = await getData();
  let widget = await createWidget(data);
  
  if (config.runsInWidget) {
    Script.setWidget(widget);
  } else {
    // 预览模式：可以在这里手动修改参数测试效果
    // args.widgetParameter = "disk"; 
    widget.presentSmall(); 
  }
  Script.complete();
} catch (e) {
  console.error(e);
}

// =================================================
// 📡 数据获取层
// =================================================

async function getData() {
  let fm = FileManager.local();
  let cachePath = fm.joinPath(fm.documentsDirectory(), "1panel_stack_v11.json");

  const urlNode = `${CONFIG.baseUrl}/api/v2/dashboard/current/node`;
  const urlDisk = `${CONFIG.baseUrl}/api/v2/hosts/disks`;
  
  let serverIp = CONFIG.baseUrl.split("//")[1].split(":")[0];
  let timestamp = Math.floor(Date.now() / 1000).toString();
  let token = md5("1panel" + CONFIG.apiKey + timestamp);
  
  let headers = {
    "1Panel-Token": token,
    "1Panel-Timestamp": timestamp,
    "Content-Type": "application/json",
    "User-Agent": "Scriptable/3.0"
  };

  try {
    let reqNode = new Request(urlNode); reqNode.headers = headers;
    let reqDisk = new Request(urlDisk); reqDisk.headers = headers;
    
    // GeoIP (简单熔断)
    const fetchGeo = async () => {
      try {
        let r = new Request(`http://ip-api.com/json/${serverIp}?lang=zh-CN`);
        r.timeoutInterval = 2; 
        return await r.loadJSON();
      } catch (e) { return null; }
    };

    let [jsonNode, jsonDisk, jsonGeo] = await Promise.all([
      reqNode.loadJSON(), 
      reqDisk.loadJSON(),
      fetchGeo()
    ]);

    let dNode = jsonNode.data || {};
    const raw = (val) => (typeof val === 'number' ? val : 0);
    const fmt = (val) => (typeof val === 'number' ? val.toFixed(2) : "0.00");

    let diskPercent = 0;
    if (jsonDisk.data && jsonDisk.data.systemDisks) {
      for (let disk of jsonDisk.data.systemDisks) {
        if (disk.partitions) {
          let root = disk.partitions.find(p => p.mountPoint === "/");
          if (root) diskPercent = raw(root.usePercent);
        }
      }
    }
    
    // 解析 Geo
    let locationStr = "Data Center";
    let ispStr = "Unknown";
    let flag = "🖥️";
    if (jsonGeo && jsonGeo.status === "success") {
      locationStr = `${jsonGeo.country} ${jsonGeo.city}`;
      ispStr = jsonGeo.isp || jsonGeo.org || "Unknown";
      flag = getFlagEmoji(jsonGeo.countryCode);
    }

    let finalData = {
      cpu: { val: raw(dNode.cpuUsedPercent), str: fmt(dNode.cpuUsedPercent) },
      mem: { val: raw(dNode.memoryUsedPercent), str: fmt(dNode.memoryUsedPercent) },
      disk: { val: diskPercent, str: diskPercent.toFixed(2) },
      info: { ip: serverIp, loc: locationStr, isp: ispStr, flag: flag },
      timestamp: Date.now(),
      error: false
    };
    
    fm.writeString(cachePath, JSON.stringify(finalData));
    return finalData;

  } catch (err) {
    console.error("Fetch Error: " + err.message);
    if (fm.fileExists(cachePath)) {
      let c = JSON.parse(fm.readString(cachePath));
      c.error = true;
      return c;
    }
    return { error: true, msg: err.message };
  }
}

// =================================================
// 🎨 UI 构建层
// =================================================

async function createWidget(data) {
  let w = new ListWidget();
  w.refreshAfterDate = new Date(Date.now() + 1000 * 60 * CONFIG.refreshInterval);
  w.backgroundColor = Color.dynamic(THEME.bgLight, THEME.bgDark);

  if (data.error && !data.cpu) {
    w.addText("⚠️ 连接超时").textColor = Color.red();
    return w;
  }

  const family = config.widgetFamily;
  if (family === "small") renderSmall(w, data);
  else if (family === "medium") renderMedium(w, data);
  else renderLarge(w, data);

  return w;
}

// --- Small: 支持参数切换 (CPU / RAM / Disk) ---
function renderSmall(w, data) {
  w.setPadding(10, 10, 10, 10);
  let stack = w.addStack();
  stack.centerAlignContent();
  stack.addSpacer();
  
  // 1. 获取用户参数 (默认为 cpu)
  // 参数支持: "cpu", "ram" (或 "mem"), "disk"
  let param = (args.widgetParameter || "cpu").toLowerCase().trim();
  
  // 2. 根据参数选择显示的数据
  let targetItem = data.cpu;
  let targetLabel = "CPU";
  
  if (param === "ram" || param === "mem" || param === "memory") {
    targetItem = data.mem;
    targetLabel = "RAM";
  } else if (param === "disk" || param === "storage") {
    targetItem = data.disk;
    targetLabel = "Disk";
  }

  // 3. 绘制
  let size = 110; 
  let box = stack.addStack();
  box.size = new Size(size, size);
  box.centerAlignContent();
  
  let img = drawCircleWithText(targetItem, targetLabel, size, 10);
  box.addImage(img);
  
  stack.addSpacer();
}

// --- Medium: 保持原样 (显示所有) ---
function renderMedium(w, data) {
  w.setPadding(15, 15, 15, 15);
  
  let h = w.addStack();
  h.centerAlignContent();
  let icon = h.addImage(SFSymbol.named("server.rack").image);
  icon.imageSize = new Size(16, 16);
  icon.tintColor = getGradientColor(50); 
  h.addSpacer(8);
  h.addText("1Panel Monitor").font = Font.boldSystemFont(14);
  h.addSpacer();
  
  let t = h.addText(data.info.ip);
  t.font = new Font("Menlo", 10); 
  t.textOpacity = 0.5;
  
  w.addSpacer(12);
  
  addBar(w, "CPU", data.cpu);
  w.addSpacer(8);
  addBar(w, "RAM", data.mem);
  w.addSpacer(8);
  addBar(w, "Disk", data.disk);
}

// --- Large: 保持原样 (四宫格) ---
function renderLarge(w, data) {
  w.setPadding(20, 20, 20, 20);
  
  let row1 = w.addStack();
  let row2 = w.addStack();
  w.addSpacer(20);
  
  addLargeCell(row1, "CPU", data.cpu);
  row1.addSpacer();
  addLargeCell(row1, "RAM", data.mem);
  
  addLargeCell(row2, "Disk", data.disk);
  row2.addSpacer();
  
  let infoCell = row2.addStack();
  infoCell.size = new Size(140, 130);
  infoCell.layoutVertically();
  infoCell.centerAlignContent();
  
  let ipTitle = infoCell.addText("HOST IP");
  ipTitle.font = Font.systemFont(10);
  ipTitle.textOpacity = 0.5;
  infoCell.addSpacer(4);
  let ipText = infoCell.addText(data.info.ip);
  ipText.font = new Font("Menlo-Bold", 13);
  
  infoCell.addSpacer(8);
  
  let ispTitle = infoCell.addText("ISP");
  ispTitle.font = Font.systemFont(10);
  ispTitle.textOpacity = 0.5;
  infoCell.addSpacer(2);
  let ispText = infoCell.addText(data.info.isp);
  ispText.font = Font.systemFont(11);
  ispText.lineLimit = 1;

  infoCell.addSpacer(8);
  
  let locStack = infoCell.addStack();
  locStack.centerAlignContent();
  let flagText = locStack.addText(data.info.flag);
  flagText.font = Font.systemFont(20);
  locStack.addSpacer(5);
  let cityText = locStack.addText(data.info.loc);
  cityText.font = Font.systemFont(11);
  cityText.lineLimit = 1;
}

// --- Helper Functions ---

function addLargeCell(stack, label, item) {
  let cell = stack.addStack();
  cell.size = new Size(140, 130);
  cell.layoutVertically();
  cell.centerAlignContent();
  
  let l = cell.addText(label);
  l.font = Font.boldSystemFont(13);
  l.textColor = Color.dynamic(THEME.textLight, THEME.textDark); 
  
  cell.addSpacer(8);
  let img = drawCircleWithText(item, null, 90, 8); 
  cell.addImage(img);
}

function getGradientColor(val) {
  let pct = Math.max(0, Math.min(1, val / 100));
  let c1 = THEME.colorStart;
  let c2 = THEME.colorEnd;
  
  let r = c1.red + (c2.red - c1.red) * pct;
  let g = c1.green + (c2.green - c1.green) * pct;
  let b = c1.blue + (c2.blue - c1.blue) * pct;
  
  let toHex = (n) => {
    let i = Math.round(n * 255);
    return (i < 16 ? "0" : "") + i.toString(16);
  };
  return new Color("#" + toHex(r) + toHex(g) + toHex(b));
}

function drawCircleWithText(item, centerLabel, size, strokeWidth) {
  let ctx = new DrawContext();
  ctx.size = new Size(size, size);
  ctx.opaque = false;
  ctx.respectScreenScale = true;

  let center = new Point(size/2, size/2);
  let radius = (size - strokeWidth) / 2; 

  // Track
  ctx.setStrokeColor(Color.dynamic(THEME.trackLight, THEME.trackDark));
  ctx.setLineWidth(strokeWidth);
  ctx.strokeEllipse(new Rect(strokeWidth/2, strokeWidth/2, size-strokeWidth, size-strokeWidth));

  // Progress
  let pct = item.val / 100;
  if (pct < 0) pct = 0; if (pct > 1) pct = 1;
  let dynamicColor = getGradientColor(item.val);

  if (pct > 0) {
    let path = new Path();
    let startAngle = -90;
    let sweepAngle = 360 * pct;
    addArcToPath(path, center, radius, startAngle, sweepAngle);
    ctx.addPath(path);
    ctx.setStrokeColor(dynamicColor);
    ctx.setLineWidth(strokeWidth);
    ctx.strokePath();
    
    fillCircle(ctx, center, radius, startAngle, strokeWidth/2, dynamicColor);
    if (pct < 1) fillCircle(ctx, center, radius, startAngle + sweepAngle, strokeWidth/2, dynamicColor);
  }

  // Text
  let textColor = Color.dynamic(THEME.textLight, THEME.textDark); 

  if (centerLabel) {
    let fontLabel = Font.boldSystemFont(18);
    ctx.setTextAlignedCenter();
    ctx.setFont(fontLabel);
    ctx.setTextColor(textColor);
    ctx.drawTextInRect(centerLabel, new Rect(0, size/2 - 20, size, 22));
    
    let fontVal = new Font("Menlo", 14);
    ctx.setFont(fontVal);
    ctx.drawTextInRect(item.str + "%", new Rect(0, size/2 + 4, size, 20));
  } else {
     let fontVal = new Font("Menlo-Bold", 18);
     ctx.setTextAlignedCenter();
     ctx.setFont(fontVal);
     ctx.setTextColor(textColor);
     ctx.drawTextInRect(Math.round(item.val) + "%", new Rect(0, size/2 - 11, size, 25));
  }
  return ctx.getImage();
}

function fillCircle(ctx, center, radius, angleDeg, capRadius, color) {
  let rad = angleDeg * Math.PI / 180;
  let x = center.x + radius * Math.cos(rad);
  let y = center.y + radius * Math.sin(rad);
  let path = new Path();
  path.addEllipse(new Rect(x - capRadius, y - capRadius, capRadius * 2, capRadius * 2));
  ctx.addPath(path);
  ctx.setFillColor(color);
  ctx.fillPath();
}

function addArcToPath(path, center, radius, startAngle, degrees) {
  let step = 4; 
  let endAngle = startAngle + degrees;
  for (let i = startAngle; i <= endAngle; i += step) {
     let rad = i * Math.PI / 180;
     let x = center.x + radius * Math.cos(rad);
     let y = center.y + radius * Math.sin(rad);
     let p = new Point(x, y);
     if (i === startAngle) path.move(p); else path.addLine(p);
  }
  let radEnd = endAngle * Math.PI / 180;
  path.addLine(new Point(center.x + radius * Math.cos(radEnd), center.y + radius * Math.sin(radEnd)));
}

function addBar(w, label, item) {
  let s = w.addStack();
  s.centerAlignContent();
  let l = s.addText(label);
  l.font = Font.boldSystemFont(12);
  l.size = new Size(55, 0); 
  l.textColor = Color.dynamic(THEME.textLight, THEME.textDark);
  
  let draw = new DrawContext();
  let barW = 200; let barH = 8;
  draw.size = new Size(barW, barH);
  draw.opaque = false;
  let p1 = new Path(); p1.addRoundedRect(new Rect(0,0,barW,barH), 4, 4);
  draw.addPath(p1); 
  draw.setFillColor(Color.dynamic(THEME.trackLight, THEME.trackDark)); 
  draw.fillPath();
  
  let dynamicColor = getGradientColor(item.val);
  if (item.val > 0) {
    let wPct = Math.min(item.val, 100);
    let fillW = (barW * wPct) / 100;
    let p2 = new Path(); p2.addRoundedRect(new Rect(0,0,fillW,barH), 4, 4);
    draw.addPath(p2); draw.setFillColor(dynamicColor); draw.fillPath();
  }
  let img = s.addImage(draw.getImage());
  img.cornerRadius = 4;
  img.imageSize = new Size(180, 8); 
  s.addSpacer(5); 
  let v = s.addText(item.str + "%");
  v.font = new Font("Menlo-Bold", 12); 
  v.textOpacity = 0.8;
  v.textColor = Color.dynamic(THEME.textLight, THEME.textDark); 
}

function getFlagEmoji(cc) {
  if (!cc) return "🌐";
  return String.fromCodePoint(...cc.toUpperCase().split('').map(c => 127397 + c.charCodeAt()));
}

function md5(string){function d(n,t){var r=(65535&n)+(65535&t);return(n>>16)+(t>>16)+(r>>16)<<16|65535&r}function f(n,t,r,e,o,u){return d((c=d(d(t,n),d(e,u)))<<(f=o)|c>>>32-f,r);var c,f}function g(n,t,r,e,o,u,c){return f(t&r|~t&e,n,t,o,u,c)}function h(n,t,r,e,o,u,c){return f(t&e|r&~e,n,t,o,u,c)}function i(n,t,r,e,o,u,c){return f(t^r^e,n,t,o,u,c)}function j(n,t,r,e,o,u,c){return f(r^(t|~e),n,t,o,u,c)}function k(n,t){var r,e,o,u,c;n[t>>5]|=128<<t%32,n[14+(t+64>>>9<<4)]=t;var f=1732584193,l=-271733879,a=-1732584194,v=271733878;for(r=0;r<n.length;r+=16)f=g(e=f,o=l,u=a,c=v,n[r],7,-680876936),v=g(v,f,l,a,n[r+1],12,-389564586),a=g(a,v,f,l,n[r+2],17,606105819),l=g(l,a,v,f,n[r+3],22,-1044525330),f=g(f,l,a,v,n[r+4],7,-176418897),v=g(v,f,l,a,n[r+5],12,1200080426),a=g(a,v,f,l,n[r+6],17,-1473231341),l=g(l,a,v,f,n[r+7],22,-45705983),f=g(f,l,a,v,n[r+8],7,1770035416),v=g(v,f,l,a,n[r+9],12,-1958414417),a=g(a,v,f,l,n[r+10],17,-42063),l=g(l,a,v,f,n[r+11],22,-1990404162),f=g(f,l,a,v,n[r+12],7,1804603682),v=g(v,f,l,a,n[r+13],12,-40341101),a=g(a,v,f,l,n[r+14],17,-1502002290),l=g(l,a,v,f,n[r+15],22,1236535329),f=h(f,l,a,v,n[r+1],5,-165796510),v=h(v,f,l,a,n[r+6],9,-1069501632),a=h(a,v,f,l,n[r+11],14,643717713),l=h(l,a,v,f,n[r],20,-373897302),f=h(f,l,a,v,n[r+5],5,-701558691),v=h(v,f,l,a,n[r+10],9,38016083),a=h(a,v,f,l,n[r+15],14,-660478335),l=h(l,a,v,f,n[r+4],20,-405537848),f=h(f,l,a,v,n[r+9],5,568446438),v=h(v,f,l,a,n[r+14],9,-1019803690),a=h(a,v,f,l,n[r+3],14,-187363961),l=h(l,a,v,f,n[r+8],20,1163531501),f=h(f,l,a,v,n[r+13],5,-1444681467),v=h(v,f,l,a,n[r+2],9,-51403784),a=h(a,v,f,l,n[r+7],14,1735328473),l=h(l,a,v,f,n[r+12],20,-1926607734),f=i(f,l,a,v,n[r+5],4,-378558),v=i(v,f,l,a,n[r+8],11,-2022574463),a=i(a,v,f,l,n[r+11],16,1839030562),l=i(l,a,v,f,n[r+14],23,-35309556),f=i(f,l,a,v,n[r+1],4,-1530992060),v=i(v,f,l,a,n[r+4],11,1272893353),a=i(a,v,f,l,n[r+7],16,-155497632),l=i(l,a,v,f,n[r+10],23,-1094730640),f=i(f,l,a,v,n[r+13],4,681279174),v=i(v,f,l,a,n[r],11,-358537222),a=i(a,v,f,l,n[r+3],16,-722521979),l=i(l,a,v,f,n[r+6],23,76029189),f=i(f,l,a,v,n[r+9],4,-640364487),v=i(v,f,l,a,n[r+12],11,-421815835),a=i(a,v,f,l,n[r+15],16,530742520),l=i(l,a,v,f,n[r+2],23,-995338651),f=j(f,l,a,v,n[r],6,-198630844),v=j(v,f,l,a,n[r+7],10,1126891415),a=j(a,v,f,l,n[r+14],15,-1416354905),l=j(l,a,v,f,n[r+5],21,-57434055),f=j(f,l,a,v,n[r+12],6,1700485571),v=j(v,f,l,a,n[r+3],10,-1894986606),a=j(a,v,f,l,n[r+10],15,-1051523),l=j(l,a,v,f,n[r+1],21,-2054922799),f=j(f,l,a,v,n[r+8],6,1873313359),v=j(v,f,l,a,n[r+15],10,-30611744),a=j(a,v,f,l,n[r+6],15,-1560198380),l=j(l,a,v,f,n[r+13],21,1309151649),f=j(f,l,a,v,n[r+4],6,-145523070),v=j(v,f,l,a,n[r+11],10,-1120210379),a=j(a,v,f,l,n[r+2],15,718787259),l=j(l,a,v,f,n[r+9],21,-343485551),f=d(f,e),l=d(l,o),a=d(a,u),v=d(v,c);return[f,l,a,v]}function l(n){var t,r="",e=32*n.length;for(t=0;t<e;t+=8)r+=String.fromCharCode(n[t>>5]>>>t%32&255);return r}function a(n){var t,r=[];for(r[(n.length>>2)-1]=void 0,t=0;t<r.length;t++)r[t]=0;var e=8*n.length;for(t=0;t<e;t+=8)r[t>>5]|=(255&n.charCodeAt(t/8))<<t%32;return r}function v(n){var t,r,e="0123456789abcdef",o="";for(r=0;r<n.length;r++)t=n.charCodeAt(r),o+=e.charAt(t>>>4&15)+e.charAt(15&t);return o}function m(n){return unescape(encodeURIComponent(n))}return v(l(k(a(m(string)),8*m(string).length)))}