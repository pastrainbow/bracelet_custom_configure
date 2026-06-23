import Matter from 'matter-js';
import { PHYSICS } from '@/config/constants';

export interface PhysicsWorld {
  engine: Matter.Engine;
  world: Matter.World;
}

/**
 * Create the Matter engine with gentle gravity suited to a settling dish.
 * The engine is stepped manually from the render loop (no Matter.Runner) so
 * physics can be paused while the bracelet is arranged.
 */
export function createPhysics(): PhysicsWorld {
  const engine = Matter.Engine.create({
    gravity: { x: 0, y: PHYSICS.gravity },
    // Higher iteration counts → stabler stacking of many beads.
    positionIterations: 8,
    velocityIterations: 8,
  });
  return { engine, world: engine.world };
}

/**
 * Build a ring of static wall segments approximating a circular bowl of the
 * given radius. More segments = smoother boundary and fewer escapes.
 */
export function buildCircularWalls(
  cx: number,
  cy: number,
  radius: number,
  count = PHYSICS.wallSegments,
): Matter.Body[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    const segLen = (Math.PI * 2 * radius) / count + 4;
    return Matter.Bodies.rectangle(
      cx + Math.cos(angle) * radius,
      cy + Math.sin(angle) * radius,
      10,
      segLen,
      {
        isStatic: true,
        angle,
        friction: PHYSICS.friction,
        restitution: PHYSICS.wallRestitution,
        label: 'wall',
      },
    );
  });
}

/** Shared body options for a bead/accessory of the given radius. */
export function beadBodyOptions(isStatic = false): Matter.IBodyDefinition {
  // Note: Matter has no separate angular friction; frictionAir damps spin too.
  return {
    restitution: PHYSICS.restitution,
    friction: PHYSICS.friction,
    frictionStatic: PHYSICS.frictionStatic,
    frictionAir: PHYSICS.frictionAir,
    density: PHYSICS.density,
    label: 'bead',
    isStatic,
  };
}

/**
 * Soft radial repulsion from the pointer so beads scatter away as you sweep
 * through them in free mode.
 */
export function applyPointerRepulsion(
  bodies: Matter.Body[],
  pointer: { x: number; y: number },
): void {
  const { repelRadius, repelStrength } = PHYSICS;
  for (const body of bodies) {
    const dx = body.position.x - pointer.x;
    const dy = body.position.y - pointer.y;
    const dist = Math.hypot(dx, dy);
    if (dist < repelRadius && dist > 1) {
      const force = (1 - dist / repelRadius) * repelStrength;
      Matter.Body.applyForce(body, body.position, {
        x: (dx / dist) * force,
        y: (dy / dist) * force,
      });
    }
  }
}
