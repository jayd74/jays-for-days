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
        colorways: '',
        loggedIn: false,
        guestMode: false,
        user: null,
        selectedShoe: ''
      };
      // function binders
      this.handleChange = this.handleChange.bind(this);
      this.toggleCompleted = this.toggleCompleted.bind(this);
      this.showInfo = this.showInfo.bind(this);
      this.hideInfo = this.hideInfo.bind(this);
      this.addColourway = this.addColourway.bind(this);
      this.signIn = this.signIn.bind(this);
      this.signOut = this.signOut.bind(this);
      this.saveCollection = this.saveCollection.bind(this);
    }
    //function to handle change on events
    handleChange(e) {
      e.preventDefault();
      this.setState({
        [e.target.id]: e.target.value
      })
    }
    signIn() {
      const provider = new firebase.auth.GoogleAuthProvider();

     
      firebase.auth().signInWithPopup(provider)
        .then ((user) => {
        }) 
      // provider.setCustomParameters({
      //   prompt: 'select_account'
      // })
    }
    guestSignIn() {
      firebase.auth().signInAnonymously().catch(function (error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        this.setState({
          guestMode: true
        })
        // ...
      });
    }
    signOut() {
      firebase.auth().signOut()
      // .then(function (success) {
      //   console.log('Signed out!')
      // }, function (error) {
      //   console.log(error);
      // });
    }
    saveCollection () {
      const dbrefUser= firebase.database().ref(`/users/${firebase.auth().user.uid}`)
      console.log(this.state)
      dbref.push({}) 
    //   console.log(dbref)
    //   dbref.on('value', (snapshot) => {
    //     const data = snapshot.val();
    //     console.log(data)
    //     const state = []
    //     for (let key in data) {
    //       data[key].key = key;
    //       state.push(data[key])
    //     }
    //     console.log(state);
    //     this.setState({
    //       jordanCollection: state,
    //     })
    // }
  }
    componentDidMount(){
      firebase.auth().onAuthStateChanged((user) => {
        if (user) {
          this.setState ({
            loggedIn: true,
            user: user.uid,
            userName: user.displayName,
            jordanCollection: []
          })
        
          // const dbref = firebase.database().ref(`/users/`);
          const dbref = firebase.database().ref(`/jordans/`)
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
            const dbrefUser = firebase.database().ref(`/users/${this.state.user}`)
            dbrefUser.set(state)
        } //end if (user) is loggedIn
        else if (user) {
          // User is signed in.
          const isAnonymous = user.isAnonymous;
          const uid = user.uid;
          this.setState({
            loggedIn: false,          
          })

          const dbref = firebase.database().ref(`/jordans/`)
          dbref.on('value', (snapshot) => {
            const data = snapshot.val();
          
            const state = []
            for (let key in data) {
              data[key].key = key;
              state.push(data[key])
            }
            console.log(state);
            this.setState({
              jordanCollection: state,
            })
          })
        }
        else {
          this.setState({
            guestMode: false,
            loggedIn: false,
            jordanCollection: [],
            user: {}
          })
        }
      }) //end firebase.auth9
      } //end componentDidMount()
      // toggle checkbox for to mark completion of show
      toggleCompleted(shoe, i){
        shoe.preventDefault
        const shoeArray = Array.from(this.state.jordanCollection);
        shoeArray[i].completed = shoeArray[i].completed === true ? false : true;
        this.setState({
          jordanCollection: shoeArray
        })
      // // referring to firebase to find state of completed.
      const dbrefUser = firebase.database().ref(`/users/${firebase.auth().user}`)

      dbrefUser.set(shoeArray);  
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
              <div className="sign-in-btn">
                  <button className="sign-in-out" onClick={this.guestSignIn}>Sign In As Guest</button>
                  <button className="sign-in-out" onClick={this.state.loggedIn ? this.signOut : this.signIn}>
                {this.state.loggedIn ? <div><p>Sign Out {this.state.userName}</p></div> : <div><span><i className="fab fa-google"></i></span>Sign In</div>}
                </button>
              </div>
            </header>
            
            <div className={this.state.loggedIn ? "no-intro" : "intro"}>
              <h2>Jordan Vault</h2>  
              <p>
                Keep track of your Jordan Collection! 
              </p>
              <p>
                Browse through the list to check out each Jordan shoe. 
              </p>
              <p>
                Check off ones that you have collected and add the colourway you own!
              </p>
              <p>
                Sign In to the Vault and check it out!
              </p>
              
            </div>

            <ul className={this.state.loggedIn ? "collection" : "no-collection"}>
              
              {this.state.jordanCollection.map((shoe, i) => {
                return (
                  <JordanCard data={shoe} key={i} value={i} checked={shoe.key === this.state.selectedShoe} toggleCompleted={(e) => this.toggleCompleted(e, i)} showInfo={(e) => this.showInfo(e,i)}/>
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
