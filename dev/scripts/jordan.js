import React from 'react'

const JordanCard = (props) => {
    // console.log(props.data)
    return (
        <li className={props.data.completed === true ? 'completed' : null}>
            <img src={props.data.image} alt="" />
            <h2>{props.data.model}</h2>
            <input type="checkbox" value={props.data.url} onChange={() => {props.toggleCompleted(props.data)}} checked={props.data.completed}/>
        </li>
    )
}

export default JordanCard;