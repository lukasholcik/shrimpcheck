import {PostureTracking} from "./PostureTracking";
import React, {useCallback, useEffect, useRef, useState} from "react";
import {NormalizedLandmarkList} from "@mediapipe/face_mesh";
import {Alert, Box, Button, Stack, TextField, Tooltip} from "@mui/material";
import {useLocalStorage} from "../utility/useLocalStorage";
import {getMinimumIndex, getPostureScores} from "../utility/landmarks";

export interface Posture {
    landmarks: NormalizedLandmarkList;
    correct: boolean;
}

enum PostureState {
    NoReferencePostures,
    Gone,
    Good,
    Bad,
}

export function PostureCop() {
    const [referencePostures, setReferencePostures] = useLocalStorage<Posture[]>("postures", []);
    const [closestPostureIndex, setClosestPostureIndex] = useState<number>(0);
    const [audioUrl, setAudioUrl] = useLocalStorage("audioUrl",
        "https://upload.wikimedia.org/wikipedia/commons/b/b6/IMSLP348253-PMLP01555-Mozart_29-1.ogg");
    const [postureState, setPostureState] = useState<PostureState>(PostureState.NoReferencePostures);
    const [handInTheFace, setHandInTheFace] = useState<boolean>(false);

    const postureAudioRef = useRef<HTMLAudioElement>();

    const faceLandmarks = useRef<NormalizedLandmarkList | null>([]);

    const handleFaceUpdate = useCallback(
        (landmarks: NormalizedLandmarkList | null) => {
            faceLandmarks.current = landmarks;

            if (referencePostures.length === 0) {
                setPostureState(PostureState.NoReferencePostures);
            } else if (landmarks) {
                const postureScores = getPostureScores(referencePostures, landmarks);

                const closestPostureIndex = getMinimumIndex(postureScores);

                setClosestPostureIndex(closestPostureIndex);
            } else {
                setClosestPostureIndex(-1);
                setPostureState(PostureState.Gone);
            }
        }, [referencePostures],
    );

    useEffect(() => {
        if (closestPostureIndex >= 0 && closestPostureIndex < referencePostures.length) {
            setPostureState(referencePostures[closestPostureIndex].correct ? PostureState.Good : PostureState.Bad);
        }
    }, [closestPostureIndex, referencePostures]);

    useEffect(() => {
        let timeoutId: any;
        if (postureState === PostureState.Bad) {
            // console.log("Starting bad timeout.");
            timeoutId = setTimeout(() => {
                console.log("It's been bad for 10 seconds");
                postureAudioRef.current?.play();
            }, 10000);
        }

        return () => {
            if (timeoutId >= 0) {
                // console.log("Clearing bad timeout.");
                clearTimeout(timeoutId);
                if (postureAudioRef.current) {
                    postureAudioRef.current.pause();
                }
            }
        };
    }, [postureState]);

    useEffect(() => {
        if (handInTheFace) {
            postureAudioRef.current?.play();
        }

        return () => {
            postureAudioRef.current?.pause();
        };
    }, [handInTheFace]);


    function capturePosture(correct: boolean) {
        if (faceLandmarks.current) {
            setReferencePostures([...referencePostures, {landmarks: faceLandmarks.current, correct}]);
        }
    }

    function clearPostures() {
        setReferencePostures([]);
    }

    return <Stack p={2} gap={2} alignItems="start">
        <audio src={audioUrl}
               loop={true}
               ref={(input) => {
                   postureAudioRef.current = input as HTMLAudioElement
               }}/>

        <Box sx={{width: "100%"}}>
            {postureState === PostureState.Good &&
                <Alert severity="success">You look great!</Alert>}
            {postureState === PostureState.Bad &&
                <Alert severity="error">Uh oh! Fix yourself!</Alert>}
            {postureState === PostureState.Gone &&
                <Alert severity="info">Aaaaand you're gone.</Alert>}
            {postureState === PostureState.NoReferencePostures &&
                <Alert severity="info">Define some reference postures first by moving your head into correct and bad
                    positions and record these positions using the buttons below.</Alert>}

            {handInTheFace
                ? <Alert severity="error">Arrr, ye be tryin' to pick yer nose, be ye not?</Alert>
                : <Alert severity="success">Good, keep their handsies out of their nosies, yes, yes!</Alert>}
        </Box>

        <Box display="inline-block" mb={2}>
            <PostureTracking onFaceUpdate={handleFaceUpdate}
                             onHandInTheFace={setHandInTheFace}
                             postures={referencePostures}
                             closestPostureIndex={closestPostureIndex}
                             frameRate={10}/>
        </Box>
        <Stack direction="row" gap={2} sx={{mb: 2}}>
            <Tooltip title="Position yourself in a good reference posture and click this button to record it">
                <Button variant="outlined" onClick={() => capturePosture(true)}>Capture correct posture</Button>
            </Tooltip>
            <Button variant="outlined" onClick={() => capturePosture(false)}>Capture bad posture</Button>
            <Button variant="text" onClick={clearPostures}>Clear</Button>
        </Stack>
        <TextField label="Play this file for bad posture"
                   value={audioUrl}
                   onChange={event => setAudioUrl(event.target.value)}
                   fullWidth/>
    </Stack>
}