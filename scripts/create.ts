#!/usr/bin/env bun
/**
 * create-vitrio-start
 * 
 * Simple CLI to scaffold a new vitrio-start project.
 * Usage: bunx create-vitrio-start [project-name] [--no-install]
 */

import { existsSync, mkdirSync, cpSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'

const TEMPLATE_DIR = join(import.meta.dir, '../')

function printUsage() {
  console.log(`
Usage: bunx create-vitrio-start [project-name] [options]

Options:
  --no-install    Skip running 'bun install'
  --name          Project name (alternative to positional argument)
  --help          Show this help message

Examples:
  bunx create-vitrio-start my-app
  bunx create-vitrio-start my-app --no-install
  bunx create-vitrio-start --name=my-app
`)
}

async function main() {
  const args = process.argv.slice(2)
  
  // Parse arguments
  const { values, positionals } = parseArgs({
    args,
    options: {
      'no-install': { type: 'boolean', default: false },
      'name': { type: 'string' },
      'help': { type: 'boolean', default: false },
    },
    allowPositionals: true,
  })
  
  if (values.help) {
    printUsage()
    process.exit(0)
  }
  
  // Get project name from positional arg or --name flag
  const projectName = positionals[0] || values.name
  
  if (!projectName) {
    console.error('❌ Error: Project name is required')
    printUsage()
    process.exit(1)
  }
  
  const targetDir = join(process.cwd(), projectName)
  
  // Check if directory already exists
  if (existsSync(targetDir)) {
    console.error(`❌ Error: Directory "${projectName}" already exists`)
    process.exit(1)
  }
  
  console.log(`🚀 Creating vitrio-start project: ${projectName}`)
  
  // Create project directory
  mkdirSync(targetDir, { recursive: true })
  
  // Copy template files (exclude some directories)
  const excludeDirs = ['node_modules', '.git', 'dist', 'bun.lock']
  
  try {
    // Copy all files except excluded ones
    cpSync(TEMPLATE_DIR, targetDir, {
      recursive: true,
      filter: (src) => {
        const relativePath = src.replace(TEMPLATE_DIR, '')
        const parts = relativePath.split('/')
        return !excludeDirs.some(dir => parts.includes(dir))
      }
    })
    
    console.log('✅ Files copied successfully')
    
    // Update package.json with new project name
    const packageJsonPath = join(targetDir, 'package.json')
    if (existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(await Bun.file(packageJsonPath).text())
      packageJson.name = projectName
      writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
      console.log('✅ Updated package.json')
    }
    
    // Install dependencies if not skipped
    if (!values['no-install']) {
      console.log('📦 Installing dependencies...')
      const proc = Bun.spawn(['bun', 'install'], {
        cwd: targetDir,
        stdout: 'inherit',
        stderr: 'inherit',
      })
      
      await proc.exited
      
      if (proc.exitCode === 0) {
        console.log('✅ Dependencies installed')
      } else {
        console.error('⚠️  Warning: Failed to install dependencies')
        console.error('   Run "bun install" manually in the project directory')
      }
    }
    
    // Success message
    console.log(`
✨ Success! Created ${projectName}

Next steps:
  cd ${projectName}
  ${values['no-install'] ? 'bun install\n  ' : ''}bun run dev

Open http://localhost:3000 to see your app.

Happy coding! 🎉
`)
    
  } catch (error) {
    console.error('❌ Error creating project:', error)
    process.exit(1)
  }
}

main()
