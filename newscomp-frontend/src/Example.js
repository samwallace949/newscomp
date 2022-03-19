function Example(props){
    console.log("called");
    return(
        <div className="border example-box">{props.exText}</div>
    );
}

export default Example;