import React, {ReactElement, useCallback, useEffect, useMemo, useRef} from "react";
import {
    HAND_CONNECTIONS,
    Holistic,
    InputImage,
    NormalizedLandmarkList,
    POSE_CONNECTIONS,
    Results as HolisticResults,
} from "@mediapipe/holistic";
import {drawConnectors} from "@mediapipe/drawing_utils";
import {Camera} from "../camera_utils/camera_utils";
import {Box, Stack} from "@mui/material";
import {Posture} from "./PostureCop";
import {FACEMESH_FACE_OVAL_SIMPLE, FACEMESH_FACE_OVAL_SIMPLE_CONNECTIONS} from "./connections";
import {HAND_LANDMARKS} from "../utility/landmarks";
import {inside} from "../utility/polygon";

const CANVAS_WIDTH = 320;
const CANVAS_HEIGHT = 240;

interface PostureTrackingProps {
    onFaceUpdate: (landmarks: NormalizedLandmarkList | null) => void;
    onHandInTheFace: (handInTheFace: boolean) => void;
    postures: Posture[];
    closestPostureIndex: number;
    frameRate?: number;
}

/**
 * Checks if the hand is in the face
 */
function handInTheFace(handLandmarks: NormalizedLandmarkList, faceLandmarks: NormalizedLandmarkList) {
    if (!faceLandmarks?.length || !handLandmarks?.length) {
        return false;
    }

    for (let i of Object.values(HAND_LANDMARKS)) {
        if (inside(handLandmarks[i], faceLandmarks)) {
            console.log("Finger " + i + " is in the face!");
            return true;
        }
    }
    return false;
}

export function PostureTracking({
                                    postures,
                                    onFaceUpdate,
                                    onHandInTheFace,
                                    closestPostureIndex,
                                    frameRate = 1
                                }: PostureTrackingProps): ReactElement {
    const videoRef = useRef<HTMLVideoElement>(null);
    const faceTrackingCanvasRef = useRef<HTMLCanvasElement>(null);
    const posturesCanvasRef = useRef<HTMLCanvasElement>(null);

    // draw reference postures on canvas
    useEffect(() => {
        if (!posturesCanvasRef.current) {
            return;
        }

        const canvasCtx = posturesCanvasRef.current.getContext('2d');
        if (canvasCtx == null) {
            return;
        }

        canvasCtx.save();
        canvasCtx.clearRect(0, 0, posturesCanvasRef.current.width, posturesCanvasRef.current.height);

        for (let i = 0; i < postures.length; i++) {
            const posture = postures[i];
            const lineWidth = i === closestPostureIndex ? 5 : 1;
            const color = posture.correct ? "green" : "red";
            drawConnectors(canvasCtx, posture.landmarks, FACEMESH_FACE_OVAL_SIMPLE_CONNECTIONS, {color, lineWidth});
        }

        canvasCtx.restore();
    }, [postures, closestPostureIndex, posturesCanvasRef.current]);

    const onHolisticResults = useCallback((results: HolisticResults) => {
        if (!results.faceLandmarks) {
            onFaceUpdate(null);
        }

        const canvas = faceTrackingCanvasRef.current;
        const canvasCtx = canvas?.getContext('2d');

        if (!(canvas && canvasCtx)) {
            return;
        }

        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

        const faceLandmarks = results.faceLandmarks;
        if (!faceLandmarks) {
            return;
        }
        const faceLandmarksSimple = FACEMESH_FACE_OVAL_SIMPLE.map(connector => faceLandmarks[connector[0]]);
        onFaceUpdate?.(faceLandmarksSimple);

        drawConnectors(canvasCtx, faceLandmarksSimple, FACEMESH_FACE_OVAL_SIMPLE_CONNECTIONS, {color: '#E0E0E0'});
        // drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION,
        //     {color: '#C0C0C070', lineWidth: 1});

        drawConnectors(canvasCtx, results.leftHandLandmarks, HAND_CONNECTIONS, {color: "aquamarine"});
        drawConnectors(canvasCtx, results.leftHandLandmarks, [
            [HAND_LANDMARKS.THUMB_TIP, HAND_LANDMARKS.INDEX_TIP],
            [HAND_LANDMARKS.INDEX_TIP, HAND_LANDMARKS.MIDDLE_TIP],
            [HAND_LANDMARKS.MIDDLE_TIP, HAND_LANDMARKS.RING_TIP],
            [HAND_LANDMARKS.RING_TIP, HAND_LANDMARKS.PINKY_TIP],
        ], {color: "pink", lineWidth: 1});
        drawConnectors(canvasCtx, results.rightHandLandmarks, HAND_CONNECTIONS, {color: "aquamarine"});
        drawConnectors(canvasCtx, results.rightHandLandmarks, [
            [HAND_LANDMARKS.THUMB_TIP, HAND_LANDMARKS.INDEX_TIP],
            [HAND_LANDMARKS.INDEX_TIP, HAND_LANDMARKS.MIDDLE_TIP],
            [HAND_LANDMARKS.MIDDLE_TIP, HAND_LANDMARKS.RING_TIP],
            [HAND_LANDMARKS.RING_TIP, HAND_LANDMARKS.PINKY_TIP],
        ], {color: "pink", lineWidth: 1});

        drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS);

        const leftHandInTheFace = handInTheFace(results.leftHandLandmarks, results.faceLandmarks);
        const rightHandInTheFace = handInTheFace(results.rightHandLandmarks, results.faceLandmarks);
        
        onHandInTheFace(leftHandInTheFace || rightHandInTheFace);

        canvasCtx.restore();
    }, [onFaceUpdate]);

    const holistic = useMemo(() => {
        const result = new Holistic({
            locateFile: (file: string) => {
                console.log("Locating file:", file);
                return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`;
            }
        });
        result.setOptions({
            enableFaceGeometry: true,
            refineFaceLandmarks: false,
            modelComplexity: 1,
            selfieMode: true,
        });

        result.onResults(onHolisticResults);

        return result;
    }, [onHolisticResults]);

    useEffect(() => {
        return () => {
            holistic?.close();
        };
    }, []);

    useEffect(() => {
        if (!videoRef.current) {
            return;
        }

        const camera = new Camera(videoRef.current, {
            onFrame: async () => {
                await holistic.send({image: videoRef.current as InputImage});
                // await hands.send({image: videoRef.current as InputImage});
            },
            facingMode: "user",
            // width: CANVAS_WIDTH,
            // height: CANVAS_HEIGHT,
            frameRate: frameRate,
        });
        camera.start();
    }, [videoRef.current]);

    return (
        <Stack direction="row">
            <Box position="relative" width={CANVAS_WIDTH} height={CANVAS_HEIGHT} border="1px solid white">
                <canvas ref={faceTrackingCanvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT}
                        style={{position: "absolute"}}/>
                <canvas ref={posturesCanvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT}
                        style={{position: "absolute"}}/>
            </Box>
            <video ref={videoRef} style={{display: "none"}}/>
        </Stack>
    );
}