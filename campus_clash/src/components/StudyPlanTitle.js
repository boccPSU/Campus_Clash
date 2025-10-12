// Title card for each study plan
import { Card } from "react-bootstrap"
function StudyPlanTitle({title, gpaImpactLevel}){
    return(
        <Card className="studyCardTitle">
            <h4 className="title">{title}</h4>
            <div className="gpaImpact">{gpaImpactLevel} GPA Impact</div>
        </Card>
    )
}

export default StudyPlanTitle;