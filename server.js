import app, { shutdown } from "./src/app.js";
import { config } from "./src/config/config.js";
import { spawn } from "child_process";

// 🎨 ตั้งค่าสีสำหรับ Console เพื่อความเท่
const c = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  bgBlue: "\x1b[44m",
};

let tunnelProcess = null;

const server = app.listen(config.port, () => {
  // Clear Console บ้างเพื่อให้ดูสะอาดตา (Optional)
  // console.clear(); 

  console.log("\n");
  console.log(`${c.cyan}╔════════════════════════════════════════════════════════════════╗${c.reset}`);
  console.log(`${c.cyan}║${c.reset}                                                                ${c.cyan}║${c.reset}`);
  console.log(`${c.cyan}║${c.reset}   🎬  ${c.bright}${c.magenta}DRAMABOX API SERVER${c.reset} ${c.dim}v1.2.0${c.reset}                              ${c.cyan}║${c.reset}`);
  console.log(`${c.cyan}║${c.reset}                                                                ${c.cyan}║${c.reset}`);
  console.log(`${c.cyan}╠════════════════════════════════════════════════════════════════╣${c.reset}`);
  console.log(`${c.cyan}║${c.reset}   🚀  สถานะ     : ${c.green}🟢 กำลังทำงาน (${config.nodeEnv})${c.reset}                     ${c.cyan}║${c.reset}`);
  console.log(`${c.cyan}║${c.reset}   🏠  ภายใน     : ${c.blue}http://localhost:${config.port}${c.reset}                       ${c.cyan}║${c.reset}`);
  console.log(`${c.cyan}║${c.reset}   📖  เอกสาร    : ${c.blue}http://localhost:${config.port}/${c.reset}                       ${c.cyan}║${c.reset}`);
  console.log(`${c.cyan}║${c.reset}   ❤️   สุขภาพ    : ${c.blue}http://localhost:${config.port}/health${c.reset}                 ${c.cyan}║${c.reset}`);
  console.log(`${c.cyan}╠════════════════════════════════════════════════════════════════╣${c.reset}`);
  console.log(`${c.cyan}║${c.reset}   ${c.bright}⚡ ฟีเจอร์ระบบ:${c.reset}                                             ${c.cyan}║${c.reset}`);
  console.log(`${c.cyan}║${c.reset}   ✓ จำกัดการเรียกใช้งาน (100 req/min)                        ${c.cyan}║${c.reset}`);
  console.log(`${c.cyan}║${c.reset}   ✓ บีบอัดข้อมูล (Gzip)                                      ${c.cyan}║${c.reset}`);
  console.log(`${c.cyan}║${c.reset}   ✓ ความปลอดภัยส่วนหัว (Helmet)                              ${c.cyan}║${c.reset}`);
  console.log(`${c.cyan}║${c.reset}   ✓ ระบบแคชข้อมูล (Caching)                                  ${c.cyan}║${c.reset}`);
  console.log(`${c.cyan}╚════════════════════════════════════════════════════════════════╝${c.reset}`);
  console.log("\n");

  startCloudflareTunnel();
});

// ฟังก์ชันเริ่ม Cloudflare Tunnel แยกออกมาให้ดูสะอาด
function startCloudflareTunnel() {
  console.log(`${c.yellow}⏳ [Cloudflare] กำลังเจาะอุโมงค์ เชื่อมต่อโลกภายนอก...${c.reset}`);
  
  // สั่งรัน cloudflared tunnel
  tunnelProcess = spawn("cloudflared", ["tunnel", "--url", `http://localhost:${config.port}`]);

  // ดักจับ log ที่ cloudflared พ่นออกมา
  tunnelProcess.stderr.on("data", (data) => {
    const output = data.toString();
    // Regex หา URL
    const urlMatch = output.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
    
    if (urlMatch) {
      const publicUrl = urlMatch[0];
      console.log(`\n${c.green}╔════════════════════════════════════════════════════════════════╗${c.reset}`);
      console.log(`${c.green}║  ☁️   CLOUDFLARE TUNNEL ESTABLISHED!                          ║${c.reset}`);
      console.log(`${c.green}╠════════════════════════════════════════════════════════════════╣${c.reset}`);
      console.log(`${c.green}║                                                                ║${c.reset}`);
      console.log(`${c.green}║  🌍  ONLINE URL : ${c.bright}${c.cyan}${publicUrl}${c.reset}${c.green}      ║${c.reset}`);
      console.log(`${c.green}║                                                                ║${c.reset}`);
      console.log(`${c.green}╚════════════════════════════════════════════════════════════════╝${c.reset}\n`);
    }
  });

  tunnelProcess.on("error", (err) => {
    console.log(`\n${c.red}❌ [Cloudflare Error] ไม่สามารถเริ่ม Tunnel ได้${c.reset}`);
    console.log(`${c.red}   👉 สาเหตุ: ${err.message}${c.reset}`);
    console.log(`${c.dim}   (ตรวจสอบว่าติดตั้ง cloudflared หรือยัง?)${c.reset}\n`);
  });
}

// Graceful Shutdown
const handleShutdown = (signal) => {
  console.log(`\n${c.yellow}🛑 [${signal}] กำลังปิดระบบอย่างนุ่มนวล...${c.reset}`);
  
  if (tunnelProcess) {
    console.log(`${c.dim}   └─ 🔌 ปิดการเชื่อมต่อ Cloudflare Tunnel...${c.reset}`);
    tunnelProcess.kill();
  }

  shutdown(server);
  
  setTimeout(() => {
    console.log(`${c.red}👋 บ๊ายบาย...${c.reset}`);
    process.exit(0);
  }, 1000);
};

process.on("SIGTERM", () => handleShutdown("SIGTERM"));
process.on("SIGINT", () => handleShutdown("SIGINT"));

// Handle uncaught errors
process.on("uncaughtException", (err) => {
  console.error(`\n${c.bgBlue}${c.bright} ☠️  FATAL ERROR (UNCAUGHT EXCEPTION) ${c.reset}`);
  console.error(err);
  handleShutdown("UNCAUGHT_EXCEPTION");
});

process.on("unhandledRejection", (reason, promise) => {
  console.error(`\n${c.bgBlue}${c.bright} ⚠️  UNHANDLED REJECTION ${c.reset}`);
  console.error("At:", promise, "Reason:", reason);
});
