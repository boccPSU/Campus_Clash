// Main Tile component to display information with a title, subtitile, optional icons, and children content

import React from 'react';


function InfoTile({ title, subtitle, icon, children }) {
    return (
        <div className="infoTile">
            <div className="title-header">
                {icon && <span className="title-icon">{icon}</span>}
                <div className="title-texts">
                    <h2 className="title-text">{title}</h2>
                    {subtitle && <h4 className="title-subtitle">{subtitle}</h4>}
                </div>
            </div>
            <div className="tile-content">
                {children}
            </div>
        </div>
    );
}



export default InfoTile;