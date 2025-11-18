"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Braces, Code2, Feather, FilePlus, Rocket } from "lucide-react"

interface SnippetsMenuProps {
  onInsert: (snippet: string) => void
  onReplace: (snippet: string) => void
  theme: any
}

const SNIPPETS = {
  "HTML • Boilerplate": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Futuristic Page</title>
  <style>
    :root { color-scheme: light dark; }
    body { margin: 0; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
  </style>
</head>
<body>
  <main style="padding:24px">
    <h1>🚀 Hello, Future!</h1>
    <p>Build something amazing.</p>
  </main>
</body>
</html>`,
  "CSS • Reset": `/* Modern CSS Reset */
*,
*::before,
*::after { box-sizing: border-box; }

body, h1, h2, h3, h4, p, figure, blockquote, dl, dd { margin: 0; }

ul[role='list'], ol[role='list'] { list-style: none; }

html:focus-within { scroll-behavior: smooth; }

body { min-height: 100vh; text-rendering: optimizeSpeed; line-height: 1.6; }

a:not([class]) { text-decoration-skip-ink: auto; }`,
  "JS • Fetch JSON": `async function loadData() {
  const res = await fetch('https://jsonplaceholder.typicode.com/todos/1');
  const data = await res.json();
  console.log('Data:', data);
}
loadData();`,
  "HTML • Tailwind CDN": `<!doctype html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <script src="https://cdn.tailwindcss.com"></script>
  <title>Tailwind Demo</title>
</head>
<body class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
  <section class="p-8">
    <h1 class="text-3xl font-bold">Neon ✨</h1>
    <p class="opacity-80">Welcome to the future.</p>
  </section>
</body>
</html>`,
  "JS • Canvas Animation": `const canvas = document.createElement('canvas');
document.body.appendChild(canvas);
canvas.width = innerWidth; canvas.height = innerHeight;
const ctx = canvas.getContext('2d');
let t = 0;
function loop(){
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  for(let i=0;i<200;i++){
    ctx.fillStyle = \`hsl(\${(i+t)%360},90%,60%)\`;
    ctx.fillRect((Math.sin(i+t/50)*0.5+0.5)*canvas.width, (Math.cos(i+t/40)*0.5+0.5)*canvas.height, 2, 2);
  }
  t++; requestAnimationFrame(loop);
}
loop();`,
}

export default function SnippetsMenu({ onInsert, onReplace, theme }: SnippetsMenuProps) {
  const items = Object.entries(SNIPPETS)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={`${theme.button} h-8 px-2 text-xs`}>
          <FilePlus className="h-4 w-4 mr-1" /> Snippets
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Rocket className="h-4 w-4 text-purple-500" />
          Quick Snippets
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.map(([label, snippet]) => (
          <div key={label} className="px-1 py-0.5">
            <div className="text-xs font-medium px-2 py-1 opacity-70">{label}</div>
            <div className="flex gap-1 px-2 pb-2">
              <Button
                variant="outline"
                className="h-7 text-xs bg-transparent"
                onClick={() => onInsert(snippet)}
                title="Insert at end"
              >
                <Code2 className="h-3.5 w-3.5 mr-1" />
                Insert
              </Button>
              <Button
                variant="outline"
                className="h-7 text-xs bg-transparent"
                onClick={() => onReplace(snippet)}
                title="Replace file content"
              >
                <Braces className="h-3.5 w-3.5 mr-1" />
                Replace
              </Button>
              <Button
                variant="outline"
                className="h-7 text-xs bg-transparent"
                onClick={() => {
                  navigator.clipboard.writeText(snippet)
                }}
                title="Copy to clipboard"
              >
                <Feather className="h-3.5 w-3.5 mr-1" />
                Copy
              </Button>
            </div>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
