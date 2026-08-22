export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export interface CameraViewport {
  width: number;
  height: number;
}

export interface CameraTarget {
  x: number;
  y: number;
  zoom: number;
}

export function centerCameraOnWorldPoint(
  point: {
    x: number;
    y: number;
  },
  zoom: number,
  viewport: CameraViewport,
): CameraTarget {
  return {
    x:
      viewport.width / 2 -
      point.x * zoom,

    y:
      viewport.height / 2 -
      point.y * zoom,

    zoom,
  };
}

export function clampZoom(
  zoom: number,
  min = 0.25,
  max = 2.4,
): number {
  return Math.min(
    max,
    Math.max(min, zoom),
  );
}

export function clampCamera(
  camera: Camera,
  world: {
    width: number;
    height: number;
  },
  viewport: CameraViewport,
): Camera {
  const minX =
    viewport.width -
    world.width * camera.zoom;

  const minY =
    viewport.height -
    world.height * camera.zoom;

  return {
    x: Math.min(
      0,
      Math.max(minX, camera.x),
    ),
    y: Math.min(
      0,
      Math.max(minY, camera.y),
    ),
    zoom: clampZoom(camera.zoom),
  };
}
