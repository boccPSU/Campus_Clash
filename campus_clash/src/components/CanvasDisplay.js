// Used for testing Canvas API
//Imports
import {useEffect, useState} from "react"
import {canvasGet} from "../api/canvas"

//Component function
export default function CanvasDisplay(){
    //List of data we want from api
    const [studentName, setStudentName] = useState(null);

    //Other important states to store
    const [loading, setLoading] = useState(true)
    //useEffect function
    useEffect(()=>{
        (async () => {
            try{
                const student = await canvasGet("/v1/users/self");
                console.log("Student: " , student)
                setStudentName(student);
            }
            catch (e){
                console.error("Error: " + e);
            }
            finally{
                setLoading(false);
            }
        })();
        
        return ()=>{}
    }, [])

    //Show loading screen while loading
    if(loading){
        return <p>Page Loading . . .</p>
    }

    //If not loading, return data
    return(
        <div>
            <h1>Student Name: </h1>
            <p>{JSON.stringify(studentName, null, 2)}</p>
        </div>
    )
}