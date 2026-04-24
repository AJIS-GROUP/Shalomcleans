---
name: tanstack-start-expert
description: Use this skill when building full-stack React applications with TanStack Start, Router, or Server Functions.
triggers: ['tanstack start', 'createServerFn', 'createFileRoute', 'loader']
---

# TanStack Start Expert Skill

## Goal

Ensure the agent uses TanStack Start RC patterns rather than Next.js or standard React Router patterns.

## Instructions

1. **Routing**: All routes must be defined using `createFileRoute`.
2. **Server Functions**: Use `createServerFn` for mutations and server-side logic.
3. **Data Loading**: Use the `loader` key within `createFileRoute`.
4. **Validation**: Strictly enforce Zod schemas for `validateSearch` and `inputValidator`.
5. **Vite**: Use `@tanstack/react-start/config` in `app.config.ts`.

## Examples

User: "Create a route for user profiles"
Agent Action: Generate a file `routes/users.$id.tsx` using `createFileRoute`.
