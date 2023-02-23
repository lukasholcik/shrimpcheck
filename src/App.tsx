import React from 'react';
import {PostureCop} from "./Component/PostureCop";
import {Alert, Box, CssBaseline, Link, Paper, Stack, ThemeProvider, Typography} from "@mui/material";
import {THEME} from "./theme/theme";

function App() {
    return (
        <ThemeProvider theme={THEME}>
            <CssBaseline/>
            <Stack sx={styles.page} gap={2}>
                <Typography variant="h3" align="center">Shrimp Check!</Typography>
                <Box alignSelf="end">
                    <Link fontSize="small" href="https://img-9gag-fun.9cache.com/photo/aZy49X3_700bwp.webp"
                          target="_blank">Shrimp
                        check?</Link>
                </Box>
                <Paper sx={{p: 2}}>
                    <PostureCop/>
                </Paper>
                <Alert severity="warning">Detach this tab to a separate window and don't minimize it, otherwise
                    the camera stream will pause and the application will stop working.</Alert>
            </Stack>
        </ThemeProvider>
    );
}

const styles = {
    page: {
        maxWidth: "600px",
        marginX: "auto",
        padding: 2,
    }
}

export default App;
