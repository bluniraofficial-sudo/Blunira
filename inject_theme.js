const fs = require('fs');
const paths = [
  './src/app/about/page.tsx', 
  './src/app/privacy/page.tsx', 
  './src/app/terms/page.tsx', 
  './src/app/contact/page.tsx'
];

paths.forEach(path => {
  let content = fs.readFileSync(path, 'utf8');
  
  if (!content.includes('import { ThemeToggle }')) {
    content = content.replace(
      'import Link from "next/link";', 
      'import Link from "next/link";\nimport { ThemeToggle } from "@/components/theme-toggle";'
    );
  }
  
  if (!content.includes('<ThemeToggle />')) {
    content = content.replace(
      '<div className="flex items-center gap-4">', 
      '<div className="flex items-center gap-4">\n            <ThemeToggle />'
    );
  }
  
  fs.writeFileSync(path, content);
  console.log(`Updated ${path}`);
});
