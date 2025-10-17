// Container to hold all information sections

// Note: React will pass any tags between <InfoBox> ... </InfoBox> as a prop named children, InfoBox parameter must be named children
function InfoBox({children, title}){
    return(
        <div className="infoBox">
            <h2>{title}</h2>
            <div>{children}</div>
        </div>
    )
}  

export default InfoBox;