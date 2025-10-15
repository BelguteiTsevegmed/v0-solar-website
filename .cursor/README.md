# Cursor Rules for Solar Website Project

This directory contains Cursor Rules that help the AI assistant understand and work with this codebase more effectively.

## Available Rules

### 1. **project-structure.mdc** (Always Applied)

- Overview of the Next.js 15 App Router architecture
- Directory structure and key files
- Import aliases and package manager (pnpm)
- Key technologies and dependencies

### 2. **typescript-react.mdc** (Applied to `*.ts` and `*.tsx` files)

- TypeScript configuration and strict mode guidelines
- React component best practices
- Server vs Client component patterns
- Forms and validation with React Hook Form + Zod

### 3. **components.mdc** (Manual/Description-based)

- Component file naming conventions (kebab-case)
- shadcn/ui integration (New York style)
- Component organization patterns
- Animation and accessibility guidelines

### 4. **styling.mdc** (Applied to `*.tsx` and `*.css` files)

- Tailwind CSS v4 usage patterns
- Dark mode theming with next-themes
- Responsive design guidelines
- Typography and layout patterns

### 5. **api-server-actions.mdc** (Manual/Description-based)

- Server actions setup and usage
- API integration patterns
- Data fetching strategies
- Error handling and type safety

### 6. **best-practices.mdc** (Always Applied)

- Code style and formatting
- Performance optimization techniques
- File organization and import ordering
- Git practices, accessibility, and security

## How Rules Work

- **Always Applied**: Rules with `alwaysApply: true` are included in every AI request
- **Glob-based**: Rules with `globs` are applied when working with matching file types
- **Description-based**: Rules with descriptions can be referenced by the AI when relevant

## Modifying Rules

To update a rule:

1. Edit the corresponding `.mdc` file in `.cursor/rules/`
2. Save the file - changes take effect immediately
3. The AI will use the updated rules in subsequent requests

## Adding New Rules

Create a new `.mdc` file in `.cursor/rules/` with proper frontmatter:

```markdown
---
alwaysApply: false
description: Your rule description
globs: *.extension
---

# Your Rule Content
```

Choose one approach: `alwaysApply`, `description`, or `globs`.
