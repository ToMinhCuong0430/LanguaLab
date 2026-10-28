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

// 1. Danh sách các routes kiểm thử
const ROUTES = [
  { name: 'home', path: '/' },
  { name: 'dang-nhap', path: '/dang-nhap' },
  { name: 'dang-ky', path: '/dang-ky' },
  { name: 'quen-mat-khau', path: '/quen-mat-khau' },
  { name: 'dieu-khoan', path: '/dieu-khoan' },
  { name: 'chinh-sach', path: '/chinh-sach-quyen-rieng-tu' },
  { name: 'cai-dat', path: '/cai-dat' },
  { name: 'go-cau', path: '/go-cau' },
  { name: 'go-cau-detail', path: '/go-cau/cong-nghe' },
  { name: 'tu-vung', path: '/tu-vung' },
  { name: 'tu-dien', path: '/tu-dien' },
  { name: 'tu-dien-detail', path: '/tu-dien/serendipity' },
  { name: 'ngu-phap', path: '/ngu-phap' },
  { name: 'ngu-phap-detail', path: '/ngu-phap/present-perfect' },
  { name: 'video-podcast', path: '/video-podcast' },
  { name: 'video-podcast-detail', path: '/video-podcast/ielts-speaking-tips' },
  { name: 'doc-dich', path: '/doc-dich' },
  { name: 'doc-dich-detail', path: '/doc-dich/the-little-prince' },
  { name: 'luyen-thi', path: '/luyen-thi' },
  { name: 'luyen-thi-ielts', path: '/luyen-thi/ielts' },
  { name: 'luyen-thi-reading', path: '/luyen-thi/ielts/reading' },
  { name: 'luyen-thi-lam-bai', path: '/luyen-thi/ielts/lam-bai/ielts-reading-test-01' },
  { name: 'yeu-cau-tinh-nang', path: '/yeu-cau-tinh-nang' },
  { name: 'yeu-cau-detail', path: '/yeu-cau-tinh-nang/feat-01' },
];

const VIEWPORTS = [
  { name: '375', width: 375, height: 812 },
  { name: '768', width: 768, height: 1024 },
  { name: '1280', width: 1280, height: 800 },
];

const THEMES = ['light', 'dark'];

// Chờ server sẵn sàng
async function waitForServer(url, timeoutMs = 45000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 404 || res.status === 302) return true;
    } catch (e) {
      // Server not ready yet
    }
    await new Promise((r) => setTimeout(r, 600));
  }
  throw new Error(`Server at ${url} failed to start within ${timeoutMs}ms`);
}

async function runQA() {
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

  serverProcess.stdout.on('data', (d) => {
    // console.log(`[server] ${d.toString().trim()}`);
  });
  serverProcess.stderr.on('data', (d) => {
    // console.error(`[server err] ${d.toString().trim()}`);
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
      b1_b2_pages: [],
      b3_keyboard: {},
      b4_reduced_motion: {},
      b5_zoom200: {},
      b6_banner: [],
    };

    // ==================== B1 & B2: TOÀN BỘ ROUTE X 3 VIEWPORTS X 2 THEMES ====================
    console.log('\n--- Running B1 (Responsive + Console) & B2 (Axe Core) ---');
    const context = await browser.newContext();
    const page = await context.newPage();

    for (const route of ROUTES) {
      console.log(`\nTesting Route: ${route.path} (${route.name})`);
      const routeResult = {
        name: route.name,
        path: route.path,
        runs: [],
      };

      for (const vp of VIEWPORTS) {
        await page.setViewportSize({ width: vp.width, height: vp.height });

        for (const theme of THEMES) {
          const consoleErrors = [];
          const consoleWarnings = [];

          const onConsole = (msg) => {
            const text = msg.text();
            if (msg.type() === 'error') {
              consoleErrors.push(text);
            } else if (msg.type() === 'warning') {
              consoleWarnings.push(text);
            }
          };

          page.on('console', onConsole);

          await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'domcontentloaded' });
          await page.waitForTimeout(500);

          // Áp theme
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

          // B1.1: Kiểm tra cuộn ngang
          const scrollCheck = await page.evaluate(() => {
            const docWidth = document.documentElement.scrollWidth;
            const winWidth = window.innerWidth;
            return {
              scrollWidth: docWidth,
              innerWidth: winWidth,
              hasHorizontalScroll: docWidth > winWidth + 1, // cho phép subpixel rounding 1px
            };
          });

          // B1.2: Chụp ảnh màn hình
          const screenshotName = `${route.name}_${vp.name}_${theme}.png`;
          const screenshotPath = path.join(SCREENSHOTS_DIR, screenshotName);
          await page.screenshot({ path: screenshotPath, fullPage: false });

          // B2: Chạy axe-core
          await page.evaluate(axeSource);
          const axeResults = await page.evaluate(async () => {
            const r = await window.axe.run(document, {
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

          page.off('console', onConsole);

          const criticalOrSerious = axeResults.violations.filter(
            (v) => v.impact === 'critical' || v.impact === 'serious'
          );

          routeResult.runs.push({
            viewport: vp.name,
            theme,
            hasHorizontalScroll: scrollCheck.hasHorizontalScroll,
            scrollWidth: scrollCheck.scrollWidth,
            innerWidth: scrollCheck.innerWidth,
            consoleErrors: consoleErrors.slice(0, 5),
            axeIssuesCount: criticalOrSerious.length,
            axeCriticalSerious: criticalOrSerious,
            screenshot: screenshotName,
          });

          process.stdout.write(`  [${vp.name}|${theme}] Scroll: ${scrollCheck.hasHorizontalScroll ? 'FAIL' : 'OK'}, Axe Serious: ${criticalOrSerious.length} `);
        }
      }
      results.b1_b2_pages.push(routeResult);
    }

    // ==================== B3: KIỂM THỬ BÀN PHÍM & FOCUS ====================
    console.log('\n\n--- Running B3: Keyboard Navigation & Focus Trap ---');
    const b3Pages = ['/', '/luyen-thi/ielts', '/tu-vung', '/tu-dien'];
    for (const pPath of b3Pages) {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(`${BASE_URL}${pPath}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);

      // Mô phỏng nhấn phím Tab 12 lần
      const focusResults = [];
      for (let i = 0; i < 12; i++) {
        await page.keyboard.press('Tab');
        const focusedInfo = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el || el === document.body) return null;
          const style = window.getComputedStyle(el);
          const hasVisibleFocus =
            style.outlineStyle !== 'none' ||
            style.boxShadow.includes('0 0') ||
            style.boxShadow.length > 5 ||
            el.classList.contains('focus-visible');
          return {
            tag: el.tagName.toLowerCase(),
            text: (el.textContent || '').trim().substring(0, 30),
            hasVisibleFocus,
          };
        });
        if (focusedInfo) focusResults.push(focusedInfo);
      }
      results.b3_keyboard[pPath] = focusResults;
      console.log(`  Tab check on ${pPath}: ${focusResults.length} elements received focus.`);
    }

    // Kiểm tra Modal Focus Trap trên trang /luyen-thi/ielts/lam-bai/ielts-reading-test-01
    console.log('  Testing modal focus trap on exam confirmation...');
    await page.goto(`${BASE_URL}/luyen-thi/ielts/lam-bai/ielts-reading-test-01`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);

    // Mở modal nộp bài
    const openBtn = await page.$('button:has-text("Nộp bài")');
    if (openBtn) {
      await openBtn.click();
      await page.waitForTimeout(400);

      // Kiểm tra xem focus có nằm trong modal
      const isInsideModal = await page.evaluate(() => {
        const modal = document.querySelector('.base-modal-container');
        const active = document.activeElement;
        return modal && modal.contains(active);
      });

      // Nhấn Tab 5 lần, xem có thoát ra ngoài không
      let trapped = true;
      for (let t = 0; t < 5; t++) {
        await page.keyboard.press('Tab');
        const stillIn = await page.evaluate(() => {
          const modal = document.querySelector('.base-modal-container');
          return modal && modal.contains(document.activeElement);
        });
        if (!stillIn) trapped = false;
      }

      results.b3_keyboard.modal_trap = {
        isInitiallyInsideModal: !!isInsideModal,
        isFocusTrapped: trapped,
      };
      console.log(`  Modal focus trap: ${trapped ? 'PASS' : 'FAIL'}`);

      // Bấm Esc để đóng
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      const isClosed = await page.evaluate(() => !document.querySelector('.base-modal-container'));
      results.b3_keyboard.modal_esc_close = isClosed;
      console.log(`  Modal Esc close: ${isClosed ? 'PASS' : 'FAIL'}`);
    }

    // ==================== B4: PREFERS-REDUCED-MOTION ====================
    console.log('\n--- Running B4: Prefers Reduced Motion ---');
    const rmContext = await browser.newContext({
      reducedMotion: 'reduce',
    });
    const rmPage = await rmContext.newPage();
    await rmPage.setViewportSize({ width: 1280, height: 800 });
    await rmPage.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await rmPage.waitForTimeout(800);

    const animReport = await rmPage.evaluate(() => {
      const anims = document.getAnimations();
      const infiniteRunning = anims.filter((a) => {
        const timing = a.effect ? a.effect.getComputedTiming() : null;
        return timing && timing.iterations === Infinity && a.playState === 'running';
      });
      return {
        totalAnimations: anims.length,
        infiniteRunningCount: infiniteRunning.length,
      };
    });
    results.b4_reduced_motion = animReport;
    console.log(`  Reduced motion infinite running animations: ${animReport.infiniteRunningCount} (Target: 0)`);
    await rmContext.close();

    // ==================== B5: FONT ZOOM 200% ====================
    console.log('\n--- Running B5: 200% Font Zoom ---');
    const zoomContext = await browser.newContext();
    const zoomPage = await zoomContext.newPage();
    await zoomPage.setViewportSize({ width: 1280, height: 800 });

    for (const zPath of ['/', '/luyen-thi/ielts']) {
      await zoomPage.goto(`${BASE_URL}${zPath}`, { waitUntil: 'domcontentloaded' });
      await zoomPage.evaluate(() => {
        document.documentElement.style.fontSize = '32px'; // Phóng to 200% so với 16px
      });
      await zoomPage.waitForTimeout(500);

      const zoomCheck = await zoomPage.evaluate(() => {
        return {
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
          overflow: document.documentElement.scrollWidth > window.innerWidth + 2,
        };
      });

      const zName = `zoom200_${zPath === '/' ? 'home' : 'ielts'}.png`;
      await zoomPage.screenshot({ path: path.join(SCREENSHOTS_DIR, zName) });
      results.b5_zoom200[zPath] = {
        ...zoomCheck,
        screenshot: zName,
      };
      console.log(`  200% Zoom check on ${zPath}: Overflow=${zoomCheck.overflow}`);
    }
    await zoomContext.close();

    // ==================== B6: BANNER 3 BUỔI ====================
    console.log('\n--- Running B6: Banner 3 Periods (Sáng / Chiều / Tối) ---');
    const bannerPeriods = ['sang', 'chieu', 'toi'];
    const bannerViewports = [375, 768, 1280];

    for (const period of bannerPeriods) {
      for (const w of bannerViewports) {
        await page.setViewportSize({ width: w, height: 800 });
        await page.goto(`${BASE_URL}/?period=${period}`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(400);

        const bannerInfo = await page.evaluate(() => {
          const banner = document.getElementById('home-greeting-banner');
          if (!banner) return null;
          const rect = banner.getBoundingClientRect();
          const btn = banner.querySelector('.banner-action-btn');
          const btnRect = btn ? btn.getBoundingClientRect() : null;
          return {
            bannerWidth: rect.width,
            bannerHeight: rect.height,
            btnWidth: btnRect ? btnRect.width : 0,
            btnHeight: btnRect ? btnRect.height : 0,
            isBtnWrapped: btnRect ? btnRect.height > 60 : false,
          };
        });

        const bName = `banner_${period}_${w}px.png`;
        const bannerElement = await page.$('#home-greeting-banner');
        if (bannerElement) {
          await bannerElement.screenshot({ path: path.join(SCREENSHOTS_DIR, bName) });
        }

        results.b6_banner.push({
          period,
          width: w,
          bannerInfo,
          screenshot: bName,
        });
        console.log(`  Banner ${period} @ ${w}px: ButtonWrapped=${bannerInfo?.isBtnWrapped}`);
      }
    }

    await browser.close();

    // Lưu báo cáo JSON
    fs.writeFileSync(
      path.join(__dirname, 'qa_report.json'),
      JSON.stringify(results, null, 2),
      'utf8'
    );
    console.log('\n🎉 ALL QA TESTS FINISHED! Report saved to frontend/qa_report.json');
  } finally {
    serverProcess.kill('SIGINT');
  }
}

runQA().catch((err) => {
  console.error('QA Test execution failed:', err);
  process.exit(1);
});
