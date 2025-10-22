import { useState, useEffect } from "react";
import Spinner from 'react-bootstrap/Spinner';
import InfoBox from "../InfoBox/InfoBox";

// Component displaying a leaderboard of majors ranked by XP
function LeaderboardTable({ data = [] }) {
    // Loading state
    const [loading, setLoading] = useState(true);

    // On page loading
    useEffect(()=>{
        //Simulating latency 1000ms to see spinner
        const timer = setTimeout(()=>{
            setLoading(false);
        }, 1000)
        return () => clearTimeout(timer);
    }, [])


    // Use provided leaderboard data, or default sample if none is passed
    const leaderboardData =
        data.length > 0
            ? data
            : [
                  { rank: 1, major: "Computer Science", xp: 48000 },
                  { rank: 2, major: "Mechanical Engineering", xp: 46000 },
                  { rank: 3, major: "Electrical Engineering", xp: 45000 },
              ];

    // If loading data, show spinner
    if(loading){
        return(
            <InfoBox title={"Major Leaderboard"}>
            {/* Loop through leaderboard data and render each row */}
            {leaderboardData.map((item, i) => (
                <div
                    key={i}
                    className={`row ${
                        i === 0
                            ? "topMajor" // Highlight top-ranked major
                            : "normalMajor" // Default style for others
                    }`}
                >
                    <Spinner animation="border" role="status" className="spinner">
                        <span className="visually-hidden">Loading...</span>
                    </Spinner>
                </div>
            ))}
        </InfoBox>
        )
        
    }

    return (
        <InfoBox title={"Major Leaderboard"}>
            {/* Loop through leaderboard data and render each row */}
            {leaderboardData.map((item, i) => (
                <div
                    key={i}
                    className={`row ${
                        i === 0
                            ? "topMajor" // Highlight top-ranked major
                            : "normalMajor" // Default style for others
                    }`}
                >
                    {/* Major name and rank */}
                    <div className="left">
                        <span className="rankMajor">{`${item.rank}: ${item.major}`}</span>
                    </div>

                    {/* XP points, formatted with commas */}
                    <div className="right">
                        <span className="xp">
                            {item.xp.toLocaleString()} XP
                        </span>
                    </div>
                </div>
            ))}
        </InfoBox>
    );
}

export default LeaderboardTable;
