// src/screens/LeaderboardScreen.js
import React, { useRef, useState, useEffect } from "react";

import ScreenScroll from "../../components/ScreenScroll/ScreenScroll";
import PullToRefresh from "../../components/interaction/PullToRefresh";
import useCollapseOnScroll from "../../components/hooks/useCollapseOnScroll";

import InfoTile from "../../newComponents/InfoTile/InfoTile";
import TopMajorsCard from "../../components/TopMajorsCard/TopMajorsCard";
import MajorGraphCard from "../../components/MajorGraph/MajorGraphCard";
import LeaderboardTable from "../../components/LeaderboardTable/LeaderboardTable";

import XpHeaderBar from "../../newComponents/XpHeaderBar/XpHeaderBar";
import BottomNavBar from "../../newComponents/BottomNavBar/BottomNavBar";



export default function NewLeaderboardScreen() {
    const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
    const [error, setError] = useState();
    const [data, setData] = useState([]);

    // TODO: replace with real user data when wired up
    const [userLevel] = useState(4);
    const [userXp] = useState(1200);
    const [xpForNextLevel] = useState(1500);

    const scrollerRef = useRef(null);
    const collapsed = useCollapseOnScroll(scrollerRef); // not strictly needed here but harmless

    useEffect(() => {
        (async () => {
            setLoadingLeaderboard(true);

            try {
                const res = await fetch("http://localhost:5000/api/major-xp");

                if (!res.ok) {
                    const errBody = await res.json().catch(() => ({}));
                    throw new Error("Failed to fetch Majors-XP", {
                        cause: errBody.cause,
                    });
                }

                const body = await res.json();
                const rows = Array.isArray(body) ? body : body.rows;

                if (!Array.isArray(rows)) {
                    throw new Error("Majors-XP response is not an array");
                }

                const mappedData = rows.map((row, idx) => ({
                    rank: idx + 1,
                    major: row.major ?? "Unknown",
                    xp: row.totalXp ?? row.xp ?? 0,
                }));

                setData(mappedData);
                console.log("[LEADERBOARD] Fetched major XP data:", mappedData);
            } catch (e) {
                console.error(e);
                setError(e.cause || e.message || "Unknown error");
            } finally {
                setLoadingLeaderboard(false);
            }
        })();
    }, []);

    // Fake refresh for PullToRefresh demo
    const refresh = async () => {
        await new Promise((r) => setTimeout(r, 900));
        setData((prev) =>
            prev.map((row) =>
                row.rank === 1 ? { ...row, xp: row.xp + 100 } : row
            )
        );
    };

    return (
        <>
            <ScreenScroll ref={scrollerRef}>
                <PullToRefresh scrollerRef={scrollerRef} onRefresh={refresh}>
                    <div className="leaderboardScreen">
                        {/* XP / Gems header strip */}
                        <div className="leaderboardScreen-xpHeader">
                            <XpHeaderBar
                                level={userLevel}
                                currentXp={userXp}
                                xpForNextLevel={xpForNextLevel}
                            />
                        </div>

                        <main className="leaderboardScreen-content">
                            <h1 className="leaderboardScreen-title">
                                Leaderboard
                            </h1>

                            {error && (
                                <div className="leaderboardScreen-error">
                                    {error}
                                </div>
                            )}

                            <InfoTile title="Top Majors">
                                <TopMajorsCard
                                    topMajors={(data ?? [])
                                        .slice(0, 3)
                                        .map((r, i) => ({
                                            rank: i + 1,
                                            major: r.major,
                                            xp: r.xp ?? 0,
                                        }))}
                                />
                            </InfoTile>

                            <InfoTile title="Major XP Graph">
                                <MajorGraphCard data={data ?? []} />
                            </InfoTile>

                            <InfoTile title="Full Leaderboard">
                                <LeaderboardTable
                                    data={data}
                                    loading={loadingLeaderboard}
                                />
                            </InfoTile>
                        </main>
                    </div>
                </PullToRefresh>

                {/* Spacer so fixed BottomNavBar doesn’t overlap content */}
                <div className="leaderboardScreen-bottomSpacer" />
            </ScreenScroll>

            <BottomNavBar />
        </>
    );
}


