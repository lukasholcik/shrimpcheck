import React from 'react';
import {PostureCop} from "./Component/PostureCop";
import {CssBaseline, ThemeProvider} from "@mui/material";
import {THEME} from "./theme/theme";

function App() {
    return (
        <ThemeProvider theme={THEME}>
            <CssBaseline/>
            <PostureCop/>
        </ThemeProvider>
    );
}

export default App;
