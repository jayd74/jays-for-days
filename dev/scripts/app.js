import React from 'react';
import ReactDOM from 'react-dom';
import JordanCard from './jordan.js';
import MoreInfo from './moreInfo.js';
// import MoreInfo from './moreInfo.js';

// Initialize Firebase
var config = {
  apiKey: "AIzaSyA5gdRDQlSVluUK_KbS_JwJjfB34gTN3bk",
  authDomain: "jays-for-days.firebaseapp.com",
  databaseURL: "https://jays-for-days.firebaseio.com",
  projectId: "jays-for-days",
  storageBucket: "jays-for-days.appspot.com",
  messagingSenderId: "947144248099"
};
firebase.initializeApp(config);


class App extends React.Component {
    constructor (){
      super();
      this.state = {
        jordanCollection: [],
        showInfo: false,
        colorways: ''
      };
      // console.log (this.state)
      this.handleChange = this.handleChange.bind(this);
      this.toggleCompleted = this.toggleCompleted.bind(this);
      this.showInfo = this.showInfo.bind(this);
      this.hideInfo = this.hideInfo.bind(this);
      this.addColourway = this.addColourway.bind(this)
    }
    handleChange(e) {
      e.preventDefault();
      this.setState({
        [e.target.id]: e.target.value
      })
      console.log(e.target.value)
    }
    componentDidMount(){
      const dbref = firebase.database().ref('/jordans');
      dbref.on('value', (snapshot) => {
        const data = snapshot.val();
        // console.log(data)
        const state = []
        // console.log(state)
        for (let key in data) {
          // console.log(key)
          data[key].key = key;
          state.push(data[key])
          // console.log(state)
        }
        for (let key in data) {
        }
        this.setState({
          jordanCollection: state,
          colorways: state
        })
        console.log(this.state)
      })
      // const provider = new firebase.auth.GoogleAuthProvider();

      // firebase.auth().signInWithPopup(provider).then(function (result) {
      //   // This gives you a Google Access Token. You can use it to access the Google API.
      //   const token = result.credential.accessToken;

      //   // Get the signed-in user info.
      //   const user = result.user;
      //   // ...
      // }).catch(function (error) {
      //   // Error handling goes in here.
      //   console.log(error)
      // });
    } //end componentDidMount()
    toggleCompleted(shoe){
      shoe.preventDefault
      const jordanCheck = this.state.jordanCollection.find((jays) => {
        // console.log(jays.key)
         return jays.key === shoe.key;
      });
   
      const dbref = firebase.database().ref(`/jordans/${jordanCheck.key}`)
      // console.log(dbref);

      jordanCheck.completed = jordanCheck.completed === true ? false : true;

      delete jordanCheck.key;
      dbref.set(jordanCheck);  
    }
    showInfo(e,i) {
      e.preventDefault();
      this.setState({
        showInfo:true,
        shoeToShow: this.state.jordanCollection[i]
      })
    }
    hideInfo(e) {
      e.preventDefault();
      console.log('close')
      this.setState({
        showInfo: false
      })
    }
    addColourway(key) {
      // console.log(this.state.jordanCollection[i])
      // const dbref = firebase.database().ref(`/jordans/`)
      // console.log(dbref)
      // console.log(key)
      const dbref = firebase.database().ref(`/jordans/${key}/colorways`);

      dbref.push(this.state.colorways)



    //    this.setState({
    //    colorways: ''
    //  })
    }
    render() {
      return (
        <div>
          <div className="wrapper">
            <header>
              <h1>Jays For Days</h1>
            </header>
          
            <ul className="collection">
              {this.state.jordanCollection.map((shoe, i) => {
                // console.log(i)
                return (
                  <JordanCard data={shoe} key={i} value={i} toggleCompleted={this.toggleCompleted} showInfo={(e) => this.showInfo(e,i)}/>
                  // <MoreInfo onClick={this.showInfo}/>
                )
              })}
            
            </ul>
           


                  {this.state.showInfo ? 
                  <MoreInfo data={this.state.shoeToShow} closeBox={this.hideInfo} onChange={this.handleChange}addColourway={this.addColourway}/> 
                  : null}

            
            


          </div>
        
        </div>
      )
    }
}

ReactDOM.render(<App />, document.getElementById('app'));
