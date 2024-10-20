"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import "./page.css";

type Point = { x: number; y: number };
type Size = { width: number; height: number };
type Rect = { position: Point; size: Size };
type ConnectionPoint = { point: Point; angle: number };

const calculateConnectionPoint = (rect: Rect, angle: number): Point => {
  const { x, y } = rect.position;
  const { width, height } = rect.size;
  switch (angle) {
    case 0: return { x: x + width / 2, y };
    case 90: return { x, y: y + height / 2 };
    case 180: return { x: x - width / 2, y };
    case 270: return { x, y: y - height / 2 };
    default: throw new Error("Неподдерживаемый угол. Используйте 0, 90, 180 или 270 градусов.");
  }
};

const calculateIntermediatePoints = (start: Point, end: Point, rect1: Rect, rect2: Rect): Point[] => {
  const points: Point[] = [];
  const offset = 25;
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  
  const getSide = (point: Point, rect: Rect): string => {
    if (point.x === rect.position.x - rect.size.width / 2) return 'left';
    if (point.x === rect.position.x + rect.size.width / 2) return 'right';
    if (point.y === rect.position.y - rect.size.height / 2) return 'top';
    return 'bottom';
  };

  const startSide = getSide(start, rect1);
  const endSide = getSide(end, rect2);

  const adjustPoint = (point: Point, side: string): Point => {
    const adjusted = { ...point };
    if (side === 'left') adjusted.x -= offset;
    if (side === 'right') adjusted.x += offset;
    if (side === 'top') adjusted.y -= offset;
    if (side === 'bottom') adjusted.y += offset;
    return adjusted;
  };

  const adjustedStart = adjustPoint(start, startSide);
  const adjustedEnd = adjustPoint(end, endSide);

  const createDetour = (start: Point, end: Point, rect: Rect): Point[] => {
    const detourPoints: Point[] = [];
    const step = 50;
    const currentPoint = { ...start };
    
    const isPointInsideRect = (point: Point, rect: Rect): boolean => {
      return point.x > rect.position.x - rect.size.width / 2 &&
             point.x < rect.position.x + rect.size.width / 2 &&
             point.y > rect.position.y - rect.size.height / 2 &&
             point.y < rect.position.y + rect.size.height / 2;
    };

    while (Math.abs(currentPoint.x - end.x) > step || Math.abs(currentPoint.y - end.y) > step) {
      if (Math.abs(currentPoint.x - end.x) > step) {
        currentPoint.x += Math.sign(end.x - currentPoint.x) * step;
      } else if (Math.abs(currentPoint.y - end.y) > step) {
        currentPoint.y += Math.sign(end.y - currentPoint.y) * step;
      }
      
      if (isPointInsideRect(currentPoint, rect)) {
        if (Math.abs(currentPoint.x - rect.position.x) < Math.abs(currentPoint.y - rect.position.y)) {
          currentPoint.x = currentPoint.x < rect.position.x ? 
            rect.position.x - rect.size.width / 2 - step :
            rect.position.x + rect.size.width / 2 + step;
        } else {
          currentPoint.y = currentPoint.y < rect.position.y ? 
            rect.position.y - rect.size.height / 2 - step :
            rect.position.y + rect.size.height / 2 + step;
        }
      }
      
      detourPoints.push({ ...currentPoint });
    }
    
    return detourPoints;
  };

  const detourPoints1 = createDetour(adjustedStart, { x: midX, y: midY }, rect1);
  const detourPoints2 = createDetour({ x: midX, y: midY }, adjustedEnd, rect2);
  points.push(adjustedStart, ...detourPoints1, ...detourPoints2, adjustedEnd);

  return points;
};

const dataConverter = (rect1: Rect, rect2: Rect, cPoint1: ConnectionPoint, cPoint2: ConnectionPoint): Point[] => {
  const canvasPoints: Point[] = [rect1, rect2].flatMap(rect => [
    { x: rect.position.x - rect.size.width / 2, y: rect.position.y - rect.size.height / 2 },
    { x: rect.position.x + rect.size.width / 2, y: rect.position.y - rect.size.height / 2 },
    { x: rect.position.x + rect.size.width / 2, y: rect.position.y + rect.size.height / 2 },
    { x: rect.position.x - rect.size.width / 2, y: rect.position.y + rect.size.height / 2 }
  ]);

  const actualCPoint1 = calculateConnectionPoint(rect1, cPoint1.angle);
  const actualCPoint2 = calculateConnectionPoint(rect2, cPoint2.angle);
  canvasPoints.push(actualCPoint1, actualCPoint2);

  const intermediatePoints = calculateIntermediatePoints(actualCPoint1, actualCPoint2, rect1, rect2);
  const routePoints: Point[] = [actualCPoint1, ...intermediatePoints, actualCPoint2];

  return [...canvasPoints, ...routePoints];
};

export default function Home() {
  const [rectangles, setRectangles] = useState<Point[]>([]);
  const [connectionLine, setConnectionLine] = useState<Point[]>([]);

  const rectangle1 = useMemo(() => ({ position: { x: 200, y: 400 }, size: { width: 100, height: 100 } }), []);
  const rectangle2 = useMemo(() => ({ position: { x: 500, y: 200 }, size: { width: 100, height: 100 } }), []);
  const connectionPoint1 = useMemo(() => ({ point: { x: 0, y: 0 }, angle: 90 }), []);
  const connectionPoint2 = useMemo(() => ({ point: { x: 0, y: 0 }, angle: 90 }), []);

  useEffect(() => {
    const points = dataConverter(rectangle1, rectangle2, connectionPoint1, connectionPoint2);
    setRectangles(points.slice(0, 8));
    setConnectionLine(points.slice(8));
  }, [rectangle1, rectangle2, connectionPoint1, connectionPoint2]);

  const drawCanvas = useCallback((canvas: HTMLCanvasElement | null) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const drawGrid = () => {
      ctx.strokeStyle = '#CCCCCC';
      ctx.lineWidth = 1;
      ctx.font = '10px Arial';
      ctx.fillStyle = '#000000';

      for (let x = 0; x <= canvas.width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
        ctx.fillText(`${x}px`, x, 10);
      }

      for (let y = 0; y <= canvas.height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
        ctx.fillText(`${y}px`, 0, y + 10);
      }
    };

    const drawRectangles = () => {
      ctx.fillStyle = '#87CEEB';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;

      for (let i = 0; i < rectangles.length; i += 4) {
        const [x, y] = [rectangles[i].x, rectangles[i].y];
        const [width, height] = [rectangles[i + 2].x - x, rectangles[i + 2].y - y];
        ctx.fillRect(x, y, width, height);
        ctx.strokeRect(x, y, width, height);
      }
    };

    const drawConnectionLine = () => {
      ctx.beginPath();
      ctx.moveTo(connectionLine[0]?.x, connectionLine[0]?.y);
      connectionLine.slice(2).forEach(point => ctx.lineTo(point.x, point.y));
      ctx.stroke();
    };

    drawGrid();
    drawRectangles();
    drawConnectionLine();
  }, [rectangles, connectionLine]);

  return (
    <div className="page">
      <canvas className="canvas" width={1000} height={1000} ref={drawCanvas} />
    </div>
  );
}
