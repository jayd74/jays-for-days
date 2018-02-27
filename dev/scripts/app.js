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
      //set original state for app
      super();
      this.state = {
        jordanCollection: [],
        showInfo: false,
        colorways: ''
      };
      // function binders
      this.handleChange = this.handleChange.bind(this);
      this.toggleCompleted = this.toggleCompleted.bind(this);
      this.showInfo = this.showInfo.bind(this);
      this.hideInfo = this.hideInfo.bind(this);
      this.addColourway = this.addColourway.bind(this)
    }
    //function to handle change on events
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
        const state = []
        for (let key in data) {
          data[key].key = key;
          state.push(data[key])
        }    
        this.setState({
          jordanCollection: state,
        })
      })

      //implementation of google authenication.

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
    // toggle checkbox for to mark completion of show
    toggleCompleted(shoe){
      shoe.preventDefault
      const jordanCheck = this.state.jordanCollection.find((jays) => {
         return jays.key === shoe.key;
      });
      // referring to firebase to find state of completed.
      const dbref = firebase.database().ref(`/jordans/${jordanCheck.key}`)
      jordanCheck.completed = jordanCheck.completed === true ? false : true;
      delete jordanCheck.key;
      dbref.set(jordanCheck);  
    }
    // function to check for event to show 'moreInfo'
    showInfo(e,i) {
      e.preventDefault();
      this.setState({
        showInfo:true,
        shoeToShow: this.state.jordanCollection[i]
      })
    }
    //hide info upon click of x
    hideInfo(e) {
      e.preventDefault();
      this.setState({
        showInfo: false
      })
    }
    // add colourway to jordanCollection/colorways
    addColourway(key) {    
      const dbref = firebase.database().ref(`/jordans/${key}/colorways`);  
      dbref.push(this.state.colorways)
    }
    // render everything onto html page
    render() {
          return (
            <div>
          <div className="wrapper">
            <header>
              <h1>Jays For Days</h1>
            </header>
            <ul className="collection">
              {this.state.jordanCollection.map((shoe, i) => {
                return (
                  <JordanCard data={shoe} key={i} value={i} toggleCompleted={this.toggleCompleted} showInfo={(e) => this.showInfo(e,i)}/>
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
