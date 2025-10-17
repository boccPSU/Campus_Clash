import { Card} from "react-bootstrap";


function StudyTaskCard({ title, description, onCheck }) {
  return (
    <Card className="studyCardTask">
      {/* Checkbox in top-left corner */}
        <div className="form-check">
            <input className="form-check-input" type="checkbox" value=""></input>
            {/* Title and description */}
            <h6 className="title">{title}</h6>
            <p className="description">{description}</p>
        </div>
    </Card>
  );
}

export default StudyTaskCard;
