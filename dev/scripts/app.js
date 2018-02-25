import React from 'react';
import ReactDOM from 'react-dom';
import JordanCard from './jordan.js'

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
        jordanCollection: []
      };
      
      this.handleChange = this.handleChange.bind(this);
      this.toggleCompleted = this.toggleCompleted.bind(this);
    }
    handleChange(e) {
      console.log ('change')
      e.preventDefault();
      this.setState({
        [e.target.id]: e.target.value,
      })
    }

    componentDidMount(){
      const dbref = firebase.database().ref('/jordans');
      dbref.on('value', (snapshot) => {
        const data = snapshot.val();
        // console.log(data)
        const state = []
        for (let key in data) {
          state.push(data[key])
        }
        // console.log(state)
        this.setState({
          jordanCollection: state,
        })
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
    toggleCompleted(e){
      // console.log(e)
      // console.log(e.target.value)
      const jordanCheck = this.state.jordanCollection.find((jays) => {
        console.log(jays.url)
         return jays.url;
      });

      console.log(jordanCheck.url)

      const dbref = firebase.database().ref(`/jordans/`)
      // console.log(dbref);

      // jordanCheck.completed = jordanCheck.completed === true ? false : true;

      // delete jordanCheck.key;
      // dbref.push(jordanCheck);  
    }
    showInfo() {
      
    }
    render() {
      return (
        <div>
          <div className="wrapper">
            <header>
              <h1>Header</h1>
            </header>
          
            <ul className="collection">
              {this.state.jordanCollection.map((shoe, i) => {
                // console.log(i)
                return (
                  <JordanCard data={shoe} key={i} value={i} toggleCompleted={this.toggleCompleted}/>
                )
              })}
            </ul>

          </div>
        
        </div>
      )
    }
}

ReactDOM.render(<App />, document.getElementById('app'));
