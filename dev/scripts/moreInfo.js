import React from 'react'

class MoreInfo extends React.Component {
    constructor(){
        super();
        this.handleSubmit = this.handleSubmit.bind(this)
    }
    handleSubmit(e){
        e.preventDefault();
        this.props.addColourway(this.props.data.key)
        
    }
    render(){
        console.log(this.props.data.colorways)
        return(
            <div className="moreInfo">
                <h3>{this.props.data.model}</h3>
                <h5>{this.props.data.year}</h5>
                <h5>{this.props.data.designer}</h5>
                <h5>{this.props.data.url}</h5>
                {/* <h5>{this.props.data.colorways}</h5> */}
                <form action="" onSubmit={this.handleSubmit}>
                    <input id="colorways" type="text" placeholder="enter colourway" onChange={this.props.onChange} value={this.props.addColourway.colorways}/>
                    <input type="submit"/>
                </form>
                <button onClick={this.props.closeBox}>
                    X
                </button>
            </div>
        )    
    }
}

export default MoreInfo;
