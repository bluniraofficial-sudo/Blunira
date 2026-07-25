const fs = require('fs');

// Fix privacy and terms pages: replace hardcoded dark bg/text colors
const files = [
  './src/app/privacy/page.tsx',
  './src/app/terms/page.tsx',
];

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix root div background
  content = content.replace(
    /className="min-h-screen bg-\[#020509\] text-\[#e2eaf4\]/g,
    'className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]'
  );
  // Fix header background
  content = content.replace(
    /backdrop-blur-md bg-\[#020509\]\/75 border-b border-\[var\(--card-border\)\]/g,
    'backdrop-blur-xl bg-[var(--bg-base)]/80 border-b border-[var(--card-border)] transition-colors duration-300'
  );
  // Fix header logo text
  content = content.replace(/text-xl text-white tracking-tight/g, 'text-xl tracking-tight text-[var(--text-primary)]');
  // Fix nav link hover
  content = content.replace(/hover:text-white transition-colors/g, 'hover:text-[var(--text-primary)] transition-colors');
  // Fix header logo icon bg
  content = content.replace(/bg-white\/\[0\.03\] border border-\[var\(--card-border\)\] flex items-center justify-center overflow-hidden flex-shrink-0/g, 
    'bg-[var(--card-bg)] border border-[var(--card-border)] flex items-center justify-center overflow-hidden flex-shrink-0');
  // Fix Brand Portal button
  content = content.replace(
    /border border-\[var\(--card-border\)\] hover:border-cyan-500\/30 bg-white\/\[0\.02\] hover:bg-cyan-500\/5 text-sm font-bold transition-all text-white flex items-center gap-2 cursor-pointer/g,
    'border border-[var(--card-border)] hover:border-cyan-500/30 bg-[var(--card-bg)] hover:bg-cyan-500/5 text-sm font-bold transition-all text-[var(--text-primary)] flex items-center gap-2 cursor-pointer'
  );
  // Fix h1 text-white
  content = content.replace(/text-4xl sm:text-5xl font-display font-black text-white leading-tight tracking-tight/g,
    'text-4xl sm:text-5xl font-display font-black text-[var(--text-primary)] leading-tight tracking-tight');
  // Fix h2 text-white
  content = content.replace(/font-display font-black text-white/g, 'font-display font-black text-[var(--text-primary)]');
  content = content.replace(/font-display font-black text-sm text-white/g, 'font-display font-black text-sm text-[var(--text-primary)]');
  // Fix h3 text-white
  content = content.replace(/text-base font-bold text-white/g, 'text-base font-bold text-[var(--text-primary)]');
  content = content.replace(/text-xs font-bold text-white/g, 'text-xs font-bold text-[var(--text-primary)]');
  content = content.replace(/text-sm font-bold text-white/g, 'text-sm font-bold text-[var(--text-primary)]');
  // Fix footer bg
  content = content.replace(/border-t border-\[var\(--card-border\)\] bg-\[#020509\] py-8/g,
    'border-t border-[var(--card-border)] bg-[var(--bg-surface)] py-8');
  content = content.replace(/border-t border-\[var\(--card-border\)\] bg-\[#020509\] pt-6 pb-8/g,
    'border-t border-[var(--card-border)] bg-[var(--bg-surface)] pt-6 pb-8');
  // Fix footer text colors
  content = content.replace(/hover:text-\[#e2eaf4\] transition-colors/g, 'hover:text-[var(--text-primary)] transition-colors');
  content = content.replace(/text-xs text-\[#2e4a62\] font-semibold/g, 'text-xs text-[var(--text-muted)] font-semibold');
  content = content.replace(/text-\[8px\] font-bold text-cyan-600/g, 'text-[8px] font-bold text-cyan-500');
  // Fix section bg overlays
  content = content.replace(/bg-white\/\[0\.01\]/g, 'bg-[var(--card-bg)]');
  
  fs.writeFileSync(filePath, content);
  console.log(`Fixed: ${filePath}`);
});

// Also add metadata exports to privacy and terms
const privacyContent = fs.readFileSync('./src/app/privacy/page.tsx', 'utf8');
if (!privacyContent.includes('export const metadata')) {
  const updated = privacyContent.replace(
    'import Link from "next/link";',
    `import type { Metadata } from "next";\nimport Link from "next/link";\n\nexport const metadata: Metadata = {\n  title: "Privacy Policy — Blunira QR Hydration Marketing",\n  description: "Read Blunira\\'s privacy policy to understand how we collect, process, and protect your data in our QR hydration marketing platform.",\n  alternates: { canonical: "https://blunira.com/privacy" },\n};`
  );
  fs.writeFileSync('./src/app/privacy/page.tsx', updated);
  console.log('Added metadata to privacy page');
}

const termsContent = fs.readFileSync('./src/app/terms/page.tsx', 'utf8');
if (!termsContent.includes('export const metadata')) {
  const updated = termsContent.replace(
    'import Link from "next/link";',
    `import type { Metadata } from "next";\nimport Link from "next/link";\n\nexport const metadata: Metadata = {\n  title: "Terms of Service — Blunira QR Hydration Marketing",\n  description: "Review Blunira\\'s terms of service governing use of our QR hydration marketing platform, campaign management, and data processing agreements.",\n  alternates: { canonical: "https://blunira.com/terms" },\n};`
  );
  fs.writeFileSync('./src/app/terms/page.tsx', updated);
  console.log('Added metadata to terms page');
}
