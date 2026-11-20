import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const run = (cmd) => execSync(cmd, { stdio: 'inherit' });

// Tự nhận diện dự án dùng src/ hay thư mục gốc
const hasSrc = fs.existsSync('src');
const stylesDir = hasSrc ? 'src/styles' : 'styles';
const appDir = hasSrc ? 'src/app' : 'app';

// 1. Kéo bộ SCSS 7-1 và cài Sass
run(`pnpm dlx degit Nguyhizthatgud/scss-7-1-template ${stylesDir} -f`);
run('pnpm add -D sass');

// 2. Xóa file CSS mặc định của Next.js App Router
[`${appDir}/globals.css`, `${appDir}/page.module.css`].forEach((f) => {
  fs.rmSync(f, { force: true });
});

// 3. Thay thế import globals.css bằng @/styles/main.scss trong layout.tsx / layout.jsx
[`${appDir}/layout.tsx`, `${appDir}/layout.jsx`].forEach((f) => {
  if (!fs.existsSync(f)) return;
  const content = fs
    .readFileSync(f, 'utf8')
    .replace(/['"]\.\/globals\.css['"]/, "'@/styles/main.scss'");
  fs.writeFileSync(f, content);
});

// 4. Gỡ import page.module.css khỏi page.tsx / page.jsx
[`${appDir}/page.tsx`, `${appDir}/page.jsx`].forEach((f) => {
  if (!fs.existsSync(f)) return;
  const content = fs
    .readFileSync(f, 'utf8')
    .split('\n')
    .filter((line) => !line.includes('page.module.css'))
    .join('\n');
  fs.writeFileSync(f, content);
});

// 5. Tự tạo abstracts/_index.scss nếu chưa có để @use "abstracts" hoạt động ngay
const absDir = path.join(stylesDir, 'abstracts');
if (fs.existsSync(absDir) && !fs.existsSync(path.join(absDir, '_index.scss'))) {
  const forwards = fs
    .readdirSync(absDir)
    .filter((f) => f.startsWith('_') && f.endsWith('.scss'))
    .map((f) => `@forward '${f.slice(1, -5)}';`)
    .join('\n');
  if (forwards) {
    fs.writeFileSync(path.join(absDir, '_index.scss'), `${forwards}\n`);
  }
}

// Tránh trùng namespace nếu main.scss đã viết sẵn @use "abstracts" as *;
const mainScss = path.join(stylesDir, 'main.scss');
if (fs.existsSync(mainScss)) {
  const cleaned = fs
    .readFileSync(mainScss, 'utf8')
    .replace(/^@use\s+['"]abstracts['"]\s+as\s+\*;\s*\r?\n?/m, '');
  fs.writeFileSync(mainScss, cleaned);
}

// 6. Inject sassOptions vào next.config (hỗ trợ .ts, .mjs, .js và giữ nguyên config gốc)
const cfgFile = ['next.config.ts', 'next.config.mjs', 'next.config.js'].find((f) =>
  fs.existsSync(f)
);

if (cfgFile) {
  let cfg = fs.readFileSync(cfgFile, 'utf8');
  if (!cfg.includes('sassOptions')) {
    const isCjs = cfg.includes('module.exports') && !cfg.includes('export default');
    const pathImport = cfg.includes('node:path') || cfg.includes("'path'") || cfg.includes('"path"')
      ? ''
      : isCjs
        ? "const path = require('node:path');\n"
        : "import path from 'node:path';\n";

    const normalizedStyles = stylesDir.replace(/\\/g, '/');
    const sassBlock = `$&\n  sassOptions: {\n    includePaths: [path.join(process.cwd(), '${normalizedStyles}')],\n    silenceDeprecations: ['legacy-js-api'],\n    prependData: '@use "abstracts" as *;',\n  },`;

    cfg = pathImport + cfg.replace(/const\s+nextConfig(?:\s*:\s*NextConfig)?\s*=\s*\{/, sassBlock);
    fs.writeFileSync(cfgFile, cfg);
  }
}

// 7. Dọn dẹp .gitkeep, .history và .gitignore dư thừa trong thư mục styles
function cleanDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (
      entry.name === '.gitkeep' ||
      entry.name === '.history' ||
      (dir.replace(/\\/g, '/') === stylesDir && entry.name === '.gitignore')
    ) {
      fs.rmSync(fullPath, { recursive: true, force: true });
    } else if (entry.isDirectory()) {
      cleanDir(fullPath);
    }
  }
}

cleanDir(stylesDir);
console.log('\n[OK] Setup Next.js + SCSS 7-1 hoan tat!');