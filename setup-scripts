import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const run = (cmd) => execSync(cmd, { stdio: 'inherit' });

// 1. Kéo template & cài dependencies
run('pnpm dlx degit Nguyhizthatgud/vite-project-template src -f');
run('pnpm dlx degit Nguyhizthatgud/scss-7-1-template src/styles -f');
run('pnpm add -D sass @types/node');

// 2. Xóa file mẫu dư thừa của Vite
['src/App.css', 'src/index.css', 'src/assets/react.svg'].forEach((f) => {
  fs.rmSync(f, { force: true });
});

// 3. Cập nhật import SCSS vào main.tsx / main.jsx
['src/main.tsx', 'src/main.jsx'].forEach((f) => {
  if (!fs.existsSync(f)) return;
  const content = fs
    .readFileSync(f, 'utf8')
    .replace(/['"]\.\/index\.css['"]/, "'@/styles/main.scss'");
  fs.writeFileSync(f, content);
});

// 4. Xóa import App.css khỏi App.tsx / App.jsx
['src/App.tsx', 'src/App.jsx'].forEach((f) => {
  if (!fs.existsSync(f)) return;
  const content = fs
    .readFileSync(f, 'utf8')
    .split('\n')
    .filter((line) => !line.includes('App.css'))
    .join('\n');
  fs.writeFileSync(f, content);
});

// 5. Tự động tạo abstracts/_index.scss nếu repo template chưa có (để @use "@/styles/abstracts" chạy ngay)
const absDir = 'src/styles/abstracts';
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

// 6. Cấu hình Alias @/* cho TypeScript hoặc JavaScript
const tsFile = ['tsconfig.app.json', 'tsconfig.json'].find(
  (f) => fs.existsSync(f) && fs.readFileSync(f, 'utf8').includes('compilerOptions')
);

if (tsFile) {
  let ts = fs.readFileSync(tsFile, 'utf8');
  if (!ts.includes('@/*')) {
    ts = ts.replace(
      /("compilerOptions"\s*:\s*\{)/,
      '$1\n    "baseUrl": ".",\n    "paths": { "@/*": ["./src/*"] },'
    );
    fs.writeFileSync(tsFile, ts);
  }
} else if (!fs.existsSync('jsconfig.json')) {
  fs.writeFileSync(
    'jsconfig.json',
    JSON.stringify(
      {
        compilerOptions: { baseUrl: '.', paths: { '@/*': ['./src/*'] } },
        include: ['src'],
      },
      null,
      2
    ) + '\n'
  );
}

// 7. Inject Alias + SCSS 7-1 + Dev Server vào vite.config (giữ nguyên cấu hình gốc của Vite)
const cfgFile = ['vite.config.ts', 'vite.config.js', 'vite.config.mts', 'vite.config.mjs'].find(
  (f) => fs.existsSync(f)
);

if (cfgFile) {
  let cfg = fs.readFileSync(cfgFile, 'utf8');
  if (!cfg.includes('alias:')) {
    const urlImport = cfg.includes('fileURLToPath')
      ? ''
      : "import { fileURLToPath, URL } from 'node:url';\n";

    const injectBlock = `defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        additionalData: (content, filename) => {
          const normalized = filename.replace(/\\\\/g, '/');
          if (
            normalized.includes('/styles/abstracts/') ||
            normalized.endsWith('/styles/main.scss')
          ) {
            return content;
          }
          return \`@use "@/styles/abstracts" as *;\\n\${content}\`;
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },`;

    cfg = urlImport + cfg.replace(/defineConfig\(\s*\{/, () => injectBlock);
    fs.writeFileSync(cfgFile, cfg);
  }
}

// 8. Dọn dẹp đệ quy .gitkeep, .history và .gitignore dư thừa trong src
function cleanDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (
      entry.name === '.gitkeep' ||
      entry.name === '.history' ||
      (dir.replace(/\\/g, '/') === 'src/styles' && entry.name === '.gitignore')
    ) {
      fs.rmSync(fullPath, { recursive: true, force: true });
    } else if (entry.isDirectory()) {
      cleanDir(fullPath);
    }
  }
}

cleanDir('src');
console.log('\n[OK] Setup Vite + SCSS 7-1 hoan tat!');