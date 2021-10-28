import logo from './logo.svg';
import './App.css';
import Filter from "./filter-window/filter.js";
import Split from "./split-window/split.js";

function App() {
  return (
    <div>
     <Filter className = "Filter-window"/>
     <Split className = "Split-window"/>
    </div>
  );
}

export default App;
