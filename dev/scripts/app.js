import React from 'react';
import ReactDOM from 'react-dom';
import Jordan from '../../jordan.json'


console.log(Jordan)
class App extends React.Component {
    render() {
      return (
        <div>
          Jordan
        </div>
      )
    }
}

ReactDOM.render(<App />, document.getElementById('app'));
