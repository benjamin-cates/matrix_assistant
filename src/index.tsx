import React from "react";
import ReactDOM from "react-dom";
import { createRoot } from 'react-dom/client';
import { Ratio, RatioInput } from "./ratio";
import { Step, StepDisplay, StepInput } from "./step"
import { Matrix, MatrixDisplay } from "./matrix";
import ElementList from "./element_list";
import NewPuzzle from "./info";

class Game extends React.Component {
    state: {
        //List of past matrix steps
        matrices: Matrix[];
        //Reference to current input matrix
        inputRef: React.RefObject<MatrixDisplay>;
        //List of step lists
        steps: Step[][];
        //Reference to error output
        errorRef: React.RefObject<ElementList>;
        //String that is either "matrix" or "steps"
        mode: string;
        //Width of the current matrix display
        width: number;
        //Height of the current matrix display
        height: number;
    }
    constructor(props: any) {
        super(props);
        this.state = this.defaultState(4, 3);
    }
    removeStep = (matrixId: number, stepId: number) => {
        let steps = [...this.state.steps];
        steps[matrixId].splice(stepId, 1);
        this.setState({ steps });

    }
    renderSteps = (matId: number) => {
        let steps = this.state.steps[matId];
        let out: JSX.Element[] = [];
        const showX = matId == this.state.matrices.length - 1;
        for (let x = 0; x < steps.length; x++) {
            console.log(steps[x]);
            let close = <button className="step_remover" onClick={() => this.removeStep(matId, x)}>&times;</button>
            out.push(<div className="step_display" key={x.toString()}>
                {StepDisplay(steps[x])}
                {showX ? close : ""}
            </div>);
        }
        return out;
    };
    render() {
        //Add filled matrices to list
        let matrixEls = this.state.matrices.map(mat =>
            <MatrixDisplay
                width={this.state.width}
                height={this.state.height}
                mat={mat}
                inputMode={false}></MatrixDisplay>
        );
        //Add input matrix if in mode
        if (this.state.mode == "matrix") matrixEls.push(<MatrixDisplay
            ref={this.state.inputRef}
            width={this.state.width}
            height={this.state.height}
            inputMode={true}></MatrixDisplay>);
        //Push matrices to sections segment
        let sections = matrixEls.map((mat, i) => {
            let stepList = this.state.steps[i] ? <div className="step_list">{this.renderSteps(i)}</div> : null;
            return <div key={"sect" + i.toString()}>
                {mat}
                {stepList}
            </div>;
        });
        let nextMessage = this.state.mode == "matrix" ? "Fill in matrix" : "Row operations";
        const errIO = { add: this.addError, clear: this.clearError };
        return <>
            <div id="left">
                <>{sections}</>
                <div id="sectionEnd">
                    <span id="nextMessage">{nextMessage}</span>
                    <button onClick={this.continue} id="continueButton">Continue</button>
                </div>
            </div>
            <div id="right">
                <NewPuzzle callback={this.createNew} errRef={errIO}></NewPuzzle>
                <StepInput addStep={this.addStep} show={this.state.mode == "steps"} maxRow={this.state.height} maxCol={this.state.width} errRef={errIO} />
                <ElementList class="error_item" name="error" ref={this.state.errorRef} />
            </div>
        </>;
    }
    defaultState = (w: number, h: number) => {
        return {
            width: w,
            height: h,
            matrices: [] as Matrix[],
            steps: [[]] as Step[][],
            inputRef: React.createRef<MatrixDisplay>(),
            errorRef: React.createRef<ElementList>(),
            mode: "matrix",
        };
    }
    createNew = (w: number, h: number) => {
        this.setState(this.defaultState(w, h));
    }
    addStep = (step: Step) => {
        let newSteps = this.state.steps.slice();
        newSteps[this.state.steps.length - 1].push(step);
        this.setState({ steps: newSteps });
    }
    continue = () => {
        this.state.errorRef.current.clear();
        if (this.state.mode == "matrix") {
            if (this.state.matrices.length == 0)
                return this.finishMatrix();
            const matCount = this.state.matrices.length;
            let mat = this.state.inputRef.current.getMatrix();
            let expected = this.state.matrices[matCount - 1].performSteps(this.state.steps[matCount - 1]);
            let diffs = Matrix.compare(mat, expected);
            if (diffs.length == 0)
                return this.finishMatrix();
            //Add error for each element
            diffs.forEach(v => {
                this.state.errorRef.current.add(
                    <>
                        a<span className="subscript">{Math.floor(v / mat.width + 1).toString() + (v % mat.width + 1).toString()}</span>
                        &nbsp;≠&nbsp;{mat.values[v].text()}
                    </>); console.log(v);
            }
            );
            //Display errors
            /*
                Difficulty modes:
                Ignore errors
                Inform of errors
                Locate errors
                Automatic mode
            */
        }
        else {
            let matrices = [...this.state.matrices];
            //Add empty steps list
            let steps = [...this.state.steps];
            steps.push([]);
            this.setState({
                steps,
                matrices,
                mode: "matrix",
            });
        }

    }
    addError = (el: React.ReactElement) => this.state.errorRef.current.add(el);
    clearError = () => this.state.errorRef.current.clear();
    finishMatrix = () => {
        let matrices = [...this.state.matrices];
        matrices.push(this.state.inputRef.current.getMatrix());
        console.log(matrices);
        this.setState({ mode: "steps", matrices });
    }
}
let root = createRoot(document.getElementById("game"));
root.render(<Game></Game>);

