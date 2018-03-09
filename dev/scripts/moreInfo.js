import React from 'react'
import Colorway from './colorway'

class MoreInfo extends React.Component {
    constructor(){
        super();
        this.handleSubmit = this.handleSubmit.bind(this);
    }
    //function to handleSubmit to add colorway to firebase
    handleSubmit(e){
        e.preventDefault();
        this.props.addColourway(this.props.data.key)       
       console.log(this.props.data)
    }
    //renders the moreInfo DIV
    render(){
    return(            
            <div className="moreInfo">
                <div className="shoeImg">
                    <img src={this.props.data.image} alt=""/>
                </div>
                <div className="shoeInfo">
                    <button onClick={this.props.closeBox}>
                        X
                    </button>
                    <h5>Model</h5>
                    <h2>{this.props.data.model}</h2>

                    <h5>Year</h5>
                    <h4>{this.props.data.year}</h4>

                    <h5>Designer</h5>
                    <h4>{this.props.data.designer}</h4>

                    <h5>Colourways</h5>

                    {/* {Object.values(this.props.data.colorways).map((color) =>{
                        return 
                        <div>
                            <Colorway data={color}/>
                        </div>
                    })} */}
                    <h4>{Object.values(this.props.data.colorways)}</h4>
                    <form action="" onSubmit={this.handleSubmit}>
                        <input id="colorways" type="text" placeholder="enter colourway" onChange={this.props.onChange} value={this.props.addColourway.colorways}/>
                        <input type="submit"/>
                    </form>
                    <h5>Details</h5>
                    <h3><a href={this.props.data.url} target="_blank">{this.props.data.url}</a></h3>
                </div>               
            </div>
        )    
    }
}

export default MoreInfo;
