import React from 'react'

// showInfo() {
//     console.log('something')
// }
const JordanCard = (props) => {
    // console.log(props.data)
    return (
    
        <li className={props.data.completed === true ? 'completed' : null}>
        <label htmlFor={props.data.model}>
            <input type="checkbox" value={props.data.key} id={props.data.model} onChange={() => {props.toggleCompleted(props.data)}} checked={props.data.completed}/>

            <button onClick={props.showInfo} value={props.data.key}>more info</button>

            <img src={props.data.image} alt={props.data.model} />
            <h2>{props.data.model}</h2>
        </label>
        </li>
    )
}

export default JordanCard;