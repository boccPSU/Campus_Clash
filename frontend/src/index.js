import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import CanvasDisplay from "./components/CanvasDisplay";
import {BrowserRouter as Router} from "react-router-dom";
import "./css/index.scss";
//import 'bootstrap/scss/bootstrap.scss';
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <React.StrictMode>
        {/* sets each screen to a distinct URL within the app */}
        <Router>
            <App />
        </Router>
    </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
