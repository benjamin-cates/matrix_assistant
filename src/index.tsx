import React from "react";
import ReactDOM from "react-dom";
import { createRoot } from 'react-dom/client';
import { Ratio, RatioInput } from "./ratio";
import { Step, StepDisplay, StepInput } from "./step"
import { Matrix, MatrixDisplay } from "./matrix";
import ElementList from "./element_list";
import NewMatrix from "./new_matrix";

class App extends React.Component {
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
        // Either 0 for autofilled matrices, 1 for all errors shown, 2 for partial error shown, 3 for ignore errors
        difficulty: number;
    }
    constructor(props: any) {
        super(props);
        this.state = this.defaultState(4, 3, false);
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
            let close = <button className="step_remover" onClick={() => this.removeStep(matId, x)}>&times;</button>
            out.push(<div className="step_display" key={x.toString()}>
                <StepDisplay step={steps[x]} />
                {showX ? close : ""}
            </div >);
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
            inputMode={true}
            continue={this.continue}></MatrixDisplay>);
        //Push matrices to sections segment
        let sections = matrixEls.map((mat, i) => {
            let stepList = this.state.steps[i] ? <div className="step_list">{this.renderSteps(i)}</div> : null;
            return <div key={"sect" + i.toString()}>
                {mat}
                {stepList}
            </div>;
        });
        let nextMessage = this.state.mode == "matrix" ? "Fill in matrix" : "Row operations";
        //Render difficulty input
        const difficultyTypes = ["Autofill", "Show corrections", "Show errors", "Error count", "Ignore errors"];
        let diffInput = difficultyTypes.map((val, i) => {
            let className = "difficulty_button";
            if (i == this.state.difficulty) className += " selected_difficulty_button";
            return <button key={i.toString()} className={className} onClick={() => this.setState({ difficulty: i })}>{val}</button>
        })
        const errIO = { add: this.addError, clear: this.clearError };
        return <>
            <div id="left">
                <>{sections}</>
                <div id="sectionEnd">
                    <button onClick={this.back} id="back_button">
                        <svg fill="#000000" width="25" height="25" id="back_arrow_button" version="1.1" viewBox="-1 -3 9 6"><path strokeLinecap="round" stroke="white" d="M 0 0 L 3 -3 M 0 0 L 7 0 M 0 0 L 3 3 M 0 0 Z"></path></svg>
                    </button>
                    <span id="nextMessage">{nextMessage}</span>
                    <button onClick={this.continue} id="continueButton">Continue</button>
                </div>
                <div className="difficulty_input">Difficulty: {diffInput}</div>
            </div>
            <div id="right">
                <NewMatrix callback={this.createNew} errRef={errIO}></NewMatrix>
                <StepInput addStep={this.addStep} show={this.state.mode == "steps"} maxRow={this.state.height} maxCol={this.state.width} errRef={errIO} />
                <ElementList class="error_item" name="error" ref={this.state.errorRef} />
            </div>
        </>;
    }
    defaultState = (w: number, h: number, isFilled: boolean) => {
        let matrices: Matrix[] = [];
        let mode = "matrix";
        if (isFilled) {
            matrices.push(Matrix.random_integer_matrix(w, h));
            mode = "steps";
        }
        return {
            width: w,
            height: h,
            matrices,
            steps: [[]] as Step[][],
            inputRef: React.createRef<MatrixDisplay>(),
            errorRef: React.createRef<ElementList>(),
            mode,
            difficulty: 2,
        };
    }
    createNew = (w: number, h: number, isFilled: boolean) => {
        this.setState(this.defaultState(w, h, isFilled));
    }
    addStep = (step: Step) => {
        let newSteps = this.state.steps.slice();
        newSteps[this.state.steps.length - 1].push(step);
        this.setState({ steps: newSteps });
    }
    continue = () => {
        this.state.errorRef.current.clear();
        const matCount = this.state.matrices.length;
        //Autofill if difficulty zero
        if (this.state.matrices.length != 0 && this.state.difficulty == 0) {
            let steps = [...this.state.steps];
            let matrices = [...this.state.matrices];
            matrices.push(this.state.matrices[matCount - 1].performSteps(this.state.steps[matCount - 1]));
            if (this.state.mode == "steps") steps.push([]);
            this.setState({ matrices, mode: "steps", steps });
            return;
        }
        //Check matrix inputs
        if (this.state.mode == "matrix") {
            //Skip if first matrix or is on ignore errors
            if (this.state.matrices.length == 0 || this.state.difficulty == 4) {
                let matrices = [...this.state.matrices];
                matrices.push(this.state.inputRef.current.getMatrix());
                this.setState({ mode: "steps", matrices });
                return;
            }
            let mat = this.state.inputRef.current.getMatrix();
            let expected = this.state.matrices[matCount - 1].performSteps(this.state.steps[matCount - 1]);
            let diffs = Matrix.compare(mat, expected);
            //Continue if first matrix or difficulty is 4
            if (diffs.length == 0) {
                let matrices = [...this.state.matrices];
                mat.columnNames = expected.columnNames.slice();
                matrices.push(mat);
                this.setState({ mode: "steps", matrices });
                return;
            }
            //Add error for each element
            //Show whole error
            if (this.state.difficulty == 1) diffs.forEach(v =>
                this.state.errorRef.current.add(
                    <>a<span className="subscript">{Math.floor(v / mat.width + 1).toString() + (v % mat.width + 1).toString()}</span>
                        &nbsp;=&nbsp;{expected.values[v].text()}&nbsp;≠&nbsp;{mat.values[v].text()}</>)
            );
            //Show partial error
            if (this.state.difficulty == 2) diffs.forEach(v =>
                this.state.errorRef.current.add(
                    <>
                        a<span className="subscript">{Math.floor(v / mat.width + 1).toString() + (v % mat.width + 1).toString()}</span>
                        &nbsp;≠&nbsp;{mat.values[v].text()}
                    </>)
            );
            //Show error count
            if (this.state.difficulty == 3) {
                let text = (diffs.length == 1) ? "There is one error" : ("There are " + diffs.length + " errors");
                this.state.errorRef.current.add(<>{text}</>);
            }
        }
        else {
            let matrices = [...this.state.matrices];
            let steps = [...this.state.steps];
            let nextMode = "matrix";
            //Add empty steps list
            steps.push([]);
            //Autofill matrix
            if (this.state.difficulty == 0) {
                matrices.push(this.state.matrices[matCount - 1].performSteps(this.state.steps[matCount - 1]));
                nextMode = "steps";
            }
            this.setState({
                steps,
                matrices,
                mode: nextMode,
            });
        }
    }
    addError = (el: React.ReactElement) => this.state.errorRef.current.add(el);
    clearError = () => this.state.errorRef.current.clear();
    back = () => {
        let steps = this.state.steps.slice();
        if (this.state.mode == "matrix") {
            if (this.state.matrices.length == 0) return;
            steps.pop();
            this.setState({
                steps,
                mode: "steps"
            });
        }
        else {
            let matrices = this.state.matrices.slice();
            matrices.pop();
            steps[steps.length - 1] = [];
            this.setState({ mode: "matrix", steps, matrices });
        }

    }
}
let root = createRoot(document.getElementById("app"));
root.render(<App></App>);

