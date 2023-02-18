import {FACEMESH_FACE_OVAL} from "@mediapipe/face_mesh";

const MESH_SIMPLE_STEP = 3;
export const FACEMESH_FACE_OVAL_SIMPLE: [number, number][] = [];
for (let i = 0; i < FACEMESH_FACE_OVAL.length; i += MESH_SIMPLE_STEP) {
    const nextIndex = i + MESH_SIMPLE_STEP >= FACEMESH_FACE_OVAL.length ? 0 : i + MESH_SIMPLE_STEP;
    FACEMESH_FACE_OVAL_SIMPLE.push([FACEMESH_FACE_OVAL[i][0], FACEMESH_FACE_OVAL[nextIndex][0]]);
}

export const FACEMESH_FACE_OVAL_SIMPLE_CONNECTIONS: [number, number][] = [];
for (let i = 0; i < FACEMESH_FACE_OVAL_SIMPLE.length; i++) {
    FACEMESH_FACE_OVAL_SIMPLE_CONNECTIONS.push([i, i + 1 >= FACEMESH_FACE_OVAL_SIMPLE.length ? 0 : i + 1]);
}