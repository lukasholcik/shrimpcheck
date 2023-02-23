import {PostureTracking} from "./PostureTracking";
import React, {useCallback, useEffect, useRef, useState} from "react";
import {NormalizedLandmarkList} from "@mediapipe/face_mesh";
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Divider,
    Stack,
    TextField,
    ToggleButton,
    Tooltip,
    Typography
} from "@mui/material";
import {useLocalStorage} from "../utility/useLocalStorage";
import {getMinimumIndex, getPostureScores} from "../utility/landmarks";
import AddIcon from '@mui/icons-material/Add';
import ClearIcon from "@mui/icons-material/Clear";

export interface Posture {
    landmarks: NormalizedLandmarkList;
    correct: boolean;
}

export const BAD_POSTURE_TIMEOUT = 10000;

enum PostureState {
    NoReferencePostures,
    Gone,
    Good,
    Bad,
}

const FRAME_RATE = 5;

export function PostureCop() {
    const [referencePostures, setReferencePostures] = useLocalStorage<Posture[]>("postures", []);
    const [closestPostureIndex, setClosestPostureIndex] = useState<number>(0);
    const [audioUrl, setAudioUrl] = useLocalStorage("audioUrl",
        "https://upload.wikimedia.org/wikipedia/commons/b/b6/IMSLP348253-PMLP01555-Mozart_29-1.ogg");
    const [postureState, setPostureState] = useState<PostureState>(PostureState.NoReferencePostures);
    const [handInTheFace, setHandInTheFace] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);
    const [enabled, setEnabled] = useState(true);

    const postureAudioRef = useRef<HTMLAudioElement>();

    const faceLandmarks = useRef<NormalizedLandmarkList | null>([]);

    const handleFaceUpdate = useCallback(
        (landmarks: NormalizedLandmarkList | null) => {
            setLoading(false);

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
        if (!enabled) {
            return;
        }

        let timeoutId: any;
        if (postureState === PostureState.Bad) {
            // console.log("Starting bad timeout.");
            timeoutId = setTimeout(() => {
                console.log("It's been bad for 10 seconds");
                postureAudioRef.current?.play();
            }, BAD_POSTURE_TIMEOUT);
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
    }, [postureState, enabled]);

    useEffect(() => {
        if (handInTheFace && postureAudioRef.current) {
            postureAudioRef.current.volume = 0.25;
            postureAudioRef.current.play();
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

    return <Stack gap={2} alignItems="stretch">
        <audio src={audioUrl}
               loop={true}
               ref={(input) => {
                   postureAudioRef.current = input as HTMLAudioElement
               }}/>

        <Stack gap={1} sx={{width: "100%"}}>
            <Stack direction="row" gap={1}>
                <Box flex={1}>
                    {postureState === PostureState.Good &&
                        <Alert severity="success">You look great!</Alert>}
                    {postureState === PostureState.Bad &&
                        <Alert severity="error">Uh oh! You've got {BAD_POSTURE_TIMEOUT / 1000} seconds to fix
                            yourself!</Alert>}
                    {postureState === PostureState.Gone &&
                        <Alert severity="info">Aaaaand you're gone.</Alert>}
                    {postureState === PostureState.NoReferencePostures &&
                        <Alert severity="info">Define some reference postures first by moving your head into correct and
                            bad
                            positions and record these positions using the buttons below.</Alert>}
                </Box>
                <ToggleButton value={enabled}
                              selected={enabled}
                              onChange={() => setEnabled(!enabled)}>{enabled ? "On" : "Off"}</ToggleButton>
            </Stack>

            {handInTheFace
                ? <Alert severity="error">Arrr, ye be tryin' to pick yer nose, be ye not?</Alert>
                : <Alert severity="success">Good, keep their handsies out of their nosies, yes, yes!</Alert>}
        </Stack>

        <Stack width="100%" alignItems="center" position="relative">
            <PostureTracking onFaceUpdate={handleFaceUpdate}
                             onHandInTheFace={setHandInTheFace}
                             postures={referencePostures}
                             closestPostureIndex={closestPostureIndex}
                             frameRate={FRAME_RATE}/>
            {loading && <Box display="inline-block" sx={styles.loading}>
                <CircularProgress/>
            </Box>}
        </Stack>
        <Stack alignItems="stretch">
            <Stack direction="row" gap={2} sx={{mb: 2, width: "100%"}}>
                <Tooltip title="Position yourself in a good reference posture and click this button to record it">
                    <Button startIcon={<AddIcon/>} sx={styles.button} variant="outlined"
                            color="success"
                            onClick={() => capturePosture(true)}>Good
                        posture</Button>
                </Tooltip>
                <Button startIcon={<AddIcon/>} sx={styles.button} variant="outlined"
                        color="error"
                        onClick={() => capturePosture(false)}>Bad
                    posture</Button>
            </Stack>
            <Button startIcon={<ClearIcon/>} sx={styles.button} variant="outlined"
                    onClick={clearPostures}>Clear</Button>
        </Stack>
        <Divider/>
        <Typography variant="subtitle1">Settings</Typography>
        <Box sx={{width: "100%"}}>
            <TextField label="Play this file for bad posture"
                       value={audioUrl}
                       onChange={event => setAudioUrl(event.target.value)}
                       fullWidth/>
        </Box>
    </Stack>
}

const styles = {
    button: {
        flex: 1,
    },
    loading: {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
    }
}