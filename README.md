## Getting Started

Для запуска проекта:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере, чтобы увидеть результат.

Для передвижения прямоугольников необходимо изменить данные здесь

```tsx
const rectangle1 = useMemo(() => ({ position: { x: 200, y: 400 }, size: { width: 100, height: 100 } }), []);
const rectangle2 = useMemo(() => ({ position: { x: 500, y: 200 }, size: { width: 100, height: 100 } }), []);
const connectionPoint1 = useMemo(() => ({ point: { x: 0, y: 0 }, angle: 90 }), []);
const connectionPoint2 = useMemo(() => ({ point: { x: 0, y: 0 }, angle: 90 }), []);
```
Это 117-120 строчки файла `src/app/page.tsx`
