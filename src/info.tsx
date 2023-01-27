import React from "react";

interface NewPuzzleProps { callback: (w: number, h: number) => void, errRef: { add: (el: React.ReactElement) => void, clear: () => void } };
export default class NewPuzzle extends React.Component<NewPuzzleProps> {
    state: {
        newPuzzleWidth: string;
        newPuzzleHeight: string;
    }
    constructor(props: NewPuzzleProps) {
        super(props);
        //Default to 3x4
        this.state = { newPuzzleWidth: "4", newPuzzleHeight: "3" };
    }
    //Tests if puzzle size is invalid
    isInvalid(str: string) {
        let num = Math.floor(Number(str));
        if ((str || 0) != num.toString()) return true;
        if (num <= 0) return true;
        if (num > 20) return true;
        return false;
    }
    render() {
        let w = this.state.newPuzzleWidth;
        let h = this.state.newPuzzleHeight;
        return <div id="newPuzzle">
            <table><tbody>
                <tr>
                    <td>Width:</td>
                    <td><input className={this.isInvalid(w) ? "invalid_ratio" : ""} value={this.state.newPuzzleWidth} id="newPuzzleWidth" onChange={this.onChange} /></td></tr>
                <tr>
                    <td>Height:</td>
                    <td><input className={this.isInvalid(h) ? "invalid_ratio" : ""} value={this.state.newPuzzleHeight} id="newPuzzleHeight" onChange={this.onChange} /></td></tr>
            </tbody></table>
            <button onClick={this.create}>New Puzzle</button>
        </div>;
    }
    create = () => {
        this.props.errRef.clear();
        //Check if dimensions are valid
        if (this.isInvalid(this.state.newPuzzleWidth) || this.isInvalid(this.state.newPuzzleHeight)) {
            this.props.errRef.add(<div>Invalid matrix size</div>);
            return
        }
        //If so, alert parent through callback
        this.props.callback(Math.floor(Number(this.state.newPuzzleWidth)), Math.floor(Number(this.state.newPuzzleHeight)));
    }
    onChange = (e: React.SyntheticEvent) => {
        //On change of dimension inputs
        this.setState({
            //@ts-ignore
            [e.target.id]: e.target.value
        });
    }
}