// Container to hold all information sections

// Note: React will pass any tags between <InfoBox> ... </InfoBox> as a prop named children, InfoBox parameter must be named children
function InfoBox({children}){
    return(
        <div className="infoBox">
            <h2>Container Header</h2>
            <div className="inner-content">{children}</div>
        </div>
    )
}  

export default InfoBox;