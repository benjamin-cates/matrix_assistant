import React, { ReactElement } from "react"


interface ElementListProps { name: string, class?: string }
//Displays a list of elements. Has the add and clear functions
class ElementList extends React.Component<ElementListProps> {
    state: {
        //List of elements to display
        elements: ReactElement[];
    }
    constructor(props: ElementListProps) {
        super(props);
        this.state = { elements: [] };
    }
    render() {
        let els = this.state.elements.map((el, i) =>
            <div className={this.props.class} key={i.toString()}>{el}</div>
        );
        return <div id={this.props.name}>{els}</div>
    }
    add = (el: ReactElement) => {
        let elements = this.state.elements.slice();
        //Prevent weirdness when it is not rerendered between every add
        this.state.elements.push(el);
        elements.push(el);
        //Actual state update
        this.setState({ elements });
    }
    clear = () => {
        //Remove all elements in list
        this.state.elements = [];
        this.setState({ elements: [] });
    }
}
export default ElementList;