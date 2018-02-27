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
                    <h4>{Object.values(this.props.data.colorways)}</h4>
                    <form action="" onSubmit={this.handleSubmit}>
                        <input id="colorways" type="text" placeholder="enter colourway" onChange={this.props.onChange} value={this.props.addColourway.colorways}/>
                        <input type="submit"/>
                    </form>
                    
                    
                </div>
            

                {/* {this.findColor()
                //     this.props.data.colorways.map((color, i) => {
                //     console.log(color)
                // })

                
                    // this.props.data.colorways.map((color, i) => {
                    //     console.log(color)
                    // })
                }
                 */}

                
                
            </div>
        )    
    }
}

export default MoreInfo;
