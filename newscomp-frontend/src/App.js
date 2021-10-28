import logo from './logo.svg';
import styles from './App.css';
import Filter from "./filter-window/filter.js";
import Split from "./split-window/split.js";

function App() {
  return (
    <div>
     <script src="./node_modules/axios/dist/axios.min.js"></script>
     <Filter />
     {/* <Split className="Split"/> */}
    </div>
  );
}

export default App;
