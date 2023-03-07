import React from 'react';
import {PostureCop} from "./Component/PostureCop";
import {Box, CssBaseline, Link, Stack, ThemeProvider, Typography} from "@mui/material";
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
                <PostureCop/>
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
