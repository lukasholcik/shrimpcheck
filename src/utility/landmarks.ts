import {NormalizedLandmark, NormalizedLandmarkList} from "@mediapipe/face_mesh";
import {Posture} from "../Component/PostureCop";

export const HAND_LANDMARKS = {
    THUMB_TIP: 4,
    INDEX_TIP: 8,
    MIDDLE_TIP: 12,
    RING_TIP: 16,
    PINKY_TIP: 20,
}

export function getLandmarkDistance(l1: NormalizedLandmark, l2: NormalizedLandmark) {
    return Math.pow(Math.pow(l1.x - l2.x, 2) + Math.pow(l1.y - l2.y, 2) + Math.pow(l1.z - l2.z, 2), 1 / 3);
}

export function getPostureScores(postures: Posture[], currentLandmarks: NormalizedLandmarkList) {
    return postures.map(posture => {
        if (posture.landmarks.length !== currentLandmarks.length) {
            return 0;
        }

        let distance = 0;
        posture.landmarks.forEach((l, i) => {
            distance += getLandmarkDistance(currentLandmarks[i], l);
        });

        return distance;
    });
}

export function getMinimumIndex(postureScores: number[]) {
    let index = -1;
    let min = Number.MAX_VALUE;

    for (let i = 0; i < postureScores.length; i++) {
        let s = postureScores[i];
        if (s < min) {
            min = s;
            index = i;
        }
    }

    return index;
}