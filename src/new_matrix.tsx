import React from "react";

//Contains the interfacde for the new matrix button
interface NewMatrixProps { callback: (w: number, h: number) => void, errRef: { add: (el: React.ReactElement) => void, clear: () => void } };
export default class NewMatrix extends React.Component<NewMatrixProps> {
    state: {
        newMatrixWidth: string;
        newMatrixHeight: string;
    }
    constructor(props: NewMatrixProps) {
        super(props);
        //Default to 3x4
        this.state = { newMatrixWidth: "4", newMatrixHeight: "3" };
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
        let w = this.state.newMatrixWidth;
        let h = this.state.newMatrixHeight;
        return <div id="newMatrix">
            <table><tbody>
                <tr>
                    <td>Width:</td>
                    <td><input className={this.isInvalid(w) ? "invalid_ratio" : ""} value={this.state.newMatrixWidth} id="newMatrixWidth" onChange={this.onChange} /></td></tr>
                <tr>
                    <td>Height:</td>
                    <td><input className={this.isInvalid(h) ? "invalid_ratio" : ""} value={this.state.newMatrixHeight} id="newMatrixHeight" onChange={this.onChange} /></td></tr>
            </tbody></table>
            <button onClick={this.create}>New Matrix</button>
        </div>;
    }
    create = () => {
        this.props.errRef.clear();
        //Check if dimensions are valid
        if (this.isInvalid(this.state.newMatrixWidth) || this.isInvalid(this.state.newMatrixHeight)) {
            this.props.errRef.add(<div>Invalid matrix size</div>);
            return
        }
        //If so, alert parent through callback
        this.props.callback(Math.floor(Number(this.state.newMatrixWidth)), Math.floor(Number(this.state.newMatrixHeight)));
    }
    onChange = (e: React.SyntheticEvent) => {
        //On change of dimension inputs
        this.setState({
            //@ts-ignore
            [e.target.id]: e.target.value
        });
    }
}