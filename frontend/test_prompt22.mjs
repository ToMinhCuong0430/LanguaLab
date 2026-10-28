import { chromium } from 'playwright';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const SCREENSHOTS_DIR = path.join(__dirname, 'qa-screenshots');
const AXE_PATH = path.join(__dirname, 'node_modules', 'axe-core', 'axe.min.js');
const axeSource = fs.readFileSync(AXE_PATH, 'utf8');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const PERIODS = ['sang', 'chieu', 'toi'];
const VIEWPORTS = [
  { name: '375', width: 375, height: 812 },
  { name: '768', width: 768, height: 1024 },
  { name: '1440', width: 1440, height: 900 },
];
const THEMES = ['light', 'dark'];

async function waitForServer(url, timeoutMs = 45000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 404 || res.status === 302) return true;
    } catch (e) {}
    await new Promise((r) => setTimeout(r, 600));
  }
  throw new Error(`Server at ${url} failed to start within ${timeoutMs}ms`);
}

async function runPrompt22QA() {
  console.log('🚀 Starting Nuxt production server in mock mode...');
  const serverProcess = spawn('node', ['.output/server/index.mjs'], {
    cwd: __dirname,
    env: {
      ...process.env,
      PORT: String(PORT),
      HOST: '127.0.0.1',
      NITRO_HOST: '127.0.0.1',
      NUXT_PUBLIC_USE_MOCK: 'true',
      NODE_ENV: 'production',
    },
    stdio: 'pipe',
  });

  try {
    await waitForServer(BASE_URL);
    console.log(`✅ Nuxt server is up at ${BASE_URL}`);

    const browser = await chromium.launch({
      executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const results = {
      screenshots_18: [],
      animation_stability: [],
      axe_results: {},
      keyboard_tab_order: [],
      reduced_motion_count: 0,
    };

    const context = await browser.newContext();
    const page = await context.newPage();

    // 1. CHỤP 18 ẢNH & ĐO LƯỜNG (3 BUỔI X 3 VIEWPORTS X 2 THEMES)
    console.log('\n--- 1. Testing 18 Matrix States (3 Periods x 3 Viewports x 2 Themes) ---');
    for (const period of PERIODS) {
      for (const vp of VIEWPORTS) {
        for (const theme of THEMES) {
          await page.setViewportSize({ width: vp.width, height: vp.height });
          await page.goto(`${BASE_URL}/?period=${period}`, { waitUntil: 'domcontentloaded' });
          await page.waitForTimeout(400);

          if (theme === 'dark') {
            await page.evaluate(() => {
              document.documentElement.classList.add('dark');
              document.documentElement.setAttribute('data-theme', 'dark');
            });
          } else {
            await page.evaluate(() => {
              document.documentElement.classList.remove('dark');
              document.documentElement.setAttribute('data-theme', 'light');
            });
          }
          await page.waitForTimeout(300);

          // Đo cuộn ngang
          const scrollInfo = await page.evaluate(() => ({
            scrollWidth: document.documentElement.scrollWidth,
            innerWidth: window.innerWidth,
            hasHorizontalScroll: document.documentElement.scrollWidth > window.innerWidth + 1,
          }));

          // Đo nút "Học ngay" và nút "Luyện đề IELTS"
          const buttonInfo = await page.evaluate(() => {
            const banner = document.getElementById('home-hero-banner');
            if (!banner) return null;
            const buttons = banner.querySelectorAll('a, button');
            const res = [];
            buttons.forEach((btn) => {
              const rect = btn.getBoundingClientRect();
              const text = (btn.textContent || '').trim();
              // Kiểm tra xem chữ có bị ngắt dòng không: scrollHeight > clientHeight hoặc đo dòng
              const isWrapped = btn.clientHeight > 50 && rect.width < 140; // Chiều cao 1 dòng chuẩn là ~44-48px
              res.push({
                text: text.substring(0, 30),
                width: rect.width,
                height: rect.height,
                isWrapped,
              });
            });
            return res;
          });

          // Chụp ảnh màn hình lần 1
          const screenshotName = `hero_${period}_${vp.name}px_${theme}.png`;
          const screenshotPath = path.join(SCREENSHOTS_DIR, screenshotName);
          await page.screenshot({ path: screenshotPath, fullPage: false });

          // Chụp ảnh kiểm tra toạ độ animation lần 2 sau 2 giây (chỉ chụp ở 1440px desktop)
          let stabilityCheck = null;
          if (vp.name === '1440' && theme === 'light') {
            await page.waitForTimeout(2000);
            const screenshotT2 = `hero_${period}_${vp.name}px_${theme}_t2.png`;
            await page.screenshot({ path: path.join(SCREENSHOTS_DIR, screenshotT2), fullPage: false });

            // Kiểm tra toạ độ của mascot và mặt trời
            stabilityCheck = await page.evaluate(() => {
              const banner = document.getElementById('home-hero-banner');
              const svg = banner?.querySelector('.hero-scene-wrapper svg');
              if (!svg) return null;
              const bbox = svg.getBoundingClientRect();
              return {
                svgLeft: bbox.left,
                svgTop: bbox.top,
                svgWidth: bbox.width,
                svgHeight: bbox.height,
              };
            });
            results.animation_stability.push({ period, stabilityCheck });
          }

          results.screenshots_18.push({
            period,
            viewport: vp.name,
            theme,
            scrollInfo,
            buttonInfo,
            screenshot: screenshotName,
          });

          console.log(
            `  [${period}|${vp.name}px|${theme}] Scroll: ${
              scrollInfo.hasHorizontalScroll ? 'FAIL' : 'OK'
            }, Buttons: ${buttonInfo?.length || 0}, Saved: ${screenshotName}`
          );
        }
      }
    }

    // 2. CHẠY AXE-CORE TRÊN TRANG CHỦ Ở 2 THEMES
    console.log('\n--- 2. Running Axe-Core Accessibility Audit ---');
    for (const theme of ['light', 'dark']) {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);

      if (theme === 'dark') {
        await page.evaluate(() => {
          document.documentElement.classList.add('dark');
          document.documentElement.setAttribute('data-theme', 'dark');
        });
      } else {
        await page.evaluate(() => {
          document.documentElement.classList.remove('dark');
          document.documentElement.setAttribute('data-theme', 'light');
        });
      }
      await page.waitForTimeout(200);

      await page.evaluate(axeSource);
      const axeRes = await page.evaluate(async () => {
        const r = await window.axe.run(document.getElementById('home-hero-banner') || document, {
          runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'],
          },
        });
        return {
          violations: r.violations.map((v) => ({
            id: v.id,
            impact: v.impact,
            description: v.description,
            nodesCount: v.nodes.length,
          })),
        };
      });

      const criticalSerious = axeRes.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );
      results.axe_results[theme] = {
        totalViolations: axeRes.violations.length,
        criticalSeriousCount: criticalSerious.length,
        criticalSerious,
      };
      console.log(`  Theme ${theme}: ${criticalSerious.length} critical/serious violations.`);
    }

    // 3. TAB XUYÊN BANNER
    console.log('\n--- 3. Testing Tab Navigation Through Hero Banner ---');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // Bấm phím Tab để focus vào banner
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        const banner = document.getElementById('home-hero-banner');
        if (!el || !banner || !banner.contains(el)) return null;
        return {
          tag: el.tagName.toLowerCase(),
          text: (el.textContent || '').trim().substring(0, 30),
          isFocusVisible: el.matches(':focus-visible'),
        };
      });
      if (focused) {
        results.keyboard_tab_order.push(focused);
        console.log(`  Focused in banner [${focused.tag}]: "${focused.text}"`);
      }
    }

    // 4. EMULATE PREFERS-REDUCED-MOTION
    console.log('\n--- 4. Testing Prefers-Reduced-Motion ---');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const reducedMotionAnims = await page.evaluate(() => {
      const banner = document.getElementById('home-hero-banner');
      if (!banner) return 0;
      const allEls = banner.querySelectorAll('*');
      let running = 0;
      allEls.forEach((el) => {
        const anims = el.getAnimations ? el.getAnimations() : [];
        anims.forEach((a) => {
          if (a.playState === 'running' && a.effect?.getTiming?.()?.iterations === Infinity) {
            running++;
          }
        });
      });
      return running;
    });
    results.reduced_motion_count = reducedMotionAnims;
    console.log(`  Reduced motion infinite running animations in banner: ${reducedMotionAnims} (Target: 0)`);

    await browser.close();

    fs.writeFileSync(
      path.join(__dirname, 'prompt22_report.json'),
      JSON.stringify(results, null, 2),
      'utf8'
    );
    console.log('\n🎉 ALL CHECKS COMPLETED! Report saved to frontend/prompt22_report.json');
  } finally {
    serverProcess.kill('SIGTERM');
  }
}

runPrompt22QA().catch((err) => {
  console.error('QA Test failed:', err);
  process.exit(1);
});
