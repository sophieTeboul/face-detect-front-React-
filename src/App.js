import React, {Component, Fragment} from 'react';
import './App.css';
import Particles from 'react-particles-js';
import Navigation from './components/navigation/Navigation';
import Logo from './components/logo/Logo';
import Rank from './components/rank/Rank';
import SignIn from './components/signIn/SignIn';
import Register from './components/register/Register';
import ImageLinkForm from './components/imageLinkForm/ImageLinkForm';
import FaceRecognition from './components/faceRecognition/FaceRecognition';

import Clarifai from 'clarifai';

const app = new Clarifai.App({
 apiKey: 'cf4646769326415dbf01d16650a23f48'
});

const particlesOptions = {
  particles: {
    number: {
      value: 40,
      density: {
        enable:true,
        value_area:200
      }
    }               
  }
}
class App extends Component {
  constructor(){
    super();
    this.state = {
      input: '',
      imageUrl:'',
      box: {},
      faces: [],
      route: 'signin',
      isSignedIn: false,
      user: {
        id:'',
        name: '',
        email: '',
        password:'',
        joined: ''
      }
    }
  }

  calculateFaceLocation = (data) => {
    this.setState({ faces: []});
    const image = document.getElementById('inputimage');
    const width = Number(image.width);
    const height = Number(image.height);
    for (var i=0; i<data.outputs[0].data.regions.length; i++){
      const clarifaiFace = data.outputs[0].data.regions[i].region_info.bounding_box;
      this.setState(prevState => ({
                  faces: [...prevState.faces, {
                      key: i,
                      leftCol: clarifaiFace.left_col * width,
                      topRow: clarifaiFace.top_row * height,
                      rightCol: width - (clarifaiFace.right_col * width),
                      bottomRow: height - (clarifaiFace.bottom_row * height)
                    }
                  ]
      }));
    }
  }

    loadUser = (data) => {
    this.setState({
      user: {
        id:data.id,
        name: data.name,
        email: data.email,
        password:data.password,
        joined: data.joined
        }
      }
    )
  }

    onButtonSubmit = () => {
      this.setState({imageUrl: this.state.input });
      app.models
      .predict(
        Clarifai.FACE_DETECT_MODEL,
        this.state.input)
       .then(response => {
        if (response)
          fetch('http://localhost:4000/image', {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
              id:this.state.user.id
            })
          })
        .then(response => response.json())
        .then(count => {
          this.setState(Object.assign(this.state.user))
        })
        this.calculateFaceLocation(response)
      })
       .catch(err => console.log(err));
        // there was an error
    }

 onRouteChange = (route) => {
    if (route === 'signout')
      this.setState({isSignedIn: false});
    else if (route === 'home')
      this.setState({isSignedIn: true});
    this.setState({route: route});
  }

  onInputChange = (event) => {
      this.setState({input: event.target.value});
  }

  render() {
    return (
      <div className="App">
        <Particles className='particles' params={particlesOptions} />
        <Navigation isSignedIn={this.state.isSignedIn} onRouteChange={this.onRouteChange} />
       {  this.state.route === 'home' ?
        <Fragment>
           <Logo />
            <Rank
                name={this.state.user.name}
              />
           <ImageLinkForm onInputChange={this.onInputChange} onButtonSubmit={this.onButtonSubmit}/>
          <FaceRecognition faces={this.state.faces} imageUrl={this.state.imageUrl} />
         </Fragment>
        :  
          <SignIn loadUser={this.loadUser} onRouteChange={this.onRouteChange} />           
      
      }
      </div>
    );
  }
}

export default App;
