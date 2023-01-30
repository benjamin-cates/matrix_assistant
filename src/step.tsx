import React from "react"
import { Ratio, RatioInput } from "./ratio"

/*
STEP DEFINITIONS
    type = "row"
        - Means row swap
        - swap R_idx1 and R_idx2
    type = "col"
        - Means column swap
        - swap C_idx1 and C_idx2 and column names
    type = "set"
        - Means set to be a multiple of row
        - Multiply(num1, R_idx1) -> R_outidx
    type = "add"
        - Means add two rows and store in output
        - Multiply(num1, R_idx1) + Mult(num2,R_idx2) -> R_outidx
*/
export class Step {
    num1: Ratio;
    num2?: Ratio
    idx1: number;
    idx2?: number;
    outidx: number;
    type: string;
    constructor(type: string) {
        this.type = type;
        this.num1 = new Ratio(1, 1);
        this.idx1 = undefined;
        this.outidx = undefined;
    }
}

export const StepDisplay = React.memo(function stepDisplay({ step }: { step: Step }) {
    //Function for ignoring coefficient of one
    const hideOne = (text: string) => text == "1" ? "" : text;
    //Set or add rows
    if (step.type == "set")
        return <>
            {hideOne(step.num1.text())}R<span className="subscript">{step.idx1}</span>
            &nbsp;⇒&nbsp;R<span className="subscript">{step.outidx}</span>
        </>;
    if (step.type == "add") {
        return <>
            {hideOne(step.num1.text())}R<span className="subscript">{step.idx1}</span>&nbsp;+&nbsp;
            {hideOne(step.num2.text())}R<span className="subscript">{step.idx2}</span>
            &nbsp;⇒&nbsp;R<span className="subscript">{step.outidx}</span>
        </>;
    }
    //Row or column swap
    const sym = step.type == "col" ? "C" : "R";
    return <>{sym}<span className="subscript">{step.idx1}</span> ⇔ {sym}<span className="subscript">{step.idx2}</span></>
});

interface StepInputProps {
    //Callback when step is added
    addStep: (step: Step) => void,
    //Whether currently hidden or not
    show?: boolean,
    maxRow: number, maxCol: number,
    //Reference to output errors to
    errRef: { add: (el: React.ReactElement) => void, clear: () => void }
};
export class StepInput extends React.Component<StepInputProps> {
    state: {
        refs: { [key: string]: React.RefObject<RatioInput> };
        vals: { [key: string]: string };
    }
    constructor(props: StepInputProps) {
        const ratioReferences = ["setnum1", "addnum1", "addnum2"];
        super(props);
        //Create initial state
        let refs: { [key: string]: React.RefObject<RatioInput> } = {};
        for (let x of ratioReferences) refs[x] = React.createRef<RatioInput>();
        this.state = { refs, vals: {} };
    }
    handleChange = (event: React.ChangeEvent) => {
        //Update row id inputs on change
        const target = event.target as HTMLInputElement;
        let vals = { ...this.state.vals };
        vals[target.id] = target.value;
        this.setState({ vals });
    }
    private getIndex(name: string) {
        //Get val[name] from state
        let out = Math.floor(Number(this.state.vals[name + "idx"]));
        //Perform some asserts
        if (isNaN(out)) throw "Invalid row index";
        if (out < 0) throw "Index out of bounds";
        if (name.startsWith("col")) {
            if (out > this.props.maxCol) throw "Column index out of bounds";
        } else if (out > this.props.maxRow) throw "Row index out of bounds";
        return out;
    }
    add = (event: React.MouseEvent) => {
        //Clear errors
        this.props.errRef.clear();
        try {
            let type = event.currentTarget.id;
            let op = new Step(type);
            //Get row indicies and coefficients
            op.idx1 = this.getIndex(type + "1");
            if (type != "set") op.idx2 = this.getIndex(type + "2");
            if (type == "set") {
                op.num1 = this.state.refs["setnum1"].current.getRatio();
                if (op.num1 == null) op.num1 = new Ratio(1, 1);
                op.outidx = this.getIndex("seto");
            }
            if (type == "add") {
                op.num1 = this.state.refs["addnum1"].current.getRatio();
                if (op.num1 == null) op.num1 = new Ratio(1, 1);
                op.num2 = this.state.refs["addnum2"].current.getRatio();
                if (op.num2 == null) op.num2 = new Ratio(1, 1);
                op.outidx = this.getIndex("addo");
            }
            //Send to parent and reset inputs
            this.props.addStep(op);
            this.resetNumbers();
        }
        catch (e: any) {
            //Throw string error if invalid
            this.props.errRef.add(<>{String(e)}</>)
        }
    }
    resetNumbers = () => {
        //Reset all of the row id inputs
        let name: string;
        let vals = { ...this.state.vals };
        for (let name in this.state.vals) vals[name] = "";
        this.setState({ vals });
        //Reset ratio inputs
        for (let ratio in this.state.refs) this.state.refs[ratio].current.reset();
    }
    keyPress = (event: React.KeyboardEvent) => {
        //Synthetic enter key to add row operation
        if (event.key == "Enter") {
            //@ts-ignore
            const type = event.target.id.substring(0, 3);
            if (["add", "row", "col", "set"].indexOf(type) != -1)
                //@ts-ignore
                document.querySelector("#" + type).click();
        }
        //Keybinding mappings for each
        const mappings: { [key: string]: string } = {
            "c": "col1idx",
            "r": "row1idx",
            "a": "addnum1",
            "s": "setnum1",
        };
        if (mappings[event.key] != undefined) {
            //@ts-ignore
            document.querySelector("#" + mappings[event.key]).focus();
            event.preventDefault();
        }
    }
    render = () => {
        //Coefficient input generator
        const inp = (name: string) => <RatioInput type="coef" name={name} ref={this.state.refs[name]}></RatioInput>
        //Row id input generator
        const rowinp = (name: string) => <input id={name + "idx"} value={this.state.vals[name + "idx"] || ""} className="step_input row_number_input" onChange={this.handleChange}></input>;
        //Add button generator
        const addbutton = (name: string) => <button id={name} className="step_add" onClick={this.add}>+<span className="add_title">{name}</span></button>;
        //Piece together
        return <div id="step_enteror" onKeyDown={this.keyPress} style={{ display: this.props.show ? "block" : "none" }}>
            <div>{addbutton("add")}{inp("addnum1")}R{rowinp("add1")} + {inp("addnum2")}R{rowinp("add2")} ⇒ R{rowinp("addo")}</div>
            <div>{addbutton("set")}{inp("setnum1")}R{rowinp("set1")} ⇒ R{rowinp("seto")}</div>
            <div>{addbutton("row")}R{rowinp("row1")} ⇔ R{rowinp("row2")}</div>
            <div>{addbutton("col")}C{rowinp("col1")} ⇔ C{rowinp("col2")}</div>
        </div>
    }
}

export default { Step, StepDisplay, StepInput };
