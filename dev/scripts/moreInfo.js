import React from 'react'

class MoreInfo extends React.Component {
    constructor(){
        super();
        this.handleSubmit = this.handleSubmit.bind(this)
        this.findColor = this.findColor.bind(this)
    }
    handleSubmit(e){
        e.preventDefault();
        this.props.addColourway(this.props.data.key)
        
        
       console.log(this.props.data)
    }

    findColor() {
        for (let color in this.props.data.colorways) {
            console.log(color);
            console.log(Object.values(color));
            
        }
        // console.log(Object.values(this.props.data.colorways))
    }
    render(){
        // console.log(this.props.data.colorways)
        // for (let color in this.props.data.colorways) {
        //     // console.log(color)
        //     return color
        // }
        // console.log(color)
        return(
            // console.log(this.prop.data)
            
            <div className="moreInfo">
                <h3>{this.props.data.model}</h3>
                <h5>{this.props.data.year}</h5>
                <h5>{this.props.data.designer}</h5>
                <h5>{this.props.data.url}</h5>
                <h4>{Object.values(this.props.data.colorways)}</h4>
            

                {/* {this.findColor()
                //     this.props.data.colorways.map((color, i) => {
                //     console.log(color)
                // })

                
                    // this.props.data.colorways.map((color, i) => {
                    //     console.log(color)
                    // })
                }
                 */}

                
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
