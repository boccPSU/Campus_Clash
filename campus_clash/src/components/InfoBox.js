// Container to hold all information sections


function InfoBox({children}){
    return(
        <div className="container-style">
            <h2>Container Header</h2>
            <div className="inner-content">{children}</div>
        </div>
    )
}  

export default InfoBox;