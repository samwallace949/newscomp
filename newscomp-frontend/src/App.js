import logo from './logo.svg';
import styles from './App.css';
import TopLevelSearch from "./TopLevelSearch.js";

import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
    <div>
     <script src="./node_modules/axios/dist/axios.min.js"></script>
     <TopLevelSearch isTopLevel ={true}/>
     {/* <Split className="Split"/> */}
    </div>
  );
}

export default App;
