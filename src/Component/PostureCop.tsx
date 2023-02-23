import {PostureTracking} from "./PostureTracking";
import React, {useCallback, useEffect, useRef, useState} from "react";
import {NormalizedLandmarkList} from "@mediapipe/face_mesh";
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    FormControlLabel,
    Paper,
    Stack,
    Switch,
    TextField,
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

function useAudioNotification(enabled: boolean, condition: boolean, timeout: number, audioRef: React.MutableRefObject<HTMLAudioElement | undefined>) {
    useEffect(() => {
        if (!enabled) {
            return;
        }

        let timeoutId: any;
        if (condition) {
            timeoutId = setTimeout(() => {
                console.log(`It's been bad for ${timeout} seconds`);
                audioRef.current?.play();
            }, timeout * 1000);
        }

        return () => {
            if (timeoutId >= 0) {
                // console.log("Clearing bad timeout.");
                clearTimeout(timeoutId);
                if (audioRef.current) {
                    audioRef.current.pause();
                }
            }
        };
    }, [enabled, condition, timeout]);
}

export function PostureCop() {
    const [referencePostures, setReferencePostures] = useLocalStorage<Posture[]>("postures", []);
    const [closestPostureIndex, setClosestPostureIndex] = useState<number>(0);
    const [audioUrl, setAudioUrl] = useLocalStorage("audioUrl",
        "https://ia800206.us.archive.org/7/items/MoonlightSonata_755/Beethoven-MoonlightSonata.mp3");
    const [postureState, setPostureState] = useState<PostureState>(PostureState.NoReferencePostures);
    const [handInTheFace, setHandInTheFace] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);
    const [postureTrackingEnabled, setPostureTrackingEnabled] = useLocalStorage("postureTrackingEnabled", true);
    const [handInTheFaceTimeout, setHandInTheFaceTimeout] = useLocalStorage("handInTheFaceTimeout", 1);
    const [postureTrackingTimeout, setPostureTrackingTimeout] = useLocalStorage("postureTrackingTimeout", 10);
    const [handInTheFaceEnabled, setHandInTheFaceEnabled] = useLocalStorage("handInTheFaceEnabled", true);

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

    useAudioNotification(postureTrackingEnabled, postureState === PostureState.Bad, postureTrackingTimeout, postureAudioRef);
    useAudioNotification(handInTheFaceEnabled, handInTheFace, handInTheFaceTimeout, postureAudioRef);

    function capturePosture(correct: boolean) {
        if (faceLandmarks.current) {
            setReferencePostures([...referencePostures, {landmarks: faceLandmarks.current, correct}]);
        }
    }

    function clearPostures() {
        setReferencePostures([]);
    }

    return <>
        <Paper sx={{p: 2}}>
            <Stack gap={2} alignItems="stretch">
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
                                <Alert severity="error">Uh oh! You've got {postureTrackingTimeout} seconds to fix
                                    yourself!</Alert>}
                            {postureState === PostureState.Gone &&
                                <Alert severity="info">Aaaaand you're gone.</Alert>}
                            {postureState === PostureState.NoReferencePostures &&
                                <Alert severity="info">Define some reference postures first by moving your head into
                                    correct and
                                    bad
                                    positions and record these positions using the buttons below.</Alert>}
                        </Box>
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
                        <Tooltip
                            title="Position yourself in a good reference posture and click this button to record it">
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
            </Stack>
        </Paper>
        <Paper sx={{p: 2}}>
            <Typography variant="subtitle1">Settings</Typography>
            <Stack gap={3}>
                <Stack direction="row" justifyContent="space-between">
                    <FormControlLabel label="Play sound for posture tracking" control={
                        <Switch checked={postureTrackingEnabled}
                                onChange={(event, checked) => setPostureTrackingEnabled(checked)}/>}></FormControlLabel>
                    <TextField label="Sound timeout (seconds)" type="number" value={postureTrackingTimeout}
                               onChange={event => setPostureTrackingTimeout(Number.parseFloat(event.target.value))}/>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                    <FormControlLabel label="Play sound for hand in the face" control={
                        <Switch checked={handInTheFaceEnabled}
                                onChange={(event, checked) => setHandInTheFaceEnabled(checked)}/>}></FormControlLabel>
                    <TextField label="Sound timeout (seconds)" type="number" value={handInTheFaceTimeout}
                               onChange={event => setHandInTheFaceTimeout(Number.parseFloat(event.target.value))}/>
                </Stack>
                <TextField label="Play this for notification"
                           value={audioUrl}
                           onChange={event => setAudioUrl(event.target.value)}
                           fullWidth/>
            </Stack>
        </Paper>
    </>;
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